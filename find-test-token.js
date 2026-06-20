#!/usr/bin/env node
// Найти токен с реальным deployer_profile в нашей БД, для тестирования API/UI.
// Использование: node find-test-token.js [archetype]
//
// Использует встроенный fetch вместо shell+curl -- execSync на Windows
// идёт через cmd.exe, не bash, и ломает кавычки в JSON-теле запроса.

require('dotenv').config({ quiet: true });
const { Pool } = require('pg');

const archetype = process.argv[2] || 'WALLET_FACTORY';
const API_URL = 'http://localhost:3001';
const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://nexus:nexus@localhost:5432/nexusveritas' });

async function rpc(method, params) {
  const res = await fetch(HELIUS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  return json.result;
}

async function main() {
  const { rows } = await pool.query(
    `SELECT address, archetype, confidence FROM creators
     WHERE archetype = $1 ORDER BY confidence DESC LIMIT 20`,
    [archetype]
  );

  if (rows.length === 0) {
    console.error(`Нет creators с архетипом ${archetype}`);
    process.exit(1);
  }

  console.error(`Найдено ${rows.length} кандидатов с архетипом ${archetype}. Перебираю...`);

  for (const row of rows) {
    try {
      const sigs = await rpc('getSignaturesForAddress', [row.address, { limit: 1000 }]);
      if (!sigs || sigs.length === 0) { console.error(`  ${row.address}: нет транзакций`); continue; }

      const oldestSig = sigs[sigs.length - 1].signature;
      const tx = await rpc('getTransaction', [oldestSig, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
      if (!tx) { console.error(`  ${row.address}: транзакция не найдена`); continue; }

      const mints = new Set();
      const txStr = JSON.stringify(tx);
      const mintMatches = txStr.matchAll(/"mint":"([1-9A-HJ-NP-Za-km-z]{32,44})"/g);
      for (const m of mintMatches) {
        if (m[1] !== 'So11111111111111111111111111111111111111112') mints.add(m[1]);
      }

      if (mints.size === 0) { console.error(`  ${row.address}: нет mint-адресов в genesis tx`); continue; }

      for (const mint of mints) {
        console.error(`  Проверяю mint ${mint}...`);
        try {
          const apiRes = await fetch(`${API_URL}/api/v2/scan/solana/${mint}`);
          const apiData = await apiRes.json();
          if (apiData.deployer_profile && apiData.deployer_profile.archetype) {
            console.log(JSON.stringify({ mint, creator: row.address, archetype: apiData.deployer_profile.archetype, confidence: apiData.deployer_profile.confidence, score: apiData.score }, null, 2));
            await pool.end();
            return;
          }
        } catch (e) { console.error(`    API ошибка: ${e.message}`); }
      }
    } catch (e) {
      console.error(`  ${row.address}: ошибка (${e.message}), пропускаю`);
      continue;
    }
  }

  console.error('Не найдено совпадений среди кандидатов.');
  await pool.end();
  process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });

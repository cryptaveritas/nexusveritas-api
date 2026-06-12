const fetch = require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();
const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const agent = new HttpsProxyAgent(PROXY);
const HELIUS_KEY = process.env.HELIUS_API_KEY;
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;
const MIN_LIQ = 5000;
const MAX_LIQ = 1000000;
const seen = new Set();

function isSolanaAddress(addr) {
  return addr &&
    addr.length >= 32 &&
    addr.length <= 44 &&
    !addr.startsWith('0x') &&
    !addr.endsWith('pump') &&
    /^[1-9A-HJ-NP-Za-km-z]+$/.test(addr);
}

async function rpc(method, params) {
  try {
    const res = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      agent,
    });
    const data = await res.json();
    return data.result;
  } catch { return null; }
}

async function getCreator(mintAddress) {
  try {
    let lastSignature;
    let oldestSig = null;
    for (let i = 0; i < 3; i++) {
      const params = { limit: 1000 };
      if (lastSignature) params.before = lastSignature;
      const sigs = await rpc('getSignaturesForAddress', [mintAddress, params]);
      if (!sigs || sigs.length === 0) break;
      oldestSig = sigs[sigs.length - 1].signature;
      if (sigs.length < 1000) break;
      lastSignature = oldestSig;
    }
    if (!oldestSig) return { address: null, totalTokens: 0 };
    const tx = await rpc('getTransaction', [oldestSig, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
    if (!tx?.transaction?.message?.accountKeys) return { address: null, totalTokens: 0 };
    const firstKey = tx.transaction.message.accountKeys[0];
    const creatorAddress = typeof firstKey === 'string' ? firstKey : firstKey?.pubkey;
    if (!creatorAddress) return { address: null, totalTokens: 0 };
    const creatorSigs = await rpc('getSignaturesForAddress', [creatorAddress, { limit: 1000 }]);
    const totalTokens = creatorSigs ? Math.floor(creatorSigs.length / 4) : 0;
    return { address: creatorAddress, totalTokens };
  } catch { return { address: null, totalTokens: 0 }; }
}

async function getHeliusTokens(programAddress, label) {
  try {
    const cursorFile = `./cursors/${label.replace(/\s/g,'_')}.txt`;
    require('fs').mkdirSync('./cursors', {recursive:true});
    let beforeParam = '';
    if (require('fs').existsSync(cursorFile)) {
      const saved = require('fs').readFileSync(cursorFile,'utf8').trim();
      if (saved) beforeParam = `&before=${saved}`;
    }
    const res = await fetch(
      `https://api.helius.xyz/v0/addresses/${programAddress}/transactions?api-key=${HELIUS_KEY}&limit=100${beforeParam}`,
      { agent }
    );
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    if (data.length > 0) {
      require('fs').writeFileSync(cursorFile, data[data.length-1].signature || '');
    }
    const mints = new Set();
    for (const tx of data) {
      for (const transfer of tx.tokenTransfers || []) {
        if (transfer.mint && isSolanaAddress(transfer.mint)) {
          mints.add(transfer.mint);
        }
      }
    }
    console.error(`${label}: found ${mints.size} mints`);
    return [...mints];
  } catch (e) {
    console.error(`${label} error:`, e.message);
    return [];
  }
}

async function checkLiquidity(tokenAddress) {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
      { agent }
    );
    const data = await res.json();
    if (!data.pairs || data.pairs.length === 0) return 0;
    const pairs = data.pairs.filter(p => p.chainId === 'solana');
    if (pairs.length === 0) return 0;
    const best = pairs.sort((a, b) =>
      (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
    )[0];
    return Number(best.liquidity?.usd ?? 0);
  } catch { return 0; }
}

async function findTokens() {
  const [raydium, meteora, pumpswap] = await Promise.all([
    getHeliusTokens('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', 'Raydium'),
    getHeliusTokens('LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo', 'Meteora'),
    getHeliusTokens('pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA', 'PumpSwap'),
  ]);
  const all = [...new Set([...raydium, ...meteora, ...pumpswap])];
  console.error(`Total unique candidates: ${all.length}`);
  for (const addr of all) {
    if (seen.has(addr)) continue;
    seen.add(addr);
    const liq = await checkLiquidity(addr);
    if (liq >= MIN_LIQ && liq <= MAX_LIQ) {
      console.log(`${addr} liq:${Math.round(liq)}`);
    }
  }
}

findTokens().catch(e => console.error(e.message));

// Export existing behavior JSONB as classify-input JSONL — for backfilling
// matched_signals/baseline_risk via operator_classify.js | db_insert.js,
// with zero RPC calls.
const { Client } = require('pg');
require('dotenv').config();

(async () => {
  const c = new Client({connectionString: process.env.DATABASE_URL});
  await c.connect();
  const {rows} = await c.query("SELECT address, behavior FROM creators");
  await c.end();

  for (const r of rows) {
    console.log(JSON.stringify({
      mint: null,
      creator: r.address,
      liq_usd: 0,
      behavior_profile: r.behavior,
    }));
  }
})().catch(e => { console.error(e.message); process.exit(1); });

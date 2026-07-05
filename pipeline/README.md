# NexusVeritas Pipeline — Canonical Procedure

## Step 1: Download from Dune
python pipeline/download_dune.py <execution_id> <output_file> <total_rows>

Example:
  python pipeline/download_dune.py 01KW8QH0DJAGCYD27BHK0HHXPC data/raw/pump_2025_02.csv 750000

## Step 2: Backfill into DB
python pipeline/backfill.py <csv_file>

Example:
  python pipeline/backfill.py data/raw/pump_2025_02.csv

## Step 3: Enrich operators
docker exec nexusveritas-worker python -u scripts/pipeline/enrich_operators.py --limit 5000 --provider alchemy

## Step 4: Reclassify all
docker exec nexusveritas-worker python -u scripts/pipeline/reclassify_all.py

## Step 5: Rebuild fingerprints
docker exec nexusveritas-worker node scripts/pipeline/build_fingerprints.js

## Notes
- CSV files always go in data/raw/
- Never run backfill_insert.js -- use pipeline/backfill.py instead (TD-042)
- All steps are idempotent -- safe to re-run

## Monthly Dune Query Process (UPDATED 2026-07-03)

### IMPORTANT: Dune API limitation discovered 2026-07-03
Creating a NEW query via API (POST /v1/query) returns HTTP 402 Payment
Required on our current Dune plan -- this endpoint requires a paid tier.
A NEW query for each month MUST be created manually via the Dune web UI.
Everything else (execute, check status, download results) works via API.

### Correct process for each new month
1. MANUAL (dune.com web UI): create a new query, one per month
   SQL: SELECT call_tx_signer as deployer, COUNT(*) as tokens_created,
   MIN(call_block_time) as first_seen, MAX(call_block_time) as last_seen
   FROM pumpdotfun_solana.pump_call_create
   WHERE call_block_time >= TIMESTAMP YYYY-MM-01
   AND call_block_time < TIMESTAMP YYYY-(MM+1)-01
   GROUP BY call_tx_signer ORDER BY tokens_created DESC
   Name: NexusVeritas - pump.fun <Month> <Year>, Privacy: Private
   Save + Run, note query_id from URL (dune.com/queries/query_id)
2. API: get execution_id from the query results endpoint
3. API: python pipeline/download_dune.py <execution_id> data/raw/pump_YYYY_MM.csv <row_count>
4. API: python pipeline/backfill.py data/raw/pump_YYYY_MM.csv

### Deprecated approach (do NOT use)
Earlier process (2026-07-02) reused a single query_id (7837229) via PATCH
of query_sql before each execute. Abandoned 2026-07-03 after persistent
timeouts on large-batch downloads for that query_id -- switching to a fresh
query per month resolved the issue. Root cause not fully confirmed.

### download_dune.py limit setting
Tested 2026-07-02: limit=1000 confirmed stable for query_id 7837229 (Jan/Feb).
Tested 2026-07-03: limit=1000 and even 500/200 timed out on March 2025 data
(both the reused query and a fresh one) -- root cause unclear, possibly
Dune-side instability that day. limit=100 worked. Currently set conservatively
to limit=100 in download_dune.py. Re-test higher limits on future months once
Dune API is confirmed stable -- do not assume any fixed value is always safe.

### History
- 2026-07-02: PATCH-based single query_id approach used for Jan/Feb 2025
- 2026-07-03: switched to per-month fresh query (manual creation) after
  PATCH-reuse query started timing out consistently on large batches

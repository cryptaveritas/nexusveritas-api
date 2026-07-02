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


## Monthly Dune Query Process (IMPORTANT)

We use a SINGLE Dune query_id (7837229) for all monthly deployer backfills.
Each month, the SQL inside that same query is OVERWRITTEN via PATCH before
executing -- we do NOT create a new query_id per month.

### Why
- Saves Dune query quota/credits (one saved query, reused)
- Simple to remember: always query_id=7837229

### Consequence
- The SQL text for a given query_id changes over time -- if you need to see
  what SQL was used for a PAST month, check pipeline download logs or the CSV
  filename/date, NOT the live Dune query (it now shows whatever month was
  queried most recently)
- Already-downloaded CSVs (data/raw/pump_YYYY_MM*.csv) are the permanent
  record -- the Dune query itself is just a reusable execution mechanism

### Process for each new month
1. PATCH query_sql on query_id=7837229 with new date range:
   WHERE call_block_time >= TIMESTAMP 'YYYY-MM-01' AND call_block_time < TIMESTAMP 'YYYY-MM+1-01'
2. Execute the query, get execution_id
3. Poll status until QUERY_STATE_COMPLETED
4. python pipeline/download_dune.py <execution_id> data/raw/pump_YYYY_MM.csv <row_count>
5. python pipeline/backfill.py data/raw/pump_YYYY_MM.csv

### History
- 2026-07-02: query_sql updated from January 2025 range to February 2025 range

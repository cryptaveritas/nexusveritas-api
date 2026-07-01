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
docker exec nexusveritas-worker python -u scripts/enrich_operators.py --limit 5000 --provider alchemy

## Step 4: Reclassify all
docker exec nexusveritas-worker python -u scripts/reclassify_all.py

## Step 5: Rebuild fingerprints
docker exec nexusveritas-worker node scripts/build_fingerprints.js

## Notes
- CSV files always go in data/raw/
- Never run backfill_insert.js -- use pipeline/backfill.py instead (TD-042)
- All steps are idempotent -- safe to re-run

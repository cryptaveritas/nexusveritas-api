#!/bin/bash
set -e
DATE=$(date +%Y-%m-%d)
SNAP="./data/snapshots/$DATE"
mkdir -p "$SNAP"

echo "=== NexusVeritas Pipeline $DATE ==="

echo "[1/4] Collecting tokens..."
node find_tokens.js 2>"$SNAP/stage1.log" > "$SNAP/tokens.txt"
TOKEN_COUNT=$(wc -l < "$SNAP/tokens.txt")
echo "  Tokens: $TOKEN_COUNT"

echo "[2/4] Enriching creators..."
node enrich_creators.js < "$SNAP/tokens.txt" 2>"$SNAP/stage2.log" > "$SNAP/creators.txt"
CREATOR_COUNT=$(wc -l < "$SNAP/creators.txt")
echo "  Creators: $CREATOR_COUNT"

echo "[3/4] Building hub map..."
awk '{print $3}' "$SNAP/creators.txt" | sed 's/creator://' | sort -u > "$SNAP/creator_list.txt"
node find_hubs.js $(cat "$SNAP/creator_list.txt" | tr '\n' ' ') 2>"$SNAP/stage3.log"
cp ./data/hubs_$DATE.json "$SNAP/hubs.json" 2>/dev/null || true
echo "  Hubs saved"

echo "[4/4] Building L2 graph..."
node build_graph.js "$SNAP/hubs.json" 2>"$SNAP/stage4.log"
cp ./data/graph_$DATE.json "$SNAP/graph.json" 2>/dev/null || true

echo ""
echo "=== Metrics ==="
node -e "
const h = require('./$SNAP/hubs.json');
const g = require('./$SNAP/graph.json');
console.log(JSON.stringify({
  date: '$DATE',
  tokens: $(wc -l < "$SNAP/tokens.txt"),
  creators: $(wc -l < "$SNAP/creators.txt"),
  funders: h.hubs_found,
  clusters_l1: h.cluster_candidates,
  clusters_l2: g.clusters_found,
  largest: g.clusters.length ? Math.max(...g.clusters.map(c=>c.total_creators)) : 0,
}, null, 2));
"

echo "=== Snapshot: $SNAP ==="

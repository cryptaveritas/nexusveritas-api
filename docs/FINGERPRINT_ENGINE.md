# Fingerprint Engine — Research Direction

## Discovery: 2026-06-10

After 3 pipeline runs (85 unique creators analyzed):
- funding_overlap: 0 clusters
- behavioral_analysis: CLUSTER_001 (confirmed)

## Key Insight

Operators have adapted. Direct funding overlap is not a reliable
detection mechanism. Operators use unique funders per creator.

CLUSTER_001 was found through behavioral signals, not graph connections:
- transfer_count: 53 (anomalously high)
- avg_transfer: 0.002 SOL (account initialization amount)
- mutual_funding: true (recycling loop)
- wallet_age_days: 6 (fresh infrastructure)
- funding_concentration: 1.0 (single source)

## Architecture: Behavior > Connections

Old approach: Creator -> Funder -> Overlap -> Cluster
New approach: Creator -> Behavior -> Fingerprint -> Cluster

## Behavior Profile v0

  creator: "..."
  behavior_profile:
    transfer_count: 53
    avg_transfer_sol: 0.002
    mutual_funding: true
    wallet_age_days: 6
    funding_concentration: 1.0
    transfer_cadence: "automated"
  signals:
    feeder_pattern: 0.92
    recycling_loop: 1.00
    wallet_factory: 0.87
    automated_cadence: 0.75
  fingerprint_score: 0.89

## Clustering via Fingerprint Similarity

Instead of: Creator A + Creator B -> same funder -> cluster
New model:  cosine_similarity(fingerprint_A, fingerprint_B) > 0.85 -> cluster candidate

## Competitive Position

Arkham:       Wallet -> Entity (graph connections)
Bubblemaps:   Wallet -> Wallet (token distribution)
NexusVeritas: Creator -> Behavior -> Operator (behavioral fingerprint)

## Next Steps

1. Add behavior_profile to enrich_creators.js
2. Implement signal scoring (feeder_pattern, recycling_loop, wallet_factory, automated_cadence)
3. Compute fingerprint_score per creator
4. Cluster by fingerprint similarity
5. Validate against CLUSTER_001 as ground truth
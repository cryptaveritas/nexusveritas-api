# Research Finding #001 — Funding Overlap Insufficient for Operator Attribution

**Date:** 2026-06-10
**Pipeline runs:** 3
**Creators analyzed:** 85

## Experiment

Three automated pipeline runs using find_tokens -> enrich_creators -> find_hubs -> build_graph.

## Results

| Run | Creators | L1 Clusters | L2 Clusters |
|-----|----------|-------------|-------------|
| 1   | 30       | 0           | 0           |
| 2   | 39       | 0           | 0           |
| 3   | 16       | 0           | 0           |
| Total | 85     | 0           | 0           |

## Conclusion

Operators have adapted. Each creator wallet uses a unique funding source.
Direct funding overlap (shared funder across multiple creators) is not a
reliable signal for operator attribution at current market conditions.

## Implication

Detection methodology shifts from:
  Creator -> Funder -> Overlap -> Operator
To:
  Creator -> Behavior -> Fingerprint -> Operator

## Ground Truth

CLUSTER_001 was confirmed via behavioral analysis on the same day.
Signals used: feeder_pattern, recycling_loop, wallet_factory, automated_cadence.
See docs/clusters/CLUSTER_001.md
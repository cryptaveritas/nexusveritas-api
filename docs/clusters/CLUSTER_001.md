# CLUSTER_001 — Automated Wallet Factory

**Status:** Confirmed
**Confidence:** 0.85
**Discovered:** 2026-06-10
**Method:** Behavioral analysis (not funding overlap)

## Infrastructure

Feeder loop (SOL recycling):
- 3DDmb2kPULsqsKPAaDF8BMfJJfVoye3QhaKfHzsar8C4
- ML1xEaENmi4bZDznjSng6R4rRJJwJJuhuH21zCmqc2m

Active since: 2026-06-04
Wallet creation rate: 3-4 new creator wallets per day
Init amount: 0.002 SOL per wallet (account initialization)

## Confirmed Creator Wallets

| Address | Token | First Seen |
|---------|-------|------------|
| CTVF8GZH... | D9GWCGn3... | 2026-06-10 |
| Ctj86t1M... | 7zqRRPmb... | 2026-06-10 |
| ENFSrQp5... | 4jBNbTaG... | 2026-06-10 |
| 2TX53ajR... | 72BW1upM... | 2026-06-10 |
| hQz4h2VJ... | 5rkRr4Fs... | 2026-06-09 |
| 6eSP86sK... | 5XwUYDrG... | 2026-06-09 |
| 89Yvf4k1... | 4x8Ra18i... | 2026-06-09 |
| EknteZnW... | GCCh6rzt... | 2026-06-08 |

## Behavioral Signals

| Signal | Value | Score |
|--------|-------|-------|
| feeder_pattern | transfer_count: 53 | 0.92 |
| recycling_loop | mutual_funding: true | 1.00 |
| wallet_factory | avg_transfer: 0.002 SOL | 0.87 |
| automated_cadence | ~17 transfers/day | 0.75 |
| funding_concentration | 1.0 (single source) | 1.00 |

## Discovery Note

Not found via funding overlap (L1/L2 graph analysis).
Found via manual behavioral chain analysis:
token -> creator -> funding_graph -> outgoing -> wallet_factory pattern.

This case motivated the shift to Behavioral Fingerprint Engine.
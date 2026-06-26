# NexusVeritas — Roadmap

**Version:** v0.9.2 | **Updated:** 2026-06-26

---

## Architecture Layers

```
Token Layer          analyze a single token                done
Creator Layer        analyze who deployed it               done
Funding Layer        analyze who funded the creator        done
Behavior Layer       behavioral fingerprinting             done
Classifier Layer     10 operator archetypes                done
Validation Layer     ground truth testing                  done
Similarity Layer     pgvector cross-operator search        done
API Layer            GET /api/v2/scan/solana/:mint         done
Data Quality Layer   signal_coverage + source tracking     done
Network Layer        coordinated wallet detection          Q3 2026
Operator Resolution  multi-wallet single identity          Q3 2026
Profile Layer        operator dossiers + timeline          Q4 2026
Watchlist Layer      predictive alerts                     Q4 2026
```

---

## Completed

- v0.9.2  10 archetypes, 347k+ operators, signal_coverage, data_source_quality
- v0.9.1  8 archetypes, parallel pipeline, API live
- v0.9.0  EXCHANGE_FUNDED_DEPLOYER archetype (FINDING_005)
- v0.8.5  pgvector + vector_v2 behavioral (25 dimensions)
- v0.8.2  VALIDATION_001: 8/8 WALLET_FACTORY confirmed
- v0.8.0  operator_classify.js automatic archetype classification
- v0.7.0  behavior_profile pipeline
- v0.6.0  find_tokens + enrich_creators
- v0.1.0  Risk Engine MVP

---

## Q3 2026

- [ ] Network Intelligence -- coordinated wallet cluster detection
- [ ] Operator Resolution -- link ephemeral wallets to single identity
- [ ] NETWORK FINDINGS block in scanner
- [ ] GET /api/v2/operator/:address endpoint
- [ ] GET /api/v2/cluster/:address endpoint
- [ ] Re-enrich top operators via RPC for ground truth

---

## Q4 2026

- [ ] Operator Profile UI -- full behavioral dossier
- [ ] Archetype timeline (evolution over time)
- [ ] Predictive Watchlists -- alert when operator launches new token
- [ ] B2B API -- enterprise tier with SLA

---

## Research Findings

| ID | Title | Status |
|---|---|---|
| FINDING_001 | Funding overlap 0 clusters | Closed |
| FINDING_002 | Split init pattern | Hypothesis |
| FINDING_003 | operator_class != token_risk | Confirmed |
| FINDING_004 | Archetypes stable across token risk | Confirmed |
| FINDING_005 | INFRASTRUCTURE_HUB false positives | Fixed |

---

*All archetypes validated against ground truth. All findings in docs/research/*

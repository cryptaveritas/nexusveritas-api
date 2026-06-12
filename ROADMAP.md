# NexusVeritas — Roadmap

**Version:** v0.9.1 | **Updated:** 2026-06-12

---

## Architecture Layers

```
Token Layer          analyze a single token                ✅ done
Creator Layer        analyze who deployed it               ✅ done
Funding Layer        analyze who funded the creator        ✅ done
Behavior Layer       behavioral fingerprinting             ✅ done
Classifier Layer     operator archetype classification     ✅ done
Validation Layer     ground truth testing                  ✅ done (VALIDATION_001)
Similarity Layer     pgvector cross-operator search        ✅ done
API Layer            GET /api/v2/scan/solana/:mint         ✅ done
Review Layer         Active Learning labeling UI           🔄 Q3 2026
ML Layer             XGBoost behavioral classifier         🔄 Q3 2026
Graph Layer          Memgraph multi-hop attribution        📋 Q4 2026
GNN Layer            structural embeddings                 📋 Q4 2026
```

---

## Completed

- v0.9.1  8 archetypes, 565 operators, API live, parallel pipeline
- v0.9.0  EXCHANGE_FUNDED_DEPLOYER archetype (FINDING_005)
- v0.8.5  pgvector + vector_v2 behavioral (25 dimensions)
- v0.8.2  VALIDATION_001: 8/8 WALLET_FACTORY confirmed
- v0.8.0  operator_classify.js — automatic archetype classification
- v0.7.0  behavior_profile pipeline
- v0.6.0  find_tokens + enrich_creators
- v0.1.0  Risk Engine MVP

---

## Q3 2026

- [ ] 1000+ operator profiles
- [ ] Express + HTMX Review UI (Active Learning)
- [ ] Temporal vectors: vector_30d, vector_90d, vector_all
- [ ] Delta-features for XGBoost
- [ ] XGBoost baseline (500+ labels needed)
- [ ] Telegram alerts for known operator detection
- [ ] GET /risk/creator/:address endpoint

---

## Q4 2026

- [ ] Memgraph migration (trigger: 1000-1500 operators)
- [ ] GNN structural embeddings (GraphSAGE → vector_v3)
- [ ] DEX Flow Layer (V3 vector):
      liquidity_reversion_index
      net_pool_exposure_slope
      volume_to_drain_zscore
      flow_asymmetry_score
- [ ] XGBoost AFT (time-to-scam prediction)
- [ ] B2B API (Phantom, Jupiter integration targets)
- [ ] Network graph multi-operator clustering

---

## Research Findings

| ID | Title | Status |
|----|-------|--------|
| FINDING_001 | Funding overlap → 0 clusters | Closed |
| FINDING_002 | Split init pattern | Hypothesis |
| FINDING_003 | operator_class != token_risk | Confirmed |
| FINDING_004 | Archetypes stable across token risk | Confirmed |
| FINDING_005 | INFRASTRUCTURE_HUB false positives | Fixed |

---

## Known Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Graph flood attack | HIGH | Max Degree Threshold (TODO) |
| Similarity collapse | HIGH | Temporal vectors (Q3) |
| Silent degradation | HIGH | graph_truncated metric (TODO) |
| Cold start bias | MEDIUM | Diversity Sampling |
| Warm-up wallets | MEDIUM | Future: behavioral time series |

---

*All archetypes validated against ground truth. All findings documented in docs/research/*

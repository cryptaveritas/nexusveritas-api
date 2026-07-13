# NexusVeritas — Project Plan
**Last updated:** 2026-06-20

---

## Status Dashboard

```
Creators in DB:     1027+
Archetypes:         8
Pipeline:           working (parallel, CONCURRENCY=15, 2.5x speedup)
API:                live on :3001
Organizations API:  partially live (DeployerProfileService + RiskEngineService)
Review UI:          not built
XGBoost:            not started
Memgraph:           not started
Signal layer:       VALIDATED (FINDING_006, 90.3% within-archetype @ n=1012)
```

---

## Priority 1 — Do Now

### 1.1 Max Degree Threshold — Done (3d014ed)
### 1.2 Scale to 1000+ creators — Done (565 -> 1027+)
### 1.3 candidate_discovery on new data — TODO, re-evaluate post-validation
### 1.4 split_init_pattern calibration fix — Done (2bcb71d, 2026-06-20)
Window scoped to pre-deploy period. 0 false positives on 51-profile test.
Follow-up: REENRICH existing 1027 records, extended test (100-200 records).

---

## Priority 2 — This Week

### 2.1 Express + HTMX Review UI — TODO
### 2.2 Temporal vectors — Deprioritized (FINDING_006: wrong fix for similarity)
### 2.3 Cache top-3 funders — Partially done (top_funder capture implemented)
### 2.4 Organizations API minimal scan endpoint — IN PROGRESS
DeployerProfileService + RiskEngineService extended, end-to-end tested
(ROTATION_OPERATOR: score 50->90, isHardRefuse=true). Phase B unblocked.

---

## Priority 3 — After 500 labels
(unchanged -- BLOCKED on Review UI + labels)

## Priority 4 — Q4 2026
(unchanged, guardrail: no causal graph/adversarial sim until within-archetype
match drops below ~80%, currently 90.3%)

---

## Known Risks

| Risk | Severity | Status |
|------|----------|--------|
| Graph flood attack | HIGH | Done |
| Similarity collapse P50=1.0 | HIGH | Resolved (FINDING_006) -- wrong metric |
| split_init_pattern false positives | MEDIUM | Fixed (2026-06-20) |
| Silent degradation (multi-hop) | HIGH | TODO |
| Cold start bias | MEDIUM | IN PROGRESS |
| Warm-up wallets | MEDIUM | PLANNED |
| pgvector RAM at 100k+ | LOW | PLANNED |
| Proxy provider instability | LOW | Recurring, happened 2026-06-20 |

---

## Research Findings

| ID | Title | Status |
|----|-------|--------|
| FINDING_001 | Funding overlap -> 0 clusters | Closed |
| FINDING_002 | Split init pattern | Implemented + calibrated |
| FINDING_003 | operator_class != token_risk | Confirmed |
| FINDING_004 | Archetypes stable across token risk | Confirmed |
| FINDING_005 | INFRASTRUCTURE_HUB false positives | Fixed |
| FINDING_006 | P50 collapse -- wrong metric, signal layer validated | Resolved |

---

## Milestones

| ID | Title | Status |
|----|-------|--------|
| MILESTONE_001 | First automatic archetype classification | Done |
| MILESTONE_002 | First unexpected operator connection | Re-evaluate post-FINDING_006 |
| MILESTONE_003 | First confirmed attribution by similarity | TODO |
| MILESTONE_004 | Organizations API first B2B client | TODO -- next real goal |

---

## Technical Debt

```
enrich_parallel.js       timeout 15s may miss slow tokens
ROTATION_OPERATOR        needs better differentiation from INDUSTRIAL
INFRASTRUCTURE_HUB       EXCHANGE_FUNDED_DEPLOYER is a tag, not sibling (FINDING_006)
candidate_discovery      INDUSTRIAL_DEPLOYER floods top-100
RiskEngineV2Service       dead code, never wired up
risk-engine.spec.ts      4/8 tests failing, pre-existing
funding-profiler.service.ts   BRIDGE_ADDRESSES placeholder, detectBurnerWallets TODO
docs/plan sync           end_of_day.sh not run 2026-06-16 to 2026-06-19
```

## Publications
- Medium: https://medium.com/@cramerpaul706/the-code-is-perfect-the-token-still-rugs-building-nexusveritas-5e9a09149f08
- dev.to: https://dev.to/runecipher137/building-a-solana-risk-engine-from-mock-data-to-mainnet-3ao5
- CoderLegion: Why Token Analysis Isn't Enough Anymore
- GitHub: https://github.com/cryptaveritas

## See also
- THREE_TIER_CONCEPT.md -- Research -> Organizations -> Consumer phased strategy
- ROADMAP_2026_H2.md -- collapse guardrail, layer taxonomy
- FINDING_006.md -- full P50 diagnostic history

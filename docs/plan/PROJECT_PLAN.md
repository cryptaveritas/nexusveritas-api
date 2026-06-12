# NexusVeritas — Project Plan
**Last updated:** 2026-06-12

---

## Status Dashboard

```
Creators in DB:     565
Archetypes:         8
Pipeline:           working (parallel, 5x speed)
API:                live on :3001
Review UI:          not built
XGBoost:            not started
Memgraph:           not started
```

---

## Priority 1 — Do Now (hours)

### 1.1 Max Degree Threshold in build_graph.js
**Why:** Protects against graph flood attack (micro-tx spam to blind scoring)
**How:** Skip nodes with >50 connections that are not in knownServices.json
**Time:** 30 minutes
**Status:** TODO

### 1.2 Scale to 1000+ creators
**Why:** Minimum for useful similarity search and candidate discovery
**How:** Run enrich_parallel.js on new token batches
**Time:** 1-2 hours
**Status:** IN PROGRESS (565 done)

### 1.3 candidate_discovery on new data
**Why:** Find first unexpected cross-archetype match (MILESTONE_003)
**How:** node candidate_discovery.js after 1000+ creators
**Time:** 30 minutes
**Status:** TODO

---

## Priority 2 — This Week (days)

### 2.1 Express + HTMX Review UI
**Why:** Without labeling → no XGBoost → no ML
**Features required:**
  - Side-by-side operator comparison
  - Keyboard shortcuts (1=Confirm, 2=Reject, 3=Skip)
  - hx-disabled-elt (prevent race conditions)
  - REQUIRES_DEEP_INVESTIGATION status
  - Pre-loaded top-3 funders from candidate_matches.metadata
**Time:** 2-3 days
**Status:** TODO

### 2.2 Three temporal vectors (30d / 90d / all_time)
**Why:** Required for XGBoost delta-features
**How:** Add columns to schema, update db_insert.js
**Time:** 1 day
**Status:** TODO

### 2.3 Cache top-3 funders in candidate_matches.metadata
**Why:** Reduces manual investigation from 40 min to 2 sec
**Time:** 2 hours
**Status:** TODO

---

## Priority 3 — After 500 labels (weeks)

### 3.1 XGBoost baseline
**Requires:** 500+ labeled operators + temporal vectors
**Features:** [30d | 90d | all_time | delta]
**Key delta:** ratio_created_tokens = tokens_30d / tokens_all
**Status:** BLOCKED (needs Review UI + labels)

### 3.2 graph_truncated metric in daily_metrics.js
**Why:** Early warning for graph flood attacks
**Status:** TODO

### 3.3 knownServices filter on first hop in build_graph.js
**Status:** TODO

---

## Priority 4 — Q4 2026 (months)

### 4.1 Memgraph migration
**Trigger:** graph_truncated rate rising OR 1000-1500 operators
**Why:** Recursive SQL breaks at scale
**Status:** PLANNED

### 4.2 GNN structural embeddings (GraphSAGE)
**Requires:** Memgraph running
**Output:** vector_v3 in pgvector
**Status:** PLANNED

### 4.3 XGBoost AFT (time-to-scam)
**Requires:** XGBoost baseline working
**Status:** PLANNED

### 4.4 Feature Store / Redis cache
**Requires:** Production load >100 req/sec
**Status:** PREMATURE (no production traffic yet)

### 4.5 SMOTE for class balancing
**Requires:** <2000 labels
**Status:** PLANNED

---

## Known Risks

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| Graph flood attack | HIGH | Max Degree Threshold | TODO |
| Similarity collapse P50=1.0 | HIGH | Temporal vectors | TODO |
| Silent degradation (multi-hop) | HIGH | graph_truncated metric | TODO |
| Cold start bias (60 labels) | MEDIUM | Diversity Sampling | IN PROGRESS |
| Warm-up wallets (30d blind) | MEDIUM | Future: behavioral time series | PLANNED |
| pgvector RAM at 100k+ | LOW | IVFFlat for all_time | PLANNED |

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

## Milestones

| ID | Title | Status |
|----|-------|--------|
| MILESTONE_001 | First automatic archetype classification | ✅ Done |
| MILESTONE_002 | First unexpected operator connection via similarity | IN PROGRESS |
| MILESTONE_003 | First confirmed attribution by similarity search | TODO |

---

## Technical Debt

```
enrich_parallel.js    timeout 15s may miss slow tokens
ROTATION_OPERATOR     needs better differentiation from INDUSTRIAL
INFRASTRUCTURE_HUB    still may have false positives
vector_v2             zero-zero agreement partially fixed
candidate_discovery   INDUSTRIAL_DEPLOYER floods top-100
```
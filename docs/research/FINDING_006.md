# Research Finding #006 — Operator Cluster Detection via Funding Analysis

**Date:** 2026-06-26
**Status:** Heuristic Validated (Partial)
**Dataset:** 347,738 operators

---

## Discovery

Funding-pattern analysis across 347,738 operator profiles revealed 15 potential
operator clusters using a single heuristic:

  same top_funder + wallet_count >= 5

Total operators tagged: 98 across 15 clusters.

---

## Cluster Table

| Cluster | Wallets | Unique Days | Confidence | Funder |
|---|---|---|---|---|
| CL-001 | 11 | 11 | MEDIUM | 5tzFkiKscXHK... |
| CL-002 | 8 | 3 | MEDIUM | 3DDmb2kPULsq... |
| CL-003 ✓ | 8 | 1 | HIGH | 7EYgVUTxtRkV... |
| CL-004 | 8 | 2 | MEDIUM | 2D6kUzYWxCav... |
| CL-005 | 7 | 1 | HIGH | AMqz7dDJP1Mf... |
| CL-006 | 7 | 2 | MEDIUM | D5K7hgEwABBn... |
| CL-007 | 7 | 7 | MEDIUM | FncazAs6omJJ... |
| CL-008 | 6 | 1 | HIGH | 8hbxuN8jCf3T... |
| CL-009 | 6 | 3 | MEDIUM | 33ccadALKuT8... |
| CL-010 | 5 | 5 | MEDIUM | HBQ2TC2gmX9q... |
| CL-011 | 5 | 1 | HIGH | 9rGy4hrfBeUd... |
| CL-012 | 5 | 5 | MEDIUM | ASTyfSima4LL... |
| CL-013 | 5 | 2 | MEDIUM | D7Zkm38kHZ75... |
| CL-014 | 5 | 1 | HIGH | FJSPG1EFJvfr... |
| CL-015 | 5 | 1 | HIGH | 269s2VEMzjbW... |

CL-003 ✓ = ground truth validated. HIGH rows = same-day funding pattern.

---

## Heuristic Confidence Classification

### HIGH Confidence (unique_days = 1) — 6 clusters

All wallets funded by the same source within a single day.
This pattern is highly unusual for organic activity and is a strong heuristic
indicator of coordinated wallet creation.

Note: HIGH heuristic confidence does not constitute proof of malicious intent.
It means the pattern matches known coordinated creation signatures.

Clusters: CL-003, CL-005, CL-008, CL-011, CL-014, CL-015

### MEDIUM Confidence (unique_days >= 2) — 9 clusters

Wallets funded over multiple days by the same source.
May indicate legitimate team infrastructure, coordinated market making, or
slower organized operation. Requires additional signals for attribution.

---

## Validation

| Metric | Value | Notes |
|---|---|---|
| Validated cluster | CL-003 | Matches CLUSTER_001 (docs/clusters/) |
| Manual verification | 8 / 8 wallets | All classified WALLET_FACTORY |
| Observed precision | 100% | n = 1 validated cluster |
| Ground truth source | CLUSTER_001.md | Documented 2026-06-11 |

Caveat: Precision is measured on a single validated cluster. Broader validation
requires manual review of additional clusters, particularly MEDIUM confidence cases.

---

## Limitations

| Limitation | Description |
|---|---|
| Funding alone is not proof | Shared funder does not prove common ownership. Legitimate launch teams may share funding infrastructure. |
| Single heuristic | Only top_funder is used. Final attribution requires multiple behavioral signals: deployment cadence, token patterns, transfer targets. |
| Limited validation | Only 1 of 15 clusters has been manually verified. Remaining 14 are candidates pending review. |
| Threshold sensitivity | wallet_count >= 5 may miss smaller coordinated operations. Lower threshold increases recall but reduces precision. |
| Backfill data quality | 346k of 347k operators are synthetic (Dune backfill). top_funder is null for most, limiting cluster detection scope. |

---

## Product Implication

These 15 clusters are the first entries in the NexusVeritas Initial Operator
Registry Seed -- the starting point for building persistent operator identities
from ephemeral wallets.

Each cluster provides:
- Stable cluster_id (CL-001 through CL-015) -- persistent identifier
- Known funder address -- attribution anchor for future wallet matching
- wallet_count and unique_days -- evidence chain
- Heuristic confidence classification (HIGH/MEDIUM)

As new operators appear on-chain, they can be matched against known cluster
funders to detect when a known operator launches under a new wallet identity.

> 500 ephemeral wallets -> 1 persistent operator identity.

This is the foundation of Operator Resolution and the real competitive moat
of NexusVeritas.

---

## Detection Query

SELECT
    behavior->'structural'->>'top_funder' AS funder,
    COUNT(*) AS wallet_count,
    COUNT(DISTINCT DATE(CAST(behavior->'structural'->>'first_seen' AS timestamp))) AS unique_days
FROM creators
WHERE behavior->'structural'->>'top_funder' IS NOT NULL
    AND behavior->'structural'->>'top_funder' != 'null'
GROUP BY 1
HAVING COUNT(*) >= 5
ORDER BY wallet_count DESC;

---

## Next Steps

- [ ] Manually validate 3-5 additional clusters (MEDIUM confidence cases)
- [ ] Add cluster_id to API scan response
- [ ] NETWORK FINDINGS block in Scanner v6
- [ ] Lower threshold to wallets >= 3 -- measure precision/recall tradeoff
- [ ] Cross-reference cluster funders against each other (meta-clusters)
- [ ] GET /api/v2/cluster/:address endpoint

---

## Related

- docs/clusters/CLUSTER_001.md -- CL-003 ground truth (manual verification)
- docs/reference/NETWORK_INTELLIGENCE.md -- three-layer detection architecture
- DECISION_015 -- operator resolution as real competitive moat
- FINDING_003 -- operator_class != token_risk (model foundation)

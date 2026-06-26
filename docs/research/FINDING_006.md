# Research Finding #006 — Operator Cluster Detection via Funding Analysis

**Date:** 2026-06-26
**Status:** Confirmed -- 15 clusters detected in 347k operator dataset

---

## Discovery

Funding-pattern analysis across 347,738 operator profiles revealed 15 potential
operator clusters using the heuristic:

  same top_funder + wallet_count >= 5

---

## Key Findings

| Cluster | Wallets | Unique Days | Sybil Risk | Funder |
|---|---|---|---|---|
| CL-001 | 11 | 11 | MEDIUM | 5tzFkiKscXHK... |
| CL-002 | 8 | 3 | MEDIUM | 3DDmb2kPULsq... |
| CL-003 | 8 | 1 | HIGH | 7EYgVUTxtRkV... |
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

Total tagged: 98 operators across 15 clusters

---

## Sybil Risk Classification

HIGH (unique_days = 1): 6 clusters -- all wallets funded same day by same source.
Strong indicator of coordinated wallet factory or Sybil infrastructure.
Clusters: CL-003, CL-005, CL-008, CL-011, CL-014, CL-015

MEDIUM (unique_days >= 2): 9 clusters -- wallets funded over multiple days.
Could be legitimate team infrastructure or slower coordinated operation.

---

## Confirmation

CL-003 (7EYgVUTx...) matches CLUSTER_001 -- previously documented in
docs/clusters/CLUSTER_001.md. Ground truth confirmed: 8/8 WALLET_FACTORY.
This validates the detection heuristic.

---

## Product Implication

These 15 clusters are the first entries in the NexusVeritas Operator Registry.
Each cluster = one Operator Candidate with:
- Stable cluster_id (CL-001 through CL-015)
- Known funder address (attribution anchor)
- wallet_count and unique_days (evidence)
- sybil_risk (HIGH/MEDIUM)

As new operators appear, they can be matched against known funders
to detect when a known operator launches under a new wallet.

This is the foundation of Operator Resolution:
500 ephemeral wallets -> 1 persistent operator identity.

---

## Detection Query

SELECT
    behavior->'structural'->>'top_funder' as funder,
    COUNT(*) as wallet_count,
    COUNT(DISTINCT DATE(first_seen)) as unique_days
FROM creators
WHERE top_funder IS NOT NULL
GROUP BY top_funder
HAVING COUNT(*) >= 5
ORDER BY wallet_count DESC;

---

## Next Steps

- [ ] Add cluster_id to API scan response when operator is in known cluster
- [ ] NETWORK FINDINGS block in Scanner v6
- [ ] Lower threshold to wallets >= 3 for broader detection
- [ ] Cross-reference cluster funders against each other (meta-clusters)
- [ ] GET /api/v2/cluster/:address endpoint

## Related

- docs/clusters/CLUSTER_001.md (CL-003 confirmed ground truth)
- docs/reference/NETWORK_INTELLIGENCE.md (internal)
- DECISION_015 (operator resolution = real moat)

# Funding-Based Operator Clustering in Solana Deployer Networks

**Series:** NexusVeritas Research Findings
**Finding:** #006
**Date:** 2026-06-26
**Status:** Heuristic Validated (Partial)
**Dataset:** 347,738 Solana operator profiles

---

## Abstract

We applied a single deterministic funding heuristic to 347,738 Solana operator
profiles and identified 15 candidate operator clusters encompassing 98 wallets.
One cluster was manually validated against ground truth, yielding 100% precision
(n=1). This finding demonstrates that simple, reproducible funding heuristics
are capable of identifying recurring operator infrastructure on Solana before
introducing more advanced behavioral correlation.

---

## Discovery

Funding-pattern analysis across 347,738 operator profiles revealed 15 potential
operator clusters using a single heuristic:

  same top_funder + wallet_count >= 5

Total operators tagged: 98 across 15 clusters.

---

## Cluster Table

| Cluster | Wallets | Unique Days | Confidence | Funder (truncated) |
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

CL-003 ✓ = ground truth validated. HIGH = same-day funding pattern.

---

## Heuristic Confidence Classification

### HIGH Confidence (unique_days = 1) — 6 clusters

All wallets in the cluster were funded by the same source within a single day.
This pattern is highly unusual for organic activity and is a strong heuristic
indicator of coordinated wallet creation.

Note: HIGH heuristic confidence does not constitute proof of malicious intent.
It means the pattern matches known coordinated creation signatures.

Clusters: CL-003, CL-005, CL-008, CL-011, CL-014, CL-015

### MEDIUM Confidence (unique_days >= 2) — 9 clusters

Wallets funded over multiple days by the same source. May indicate legitimate
team infrastructure, coordinated market making, or slower organized operation.
Requires additional signals for attribution.

---

## Validation

| Metric | Value | Notes |
|---|---|---|
| Validated cluster | CL-003 | Matches previously documented CLUSTER_001 |
| Manual verification | 8 / 8 wallets | All classified WALLET_FACTORY archetype |
| Observed precision | 100% | n = 1 validated cluster |

Caveat: Precision is measured on a single validated cluster. Broader validation
requires manual review of additional clusters, particularly MEDIUM confidence cases.

---

## Limitations

- **Funding alone is not proof.** Shared funder does not prove common ownership.
  Legitimate launch teams may share funding infrastructure (e.g., CEX withdrawal
  to multiple team wallets).
- **Single heuristic.** Only top_funder is analyzed. Final attribution requires
  multiple behavioral signals: deployment cadence, token patterns, transfer targets.
- **Limited validation.** Only 1 of 15 clusters has been manually verified.
  Remaining 14 are candidates pending review.
- **Data quality.** The majority of operator profiles originate from Dune Analytics
  backfill data, where top_funder is not available. This limits cluster detection
  to operators enriched via direct RPC calls.

---

## Detection Query

```sql
SELECT
    behavior->'structural'->>'top_funder' AS funder,
    COUNT(*) AS wallet_count,
    COUNT(DISTINCT DATE(
        CAST(behavior->'structural'->>'first_seen' AS timestamp)
    )) AS unique_days
FROM creators
WHERE behavior->'structural'->>'top_funder' IS NOT NULL
    AND behavior->'structural'->>'top_funder' != 'null'
GROUP BY 1
HAVING COUNT(*) >= 5
ORDER BY wallet_count DESC;
```

---

## Conclusion

This finding demonstrates that simple deterministic funding heuristics are
capable of identifying recurring operator infrastructure before introducing
more advanced behavioral correlation. The heuristic serves as one signal
within a broader operator attribution framework — not as a standalone verdict.

The broader research direction: rather than analyzing individual wallets in
isolation, NexusVeritas tracks operator infrastructure across wallet rotations,
treating multiple ephemeral addresses as expressions of a single persistent
operator identity.

---

## Related

- FINDING_003: operator_class != token_risk
- FINDING_005: INFRASTRUCTURE_HUB false positive analysis
- docs/clusters/CLUSTER_001.md: ground truth for CL-003

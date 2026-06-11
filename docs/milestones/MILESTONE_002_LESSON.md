# Milestone 002 — Lesson Learned

**Date:** 2026-06-11

## Discovery

After first candidate_discovery run on 11 creators:

  P50 similarity: 0.997
  P90 similarity: 1.000
  P95 similarity: 1.000

## Lesson

Absolute similarity thresholds do not scale.

As the knowledge base grows,
similarity becomes a ranking problem,
not a threshold problem.

Use percentile-based candidate selection
instead of fixed similarity cutoffs.

## Implication

At 11 creators:
  "similarity > 0.85" = useful filter

At 1000+ creators:
  "similarity > 0.85" = thousands of matches (noise)
  "similarity > p90 of current distribution" = meaningful

## Future Candidate Score

  candidate_score = similarity × rarity × novelty

Where:
  rarity  = how unusual is this combination of features
  novelty = connection not previously in candidate_matches

## Phase Transition

This is the moment the system shifts from:
  "Find similar operators"
To:
  "Find unexpectedly similar operators from thousands of candidates"

These are fundamentally different problems.
# Milestone 003 — First Confirmed Attribution by Similarity

**Status:** Pending
**Target:** 2026

## Definition

System detects: Creator A ↔ Creator B (high similarity, cross-archetype)
Investigation confirms: same operator, same infrastructure
Discovery was NOT previously known or manually investigated

## Why This Matters

Not "1000 creators in DB"
But: first case where similarity search found what human investigation confirms

This is the moment NexusVeritas becomes a knowledge discovery engine.

## Success Criteria

  similarity >= 0.85 (cross-archetype)
  INFRASTRUCTURE_CANDIDATE verdict (infra >= 2, positive features)
  Manual investigation confirms shared operator
  No prior knowledge of connection

## Prerequisites

  1000+ creators in DB with V2 vectors
  candidate_discovery running regularly
  candidate_explain showing positive infra features (not zero-zero)
  V3 vector (0=0 vs 1=1 distinction)

## Metrics to Track

  creators_total
  candidates_per_day
  unique_candidates_per_day
  cross_archetype_rate
  confirmed_discoveries_per_week
  similarity_histogram (distribution)

## Risk: Similarity Collapse

At 1000+ creators, many may cluster at 82-88% similarity
causing candidate queue explosion.

Mitigation:
  Raise threshold dynamically based on distribution
  Track p95 similarity score as baseline
  Only surface candidates above p95
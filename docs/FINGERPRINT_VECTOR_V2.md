# Fingerprint Vector — Roadmap to V2

## Current: V1 (7 dimensions)

```
[0] wallet_age_days
[1] funding_sources_count
[2] funding_concentration
[3] transfer_count
[4] total_incoming_sol
[5] tokens_created (normalized /1000)
[6] days_active
```

Problem: too coarse. Similarity often 100% within archetype.
Measures WHAT happened, not HOW the operator behaves.

## Target: V2 (35 dimensions)

### Structural (5)
```
[0]  wallet_age_days
[1]  funding_sources_count
[2]  funding_concentration
[3]  total_incoming_sol (log-normalized)
[4]  avg_transfer_sol
```

### Behavioral (12)
```
[5]  transfer_count
[6]  recycling_loop          0/1
[7]  split_init_pattern      0/1
[8]  init_amount_score       distance from 0.002 SOL
[9]  transfer_cadence_score  uniformity of intervals
[10] single_purpose_score    1 - (tokens/max_tokens)
[11] funding_reuse_score     same funder across wallets
[12] wallet_recycling_score  age when funded
[13] mutual_funding_score    bidirectional transfers
[14] bundle_pattern          0/1
[15] volume_bot_score        wash trading detected
[16] automated_cadence       variance of transfer times
```

### Operational (8)
```
[17] tokens_created (normalized /1000)
[18] days_active
[19] total_signatures (normalized /3000)
[20] launch_frequency        tokens per active day
[21] signature_density       sigs per day
[22] tokens_per_sig_ratio    tokens/sigs normalization
[23] activity_recency        0=stale, 1=active today
[24] wallet_rotation_score   age=0 + tokens=high
```

### Token Outcomes (7)
```
[25] avg_whale_concentration across launched tokens
[26] avg_liquidity_usd       log-normalized
[27] graduation_rate         % tokens graduated pump.fun
[28] rug_rate                % tokens dead <7 days
[29] avg_token_age_hours
[30] insider_network_rate    % tokens with insider cluster
[31] avg_holder_count
```

### Launch Patterns (4) — requires more data
```
[32] launch_hour_variance    time-of-day distribution
[33] launch_day_pattern      weekday distribution
[34] time_to_first_sell      post-launch behavior
[35] metadata_similarity     token name/image patterns
```

## Implementation Priority

```
Phase 1 (immediate)   dims 0-24    structural + behavioral + operational
Phase 2 (1000 creators) dims 25-31  token outcome aggregates
Phase 3 (5000+ creators) dims 32-35  temporal + metadata patterns
```

## Candidate Discovery (nightly)

```
SELECT a.address, b.address,
       1 - (a.vector <=> b.vector) AS similarity
FROM creators a, creators b
WHERE a.address < b.address
  AND a.archetype != b.archetype      -- cross-archetype surprises
  AND 1 - (a.vector <=> b.vector) > 0.85
ORDER BY similarity DESC
LIMIT 20;
```

When system finds unexpected 94% similarity between
INDUSTRIAL_DEPLOYER and WALLET_FACTORY — that is a new cluster candidate.
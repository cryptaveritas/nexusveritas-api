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
## V3 Improvements (from field investigations)

### Fix: init_amount_score → factory_confirmed_score

Problem discovered: 0.002 SOL transfers can be:
  A) WALLET_FACTORY leaf initialization (true signal)
  B) ATA creation for stablecoins (false positive)

V3 fix:
  Remove init_amount_score (amount-based)
  Add factory_confirmed_score:
    = 1 if (init_amount AND downstream_token_launch)
    = 0 if (init_amount AND downstream_stablecoin_only)

### Fix: binary feature agreement

Zero-zero agreement is not a shared signal.
Only count feature as "shared" when both values > 0.3.
(discovered via CASUAL_CREATOR ↔ WALLET_FACTORY false positive)

## V3 Roadmap — DEX Flow Layer (Q3-Q4 2026)

Discovered through technical peer review on CoderLegion (2026-06-12).
Solves the MM/Scam false positive problem.

### New V3 dimensions (DEX Flow Layer):

```
[36] liquidity_reversion_index
     Times address re-added liquidity after removal in 30d
     Scammer: always 0 (terminal extraction)
     Market maker: >0 (cyclic rebalancing)

[37] net_pool_exposure_slope
     Direction of net position over 7d/30d
     Scammer: steep unidirectional drain
     Market maker: oscillates around baseline

[38] volume_to_drain_zscore
     Final large tx vs 30d median volume z-score
     Scammer: extreme outlier (>3σ)
     Market maker: within normal range

[39] flow_asymmetry_score
     Ratio of outgoing vs incoming DEX flows
     Scammer: highly asymmetric (one-way extraction)
     Market maker: balanced bidirectional flows
```

### Implementation requirements:
  Raydium AMM/CLMM instruction deserialization
  Orca Whirlpool transaction parsing
  Pool-specific account state tracking
  This is a significant engineering step beyond SPL transfer tracking


---

## DEX Flow Layer — Technical Specification (V3)

**Audit date:** 2026-06-12
**Status:** Specified, not yet implemented
**Implementation priority:** Phased (see below)

### Block A: Liquidity Reversion Index (LRI)

```
LRI = sum(SOL_volume_added_30d) / max(sum(SOL_volume_removed_30d), 1)

LRI → 0:  terminal extraction (scammer pattern)
LRI >= 1: cyclic rebalancing (market maker pattern)
```

**Audit note:** Original formula counted transactions, not volumes.
Fixed: must use SOL volume, not transaction count.
A scammer can make 1 large withdrawal + 10 small deposits → LRI=10 but funds are gone.

### Block B: Net Pool Exposure Aggregators (NPE)

```
NPE Slope (β): linear regression coefficient of balance change
NPE Volatility (σ): standard deviation of position changes
Max One-Way Drawdown: largest continuous withdrawal without compensating deposit
```

**Audit note:** Requires time series data (pool_positions table).
New schema needed: (operator, pool, timestamp, balance)
Engineering estimate: 2-3 weeks for data collection layer alone.

### Block C: Volume-to-Drain z-score (VTD)

```
Z_VTD = (V_last - median_30d_pool) / sigma_30d_pool

Z > 4.5 + LRI → 0 = pool drain signal
```

**Audit note:** Simplest to implement. Uses public pool data via RPC.

### Implementation Phases

```
Phase 1 (Q3 2026):  VTD z-score
                     Public pool data, 1-2 days work

Phase 2 (Q3 2026):  LRI with volume (not tx count)
                     Medium complexity, 3-5 days

Phase 3 (Q4 2026):  NPE slope + volatility
                     Requires pool_positions time series table
                     2-3 weeks infrastructure work
```

### Code Issues Found in Reference Implementation

```javascript
// ❌ Wrong Raydium address in reference code:
const RAYDIUM_AMM_V4 = "675kPX9M4SG31gmmvvbiAtnuBZic9mZeChFyCp8CvUtF";
// ✅ Correct:
const RAYDIUM_AMM_V4 = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";

// ❌ Wrong discriminator size:
const discriminator = data.readUInt8(0); // 1 byte
// ✅ Raydium/Orca use 8-byte discriminator:
const discriminator = data.readBigUInt64LE(0);

// ❌ extractVolume() not defined in reference
// Needs full SPL transfer deserialization from inner instructions
```

### XGBoost V3 Feature Block

| Feature | Type | Description |
|---------|------|-------------|
| lri_30d | float | Liquidity Reversion Index (volume-based) |
| npe_slope_7d | float | Net position trend slope |
| npe_volatility_30d | float | Position volatility |
| vtd_z_score | float | Terminal drain z-score vs pool median |
| flow_asymmetry | float | Outgoing/incoming DEX flow ratio |


---

## Orca Whirlpool Deserialization — Audit & Fixed Specification

**Audit date:** 2026-06-12
**Status:** Specification audited, bugs fixed, ready for Phase 1 implementation

---

### Program ID (verified)

```
whirLbMiicVdio4iUfT557125FRdmctmsxmNs95S8Y2  ✅ correct mainnet address
```

---

### Discriminators (verified hex, SHA-256("global:<name>")[:8])

```
swap:                   f8c69e91e1758761  ✅
increase_liquidity:     2e921d41dbd176d4  ✅
increase_liquidity_v2:  1a4de1e32d2df1d5  ✅
decrease_liquidity:     a0dddf50ff7db317  ✅
decrease_liquidity_v2:  3a6509f7a9561b32  ✅
```

---

### BUG FIX #1 — Discriminator BigInt values

```typescript
// ❌ WRONG (reference code had byte-swapped values):
const DISCRIMINATORS = {
  SWAP: BigInt("0x618775e1919ec6f8"),         // bytes reversed!
  DECREASE_LIQ: BigInt("0x17b37dff50dddda0"), // bytes reversed!
  DECREASE_LIQ_V2: BigInt("0x321b56a9f709653a") // bytes reversed!
};

// ✅ CORRECT (readBigUInt64LE handles LE conversion automatically):
const DISCRIMINATORS = {
  SWAP:             BigInt("0xf8c69e91e1758761"),
  DECREASE_LIQ:     BigInt("0xa0dddf50ff7db317"),
  DECREASE_LIQ_V2:  BigInt("0x3a6509f7a9561b32"),
  INCREASE_LIQ:     BigInt("0x2e921d41dbd176d4"),
  INCREASE_LIQ_V2:  BigInt("0x1a4de1e32d2df1d5"),
};
```

---

### BUG FIX #2 — Pool address account index

```typescript
// ❌ WRONG (reference code):
const poolAddress = instruction.accounts[2].toString();

// ✅ CORRECT — decrease_liquidity accounts layout:
// accounts[0]: whirlpool (pool address)  ← use this
// accounts[1]: token_program
// accounts[2]: position_authority
// accounts[3]: position
// accounts[4]: position_token_account
// accounts[5]: token_owner_account_a
// accounts[6]: token_vault_a
// accounts[7]: token_owner_account_b
// accounts[8]: token_vault_b

const poolAddress = instruction.accounts[0].toString(); // ✅
```

---

### BUG FIX #3 — Volume extraction (do NOT parse Borsh args)

```typescript
// ❌ WRONG — parsing liquidity_amount from Borsh args:
// liquidity_amount (u128) is a virtual ΔL value,
// NOT the actual SOL/USDC volume moved.
// Borsh parsing is fragile and version-dependent.

// ✅ CORRECT — use meta token balance deltas:
function extractVolume(meta, accountIndex) {
  const pre  = meta.preTokenBalances.find(b => b.accountIndex === accountIndex);
  const post = meta.postTokenBalances.find(b => b.accountIndex === accountIndex);
  if (!pre || !post) return 0;
  return Math.abs(
    parseFloat(post.uiTokenAmount.uiAmount) -
    parseFloat(pre.uiTokenAmount.uiAmount)
  );
}
// Advantages:
// - Works for v1 and v2 instructions
// - No Borsh offset errors
// - Always reflects actual token movement
```

---

### Fixed dex_filter.js — Phase 1 Implementation (VTD z-score)

```javascript
const ORCA_PROGRAM_ID = "whirLbMiicVdio4iUfT557125FRdmctmsxmNs95S8Y2";

const DISCRIMINATORS = {
  SWAP:            BigInt("0xf8c69e91e1758761"),
  DECREASE_LIQ:    BigInt("0xa0dddf50ff7db317"),
  DECREASE_LIQ_V2: BigInt("0x3a6509f7a9561b32"),
  INCREASE_LIQ:    BigInt("0x2e921d41dbd176d4"),
  INCREASE_LIQ_V2: BigInt("0x1a4de1e32d2df1d5"),
};

function extractVolume(meta, accountIndex) {
  const pre  = meta.preTokenBalances.find(b => b.accountIndex === accountIndex);
  const post = meta.postTokenBalances.find(b => b.accountIndex === accountIndex);
  if (!pre || !post) return 0;
  return Math.abs(
    parseFloat(post.uiTokenAmount.uiAmount) -
    parseFloat(pre.uiTokenAmount.uiAmount)
  );
}

function parseOrcaInstruction(instruction, meta) {
  if (instruction.programId.toString() !== ORCA_PROGRAM_ID) return null;

  const data = Buffer.from(instruction.data, "base58");
  if (data.length < 8) return null;

  const discriminator = data.readBigUInt64LE(0);
  const poolAddress = instruction.accounts[0].toString(); // FIX #2

  if (
    discriminator === DISCRIMINATORS.DECREASE_LIQ ||
    discriminator === DISCRIMINATORS.DECREASE_LIQ_V2
  ) {
    const volumeA = extractVolume(meta, 5); // token_owner_account_a
    const volumeB = extractVolume(meta, 7); // token_owner_account_b
    return {
      type: "DECREASE_LIQUIDITY",
      poolAddress,
      volumeA,
      volumeB,
      isV2: discriminator === DISCRIMINATORS.DECREASE_LIQ_V2
    };
  }

  if (discriminator === DISCRIMINATORS.SWAP) {
    const volumeA = extractVolume(meta, 4);
    const volumeB = extractVolume(meta, 6);
    return {
      type: "SWAP",
      poolAddress,
      volumeA,
      volumeB
    };
  }

  if (
    discriminator === DISCRIMINATORS.INCREASE_LIQ ||
    discriminator === DISCRIMINATORS.INCREASE_LIQ_V2
  ) {
    const volumeA = extractVolume(meta, 5);
    const volumeB = extractVolume(meta, 7);
    return {
      type: "INCREASE_LIQUIDITY",
      poolAddress,
      volumeA,
      volumeB
    };
  }

  return null;
}

module.exports = { parseOrcaInstruction };
```

---

### Borsh Layout Reference (for documentation only — do NOT use for volume extraction)

```
swap (after 8-byte discriminator):
  amount                   u64   8 bytes
  other_amount_threshold   u64   8 bytes
  sqrt_price_limit         u128  16 bytes
  exact_input              bool  1 byte

decrease_liquidity / increase_liquidity:
  liquidity_amount         u128  16 bytes  ← virtual ΔL, NOT real volume
  token_min_a / max_a      u64   8 bytes
  token_min_b / max_b      u64   8 bytes
```

---

### Implementation Recommendation (Phase 1)

```
1. Use Variant 1 (lightweight JS mapper) — NOT Anchor IDL
2. Filter only DECREASE_LIQ + SWAP discriminators
3. Extract volumes from meta.postTokenBalances - meta.preTokenBalances
4. Pool address from accounts[0]
5. Do NOT parse Borsh args for volume calculation

Variant 2 (Anchor IDL): only if full deserialization needed
Variant 3 (Rust):       Q4 2026 when pipeline moves to Memgraph
```

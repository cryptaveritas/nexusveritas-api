> 🔒 **ДЛЯ СЛУЖЕБНОГО ПОЛЬЗОВАНИЯ — CRYPTAVERITAS INTERNAL**
> Не подлежит распространению без разрешения руководства.

---

# VERAX — Ecosystem Whitepaper v1.0

**Token:** $VERAX | **Chain:** Solana SPL | **Supply:** 100,000,000
**Date:** 2026-06-12 | **Status:** Draft

---

## Abstract

VERAX is the native utility token of the CryptaVeritas ecosystem —
a suite of cryptographic verification and behavioral intelligence
protocols built on Solana.

The ecosystem comprises two production-ready products:

**CryptaSignals** — Cryptographic digital signature protocol for
any on-chain action. Commit-Reveal with SHA-256 proof. Any entity
can prove they committed to any action before executing it.

**NexusVeritas** — Behavioral operator intelligence for Solana.
Profiles actors behind token launches via behavioral fingerprinting.
565 operators classified across 8 archetypes. Live API.

VERAX unifies access, governance, and value capture across both
products and all future CryptaVeritas ecosystem projects.

---

## 1. The Problem

### 1.1 The Trust Problem in Digital Actions

Signal providers manipulate track records. DAOs fabricate voting
histories. AI agents make unverifiable claims. Any digital actor
can deny prior statements with no cryptographic recourse.

58% of market participants rely on unverified social media signals.
The market runs on trust. CryptaVeritas replaces trust with math.

### 1.2 The Token Security Blind Spot

Web3 security has meant one thing: audit the smart contract.
This standard is now blind.

On Solana, attackers deploy technically flawless tokens through
pump.fun and execute rug pulls entirely at the behavioral layer.
Median scam token lifespan: 16 minutes. Code audits take days.

**FINDING_003 (NexusVeritas research):** Operator class and token
risk are independent dimensions. A casual creator can produce a
critical-risk token. An industrial deployer can produce a safe one.
Token-centric scanners miss this entirely.

---

## 2. The Solution

### 2.1 CryptaSignals — Cryptographic Action Proof

**Core protocol:** Commit-Reveal with SHA-256 + domain prefix + salt.

```
1. COMMIT  → SHA-256 hash published before action
             cryptasignals:v1|signal|{data}|{salt}
2. REVEAL  → Action decrypted and published with status
             VERIFIED / INVALID_HASH / NO_SECRET / DECRYPT_FAILED
3. VERIFY  → Anyone recomputes hash independently
             browser: cryptaveritas.github.io/cryptaveritas-verify
             CLI:     node cli-verify.js <hash> <signal> <salt>
```

**Applications:** trading signals, on-chain governance, AI agent
actions, DAO votes, smart contract calls — any action requiring
cryptographic proof of prior commitment.

**Technical stack:**
```
Runtime:      Node.js 20 LTS
Language:     TypeScript 5
Database:     SQLite WAL (better-sqlite3)
Cryptography: AES-256-GCM + SHA-256 (Node.js crypto)
Validation:   Zod .strict() + .refine()
Bot:          grammY (Telegram) — primary + backup
Tests:        14/14 passing (Jest + ts-jest)
```

**Security: 10 attack vectors closed**
```
Replay attacks       → Domain prefix cryptasignals:v1|signal|
Timing attacks       → crypto.timingSafeEqual
IV reuse in AES      → Random IV per encryption
Prompt Injection     → Zod .strict() + Depth Guard (20 levels)
Time-Jacking (NTP)   → process.hrtime.bigint() monitoring
SQLITE_BUSY          → busy_timeout = 5000ms
WAL data loss        → wal_checkpoint(TRUNCATE) on shutdown
Key memory leak      → clearMasterKey() on shutdown
Overlapping worker   → isProcessing flag
DoS via nesting      → LIMIT 100 in getPendingCommits
```

### 2.2 NexusVeritas — Behavioral Operator Intelligence

**Core insight:** The contract can be replaced in minutes.
An operator's behavioral fingerprint is much harder to change.

**Pipeline:**
```
Token → Creator → Behavior Profile → Archetype → Risk Score → API
```

**8 Operator Archetypes (565 classified, June 2026):**
```
INDUSTRIAL_DEPLOYER        315  500+ tokens, invisible funding
PROFESSIONAL_CREATOR       127  20-500 tokens, sustained activity
EXCHANGE_FUNDED_DEPLOYER    31  Industrial + exchange funding
ROTATION_OPERATOR           30  Burst deployment, 0 days active
INFRASTRUCTURE_HUB          24  High SOL inflow, distribution
CASUAL_CREATOR              20  <20 tokens, organic
WALLET_FACTORY              15  Single-use, 0.002 SOL init
WALLET_FACTORY_HUB           3  Factory hub with recycling
```

**Behavioral vector V2 (25 dimensions):**
Funding Layer, Activity Layer, Launch Layer,
Behavioral Layer, Structural Layer.

**API:** GET /api/v2/scan/solana/:mint
Returns: score, reasons, operator_class, isHardRefuse

**Validation:** VALIDATION_001 — 8/8 CLUSTER_001 wallets →
WALLET_FACTORY (confidence 1.0) ✅

---

## 3. Token: $VERAX

### 3.1 Details

```
Name:       VERAX
Ticker:     $VERAX
Meaning:    Latin "verax" — truthful, one who speaks truth
            Root: verus (truth) → verax (bearer of truth)
Standard:   Solana SPL
Supply:     100,000,000 VERAX (fixed, no inflation)
Multisig:   Squads v4 (2 of 3)
```

### 3.2 Distribution

```
Team & founders:          15%  6-month cliff, 36 months linear
Development fund:         20%  Squads v4 multisig 2 of 3
Community & airdrops:     15%  20% immediately, 80% over 18 months
Marketing & partnerships: 10%  25% immediately, 75% over 12 months
Initial liquidity:        30%  LP burned (Raydium + Orca)
Reserve (future):         10%  Squads v4, unlocked per milestone
```

### 3.3 Utility

**CryptaSignals access:**
```
1,000 VERAX    → Private signals (B2C)
10,000 VERAX   → B2B Lite API
50,000 VERAX   → B2B Pro API
Contract       → Enterprise (white label)
```

**NexusVeritas access:**
```
5,000 VERAX    → Operator scan API Basic
25,000 VERAX   → Operator scan API Pro
100,000 VERAX  → Enterprise (white label)
```

**Ecosystem utility:**
```
Governance     → Vote on protocol upgrades and roadmap
Staking        → Discounts across all services
Buyback & Burn → % of Enterprise revenue
Future projects → Automatic access for VERAX holders
```

---

## 4. Access Model

```
Tier           Requirement      Notes
──────────────────────────────────────────────────────
B2C Signals    1,000 VERAX      Offchain RPC check, hourly
B2B Lite       10,000 VERAX     Offchain RPC check, hourly
B2B Pro        50,000 VERAX     Extended API, priority support
NX Basic       5,000 VERAX      NexusVeritas operator scan
NX Pro         25,000 VERAX     NexusVeritas Pro API
Enterprise     Contract         VERAX/USDC/USDT/fiat, SLA
```

No fiat, no KYC, no contracts for B2C and B2B tiers.

---

## 5. Competitive Landscape

### CryptaSignals

```
Project          Approach                    Limitation
Alpha Impact     Post-fact via onchain trades No pre-commit
Knidos           ZK verification of funds    Not public signals
CryptoNinjas     Self-reporting P&L          No cryptography
CryptaSignals    Pre-commit SHA-256          None identified ✅
```

Market: DeFAI $10B (Crypto.com Research 2025).
58% rely on unverified signals. Niche is open.

### NexusVeritas

```
Project      Approach              Limitation
RugCheck     Token-level scan      No operator profiling
Birdeye      Market data           No behavioral DNA
GMGN         Token scanner         operator_class = token_risk
NexusVeritas Operator fingerprint  None identified ✅
```

---

## 6. Roadmap

### Q3 2026

```
$VERAX launch on Solana mainnet
OTC pre-launch via Squads v4
Token-gated access (Helius RPC)
CryptaSignals bot stability (48h test)
Drip Reveal (progressive disclosure)
Multi-oracle (Birdeye + Pyth)
NexusVeritas: 1000+ operators
NexusVeritas: Review UI + XGBoost baseline
NexusVeritas: Temporal vectors (30d/90d/all)
```

### Q4 2026

```
CryptaSignals: Onchain pre-commits (Solana Memo Program)
CryptaSignals: Staking contract on Solana
CryptaSignals: TradingView Pine Script indicator
NexusVeritas: Memgraph migration (1000-1500 operators)
NexusVeritas: GNN structural embeddings (vector_v3)
NexusVeritas: DEX Flow Layer V3 (Raydium + Orca pools)
NexusVeritas: B2B API (Phantom, Jupiter targets)
Ecosystem: Governance launch
Ecosystem: Cross-product staking rewards
```

### 2027

```
ZK proofs for CryptaSignals (Noir + zkVerify)
Decentralized validator network with slashing
Onchain credit scoring for AI agents
DeFAI protocol partnerships
Enterprise white-label ZK verification
International trademark (Madrid system)
```

---

## 7. Legal Structure

Legal entity registration triggered by first Enterprise client
requiring official contract.

Enterprise clients may pay in VERAX, USDC, USDT, or fiat
via payment processor.

B2C and B2B tiers: no KYC, no contracts, no fiat required.
Access determined solely by VERAX holdings (offchain RPC check).

VERAX utility classification: access token for software services.
Not a security. Not an investment contract (Howey Test analysis).

---

## 8. Links

```
GitHub:    https://github.com/cryptaveritas
Verifier:  https://cryptaveritas.github.io/cryptaveritas-verify
Telegram:  https://t.me/cryptaveritas
Booklet:   https://cryptaveritas.github.io/cryptaveritas-verify/booklet.html
```

---

*VERAX — The token of provable truth.*

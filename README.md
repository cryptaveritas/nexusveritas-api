# NexusVeritas
**Solana Operator Intelligence Platform**

Most tools ask: *Is this token safe?*
NexusVeritas asks: *Who is behind this token, and what is their behavioral history?*

---

## What It Does

NexusVeritas profiles operators (deployers) using behavioral fingerprinting.

Key insight (FINDING_003): Operator class and token risk are independent dimensions.
Operators adapt — they change wallets, tokens, strategies.
NexusVeritas tracks the operator, not the wallet.

---

## Status v0.9.2 (June 2026)

- **347,000+** operator profiles
- **10 behavioral archetypes**
- API: `GET /api/v2/scan/solana/:mint`
- pgvector similarity search (25-dimensional behavioral vectors)
- signal_coverage + data_source_quality per operator
- 46+ documented case studies

---

## Archetypes

| Archetype | Risk | Description |
|---|---|---|
| WALLET_FACTORY_HUB | elevated | Recycling loop, mass wallet creation hub |
| WALLET_FACTORY | elevated | Single-use wallets, minimal init funding |
| ROTATION_OPERATOR | high | Burst deployment, wallet rotation pattern |
| EXCHANGE_FUNDED_DEPLOYER | high | CEX-funded, high-volume aggressive pattern |
| INDUSTRIAL_DEPLOYER | neutral | 500+ tokens, automated cadence |
| INFRASTRUCTURE_HUB | unknown | High SOL distribution node |
| PROFESSIONAL_CREATOR | low_medium | 20+ tokens, 30+ days, verified funding |
| HIGH_FREQ_LOW_CONTEXT | elevated | Active but insufficient behavioral context |
| CASUAL_CREATOR | low | 2-4 tokens, organic activity |
| NEW_CREATOR | low | First token, minimal history |

---

## API
GET /api/v2/scan/solana/:mint

Response includes:
- `score` (0-100), `risk_class` (LOW/MEDIUM/HIGH/CRITICAL)
- `reasons` — explainable signals with severity
- `deployer_profile` — archetype, confidence, data_source_quality
- `signals` — mint/freeze authority, liquidity, whale concentration

---

## Data Quality

Every operator profile includes:
- `data_source_quality`: `full` | `partial` | `synthetic`
- `signal_coverage`: 0.0–1.0

Profiles from Helius RPC enrichment have full behavioral signals.
Profiles from Dune Analytics backfill are marked synthetic.

---

## Research

- **FINDING_003:** operator_class ≠ token_risk
- **FINDING_005:** INFRASTRUCTURE_HUB reclassification
- **CLUSTER_001:** First confirmed coordinated wallet cluster
- 46+ case studies in `docs/case-studies/`

---

## Architecture
Token Address

→ Helius RPC (on-chain metrics)

→ GoPlus + RugCheck (contract signals)

→ Operator lookup (347k behavioral profiles)

→ Risk Engine v1 (deterministic scoring)

→ API Response (score + explanation)

---

*Built on real Solana on-chain data. All findings documented.*

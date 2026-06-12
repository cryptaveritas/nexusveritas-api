# NexusVeritas

**Solana Behavioral Intelligence Platform**

Most tools ask: *Is this token safe?*
NexusVeritas asks: *Who is behind this token, and what is their behavioral history?*

---

## What It Does

NexusVeritas profiles operators using behavioral fingerprinting.

Key insight (FINDING_003): Operator class and token risk are independent dimensions.

---

## Status v0.9.1 (June 2026)

- 565 operator profiles
- 8 archetypes
- API live: GET /api/v2/scan/solana/:mint
- pgvector similarity search
- Parallel pipeline 5x speed

---

## Archetypes

| Archetype | Description |
|-----------|-------------|
| INDUSTRIAL_DEPLOYER | 500+ tokens, no visible funding |
| PROFESSIONAL_CREATOR | 20-500 tokens, sustained activity |
| EXCHANGE_FUNDED_DEPLOYER | Industrial + verified exchange funding |
| INFRASTRUCTURE_HUB | High SOL inflow, distribution node |
| WALLET_FACTORY | Single-use wallets, 0.002 SOL init |
| ROTATION_OPERATOR | Burst deployment, 0 days active |
| CASUAL_CREATOR | <20 tokens, organic activity |
| WALLET_FACTORY_HUB | Factory hub with recycling |

---

## API

GET /api/v2/scan/solana/:mint

Returns: score, reasons, isHardRefuse

---

## Research

- FINDING_003: operator_class != token_risk
- FINDING_005: INFRASTRUCTURE_HUB false positives
- VALIDATION_001: 8/8 CLUSTER_001 confirmed WALLET_FACTORY

Full docs: docs/VISION_2026.md

---

*Built on real Solana on-chain data. All findings documented.*

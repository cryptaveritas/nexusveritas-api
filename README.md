# NexusVeritas API v0.2

REST API for Solana token risk assessment. Connected to Solana mainnet via Helius RPC.

## Endpoints

### GET /api/risk/solana/:address

Returns a deterministic risk score for any Solana token.

```
GET /api/risk/solana/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### GET /api/risk/solana/:address?debug=true

Returns full snapshot with token metadata.

## Sample Results (Solana Mainnet)

Data obtained from Solana mainnet via Helius RPC.

| Token | Score | Class | Top10% | Notes |
|-------|-------|-------|--------|-------|
| USDC  | 40    | MEDIUM | 0%   | Mint + Freeze authority (Circle controlled) |
| BONK  | 0     | LOW    | 0%   | No risk factors |
| JUP   | 0     | LOW    | 0%   | No risk factors |
| PYTH  | 0     | LOW    | 52%  | VC allocation, below threshold |
| WIF   | 0     | LOW    | 44%  | Memecoin, below threshold |

### USDC example response
```json
{
  "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "chain": "solana",
  "score": 40,
  "class": "MEDIUM",
  "reasons": [
    "Mint authority enabled — unlimited supply inflation risk",
    "Freeze authority enabled — blacklist/pause possible"
  ]
}
```

### BONK example response
```json
{
  "address": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  "chain": "solana",
  "score": 0,
  "class": "LOW",
  "reasons": []
}
```

## Risk Classes

| Class    | Score  | Action         |
|----------|--------|----------------|
| LOW      | 0–29   | Allowed        |
| MEDIUM   | 30–59  | Warning        |
| HIGH     | 60–84  | Strong warning |
| CRITICAL | 85–100 | Hard refuse    |

## Stack

TypeScript · Node.js · Express · Helius RPC

## Architecture

Risk scoring logic shown in this repository represents the public MVP ruleset. Advanced behavioral analysis, simulation modules, and proprietary heuristics are implemented in the private NexusVeritas Core.

## Part of Veritas Ecosystem

- [CryptaVeritas](https://github.com/cryptaveritas) — signal verification protocol
- NexusVeritas — multichain token risk engine (this repo)

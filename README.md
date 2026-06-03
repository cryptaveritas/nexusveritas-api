# NexusVeritas API v0.1

REST API for Solana token risk assessment.

## Endpoints

### GET /api/risk/solana/:address

Returns a deterministic risk score for any Solana token.

**Example:**
GET /api/risk/solana/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

**Response:**
```json
{
  "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "chain": "solana",
  "score": 0,
  "class": "LOW",
  "reasons": [],
  "note": "Mock data — live Solana RPC integration coming in v0.2"
}
```

### GET /health

```json
{ "status": "ok", "version": "0.1.0" }
```

## Risk Classes

| Class    | Score  | Action       |
|----------|--------|--------------|
| LOW      | 0–29   | Allowed      |
| MEDIUM   | 30–59  | Warning      |
| HIGH     | 60–84  | Strong warning |
| CRITICAL | 85–100 | Hard refuse  |

## Stack

TypeScript · Node.js · Express

## Part of Veritas Ecosystem

- [CryptaVeritas](https://github.com/cryptaveritas) — signal verification protocol
- NexusVeritas — multichain token risk engine (this repo)
## Architecture

Risk scoring logic shown in this repository represents the public MVP ruleset. Advanced behavioral analysis, simulation modules, and proprietary heuristics are implemented in the private NexusVeritas Core.

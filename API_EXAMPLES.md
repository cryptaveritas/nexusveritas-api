# NexusVeritas API Examples

Base URL: your deployment or local :3001

---

## Scan a Token

GET /api/v2/scan/solana/{mint_address}

### Example Request

curl http://localhost:3001/api/v2/scan/solana/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

### Example Response

{
  "score": 85,
  "risk_class": "CRITICAL",
  "isHardRefuse": true,
  "reasons": [
    { "text": "Mint authority active", "severity": "critical", "delta": 20 },
    { "text": "Deployer archetype: ROTATION_OPERATOR (confidence 0.75)", "severity": "caution", "delta": 41 }
  ],
  "deployer_profile": {
    "archetype": "ROTATION_OPERATOR",
    "confidence": 0.75,
    "baseline_risk": "high",
    "matched_signals": ["split_init_pattern", "fresh_wallet"],
    "data_source_quality": "partial",
    "signal_coverage": 0.6
  }
}

---

## Score Interpretation

| score | risk_class | Meaning |
|---|---|---|
| 0-29 | LOW | No significant risk factors |
| 30-59 | MEDIUM | Caution signals present |
| 60-84 | HIGH | Multiple risk indicators |
| 85-100 | CRITICAL | Extreme profile |

---

## Deployer Profile Fields

| Field | Description |
|---|---|
| archetype | Behavioral classification (10 types) |
| confidence | Classification confidence 0-1 |
| baseline_risk | low / low_medium / neutral / elevated / high |
| matched_signals | Which rules triggered |
| data_source_quality | full / partial / synthetic |
| signal_coverage | Data completeness 0-1 |

---

## Notes

- Deterministic: same input always returns same output
- Responses cached 5 minutes (Redis)
- operator_class and token_risk are independent (FINDING_003)

# NexusVeritas
**Solana Operator Intelligence Platform**

Most tools ask: Is this token safe?
NexusVeritas asks: Who is behind this token, and what is their behavioral history?

## Status (July 2026)
- 1.6M+ operator profiles indexed on Solana
- 10 behavioral archetypes
- AI-powered explanations on every scan
- API: GET /api/v2/scan/solana/:mint
- 46+ documented case studies

## API
Live at: https://nexusver.com

Scan a token:
  curl https://nexusver.com/api/v2/scan/solana/MINT_ADDRESS

Quick scan for integrations:
  curl https://nexusver.com/api/v2/scan/quick/solana/MINT_ADDRESS

Full docs: https://nexusver.com/docs
Scanner: https://nexusver.com/scan

## Archetypes
WALLET_FACTORY, ROTATION_OPERATOR, INDUSTRIAL_DEPLOYER,
EXCHANGE_FUNDED_DEPLOYER, INFRASTRUCTURE_HUB, PROFESSIONAL_CREATOR,
NEW_CREATOR, HIGH_FREQ_LOW_CONTEXT, CASUAL_CREATOR, WALLET_FACTORY_HUB

## Repository Structure
scripts/              Pipeline (enrichment, classification)
docs/                 Methodology, case studies, research
operator_classify.js  Classification engine
db_insert.js          Database layer
lib/                  Shared utilities

## Case Studies
46+ documented cases in docs/case-studies/

## License
See LICENSE file.

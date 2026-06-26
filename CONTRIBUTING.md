# Contributing to NexusVeritas Research

## How to Report a New Operator Pattern

If you find a Solana token with unusual deployer behavior:

1. Run a scan: GET /api/v2/scan/solana/:mint
2. Note the operator address and archetype
3. Open an issue with: token mint, deployer address, observed behavior

## Case Study Format

See docs/case-studies/ for examples.
Each case documents: token, deployer, signals, verdict, outcome.

## What We Are Looking For

- New operator archetypes not covered by current 10
- Cross-token operator patterns (same deployer, multiple tokens)
- Coordinated wallet clusters (same funder, same-day creation)
- Edge cases where archetype classification is wrong

## What We Do NOT Accept

- Token-level contract audits (use GoPlus or RugCheck for that)
- Price prediction or trading advice
- Personal data or doxxing of any kind

## Contact

X: @VeritasLab
GitHub: github.com/cryptaveritas

#!/usr/bin/env python3
"""
NexusVeritas API Client — Python example
Usage: python nexusveritas_client.py <mint_address>
"""

import urllib.request
import json
import sys

API_BASE = 'http://localhost:3001'

def scan_token(mint_address: str) -> dict:
    url = f'{API_BASE}/api/v2/scan/solana/{mint_address}'
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

def format_result(result: dict) -> str:
    score = result.get('score', 0)
    risk_class = result.get('risk_class', 'UNKNOWN')
    deployer = result.get('deployer_profile') or {}
    archetype = deployer.get('archetype', 'NOT FOUND')
    coverage = deployer.get('signal_coverage', 0)
    quality = deployer.get('data_source_quality', 'unknown')

    lines = [
        f'Score:    {score}/100 ({risk_class})',
        f'Archetype: {archetype}',
        f'Data:     {quality} (coverage: {coverage})',
        '',
        'Reasons:',
    ]
    for r in result.get('reasons', []):
        delta = r.get('delta', 0)
        sign = '+' if delta > 0 else ''
        lines.append(f'  [{r["severity"]:8}] {sign}{delta:3} {r["text"]}')

    return '
'.join(lines)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python nexusveritas_client.py <mint_address>')
        sys.exit(1)

    mint = sys.argv[1]
    print(f'Scanning {mint}...
')

    try:
        result = scan_token(mint)
        print(format_result(result))
    except Exception as e:
        print(f'Error: {e}')
        sys.exit(1)

"""
enrich_operators.py -- Universal RPC Enrichment (TD-001)
Usage: python scripts/pipeline/enrich_operators.py --limit 100 --provider alchemy

Supported providers: helius, alchemy, custom
Configure via .env:
  RPC_PROVIDER=alchemy
  ALCHEMY_API_KEY=xxx
  HELIUS_API_KEY=xxx
  CUSTOM_RPC_URL=https://...
"""
import os, sys, json, time, argparse, requests, psycopg2
from dotenv import load_dotenv
load_dotenv()

DB_URL = os.environ.get('DATABASE_URL')

PROVIDERS = {
    'helius':  'https://mainnet.helius-rpc.com/?api-key=' + os.environ.get('HELIUS_API_KEY', ''),
    'alchemy': 'https://solana-mainnet.g.alchemy.com/v2/' + os.environ.get('ALCHEMY_API_KEY', ''),
    'custom':  os.environ.get('CUSTOM_RPC_URL', ''),
}
RATE_LIMITS = {'helius': 0.2, 'alchemy': 0.1, 'custom': 0.2}

def get_active_rpc(provider):
    url = PROVIDERS.get(provider) or PROVIDERS['helius']
    sleep = RATE_LIMITS.get(provider, 0.2)
    print(f'RPC provider: {provider} -> {url[:40]}...')
    return url, sleep

def rpc(url, method, params, sleep):
    payload = {'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params}
    try:
        resp = requests.post(url, json=payload, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        if 'error' in data:
            return None
        return data.get('result')
    except Exception as e:
        print(f'  RPC error {method}: {e}')
        return None

def get_signatures(url, address, sleep, limit=50):
    result = rpc(url, 'getSignaturesForAddress', [address, {'limit': limit}], sleep)
    time.sleep(sleep)
    return result or []

def get_transaction(url, sig, sleep):
    result = rpc(url, 'getTransaction', [sig, {'encoding': 'json', 'maxSupportedTransactionVersion': 0}], sleep)
    time.sleep(sleep)
    return result

def analyze_wallet(url, address, sleep):
    signals = {
        'top_funder': None,
        'funding_sources_count': None,
        'total_incoming_sol': None,
        'recycling_loop': None,
        'split_init_pattern': None,
    }
    sigs = get_signatures(url, address, sleep, limit=100)
    if not sigs:
        return signals

    funders = {}
    total_incoming = 0.0
    outgoing_addresses = set()

    for sig_info in sigs[:20]:
        tx = get_transaction(url, sig_info['signature'], sleep)
        if not tx:
            continue
        meta = tx.get('meta', {})
        if not meta:
            continue
        account_keys = tx.get('transaction', {}).get('message', {}).get('accountKeys', [])
        pre_balances = meta.get('preBalances', [])
        post_balances = meta.get('postBalances', [])
        for i, key in enumerate(account_keys):
            if i >= len(pre_balances) or i >= len(post_balances):
                continue
            key_addr = key if isinstance(key, str) else key.get('pubkey', '')
            delta = (post_balances[i] - pre_balances[i]) / 1e9
            if key_addr == address and delta > 0:
                total_incoming += delta
                for j, other_key in enumerate(account_keys):
                    if j == i:
                        continue
                    other_addr = other_key if isinstance(other_key, str) else other_key.get('pubkey', '')
                    other_delta = (post_balances[j] - pre_balances[j]) / 1e9 if j < len(post_balances) else 0
                    if other_delta < -0.001:
                        funders[other_addr] = funders.get(other_addr, 0) + abs(other_delta)
            elif key_addr == address and delta < 0:
                for j, other_key in enumerate(account_keys):
                    if j == i:
                        continue
                    other_addr = other_key if isinstance(other_key, str) else other_key.get('pubkey', '')
                    other_delta = (post_balances[j] - pre_balances[j]) / 1e9 if j < len(post_balances) else 0
                    if other_delta > 0.001:
                        outgoing_addresses.add(other_addr)

    if funders:
        top_funder = max(funders, key=funders.get)
        signals['top_funder'] = top_funder
        signals['funding_sources_count'] = len(funders)
        signals['total_incoming_sol'] = round(total_incoming, 4)
        signals['recycling_loop'] = top_funder in outgoing_addresses
        small_funders = sum(1 for v in funders.values() if v < 0.01)
        signals['split_init_pattern'] = small_funders >= 3
    return signals

def main():
    parser = argparse.ArgumentParser(description='Enrich operators via RPC')
    parser.add_argument('--limit', type=int, default=100)
    parser.add_argument('--archetype', type=str, default=None)
    parser.add_argument('--min-tokens', type=int, default=2)
    parser.add_argument('--max-tokens', type=int, default=500)
    parser.add_argument('--provider', type=str, default=os.environ.get('RPC_PROVIDER', 'helius'))
    args = parser.parse_args()

    active_url, sleep = get_active_rpc(args.provider)

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    query = 'SELECT address, archetype, tokens_created, days_active FROM creators WHERE data_source_quality = %s AND tokens_created >= %s AND tokens_created <= %s'
    params = ['synthetic', args.min_tokens, args.max_tokens]
    if args.archetype:
        query += ' AND archetype = %s'
        params.append(args.archetype)
    query += ' ORDER BY tokens_created ASC LIMIT %s'
    params.append(args.limit)
    cur.execute(query, params)
    operators = cur.fetchall()
    print(f'Enriching {len(operators)} operators...')

    enriched = 0
    errors = 0
    for i, (address, archetype, tokens, days) in enumerate(operators):
        print(f'[{i+1}/{len(operators)}] {address[:12]}... ({archetype}, {tokens} tokens)', end=' ', flush=True)
        signals = analyze_wallet(active_url, address, sleep)
        if signals['top_funder']:
            cur.execute('''UPDATE creators SET
                behavior = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(
                COALESCE(behavior, %s::jsonb),
                %s, %s::jsonb), %s, %s::jsonb), %s, %s::jsonb), %s, %s::jsonb), %s, %s::jsonb),
                data_source_quality = %s WHERE address = %s''',
                ('{}', '{structural,top_funder}', json.dumps(signals['top_funder']),
                 '{structural,funding_sources_count}', json.dumps(signals['funding_sources_count']),
                 '{behavioral,total_incoming_sol}', json.dumps(signals['total_incoming_sol']),
                 '{behavioral,recycling_loop}', json.dumps(signals['recycling_loop']),
                 '{behavioral,split_init_pattern}', json.dumps(signals['split_init_pattern']),
                 'partial', address))
            conn.commit()
            enriched += 1
            print(f'-> funder={signals["top_funder"][:8]}... recycling={signals["recycling_loop"]}')
        else:
            errors += 1
            print('-> no signals found')

    print(f'\nDone! Enriched={enriched} Errors={errors}')
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()

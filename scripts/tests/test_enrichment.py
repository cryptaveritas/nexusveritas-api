"""
tests/test_enrichment.py -- Pipeline quality tests for RPC enrichment
Run: docker exec nexusveritas-worker pytest scripts/tests/ -v
"""
import pytest
import json
import os
import psycopg2
from dotenv import load_dotenv
load_dotenv()

def get_conn():
    return psycopg2.connect(os.environ.get('DATABASE_URL'))

class TestEnrichmentQuality:
    def test_partial_operators_have_top_funder(self):
        conn = get_conn(); cur = conn.cursor()
        cur.execute("""SELECT COUNT(*) FROM creators WHERE data_source_quality = 'partial' AND (behavior->'structural'->>'top_funder' IS NULL OR behavior->'structural'->>'top_funder' = 'null')""")
        count = cur.fetchone()[0]; cur.close(); conn.close()
        assert count == 0, f'{count} partial operators missing top_funder'

    def test_boolean_signals_are_not_false_for_synthetic(self):
        conn = get_conn(); cur = conn.cursor()
        cur.execute("""SELECT COUNT(*) FROM creators WHERE data_source_quality = 'synthetic' AND behavior->'behavioral'->>'recycling_loop' = 'false'""")
        count = cur.fetchone()[0]; cur.close(); conn.close()
        assert count == 0, f'{count} synthetic operators have false recycling_loop (should be null)'

    def test_funding_sources_count_not_zero_for_partial(self):
        conn = get_conn(); cur = conn.cursor()
        cur.execute("""SELECT COUNT(*) FROM creators WHERE data_source_quality = 'partial' AND (behavior->'structural'->>'funding_sources_count')::int = 0""")
        count = cur.fetchone()[0]; cur.close(); conn.close()
        assert count == 0, f'{count} partial operators have funding_sources_count=0 (should be >= 1)'

    def test_total_incoming_sol_not_negative(self):
        """total_incoming_sol must never be negative. Zero is allowed (FINDING_008 -- program-funded operators)."""
        conn = get_conn(); cur = conn.cursor()
        cur.execute("""SELECT COUNT(*) FROM creators WHERE data_source_quality = 'partial' AND (behavior->'behavioral'->>'total_incoming_sol')::float < 0""")
        count = cur.fetchone()[0]; cur.close(); conn.close()
        assert count == 0, f'{count} partial operators have negative total_incoming_sol'

    def test_sol_zero_with_sources_is_known_limitation(self):
        """WARNING test: sol=0 AND sources>0 is a known Helius limitation (FINDING_008). Count should stay <= 10."""
        conn = get_conn(); cur = conn.cursor()
        cur.execute("""SELECT COUNT(*) FROM creators WHERE data_source_quality = 'partial' AND (behavior->'behavioral'->>'total_incoming_sol')::float = 0 AND (behavior->'structural'->>'funding_sources_count')::int > 0""")
        count = cur.fetchone()[0]; cur.close(); conn.close()
        assert count <= 10, f'{count} operators with sol=0 AND sources>0 -- exceeds expected maximum (FINDING_008)'

    def test_helius_api_accessible(self):
        import requests
        key = os.environ.get('HELIUS_API_KEY', 'db0f7949-5202-450b-a7b9-64f7803a4bea')
        resp = requests.post(f'https://mainnet.helius-rpc.com/?api-key={key}', json={'jsonrpc': '2.0', 'id': 1, 'method': 'getSlot', 'params': []}, timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert 'result' in data
        assert isinstance(data['result'], int)

    def test_vectors_valid_after_enrichment(self):
        conn = get_conn(); cur = conn.cursor()
        cur.execute('SELECT COUNT(*) FROM creators WHERE vector_v2 IS NULL')
        count = cur.fetchone()[0]; cur.close(); conn.close()
        assert count == 0, f'{count} operators missing vector_v2'

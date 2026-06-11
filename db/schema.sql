-- NexusVeritas Database Schema v1
-- PostgreSQL + pgvector

CREATE EXTENSION IF NOT EXISTS vector;

-- Core creator profiles with behavior vectors
CREATE TABLE IF NOT EXISTS creators (
  address              TEXT PRIMARY KEY,
  first_seen           DATE,
  last_seen            DATE,
  archetype            TEXT,
  confidence           FLOAT,
  behavior             JSONB,
  vector               vector(7),
  tokens_created       INT,
  days_active          INT,
  total_signatures     INT,
  updated_at           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON creators USING ivfflat (vector vector_cosine_ops);
CREATE INDEX ON creators (archetype);
CREATE INDEX ON creators (first_seen);

-- Confirmed operators
CREATE TABLE IF NOT EXISTS operators (
  operator_id          TEXT PRIMARY KEY,
  archetype            TEXT,
  confidence           FLOAT,
  network_id           TEXT,
  known_creators       TEXT[],
  known_tokens         TEXT[],
  risk_baseline        TEXT,
  status               TEXT DEFAULT 'candidate',
  created_at           TIMESTAMP DEFAULT NOW()
);

-- Clusters
CREATE TABLE IF NOT EXISTS clusters (
  cluster_id           TEXT PRIMARY KEY,
  hub_wallet           TEXT,
  creator_count        INT,
  confidence           FLOAT,
  signals              TEXT[],
  status               TEXT DEFAULT 'candidate',
  created_at           TIMESTAMP DEFAULT NOW()
);

-- Signals log
CREATE TABLE IF NOT EXISTS signals (
  id                   SERIAL PRIMARY KEY,
  creator              TEXT REFERENCES creators(address),
  signal_name          TEXT,
  value                JSONB,
  detected_at          TIMESTAMP DEFAULT NOW()
);

-- Candidate matches queue (Active Learning)
CREATE TABLE IF NOT EXISTS candidate_matches (
  id                   SERIAL PRIMARY KEY,
  operator_a           TEXT,
  operator_b           TEXT,
  similarity           FLOAT,
  matched_signals      TEXT[],
  status               TEXT DEFAULT 'pending',
  created_at           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON candidate_matches (status);
CREATE INDEX ON candidate_matches (similarity DESC);

-- Snapshots per pipeline run
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id                   SERIAL PRIMARY KEY,
  run_date             DATE,
  tokens_found         INT,
  creators_analyzed    INT,
  new_creators         INT,
  clusters_found       INT,
  candidate_matches    INT,
  ran_at               TIMESTAMP DEFAULT NOW()
);
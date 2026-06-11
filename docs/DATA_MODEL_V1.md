# NexusVeritas — Data Model v1

## Core Entities

```
Creator
  address         TEXT PK
  first_seen      DATE
  last_seen       DATE
  archetype       TEXT           CASUAL/INDUSTRIAL/WALLET_FACTORY/...
  confidence      FLOAT
  behavior        JSONB          full behavior_profile
  vector          vector(7)      pgvector for similarity
  updated_at      TIMESTAMP

Operator
  operator_id     TEXT PK        OP_001, OP_002...
  archetype       TEXT
  confidence      FLOAT
  network_id      TEXT FK
  known_creators  TEXT[]
  known_tokens    TEXT[]
  risk_baseline   TEXT           low/neutral/elevated/high
  status          TEXT           candidate/confirmed/rejected

Cluster
  cluster_id      TEXT PK        CLUSTER_001...
  network_id      TEXT
  hub_wallet      TEXT
  creator_count   INT
  confidence      FLOAT
  signals         TEXT[]
  status          TEXT           candidate/confirmed

Signal
  id              SERIAL PK
  creator         TEXT FK
  signal_name     TEXT           recycling_loop/split_init/...
  value           JSONB
  detected_at     TIMESTAMP

CandidateMatch
  id              SERIAL PK
  operator_a      TEXT FK
  operator_b      TEXT FK
  similarity      FLOAT
  matched_signals TEXT[]
  status          TEXT           pending/confirmed/rejected
  created_at      TIMESTAMP
```

## Relationships

```
Creator    → Operator     (many-to-one)
Creator    → Cluster      (many-to-one)
Creator    → Signal       (one-to-many)
Operator   → Cluster      (many-to-one)
Operator   → Operator     (via CandidateMatch)
Cluster    → Network      (many-to-one)
```

## Behavior Vector (7 dimensions)

```
[0] wallet_age_days
[1] funding_sources_count
[2] funding_concentration
[3] transfer_count
[4] total_incoming_sol
[5] tokens_created     (normalized)
[6] days_active
```

## Pipeline

```
find_tokens.js
  ↓
enrich_creators.js      → behavior_profile
  ↓
operator_classify.js    → archetype + confidence
  ↓
db_insert.js            → creators table + vector
  ↓
find_similar.js         → CandidateMatch queue
  ↓
Human review            → confirm/reject
  ↓
operators table         → Knowledge Base
```

## Scale Thresholds

```
< 1000 creators     PostgreSQL + pgvector (current target)
< 5000 operators    PostgreSQL + graph queries
> 5000 operators    Consider Neo4j / Memgraph
> 100k relations    Graph DB mandatory
```
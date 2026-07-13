
---

## Addendum 2026-06-14: принципы из v3-аудита (применены к текущей фазе, не как новые слои)

v3-документ предложил архитектуру с causal graph + adversarial simulation + Memgraph + CryptaVeritas-as-anchor.
Это Phase 4-5 материал. Сам документ предупреждает про "truth inflation" — и сам является примером:
4 новых слоя над signal layer, который СЕГОДНЯ (FINDING_006) доказанно не различает операторов (P50=1.0).

Извлечены 4 принципа, применимые СЕЙЧАС без новых слоёв:

### 1. Three-test validation (для КАЖДОЙ новой фичи вектора/сигнала)
- Falsifiable: можно доказать что фича ошибается?
- Affects decision: меняет ли similarity/classification/score?
- Replayable: пересчитывается детерминированно из behavior JSONB?

Пример: funder_degree прошёл все три (415→404). Решение на тесте, не интуиции.

### 2. Layer taxonomy — документирует существующее, без новых слоёв
- Signal layer = vector_v2.x (только risk_score/similarity)
- Structural layer = operator_class + matched_signals (1-2 причины "почему")
- Proof layer = CryptaVeritas commit-reveal (verifiable fact)

Полезно для документации Organizations API: risk_score (signal) vs matched_signals (structural).

### 3. Collapse guardrail (явное ограничение Q3/Q4)
НЕ добавлять causal graph / adversarial simulation / CryptaVeritas-as-anchor до:
P50<0.85 на 1000+ creators (метрика из FINDING_006). Явный gate, не календарная дата.

### 4. Future constraints (для Q4+, НЕ сейчас)
- Causal graph: развитие build_graph.js + top_funder (сегодняшний creator->funder edge —
  основа для causal chain позже)
- AVG: training-time только, НЕ runtime. Требует рабочего signal layer как объекта симуляции.
- CryptaVeritas as ground truth anchor: редкий/дорогой/неделегируемый. НЕ каждый scan,
  только периодическая верификация выборки.

## Итог addendum
v3-документ добавляет 1 валидационный инструмент (3-test, уже используется), 1 переименование
(layer taxonomy для будущего API), 1 явный gate (P50<0.85 перед Q4-слоями), заметки-ограничения
для Q4 против overengineering. Задач сейчас не добавляет.

---

## Addendum 2026-06-15: Signal layer gate — UPDATED

Previous gate (2026-06-14 addendum): "no causal-graph/adversarial-sim/proof-anchor
work until P50<0.85 @ 1000+ creators".

FINDING_006 resolved (see Addendum 3): global P50 was the wrong metric. Signal
layer validated via per-archetype + cross-archetype analysis at n=1012:
within-archetype nearest-neighbor match = 90.3%.

New gate: signal layer considered VALIDATED. Within-archetype match rate
(90.3% @ n=1012) is the tracked metric going forward, not global P50. Re-check
after future scaling rounds (target: maintain or improve; drop below ~80% would
warrant re-investigation).

Unblocked: Organizations API (/v2/scan/ with risk_score + matched_signals) can
proceed now. Causal graph / adversarial sim / CryptaVeritas-as-anchor remain
Q4+ as before.

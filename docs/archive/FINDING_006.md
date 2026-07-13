# FINDING_006 — P50 collapse: корень в недостатке признаков, не в векторе

**Date:** 2026-06-14
**Severity:** HIGH (блокирует similarity / candidate_discovery)
**Status:** Diagnosed, fix requires new data collection

## Кратко
P50 nearest-neighbor = 1.0 (70%+ дублей) НЕ лечится дизайном вектора.
Причина: гипер-активная популяция creators вырождена в имеющихся 4-5 признаках.

## Путь диагностики (что проверено и отвергнуто)
1. "нужны temporal vectors" — отвергнута. P50 мерялся как nearest-neighbor, не within-group.
2. "потолок пагинации getOps" — частично верна, фикс 3000→10000 лишь сдвинул потолок. 458/565 (81%) на потолках.
3. "saturation clipping toV2 [10]/[12]" — [12] days_active починилась, [10] заменена на burstiness.
4. "mean-смещение → cosine collapse" — отвергнута. Z-score cosine не помог (P50 0.9998).
5. "балласт из константных компонент" — отвергнута. Все 25 компонент std>0.17.
6. ИТОГ: z-score euclid P25=0.00 — РЕАЛЬНЫЕ точные дубли в данных, не геометрия.

## Корневая причина (подтверждена)
Кошельки на потолке total_signatures=10000:
- 177 идентичны: funding_concentration=1.00, sources=1
- 76 идентичны: concentration=0.00, sources=0
- 253/300 (84%) в 2 идентичных профиля
Имеющиеся 4 признака физически не различают гипер-активную популяцию.

## Почему дешёвые фиксы недоступны
- Вектор: полировка над вырожденными фичами бесполезна.
- Граф (build_graph.js): работает над ХАБАМИ, не creators. Связь creator→funder не сохраняется.
- Временной паттерн: не собирается. Новый RPC.
- DEX-флоу (VTD z-score): не собирается.

## Вывод
Снизить P50 ниже ~0.94 нельзя без нового КЛАССА данных. Любой путь = доработка enrichment + прогон.

## Рекомендация (следующий цикл)
Сохранять top_funder (адрес топ-источника) в getFunding.
Даёт: граф-фичу через hub_score фандера + связь creator→hub для кластеризации.
Переиспользует build_graph.js. Одна строка + прогон.

## Побочный фикс (сделан сегодня)
db_insert.js ON CONFLICT DO UPDATE не синхронизировал скалярные колонки — отставали от JSONB.
Исправлено. Векторы не затронуты (из JSONB), но SQL-замеры по колонкам врали.

## Позитив
"Неразличимость" 253 кошельков — СИГНАЛ: гипер-активность + один источник + полная концентрация
= вероятный factory/bot-кластер. similarity честно говорит "один тип" — находка, не провал.

---

## Addendum (2026-06-14, после top_funder)

top_funder реализован (9342995), полный ре-enrichment 565 проведён (~21 мин).

funder_degree distribution: p25=p50=p75=1, p95=6, max=8. null=88/565 (16%).

Эффект на P50: dupes 415→404 (baseline P50=1.0000 в обоих случаях). Минимальный.

Причина: 390/565 (69%) имеют УНИКАЛЬНОГО top_funder в этой выборке — разреженность при n=565.

Вывод: funder-overlap сигнал реален (p95=6, max=8), но требует БОЛЬШЕ creators для плотности.
Сходится с приоритетом #3 (масштабирование до 1000+), независимо запланированным.
Масштабирование решает охват архетипов И плотность funder_degree одновременно.

top_funder остаётся в pipeline — funder_degree растёт органически при масштабировании.

## Финальный статус P50 на 2026-06-14
P50=1.0000, dupes=404/565 (71.5%). Цель <0.85 не достигнута.
Причина: недостаток признаков (FINDING_006) + недостаток объёма для funder-overlap (addendum).
Оба упираются в один шаг: scale to 1000+. P50 переоценивается ПОСЛЕ масштабирования.

---

## Addendum 2 (2026-06-14, после масштабирования до 1012)

Масштабирование 565->1012 завершено. funder_degree p95 НЕ изменился (6->6, max 8->11),
null top_funder вырос 16%->33%. Гипотеза addendum НЕ подтвердилась.

Глобально: P50=0.9999, dupes=663/1012 (65.5%). Почти не сдвинулось с n=565 (70.6%).

## КЛЮЧЕВАЯ ПЕРЕФОРМУЛИРОВКА: коллапс per-archetype, не глобальный

| Archetype                | n   | P50    | dupes %  |
|---------------------------|-----|--------|----------|
| WALLET_FACTORY            | 166 | 1.0000 | 87.3%    |
| EXCHANGE_FUNDED_DEPLOYER  | 31  | 1.0000 | 83.9%    |
| INDUSTRIAL_DEPLOYER       | 508 | 1.0000 | 75.2%    |
| ROTATION_OPERATOR         | 44  | 0.9999 | 75.0%    |
| INFRASTRUCTURE_HUB        | 36  | 0.9999 | 72.2%    |
| WALLET_FACTORY_HUB        | 4   | 0.9169 | 50.0%    |
| PROFESSIONAL_CREATOR      | 171 | 0.9935 | 31.6%    |
| CASUAL_CREATOR            | 52  | 0.9756 | 7.7%     |

ALL except INDUSTRIAL_DEPLOYER: n=504, P50=0.9998, dupes=57.7% — коллапс СИСТЕМНЫЙ.

Паттерн: CASUAL_CREATOR и PROFESSIONAL_CREATOR ("человеческие" паттерны) здоровы.
6 остальных архетипов ("автоматизированные") коллапсируют между собой независимо
от лейбла.

## Новая гипотеза (не проверена)

25 признаков различают "человек vs бот" (работает), но НЕ "какой тип бота" —
все 6 авто-архетипов сходятся к одинаковым extremes. Классификатор различает
их через rule-based пороги, вектор не кодирует это геометрически.

Направления:
1. Timing regularity (variance межтранзакционных интервалов)
2. Multi-token correlation (паттерн МЕЖДУ токенами одного оператора)
3. Признать: для "роботов" задача = detection, не similarity — две разные задачи

## Статус на конец 2026-06-14
8/8 signals, pagination, v2.1, top_funder, scale to 1012, CONCURRENCY 2.5x — все
реализованы. P50 глобально не достиг цели, но диагноз продвинулся: коллапс
per-archetype. Здоровые классы (CASUAL/PROFESSIONAL, 22%) пригодны для similarity
СЕЙЧАС. Остальные 78% — новая категория признаков или переформулировка задачи.

---

## Addendum 3 (2026-06-15, morning) — vector design VALIDATED, P50 was wrong metric

Cross-archetype centroid similarity matrix (n=1012) computed.

best-match WITHIN same archetype: 914/1012 (90.3%)

Key finding: vector geometrically separates archetypes well. Global P50~1.0
(FINDING_006 original) measured the wrong thing — tight within-category
similarity in naturally homogeneous sub-populations (especially "automated"
archetypes) is EXPECTED, not a defect.

## The one apparent anomaly: INFRASTRUCTURE_HUB <-> EXCHANGE_FUNDED_DEPLOYER = 0.997

Root cause: EXCHANGE_FUNDED_DEPLOYER is, BY CONSTRUCTION, a post-hoc relabel of
INFRASTRUCTURE_HUB (same vector, same confidence, +1 tag) when
sol>=100 && sources>=3 && conc<=0.8 && tokens>=500.

4 split criteria (INFRA n=36 vs EXCHANGE n=31):
- total_incoming_sol: 92.6 vs 225.9 (2.4x)
- funding_sources_count: 35.9 vs 7.8 (4.6x, but saturated in vector)
- funding_concentration: 0.172 vs 0.167 — no signal
- tokens_created: 2104 vs 2479 — both saturated, no signal

Tested fix: log1p(sources)/log1p(50) for [23]. Result: 0.997 -> 0.9969. Negligible.

Why: in 25-dim space where 24 dims are ~identical between centroids, shifting
1 dim by 0.36 can't move overall cosine. Not a vector flaw — confirms
EXCHANGE_FUNDED_DEPLOYER and INFRASTRUCTURE_HUB ARE the same underlying
population (0.997 is correct).

## CONCLUSION
Vector design (v2.1) is sound, no further vector fixes needed. Treat
EXCHANGE_FUNDED_DEPLOYER as a TAG of INFRASTRUCTURE_HUB, not a sibling archetype
with its own expected centroid — taxonomy decision, not code fix.

[23] experimental change NOT committed (zero net benefit).

## FINDING_006 — RESOLVED
Original P50~1.0 concern was wrong global metric for naturally tight categorical
sub-populations. Per-archetype + cross-archetype analysis shows signal layer
works as intended (90.3% within-archetype nearest-neighbor). Ready for
Organizations API / candidate_discovery — signal layer no longer a blocker.

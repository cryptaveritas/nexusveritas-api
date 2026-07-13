
---

## РЕЗУЛЬТАТ ТЕСТА P0 (2026-06-14, вечер): keepAlive — НЕ ПОМОГ

Измерено на tokens_profile.txt (9 адресов), limit:1000:
- NO keepAlive:   avg=907ms
- WITH keepAlive: avg=892ms (-1.7%, в пределах шума)

Вывод: bottleneck НЕ в TCP/TLS handshake. Для residential proxy латентность,
по всей видимости, определяется самим proxy-tunnel routing через exit node —
эта задержка одинакова для нового и переиспользуемого соединения.

P0 закрыт без изменений в коде. CONCURRENCY=15 остаётся единственным найденным
рычагом ускорения (2.5x, подтверждено). P1 (HNSW) и P2/P3 остаются в силе.

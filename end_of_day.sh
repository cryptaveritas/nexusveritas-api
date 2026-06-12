#!/bin/bash
DATE=$(date +%Y-%m-%d)
echo "=== END OF DAY: $DATE ==="

# 1. Напоминание создать отчёт
echo ""
echo "✍️  Не забудь создать отчёт: docs/plan/$DATE.md"
echo "    Что сделано? Что в прогрессе? Что завтра?"
echo ""

# 2. Копировать на рабочий стол
cp ~/Desktop/nexusveritas-api/docs/plan/*.md ~/Desktop/Nexus-Internal-Docs/ 2>/dev/null
echo "✅ Скопировано на рабочий стол"

# 3. Пушим в приватный репо
cd ~/Desktop/nexusveritas-api/docs/plan
git add . && git commit -m "plan: $DATE" && git push
echo "✅ Запушено в приватный репо"

# 4. Пушим основной репо
cd ~/Desktop/nexusveritas-api
git add -A && git commit -m "chore: end of day $DATE" && git push
echo "✅ Основной репо запушен"

echo ""
echo "=== ГОТОВО ==="

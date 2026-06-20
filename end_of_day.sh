#!/bin/bash
DATE=$(date +%Y-%m-%d)
echo "=== END OF DAY: $DATE ==="

# 1. Напоминание создать отчёт
echo ""
REPORT_FILE="docs/plan/$DATE.md"
if [ ! -f "$REPORT_FILE" ]; then
  echo "⚠️  Отчёт за сегодня не найден: $REPORT_FILE"
  read -p "Продолжить без отчёта? (y/N) " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Прервано. Создай $REPORT_FILE и запусти end_of_day.sh снова."
    exit 1
  fi
else
  echo "✅ Отчёт найден: $REPORT_FILE"
fi
echo ""

# 2. Sync internal docs
bash ~/Desktop/nexusveritas-api/sync_docs.sh

# 2. Копировать на рабочий стол
cp ~/Desktop/nexusveritas-api/docs/plan/*.md ~/Desktop/Nexus-Internal-Docs/ 2>/dev/null
echo "✅ Скопировано на рабочий стол"

# 3. Пушим в приватный репо
cd ~/Desktop/nexusveritas-api/docs/plan
git add . && git commit -m "plan: $DATE" && git push
echo "✅ Запушено в приватный репо"

# 4. Пушим основной репо
cd ~/Desktop/nexusveritas-api
git add --ignore-errors -- . ":!nexusveritas-api" && git commit -m "chore: end of day $DATE" && git push
echo "✅ Основной репо запушен"

echo ""
echo "=== ГОТОВО ==="

#!/bin/bash
# Sync internal docs to private repo
DATE=$(date +%Y-%m-%d)

SRC=~/Desktop/nexusveritas-api/docs/plan
DST=~/Desktop/nexusveritas-internal/docs

echo "=== SYNC DOCS: $DATE ==="

# Copy all .md files
cp $SRC/*.md $DST/ 2>/dev/null && echo "✅ Скопировано: $SRC → $DST" || echo "⚠️  Нет файлов для копирования"

# Commit and push private repo
cd ~/Desktop/nexusveritas-internal
git add docs/
git diff --cached --quiet && echo "ℹ️  Нет изменений" || (git commit -m "docs: sync $DATE" && git push --set-upstream origin master && echo "✅ Запушено в приватный репо")

echo "=== ГОТОВО ==="

#!/bin/bash
API_KEY="l5ROLaqAlHZ3DBnxZ8yyEoOLLXogcx3C"
EXEC_ID="01KVWVXP7TN3Q4K79JJ1HQA2YN"
OUTPUT="/c/Users/User/Desktop/nexusveritas-api/pump_deployers.csv"
LIMIT=200
OFFSET=0
TOTAL=0

echo "deployer,tokens_created,first_seen,last_seen" > $OUTPUT

while true; do
  URL="https://api.dune.com/api/v1/execution/${EXEC_ID}/results?limit=${LIMIT}&offset=${OFFSET}"
  RESULT=$(curl -s --noproxy "*" -H "x-dune-api-key: ${API_KEY}" "$URL")
  ROWS=$(echo $RESULT | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const r=JSON.parse(d).result?.rows||[];r.forEach(x=>console.log(x.deployer+','+x.tokens_created+','+x.first_seen+','+x.last_seen));process.stdout.write('COUNT:'+r.length+'\n',()=>{})})" 2>/dev/null)
  COUNT=$(echo "$ROWS" | grep "COUNT:" | cut -d: -f2)
  echo "$ROWS" | grep -v "COUNT:" >> $OUTPUT
  TOTAL=$((TOTAL + COUNT))
  echo "Downloaded: $TOTAL rows..."
  if [ "$COUNT" -lt "$LIMIT" ]; then break; fi
  OFFSET=$((OFFSET + LIMIT))
  sleep 0.3
done

echo "Done! Total: $TOTAL rows saved to $OUTPUT"
wc -l $OUTPUT

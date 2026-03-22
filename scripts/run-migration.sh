#!/bin/bash
# 7zap → Catalog Migration Runner
# Lokal makineden batch çağrıları yaparak migration'ı otomatize eder.
# Kullanım: ./scripts/run-migration.sh [start_id] [batch_size]

API="https://api.parcabizden.com.tr"
LAST_ID=${1:-0}
BATCH=${2:-50000}
TOTAL_INSERTED=0
TOTAL_SKIPPED=0
TOTAL_PV=0
BATCH_NUM=0
START_TIME=$(date +%s)

echo "=== 7zap Migration Runner ==="
echo "Başlangıç ID: $LAST_ID | Batch: $BATCH"
echo ""

while true; do
    BATCH_NUM=$((BATCH_NUM + 1))

    # API çağrısı
    RESPONSE=$(curl -sL --max-time 90 "$API/?action=migrate_7zap&step=5&offset=$LAST_ID&batch=$BATCH" 2>/dev/null)

    # JSON parse
    STATUS=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','error'))" 2>/dev/null)

    if [ "$STATUS" = "complete" ]; then
        echo ""
        echo "=== TAMAMLANDI ==="
        ELAPSED=$(($(date +%s) - START_TIME))
        echo "Toplam batch: $BATCH_NUM | Toplam süre: ${ELAPSED}s"
        echo "Toplam eklenen: $TOTAL_INSERTED | Atlanan: $TOTAL_SKIPPED | PV: $TOTAL_PV"
        break
    fi

    if [ "$STATUS" = "in_progress" ]; then
        # Parse values
        INSERTED=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('inserted',0))" 2>/dev/null)
        SKIPPED=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('skipped_duplicate',0))" 2>/dev/null)
        PV=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('pv_inserted',0))" 2>/dev/null)
        NEXT=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('next_offset',0))" 2>/dev/null)
        ELAPSED_BATCH=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('elapsed_sec',0))" 2>/dev/null)

        TOTAL_INSERTED=$((TOTAL_INSERTED + INSERTED))
        TOTAL_SKIPPED=$((TOTAL_SKIPPED + SKIPPED))
        TOTAL_PV=$((TOTAL_PV + PV))
        LAST_ID=$NEXT

        # Her 5 batch'te rapor
        if [ $((BATCH_NUM % 5)) -eq 0 ]; then
            ELAPSED=$(($(date +%s) - START_TIME))
            echo "Batch $BATCH_NUM | last_id=$LAST_ID | +$INSERTED ins | +$SKIPPED skip | total=$TOTAL_INSERTED | ${ELAPSED_BATCH}s | toplam=${ELAPSED}s"
        fi
    else
        echo "HATA: $RESPONSE"
        echo "Son ID: $LAST_ID"
        echo "1 dakika bekleyip tekrar deneniyor..."
        sleep 60
    fi
done

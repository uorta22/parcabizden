#!/bin/bash
# Extract unique diagram URLs from 7zap_merged.db → public/data/diagrams/{brand}.json
# Usage: bash scripts/extract-diagrams.sh [path-to-7zap_merged.db]

DB="${1:-/Users/ufukorta/Downloads/7zap_merged.db}"
OUT_DIR="$(dirname "$0")/../public/data/diagrams"
mkdir -p "$OUT_DIR"

echo "Extracting diagram data from $DB..."

# Get all brands with diagrams
BRANDS=$(sqlite3 "$DB" "SELECT DISTINCT brand_slug FROM parts WHERE diagram_url <> '' ORDER BY brand_slug")

for BRAND in $BRANDS; do
  echo -n "  $BRAND ... "

  # Export CSV: generation_slug|node_name_en|diagram_url (unique combos)
  # We take the first diagram_url per (generation_slug, node_name_en) combo
  sqlite3 "$DB" "
    SELECT generation_slug, node_name_en, diagram_url
    FROM (
      SELECT generation_slug, node_name_en, diagram_url,
             ROW_NUMBER() OVER (PARTITION BY generation_slug, node_name_en ORDER BY rowid) as rn
      FROM parts
      WHERE brand_slug = '$BRAND' AND diagram_url <> ''
    )
    WHERE rn = 1
    ORDER BY generation_slug, node_name_en
  " | python3 -c "
import sys, json

data = {}
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    parts = line.split('|')
    if len(parts) < 3:
        continue
    gen_slug = parts[0]
    node_name = parts[1]
    diagram_url = '|'.join(parts[2:])  # URL might contain |

    if gen_slug not in data:
        data[gen_slug] = {}
    data[gen_slug][node_name] = diagram_url

json.dump(data, sys.stdout, separators=(',', ':'))
" > "$OUT_DIR/$BRAND.json"

  SIZE=$(wc -c < "$OUT_DIR/$BRAND.json" | tr -d ' ')
  SIZE_KB=$((SIZE / 1024))
  echo "${SIZE_KB}KB"
done

echo ""
echo "Done! Total files:"
ls -la "$OUT_DIR"/*.json | wc -l
echo "Total size:"
du -sh "$OUT_DIR"

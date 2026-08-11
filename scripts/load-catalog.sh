#!/usr/bin/env bash
# Araç kataloğunu Supabase'e yükler.
#
# Bağlantı dizesi .env.supabase.local'dan okunuyor ve hiçbir yere
# yazdırılmıyor; dosya .gitignore'daki .env*.local kalıbına giriyor.
set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE="/Users/ufukorta/Downloads/parcabizden/.env.supabase.local"
[ -f "$ENV_FILE" ] || { echo "HATA: $ENV_FILE yok"; exit 1; }
set -a; . "$ENV_FILE"; set +a
[ -n "${SUPABASE_DB_URL:-}" ] || { echo "HATA: SUPABASE_DB_URL bos"; exit 1; }

run() {
  printf '  %-34s' "$(basename "$1")"
  psql "$SUPABASE_DB_URL" -q -v ON_ERROR_STOP=1 -f "$1" && echo "ok"
}

echo "== cografya =="
run pg/00_geo.sql
echo "== marka / model / arac =="
for f in pg/vehicle_models_*.sql pg/vehicles_*.sql; do run "$f"; done
echo "== teknik ozellikler (51 parca) =="
for f in pg/vehicle_attributes_*.sql; do run "$f"; done

echo
psql "$SUPABASE_DB_URL" -q -c "
select 'cities' t, count(*) n from cities
union all select 'districts', count(*) from districts
union all select 'manufacturers', count(*) from vehicle_manufacturers
union all select 'models', count(*) from vehicle_models
union all select 'vehicles', count(*) from vehicles
union all select 'attributes', count(*) from vehicle_attributes;"

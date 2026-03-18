#!/usr/bin/env python3
"""
SQL export dosyalarını HTTP üzerinden sunucuya gönderir.
migrate-receiver.php endpoint'ine POST ile SQL batch'leri gönderir.

Kullanım:
  python3 scripts/push_to_server.py                    # tüm tablolar
  python3 scripts/push_to_server.py cross_ref           # tek tablo
  python3 scripts/push_to_server.py parts part_vehicles  # birden fazla
"""

import os
import sys
import time
import glob
import requests

RECEIVER_URL = "https://api.parcabizden.com.tr/migrate-receiver.php"
TOKEN = "pBzD_import_2026_xK9"
SQL_DIR = os.path.join(os.path.dirname(__file__), "sql_export")

# Tablo sırası
ALL_TABLES = [
    "catalog_cross_ref",
    "catalog_vehicle_attributes",
    "catalog_parts",
    "catalog_part_images",
    "catalog_part_vehicles",
]


def check_status():
    """Sunucudaki tablo durumlarını kontrol et"""
    try:
        r = requests.get(f"{RECEIVER_URL}?token={TOKEN}&action=status", timeout=15)
        data = r.json()
        if "tables" in data:
            return data["tables"]
    except Exception as e:
        print(f"  Durum kontrol hatası: {e}")
    return {}


def send_sql(sql_content: str) -> dict:
    """SQL batch'ini sunucuya gönder"""
    r = requests.post(
        f"{RECEIVER_URL}?token={TOKEN}&action=exec",
        data=sql_content.encode("utf-8"),
        headers={"Content-Type": "text/plain; charset=utf-8"},
        timeout=120,
    )
    return r.json()


def process_file(filepath: str) -> tuple[int, int]:
    """Tek SQL dosyasını oku ve sunucuya gönder"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # SET komutlarını ve yorumları filtrele, sadece INSERT'leri gönder
    lines = []
    for line in content.split("\n"):
        stripped = line.strip()
        if stripped.startswith("--") or stripped == "":
            continue
        if stripped.startswith("SET ") or stripped.startswith("COMMIT"):
            continue
        lines.append(line)

    sql = "\n".join(lines)
    if not sql.strip():
        return 0, 0

    result = send_sql(sql)
    return result.get("executed", 0), result.get("errors", 0)


def upload_table(table_prefix: str):
    """Bir tablonun tüm part dosyalarını sırayla gönder"""
    # Part dosyalarını bul
    pattern = os.path.join(SQL_DIR, f"{table_prefix}_part_*.sql")
    files = sorted(glob.glob(pattern))

    # Tek dosya kontrolü (küçük tablolar)
    single = os.path.join(SQL_DIR, f"{table_prefix}.sql")
    if not files and os.path.exists(single):
        files = [single]

    if not files:
        print(f"  Dosya bulunamadı: {pattern}")
        return

    total_files = len(files)
    total_executed = 0
    total_errors = 0
    start_time = time.time()

    print(f"  Dosya sayısı: {total_files}")
    print()

    for i, filepath in enumerate(files, 1):
        fname = os.path.basename(filepath)
        fsize_kb = os.path.getsize(filepath) / 1024

        try:
            executed, errors = process_file(filepath)
            total_executed += executed
            total_errors += errors

            pct = (i / total_files) * 100
            elapsed = time.time() - start_time
            rate = i / elapsed if elapsed > 0 else 0
            eta = (total_files - i) / rate if rate > 0 else 0

            status = "✓" if errors == 0 else f"⚠ {errors} hata"
            print(
                f"\r  [{i:>{len(str(total_files))}}/{total_files}] "
                f"{pct:5.1f}% — {fname} ({fsize_kb:.0f}KB) — {status} "
                f"— ETA: {int(eta//60)}:{int(eta%60):02d}",
                end="",
                flush=True,
            )
        except requests.exceptions.Timeout:
            print(f"\n  ⚠ Timeout: {fname} — yeniden deneniyor...")
            time.sleep(3)
            try:
                executed, errors = process_file(filepath)
                total_executed += executed
                total_errors += errors
            except Exception as e:
                print(f"\n  ✗ Başarısız: {fname} — {e}")
                total_errors += 1
        except Exception as e:
            print(f"\n  ✗ Hata: {fname} — {e}")
            total_errors += 1

    elapsed = time.time() - start_time
    print()
    print()
    print(f"  ✓ Tamamlandı: {total_executed} sorgu, {total_errors} hata, {elapsed:.0f} saniye")


def main():
    print("=" * 55)
    print("  ParcaBizden — SQL → MySQL Migration (HTTP)")
    print("=" * 55)
    print()

    # Sunucu durumunu kontrol et
    print("Sunucu durumu kontrol ediliyor...")
    status = check_status()
    if not status:
        print("HATA: Sunucuya bağlanılamadı!")
        sys.exit(1)

    for table, count in sorted(status.items()):
        print(f"  {table}: {count:,}")
    print()

    # Hangi tabloları işleyeceğiz?
    targets = sys.argv[1:] if len(sys.argv) > 1 else None

    if targets:
        tables = [f"catalog_{t}" if not t.startswith("catalog_") else t for t in targets]
    else:
        tables = ALL_TABLES

    for table in tables:
        print(f"{'━' * 55}")
        print(f"  {table}")
        print(f"{'━' * 55}")
        upload_table(table)
        print()

        # Ara durum
        new_status = check_status()
        if new_status and table in new_status:
            print(f"  MySQL satır sayısı: {new_status[table]:,}")
        print()

    print("=" * 55)
    print("  TÜM İŞLEMLER TAMAMLANDI")
    print("=" * 55)
    final = check_status()
    for table, count in sorted(final.items()):
        print(f"  {table}: {count:,}")


if __name__ == "__main__":
    main()

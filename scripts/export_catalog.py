#!/usr/bin/env python3
"""
parcabizden_v3.db (SQLite) → MySQL INSERT SQL dosyaları üretici.

Her tablo için ayrı SQL dosyası oluşturur.
Büyük tablolar otomatik olarak 2MB parçalara bölünür.

Kullanım: python3 scripts/export_catalog.py
Çıktı:    scripts/sql_export/ dizini
"""

import sqlite3
import os
import sys
import time

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'Downloads', 'database', 'parcabizden_v3.db')
# Alternatif konum
if not os.path.exists(DB_PATH):
    DB_PATH = '/Users/ufukorta/Downloads/database/parcabizden_v3.db'

OUT_DIR = os.path.join(os.path.dirname(__file__), 'sql_export')
BATCH_SIZE = 500          # INSERT başına satır sayısı
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2 MB per file (phpMyAdmin limiti)
LARGE_TABLE_BATCH = 5000  # Büyük tablolar için batch boyutu

# Tablo tanımları: (sqlite_table, mysql_table, columns, is_large)
TABLES = [
    # Aşama 1 — Küçük tablolar
    {
        'sqlite': 'manufacturers',
        'mysql': 'catalog_manufacturers',
        'columns': ['id', 'name', 'matchcode'],
        'large': False,
    },
    {
        'sqlite': 'models',
        'mysql': 'catalog_models',
        'columns': ['id', 'manufacturer_id', 'name', 'full_name', 'year_range'],
        'large': False,
    },
    {
        'sqlite': 'vehicles',
        'mysql': 'catalog_vehicles',
        'columns': ['id', 'model_id', 'description', 'full_name', 'year_from', 'year_to', 'can_be_displayed'],
        'large': False,
    },
    {
        'sqlite': 'categories',
        'mysql': 'catalog_categories',
        'columns': ['id', 'assembly_group_en', 'description_en', 'normalized_en', 'usage_en',
                     'assembly_group_tr', 'description_tr', 'normalized_tr', 'usage_tr'],
        'large': False,
    },
    {
        'sqlite': 'suppliers',
        'mysql': 'catalog_suppliers',
        'columns': ['id', 'name', 'matchcode', 'article_count'],
        'large': False,
    },
    {
        'sqlite': 'engines',
        'mysql': 'catalog_engines',
        'columns': ['id', 'code', 'description', 'full_name', 'year_range'],
        'large': False,
    },
    {
        'sqlite': 'vehicle_engines',
        'mysql': 'catalog_vehicle_engines',
        'columns': ['vehicle_id', 'engine_id'],
        'large': False,
    },
    # Aşama 2 — Büyük tablolar
    {
        'sqlite': 'cross_ref',
        'mysql': 'catalog_cross_ref',
        'columns': ['supplier_id', 'part_number', 'ref_supplier_id', 'ref_part_number', 'ref_type'],
        'large': True,
    },
    {
        'sqlite': 'vehicle_attributes',
        'mysql': 'catalog_vehicle_attributes',
        'columns': ['vehicle_id', 'attribute_group', 'attribute_type', 'display_title', 'display_value'],
        'large': True,
    },
    {
        'sqlite': 'parts',
        'mysql': 'catalog_parts',
        'columns': ['id', 'supplier_id', 'part_number'],
        'large': True,
    },
    {
        'sqlite': 'part_images',
        'mysql': 'catalog_part_images',
        'columns': ['supplier_id', 'part_number', 'picture_name', 'doc_type'],
        'large': True,
    },
    # Aşama 3 — Dev tablo
    {
        'sqlite': 'part_vehicles',
        'mysql': 'catalog_part_vehicles',
        'columns': ['part_id', 'vehicle_id', 'category_id'],
        'large': True,
    },
]


def escape_sql(val):
    """SQL değerini güvenli şekilde escape et"""
    if val is None:
        return 'NULL'
    if isinstance(val, (int, float)):
        return str(val)
    s = str(val).replace('\\', '\\\\').replace("'", "\\'")
    return f"'{s}'"


def write_header(f, table_name, total_rows):
    """SQL dosyası başlığı yaz"""
    f.write(f"-- ParcaBizden Katalog: {table_name}\n")
    f.write(f"-- Toplam: {total_rows:,} satır\n")
    f.write(f"-- Oluşturulma: {time.strftime('%Y-%m-%d %H:%M')}\n\n")
    f.write("SET NAMES utf8mb4;\n")
    f.write("SET FOREIGN_KEY_CHECKS = 0;\n")
    f.write("SET UNIQUE_CHECKS = 0;\n")
    f.write("SET AUTOCOMMIT = 0;\n\n")


def write_footer(f):
    """SQL dosyası sonu"""
    f.write("\nCOMMIT;\n")
    f.write("SET FOREIGN_KEY_CHECKS = 1;\n")
    f.write("SET UNIQUE_CHECKS = 1;\n")
    f.write("SET AUTOCOMMIT = 1;\n")


def export_small_table(conn, table_def):
    """Küçük tabloyu tek dosyaya export et"""
    mysql_table = table_def['mysql']
    columns = table_def['columns']
    sqlite_table = table_def['sqlite']

    cur = conn.cursor()
    cur.execute(f"SELECT {', '.join(columns)} FROM {sqlite_table}")
    rows = cur.fetchall()
    total = len(rows)

    out_path = os.path.join(OUT_DIR, f"{mysql_table}.sql")
    with open(out_path, 'w', encoding='utf-8') as f:
        write_header(f, mysql_table, total)
        cols_str = ', '.join(columns)

        for i in range(0, total, BATCH_SIZE):
            batch = rows[i:i + BATCH_SIZE]
            f.write(f"INSERT INTO {mysql_table} ({cols_str}) VALUES\n")
            values = []
            for row in batch:
                vals = ', '.join(escape_sql(v) for v in row)
                values.append(f"({vals})")
            f.write(',\n'.join(values))
            f.write(';\n\n')

        write_footer(f)

    size_kb = os.path.getsize(out_path) / 1024
    print(f"  ✓ {mysql_table}: {total:,} satır → {out_path} ({size_kb:.0f} KB)")


def export_large_table(conn, table_def):
    """Büyük tabloyu parçalı dosyalara export et"""
    mysql_table = table_def['mysql']
    columns = table_def['columns']
    sqlite_table = table_def['sqlite']

    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM {sqlite_table}")
    total = cur.fetchone()[0]

    cols_str = ', '.join(columns)
    batch_size = LARGE_TABLE_BATCH
    file_part = 1
    current_size = 0
    current_file = None
    rows_in_file = 0
    rows_exported = 0

    def open_new_file():
        nonlocal file_part, current_file, current_size, rows_in_file
        if current_file:
            write_footer(current_file)
            current_file.close()
            fpath = os.path.join(OUT_DIR, f"{mysql_table}_part_{file_part - 1:03d}.sql")
            size_kb = os.path.getsize(fpath) / 1024
            print(f"    Part {file_part - 1:03d}: {rows_in_file:,} satır ({size_kb:.0f} KB)")

        fpath = os.path.join(OUT_DIR, f"{mysql_table}_part_{file_part:03d}.sql")
        current_file = open(fpath, 'w', encoding='utf-8')
        write_header(current_file, f"{mysql_table} (part {file_part})", total)
        current_size = 0
        rows_in_file = 0
        file_part += 1

    open_new_file()

    cur.execute(f"SELECT {', '.join(columns)} FROM {sqlite_table}")

    while True:
        rows = cur.fetchmany(batch_size)
        if not rows:
            break

        insert_str = f"INSERT INTO {mysql_table} ({cols_str}) VALUES\n"
        values = []
        for row in rows:
            vals = ', '.join(escape_sql(v) for v in row)
            values.append(f"({vals})")

        statement = insert_str + ',\n'.join(values) + ';\n\n'
        statement_size = len(statement.encode('utf-8'))

        # Dosya boyutu limitini aştıysa yeni dosya aç
        if current_size + statement_size > MAX_FILE_SIZE and rows_in_file > 0:
            open_new_file()

        current_file.write(statement)
        current_size += statement_size
        rows_in_file += len(rows)
        rows_exported += len(rows)

        # İlerleme göster
        if rows_exported % 500000 == 0:
            pct = (rows_exported / total) * 100
            print(f"    ... {rows_exported:,} / {total:,} ({pct:.1f}%)")

    # Son dosyayı kapat
    if current_file:
        write_footer(current_file)
        current_file.close()
        fpath = os.path.join(OUT_DIR, f"{mysql_table}_part_{file_part - 1:03d}.sql")
        size_kb = os.path.getsize(fpath) / 1024
        print(f"    Part {file_part - 1:03d}: {rows_in_file:,} satır ({size_kb:.0f} KB)")

    print(f"  ✓ {mysql_table}: {rows_exported:,} satır → {file_part - 1} dosya")


def main():
    if not os.path.exists(DB_PATH):
        print(f"HATA: Veritabanı bulunamadı: {DB_PATH}")
        sys.exit(1)

    os.makedirs(OUT_DIR, exist_ok=True)

    print(f"Veritabanı: {DB_PATH}")
    print(f"Çıktı dizini: {OUT_DIR}")
    print(f"Dosya boyut limiti: {MAX_FILE_SIZE // (1024*1024)} MB")
    print()

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA cache_size = -64000")  # 64 MB cache
    conn.execute("PRAGMA mmap_size = 268435456")  # 256 MB mmap

    # Sadece belirli tabloları export etmek için komut satırı argümanı
    only_tables = sys.argv[1:] if len(sys.argv) > 1 else None

    for table_def in TABLES:
        if only_tables and table_def['sqlite'] not in only_tables:
            continue

        print(f"\n{'='*50}")
        print(f"Tablo: {table_def['sqlite']} → {table_def['mysql']}")
        print(f"{'='*50}")

        start = time.time()

        if table_def['large']:
            export_large_table(conn, table_def)
        else:
            export_small_table(conn, table_def)

        elapsed = time.time() - start
        print(f"  Süre: {elapsed:.1f} saniye")

    conn.close()

    # Toplam dosya boyutunu göster
    total_size = 0
    file_count = 0
    for f in os.listdir(OUT_DIR):
        if f.endswith('.sql'):
            total_size += os.path.getsize(os.path.join(OUT_DIR, f))
            file_count += 1

    print(f"\n{'='*50}")
    print(f"TAMAMLANDI")
    print(f"Toplam: {file_count} dosya, {total_size / (1024*1024):.1f} MB")
    print(f"Çıktı: {OUT_DIR}/")
    print(f"{'='*50}")


if __name__ == '__main__':
    main()

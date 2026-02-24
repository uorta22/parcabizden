#!/usr/bin/env python3
"""
SQLite autodata_specs.db → MySQL INSERT SQL dosyası üretici.
vehicles tablosunu vehicle_specs tablosuna aktarır.

Kullanım: python3 scripts/export_autodata.py
Çıktı:    public/data/vehicle_specs_import.sql
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '_autodata_temp', 'autodata_specs.db')
OUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'vehicle_specs_import.sql')
BATCH_SIZE = 500  # INSERT satır sayısı per batch

COLUMNS = [
    'brand', 'model', 'generation', 'modification',
    'year_start', 'year_end', 'body_type', 'fuel_type',
    'engine_cc', 'cylinders', 'power_hp', 'torque_nm',
    'transmission', 'drivetrain', 'top_speed_kmh', 'accel_0_100',
    'fuel_combined', 'co2_gkm', 'length_mm', 'width_mm',
    'height_mm', 'wheelbase_mm', 'weight_kg', 'trunk_liters',
    'fuel_tank_liters', 'seats', 'doors', 'source_url',
]

def escape_sql(val):
    if val is None:
        return 'NULL'
    if isinstance(val, (int, float)):
        return str(val)
    s = str(val).replace("\\", "\\\\").replace("'", "\\'")
    return f"'{s}'"

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(f"SELECT {', '.join(COLUMNS)} FROM vehicles ORDER BY id")

    rows = cur.fetchall()
    total = len(rows)
    print(f"Toplam {total} satır okundu.")

    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        f.write("-- Auto-Data.net Vehicle Specs → MySQL Import\n")
        f.write(f"-- {total} araç kaydı\n")
        f.write("-- Kullanım: phpMyAdmin'de SQL sekmesinden çalıştırın\n\n")
        f.write("SET NAMES utf8mb4;\n")
        f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")

        cols_str = ', '.join(COLUMNS)

        for i in range(0, total, BATCH_SIZE):
            batch = rows[i:i + BATCH_SIZE]
            f.write(f"INSERT INTO vehicle_specs ({cols_str}) VALUES\n")
            values = []
            for row in batch:
                vals = ', '.join(escape_sql(v) for v in row)
                values.append(f"({vals})")
            f.write(',\n'.join(values))
            f.write(';\n\n')

        f.write("SET FOREIGN_KEY_CHECKS = 1;\n")

    size_mb = os.path.getsize(OUT_PATH) / (1024 * 1024)
    print(f"SQL dosyası oluşturuldu: {OUT_PATH} ({size_mb:.1f} MB)")
    conn.close()

if __name__ == '__main__':
    main()

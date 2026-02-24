#!/usr/bin/env python3
"""
vehicle_specs_import.sql dosyasını phpMyAdmin'in kabul edeceği
küçük parçalara böler (~2MB).

Çıktı: public/data/vehicle_specs_part_01.sql, _02.sql, ...
"""

import os

SRC = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'vehicle_specs_import.sql')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
MAX_SIZE = 2 * 1024 * 1024  # 2 MB per file

def main():
    with open(SRC, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by INSERT statements
    header_lines = []
    inserts = []
    current = []
    in_header = True

    for line in content.split('\n'):
        if line.startswith('INSERT INTO'):
            in_header = False
            if current:
                inserts.append('\n'.join(current))
                current = []
            current.append(line)
        elif not in_header:
            current.append(line)
        else:
            header_lines.append(line)

    if current:
        inserts.append('\n'.join(current))

    header = '\n'.join(header_lines).strip()
    footer = 'SET FOREIGN_KEY_CHECKS = 1;\n'

    part = 1
    current_size = 0
    current_parts = []

    def flush():
        nonlocal part, current_size, current_parts
        if not current_parts:
            return
        fname = os.path.join(OUT_DIR, f'vehicle_specs_part_{part:02d}.sql')
        with open(fname, 'w', encoding='utf-8') as out:
            out.write(header + '\n\n')
            for p in current_parts:
                out.write(p + '\n')
            out.write('\n' + footer)
        size_kb = os.path.getsize(fname) / 1024
        print(f'  {os.path.basename(fname)} — {size_kb:.0f} KB ({len(current_parts)} INSERT batch)')
        part += 1
        current_size = 0
        current_parts = []

    for ins in inserts:
        ins_size = len(ins.encode('utf-8'))
        if current_size + ins_size > MAX_SIZE and current_parts:
            flush()
        current_parts.append(ins)
        current_size += ins_size

    flush()
    print(f'\nToplam {part - 1} parça oluşturuldu.')

if __name__ == '__main__':
    main()

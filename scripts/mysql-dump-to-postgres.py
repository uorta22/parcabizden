#!/usr/bin/env python3
"""phpMyAdmin SQL dump'larini Postgres INSERT batch'lerine cevirir.

MySQL dizgeleri ters bolu ile kacar (\\'), Postgres tirnak ciftler ('').
Iki yerde tirnak taramasi gerekiyor ve ikisi de kolay yanlis yazilir:

  1. Kacis donusumu — \\' ciftini tek adimda tuketmezsen dizge sinirini
     kaybedersin.
  2. Son kolonu atma — '' ciftini "iki ayri tirnak" sayan bir tarayici
     "FORD TAUNUS '80" gibi degerlerde dizge durumunu ters cevirir, sonra
     yanlis virgulu son virgul sanip satiri ortadan keser. Bu hata bir kez
     yasandi; testi asagida.

Kullanim:
    python3 scripts/mysql-dump-to-postgres.py dump.sql hedef_tablo "(kolonlar)" cikti_dizini
"""
import pathlib
import sys

BATCH = 4000


def mysql_to_pg(line: str) -> str:
    """MySQL kacislarini Postgres'e cevirir."""
    out, i, in_str = [], 0, False
    while i < len(line):
        c = line[i]
        if in_str:
            if c == '\\' and i + 1 < len(line):
                nxt = line[i + 1]
                out.append({"'": "''", '\\': '\\', '"': '"', 'n': '\n', 'r': '\r'}.get(nxt, nxt))
                i += 2
                continue
            if c == "'":
                in_str = False
        elif c == "'":
            in_str = True
        out.append(c)
        i += 1
    return ''.join(out)


def drop_last_col(row: str) -> str:
    """Satirin son kolonunu atar. '' cifti kacmis tirnaktir, sinir degil."""
    inner = row[1:-1]
    i, in_str, last = 0, False, None
    while i < len(inner):
        c = inner[i]
        if in_str:
            if c == "'":
                if i + 1 < len(inner) and inner[i + 1] == "'":
                    i += 2
                    continue
                in_str = False
        else:
            if c == "'":
                in_str = True
            elif c == ',':
                last = i
        i += 1
    return '(' + inner[:last] + ')'


def _self_test() -> None:
    assert mysql_to_pg(r"(1, 'FORD TAUNUS \'80', NULL)") == "(1, 'FORD TAUNUS ''80', NULL)"
    assert drop_last_col("(1, 'FORD TAUNUS ''80, GBS', 2)") == "(1, 'FORD TAUNUS ''80, GBS')"
    assert drop_last_col("(1, 'a', NULL)") == "(1, 'a')"


def main() -> None:
    _self_test()
    src, table, cols, outdir = sys.argv[1:5]
    drop_last = '--drop-last-col' in sys.argv
    out = pathlib.Path(outdir)
    out.mkdir(parents=True, exist_ok=True)

    rows = []
    for line in open(src, encoding='utf-8'):
        if not line.startswith('('):
            continue
        row = mysql_to_pg(line.rstrip().rstrip(';').rstrip(','))
        rows.append(drop_last_col(row) if drop_last else row)

    for b in range(0, len(rows), BATCH):
        (out / f'{table}_{b // BATCH:03d}.sql').write_text(
            f'insert into {table} {cols} values\n'
            + ',\n'.join(rows[b:b + BATCH])
            + '\non conflict do nothing;\n',
            encoding='utf-8',
        )
    print(f'{table}: {len(rows)} satir -> {(len(rows) + BATCH - 1) // BATCH} dosya')


if __name__ == '__main__':
    main()

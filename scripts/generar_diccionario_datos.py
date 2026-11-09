#!/usr/bin/env python3
"""Genera docs/tecnica/diccionario-datos.md leyendo information_schema de MariaDB/MySQL.
Uso: python3 scripts/generar_diccionario_datos.py <base_de_datos>   (usa el cliente `mariadb` con credenciales locales)
"""
import subprocess, sys, collections
db = sys.argv[1] if len(sys.argv) > 1 else 'idead_portal'
def q(sql):
    out = subprocess.run(['mariadb', '-uroot', '-N', '-B', '-e', sql], capture_output=True, text=True, check=True).stdout
    return [l.split('\t') for l in out.rstrip('\n').split('\n') if l]
cols = q(f"select table_name,column_name,column_type,is_nullable,column_key,ifnull(column_default,''),extra from information_schema.columns where table_schema='{db}' order by table_name,ordinal_position")
fks = q(f"select table_name,column_name,referenced_table_name,referenced_column_name from information_schema.key_column_usage where table_schema='{db}' and referenced_table_name is not null")
idx = q(f"select table_name,index_name,group_concat(column_name order by seq_in_index),max(non_unique) from information_schema.statistics where table_schema='{db}' group by table_name,index_name")
fk = {(t, c): f"{rt}.{rc}" for t, c, rt, rc in fks}
by = collections.OrderedDict()
for r in cols: by.setdefault(r[0], []).append(r)
ix = collections.defaultdict(list)
for t, n, c, nu in idx: ix[t].append(f"`{n}` ({c}){'' if nu == '1' else ' — único'}")
skip = {'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs', 'migrations', 'sessions', 'password_reset_tokens'}
md = ['# Diccionario de datos', '', f'Generado automáticamente desde el esquema real (`{db}`, MariaDB 10.11) con `scripts/generar_diccionario_datos.py`.',
      'Las tablas técnicas de Laravel (sesiones, caché, colas, migraciones) se omiten. Script de creación: [`esquema-mariadb.sql`](esquema-mariadb.sql); fuente de verdad: `backend/database/migrations`.', '']
for t, rows in by.items():
    if t in skip: continue
    md += [f'## `{t}`', '', '| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |', '|---|---|---|---|---|---|']
    for _, c, ty, nu, k, de, ex in rows:
        md.append(f"| `{c}` | {ty}{' ' + ex if ex else ''} | {'sí' if nu == 'YES' else 'no'} | {k} | {de} | {fk.get((t, c), '')} |")
    if ix[t]: md += ['', 'Índices: ' + '; '.join(ix[t])]
    md.append('')
open('docs/tecnica/diccionario-datos.md', 'w').write('\n'.join(md))
print(len(by) - len(skip & set(by)), 'tablas documentadas')

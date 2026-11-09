import { useMemo, useState, type ReactNode } from 'react';
import { Icon } from './icons';

export interface Column<T> { key: string; label: string; render?: (row: T) => ReactNode; value?: (row: T) => string | number | null; align?: 'left' | 'right'; sortable?: boolean }

/** Tabla consultable: búsqueda, orden por columna, paginación y descarga CSV de lo que se ve. Reutilizada en portal y panel. */
export function DataTable<T>({ rows, columns, caption, pageSize = 15, searchable = true, csvName, empty = 'Sin registros.' }: {
  rows: T[]; columns: Column<T>[]; caption?: string; pageSize?: number; searchable?: boolean; csvName?: string; empty?: string;
}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);
  const val = (r: T, c: Column<T>) => (c.value ? c.value(r) : ((r as Record<string, unknown>)[c.key] as string | number | null));
  const filtered = useMemo(() => {
    let out = rows;
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      out = out.filter((r) => columns.some((c) => String(val(r, c) ?? '').toLowerCase().includes(t)));
    }
    if (sort) {
      const c = columns.find((x) => x.key === sort.key)!;
      out = [...out].sort((a, b) => {
        const va = val(a, c), vb = val(b, c);
        if (va === vb) return 0;
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        return (typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')) * sort.dir;
      });
    }
    return out;
  }, [rows, q, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages - 1);
  const shown = filtered.slice(cur * pageSize, cur * pageSize + pageSize);

  const csv = () => {
    const esc = (v: unknown) => { const s = v === null || v === undefined ? '' : String(v); const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; return `"${safe.replace(/"/g, '""')}"`; };
    const lines = [columns.map((c) => esc(c.label)).join(';'), ...filtered.map((r) => columns.map((c) => esc(val(r, c))).join(';'))];
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${csvName ?? 'tabla'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      {(searchable || csvName) && (
        <div className="mb-2 flex flex-wrap items-center gap-2 no-print">
          {searchable && (
            <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-teal">
              <Icon name="search" className="text-muted" />
              <span className="sr-only">Filtrar tabla</span>
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Filtrar…" className="w-40 bg-transparent focus:outline-none" />
            </label>
          )}
          <span className="text-sm text-muted">{filtered.length} registro{filtered.length === 1 ? '' : 's'}</span>
          {csvName && <button type="button" onClick={csv} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-ut-red hover:text-ut-red"><Icon name="download" /> CSV</button>}
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-surface text-xs tracking-wide text-muted uppercase">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={`px-3 py-2.5 font-bold ${c.align === 'right' ? 'text-right' : ''}`}
                  aria-sort={sort?.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
                  {c.sortable === false ? c.label : (
                    <button type="button" className="inline-flex items-center gap-1 uppercase hover:text-ut-red" onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 }))}>
                      {c.label}{sort?.key === c.key && <span aria-hidden>{sort.dir === 1 ? '▲' : '▼'}</span>}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.length === 0 && <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-muted">{empty}</td></tr>}
            {shown.map((r, i) => (
              <tr key={i} className="hover:bg-surface/60">
                {columns.map((c) => <td key={c.key} className={`px-3 py-2 align-top ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}>{c.render ? c.render(r) : String(val(r, c) ?? '—')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="mt-2 flex items-center justify-end gap-2 text-sm no-print" aria-label="Paginación de la tabla">
          <button type="button" disabled={cur === 0} onClick={() => setPage(cur - 1)} className="rounded border border-line px-2 py-1 disabled:opacity-40">Anterior</button>
          <span>Página {cur + 1} de {pages}</span>
          <button type="button" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="rounded border border-line px-2 py-1 disabled:opacity-40">Siguiente</button>
        </nav>
      )}
    </div>
  );
}

import { useSearchParams } from 'react-router-dom';
import { publicGet } from '../../shared/api';
import type { FilterOptions } from '../../shared/types';
import { useAsync } from '../../shared/ui';
import { Icon } from '../../shared/icons';

let optionsCache: Promise<FilterOptions> | null = null;
export const useFilterOptions = () => useAsync(() => (optionsCache ??= publicGet<FilterOptions>('filters')), []);

export const FILTER_KEYS = ['year', 'period', 'level', 'program', 'department', 'cat'] as const;

/** Filtros de un módulo, sincronizados con la URL (compartibles) y aplicados a todos los indicadores de la página. */
export function useFilters() {
  const [params, setParams] = useSearchParams();
  const values: Record<string, string> = {};
  FILTER_KEYS.forEach((k) => { const v = params.get(k); if (v) values[k] = v; });
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v); else p.delete(k);
    if (k === 'year') p.delete('period');
    if (k === 'department') p.delete('cat');
    if (k === 'level') p.delete('program');
    setParams(p, { replace: true });
  };
  const clear = () => setParams(new URLSearchParams(), { replace: true });
  return { values, set, clear };
}

export function FilterBar({ show = [...FILTER_KEYS] }: { show?: string[] }) {
  const { data } = useFilterOptions();
  const { values, set, clear } = useFilters();
  if (!data) return null;
  const sel = (key: string, label: string, options: { v: string; l: string }[]) =>
    show.includes(key) && (
      <label className="flex min-w-[9rem] flex-1 flex-col text-xs font-bold text-muted uppercase">
        {label}
        <select value={values[key] ?? ''} onChange={(e) => set(key, e.target.value)}
          className="mt-1 rounded-lg border border-line bg-white px-2 py-2 text-sm font-medium text-ink normal-case focus:border-ut-red focus:outline-none">
          <option value="">Todos</option>
          {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </label>
    );
  const periods = data.periods.filter((p) => !values.year || String(p.year) === values.year);
  const programs = data.programs.filter((p) => !values.level || String(p.level_id) === values.level);
  const deptId = data.departments.find((d) => d.code === values.department || String(d.id) === values.department)?.id;
  const cats = data.cats.filter((c) => !deptId || c.department_id === deptId);
  const active = Object.keys(values).length;
  return (
    <section aria-label="Filtros de consulta" className="sticky top-[76px] z-20 rounded-xl border border-line bg-white/95 p-3 shadow-sm backdrop-blur no-print md:top-[84px]">
      <div className="flex flex-wrap items-end gap-3">
        <span className="flex items-center gap-1 self-center text-sm font-bold text-ink"><Icon name="filter" className="text-ut-red" /> Filtros</span>
        {sel('year', 'Año', data.years.map((y) => ({ v: String(y), l: String(y) })))}
        {sel('period', 'Período', periods.map((p) => ({ v: p.code, l: p.code })))}
        {sel('level', 'Nivel de formación', data.levels.map((l) => ({ v: String(l.id), l: l.name })))}
        {sel('program', 'Programa', programs.map((p) => ({ v: String(p.id), l: p.name })))}
        {sel('department', 'Departamento', data.departments.map((d) => ({ v: String(d.id), l: d.name })))}
        {sel('cat', 'CAT', cats.map((c) => ({ v: String(c.id), l: c.name })))}
        {active > 0 && <button type="button" onClick={clear} className="self-end rounded-lg px-3 py-2 text-sm font-semibold text-ut-red hover:bg-ut-red-50">Limpiar ({active})</button>}
      </div>
    </section>
  );
}

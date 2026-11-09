import { useState } from 'react';
import { publicGet, publicUrl } from '../../shared/api';
import { fmtDate, fmtValue, label } from '../../shared/format';
import { Icon } from '../../shared/icons';
import type { IndicatorData, IndicatorMeta, IndicatorRow } from '../../shared/types';
import { Badge, DemoBadge, ErrorBox, Pending, Spinner, useAsync } from '../../shared/ui';
import { DataTable, type Column } from '../../shared/DataTable';
import { BreakdownBars, DistributionBars, GroupSeriesChart, ProgressBars, TrendChart } from './Charts';
import { ColombiaMap } from './ColombiaMap';
import { Widget } from './Widgets';

type Resp = { indicator: IndicatorMeta; data: IndicatorData | null; status: 'publicado' | 'pendiente' | 'pendiente_autorizacion' };

/** Ficha de trazabilidad: nombre, descripción, unidad, período, actualización, fuente, dependencia, metodología, observaciones. */
function Traceability({ m, d }: { m: IndicatorMeta; d: IndicatorData | null }) {
  return (
    <details className="group mt-4 rounded-lg border border-line bg-surface/60 text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 font-semibold text-ink">
        <Icon name="info" className="text-ut-red" /> Ficha técnica y fuente
        <Icon name="chevronDown" className="ml-auto transition group-open:rotate-180" />
      </summary>
      <dl className="grid gap-x-6 gap-y-2 px-4 pb-4 sm:grid-cols-2">
        <div><dt className="font-bold text-muted">Información</dt><dd>{m.information_required}</dd></div>
        <div><dt className="font-bold text-muted">Unidad de medida</dt><dd>{m.unit}</dd></div>
        <div><dt className="font-bold text-muted">Periodicidad</dt><dd>{label(m.periodicity)}</dd></div>
        <div><dt className="font-bold text-muted">Período de referencia</dt><dd>{d?.selected_period ?? d?.kpi?.period ?? '—'}</dd></div>
        <div><dt className="font-bold text-muted">Última actualización</dt><dd>{d?.last_published_at ? fmtDate(d.last_published_at) : 'Sin publicación'}</dd></div>
        <div><dt className="font-bold text-muted">Fuente institucional</dt><dd>{m.source}{m.sources.some((s) => !s.validated) && <span className="block text-xs text-amber-800">Incluye fuentes cuyo nombre oficial está pendiente de validación.</span>}</dd></div>
        <div><dt className="font-bold text-muted">Dependencia responsable</dt><dd>{m.responsible ?? 'Pendiente de asignación'}</dd></div>
        <div><dt className="font-bold text-muted">Nivel de publicación</dt><dd>{label(m.publication_level)}{['AGR', 'AGR_S'].includes(m.publication_level) && ' — cifras pequeñas reservadas para proteger la identidad de las personas'}</dd></div>
        <div className="sm:col-span-2"><dt className="font-bold text-muted">Metodología de cálculo</dt><dd>{m.methodology ?? <span className="text-amber-800">Pendiente de validación institucional. Las cifras se publican tal como las reporta la fuente, sin cálculos adicionales del portal.</span>}</dd></div>
        {m.observations && <div className="sm:col-span-2"><dt className="font-bold text-muted">Observaciones</dt><dd>{m.observations}</dd></div>}
      </dl>
    </details>
  );
}

const ROW_COLS: { key: keyof IndicatorRow; label: string }[] = [
  { key: 'period', label: 'Período' }, { key: 'level', label: 'Nivel' }, { key: 'program', label: 'Programa' }, { key: 'area', label: 'Área' },
  { key: 'department', label: 'Departamento' }, { key: 'municipality', label: 'Municipio' }, { key: 'cat', label: 'CAT' }, { key: 'category', label: 'Categoría' },
];

function Visual({ m, d }: { m: IndicatorMeta; d: IndicatorData }) {
  const vt = m.value_type;
  const groupKeys = d.series_by_group.length ? [...new Set(d.series_by_group.flatMap((p) => Object.keys(p).filter((k) => k !== 'period')))] : [];
  switch (m.chart_type) {
    case 'line':
      if (groupKeys.length > 1 && d.series_by_group.length > 1) return <GroupSeriesChart data={d.series_by_group} keys={groupKeys} valueType={vt} stacked={false} />;
      if (d.trend.length > 1) return <TrendChart data={d.trend} valueType={vt} name={m.name} />;
      break;
    case 'stacked':
      if (groupKeys.length > 1 && d.series_by_group.length > 0) return <GroupSeriesChart data={d.series_by_group} keys={groupKeys} valueType={vt} stacked={vt === 'count' || vt === 'currency'} />;
      break;
    case 'distribution':
      if (d.breakdown.length) return <DistributionBars data={d.breakdown} valueType={vt} />;
      break;
    case 'progress':
      if (d.breakdown.length) return <ProgressBars data={d.breakdown} />;
      if (d.kpi) return <><ProgressBars data={[{ label: `Ejecución ${d.kpi.period}`, value: d.kpi.value }]} />{d.trend.length > 1 && <div className="mt-4"><TrendChart data={d.trend} valueType={vt} name={m.name} /></div>}</>;
      break;
    case 'map':
      if (d.breakdown.length) {
        const vals: Record<string, number | null> = {};
        d.breakdown.forEach((b) => { if (b.department_code) vals[b.department_code] = b.value; });
        return (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
            <ColombiaMap title={`Mapa: ${m.name}`} values={vals} formatValue={(v) => fmtValue(v, vt)} className="max-w-sm" />
            <BreakdownBars data={d.breakdown} valueType={vt} />
          </div>
        );
      }
      break;
    case 'table':
      return null;
    case 'kpi':
      break;
  }
  if (d.breakdown.length) return <BreakdownBars data={d.breakdown} valueType={vt} />;
  if (d.trend.length > 1) return <TrendChart data={d.trend} valueType={vt} name={m.name} />;
  return null;
}

/** Tarjeta completa de un indicador: cifra, visualización adecuada a su naturaleza, tabla, exportación y trazabilidad. */
export function IndicatorCard({ meta, filters }: { meta: IndicatorMeta; filters: Record<string, string> }) {
  const key = JSON.stringify(filters);
  const { data, error, loading, reload } = useAsync(() => publicGet<Resp>(`indicators/${meta.code}`, filters), [meta.code, key]);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const d = data?.data ?? null;
  const vt = meta.value_type;
  const showKpi = d?.kpi && d.kpi.value !== null;
  const usedCols = d ? ROW_COLS.filter((c) => d.rows.some((r) => r[c.key] !== null && r[c.key] !== undefined)) : [];
  const columns: Column<IndicatorRow>[] = [
    ...usedCols.map((c) => ({ key: c.key as string, label: c.label })),
    { key: 'value', label: `Valor (${meta.unit})`, align: 'right' as const, value: (r: IndicatorRow) => r.value, render: (r: IndicatorRow) => (r.suppressed ? <span title="Cifra reservada para proteger la identidad de las personas">Reservado</span> : fmtValue(r.value, vt)) },
  ];
  const numeric = d && d.row_count > 0;

  return (
    <article id={meta.code} aria-labelledby={`${meta.code}-t`} className="print-break scroll-mt-40 rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
      <header className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wide text-muted">{meta.code} · {meta.suggested_visualization}</p>
          <h3 id={`${meta.code}-t`} className="text-lg leading-snug font-extrabold text-ink md:text-xl">{meta.name}</h3>
          <p className="mt-1 text-[0.95rem] text-muted">{meta.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {d?.is_demo && <DemoBadge />}
          {meta.methodology_status !== 'validada' && <Badge tone="amber">Metodología por validar</Badge>}
          {['AGR', 'AGR_S'].includes(meta.publication_level) && <Badge tone="teal">Agregado</Badge>}
        </div>
      </header>

      <div className="mt-4">
        {loading && <Spinner />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {data?.status === 'pendiente_autorizacion' && <Pending text="Publicación pendiente de autorización institucional" detail="Este indicador contiene información sensible y solo se publicará, de forma agregada, cuando exista autorización expresa." />}
        {data && data.status === 'pendiente' && !meta.widget && <Pending detail={`Fuente responsable: ${meta.source}.`} />}
        {d && d.ignored_filters.length > 0 && numeric && <p className="mb-2 text-sm text-amber-800">Este indicador no se desagrega por: {d.ignored_filters.map(label).join(', ')}; se muestra sin ese filtro.</p>}

        {numeric && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              {showKpi ? (
                <div>
                  <p className="text-4xl font-extrabold text-ut-red tabular-nums">{fmtValue(d.kpi!.value, vt)}</p>
                  <p className="text-sm text-muted">{meta.unit} · período {d.kpi!.period}{d.kpi!.derived && ' · total calculado como suma de la desagregación publicada'}</p>
                </div>
              ) : d.kpi?.suppressed ? <p className="font-semibold text-muted">Cifra reservada (grupo pequeño)</p> : <span />}
              <div className="flex flex-wrap gap-2 no-print" role="group" aria-label="Opciones de visualización">
                <button type="button" onClick={() => setView('chart')} aria-pressed={view === 'chart'} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold ${view === 'chart' ? 'border-ut-red bg-ut-red text-white' : 'border-line hover:border-ut-red'}`}><Icon name="chart" /> Gráfico</button>
                <button type="button" onClick={() => setView('table')} aria-pressed={view === 'table'} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold ${view === 'table' ? 'border-ut-red bg-ut-red text-white' : 'border-line hover:border-ut-red'}`}><Icon name="table" /> Tabla</button>
                <a href={publicUrl(`indicators/${meta.code}/export`, { ...filters, format: 'csv' })} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-ut-red hover:text-ut-red"><Icon name="download" /> CSV</a>
                <a href={publicUrl(`indicators/${meta.code}/export`, { ...filters, format: 'xlsx' })} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-ut-red hover:text-ut-red"><Icon name="download" /> Excel</a>
              </div>
            </div>
            <div className="mt-4">
              {view === 'chart' ? (Visual({ m: meta, d }) ?? <DataTable rows={d.rows} columns={columns} caption={meta.name} searchable={false} />)
                : <DataTable rows={d.rows} columns={columns} caption={meta.name} csvName={meta.code} />}
            </div>
            {d.breakdown.length > 0 && view === 'chart' && !['line', 'stacked'].includes(meta.chart_type) && <p className="mt-2 text-xs text-muted">Desagregación del período {d.selected_period}. Use el filtro «Período» para consultar otros.</p>}
          </>
        )}
        {meta.widget && <div className={numeric ? 'mt-6' : ''}><Widget type={meta.widget} filters={filters} /></div>}
      </div>
      <Traceability m={meta} d={d} />
    </article>
  );
}

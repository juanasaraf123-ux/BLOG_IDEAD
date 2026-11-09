import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtValue } from '../../shared/format';

/**
 * Paleta categórica validada (scripts/validate_palette.js de la guía dataviz: banda de luminosidad, croma,
 * separación CVD y visión normal). Se asigna en orden fijo y siempre va acompañada de leyenda y tabla equivalente.
 */
export const SERIES = ['#c51718', '#1f9e8f', '#d98a00', '#3f6fc4', '#a64d9e', '#5d8a2e', '#e0607a', '#2a8bb5'];
const AXIS = { fontSize: 12, fill: '#5f656b' };
const GRID = '#ecebea';

const tip = (valueType: string) => ({
  formatter: (v: unknown) => (v === null || v === undefined ? 'Reservado' : fmtValue(Number(v), valueType)),
  contentStyle: { borderRadius: 8, border: '1px solid #e6e3e1', fontSize: 13 },
  cursor: { fill: 'rgba(197,23,24,0.06)' },
});

const shortAxis = (valueType: string) => (v: number) => {
  if (valueType === 'currency') return v >= 1e9 ? `$${(v / 1e9).toLocaleString('es-CO', { maximumFractionDigits: 1 })} mm` : v >= 1e6 ? `$${(v / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 0 })} M` : String(v);
  if (valueType === 'percent') return `${v}%`;
  return v >= 1000 ? `${(v / 1000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} mil` : String(v);
};

/** Línea de tiempo de una serie (2px, marcadores ≥8px solo al pasar el cursor). */
export function TrendChart({ data, valueType, name }: { data: { period: string; value: number | null }[]; valueType: string; name: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="period" tick={AXIS} tickLine={false} axisLine={{ stroke: '#d6d3d1' }} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={64} tickFormatter={shortAxis(valueType)} />
        <Tooltip {...tip(valueType)} />
        <Line type="monotone" dataKey="value" name={name} stroke={SERIES[0]} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} connectNulls={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Varias series en el tiempo: líneas (máx. 8 colores; con leyenda) o barras apiladas. */
export function GroupSeriesChart({ data, keys, valueType, stacked }: { data: Record<string, string | number | null>[]; keys: string[]; valueType: string; stacked: boolean }) {
  const shown = keys.slice(0, SERIES.length);
  if (stacked) {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 4 }} barCategoryGap="22%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="period" tick={AXIS} tickLine={false} axisLine={{ stroke: '#d6d3d1' }} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={64} tickFormatter={shortAxis(valueType)} />
          <Tooltip {...tip(valueType)} />
          <Legend wrapperStyle={{ fontSize: 13 }} iconType="circle" />
          {shown.map((k, i) => <Bar key={k} dataKey={k} stackId="s" fill={SERIES[i]} stroke="#fff" strokeWidth={1} radius={i === shown.length - 1 ? [4, 4, 0, 0] : 0} isAnimationActive={false} />)}
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="period" tick={AXIS} tickLine={false} axisLine={{ stroke: '#d6d3d1' }} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={64} tickFormatter={shortAxis(valueType)} />
        <Tooltip {...tip(valueType)} />
        <Legend wrapperStyle={{ fontSize: 13 }} iconType="plainline" />
        {shown.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={SERIES[i]} strokeWidth={2} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Barras horizontales de una desagregación (un solo color: la identidad la da la etiqueta del eje). */
export function BreakdownBars({ data, valueType }: { data: { label: string; value: number | null; suppressed?: boolean }[]; valueType: string }) {
  const rows = data.slice(0, 25);
  const h = Math.max(140, rows.length * 34 + 30);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 8 }} barCategoryGap={6}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={shortAxis(valueType)} />
        <YAxis type="category" dataKey="label" tick={{ ...AXIS, fill: '#2b2f33' }} width={190} tickLine={false} axisLine={false} interval={0} />
        <Tooltip {...tip(valueType)} />
        <Bar dataKey="value" name="Valor" fill={SERIES[0]} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}
          label={{ position: 'right', fontSize: 12, fill: '#2b2f33', formatter: (v: unknown) => (v === null || v === undefined ? 'Reservado' : fmtValue(Number(v), valueType)) }}>
          {rows.map((r) => <Cell key={r.label} fill={r.suppressed ? '#c9c6c3' : SERIES[0]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Distribución porcentual por variable («Sexo: …», «Edad: …»): barras de 100 % con etiquetas directas. */
export function DistributionBars({ data, valueType }: { data: { label: string; value: number | null }[]; valueType: string }) {
  const groups = new Map<string, { label: string; value: number | null }[]>();
  data.forEach((d) => {
    const [g, item] = d.label.includes(': ') ? [d.label.split(': ')[0], d.label.split(': ').slice(1).join(': ')] : ['Distribución', d.label];
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push({ label: item, value: d.value });
  });
  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([g, items]) => {
        const total = items.reduce((s, x) => s + (x.value ?? 0), 0);
        return (
          <div key={g}>
            <p className="mb-1.5 text-sm font-bold text-ink">{g}</p>
            <div className="flex h-7 w-full gap-[2px] overflow-hidden rounded" role="img" aria-label={`${g}: ${items.map((x) => `${x.label} ${total ? Math.round(((x.value ?? 0) / total) * 100) : 0}%`).join(', ')}`}>
              {items.map((x, i) => {
                const pct = total ? ((x.value ?? 0) / total) * 100 : 0;
                return pct > 0 ? <div key={x.label} title={`${x.label}: ${fmtValue(x.value, valueType)} (${pct.toFixed(1)} %)`} style={{ width: `${pct}%`, background: SERIES[i % SERIES.length] }} /> : null;
              })}
            </div>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink">
              {items.map((x, i) => (
                <li key={x.label} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[i % SERIES.length] }} aria-hidden />
                  {x.label}: <strong>{x.value === null ? 'Reservado' : `${total ? (((x.value ?? 0) / total) * 100).toFixed(1) : 0} %`}</strong>
                  <span className="text-muted">({fmtValue(x.value, valueType)})</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** Indicadores de avance (porcentaje). */
export function ProgressBars({ data }: { data: { label: string; value: number | null }[] }) {
  return (
    <ul className="space-y-4">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-sm"><span className="font-semibold text-ink">{d.label}</span><span className="font-bold text-ink">{d.value === null ? '—' : `${d.value.toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`}</span></div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={d.value ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={d.label}>
            <div className="h-full rounded-full bg-ut-red transition-all" style={{ width: `${Math.min(100, d.value ?? 0)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

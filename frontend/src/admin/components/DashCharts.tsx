import { useState } from 'react';
import { fmtNumber } from '../../shared/format';

/** Línea de una sola serie (sin leyenda: el título la nombra), trazo 2px, marcadores, guía y tooltip al pasar el cursor. */
export function LineChart({ data, label }: { data: { period: string; value: number }[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length < 2) return <p className="py-10 text-center text-sm text-muted">Aún no hay suficientes períodos publicados.</p>;
  const W = 560, H = 230, L = 52, R = 30, T = 14, B = 30;
  const vals = data.map((d) => d.value);
  const raw = (Math.max(...vals) - Math.min(...vals) || Math.max(...vals) || 1) / 2;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((v) => v >= raw) ?? raw;
  const lo = Math.max(0, Math.floor(Math.min(...vals) / step) * step - (Math.min(...vals) % step === 0 ? step : 0));
  const hi = Math.ceil(Math.max(...vals) / step) * step + (Math.max(...vals) % step === 0 ? step : 0);
  const x = (i: number) => L + (i * (W - L - R)) / (data.length - 1);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, k) => lo + step * k);
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.value)}`).join('');
  const area = `${line}L${x(data.length - 1)},${H - B}L${x(0)},${H - B}Z`;
  const h = hover !== null ? data[hover] : null;
  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${label}: ${data.map((d) => `${d.period} ${fmtNumber(d.value, 0)}`).join(', ')}`}
        onMouseLeave={() => setHover(null)}>
        <defs><linearGradient id="lc-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#c51718" stopOpacity=".16" /><stop offset="1" stopColor="#c51718" stopOpacity="0" /></linearGradient></defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e6e6e8" strokeDasharray={t === lo ? undefined : '3 4'} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" className="fill-muted text-[11px]">{fmtNumber(t, 0)}</text>
          </g>
        ))}
        {data.map((d, i) => <text key={d.period} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted text-[11px]">{d.period}</text>)}
        <path d={area} fill="url(#lc-fill)" />
        <path d={line} fill="none" stroke="#c51718" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#9a9ca0" strokeDasharray="3 3" />}
        {data.map((d, i) => <circle key={d.period} cx={x(i)} cy={y(d.value)} r={hover === i ? 5.5 : 4} fill="#c51718" stroke="#fff" strokeWidth={2} />)}
        <text x={x(data.length - 1)} y={y(data[data.length - 1].value) - 12} textAnchor="end" className="fill-ink text-[12px] font-bold">{fmtNumber(data[data.length - 1].value, 0)}</text>
        {data.map((d, i) => (
          <rect key={d.period} x={x(i) - (W - L - R) / (data.length - 1) / 2} y={T} width={(W - L - R) / (data.length - 1)} height={H - T - B} fill="transparent"
            onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {h && hover !== null && (
        <div className="pointer-events-none absolute top-1 rounded-lg bg-ink px-3 py-1.5 text-xs text-white shadow-lg" style={{ left: `${(x(hover) / W) * 100}%`, transform: hover > data.length / 2 ? 'translateX(-105%)' : 'translateX(5%)' }}>
          <span className="block font-bold">{h.period}</span>{fmtNumber(h.value, 0)} estudiantes
        </div>
      )}
    </figure>
  );
}

/** Colores categoriales en orden fijo (validados: daltonismo y visión normal); «Otros» en gris neutro. */
const SERIES = ['#c51718', '#1baf7a', '#2a78d6', '#eda100', '#6250d6'];
const OTHER = '#b4b4b6';

/** Dona con separación de 2px entre segmentos, tooltip al pasar el cursor y leyenda con valores y porcentajes. */
export function Donut({ data, center }: { data: { label: string; value: number }[]; center: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((a, d) => a + d.value, 0);
  if (!total) return <p className="py-10 text-center text-sm text-muted">Sin datos publicados.</p>;
  const color = (d: { label: string }, i: number) => (/^otros/i.test(d.label) ? OTHER : SERIES[i % SERIES.length]);
  const R = 80, r = 54, C = 100;
  let acc = 0;
  const arcs = data.map((d, i) => {
    const a0 = (acc / total) * Math.PI * 2; acc += d.value; const a1 = (acc / total) * Math.PI * 2;
    const gap = 0.012;
    const s = a0 + gap, e = Math.max(s, a1 - gap);
    const p = (rad: number, ang: number) => `${C + rad * Math.sin(ang)},${C - rad * Math.cos(ang)}`;
    const large = e - s > Math.PI ? 1 : 0;
    return { d: `M${p(R, s)}A${R},${R} 0 ${large} 1 ${p(R, e)}L${p(r, e)}A${r},${r} 0 ${large} 0 ${p(r, s)}Z`, fill: color(d, i), i };
  });
  const h = hover !== null ? data[hover] : null;
  return (
    <div className="flex flex-col items-center gap-5 2xl:flex-row">
      <svg viewBox="0 0 200 200" className="w-44 shrink-0" role="img" aria-label={data.map((d) => `${d.label} ${fmtNumber(d.value, 0)}`).join(', ')} onMouseLeave={() => setHover(null)}>
        {arcs.map((a) => <path key={a.i} d={a.d} fill={a.fill} opacity={hover === null || hover === a.i ? 1 : 0.35} onMouseEnter={() => setHover(a.i)} className="transition-opacity" />)}
        <text x={C} y={C - 4} textAnchor="middle" className="fill-ink text-[22px] font-extrabold">{fmtNumber(h ? h.value : total, 0)}</text>
        <text x={C} y={C + 16} textAnchor="middle" className="fill-muted text-[10px]">{h ? `${Math.round((h.value / total) * 100)} % · ${h.label}`.slice(0, 26) : center}</text>
      </svg>
      <ul className="w-full space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={`flex items-center gap-2 rounded-md px-1 ${hover === i ? 'bg-surface' : ''}`}>
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: color(d, i) }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-ink">{d.label}</span>
            <span className="font-semibold text-ink tabular-nums">{fmtNumber(d.value, 0)}</span>
            <span className="w-11 text-right text-muted tabular-nums">{Math.round((d.value / total) * 100)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

type DeptFeature = Feature<Geometry, { code: string; name: string }>;

let cache: Promise<FeatureCollection<Geometry, { code: string; name: string }>> | null = null;
/** Geometría de departamentos (DANE – MGN), servida por el propio portal: sin proveedores de mapas externos. */
function loadGeo() {
  cache ??= fetch('/geo/colombia-departamentos.json').then((r) => r.json());
  return cache;
}

export interface MapPoint { lat: number; lng: number; label: string; id: string; active?: boolean }

const RED_SCALE = ['#f3c9c9', '#e58f8f', '#d24b4c', '#b51c1e', '#7e1214'];

interface Props {
  /** Valor por código DANE de departamento (coroplético en tonos rojos). */
  values?: Record<string, number | null>;
  points?: MapPoint[];
  selected?: string | null;
  onSelect?: (code: string | null, name?: string) => void;
  onPointSelect?: (id: string) => void;
  title: string;
  formatValue?: (v: number) => string;
  className?: string;
}

/**
 * Mapa interactivo de Colombia por departamentos. Accesible: cada departamento con datos es enfocable con teclado,
 * tiene nombre accesible y existe una tabla equivalente fuera del mapa (responsabilidad del componente contenedor).
 */
export function ColombiaMap({ values = {}, points = [], selected, onSelect, onPointSelect, title, formatValue = (v) => String(v), className = '' }: Props) {
  const [geo, setGeo] = useState<FeatureCollection<Geometry, { code: string; name: string }> | null>(null);
  const [hover, setHover] = useState<{ name: string; value: number | null; x: number; y: number } | null>(null);
  useEffect(() => { loadGeo().then(setGeo).catch(() => setGeo(null)); }, []);

  const W = 520, H = 640;
  const { path, island, project } = useMemo(() => {
    if (!geo) return { path: null, island: null, project: null };
    const mainland = { ...geo, features: geo.features.filter((f) => f.properties.code !== '88') };
    const proj = geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], mainland);
    const isl = geo.features.find((f) => f.properties.code === '88');
    const islProj = isl ? geoMercator().fitExtent([[18, 18], [88, 88]], isl) : null;
    return { path: geoPath(proj), island: isl && islProj ? { f: isl, p: geoPath(islProj) } : null, project: proj };
  }, [geo]);

  const nums = Object.values(values).filter((v): v is number => typeof v === 'number' && v > 0);
  const max = nums.length ? Math.max(...nums) : 0;
  const color = (code: string) => {
    const v = values[code];
    if (v === undefined || v === null || v <= 0 || !max) return '#b4b4b6';
    const idx = Math.min(RED_SCALE.length - 1, Math.floor((v / max) * (RED_SCALE.length - 1) + 0.0001));
    return RED_SCALE[Math.max(1, idx)];
  };

  if (!geo || !path) return <div className={`flex aspect-[13/16] items-center justify-center rounded-xl bg-surface text-muted ${className}`}>Cargando mapa…</div>;

  const renderDept = (f: DeptFeature, p: ReturnType<typeof geoPath>) => {
    const code = f.properties.code;
    const has = values[code] !== undefined && values[code] !== null;
    const isSel = selected === code;
    const v = values[code] ?? null;
    return (
      <path key={code} d={p(f) ?? ''} fill={color(code)} stroke={isSel ? '#2b2f33' : '#ffffff'} strokeWidth={isSel ? 2.2 : 0.8}
        className={`transition-[fill] duration-200 ${onSelect ? 'cursor-pointer hover:brightness-95 focus:outline-none' : ''}`}
        tabIndex={onSelect && has ? 0 : -1} role={onSelect ? 'button' : undefined}
        aria-label={`${f.properties.name}${has ? `: ${formatValue(v as number)}` : ': sin datos'}`} aria-pressed={onSelect ? isSel : undefined}
        onClick={() => onSelect?.(isSel ? null : code, f.properties.name)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(isSel ? null : code, f.properties.name); } }}
        onMouseMove={(e) => {
          const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
          setHover({ name: f.properties.name, value: v, x: e.clientX - box.left, y: e.clientY - box.top });
        }}
        onMouseLeave={() => setHover(null)} />
    );
  };

  return (
    <figure className={`relative ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
        <defs>
          <filter id="map-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="6" dy="9" stdDeviation="5" floodColor="#000" floodOpacity="0.28" />
          </filter>
        </defs>
        <g filter="url(#map-shadow)">{geo.features.filter((f) => f.properties.code !== '88').map((f) => renderDept(f as DeptFeature, path))}</g>
        {island && (
          <g>
            <rect x="12" y="12" width="82" height="82" rx="6" fill="white" stroke="#d0d0d0" />
            {renderDept(island.f as DeptFeature, island.p)}
            <text x="53" y="104" textAnchor="middle" fontSize="9" fill="#5f656b">San Andrés</text>
          </g>
        )}
        {project && points.map((pt) => {
          const xy = project([pt.lng, pt.lat]);
          if (!xy) return null;
          return (
            <g key={pt.id} transform={`translate(${xy[0]},${xy[1]})`} className={onPointSelect ? 'cursor-pointer' : ''}
              onClick={() => onPointSelect?.(pt.id)} tabIndex={onPointSelect ? 0 : -1} role={onPointSelect ? 'button' : undefined} aria-label={pt.label}
              onKeyDown={(e) => { if (e.key === 'Enter') onPointSelect?.(pt.id); }}>
              <circle r={pt.active ? 9 : 6} fill={pt.active ? '#ffffff' : '#2b2f33'} stroke={pt.active ? '#c51718' : '#fff'} strokeWidth={pt.active ? 4 : 1.5} />
              <title>{pt.label}</title>
            </g>
          );
        })}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute z-10 rounded-lg bg-ink px-3 py-1.5 text-sm text-white shadow-lg" style={{ left: hover.x + 12, top: hover.y + 12 }}>
          <strong>{hover.name}</strong>{hover.value !== null && <> · {formatValue(hover.value)}</>}
        </div>
      )}
      {max > 0 && (
        <figcaption className="mt-2 flex items-center gap-2 text-xs text-muted">
          <span>Menor</span>
          {RED_SCALE.slice(1).map((c) => <span key={c} className="h-2.5 w-6 rounded-sm" style={{ background: c }} />)}
          <span>Mayor</span>
          <span className="ml-3 inline-block h-2.5 w-6 rounded-sm bg-[#b4b4b6]" /> <span>Sin datos</span>
        </figcaption>
      )}
    </figure>
  );
}

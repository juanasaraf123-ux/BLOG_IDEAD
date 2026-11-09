import { Link } from 'react-router-dom';
import { publicGet } from '../../shared/api';
import { fmtCurrency, fmtDate, fmtNumber, label } from '../../shared/format';
import { DataTable } from '../../shared/DataTable';
import { Badge, DemoBadge, ErrorBox, Pending, Spinner, useAsync } from '../../shared/ui';
import type { CatSummary } from '../../shared/types';
import { ColombiaMap } from './ColombiaMap';
import { ProgressBars } from './Charts';

/* Listados y fichas que complementan a los indicadores numéricos (definidos en la columna «widget» del catálogo). */

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function Loader<T>({ load, deps, children }: { load: () => Promise<T>; deps: unknown[]; children: (d: T) => React.ReactNode }) {
  const { data, error, loading, reload } = useAsync(load, deps);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return <>{children(data as T)}</>;
}

const LIST_TITLES: Record<string, string> = {
  plataformas_digitales: 'Plataformas y recursos digitales', grupos_investigacion: 'Grupos de investigación', semilleros: 'Semilleros',
  formacion_continua: 'Oferta de formación continua', opciones_grado: 'Opciones de grado', hitos_oferta: 'Hitos de la oferta académica',
  representacion_estudiantil: 'Representación estudiantil', planes_mejoramiento: 'Planes de mejoramiento', servicios_bienestar: 'Servicios de bienestar y TUIDEAD',
};

export function CatalogList({ type }: { type: string }) {
  return (
    <Loader load={() => publicGet<Any[]>(`lists/${type}`)} deps={[type]}>
      {(items) => items.length === 0 ? <Pending text={`${LIST_TITLES[type] ?? 'Listado'}: pendiente de publicación`} /> : (
        <div>
          <h4 className="mb-2 font-bold text-ink">{LIST_TITLES[type] ?? 'Listado'}</h4>
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((it) => (
              <li key={it.id} className="rounded-xl border border-line p-4">
                <p className="font-bold text-ink">{it.url ? <a href={it.url} target="_blank" rel="noopener noreferrer" className="hover:text-ut-red hover:underline">{it.title}</a> : it.title} {it.is_demo && <DemoBadge />}</p>
                <p className="mt-1 flex flex-wrap gap-2 text-xs">{it.category && <Badge>{it.category}</Badge>}{it.state && <Badge tone="teal">{it.state}</Badge>}{it.year && <Badge tone="blue">{it.year}</Badge>}</p>
                {it.description && <p className="mt-2 text-sm text-muted">{it.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Loader>
  );
}

export function ProgramsTable({ filters }: { filters: Record<string, string> }) {
  return (
    <Loader load={() => publicGet<Any[]>('programs', { level_id: filters.level, cat: filters.cat })} deps={[filters.level, filters.cat]}>
      {(rows) => (
        <DataTable rows={rows} caption="Programas académicos" csvName="programas" columns={[
          { key: 'name', label: 'Programa', render: (r) => <Link to={`/programas/${r.slug}`} className="font-semibold text-ut-red hover:underline">{r.name}</Link> },
          { key: 'level', label: 'Nivel' }, { key: 'area', label: 'Área de conocimiento' },
          { key: 'status', label: 'Estado', value: (r) => label(r.status) }, { key: 'cats_count', label: 'CAT', align: 'right' },
        ]} />
      )}
    </Loader>
  );
}

export function OfferingsTable({ filters }: { filters: Record<string, string> }) {
  return (
    <Loader load={() => publicGet<Any[]>('offerings', { cat: filters.cat, program: filters.program, period: filters.period, department: filters.department, level: filters.level })} deps={[JSON.stringify(filters)]}>
      {(rows) => rows.length === 0 ? <Pending text="Oferta por CAT pendiente de publicación" /> : (
        <DataTable rows={rows} caption="Programas disponibles por CAT" csvName="oferta_por_cat" columns={[
          { key: 'period', label: 'Período' },
          { key: 'cat', label: 'CAT', render: (r) => <Link to={`/cat/${r.cat_slug}`} className="hover:text-ut-red hover:underline">{r.cat}</Link> },
          { key: 'department', label: 'Departamento' },
          { key: 'program', label: 'Programa', render: (r) => <Link to={`/programas/${r.program_slug}`} className="hover:text-ut-red hover:underline">{r.program}</Link> },
          { key: 'level', label: 'Nivel' },
          { key: 'admits_new', label: 'Admisión', value: (r) => (r.admits_new ? 'Recibe estudiantes nuevos' : 'Solo cohortes en curso'), render: (r) => <Badge tone={r.admits_new ? 'green' : 'gray'}>{r.admits_new ? 'Recibe nuevos' : 'Solo cohortes en curso'}</Badge> },
          { key: 'approved_quota', label: 'Cupos', align: 'right', render: (r) => fmtNumber(r.approved_quota) },
        ]} />
      )}
    </Loader>
  );
}

type CatDetail = CatSummary & { sites: Any[]; facilities: Any[]; events: Any[] };

function useCats(dept?: string) {
  return () => publicGet<CatDetail[]>('cats', { with: 'details' }).then((l) => l.filter((c) => !dept || c.department_code === dept));
}

export function CatsWidget({ mode }: { mode: 'map' | 'table' | 'facilities' | 'timeline' | 'cards' }) {
  return (
    <Loader load={useCats()} deps={[mode]}>
      {(cats) => {
        if (!cats.length) return <Pending text="Información de CAT pendiente de publicación" />;
        if (mode === 'map') {
          const byDept: Record<string, number> = {};
          cats.forEach((c) => (byDept[c.department_code] = (byDept[c.department_code] ?? 0) + 1));
          return (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
              <ColombiaMap title="CAT por departamento" values={byDept} formatValue={(v) => `${v} CAT`} className="max-w-sm"
                points={cats.filter((c) => c.latitude !== null).map((c) => ({ id: c.slug, lat: c.latitude!, lng: c.longitude!, label: c.name }))} />
              <DataTable rows={cats} caption="CAT por municipio y departamento" csvName="cat" columns={[
                { key: 'name', label: 'CAT', render: (r) => <Link to={`/cat/${r.slug}`} className="font-semibold text-ut-red hover:underline">{r.name}</Link> },
                { key: 'municipality', label: 'Municipio' }, { key: 'department', label: 'Departamento' }, { key: 'status', label: 'Estado', value: (r) => label(r.status) },
              ]} />
            </div>
          );
        }
        if (mode === 'table') {
          const rows: Any[] = cats.flatMap((c) => (c.sites.length ? c.sites : [{ name: '—', ownership: null, address: null }]).map((s: Any) => ({ ...s, cat: c.name, slug: c.slug, department: c.department, municipality: c.municipality })));
          return <DataTable rows={rows} caption="CAT y sedes" csvName="cat_sedes" columns={[
            { key: 'cat', label: 'CAT', render: (r) => <Link to={`/cat/${r.slug}`} className="hover:text-ut-red hover:underline">{r.cat}</Link> },
            { key: 'name', label: 'Sede' }, { key: 'ownership', label: 'Carácter', value: (r) => label(r.ownership) }, { key: 'municipality', label: 'Municipio' }, { key: 'department', label: 'Departamento' },
          ]} />;
        }
        if (mode === 'facilities') {
          const types = [...new Set(cats.flatMap((c) => c.facilities.map((f: Any) => f.facility_type)))];
          const rows = cats.map((c) => ({ cat: c.name, slug: c.slug, ...Object.fromEntries(c.facilities.map((f: Any) => [f.facility_type, f.quantity])) }));
          return <DataTable rows={rows} caption="Espacios físicos por CAT" csvName="espacios_cat" columns={[
            { key: 'cat', label: 'CAT', render: (r) => <Link to={`/cat/${r.slug}`} className="hover:text-ut-red hover:underline">{r.cat}</Link> },
            ...types.map((t) => ({ key: t, label: label(t), align: 'right' as const, render: (r: Any) => fmtNumber(r[t] ?? null) })),
          ]} />;
        }
        if (mode === 'timeline') {
          const events: Any[] = cats.flatMap((c) => c.events.map((e: Any) => ({ ...e, cat: c.name, slug: c.slug }))).sort((a: Any, b: Any) => String(a.event_date).localeCompare(String(b.event_date)));
          return (
            <ol className="relative ml-3 border-l-2 border-ut-red/30">
              {events.map((e, i) => (
                <li key={i} className="mb-4 ml-5">
                  <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-ut-red" aria-hidden />
                  <p className="text-sm font-bold text-ut-red">{fmtDate(e.event_date, { month: 'long', year: 'numeric' })} · {label(e.event_type)}</p>
                  <p className="text-ink"><Link to={`/cat/${e.slug}`} className="font-semibold hover:underline">{e.cat}</Link>{e.description ? ` — ${e.description}` : ''}</p>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((c) => (
              <li key={c.slug}>
                <Link to={`/cat/${c.slug}`} className="block h-full rounded-xl border border-line p-4 hover:border-ut-red/50 hover:shadow-md">
                  <p className="font-extrabold text-ut-red">{c.name} {c.is_demo && <DemoBadge />}</p>
                  <p className="text-sm text-muted">{c.municipality}, {c.department}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-muted">Estudiantes</dt><dd className="font-bold">{c.summary.students?.value != null ? fmtNumber(c.summary.students.value) : 'Pendiente'}</dd></div>
                    <div><dt className="text-muted">Docentes</dt><dd className="font-bold">{c.summary.teachers?.value != null ? fmtNumber(c.summary.teachers.value) : 'Pendiente'}</dd></div>
                    <div><dt className="text-muted">Programas</dt><dd className="font-bold">{c.summary.programs ?? 'Pendiente'}</dd></div>
                    <div><dt className="text-muted">Municipios</dt><dd className="font-bold">{c.summary.municipalities ?? 'Pendiente'}</dd></div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        );
      }}
    </Loader>
  );
}

export const PROJECT_STATUS_TONE: Record<string, 'gray' | 'amber' | 'blue' | 'green' | 'red'> = { radicado: 'gray', aprobado: 'blue', en_ejecucion: 'amber', finalizado: 'green', suspendido: 'red' };

export function ProjectsWidget({ mode, filters = {} }: { mode: 'table' | 'map' | 'progress'; filters?: Record<string, string> }) {
  return (
    <Loader load={() => publicGet<Any[]>('projects', { cat: filters.cat, department: filters.department, status: filters.status, investment_line: filters.investment_line })} deps={[mode, JSON.stringify(filters)]}>
      {(rows) => {
        if (!rows.length) return <Pending text="Proyectos pendientes de publicación" />;
        if (mode === 'progress') return <ProgressBars data={rows.map((p) => ({ label: p.name, value: p.progress_pct }))} />;
        if (mode === 'map') {
          const byDept: Record<string, number> = {};
          rows.forEach((p) => [...new Set(p.cats.map((c: Any) => c.department_code))].forEach((d) => (byDept[d as string] = (byDept[d as string] ?? 0) + 1)));
          return <ColombiaMap title="Proyectos por departamento beneficiado" values={byDept} formatValue={(v) => `${v} proyecto(s)`} className="max-w-sm" />;
        }
        return <DataTable rows={rows} caption="Proyectos de inversión" csvName="proyectos" columns={[
          { key: 'name', label: 'Proyecto', render: (r) => <Link to={`/proyectos/${r.slug}`} className="font-semibold text-ut-red hover:underline">{r.name}</Link> },
          { key: 'investment_line', label: 'Línea', value: (r) => label(r.investment_line) },
          { key: 'status', label: 'Estado', value: (r) => label(r.status), render: (r) => <Badge tone={PROJECT_STATUS_TONE[r.status]}>{label(r.status)}</Badge> },
          { key: 'approved_amount', label: 'Aprobado', align: 'right', render: (r) => fmtCurrency(r.approved_amount) },
          { key: 'executed_amount', label: 'Ejecutado', align: 'right', render: (r) => fmtCurrency(r.executed_amount) },
          { key: 'progress_pct', label: 'Avance', align: 'right', render: (r) => (r.progress_pct === null ? '—' : `${fmtNumber(r.progress_pct)} %`) },
          { key: 'beneficiaries_count', label: 'Beneficiarios', align: 'right', render: (r) => fmtNumber(r.beneficiaries_count) },
        ]} />;
      }}
    </Loader>
  );
}

export function AgreementsTable() {
  return (
    <Loader load={() => publicGet<Any[]>('agreements')} deps={[]}>
      {(rows) => rows.length === 0 ? <Pending text="Convenios públicos pendientes de publicación" /> : (
        <DataTable rows={rows} caption="Convenios institucionales" csvName="convenios" columns={[
          { key: 'number', label: 'Número' }, { key: 'counterpart', label: 'Entidad' }, { key: 'object', label: 'Objeto' },
          { key: 'status', label: 'Estado', value: (r) => label(r.status) },
          { key: 'start_date', label: 'Inicio', render: (r) => fmtDate(r.start_date, { dateStyle: 'medium' }) },
          { key: 'end_date', label: 'Fin', render: (r) => fmtDate(r.end_date, { dateStyle: 'medium' }) },
          { key: 'contributed_amount', label: 'Recursos', align: 'right', render: (r) => fmtCurrency(r.contributed_amount) },
        ]} />
      )}
    </Loader>
  );
}

export function AccreditationList({ filters }: { filters: Record<string, string> }) {
  return (
    <Loader load={() => publicGet<Any[]>('programs', { level_id: filters.level })} deps={[filters.level]}>
      {(rows) => (
        <DataTable rows={rows} caption="Registros calificados y acreditación" csvName="calidad_programas" columns={[
          { key: 'name', label: 'Programa', render: (r) => <Link to={`/programas/${r.slug}`} className="hover:text-ut-red hover:underline">{r.name}</Link> },
          { key: 'level', label: 'Nivel' },
          { key: 'qualified_registry_until', label: 'Registro calificado vigente hasta', render: (r) => (r.qualified_registry_until ? fmtDate(r.qualified_registry_until, { dateStyle: 'medium' }) : 'Pendiente') },
          { key: 'accreditation_until', label: 'Acreditación de alta calidad', render: (r) => (r.accreditation_until ? <Badge tone="green">Hasta {fmtDate(r.accreditation_until, { dateStyle: 'medium' })}</Badge> : '—') },
        ]} />
      )}
    </Loader>
  );
}

export function Widget({ type, filters }: { type: string; filters: Record<string, string> }) {
  if (type.startsWith('list:')) return <CatalogList type={type.slice(5)} />;
  switch (type) {
    case 'programs': return <ProgramsTable filters={filters} />;
    case 'offerings': return <OfferingsTable filters={filters} />;
    case 'cats_map': return <CatsWidget mode="map" />;
    case 'cats_table': return <CatsWidget mode="table" />;
    case 'cat_facilities': return <CatsWidget mode="facilities" />;
    case 'cat_timeline': return <CatsWidget mode="timeline" />;
    case 'cat_cards': return <CatsWidget mode="cards" />;
    case 'projects': return <ProjectsWidget mode="table" filters={filters} />;
    case 'projects_map': return <ProjectsWidget mode="map" filters={filters} />;
    case 'projects_progress': return <ProjectsWidget mode="progress" filters={filters} />;
    case 'agreements': return <AgreementsTable />;
    case 'accreditation': return <AccreditationList filters={filters} />;
    default: return null;
  }
}

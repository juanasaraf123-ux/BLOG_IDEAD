import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicGet } from '../../shared/api';
import { fmtDate, fmtNumber, fmtValue, label } from '../../shared/format';
import { Icon } from '../../shared/icons';
import type { CatSummary, EventCard, NewsCard } from '../../shared/types';
import { Badge, DemoBadge, ErrorBox, Pending, SectionTitle, Spinner, useAsync, useDocumentTitle } from '../../shared/ui';
import { DataTable } from '../../shared/DataTable';
import { ColombiaMap } from '../components/ColombiaMap';
import { PageShell } from '../components/Layout';
import NotFound from './NotFound';

export function CatList() {
  useDocumentTitle('Centros de Atención Tutorial');
  const { data, error, loading } = useAsync(() => publicGet<CatSummary[]>('cats'), []);
  const [dept, setDept] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const byDept = useMemo(() => {
    const m: Record<string, number> = {};
    data?.forEach((c) => (m[c.department_code] = (m[c.department_code] ?? 0) + 1));
    return m;
  }, [data]);
  const list = (data ?? []).filter((c) => (!dept || c.department_code === dept) && (!q || `${c.name} ${c.municipality}`.toLowerCase().includes(q.toLowerCase())));
  const departments = [...new Map((data ?? []).map((c) => [c.department_code, c.department])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  return (
    <PageShell title="Centros de Atención Tutorial (CAT)" intro="La red territorial del IDEAD. Seleccione un departamento en el mapa o use los filtros para consultar la ficha de cada CAT.">
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {data && data.length === 0 && <Pending text="La red de CAT se publicará cuando CRIDEAD valide la información" />}
      {data && data.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <div>
            <ColombiaMap title="Mapa de los CAT del IDEAD por departamento" values={byDept} selected={dept} onSelect={setDept} formatValue={(v) => `${v} CAT`}
              points={data.filter((c) => c.latitude !== null).map((c) => ({ id: c.slug, lat: c.latitude!, lng: c.longitude!, label: `${c.name} (${c.municipality})` }))}
              onPointSelect={(slug) => (window.location.href = `/cat/${slug}`)} />
            <p className="mt-2 text-xs text-muted">Ubicaciones mostradas solo para CAT con coordenadas verificadas. Límites: DANE – MGN.</p>
          </div>
          <div>
            <div className="mb-4 flex flex-wrap gap-3">
              <label className="flex flex-col text-xs font-bold text-muted uppercase">Departamento
                <select value={dept ?? ''} onChange={(e) => setDept(e.target.value || null)} className="mt-1 rounded-lg border border-line px-2 py-2 text-sm text-ink normal-case">
                  <option value="">Todos</option>{departments.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                </select>
              </label>
              <label className="flex flex-1 flex-col text-xs font-bold text-muted uppercase">Buscar CAT o municipio
                <input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 rounded-lg border border-line px-3 py-2 text-sm text-ink normal-case" />
              </label>
            </div>
            <p className="mb-3 text-sm text-muted" aria-live="polite">{list.length} CAT</p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {list.map((c) => (
                <li key={c.slug}>
                  <Link to={`/cat/${c.slug}`} className="block h-full rounded-xl border border-line bg-white p-4 transition hover:border-ut-red/50 hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-lg font-extrabold text-ut-red">{c.name}</p>
                      {c.is_demo && <DemoBadge />}
                    </div>
                    <p className="text-sm text-muted">{c.municipality}, {c.department} · {label(c.status)}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div><dt className="text-muted">Estudiantes</dt><dd className="font-bold">{c.summary.students?.value != null ? fmtNumber(c.summary.students.value) : 'Pendiente'}</dd></div>
                      <div><dt className="text-muted">Programas</dt><dd className="font-bold">{c.summary.programs ?? 'Pendiente'}</dd></div>
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </PageShell>
  );
}

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function CatDetail() {
  const { slug } = useParams();
  const { data: c, error, loading, status } = useAsync(() => publicGet<Any>(`cats/${slug}`), [slug]);
  useDocumentTitle(c?.name ?? 'CAT');
  if (status === 404) return <NotFound />;
  return (
    <PageShell title={c?.name ?? '…'} crumbs={[{ to: '/cat', label: 'CAT' }]}
      intro={c && <span className="flex flex-wrap items-center gap-2">{c.municipality.name}, {c.municipality.department.name} <Badge tone={c.status === 'activo' ? 'green' : 'amber'}>{label(c.status)}</Badge>{c.is_demo && <DemoBadge />}</span>}>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {c && (
        <div className="space-y-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div>
              {c.photo_url ? <img src={c.photo_url} alt={`Fotografía del ${c.name}`} className="mb-6 aspect-video w-full rounded-xl object-cover" /> : null}
              <SectionTitle>Historia</SectionTitle>
              {c.history ? <div className="prose-idead" dangerouslySetInnerHTML={{ __html: c.history }} /> : <Pending />}
            </div>
            <aside className="space-y-4 rounded-2xl border border-line bg-surface/60 p-5">
              <h2 className="text-lg font-extrabold text-ut-red">Información de contacto</h2>
              <dl className="space-y-3 text-sm">
                <div><dt className="flex items-center gap-2 font-bold"><Icon name="pin" className="shrink-0 text-ut-red" />Ubicación</dt><dd className="pl-6">{c.address ?? 'Pendiente'} — {c.municipality.name}, {c.municipality.department.name}</dd></div>
                <div><dt className="flex items-center gap-2 font-bold"><Icon name="phone" className="shrink-0 text-ut-red" />Teléfono</dt><dd className="pl-6">{c.phone ?? 'Pendiente'}</dd></div>
                <div><dt className="flex items-center gap-2 font-bold"><Icon name="mail" className="shrink-0 text-ut-red" />Correo</dt><dd className="pl-6">{c.email ? <a href={`mailto:${c.email}`} className="text-ut-red underline">{c.email}</a> : 'Pendiente'}</dd></div>
                <div><dt className="flex items-center gap-2 font-bold"><Icon name="clock" className="shrink-0 text-ut-red" />Horarios</dt><dd className="pl-6 whitespace-pre-line">{c.schedule ?? 'Pendiente'}</dd></div>
                <div><dt className="flex items-center gap-2 font-bold"><Icon name="user" className="shrink-0 text-ut-red" />Responsable institucional</dt><dd className="pl-6">{c.manager_name ?? 'Publicación no autorizada o pendiente'}</dd></div>
                {c.opened_on && <div><dt className="flex items-center gap-2 font-bold"><Icon name="calendar" className="shrink-0 text-ut-red" />Inicio de actividades</dt><dd className="pl-6">{fmtDate(c.opened_on, { month: 'long', year: 'numeric' })}</dd></div>}
              </dl>
              {c.coverage?.length > 0 && <div><p className="text-sm font-bold">Municipios atendidos</p><p className="text-sm">{c.coverage.map((m: Any) => m.name).join(', ')}</p></div>}
            </aside>
          </div>

          <section>
            <SectionTitle>Cifras integradas del CAT</SectionTitle>
            {c.figures.length === 0 ? <Pending /> : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {c.figures.map((f: Any) => (
                  <li key={f.code}>
                    <Link to={`/estadisticas/${f.module_slug}?cat=${c.id}#${f.code}`} className="block h-full rounded-xl border border-line bg-white p-4 hover:border-ut-red/50 hover:shadow-md">
                      <p className="text-2xl font-extrabold text-ut-red tabular-nums">{f.suppressed ? 'Reservado' : fmtValue(f.value, f.value_type)}</p>
                      <p className="text-sm leading-snug font-semibold text-ink">{f.name}</p>
                      <p className="mt-1 text-xs text-muted">{f.module} · {f.period} {f.is_demo && <DemoBadge />}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <SectionTitle>Oferta académica</SectionTitle>
            {c.offerings.length === 0 ? <Pending /> : (
              <DataTable rows={c.offerings} caption="Programas ofrecidos en el CAT" csvName={`oferta_${c.slug}`} columns={[
                { key: 'program', label: 'Programa', render: (r: Any) => <Link to={`/programas/${r.slug}`} className="font-semibold text-ut-red hover:underline">{r.program}</Link> },
                { key: 'level', label: 'Nivel' }, { key: 'period', label: 'Período' },
                { key: 'admits_new', label: 'Admisión', value: (r: Any) => (r.admits_new ? 'Recibe estudiantes nuevos' : 'Solo cohortes en curso') },
                { key: 'approved_quota', label: 'Cupos', align: 'right' },
              ]} />
            )}
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <SectionTitle>Infraestructura</SectionTitle>
              {c.facilities.length === 0 ? <Pending /> : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {c.facilities.map((f: Any) => <li key={f.id} className="rounded-xl border border-line p-3"><p className="text-2xl font-extrabold text-ink">{f.quantity}</p><p className="text-sm text-muted">{label(f.facility_type)}{f.capacity ? ` · ${f.capacity} puestos` : ''}</p></li>)}
                </ul>
              )}
              {c.sites.length > 0 && <ul className="mt-4 space-y-1 text-sm">{c.sites.map((s: Any) => <li key={s.id}><strong>{s.name}</strong> — sede {label(s.ownership).toLowerCase()}{s.address ? `, ${s.address}` : ''}</li>)}</ul>}
            </section>
            <section>
              <SectionTitle>Línea de tiempo</SectionTitle>
              {c.events.length === 0 ? <Pending /> : (
                <ol className="relative ml-3 border-l-2 border-ut-red/30">
                  {c.events.map((e: Any) => (
                    <li key={e.id} className="mb-4 ml-5">
                      <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-ut-red" aria-hidden />
                      <p className="text-sm font-bold text-ut-red">{fmtDate(e.event_date)} · {label(e.event_type)}</p>
                      <p>{e.description}{e.act_reference ? ` (${e.act_reference})` : ''}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          {c.projects.length > 0 && (
            <section>
              <SectionTitle>Proyectos asociados</SectionTitle>
              <ul className="grid gap-3 sm:grid-cols-2">
                {c.projects.map((p: Any) => <li key={p.id}><Link to={`/proyectos/${p.slug}`} className="block rounded-xl border border-line p-4 hover:border-ut-red/50"><p className="font-bold text-ink">{p.name}</p><p className="text-sm text-muted">{label(p.status)} · avance {p.progress_pct ?? 0} %</p></Link></li>)}
              </ul>
            </section>
          )}
          {(c.news.length > 0 || c.activities.length > 0) && (
            <section className="grid gap-8 md:grid-cols-2">
              {c.news.length > 0 && <div><SectionTitle>Noticias del CAT</SectionTitle><ul className="space-y-2">{c.news.map((n: NewsCard) => <li key={n.slug}><Link to={`/noticias/${n.slug}`} className="font-semibold hover:text-ut-red">{n.title}</Link> <span className="text-sm text-muted">{fmtDate(n.date)}</span></li>)}</ul></div>}
              {c.activities.length > 0 && <div><SectionTitle>Próximas actividades</SectionTitle><ul className="space-y-2">{(c.activities as EventCard[]).map((e) => <li key={e.slug}><Link to={`/actividades/${e.slug}`} className="font-semibold hover:text-ut-red">{e.title}</Link></li>)}</ul></div>}
            </section>
          )}
          {c.media.length > 0 && (
            <section>
              <SectionTitle>Fotografías autorizadas</SectionTitle>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{c.media.filter((m: Any) => m.url).map((m: Any) => <li key={m.id}><img src={m.url} alt={m.title} loading="lazy" className="aspect-video w-full rounded-lg object-cover" /></li>)}</ul>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}

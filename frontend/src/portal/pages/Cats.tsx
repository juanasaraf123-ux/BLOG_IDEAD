import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicGet } from '../../shared/api';
import { fmtDate, fmtNumber, fmtValue, label } from '../../shared/format';
import { Icon } from '../../shared/icons';
import type { CatSummary, EventCard, NewsCard } from '../../shared/types';
import { DemoBadge, ErrorBox, Pending, Spinner, useAsync, useDocumentTitle } from '../../shared/ui';
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

/** Primeros párrafos de un HTML (vista previa de la historia). */
function firstParagraphs(html: string, n: number) {
  const parts = html.match(/<p[\s\S]*?<\/p>/gi) ?? [html];
  return { preview: parts.slice(0, n).join(''), more: parts.length > n };
}

export function CatDetail() {
  const { slug } = useParams();
  const { data: c, error, loading, status } = useAsync(() => publicGet<Any>(`cats/${slug}`), [slug]);
  useDocumentTitle(c?.name ?? 'CAT');
  const [tab, setTab] = useState<string | null>(null);
  const [fullHistory, setFullHistory] = useState(false);
  if (status === 404) return <NotFound />;
  if (loading) return <div className="mx-auto max-w-[1500px] px-4 py-10 lg:px-8"><Spinner /></div>;
  if (error || !c) return <div className="mx-auto max-w-[1500px] px-4 py-10 lg:px-8"><ErrorBox message={error ?? 'No se pudo cargar el CAT.'} /></div>;

  const real = (v?: string | null) => (v && !/^pendiente/i.test(v.trim()) ? v : null);
  const place = `${c.municipality.name}, ${c.municipality.department.name}`;
  const contact = [
    ['pin', 'Ubicación', real(c.address) ? `${c.address}` : place],
    ['phone', 'Teléfono', real(c.phone)],
    ['clock', 'Horario', real(c.schedule)],
    ['mail', 'Correo', real(c.email)],
  ].filter(([, , v]) => v) as [string, string, string][];
  const PRIORITY = ['M02-I03', 'M02-I01', 'M04-I03', 'M04-I01', 'M01-I02', 'M01-I03'];
  const keyFigures = (c.figures as Any[]).filter((f) => !f.suppressed && PRIORITY.includes(f.code))
    .sort((x, y) => PRIORITY.indexOf(x.code) - PRIORITY.indexOf(y.code)).slice(0, 4);
  const story = c.history ? firstParagraphs(c.history, 2) : null;
  const tabs: { key: string; label: string; icon: string; show: boolean }[] = [
    { key: 'historia', label: 'Historia', icon: 'book', show: !!c.history },
    { key: 'cifras', label: 'Cifras', icon: 'chart', show: c.figures.length > 0 },
    { key: 'oferta', label: 'Oferta académica', icon: 'graduation', show: c.offerings.length > 0 },
    { key: 'sede', label: 'Sede e infraestructura', icon: 'building', show: c.facilities.length > 0 || c.sites.length > 0 },
    { key: 'linea', label: 'Línea de tiempo', icon: 'history', show: c.events.length > 0 },
    { key: 'novedades', label: 'Noticias y actividades', icon: 'calendar', show: c.news.length > 0 || c.activities.length > 0 },
    { key: 'proyectos', label: 'Proyectos', icon: 'project', show: c.projects.length > 0 },
    { key: 'fotos', label: 'Fotos', icon: 'image', show: c.media.some((m: Any) => m.url) },
  ];
  const visible = tabs.filter((t) => t.show);
  const missing = tabs.filter((t) => !t.show && ['historia', 'oferta', 'sede', 'linea'].includes(t.key)).map((t) => t.label.toLowerCase());
  const active = visible.find((t) => t.key === tab)?.key ?? visible[0]?.key;

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 lg:px-8">
      <nav aria-label="Ruta de navegación" className="mb-3 text-sm text-muted">
        <ol className="flex flex-wrap gap-1">
          <li><Link to="/" className="hover:text-ut-red">Inicio</Link></li>
          <li className="before:mx-1 before:content-['/']"><Link to="/cat" className="hover:text-ut-red">CAT</Link></li>
          <li className="before:mx-1 before:content-['/']" aria-current="page">{c.name}</li>
        </ol>
      </nav>

      {/* Encabezado: nombre, lugar, estado y cifras clave */}
      <header className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-ut-red via-[#b3161f] to-ut-red-dark text-white shadow-[0_18px_40px_-20px_rgb(149_21_29/0.7)]">
        <span className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-white/[0.07]" aria-hidden />
        <div className="relative grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:p-8">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm text-white/85"><Icon name="pin" /> {place}
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">{label(c.status)}</span>{c.is_demo && <DemoBadge />}</p>
            <h1 className="mt-1 text-3xl font-extrabold md:text-[2.6rem]">{c.name}</h1>
            {keyFigures.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-3">
                {keyFigures.map((f) => (
                  <li key={f.code} className="min-w-[9rem] rounded-2xl bg-white/12 px-4 py-3 ring-1 ring-white/25 backdrop-blur">
                    <p className="text-2xl leading-none font-extrabold tabular-nums">{fmtValue(f.value, f.value_type)}</p>
                    <p className="mt-1 text-xs leading-tight text-white/85">{f.name}</p>
                    <p className="text-[0.65rem] text-white/65">{f.period}{f.is_demo ? ' · DEMO' : ''}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="hidden w-40 self-center rounded-2xl bg-white/95 p-2 shadow-lg md:block [&_figcaption]:hidden">
            {c.photo_url ? <img src={c.photo_url} alt={`Fotografía del ${c.name}`} className="aspect-square w-full rounded-xl object-cover" /> : (
              <ColombiaMap title={`Ubicación del ${c.name} en el departamento de ${c.municipality.department.name}`} values={{ [c.municipality.department.code]: 1 }} selected={c.municipality.department.code} />
            )}
          </div>
        </div>
      </header>

      {/* Contacto en tarjetas pequeñas */}
      {contact.length > 0 && (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {contact.map(([icon, l, v]) => (
            <li key={l} className="flex gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ut-red-50 text-xl text-ut-red"><Icon name={icon} /></span>
              <span className="min-w-0 text-sm"><span className="block font-bold text-ink">{l}</span>
                {icon === 'mail' ? <a href={`mailto:${v}`} className="break-words text-ut-red underline">{v}</a> : <span className="block text-muted">{v}</span>}</span>
            </li>
          ))}
        </ul>
      )}
      {c.coverage?.length > 0 && <p className="mt-3 text-sm text-muted"><strong className="text-ink">Municipios atendidos:</strong> {c.coverage.map((m: Any) => m.name).join(', ')}</p>}

      {/* Pestañas: solo las secciones con información */}
      {visible.length > 0 && (
        <section className="mt-8">
          <div role="tablist" aria-label="Información del CAT" className="flex gap-1 overflow-x-auto border-b border-line">
            {visible.map((t) => (
              <button key={t.key} role="tab" type="button" aria-selected={active === t.key} onClick={() => setTab(t.key)}
                className={`flex shrink-0 items-center gap-1.5 border-b-[3px] px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${active === t.key ? 'border-ut-red text-ut-red' : 'border-transparent text-muted hover:text-ink'}`}>
                <Icon name={t.icon} /> {t.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="pt-6">
            {active === 'historia' && story && (
              <div className="max-w-3xl">
                <div className="prose-idead" dangerouslySetInnerHTML={{ __html: fullHistory ? c.history : story.preview }} />
                {story.more && (
                  <button type="button" onClick={() => setFullHistory(!fullHistory)} className="mt-2 inline-flex items-center gap-1 rounded-full border border-ut-red/40 px-4 py-1.5 text-sm font-semibold text-ut-red hover:bg-ut-red-50">
                    {fullHistory ? 'Mostrar menos' : 'Leer historia completa'} <Icon name="chevronDown" className={fullHistory ? 'rotate-180' : ''} />
                  </button>
                )}
              </div>
            )}
            {active === 'cifras' && (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {c.figures.map((f: Any) => (
                  <li key={f.code}>
                    <Link to={`/estadisticas/${f.module_slug}?cat=${c.id}#${f.code}`} className="block h-full rounded-2xl border border-line bg-white p-4 hover:border-ut-red/50 hover:shadow-md">
                      <p className="text-2xl font-extrabold text-ut-red tabular-nums">{f.suppressed ? 'Reservado' : fmtValue(f.value, f.value_type)}</p>
                      <p className="text-sm leading-snug font-semibold text-ink">{f.name}</p>
                      <p className="mt-1 text-xs text-muted">{f.period} {f.is_demo && <DemoBadge />}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {active === 'oferta' && (
              <DataTable rows={c.offerings} caption="Programas ofrecidos en el CAT" csvName={`oferta_${c.slug}`} columns={[
                { key: 'program', label: 'Programa', render: (r: Any) => <Link to={`/programas/${r.slug}`} className="font-semibold text-ut-red hover:underline">{r.program}</Link> },
                { key: 'level', label: 'Nivel' }, { key: 'period', label: 'Período' },
                { key: 'admits_new', label: 'Admisión', value: (r: Any) => (r.admits_new ? 'Recibe estudiantes nuevos' : 'Solo cohortes en curso') },
                { key: 'approved_quota', label: 'Cupos', align: 'right' },
              ]} />
            )}
            {active === 'sede' && (
              <div>
                {c.facilities.length > 0 && (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {c.facilities.map((f: Any) => <li key={f.id} className="rounded-2xl border border-line bg-white p-4"><p className="text-2xl font-extrabold text-ink">{f.quantity}</p><p className="text-sm text-muted">{label(f.facility_type)}{f.capacity ? ` · ${f.capacity} puestos` : ''}</p></li>)}
                  </ul>
                )}
                {c.sites.length > 0 && <ul className="mt-4 space-y-1 text-sm">{c.sites.map((s: Any) => <li key={s.id}><strong>{s.name}</strong> — sede {label(s.ownership).toLowerCase()}{s.address ? `, ${s.address}` : ''}</li>)}</ul>}
              </div>
            )}
            {active === 'linea' && (
              <ol className="relative ml-3 max-w-3xl border-l-2 border-ut-red/30">
                {c.events.map((e: Any) => (
                  <li key={e.id} className="mb-4 ml-5">
                    <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-ut-red" aria-hidden />
                    <p className="text-sm font-bold text-ut-red">{fmtDate(e.event_date)} · {label(e.event_type)}</p>
                    <p>{e.description}{e.act_reference ? ` (${e.act_reference})` : ''}</p>
                  </li>
                ))}
              </ol>
            )}
            {active === 'novedades' && (
              <div className="grid gap-6 md:grid-cols-2">
                {c.news.length > 0 && <div><h2 className="mb-2 font-extrabold text-ink">Noticias</h2><ul className="space-y-2">{c.news.map((n: NewsCard) => <li key={n.slug} className="rounded-xl border border-line bg-white p-3"><Link to={`/noticias/${n.slug}`} className="font-semibold hover:text-ut-red">{n.title}</Link><p className="text-xs text-muted">{fmtDate(n.date)}</p></li>)}</ul></div>}
                {c.activities.length > 0 && <div><h2 className="mb-2 font-extrabold text-ink">Próximas actividades</h2><ul className="space-y-2">{(c.activities as EventCard[]).map((e) => <li key={e.slug} className="rounded-xl border border-line bg-white p-3"><Link to={`/actividades/${e.slug}`} className="font-semibold hover:text-ut-red">{e.title}</Link><p className="text-xs text-muted">{fmtDate(e.starts_at)}</p></li>)}</ul></div>}
              </div>
            )}
            {active === 'proyectos' && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {c.projects.map((p: Any) => <li key={p.id}><Link to={`/proyectos/${p.slug}`} className="block rounded-2xl border border-line bg-white p-4 hover:border-ut-red/50"><p className="font-bold text-ink">{p.name}</p><p className="text-sm text-muted">{label(p.status)} · avance {p.progress_pct ?? 0} %</p></Link></li>)}
              </ul>
            )}
            {active === 'fotos' && (
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{c.media.filter((m: Any) => m.url).map((m: Any) => <li key={m.id}><img src={m.url} alt={m.title} loading="lazy" className="aspect-video w-full rounded-xl object-cover" /></li>)}</ul>
            )}
          </div>
        </section>
      )}
      {missing.length > 0 && <p className="mt-8 text-xs text-muted">En actualización: {missing.join(', ')}.</p>}
    </div>
  );
}

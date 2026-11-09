import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { publicGet } from '../../shared/api';
import { fmtCurrency, fmtDate, fmtDateTime, fmtNumber, label } from '../../shared/format';
import { Icon } from '../../shared/icons';
import type { EventCard, NewsCard, Paginated } from '../../shared/types';
import { Badge, DemoBadge, ErrorBox, Pending, SectionTitle, Spinner, useAsync, useDocumentTitle } from '../../shared/ui';
import { DataTable } from '../../shared/DataTable';
import { PageShell } from '../components/Layout';
import { ProgressBars, TrendChart } from '../components/Charts';
import { PROJECT_STATUS_TONE, ProgramsTable } from '../components/Widgets';
import { useFilterOptions } from '../components/Filters';
import NotFound from './NotFound';

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function Pager({ page, last, onPage }: { page: number; last: number; onPage: (p: number) => void }) {
  if (last <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Paginación">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-line px-4 py-2 font-semibold disabled:opacity-40">Anterior</button>
      <span>Página {page} de {last}</span>
      <button disabled={page >= last} onClick={() => onPage(page + 1)} className="rounded-lg border border-line px-4 py-2 font-semibold disabled:opacity-40">Siguiente</button>
    </nav>
  );
}

const Cover = ({ url, alt }: { url: string | null; alt: string }) =>
  url ? <img src={url} alt={alt} loading="lazy" className="aspect-[16/9] w-full object-cover" /> : (
    <div className="grid aspect-[16/9] w-full place-items-center bg-gradient-to-br from-ut-red to-ut-red-900 text-white/90" aria-hidden><span className="font-extrabold tracking-[0.3em]">IDEAD</span></div>
  );

// ------------------------------------------------------------------ Programas

export function Programs() {
  useDocumentTitle('Oferta académica');
  const opts = useFilterOptions();
  const [params, setParams] = useSearchParams();
  const level = params.get('level') ?? '';
  const cat = params.get('cat') ?? '';
  const set = (k: string, v: string) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };
  return (
    <PageShell title="Oferta académica" intro="Programas de pregrado y posgrado a distancia del IDEAD y los CAT donde se ofrecen. Consulte también los indicadores de acceso en Estadísticas.">
      <div className="mb-5 flex flex-wrap gap-3">
        <label className="flex flex-col text-xs font-bold text-muted uppercase">Nivel
          <select value={level} onChange={(e) => set('level', e.target.value)} className="mt-1 rounded-lg border border-line px-2 py-2 text-sm text-ink normal-case">
            <option value="">Todos</option>{opts.data?.levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs font-bold text-muted uppercase">CAT
          <select value={cat} onChange={(e) => set('cat', e.target.value)} className="mt-1 rounded-lg border border-line px-2 py-2 text-sm text-ink normal-case">
            <option value="">Todos</option>{opts.data?.cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <Link to="/estadisticas/oferta-academica" className="ml-auto self-end font-semibold text-ut-red hover:underline">Indicadores de oferta y acceso →</Link>
      </div>
      <ProgramsTable filters={{ level, cat }} />
    </PageShell>
  );
}

export function ProgramDetail() {
  const { slug } = useParams();
  const { data: p, error, loading, status } = useAsync(() => publicGet<Any>(`programs/${slug}`), [slug]);
  useDocumentTitle(p?.name ?? 'Programa');
  if (status === 404) return <NotFound />;
  return (
    <PageShell title={p?.name ?? '…'} crumbs={[{ to: '/programas', label: 'Programas' }]} intro={p && <span className="flex flex-wrap gap-2">{p.level?.name} · {p.area?.name ?? 'Área pendiente'} <Badge tone={p.status === 'activo' ? 'green' : 'amber'}>{label(p.status)}</Badge>{p.is_demo && <DemoBadge />}</span>}>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {p && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div>
            {p.description ? <div className="prose-idead" dangerouslySetInnerHTML={{ __html: p.description }} /> : <Pending />}
            <SectionTitle>CAT donde se ofrece</SectionTitle>
            {p.offerings.length === 0 ? <Pending /> : (
              <DataTable rows={p.offerings} caption="Oferta del programa por CAT" csvName={`oferta_${p.slug}`} columns={[
                { key: 'period', label: 'Período' },
                { key: 'cat', label: 'CAT', render: (r: Any) => <Link to={`/cat/${r.cat_slug}`} className="text-ut-red hover:underline">{r.cat}</Link> },
                { key: 'department', label: 'Departamento' },
                { key: 'admits_new', label: 'Admisión', value: (r: Any) => (r.admits_new ? 'Recibe estudiantes nuevos' : 'Solo cohortes en curso') },
                { key: 'approved_quota', label: 'Cupos', align: 'right' },
              ]} />
            )}
          </div>
          <aside className="h-fit rounded-2xl border border-line bg-surface/60 p-5">
            <dl className="space-y-3 text-sm">
              <div><dt className="font-bold">Código SNIES</dt><dd>{p.snies_code ?? 'Pendiente'}</dd></div>
              <div><dt className="font-bold">Modalidad</dt><dd className="capitalize">{p.modality}</dd></div>
              <div><dt className="font-bold">Duración</dt><dd>{p.duration_semesters ? `${p.duration_semesters} semestres` : 'Pendiente'}</dd></div>
              <div><dt className="font-bold">Créditos</dt><dd>{p.credits ?? 'Pendiente'}</dd></div>
              <div><dt className="font-bold">Registro calificado vigente hasta</dt><dd>{p.qualified_registry_until ? fmtDate(p.qualified_registry_until) : 'Pendiente'}</dd></div>
              <div><dt className="font-bold">Acreditación de alta calidad</dt><dd>{p.accreditation_until ? `Hasta ${fmtDate(p.accreditation_until)}` : 'No registra'}</dd></div>
            </dl>
          </aside>
        </div>
      )}
    </PageShell>
  );
}

// ------------------------------------------------------------------ Noticias

export function NewsList() {
  useDocumentTitle('Noticias');
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 1);
  const category = params.get('category') ?? '';
  const cats = useAsync(() => publicGet<{ slug: string; name: string }[]>('news-categories'), []);
  const { data, error, loading } = useAsync(() => publicGet<Paginated<NewsCard>>('news', { page, category }), [page, category]);
  const set = (k: string, v: string) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); if (k !== 'page') p.delete('page'); setParams(p); };
  return (
    <PageShell title="Noticias y publicaciones" intro="Novedades institucionales del IDEAD.">
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Categorías">
        <button onClick={() => set('category', '')} aria-pressed={!category} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${!category ? 'bg-ut-red text-white' : 'border border-line hover:border-ut-red'}`}>Todas</button>
        {cats.data?.map((c) => <button key={c.slug} onClick={() => set('category', c.slug)} aria-pressed={category === c.slug} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${category === c.slug ? 'bg-ut-red text-white' : 'border border-line hover:border-ut-red'}`}>{c.name}</button>)}
      </div>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {data && data.data.length === 0 && <Pending text="No hay noticias publicadas en esta categoría." />}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data.map((n) => (
          <li key={n.slug} className="fade-in">
            <Link to={`/noticias/${n.slug}`} className="group block h-full overflow-hidden rounded-2xl border border-line bg-white hover:shadow-lg">
              <Cover url={n.image_url} alt="" />
              <div className="p-5">
                <p className="text-sm font-extrabold text-ut-red">{n.category} {n.is_demo && <DemoBadge />}</p>
                <h2 className="mt-1 text-lg leading-snug font-bold text-ink group-hover:underline">{n.title}</h2>
                <p className="mt-1 text-xs text-muted">{fmtDate(n.date)}</p>
                {n.summary && <p className="mt-2 line-clamp-3 text-sm text-muted">{n.summary}</p>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {data && <Pager page={data.current_page} last={data.last_page} onPage={(p) => set('page', String(p))} />}
    </PageShell>
  );
}

export function NewsDetail() {
  const { slug } = useParams();
  const { data: n, error, loading, status } = useAsync(() => publicGet<Any>(`news/${slug}`), [slug]);
  useDocumentTitle(n?.title ?? 'Noticia');
  if (status === 404) return <NotFound />;
  return (
    <PageShell title={n?.title ?? '…'} crumbs={[{ to: '/noticias', label: 'Noticias' }]} intro={n && <span>{n.category} · {fmtDate(n.date)} {n.is_demo && <DemoBadge />}</span>}>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {n && (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <article>
            {n.image_url && <img src={n.image_url} alt={n.title} className="mb-6 w-full rounded-xl" />}
            {n.summary && <p className="mb-4 text-xl text-ink">{n.summary}</p>}
            <div className="prose-idead" dangerouslySetInnerHTML={{ __html: n.body ?? '' }} />
          </article>
          {n.related.length > 0 && (
            <aside><h2 className="mb-3 font-extrabold text-ut-red">Relacionadas</h2>
              <ul className="space-y-3">{n.related.map((r: NewsCard) => <li key={r.slug}><Link to={`/noticias/${r.slug}`} className="font-semibold hover:text-ut-red">{r.title}</Link><p className="text-xs text-muted">{fmtDate(r.date)}</p></li>)}</ul>
            </aside>
          )}
        </div>
      )}
    </PageShell>
  );
}

// ------------------------------------------------------------------ Actividades

export function Events() {
  useDocumentTitle('Actividades');
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const [page, setPage] = useState(1);
  const { data, error, loading } = useAsync(() => publicGet<Paginated<EventCard>>('events', { when: when === 'past' ? 'past' : undefined, page }), [when, page]);
  return (
    <PageShell title="Actividades y calendario" intro="Agenda académica, cultural, deportiva e institucional del IDEAD y sus CAT.">
      <div className="mb-6 flex gap-2" role="tablist">
        {(['upcoming', 'past'] as const).map((w) => (
          <button key={w} role="tab" aria-selected={when === w} onClick={() => { setWhen(w); setPage(1); }} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${when === w ? 'bg-ut-red text-white' : 'border border-line'}`}>{w === 'upcoming' ? 'Próximas' : 'Realizadas'}</button>
        ))}
      </div>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {data && data.data.length === 0 && <Pending text="No hay actividades en este listado." />}
      <ul className="space-y-4">
        {data?.data.map((e) => {
          const d = new Date(e.starts_at);
          return (
            <li key={e.slug}>
              <Link to={`/actividades/${e.slug}`} className="flex gap-5 rounded-2xl border border-line bg-white p-4 hover:shadow-md">
                <time dateTime={e.starts_at} className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border border-ut-red/30 leading-none">
                  <span className="text-3xl font-extrabold text-ut-red">{d.getDate()}</span>
                  <span className="-mt-3 text-sm font-bold">{d.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}</span>
                </time>
                <div>
                  <p className="text-xs font-bold text-muted uppercase">{e.category} {e.is_demo && <DemoBadge />}</p>
                  <h2 className="text-lg font-bold text-ink">{e.title}</h2>
                  <p className="text-sm text-muted">{fmtDateTime(e.starts_at)}{e.location ? ` · ${e.location}` : ''}</p>
                  {e.summary && <p className="mt-1 text-sm">{e.summary}</p>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {data && <Pager page={data.current_page} last={data.last_page} onPage={setPage} />}
    </PageShell>
  );
}

export function EventDetail() {
  const { slug } = useParams();
  const { data: e, error, loading, status } = useAsync(() => publicGet<Any>(`events/${slug}`), [slug]);
  useDocumentTitle(e?.title ?? 'Actividad');
  if (status === 404) return <NotFound />;
  return (
    <PageShell title={e?.title ?? '…'} crumbs={[{ to: '/actividades', label: 'Actividades' }]}>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {e && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <article>
            {e.image_url && <img src={e.image_url} alt={e.title} className="mb-6 w-full rounded-xl" />}
            <div className="prose-idead" dangerouslySetInnerHTML={{ __html: e.body ?? `<p>${e.summary ?? ''}</p>` }} />
          </article>
          <aside className="h-fit space-y-3 rounded-2xl border border-line bg-surface/60 p-5 text-sm">
            {e.is_demo && <DemoBadge />}
            <p className="flex gap-2"><Icon name="calendar" className="mt-0.5 text-ut-red" /><span><strong>Inicio:</strong> {fmtDateTime(e.starts_at)}{e.ends_at && <><br /><strong>Fin:</strong> {fmtDateTime(e.ends_at)}</>}</span></p>
            {e.location && <p className="flex gap-2"><Icon name="pin" className="mt-0.5 text-ut-red" />{e.location}</p>}
            {e.cat_slug && <p><Link to={`/cat/${e.cat_slug}`} className="font-semibold text-ut-red hover:underline">Ver ficha del {e.cat}</Link></p>}
            <p><Badge>{e.category}</Badge></p>
          </aside>
        </div>
      )}
    </PageShell>
  );
}

// ------------------------------------------------------------------ Multimedia

export function Multimedia() {
  useDocumentTitle('Multimedia');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Any | null>(null);
  const { data, error, loading } = useAsync(() => publicGet<Paginated<Any> & { albums: string[] }>('media', { type, page }), [type, page]);
  const embed = (url: string) => {
    const yt = url.match(/(?:v=|youtu\.be\/)([\w-]{6,})/);
    if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
    const vm = url.match(/vimeo\.com\/(\d+)/);
    return vm ? `https://player.vimeo.com/video/${vm[1]}` : null;
  };
  return (
    <PageShell title="Multimedia" intro="Fotografías autorizadas y videos institucionales.">
      <div className="mb-6 flex gap-2">
        {[['', 'Todo'], ['foto', 'Fotografías'], ['video', 'Videos']].map(([v, l]) => <button key={v} aria-pressed={type === v} onClick={() => { setType(v); setPage(1); }} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${type === v ? 'bg-ut-red text-white' : 'border border-line'}`}>{l}</button>)}
      </div>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {data && data.data.length === 0 && <Pending text="Aún no hay material multimedia publicado." />}
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {data?.data.map((m) => (
          <li key={m.id}>
            <button onClick={() => setOpen(m)} className="group block w-full overflow-hidden rounded-xl border border-line text-left">
              {m.type === 'foto' && m.url ? <img src={m.url} alt={m.title} loading="lazy" className="aspect-video w-full object-cover transition group-hover:scale-105" />
                : <div className="grid aspect-video place-items-center bg-ink text-4xl text-white"><Icon name="video" /></div>}
              <p className="p-2 text-sm font-semibold">{m.title} {m.is_demo && <DemoBadge />}</p>
            </button>
          </li>
        ))}
      </ul>
      {data && <Pager page={data.current_page} last={data.last_page} onPage={setPage} />}
      {open && (
        <div role="dialog" aria-modal="true" aria-label={open.title} className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setOpen(null)} onKeyDown={(e) => e.key === 'Escape' && setOpen(null)}>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button autoFocus onClick={() => setOpen(null)} className="mb-2 ml-auto flex items-center gap-1 text-white"><Icon name="close" /> Cerrar</button>
            {open.type === 'foto' ? <img src={open.url} alt={open.title} className="max-h-[75vh] w-full rounded-lg object-contain" />
              : embed(open.video_url) ? <iframe title={open.title} src={embed(open.video_url)!} className="aspect-video w-full rounded-lg" allowFullScreen /> : <a href={open.video_url} className="text-white underline">Abrir video</a>}
            <p className="mt-2 text-white">{open.title}{open.description ? ` — ${open.description}` : ''}</p>
          </div>
        </div>
      )}
    </PageShell>
  );
}

// ------------------------------------------------------------------ Proyectos

export function Projects() {
  useDocumentTitle('Proyectos');
  const [status, setStatus] = useState('');
  const [line, setLine] = useState('');
  const { data, error, loading } = useAsync(() => publicGet<Any[]>('projects', { status, investment_line: line }), [status, line]);
  const counts = (data ?? []).reduce<Record<string, number>>((m, p) => ((m[p.status] = (m[p.status] ?? 0) + 1), m), {});
  return (
    <PageShell title="Proyectos de inversión y gestión" intro="Estado, financiación, avance y cobertura territorial de los proyectos del IDEAD.">
      <div className="mb-6 flex flex-wrap gap-3">
        <label className="flex flex-col text-xs font-bold text-muted uppercase">Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 rounded-lg border border-line px-2 py-2 text-sm text-ink normal-case">
            <option value="">Todos</option>{['radicado', 'aprobado', 'en_ejecucion', 'finalizado', 'suspendido'].map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs font-bold text-muted uppercase">Línea de inversión
          <select value={line} onChange={(e) => setLine(e.target.value)} className="mt-1 rounded-lg border border-line px-2 py-2 text-sm text-ink normal-case">
            <option value="">Todas</option>{['infraestructura', 'equipos', 'tecnologia', 'academia', 'bienestar', 'investigacion', 'otra'].map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </label>
        <Link to="/estadisticas/proyectos" className="ml-auto self-end font-semibold text-ut-red hover:underline">Indicadores de gestión →</Link>
      </div>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {data && data.length === 0 && <Pending text="No hay proyectos publicados con estos filtros." />}
      {data && data.length > 0 && (
        <>
          <ul className="mb-6 flex flex-wrap gap-3">{Object.entries(counts).map(([s, n]) => <li key={s} className="rounded-xl border border-line px-4 py-2"><span className="text-2xl font-extrabold text-ut-red">{n}</span> <span className="text-sm">{label(s)}</span></li>)}</ul>
          <ul className="grid gap-5 md:grid-cols-2">
            {data.map((p) => (
              <li key={p.slug}>
                <Link to={`/proyectos/${p.slug}`} className="block h-full rounded-2xl border border-line bg-white p-5 hover:shadow-lg">
                  <div className="flex flex-wrap items-center gap-2"><Badge tone={PROJECT_STATUS_TONE[p.status]}>{label(p.status)}</Badge><Badge>{label(p.investment_line)}</Badge>{p.is_demo && <DemoBadge />}</div>
                  <h2 className="mt-2 text-lg font-bold text-ink">{p.name}</h2>
                  <p className="text-sm text-muted">{p.location}</p>
                  <div className="mt-3"><ProgressBars data={[{ label: 'Avance', value: p.progress_pct }]} /></div>
                  <p className="mt-2 text-sm">Inversión aprobada: <strong>{fmtCurrency(p.approved_amount)}</strong> · Ejecutado: <strong>{fmtCurrency(p.executed_amount)}</strong></p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </PageShell>
  );
}

export function ProjectDetail() {
  const { slug } = useParams();
  const { data: p, error, loading, status } = useAsync(() => publicGet<Any>(`projects/${slug}`), [slug]);
  useDocumentTitle(p?.name ?? 'Proyecto');
  if (status === 404) return <NotFound />;
  return (
    <PageShell title={p?.name ?? '…'} crumbs={[{ to: '/proyectos', label: 'Proyectos' }]} intro={p && <span className="flex flex-wrap gap-2"><Badge tone={PROJECT_STATUS_TONE[p.status]}>{label(p.status)}</Badge><Badge>{label(p.investment_line)}</Badge>{p.code && <Badge tone="blue">{p.code}</Badge>}{p.is_demo && <DemoBadge />}</span>}>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {p && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            {p.image_url && <img src={p.image_url} alt={p.name} className="w-full rounded-xl" />}
            <section><SectionTitle>Objetivo</SectionTitle><p className="text-lg">{p.objective ?? 'Pendiente'}</p></section>
            <section><SectionTitle>Descripción</SectionTitle>{p.description ? <div className="prose-idead" dangerouslySetInnerHTML={{ __html: p.description }} /> : <Pending />}</section>
            <section><SectionTitle>Resultados</SectionTitle>{p.results ? <p className="whitespace-pre-line">{p.results}</p> : <Pending text="Resultados pendientes de reporte" />}</section>
            {p.progress.length > 1 && <section><SectionTitle>Evolución del avance</SectionTitle><TrendChart data={p.progress.map((x: Any) => ({ period: fmtDate(x.reported_on, { month: 'short', year: 'numeric' }), value: x.progress_pct }))} valueType="percent" name="Avance" /></section>}
            {p.documents.length > 0 && (
              <section><SectionTitle>Documentos públicos</SectionTitle>
                <ul className="space-y-2">{p.documents.map((d: Any) => <li key={d.id}><a href={`/api/public/v1/documents/${d.id}/download`} className="inline-flex items-center gap-2 text-ut-red hover:underline"><Icon name="file" />{d.title}</a></li>)}</ul>
              </section>
            )}
          </div>
          <aside className="h-fit space-y-4 rounded-2xl border border-line bg-surface/60 p-5">
            <ProgressBars data={[{ label: 'Porcentaje de avance', value: p.progress_pct }]} />
            <dl className="space-y-3 text-sm">
              <div><dt className="font-bold">Inversión aprobada</dt><dd>{fmtCurrency(p.approved_amount, false)}</dd></div>
              <div><dt className="font-bold">Recursos ejecutados</dt><dd>{fmtCurrency(p.executed_amount, false)}</dd></div>
              <div><dt className="font-bold">Beneficiarios</dt><dd>{fmtNumber(p.beneficiaries_count)}</dd></div>
              <div><dt className="font-bold">Lugar de ejecución</dt><dd>{p.location ?? 'Pendiente'}</dd></div>
              <div><dt className="font-bold">CAT beneficiados</dt><dd>{p.cats.length ? p.cats.map((c: Any, i: number) => <span key={c.slug}>{i > 0 && ', '}<Link to={`/cat/${c.slug}`} className="text-ut-red hover:underline">{c.name}</Link></span>) : 'Todos / no aplica'}</dd></div>
              <div><dt className="font-bold">Período</dt><dd>{fmtDate(p.start_date)} – {fmtDate(p.end_date)}</dd></div>
            </dl>
            {p.agreements.length > 0 && <div><p className="text-sm font-bold">Convenios asociados</p><ul className="text-sm">{p.agreements.map((a: Any) => <li key={a.number}>{a.number} — {a.counterpart}</li>)}</ul></div>}
          </aside>
        </div>
      )}
    </PageShell>
  );
}

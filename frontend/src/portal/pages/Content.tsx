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
import { PROJECT_STATUS_TONE } from '../components/Widgets';
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
      <ProgramCards filters={{ level, cat }} />
    </PageShell>
  );
}

/** Tarjetas de programas agrupadas por nivel: lo esencial a la vista (nivel, modalidad, duración, SNIES, CAT). */
function ProgramCards({ filters }: { filters: { level: string; cat: string } }) {
  const { data, error, loading } = useAsync(() => publicGet<Any[]>('programs', { level_id: filters.level, cat: filters.cat }), [filters.level, filters.cat]);
  const [q, setQ] = useState('');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;
  const rows = (data ?? []).filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  const groups = [...new Set(rows.map((p) => p.level ?? 'Otros'))];
  return (
    <div>
      <label className="mb-6 flex max-w-md items-center gap-2 rounded-full border border-line bg-white px-4 shadow-sm focus-within:ring-2 focus-within:ring-ut-red/30">
        <Icon name="search" className="text-muted" /><span className="sr-only">Buscar programa</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar programa…" className="w-full bg-transparent py-2.5 text-sm focus:outline-none" />
      </label>
      {rows.length === 0 && <Pending text="No hay programas con estos filtros." />}
      <div className="space-y-10">
        {groups.map((g) => (
          <section key={g} aria-labelledby={`nivel-${g}`}>
            <h2 id={`nivel-${g}`} className="mb-4 flex items-center gap-3 text-xl font-extrabold text-ink">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-ut-red-50 text-lg text-ut-red"><Icon name="graduation" /></span>{g}
              <span className="text-sm font-semibold text-muted">{rows.filter((p) => (p.level ?? 'Otros') === g).length}</span>
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.filter((p) => (p.level ?? 'Otros') === g).map((p) => (
                <li key={p.slug}>
                  <Link to={`/programas/${p.slug}`} className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-ut-red/40 hover:shadow-lg">
                    <p className="text-lg leading-snug font-extrabold text-ink group-hover:text-ut-red">{p.name} {p.is_demo && <DemoBadge />}</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
                      <li className="rounded-full bg-ut-red-50 px-2.5 py-1 font-semibold text-ut-red-dark capitalize">{p.modality}</li>
                      {p.duration_semesters && <li className="rounded-full bg-surface px-2.5 py-1 font-semibold text-ink">{p.duration_semesters} semestres</li>}
                      {p.snies_code && <li className="rounded-full bg-surface px-2.5 py-1 font-semibold text-ink">SNIES {p.snies_code}</li>}
                    </ul>
                    <p className="mt-auto flex items-center justify-between pt-4 text-sm">
                      <span className="text-muted">{p.cats_count ? `Se ofrece en ${p.cats_count} CAT` : label(p.status)}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-ut-red">Ver programa <Icon name="arrowRight" /></span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export function ProgramDetail() {
  const { slug } = useParams();
  const { data: p, error, loading, status } = useAsync(() => publicGet<Any>(`programs/${slug}`), [slug]);
  useDocumentTitle(p?.name ?? 'Programa');
  if (status === 404) return <NotFound />;
  return (
    <PageShell title={p?.name ?? '…'} crumbs={[{ to: '/programas', label: 'Programas' }]} intro={p && <span className="flex flex-wrap gap-2">{p.level?.name} <Badge tone={p.status === 'activo' ? 'green' : 'amber'}>{label(p.status)}</Badge>{p.is_demo && <DemoBadge />}</span>}>
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

const CATEGORY_TONE: Record<string, string> = {
  'académica': 'bg-ut-red-50 text-ut-red-dark', cultural: 'bg-[#e8f3f0] text-[#13786f]', deportiva: 'bg-[#e9f0f9] text-[#1d4f88]',
  institucional: 'bg-amber-50 text-amber-900', bienestar: 'bg-[#f3ecfb] text-[#5b3a8c]', investigación: 'bg-[#e9f0f9] text-[#1d4f88]',
};
const catTone = (c?: string | null) => CATEGORY_TONE[(c ?? '').toLowerCase()] ?? 'bg-surface text-ink';
const monthKey = (iso: string) => iso.slice(0, 7);
const monthName = (key: string) => new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date(`${key}-01T12:00`));
const hour = (iso: string) => new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Calendario pequeño del mes: marca los días con actividades; al tocar un día se va a esa actividad. */
function MiniCalendar({ events, month, onMonth }: { events: EventCard[]; month: string; onMonth: (m: string) => void }) {
  const [y, m] = month.split('-').map(Number);
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const days = new Date(y, m, 0).getDate();
  const byDay = new Map<number, EventCard>();
  events.filter((e) => monthKey(e.starts_at) === month).forEach((e) => { const d = new Date(e.starts_at).getDate(); if (!byDay.has(d)) byDay.set(d, e); });
  const shift = (n: number) => { const d = new Date(y, m - 1 + n, 1); onMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  const today = new Date();
  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-line bg-white shadow-sm">
      <div className="flex items-center bg-gradient-to-r from-ut-red to-ut-red-dark px-3 py-3 text-white">
        <button type="button" onClick={() => shift(-1)} aria-label="Mes anterior" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15"><Icon name="chevronLeft" /></button>
        <p className="flex-1 text-center font-extrabold first-letter:uppercase">{monthName(month)}</p>
        <button type="button" onClick={() => shift(1)} aria-label="Mes siguiente" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15"><Icon name="chevronRight" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 p-3 text-center text-sm">
        {WEEKDAYS.map((w, i) => <span key={i} className="py-1 text-xs font-bold text-muted">{w}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
          const ev = byDay.get(d);
          const isToday = d === today.getDate() && m === today.getMonth() + 1 && y === today.getFullYear();
          return ev ? (
            <a key={d} href={`#ev-${ev.slug}`} title={ev.title} className="grid aspect-square place-items-center rounded-full bg-ut-red font-bold text-white shadow-md shadow-ut-red/30 hover:bg-ut-red-dark">{d}</a>
          ) : <span key={d} className={`grid aspect-square place-items-center rounded-full ${isToday ? 'font-bold text-ut-red ring-2 ring-ut-red/40' : 'text-ink/80'}`}>{d}</span>;
        })}
      </div>
      <p className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-xs text-muted"><span className="h-3 w-3 rounded-full bg-ut-red" /> Día con actividad (tóquelo para verla)</p>
    </div>
  );
}

export function Events() {
  useDocumentTitle('Actividades');
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState<string | null>(null);
  const { data, error, loading } = useAsync(() => publicGet<Paginated<EventCard>>('events', { when: when === 'past' ? 'past' : undefined, category: category || undefined, page }), [when, category, page]);
  const all = useAsync(() => publicGet<Paginated<EventCard>>('events', { when: when === 'past' ? 'past' : undefined }), [when]);
  const categories = [...new Set((all.data?.data ?? []).map((e) => e.category).filter(Boolean))] as string[];
  const events = data?.data ?? [];
  const months = [...new Set(events.map((e) => monthKey(e.starts_at)))];
  const calMonth = month ?? months[0] ?? monthKey(new Date().toISOString());
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 lg:px-8">
      <nav aria-label="Ruta de navegación" className="mb-3 text-sm text-muted"><ol className="flex gap-1"><li><Link to="/" className="hover:text-ut-red">Inicio</Link></li><li className="before:mx-1 before:content-['/']" aria-current="page">Actividades</li></ol></nav>
      <header className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold text-ut-red md:text-4xl">Actividades</h1>
          <p className="mt-1 text-muted">Agenda académica, cultural e institucional del IDEAD y sus CAT.</p>
        </div>
        <div className="flex rounded-full bg-surface p-1" role="tablist" aria-label="Período">
          {(['upcoming', 'past'] as const).map((w) => (
            <button key={w} role="tab" type="button" aria-selected={when === w} onClick={() => { setWhen(w); setPage(1); setMonth(null); setCategory(''); }}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${when === w ? 'bg-ut-red text-white shadow' : 'text-ink hover:text-ut-red'}`}>{w === 'upcoming' ? 'Próximas' : 'Realizadas'}</button>
          ))}
        </div>
      </header>
      {categories.length > 1 && (
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Categorías">
          {['', ...categories].map((c) => (
            <button key={c || 'todas'} type="button" aria-pressed={category === c} onClick={() => { setCategory(c); setPage(1); setMonth(null); }}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${category === c ? 'bg-ink text-white' : 'border border-line bg-white text-ink hover:border-ut-red/50'}`}>{c || 'Todas'}</button>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">{events.length > 0 && <MiniCalendar events={events} month={calMonth} onMonth={setMonth} />}</aside>
        <div>
          {loading && <Spinner />}
          {error && <ErrorBox message={error} />}
          {!loading && events.length === 0 && <Pending text={when === 'upcoming' ? 'No hay actividades programadas por ahora.' : 'No hay actividades realizadas registradas.'} />}
          <div className="space-y-8">
            {months.map((mk) => (
              <section key={mk} aria-labelledby={`m-${mk}`}>
                <h2 id={`m-${mk}`} className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">{monthName(mk)}</h2>
                <ul className="space-y-3">
                  {events.filter((e) => monthKey(e.starts_at) === mk).map((e) => {
                    const d = new Date(e.starts_at);
                    return (
                      <li key={e.slug} id={`ev-${e.slug}`} className="scroll-mt-28">
                        <Link to={`/actividades/${e.slug}`} className="group flex items-stretch overflow-hidden rounded-[1.25rem] border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-ut-red/40 hover:shadow-lg">
                          <time dateTime={e.starts_at} className="flex w-24 shrink-0 flex-col items-center justify-center bg-gradient-to-b from-ut-red to-ut-red-dark py-4 text-white">
                            <span className="text-xs font-semibold uppercase opacity-85">{d.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '')}</span>
                            <span className="text-4xl leading-none font-extrabold">{d.getDate()}</span>
                            <span className="text-xs font-bold uppercase">{d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}</span>
                          </time>
                          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              {e.category && <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${catTone(e.category)}`}>{e.category}</span>}
                              {e.is_demo && <DemoBadge />}
                            </div>
                            <h3 className="text-lg leading-snug font-bold text-ink group-hover:text-ut-red">{e.title}</h3>
                            <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                              <span className="inline-flex items-center gap-1.5"><Icon name="clock" className="text-ut-red" />{hour(e.starts_at)}{e.ends_at && monthKey(e.ends_at) === mk && e.ends_at.slice(0, 10) === e.starts_at.slice(0, 10) ? ` – ${hour(e.ends_at)}` : e.ends_at ? ` – ${fmtDate(e.ends_at)}` : ''}</span>
                              {e.location && <span className="inline-flex items-center gap-1.5"><Icon name="pin" className="text-ut-red" />{e.location}</span>}
                            </p>
                          </div>
                          <span className="hidden items-center pr-5 text-2xl text-line transition group-hover:text-ut-red sm:flex"><Icon name="arrowRight" /></span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
          {data && <Pager page={data.current_page} last={data.last_page} onPage={(p) => { setPage(p); setMonth(null); }} />}
        </div>
      </div>
    </div>
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

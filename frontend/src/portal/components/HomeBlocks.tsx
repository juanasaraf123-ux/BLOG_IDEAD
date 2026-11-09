import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../shared/icons';
import { fmtDate, fmtNumber } from '../../shared/format';
import { DemoBadge } from '../../shared/ui';
import type { CatSummary, EventCard, HomeData, Highlight, ModuleInfo, NewsCard } from '../../shared/types';
import { ColombiaMap } from './ColombiaMap';
import { useSite } from '../site';

/** Carrusel principal (boceto): flechas rojas, pausa automática al enfocar/pasar el cursor, respeta movimiento reducido. */
export function HeroCarousel({ slides }: { slides: HomeData['slides'] }) {
  const site = useSite();
  const items = slides.length ? slides : [{ title: site?.settings.hero_title ?? 'IDEAD', subtitle: site?.settings.hero_text ?? '', image_url: null, link_url: '/estadisticas', is_demo: false }];
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (paused || reduced || items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [paused, reduced, items.length]);
  const s = items[i % items.length];
  const go = (d: number) => setI((x) => (x + d + items.length) % items.length);
  const Inner = (
    <>
      {s.image_url ? (
        <img src={s.image_url} alt={s.title} className="h-full w-full object-cover" />
      ) : (
        <div className="relative flex h-full w-full flex-col justify-center overflow-hidden bg-gradient-to-br from-green-dark via-green to-teal p-8 text-white md:p-14">
          <svg className="absolute -right-10 -bottom-10 h-72 w-72 opacity-15" viewBox="0 0 24 24" aria-hidden><path fill="white" d="M12 2 2 7l10 5 10-5-10-5zm0 13L2 10v6l10 5 10-5v-6l-10 5z" /></svg>
          <p className="text-sm font-semibold tracking-widest text-white/80 uppercase">Instituto de Educación a Distancia</p>
          <p className="mt-2 max-w-xl text-3xl leading-tight font-extrabold md:text-4xl">{s.title}</p>
          {s.subtitle && <p className="mt-3 max-w-xl text-lg text-white/90">{s.subtitle}</p>}
        </div>
      )}
    </>
  );
  return (
    <section aria-roledescription="carrusel" aria-label="Destacados" className="relative overflow-hidden rounded-sm bg-surface shadow-sm"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="aspect-[857/413] w-full" aria-live={paused ? 'polite' : 'off'}>
        {s.link_url ? (s.link_url.startsWith('/') ? <Link to={s.link_url} className="block h-full">{Inner}</Link> : <a href={s.link_url} className="block h-full" rel="noopener noreferrer">{Inner}</a>) : Inner}
      </div>
      {s.is_demo && <DemoBadge className="absolute top-2 right-2" />}
      {items.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Diapositiva anterior" className="absolute top-1/2 left-3 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-ut-red text-xl text-white shadow-lg hover:bg-ut-red-dark"><Icon name="chevronLeft" /></button>
          <button onClick={() => go(1)} aria-label="Diapositiva siguiente" className="absolute top-1/2 right-3 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-ut-red text-xl text-white shadow-lg hover:bg-ut-red-dark"><Icon name="chevronRight" /></button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {items.map((_, k) => <button key={k} onClick={() => setI(k)} aria-label={`Ir a la diapositiva ${k + 1}`} aria-current={k === i} className={`h-2.5 rounded-full transition-all ${k === i ? 'w-6 bg-ut-red' : 'w-2.5 bg-white/80'}`} />)}
          </div>
        </>
      )}
      <p className="sr-only">{s.title}. {s.subtitle}</p>
    </section>
  );
}

/** Cifras destacadas: cada una enlazada a su indicador y fuente; sin dato → «Pendiente». */
export function KpiGrid({ items }: { items: Highlight[] }) {
  return (
    <section aria-labelledby="kpi-title">
      <h2 id="kpi-title" className="sr-only">Cifras institucionales destacadas</h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-10">
        {items.map((h) => {
          const content = (
            <>
              <Icon name={h.icon} className="shrink-0 text-[2.9rem] text-ut-red md:text-[3.4rem]" strokeWidth={1.3} />
              <span className="min-w-0">
                {h.value !== null ? (
                  <span className="block text-[1.7rem] leading-none font-extrabold text-ut-red md:text-[2rem]">{fmtNumber(h.value, 0)}</span>
                ) : (
                  <span className="block text-sm leading-tight font-semibold text-muted">Pendiente de actualización</span>
                )}
                <span className="mt-1 block text-[1rem] leading-tight text-[#4a4f55] md:text-[1.08rem]">{h.label}</span>
                {h.is_demo && <DemoBadge className="mt-1" />}
              </span>
            </>
          );
          const tip = [h.source && `Fuente: ${h.source}`, h.period && `Período: ${h.period}`, h.indicator_code && `Indicador ${h.indicator_code}`].filter(Boolean).join(' · ');
          return (
            <li key={h.label}>
              {h.link ? <Link to={h.link} title={tip} className="group flex items-center gap-3 rounded-lg p-1 hover:bg-white/70">{content}</Link> : <div title={tip} className="flex items-center gap-3 p-1">{content}</div>}
              {tip && <span className="sr-only">{tip}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Panel «CAT IBAGUÉ» + mapa (boceto): selección de CAT o departamento y cifras del centro. */
export function CatCoverage({ cats }: { cats: CatSummary[] }) {
  // CAT inicial: el de mayor matrícula publicada (en el boceto, CAT Ibagué).
  const initial = [...cats].sort((a, b) => (b.summary.students?.value ?? -1) - (a.summary.students?.value ?? -1))[0];
  const [slug, setSlug] = useState<string>(initial?.slug ?? '');
  const [dept, setDept] = useState<string | null>(null);
  const cat = cats.find((c) => c.slug === slug) ?? cats[0];
  const byDept = useMemo(() => {
    const m: Record<string, number> = {};
    cats.forEach((c) => { m[c.department_code] = (m[c.department_code] ?? 0) + 1; });
    return m;
  }, [cats]);
  const visible = dept ? cats.filter((c) => c.department_code === dept) : cats;
  useEffect(() => { if (visible.length && !visible.some((c) => c.slug === slug)) setSlug(visible[0].slug); }, [dept]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!cats.length) return <div className="rounded-xl border border-line p-6 text-muted">La red de CAT se mostrará cuando CRIDEAD publique la información verificada.</div>;
  const figure = (label: string, v: number | null | undefined) => (
    <div>
      <dt className="text-[1.05rem] font-extrabold text-ut-red">{label}</dt>
      <dd className="text-2xl font-extrabold text-ink">{v === null || v === undefined ? <span className="text-sm font-semibold text-muted">Pendiente</span> : fmtNumber(v, 0)}</dd>
    </div>
  );
  return (
    <section aria-labelledby="cobertura-title" className="grid items-start gap-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <h2 id="cobertura-title" className="sr-only">Cobertura territorial del IDEAD</h2>
      <div>
        <label htmlFor="cat-select" className="sr-only">Seleccione un Centro de Atención Tutorial</label>
        <div className="relative">
          <select id="cat-select" value={cat?.slug} onChange={(e) => setSlug(e.target.value)}
            className="w-full appearance-none rounded-2xl bg-ut-red py-3 pr-10 pl-5 text-lg font-extrabold text-white uppercase shadow-md focus:ring-4 focus:ring-ut-red/30 focus:outline-none">
            {visible.map((c) => <option key={c.slug} value={c.slug} className="bg-white text-ink normal-case">{c.name}</option>)}
          </select>
          <Icon name="chevronDown" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xl text-white" />
        </div>
        {cat && (
          <div className="mt-3 rounded-2xl border-2 border-ut-red/25 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm text-muted">{cat.municipality}, {cat.department} {cat.is_demo && <DemoBadge />}</p>
            <dl className="space-y-3">
              {figure('Estudiantes', cat.summary.students?.value)}
              {figure('Docentes', cat.summary.teachers?.value)}
              {figure('Municipios', cat.summary.municipalities)}
              {figure('Programas Académicos', cat.summary.programs)}
            </dl>
            {cat.summary.students?.period && <p className="mt-3 text-xs text-muted">Período {cat.summary.students.period}</p>}
            <Link to={`/cat/${cat.slug}`} className="mt-4 inline-flex items-center gap-1 font-semibold text-ut-red hover:underline">Ver ficha del CAT <Icon name="arrowRight" /></Link>
          </div>
        )}
      </div>
      <div>
        <ColombiaMap title="Mapa de Colombia con los departamentos donde el IDEAD tiene Centros de Atención Tutorial" values={byDept} selected={dept}
          onSelect={(code) => setDept(code)} formatValue={(v) => `${v} CAT`}
          points={cats.filter((c) => c.latitude !== null).map((c) => ({ id: c.slug, lat: c.latitude as number, lng: c.longitude as number, label: c.name, active: c.slug === cat?.slug }))}
          onPointSelect={setSlug} />
        {dept && <button onClick={() => setDept(null)} className="mt-1 text-sm font-semibold text-ut-red hover:underline">Quitar filtro de departamento</button>}
      </div>
    </section>
  );
}

function Placeholder() {
  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-ut-red to-ut-red-900 text-white/90" aria-hidden>
      <span className="text-sm font-extrabold tracking-[0.3em]">IDEAD</span>
    </div>
  );
}

export function NewsColumn({ news }: { news: NewsCard[] }) {
  return (
    <section aria-labelledby="news-title">
      <h2 id="news-title" className="mb-3 text-lg font-extrabold text-ut-red">Noticias Destacadas</h2>
      {news.length === 0 && <p className="text-muted">Aún no hay noticias publicadas.</p>}
      <ul className="space-y-4">
        {news.map((n) => (
          <li key={n.slug}>
            <Link to={`/noticias/${n.slug}`} className="group flex gap-3">
              <span className="h-[3.6rem] w-[6.5rem] shrink-0 overflow-hidden rounded-md">{n.image_url ? <img src={n.image_url} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" /> : <Placeholder />}</span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-ut-red">{n.category ?? 'Institucional'} {n.is_demo && <DemoBadge />}</span>
                <span className="line-clamp-2 block text-sm leading-snug text-ink group-hover:underline">{n.title}</span>
                <span className="block text-xs text-muted">{fmtDate(n.date)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/noticias" className="mt-4 inline-flex items-center gap-1 text-ut-red hover:underline">Ver todas <Icon name="arrowRight" /></Link>
    </section>
  );
}

export function EventsColumn({ events }: { events: EventCard[] }) {
  return (
    <section aria-labelledby="events-title">
      <h2 id="events-title" className="mb-3 text-lg font-extrabold text-ut-red">Próximas Actividades</h2>
      {events.length === 0 && <p className="text-muted">No hay actividades programadas.</p>}
      <ul className="space-y-4">
        {events.map((e) => {
          const d = new Date(e.starts_at);
          return (
            <li key={e.slug}>
              <Link to={`/actividades/${e.slug}`} className="group flex gap-3">
                <time dateTime={e.starts_at} className="grid h-[3.6rem] w-[3.9rem] shrink-0 place-items-center rounded-md border border-ut-red/30 bg-white leading-none shadow-sm">
                  <span className="text-2xl font-extrabold text-ut-red">{d.getDate()}</span>
                  <span className="-mt-2 text-xs font-bold text-ink">{d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}</span>
                </time>
                <span className="min-w-0">
                  <span className="line-clamp-2 block text-sm leading-snug text-ink group-hover:underline">{e.title}</span>
                  <span className="block text-xs text-muted">{e.location ?? ''} {e.is_demo && <DemoBadge />}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link to="/actividades" className="mt-4 inline-flex items-center gap-1 text-ut-red hover:underline">Ver calendario <Icon name="arrowRight" /></Link>
    </section>
  );
}

export function TeamColumn({ team }: { team: HomeData['team'] }) {
  return (
    <section aria-labelledby="team-title">
      <h2 id="team-title" className="mb-3 text-lg font-extrabold text-ut-red">Equipo IDEAD</h2>
      <ul className="space-y-4">
        {team.map((t) => (
          <li key={t.id}>
            <Link to={t.link ?? '/sobre-idead'} className="group flex items-center gap-4">
              <span className="grid h-12 w-16 shrink-0 place-items-center rounded-2xl bg-ut-red text-2xl text-white shadow-md group-hover:bg-ut-red-dark"><Icon name="people" /></span>
              <span className="text-lg text-ink group-hover:text-ut-red">{t.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ModulesGrid({ modules }: { modules: ModuleInfo[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {modules.map((m) => (
        <li key={m.slug}>
          <Link to={`/estadisticas/${m.slug}`} className="group flex h-full gap-4 rounded-xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-ut-red/40 hover:shadow-lg">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ut-red-50 text-2xl text-ut-red group-hover:bg-ut-red group-hover:text-white"><Icon name={m.icon} /></span>
            <span>
              <span className="text-xs font-bold text-muted">Módulo {m.number}{m.indicators_count ? ` · ${m.indicators_count} indicadores` : ''}</span>
              <span className="block leading-snug font-bold text-ink group-hover:text-ut-red">{m.name}</span>
              <span className="mt-1 line-clamp-2 block text-sm text-muted">{m.description}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

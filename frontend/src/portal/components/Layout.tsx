import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../../shared/icons';
import { useSite } from '../site';

/** Logotipo: archivo oficial cargado desde el panel; mientras tanto, versión temporal extraída del boceto. */
export function Logo() {
  const site = useSite();
  return (
    <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Inicio — IDEAD, Universidad del Tolima">
      <img src={site?.settings.logo_url ?? '/img/logo-ut-temporal.png'} alt="Universidad del Tolima — Conocimiento que transforma" className="h-11 w-auto md:h-12" />
      <span className="hidden shrink-0 border-l border-gray-300 pl-3 text-[0.72rem] leading-tight font-medium whitespace-nowrap text-ink uppercase sm:block md:text-[0.78rem]">
        Instituto de<br />Educación<br />a Distancia
      </span>
    </Link>
  );
}

const NAV = [
  { to: '/', label: 'Inicio', end: true, icon: 'home' },
  { to: '/cat', label: 'CAT' },
  { to: '/programas', label: 'Programas' },
  { to: '/actividades', label: 'Actividades' },
  { to: '/proyectos', label: 'Proyectos' },
  { to: '/noticias', label: 'Noticias' },
  { to: '/multimedia', label: 'Multimedia' },
];
const NAV_END = [
  { to: '/transparencia', label: 'Transparencia' },
  { to: '/sobre-idead', label: 'Sobre IDEAD' },
];

const pill = (active: boolean) =>
  `flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[0.8rem] font-semibold min-[1600px]:px-2.5 whitespace-nowrap transition ${active ? 'bg-ut-red text-white shadow-md shadow-ut-red/25' : 'text-[#4a4f55] hover:bg-ut-red-50 hover:text-ut-red'}`;

function StatsMenu({ onNavigate }: { onNavigate?: () => void }) {
  const site = useSite();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  const active = pathname.startsWith('/estadisticas');
  return (
    <li ref={ref} className="relative" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)} className={pill(active)}>
        Estadísticas <Icon name="chevronDown" className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="fade-in z-40 mt-1 w-full rounded-xl border border-line bg-white p-2 shadow-xl lg:absolute lg:left-1/2 lg:w-[34rem] lg:-translate-x-1/2">
          <Link to="/estadisticas" onClick={onNavigate} className="mb-1 block rounded-lg px-3 py-2 font-semibold text-ut-red hover:bg-ut-red-50">Todos los indicadores →</Link>
          <ul className="grid gap-0.5 sm:grid-cols-2">
            {site?.modules.map((m) => (
              <li key={m.slug}>
                <Link to={`/estadisticas/${m.slug}`} onClick={onNavigate} className="flex gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface">
                  <span className="w-5 shrink-0 text-right font-bold text-ut-red">{m.number}</span><span>{m.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function SearchBox({ className = '' }: { className?: string }) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim().length >= 2) nav(`/buscar?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <form role="search" onSubmit={submit} className={`flex items-center rounded-full border border-line bg-white pr-2 pl-4 shadow-sm focus-within:ring-2 focus-within:ring-ut-red/30 ${className}`}>
      <label htmlFor="site-search" className="sr-only">Buscar en el portal</label>
      <input id="site-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." minLength={2}
        className="w-full bg-transparent py-2 text-[0.95rem] text-ink placeholder:text-gray-400 focus:outline-none" />
      <button type="submit" aria-label="Buscar" className="p-1 text-xl text-muted hover:text-ut-red"><Icon name="search" /></button>
    </form>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  const navLink = ({ isActive }: { isActive: boolean }) => pill(isActive);
  const items = (onNavigate?: () => void) => (
    <>
      {NAV.map((n) => <li key={n.to}><NavLink to={n.to} end={n.end} className={navLink}>{n.icon && <Icon name={n.icon} />}{n.label}</NavLink></li>)}
      <StatsMenu onNavigate={onNavigate} />
      {NAV_END.map((n) => <li key={n.to}><NavLink to={n.to} className={navLink}>{n.label}</NavLink></li>)}
    </>
  );
  const login = (
    <a href="/admin/" className="flex shrink-0 items-center gap-2 rounded-full bg-ut-red px-4 py-2 text-sm font-bold text-white shadow-md shadow-ut-red/25 hover:bg-ut-red-dark" title="Acceso para funcionarios autorizados">
      <Icon name="user" className="text-lg" /> Iniciar Sesión
    </a>
  );
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/85 shadow-[0_6px_20px_-14px_rgba(120,20,20,0.35)] backdrop-blur-md">
      <div className="relative">
        <div className="relative mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 lg:px-6">
          <Logo />
          <nav aria-label="Menú principal" className="order-3 hidden w-full lg:block 2xl:order-none 2xl:ml-auto 2xl:w-auto">
            <ul className="flex items-center justify-center gap-0.5 rounded-full border border-line/80 bg-white/80 p-1 shadow-sm 2xl:justify-start">{items()}</ul>
          </nav>
          <div className="ml-auto hidden items-center gap-3 lg:flex 2xl:ml-2">
            <SearchBox className="w-36 min-[1600px]:w-40" />
            {login}
          </div>
          <button className="ml-auto rounded-lg p-2 text-2xl text-ink lg:hidden" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
      {open && (
        <div id="mobile-menu" className="fade-in max-h-[80vh] overflow-y-auto border-t border-line bg-white px-4 pb-6 lg:hidden">
          <SearchBox className="my-3 flex" />
          <nav aria-label="Menú principal móvil">
            <ul className="space-y-1">{items(() => setOpen(false))}</ul>
          </nav>
          <div className="mt-4">{login}</div>
        </div>
      )}
    </header>
  );
}

export function DemoBanner() {
  const site = useSite();
  if (!site?.demo_mode) return null;
  return (
    <div role="note" className="bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950">
      Entorno de demostración: las cifras y contenidos marcados como <span className="rounded bg-amber-300 px-1">DEMO</span> son ficticios y no constituyen información oficial del IDEAD.
    </div>
  );
}

const SOCIAL: { match: RegExp; name: string; d: string }[] = [
  { match: /facebook/i, name: 'Facebook', d: 'M14 8h2.5V4.5H14c-2.5 0-4 1.6-4 4V11H7.5v3.5H10V21h3.5v-6.5H16l.5-3.5h-3V8.6c0-.4.2-.6.5-.6z' },
  { match: /instagram/i, name: 'Instagram', d: 'M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3zm4.5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm5-3.2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z' },
  { match: /youtube/i, name: 'YouTube', d: 'M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z' },
  { match: /twitter|x\.com|\bX\b/i, name: 'X', d: 'M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z' },
];

function SocialIcon({ label, url }: { label: string; url: string }) {
  const s = SOCIAL.find((x) => x.match.test(label) || x.match.test(url));
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={s?.name ?? label} title={s?.name ?? label}
      className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white hover:text-ut-red">
      {s ? <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden><path d={s.d} /></svg> : <Icon name="globe" />}
    </a>
  );
}

/** Pie del boceto: franja roja con identidad UT/IDEAD, accesos y redes sociales oficiales. */
export function Footer() {
  const site = useSite();
  const s = site?.settings;
  const hasPage = (slug: string) => site?.pages.some((p) => p.slug === slug);
  const sep = <span aria-hidden className="hidden h-5 w-px bg-white/40 md:block" />;
  return (
    <footer className="mt-16 text-white">
      <div className="bg-gradient-to-r from-ut-red-dark via-ut-red to-ut-red-dark">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-6 gap-y-4 px-4 py-5 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="rounded-lg bg-white px-2 py-1"><img src={s?.logo_url ?? '/img/logo-ut-temporal.png'} alt="" className="h-9 w-auto" /></span>
            <p className="flex flex-wrap items-center gap-x-3 text-sm leading-tight">
              <strong className="text-base font-extrabold">{s?.university_name ?? 'Universidad del Tolima'}</strong>
              <span aria-hidden className="text-white/50">|</span>
              <span className="text-white/90">{s?.site_name ?? 'Instituto de Educación a Distancia - IDEAD'}</span>
            </p>
          </div>
          <nav aria-label="Enlaces del pie de página" className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold lg:ml-auto">
            <Link to={hasPage('contacto') ? '/pagina/contacto' : '/sobre-idead'} className="hover:underline">Contáctanos</Link>
            {hasPage('preguntas-frecuentes') && <>{sep}<Link to="/pagina/preguntas-frecuentes" className="hover:underline">Preguntas Frecuentes</Link></>}
            {!!s?.social_links?.length && (
              <>
                {sep}
                <span className="flex items-center gap-2"><span className="mr-1">Redes Sociales</span>{s.social_links.map((l) => <SocialIcon key={l.url} {...l} />)}</span>
              </>
            )}
            {sep}
            <a href="https://www.ut.edu.co" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:underline"><Icon name="globe" /> www.ut.edu.co</a>
          </nav>
        </div>
      </div>
      <div className="bg-ut-red-900 text-white/80">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 text-xs lg:px-8">
          <span>© {new Date().getFullYear()} {s?.university_name ?? 'Universidad del Tolima'} · IDEAD. La información publicada es agregada y autorizada.</span>
          <span className="flex flex-wrap gap-x-4 gap-y-1 lg:ml-auto">
            <Link className="hover:underline" to="/transparencia">Transparencia y fuentes</Link>
            <Link className="hover:underline" to="/pagina/privacidad">Privacidad</Link>
            <Link className="hover:underline" to="/pagina/accesibilidad">Accesibilidad</Link>
            <Link className="hover:underline" to="/mapa-del-sitio">Mapa del sitio</Link>
            <a className="hover:underline" href="/admin/">Acceso funcionarios</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ title, intro, children, crumbs }: { title: string; intro?: ReactNode; children: ReactNode; crumbs?: { to: string; label: string }[] }) {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 lg:px-8">
      <nav aria-label="Ruta de navegación" className="mb-3 text-sm text-muted">
        <ol className="flex flex-wrap gap-1">
          <li><Link to="/" className="hover:text-ut-red">Inicio</Link></li>
          {crumbs?.map((c) => <li key={c.to} className="before:mx-1 before:content-['/']"><Link to={c.to} className="hover:text-ut-red">{c.label}</Link></li>)}
          <li className="before:mx-1 before:content-['/']" aria-current="page">{title}</li>
        </ol>
      </nav>
      <h1 className="text-3xl font-extrabold text-ut-red md:text-4xl">{title}</h1>
      {intro && <div className="mt-3 max-w-4xl text-lg text-muted">{intro}</div>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

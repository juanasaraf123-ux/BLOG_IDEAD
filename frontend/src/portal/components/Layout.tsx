import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../../shared/icons';
import { useSite } from '../site';

/** Logotipo: archivo oficial cargado desde el panel; mientras tanto, versión temporal extraída del boceto. */
export function Logo() {
  const site = useSite();
  return (
    <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Inicio — IDEAD, Universidad del Tolima">
      <img src={site?.settings.logo_url ?? '/img/logo-ut-temporal.png'} alt="Universidad del Tolima — Conocimiento que transforma" className="h-11 w-auto md:h-14" />
      <span className="hidden shrink-0 border-l border-gray-300 pl-3 text-[0.72rem] leading-tight font-medium whitespace-nowrap text-ink uppercase sm:block md:text-[0.78rem]">
        Instituto de<br />Educación<br />a Distancia
      </span>
    </Link>
  );
}

const NAV = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/cat', label: 'CAT' },
  { to: '/programas', label: 'Programas' },
  { to: '/actividades', label: 'Actividades' },
  { to: '/proyectos', label: 'Proyectos' },
  { to: '/noticias', label: 'Noticias' },
  { to: '/multimedia', label: 'Multimedia' },
];

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
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 py-2 text-[0.9rem] font-medium whitespace-nowrap hover:text-ut-red ${active ? 'text-ut-red' : 'text-[#4a4f55]'}`}>
        Estadísticas <Icon name="chevronDown" className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="fade-in z-40 mt-1 w-full rounded-xl border border-line bg-white p-2 shadow-xl min-[1360px]:absolute min-[1360px]:left-1/2 min-[1360px]:w-[34rem] min-[1360px]:-translate-x-1/2">
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
    <form role="search" onSubmit={submit} className={`flex items-center rounded-full bg-[#e3e3e3] pr-2 pl-5 focus-within:ring-2 focus-within:ring-teal ${className}`}>
      <label htmlFor="site-search" className="sr-only">Buscar en el portal</label>
      <input id="site-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" minLength={2}
        className="w-full bg-transparent py-2 text-[1rem] text-ink placeholder:text-gray-500 focus:outline-none" />
      <button type="submit" aria-label="Buscar" className="p-1 text-2xl text-ink hover:text-ut-red"><Icon name="search" /></button>
    </form>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `relative block py-2 text-[0.9rem] font-medium whitespace-nowrap hover:text-ut-red ${isActive ? 'text-ut-red after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:bg-ut-red' : 'text-[#4a4f55]'}`;
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 lg:px-8">
        <Logo />
        <nav aria-label="Menú principal" className="ml-auto hidden min-[1360px]:block">
          <ul className="flex items-center gap-4 2xl:gap-7">
            {NAV.map((n) => <li key={n.to}><NavLink to={n.to} end={n.end} className={linkCls}>{n.label}</NavLink></li>)}
            <StatsMenu />
            <li><NavLink to="/transparencia" className={linkCls}>Transparencia</NavLink></li>
            <li><NavLink to="/sobre-idead" className={linkCls}>Sobre IDEAD</NavLink></li>
          </ul>
        </nav>
        <SearchBox className="ml-auto hidden w-48 min-[1360px]:ml-3 min-[1360px]:flex 2xl:w-64" />
        <a href="/admin/" className="hidden shrink-0 items-center gap-1.5 rounded-full border border-ut-red p-2 text-sm font-semibold text-ut-red hover:bg-ut-red hover:text-white min-[1360px]:flex 2xl:px-3 2xl:py-1.5" title="Acceso para funcionarios autorizados" aria-label="Acceso funcionarios">
          <Icon name="lock" /> <span className="hidden 2xl:inline">Funcionarios</span>
        </a>
        <button className="ml-auto rounded-lg p-2 text-2xl text-ink min-[1360px]:hidden" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="fade-in max-h-[80vh] overflow-y-auto border-t border-line bg-white px-4 pb-6 min-[1360px]:hidden">
          <SearchBox className="my-3 flex" />
          <nav aria-label="Menú principal móvil">
            <ul className="divide-y divide-line">
              {NAV.map((n) => <li key={n.to}><NavLink to={n.to} end={n.end} className={linkCls}>{n.label}</NavLink></li>)}
              <StatsMenu onNavigate={() => setOpen(false)} />
              <li><NavLink to="/transparencia" className={linkCls}>Transparencia</NavLink></li>
              <li><NavLink to="/sobre-idead" className={linkCls}>Sobre IDEAD</NavLink></li>
              <li><a href="/admin/" className="flex items-center gap-2 py-2 font-semibold text-ut-red"><Icon name="lock" /> Acceso funcionarios</a></li>
            </ul>
          </nav>
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

export function Footer() {
  const site = useSite();
  const s = site?.settings;
  return (
    <footer className="mt-16 bg-green-dark text-white">
      <div className="flex h-2" aria-hidden>
        <span className="flex-1 bg-teal-light" /><span className="flex-1 bg-teal" /><span className="flex-1 bg-green" /><span className="flex-1 bg-green-dark" />
      </div>
      <div className="mx-auto grid max-w-[1500px] gap-10 px-4 py-12 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-lg font-extrabold">{s?.site_name ?? 'Instituto de Educación a Distancia – IDEAD'}</p>
          <p className="mt-1 text-white/80">{s?.university_name ?? 'Universidad del Tolima'}</p>
          <p className="mt-4 text-sm text-white/70">Portal institucional de información, indicadores y gestión.</p>
        </div>
        <div>
          <p className="mb-3 font-bold">Contacto</p>
          <ul className="space-y-2 text-sm text-white/85">
            <li className="flex gap-2"><Icon name="pin" className="mt-0.5 shrink-0" />{s?.contact_address}</li>
            <li className="flex gap-2"><Icon name="phone" className="mt-0.5 shrink-0" />{s?.contact_phone}</li>
            <li className="flex gap-2"><Icon name="mail" className="mt-0.5 shrink-0" />{s?.contact_email}</li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-bold">El portal</p>
          <ul className="space-y-2 text-sm text-white/85">
            <li><Link className="hover:underline" to="/estadisticas">Estadísticas e indicadores</Link></li>
            <li><Link className="hover:underline" to="/transparencia">Transparencia y fuentes</Link></li>
            <li><Link className="hover:underline" to="/pagina/privacidad">Privacidad y tratamiento de datos</Link></li>
            <li><Link className="hover:underline" to="/pagina/accesibilidad">Accesibilidad</Link></li>
            <li><Link className="hover:underline" to="/mapa-del-sitio">Mapa del sitio</Link></li>
            <li><a className="hover:underline" href="/admin/">Acceso funcionarios</a></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-bold">Enlaces oficiales</p>
          <ul className="space-y-2 text-sm text-white/85">
            {s?.official_links?.map((l) => (
              <li key={l.url}><a className="inline-flex items-center gap-1 hover:underline" href={l.url} target="_blank" rel="noopener noreferrer">{l.label} <Icon name="external" /></a></li>
            ))}
            {s?.social_links?.map((l) => (
              <li key={l.url}><a className="hover:underline" href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <p className="border-t border-white/15 px-4 py-4 text-center text-xs text-white/70">
        © {new Date().getFullYear()} {s?.university_name ?? 'Universidad del Tolima'} · IDEAD. La información publicada es agregada y autorizada.
      </p>
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

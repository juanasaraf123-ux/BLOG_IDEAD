import { StrictMode, useEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';
import '../styles.css';
import { Icon } from '../shared/icons';
import { Spinner } from '../shared/ui';
import { admin } from '../shared/api';
import { AuthProvider, useAuth } from './auth';
import { ResourcePage } from './components/ResourcePage';
import { RESOURCES } from './resources';
import { Account, Forgot, Login, Reset } from './pages/AuthPages';
import { IndicatorDetail, IndicatorList, SubmissionDetail, SubmissionList } from './pages/Indicators';
import { Audit, Dashboard, Documents, Reports, Roles, Settings, Users } from './pages/Admin';
import { RecordDetail, RecordsHome } from './pages/Records';
import { HubPage, HUBS } from './pages/Hubs';

/**
 * Menú lateral del boceto: entradas directas (Panel Principal, Programas, Actividades…) y grupos plegables con flecha
 * (Gestión de CAT, Configuración…). Cada entrada se muestra solo si el rol tiene alguno de los permisos indicados ([] = cualquiera).
 */
type Item = { to: string; label: string; icon: string; perms: string[] };
type Entry = Item | { group: string; icon: string; items: Item[] };
const SECTIONS: { section: string; entries: Entry[] }[] = [
  { section: 'General', entries: [
    { to: '/', label: 'Panel Principal', icon: 'home', perms: [] },
    { to: '/informes', label: 'Reportes', icon: 'download', perms: ['reports.internal.export', 'petty_cash.view'] },
  ] },
  { section: 'Gestión académica', entries: [
    { group: 'Gestión de CAT', icon: 'building', items: [
      { to: '/h/cat', label: 'Fichas de los CAT', icon: 'building', perms: ['cats.edit', 'entities.publish', 'programs.edit'] },
      { to: '/r/convenios', label: 'Convenios', icon: 'hands', perms: ['agreements.view', 'agreements.manage'] },
    ] },
    { to: '/r/programas', label: 'Programas', icon: 'graduation', perms: ['programs.edit', 'entities.publish'] },
    { to: '/r/actividades', label: 'Actividades', icon: 'calendar', perms: ['content.create', 'content.publish'] },
    { to: '/h/proyectos', label: 'Proyectos', icon: 'project', perms: ['projects.edit', 'entities.publish'] },
  ] },
  { section: 'Comunicaciones', entries: [
    { to: '/r/noticias', label: 'Noticias', icon: 'book', perms: ['content.create', 'content.publish'] },
    { to: '/r/multimedia', label: 'Multimedia', icon: 'image', perms: ['media.manage', 'content.publish'] },
    { group: 'Contenidos del portal', icon: 'globe', items: [
      { to: '/h/inicio-portal', label: 'Inicio y Equipo IDEAD', icon: 'home', perms: ['content.site'] },
      { to: '/r/paginas', label: 'Páginas', icon: 'file', perms: ['content.create', 'content.publish'] },
      { to: '/h/publicaciones', label: 'Publicaciones y listados', icon: 'book', perms: ['lists.edit', 'entities.publish'] },
    ] },
  ] },
  { section: 'Información', entries: [
    { group: 'Indicadores y datos', icon: 'chart', items: [
      { to: '/indicadores', label: 'Indicadores', icon: 'chart', perms: ['indicators.view_internal', 'indicators.submit', 'indicators.catalog.manage', 'indicators.review'] },
      { to: '/cargas', label: 'Cargas de indicadores', icon: 'upload', perms: ['indicators.submit', 'indicators.review', 'indicators.publish'] },
      { to: '/bases', label: 'Bases de datos', icon: 'table', perms: ['records.view', 'records.import'] },
      { to: '/r/solicitudes', label: 'Solicitudes a oficinas', icon: 'mail', perms: ['indicators.review', 'indicators.submit'] },
    ] },
    { group: 'Documentos y caja menor', icon: 'file', items: [
      { to: '/documentos', label: 'Documentos', icon: 'file', perms: ['documents.view.internal', 'documents.view.restricted', 'documents.view.financial', 'documents.upload'] },
      { to: '/h/caja-menor', label: 'Caja menor', icon: 'money', perms: ['petty_cash.view'] },
    ] },
  ] },
  { section: 'Administración', entries: [
    { group: 'Configuración', icon: 'settings', items: [
      { to: '/configuracion', label: 'Configuración general', icon: 'settings', perms: ['settings.manage'] },
      { to: '/usuarios', label: 'Usuarios', icon: 'user', perms: ['users.view', 'users.manage'] },
      { to: '/roles', label: 'Roles y permisos', icon: 'shield', perms: ['roles.manage', 'users.view'] },
      { to: '/auditoria', label: 'Auditoría', icon: 'history', perms: ['audit.view'] },
      { to: '/h/referencias', label: 'Dependencias y listas', icon: 'filter', perms: ['catalogs.manage'] },
    ] },
  ] },
];

const isActive = (to: string, pathname: string) => (to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(to + '/'));

/** Logotipo oficial (configurable desde el panel) igual que en el portal público. */
function useLogo() {
  const [logo, setLogo] = useState('/img/logo-ut-temporal.png');
  useEffect(() => {
    fetch('/api/public/v1/site', { headers: { Accept: 'application/json' } }).then((r) => r.json()).then((s) => s?.settings?.logo_url && setLogo(s.settings.logo_url)).catch(() => {});
  }, []);
  return logo;
}

const PENDING_TEXT: Record<string, [string, string]> = {
  lotes_por_revisar: ['Cargas de indicadores por revisar', '/cargas'], lotes_por_publicar: ['Cargas aprobadas por publicar', '/cargas'],
  mis_lotes_devueltos: ['Mis cargas devueltas para corregir', '/cargas'], mis_borradores: ['Mis cargas en borrador', '/cargas'],
  contenidos_en_revision: ['Contenidos en revisión', '/r/noticias'], solicitudes_abiertas: ['Solicitudes para mi dependencia', '/r/solicitudes'],
  solicitudes_vencidas: ['Solicitudes vencidas', '/r/solicitudes'],
};

/** Menú desplegable simple que se cierra al hacer clic fuera o con Escape. */
function Dropdown({ button, children, label }: { button: ReactNode; children: ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  return (
    <div ref={ref} className="relative" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button type="button" aria-label={label} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-2xl p-1 hover:bg-warm">{button}</button>
      {open && <div className="fade-in absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-[#e8e0d8] bg-white p-2 shadow-[0_24px_48px_-16px_rgb(60_20_20/0.35)]">{children}</div>}
    </div>
  );
}

/** Nombre del módulo actual para la barra superior. */
function moduleName(pathname: string): string {
  if (pathname === '/') return 'Panel Principal';
  if (pathname.startsWith('/cuenta')) return 'Mi cuenta';
  const hub = pathname.match(/^\/h\/([^/]+)/)?.[1];
  if (hub && HUBS[hub]) return HUBS[hub].title;
  for (const sec of SECTIONS) for (const e of sec.entries) {
    const items = 'group' in e ? e.items : [e];
    const hit = items.find((i) => i.to !== '/' && isActive(i.to, pathname));
    if (hit) return hit.label;
  }
  const res = pathname.match(/^\/r\/([^/]+)/)?.[1];
  return (res && RESOURCES[res]?.title) || 'Panel Administrativo';
}

function Shell({ children }: { children: ReactNode }) {
  const { me, can, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('idead.sidebar') === 'min');
  useEffect(() => { localStorage.setItem('idead.sidebar', collapsed ? 'min' : 'full'); }, [collapsed]);
  const { pathname } = useLocation();
  const logo = useLogo();
  const [pending, setPending] = useState<Record<string, number>>({});
  useEffect(() => { admin.get<{ pending: Record<string, number> }>('dashboard').then((d) => setPending(d.pending ?? {})).catch(() => {}); }, [pathname]);
  const allowed = (i: Item) => i.perms.length === 0 || can(...i.perms);
  const sections = SECTIONS.map((sec) => ({
    ...sec,
    entries: sec.entries.map((e) => ('group' in e ? { ...e, items: e.items.filter(allowed) } : e)).filter((e) => ('group' in e ? e.items.length > 0 : allowed(e))),
  })).filter((sec) => sec.entries.length);
  const groupActive = (e: Entry) => 'group' in e && e.items.some((i) => isActive(i.to, pathname));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const isOpen = (e: Entry) => 'group' in e && (expanded[e.group] ?? groupActive(e));
  useEffect(() => setOpen(false), [pathname]);
  const pendingItems = Object.entries(pending).filter(([, v]) => v > 0);
  const pendingTotal = pendingItems.reduce((a, [, v]) => a + v, 0);
  const initials = (me?.user.name ?? '?').replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const role = me?.user.roles.map((r) => r.name).join(' · ') || 'Sin rol asignado';
  const mini = collapsed && !open; // en celular el menú abierto siempre va completo

  const itemCls = (a: boolean, sub = false) =>
    `group relative flex items-center gap-3 rounded-xl ${mini ? 'justify-center px-0 py-2.5' : sub ? 'px-3 py-1.5 text-[0.85rem]' : 'px-3 py-2.5 text-[0.9rem]'} font-medium transition ${a ? 'bg-white text-ut-red shadow-[0_6px_18px_-6px_rgb(0_0_0/0.45)]' : 'text-white/85 hover:bg-white/12 hover:text-white'}`;
  const indicator = (a: boolean) => a && !mini ? <span className="absolute top-1/2 -left-4 h-7 w-1.5 -translate-y-1/2 rounded-r-full bg-idead-teal" aria-hidden /> : null;
  const nav = (
    <nav aria-label="Menú del panel" className="space-y-5">
      {sections.map((sec) => (
        <div key={sec.section}>
          {mini ? <div className="mx-auto mb-2 h-px w-8 bg-white/20" aria-hidden /> : <p className="mb-1.5 px-3 text-[0.65rem] font-bold tracking-[0.16em] text-white/55 uppercase">{sec.section}</p>}
          <div className="space-y-1">
            {sec.entries.map((e) => 'group' in e ? (
              <div key={e.group}>
                <button type="button" aria-expanded={!!isOpen(e)} title={mini ? e.group : undefined}
                  onClick={() => { if (mini) { setCollapsed(false); setExpanded({ ...expanded, [e.group]: true }); } else setExpanded({ ...expanded, [e.group]: !isOpen(e) }); }}
                  className={`${itemCls(mini && groupActive(e))} w-full text-left ${groupActive(e) && !mini ? 'text-white' : ''}`}>
                  {indicator(groupActive(e) && !isOpen(e))}
                  <Icon name={e.icon} className="shrink-0 text-xl" />{!mini && <>{e.group}<Icon name="chevronDown" className={`ml-auto text-base transition ${isOpen(e) ? 'rotate-180' : '-rotate-90'}`} /></>}
                  {mini && <span className="sr-only">{e.group}</span>}
                </button>
                {isOpen(e) && !mini && (
                  <div className="mt-1 ml-[1.35rem] space-y-0.5 border-l border-white/20 pl-3">
                    {e.items.map((i) => <NavLink key={i.to} to={i.to} className={({ isActive: a }) => itemCls(a, true)}>{i.label}</NavLink>)}
                  </div>
                )}
              </div>
            ) : (
              <NavLink key={e.to} to={e.to} end={e.to === '/'} title={mini ? e.label : undefined} className={({ isActive: a }) => itemCls(a)}>
                {({ isActive: a }) => <>{indicator(a)}<Icon name={e.icon} className="shrink-0 text-xl" />{mini ? <span className="sr-only">{e.label}</span> : e.label}</>}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
  return (
    <div className={`admin-ui admin-bg min-h-screen lg:grid ${collapsed ? 'lg:grid-cols-[5.25rem_1fr]' : 'lg:grid-cols-[17.5rem_1fr]'} transition-[grid-template-columns]`}>
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <aside className={`admin-scroll fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-x-hidden overflow-y-auto bg-gradient-to-b from-[#d01b26] via-ut-red to-ut-red-dark text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} ${mini ? 'px-3' : 'px-4'}`}>
        <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-64 w-full opacity-60" viewBox="0 0 280 260" preserveAspectRatio="none" aria-hidden>
          <path d="M0 150 C 70 110, 140 190, 280 130 V260 H0Z" fill="#000" fillOpacity=".10" />
          <path d="M0 190 C 90 150, 170 230, 280 180" stroke="#20a99c" strokeOpacity=".55" strokeWidth="2" fill="none" />
          <circle cx="250" cy="40" r="60" stroke="#fff" strokeOpacity=".06" strokeWidth="16" fill="none" />
        </svg>
        <NavLink to="/" className={`relative flex items-center gap-3 py-5 ${mini ? 'justify-center' : ''}`} aria-label="Inicio del panel">
          <span className="shrink-0 rounded-2xl bg-white p-1.5 shadow-lg"><img src={logo} alt="" className={mini ? 'h-8 w-auto' : 'h-10 w-auto'} /></span>
          {!mini && <span className="leading-tight"><span className="font-display block text-[0.95rem] font-extrabold">Universidad del Tolima</span><span className="mt-0.5 inline-block rounded-md bg-white/15 px-1.5 py-0.5 text-[0.7rem] font-bold tracking-[0.18em]">IDEAD</span></span>}
        </NavLink>
        <div className="relative mb-5 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="relative">{nav}</div>
        <div className={`relative mt-auto pt-8 pb-5 ${mini ? 'text-center' : ''}`}>
          {mini ? <span className="text-[0.6rem] font-bold tracking-widest text-white/60">UT</span> : (
            <div className="admin-glass rounded-2xl p-3 text-[0.72rem] leading-snug text-white/85">
              <p className="font-bold text-white">Instituto de Educación a Distancia</p>
              <p>Universidad del Tolima · Centros Regionales</p>
            </div>
          )}
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-[#e8e0d8] bg-white/90 shadow-[0_6px_24px_-18px_rgb(60_20_20/0.5)] backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-2.5 lg:px-7">
            <button className="rounded-xl p-2 text-2xl text-ink hover:bg-warm lg:hidden" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} /></button>
            <button className="hidden rounded-xl p-2 text-2xl text-ink hover:bg-warm lg:block" aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'} aria-pressed={collapsed} onClick={() => setCollapsed(!collapsed)}><Icon name="menu" /></button>
            <div className="min-w-0">
              <p className="hidden text-[0.65rem] font-bold tracking-[0.16em] text-muted uppercase sm:block">Panel Administrativo · IDEAD</p>
              <p className="font-display truncate text-[1.05rem] font-bold text-ink">{moduleName(pathname)}</p>
            </div>
            <a href="/" target="_blank" rel="noopener" className="ml-auto hidden items-center gap-1.5 rounded-xl border border-[#e3dbd3] bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm hover:border-ut-red/50 hover:text-ut-red md:flex"><Icon name="globe" /> Ver portal</a>
            <div className="ml-auto md:ml-0">
              <Dropdown label={`Notificaciones: ${pendingTotal} pendientes`} button={
                <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-warm text-2xl text-ink">
                  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16zM10 20.5a2 2 0 0 0 4 0" /></svg>
                  {pendingTotal > 0 && <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-ut-red px-1 text-[0.65rem] font-bold text-white ring-2 ring-white">{pendingTotal > 99 ? '99+' : pendingTotal}</span>}
                </span>}>
                <p className="px-3 py-2 text-xs font-bold text-muted uppercase">Pendientes</p>
                {pendingItems.length === 0 ? <p className="px-3 pb-3 text-sm text-muted">Todo al día.</p> : pendingItems.map(([k, v]) => (
                  <NavLink key={k} to={PENDING_TEXT[k]?.[1] ?? '/'} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-warm">
                    <span className="grid h-7 min-w-7 place-items-center rounded-full bg-ut-red-50 px-1.5 text-xs font-bold text-ut-red">{v}</span>{PENDING_TEXT[k]?.[0] ?? k}
                  </NavLink>
                ))}
              </Dropdown>
            </div>
            <span className="hidden h-8 w-px bg-line md:block" aria-hidden />
            <Dropdown label="Menú de la cuenta" button={
              <>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-ut-red to-ut-red-dark text-sm font-bold text-white ring-[3px] ring-ut-red-50">{initials}</span>
                <span className="hidden text-left leading-tight md:block"><span className="block max-w-44 truncate text-sm font-bold text-ink">{me?.user.name}</span><span className="block max-w-44 truncate text-xs text-muted">{role}</span></span>
                <Icon name="chevronDown" className="hidden text-muted md:block" />
              </>}>
              <div className="mb-1 flex items-center gap-3 rounded-xl bg-ivory p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ut-red to-ut-red-dark text-sm font-bold text-white">{initials}</span>
                <span className="min-w-0 leading-tight"><span className="block truncate text-sm font-bold">{me?.user.name}</span><span className="block truncate text-xs text-muted">{me?.user.email}</span></span>
              </div>
              <NavLink to="/cuenta" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-warm"><Icon name="user" /> Mi cuenta y seguridad</NavLink>
              <a href="/" target="_blank" rel="noopener" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-warm"><Icon name="external" /> Ver portal público</a>
              <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-ut-red hover:bg-ut-red-50"><Icon name="logout" /> Cerrar sesión</button>
            </Dropdown>
          </div>
        </header>
        <main id="contenido" className="min-w-0 p-4 md:p-7">{children}</main>
      </div>
    </div>
  );
}

function ResourceRoute() {
  const { name } = useParams();
  const cfg = name ? RESOURCES[name] : undefined;
  if (!cfg) return <p>Recurso no encontrado.</p>;
  return <ResourcePage cfg={cfg} />;
}

function Protected() {
  const { me, loading } = useAuth();
  if (loading) return <div className="p-10"><Spinner /></div>;
  if (!me) return <Navigate to="/login" replace />;
  if (me.must_setup_mfa) return <Shell><Account /></Shell>;
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/indicadores" element={<IndicatorList />} />
        <Route path="/indicadores/:id" element={<IndicatorDetail />} />
        <Route path="/cargas" element={<SubmissionList />} />
        <Route path="/cargas/:id" element={<SubmissionDetail />} />
        <Route path="/bases" element={<RecordsHome />} />
        <Route path="/bases/:entity" element={<RecordDetail />} />
        <Route path="/informes" element={<Reports />} />
        <Route path="/documentos" element={<Documents />} />
        <Route path="/usuarios" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/auditoria" element={<Audit />} />
        <Route path="/configuracion" element={<Settings />} />
        <Route path="/cuenta" element={<Account />} />
        <Route path="/r/:name" element={<ResourceRoute />} />
        <Route path="/h/:hub" element={<HubPage />} />
        <Route path="*" element={<p>Página no encontrada.</p>} />
      </Routes>
    </Shell>
  );
}

function App() {
  const { me } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={me ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/recuperar" element={<Forgot />} />
      <Route path="/restablecer" element={<Reset />} />
      <Route path="/*" element={<Protected />} />
    </Routes>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/admin">
      <AuthProvider><App /></AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

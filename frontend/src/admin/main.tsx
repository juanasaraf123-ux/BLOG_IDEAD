import { StrictMode, useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom';
import '../styles.css';
import { Icon } from '../shared/icons';
import { Spinner } from '../shared/ui';
import { AuthProvider, useAuth } from './auth';
import { ResourcePage } from './components/ResourcePage';
import { RESOURCES } from './resources';
import { Account, Forgot, Login, Reset } from './pages/AuthPages';
import { IndicatorDetail, IndicatorList, SubmissionDetail, SubmissionList } from './pages/Indicators';
import { Audit, Dashboard, Documents, Reports, Roles, Settings, Users } from './pages/Admin';
import { RecordDetail, RecordsHome } from './pages/Records';

/**
 * Menú lateral agrupado por tareas. Cada entrada se muestra solo si el rol tiene alguno de los permisos indicados ([] = cualquiera);
 * los grupos se pliegan y queda abierto el de la página actual.
 */
type Item = { to: string; label: string; icon: string; perms: string[] };
const MENU: { group: string; icon: string; items: Item[] }[] = [
  { group: 'Información e indicadores', icon: 'chart', items: [
    { to: '/bases', label: 'Bases de datos', icon: 'table', perms: ['records.view', 'records.import'] },
    { to: '/indicadores', label: 'Indicadores', icon: 'chart', perms: ['indicators.view_internal', 'indicators.submit', 'indicators.catalog.manage', 'indicators.review'] },
    { to: '/cargas', label: 'Cargas de indicadores', icon: 'upload', perms: ['indicators.submit', 'indicators.review', 'indicators.publish'] },
    { to: '/r/solicitudes', label: 'Solicitudes a oficinas', icon: 'mail', perms: ['indicators.review', 'indicators.submit'] },
    { to: '/informes', label: 'Informes', icon: 'download', perms: ['reports.internal.export', 'petty_cash.view'] },
  ] },
  { group: 'Portal público', icon: 'globe', items: [
    { to: '/r/noticias', label: 'Noticias', icon: 'book', perms: ['content.create', 'content.publish'] },
    { to: '/r/actividades', label: 'Actividades', icon: 'calendar', perms: ['content.create', 'content.publish'] },
    { to: '/r/multimedia', label: 'Multimedia', icon: 'image', perms: ['media.manage', 'content.publish'] },
    { to: '/r/paginas', label: 'Páginas', icon: 'file', perms: ['content.create', 'content.publish'] },
    { to: '/r/carrusel', label: 'Carrusel del inicio', icon: 'image', perms: ['content.site'] },
    { to: '/r/destacados', label: 'Cifras destacadas', icon: 'chart', perms: ['content.site'] },
    { to: '/r/equipo', label: 'Equipo IDEAD', icon: 'people', perms: ['content.site'] },
    { to: '/r/categorias-noticias', label: 'Categorías de noticias', icon: 'filter', perms: ['content.site'] },
  ] },
  { group: 'Fichas institucionales', icon: 'building', items: [
    { to: '/r/cat', label: 'CAT', icon: 'building', perms: ['cats.edit', 'entities.publish'] },
    { to: '/r/programas', label: 'Programas', icon: 'graduation', perms: ['programs.edit', 'entities.publish'] },
    { to: '/r/oferta', label: 'Oferta por CAT', icon: 'table', perms: ['programs.edit'] },
    { to: '/r/proyectos', label: 'Proyectos', icon: 'project', perms: ['projects.edit', 'entities.publish'] },
    { to: '/r/avances', label: 'Avances de proyectos', icon: 'chart', perms: ['projects.edit'] },
    { to: '/r/convenios', label: 'Convenios', icon: 'hands', perms: ['agreements.view', 'agreements.manage'] },
    { to: '/r/publicaciones', label: 'Publicaciones', icon: 'book', perms: ['lists.edit', 'entities.publish'] },
    { to: '/r/listados', label: 'Otros listados', icon: 'book', perms: ['lists.edit', 'entities.publish'] },
  ] },
  { group: 'Documentos y caja menor', icon: 'file', items: [
    { to: '/documentos', label: 'Documentos', icon: 'file', perms: ['documents.view.internal', 'documents.view.restricted', 'documents.view.financial', 'documents.upload'] },
    { to: '/r/caja-menor', label: 'Caja menor: presupuestos', icon: 'money', perms: ['petty_cash.view'] },
    { to: '/r/caja-menor-gastos', label: 'Caja menor: gastos', icon: 'money', perms: ['petty_cash.view'] },
  ] },
  { group: 'Administración', icon: 'shield', items: [
    { to: '/usuarios', label: 'Usuarios', icon: 'user', perms: ['users.view', 'users.manage'] },
    { to: '/roles', label: 'Roles y permisos', icon: 'shield', perms: ['roles.manage', 'users.view'] },
    { to: '/auditoria', label: 'Auditoría', icon: 'history', perms: ['audit.view'] },
    { to: '/configuracion', label: 'Configuración', icon: 'settings', perms: ['settings.manage'] },
  ] },
  { group: 'Listas de referencia', icon: 'filter', items: [
    { to: '/r/periodos', label: 'Períodos', icon: 'calendar', perms: ['catalogs.manage'] },
    { to: '/r/dependencias', label: 'Dependencias', icon: 'building', perms: ['catalogs.manage'] },
    { to: '/r/fuentes', label: 'Fuentes de información', icon: 'info', perms: ['catalogs.manage'] },
    { to: '/r/clasificadores', label: 'Clasificadores', icon: 'filter', perms: ['catalogs.manage'] },
    { to: '/r/categorias-clasificador', label: 'Categorías de clasificador', icon: 'filter', perms: ['catalogs.manage'] },
    { to: '/r/departamentos', label: 'Departamentos', icon: 'pin', perms: ['catalogs.manage'] },
    { to: '/r/municipios', label: 'Municipios', icon: 'pin', perms: ['catalogs.manage'] },
    { to: '/r/niveles', label: 'Niveles de formación', icon: 'graduation', perms: ['catalogs.manage'] },
    { to: '/r/areas', label: 'Áreas de conocimiento', icon: 'book', perms: ['catalogs.manage'] },
    { to: '/r/categorias-documentales', label: 'Categorías documentales', icon: 'file', perms: ['catalogs.manage'] },
  ] },
];

const isActive = (to: string, pathname: string) => pathname === to || pathname.startsWith(to + '/');

/** Logotipo oficial (configurable desde el panel) igual que en el portal público. */
function useLogo() {
  const [logo, setLogo] = useState('/img/logo-ut-temporal.png');
  useEffect(() => {
    fetch('/api/public/v1/site', { headers: { Accept: 'application/json' } }).then((r) => r.json()).then((s) => s?.settings?.logo_url && setLogo(s.settings.logo_url)).catch(() => {});
  }, []);
  return logo;
}

function Shell({ children }: { children: ReactNode }) {
  const { me, can, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const logo = useLogo();
  const visible = MENU.map((g) => ({ ...g, items: g.items.filter((i) => i.perms.length === 0 || can(...i.perms)) })).filter((g) => g.items.length);
  const current = visible.find((g) => g.items.some((i) => isActive(i.to, pathname)))?.group;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const isOpen = (g: string) => expanded[g] ?? (g === current || (!current && g === visible[0]?.group));
  useEffect(() => setOpen(false), [pathname]);

  const link = (i: Item, end = false) => (
    <NavLink key={i.to} to={i.to} end={end} className={({ isActive: a }) => `relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.9rem] transition ${a ? 'bg-white font-semibold text-ut-red shadow-sm before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-ut-red' : 'text-white/85 hover:bg-white/10 hover:text-white'}`}>
      <Icon name={i.icon} className="shrink-0 text-lg" />{i.label}
    </NavLink>
  );
  const nav = (
    <nav aria-label="Menú del panel" className="space-y-1">
      {link({ to: '/', label: 'Inicio', icon: 'home', perms: [] }, true)}
      {visible.map((g) => (
        <div key={g.group} className="pt-1">
          <button type="button" aria-expanded={isOpen(g.group)} onClick={() => setExpanded({ ...expanded, [g.group]: !isOpen(g.group) })}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[0.72rem] font-bold tracking-wider uppercase hover:bg-white/10 ${g.group === current ? 'text-white' : 'text-white/60'}`}>
            {g.group}
            <Icon name="chevronDown" className={`ml-auto text-base transition ${isOpen(g.group) ? 'rotate-180' : ''}`} />
          </button>
          {isOpen(g.group) && <div className="mt-0.5 space-y-0.5">{g.items.map((i) => link(i))}</div>}
        </div>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen bg-surface">
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <header className="sticky top-0 z-30 border-b-4 border-ut-red bg-white/95 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-2.5 lg:px-6">
          <button className="rounded-lg p-2 text-2xl text-ink lg:hidden" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} /></button>
          <NavLink to="/" className="flex shrink-0 items-center gap-3" aria-label="Inicio del panel">
            <img src={logo} alt="Universidad del Tolima" className="h-10 w-auto md:h-12" />
            <span className="hidden border-l border-gray-300 pl-3 text-[0.7rem] leading-tight font-medium whitespace-nowrap text-ink uppercase sm:block">Instituto de<br />Educación<br />a Distancia</span>
          </NavLink>
          <span className="ml-1 hidden rounded-full bg-ut-red-50 px-3 py-1 text-xs font-bold text-ut-red md:inline">Panel de gestión</span>
          <a href="/" target="_blank" rel="noopener" className="ml-auto hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-[#4a4f55] hover:border-ut-red hover:text-ut-red sm:flex"><Icon name="external" /> Ver portal</a>
          <NavLink to="/cuenta" className="ml-auto flex items-center gap-2 rounded-full px-2 py-1 text-sm hover:bg-surface sm:ml-0">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-green-dark text-xs font-bold text-white">{(me?.user.name ?? '?').replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</span>
            <span className="hidden max-w-40 truncate md:inline">{me?.user.name}</span>
          </NavLink>
          <button onClick={logout} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-ut-red hover:bg-ut-red-50"><Icon name="logout" /> <span className="hidden sm:inline">Salir</span></button>
        </div>
      </header>
      <div className="lg:grid lg:grid-cols-[16.5rem_1fr]">
        <aside className={`fixed inset-y-0 left-0 z-20 w-72 overflow-y-auto bg-gradient-to-b from-green-dark to-[#123f39] px-3 pt-20 pb-6 transition-transform lg:sticky lg:top-[69px] lg:z-0 lg:h-[calc(100vh-69px)] lg:w-auto lg:translate-x-0 lg:pt-4 ${open ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}>
          {nav}
          <p className="mt-8 px-3 text-[0.7rem] leading-snug text-white/50">Universidad del Tolima<br />Instituto de Educación a Distancia</p>
        </aside>
        <main id="contenido" className="min-w-0 p-4 md:p-7">{children}</main>
      </div>
      {open && <div className="fixed inset-0 z-10 bg-black/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
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

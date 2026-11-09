import { StrictMode, useState, type ReactNode } from 'react';
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

/** Menú lateral: cada entrada se muestra solo si el rol tiene alguno de los permisos indicados ([] = cualquiera). */
const MENU: { group: string; items: { to: string; label: string; icon: string; perms: string[] }[] }[] = [
  { group: '', items: [{ to: '/', label: 'Inicio', icon: 'home', perms: [] }] },
  { group: 'Indicadores', items: [
    { to: '/indicadores', label: 'Catálogo de indicadores', icon: 'chart', perms: ['indicators.view_internal', 'indicators.submit', 'indicators.catalog.manage', 'indicators.review'] },
    { to: '/cargas', label: 'Cargas de datos', icon: 'upload', perms: ['indicators.submit', 'indicators.review', 'indicators.publish'] },
    { to: '/informes', label: 'Informes', icon: 'download', perms: ['reports.internal.export', 'petty_cash.view'] },
  ] },
  { group: 'Contenidos', items: [
    { to: '/r/noticias', label: 'Noticias', icon: 'book', perms: ['content.create', 'content.publish'] },
    { to: '/r/actividades', label: 'Actividades', icon: 'calendar', perms: ['content.create', 'content.publish'] },
    { to: '/r/multimedia', label: 'Multimedia', icon: 'image', perms: ['media.manage', 'content.publish'] },
    { to: '/r/paginas', label: 'Páginas', icon: 'file', perms: ['content.create', 'content.publish'] },
    { to: '/r/carrusel', label: 'Carrusel del inicio', icon: 'image', perms: ['content.site'] },
    { to: '/r/destacados', label: 'Cifras destacadas', icon: 'chart', perms: ['content.site'] },
    { to: '/r/equipo', label: 'Equipo IDEAD', icon: 'people', perms: ['content.site'] },
    { to: '/r/categorias-noticias', label: 'Categorías de noticias', icon: 'filter', perms: ['content.site'] },
  ] },
  { group: 'Fichas institucionales', items: [
    { to: '/r/cat', label: 'CAT', icon: 'building', perms: ['cats.edit', 'entities.publish'] },
    { to: '/r/programas', label: 'Programas', icon: 'graduation', perms: ['programs.edit', 'entities.publish'] },
    { to: '/r/oferta', label: 'Oferta por CAT', icon: 'table', perms: ['programs.edit'] },
    { to: '/r/proyectos', label: 'Proyectos', icon: 'project', perms: ['projects.edit', 'entities.publish'] },
    { to: '/r/avances', label: 'Avances de proyectos', icon: 'chart', perms: ['projects.edit'] },
    { to: '/r/listados', label: 'Listados institucionales', icon: 'book', perms: ['lists.edit', 'entities.publish'] },
    { to: '/r/convenios', label: 'Convenios', icon: 'hands', perms: ['agreements.view', 'agreements.manage'] },
  ] },
  { group: 'Gestión documental y financiera', items: [
    { to: '/documentos', label: 'Documentos', icon: 'file', perms: ['documents.view.internal', 'documents.view.restricted', 'documents.view.financial', 'documents.upload'] },
    { to: '/r/caja-menor', label: 'Caja menor: presupuestos', icon: 'money', perms: ['petty_cash.view'] },
    { to: '/r/caja-menor-gastos', label: 'Caja menor: gastos', icon: 'money', perms: ['petty_cash.view'] },
  ] },
  { group: 'Administración técnica', items: [
    { to: '/usuarios', label: 'Usuarios', icon: 'user', perms: ['users.view', 'users.manage'] },
    { to: '/roles', label: 'Roles y permisos', icon: 'shield', perms: ['roles.manage', 'users.view'] },
    { to: '/auditoria', label: 'Auditoría', icon: 'history', perms: ['audit.view'] },
    { to: '/configuracion', label: 'Configuración', icon: 'settings', perms: ['settings.manage'] },
  ] },
  { group: 'Catálogos', items: [
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

function Shell({ children }: { children: ReactNode }) {
  const { me, can, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const visible = MENU.map((g) => ({ ...g, items: g.items.filter((i) => i.perms.length === 0 || can(...i.perms)) })).filter((g) => g.items.length);
  const nav = (
    <nav aria-label="Menú del panel" className="space-y-4">
      {visible.map((g) => (
        <div key={g.group}>
          {g.group && <p className="mb-1 px-3 text-[0.7rem] font-bold tracking-wider text-white/60 uppercase">{g.group}</p>}
          <ul>{g.items.map((i) => (
            <li key={i.to}><NavLink to={i.to} end={i.to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-white/15 font-semibold text-white' : 'text-white/85 hover:bg-white/10'}`}><Icon name={i.icon} />{i.label}</NavLink></li>
          ))}</ul>
        </div>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[17rem_1fr]">
      <a href="#contenido" className="skip-link">Saltar al contenido</a>
      <aside className={`fixed inset-y-0 left-0 z-30 w-68 overflow-y-auto bg-green-dark px-3 py-4 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-5 px-3"><p className="text-lg font-extrabold text-white">Panel IDEAD</p><p className="text-xs text-white/70">Universidad del Tolima</p></div>
        {nav}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white px-4 py-2.5">
          <button className="rounded p-2 text-xl lg:hidden" aria-label="Abrir menú" aria-expanded={open} onClick={() => setOpen(!open)}><Icon name="menu" /></button>
          <span className="truncate text-sm text-muted">{pathname}</span>
          <a href="/" target="_blank" rel="noopener" className="ml-auto hidden items-center gap-1 text-sm text-green-dark hover:underline sm:flex"><Icon name="external" /> Ver portal</a>
          <NavLink to="/cuenta" className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm hover:bg-surface"><Icon name="user" /> {me?.user.name}</NavLink>
          <button onClick={logout} className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-ut-red hover:bg-ut-red-50"><Icon name="logout" /> Salir</button>
        </header>
        <main id="contenido" className="p-4 md:p-6">{children}</main>
      </div>
      {open && <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
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

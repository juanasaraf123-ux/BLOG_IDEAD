import { lazy, StrictMode, Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import '../styles.css';
import { SiteProvider } from './site';
import { DemoBanner, Footer, Header } from './components/Layout';
import { Spinner } from '../shared/ui';
import NotFound from './pages/NotFound';

// Carga diferida por sección: el inicio no descarga el código de los módulos estadísticos y viceversa.
const Home = lazy(() => import('./pages/Home'));
const named = <T extends string>(loader: () => Promise<Record<T, React.ComponentType>>, name: T) => lazy(() => loader().then((m) => ({ default: m[name] })));
const stats = () => import('./pages/Stats');
const cats = () => import('./pages/Cats');
const content = () => import('./pages/Content');
const info = () => import('./pages/Info');
const StatsIndex = named(stats, 'StatsIndex'), ModulePage = named(stats, 'ModulePage');
const CatList = named(cats, 'CatList'), CatDetail = named(cats, 'CatDetail');
const Programs = named(content, 'Programs'), ProgramDetail = named(content, 'ProgramDetail'), NewsList = named(content, 'NewsList'), NewsDetail = named(content, 'NewsDetail');
const Events = named(content, 'Events'), EventDetail = named(content, 'EventDetail'), Multimedia = named(content, 'Multimedia'), Projects = named(content, 'Projects'), ProjectDetail = named(content, 'ProjectDetail');
const Transparency = named(info, 'Transparency'), About = named(info, 'About'), CmsPage = named(info, 'CmsPage'), Search = named(info, 'Search'), SiteMap = named(info, 'SiteMap');

/** Desplaza al inicio (o al ancla) en cada cambio de ruta y mueve el foco al contenido para lectores de pantalla. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView(), 600);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname, hash]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <SiteProvider>
        <ScrollManager />
        <a href="#main" className="skip-link">Saltar al contenido</a>
        <DemoBanner />
        <Header />
        <main id="main" tabIndex={-1} className="min-h-[60vh] focus:outline-none">
          <Suspense fallback={<div className="mx-auto max-w-[1500px] px-4"><Spinner /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/estadisticas" element={<StatsIndex />} />
            <Route path="/estadisticas/:slug" element={<ModulePage />} />
            <Route path="/cat" element={<CatList />} />
            <Route path="/cat/:slug" element={<CatDetail />} />
            <Route path="/programas" element={<Programs />} />
            <Route path="/programas/:slug" element={<ProgramDetail />} />
            <Route path="/noticias" element={<NewsList />} />
            <Route path="/noticias/:slug" element={<NewsDetail />} />
            <Route path="/actividades" element={<Events />} />
            <Route path="/actividades/:slug" element={<EventDetail />} />
            <Route path="/multimedia" element={<Multimedia />} />
            <Route path="/proyectos" element={<Projects />} />
            <Route path="/proyectos/:slug" element={<ProjectDetail />} />
            <Route path="/transparencia" element={<Transparency />} />
            <Route path="/sobre-idead" element={<About />} />
            <Route path="/pagina/:slug" element={<CmsPage />} />
            <Route path="/buscar" element={<Search />} />
            <Route path="/mapa-del-sitio" element={<SiteMap />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </main>
        <Footer />
      </SiteProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import '../styles.css';
import { SiteProvider } from './site';
import { DemoBanner, Footer, Header } from './components/Layout';
import Home from './pages/Home';
import { ModulePage, StatsIndex } from './pages/Stats';
import { CatDetail, CatList } from './pages/Cats';
import { EventDetail, Events, Multimedia, NewsDetail, NewsList, ProgramDetail, Programs, ProjectDetail, Projects } from './pages/Content';
import { About, CmsPage, Search, SiteMap, Transparency } from './pages/Info';
import NotFound from './pages/NotFound';

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
        </main>
        <Footer />
      </SiteProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

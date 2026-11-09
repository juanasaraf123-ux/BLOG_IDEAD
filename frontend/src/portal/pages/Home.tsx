import { Link } from 'react-router-dom';
import { publicGet } from '../../shared/api';
import { Icon } from '../../shared/icons';
import type { HomeData, ModuleInfo } from '../../shared/types';
import { ErrorBox, Spinner, useAsync, useDocumentTitle } from '../../shared/ui';
import { CatCoverage, EventsColumn, HeroCarousel, KpiGrid, ModulesGrid, NewsColumn, TeamColumn } from '../components/HomeBlocks';
import { useSite } from '../site';

const QUICK = [
  { to: '/programas', label: 'Oferta académica', icon: 'graduation' },
  { to: '/cat', label: 'Centros de Atención Tutorial', icon: 'building' },
  { to: '/estadisticas', label: 'Estadísticas', icon: 'chart' },
  { to: '/actividades', label: 'Calendario', icon: 'calendar' },
  { to: '/transparencia', label: 'Transparencia', icon: 'shield' },
  { to: '/noticias', label: 'Noticias', icon: 'book' },
];

export default function Home() {
  useDocumentTitle('');
  const site = useSite();
  const { data, error, loading, reload } = useAsync(() => publicGet<HomeData>('home'), []);
  const mods = useAsync(() => publicGet<ModuleInfo[]>('modules'), []);
  return (
    <div className="bg-[radial-gradient(circle_at_80%_0%,#fdf1f1_0,transparent_45%),radial-gradient(circle_at_0%_60%,#eef8f6_0,transparent_40%)]">
      <h1 className="sr-only">{site?.settings.site_name ?? 'Instituto de Educación a Distancia – IDEAD'} · Universidad del Tolima</h1>
      <div className="mx-auto max-w-[1500px] px-4 pt-6 lg:px-8">
        {loading && <Spinner />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {data && (
          <>
            {/* Fila 1 del boceto: carrusel + cifras destacadas */}
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
              <HeroCarousel slides={data.slides} />
              <KpiGrid items={data.highlights} />
            </div>

            <nav aria-label="Accesos rápidos" className="mt-6">
              <ul className="flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <li key={q.to}><Link to={q.to} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:border-ut-red hover:text-ut-red"><Icon name={q.icon} className="text-ut-red" />{q.label}</Link></li>
                ))}
              </ul>
            </nav>

            {/* Fila 2 del boceto: noticias · actividades · equipo | panel CAT + mapa */}
            <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
              <div className="grid gap-8 md:grid-cols-3 md:divide-x md:divide-ut-red/20 [&>*]:md:pl-6 [&>*:first-child]:md:pl-0">
                <NewsColumn news={data.news} />
                <EventsColumn events={data.events} />
                <TeamColumn team={data.team} />
              </div>
              <CatCoverage cats={data.cats} />
            </div>
          </>
        )}

        <section aria-labelledby="modulos" className="mt-16">
          <div className="mb-6 max-w-3xl">
            <h2 id="modulos" className="text-2xl font-extrabold text-ut-red md:text-3xl">{site?.settings.hero_title ?? 'Información institucional del IDEAD'}</h2>
            <p className="mt-2 text-lg text-muted">{site?.settings.hero_text} Cada cifra muestra su fuente, período y fecha de actualización.</p>
          </div>
          {mods.data ? <ModulesGrid modules={mods.data} /> : <Spinner />}
        </section>
      </div>
    </div>
  );
}

import { publicGet } from '../../shared/api';
import type { HomeData, ModuleInfo } from '../../shared/types';
import { ErrorBox, Spinner, useAsync, useDocumentTitle } from '../../shared/ui';
import { CatPicker, CoverageCard, FeatureCard, HeroCarousel, ModulesGrid, StatCards } from '../components/HomeBlocks';
import { fmtDate } from '../../shared/format';
import { DemoBadge } from '../../shared/ui';
import { useSite } from '../site';

export default function Home() {
  useDocumentTitle('');
  const site = useSite();
  const { data, error, loading, reload } = useAsync(() => publicGet<HomeData>('home'), []);
  const mods = useAsync(() => publicGet<ModuleInfo[]>('modules'), []);
  const news = data?.news[0];
  const event = data?.events[0];
  return (
    <div className="-mb-16 bg-white bg-[url(/img/fondos/fondo-hojas.webp)] bg-cover bg-fixed bg-center pb-16">
      <h1 className="sr-only">{site?.settings.site_name ?? 'Instituto de Educación a Distancia – IDEAD'} · Universidad del Tolima</h1>
      <div className="mx-auto max-w-[1600px] px-4 pt-5 lg:px-8">
        {loading && <Spinner />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {data && (
          <>
            {/* Fila 1 del boceto: carrusel | cifras 3×2 + selector rojo de CAT */}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
              <HeroCarousel slides={data.slides} />
              <div className="flex flex-col justify-between">
                <StatCards items={data.highlights} />
                <CatPicker cats={data.cats} />
              </div>
            </div>

            {/* Fila 2 del boceto: noticias · actividades · equipo · mapa de cobertura */}
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FeatureCard icon="book" title="Noticias Destacadas" link={news ? `/noticias/${news.slug}` : '/noticias'} linkLabel="Ver más"
                image={news?.image_url ?? '/img/home/estudiantes-circulo.jpg'} imageAlt={news?.image_url ? news.title : 'Estudiantes del IDEAD reunidos en el campus'}>
                {news ? <><span className="line-clamp-3 font-semibold text-ink">{news.title}</span><span className="mt-1 block text-xs">{fmtDate(news.date)} {news.is_demo && <DemoBadge />}</span></> : 'Conoce lo que sucede en el IDEAD y sus Centros de Atención Tutorial.'}
              </FeatureCard>
              <FeatureCard icon="calendar" title="Próximas Actividades" link="/actividades" linkLabel="Ver calendario"
                image="/img/home/estudiante-campo.jpg" imageAlt="Estudiante en práctica de campo">
                {event ? <><span className="line-clamp-3 font-semibold text-ink">{event.title}</span><span className="mt-1 block text-xs">{fmtDate(event.starts_at)} {event.is_demo && <DemoBadge />}</span></> : 'Consulta la agenda académica y las actividades de los CAT.'}
              </FeatureCard>
              <FeatureCard icon="people" title="Equipo IDEAD" link="/sobre-idead" linkLabel="Conoce más"
                image="/img/home/grupo-idead.jpg" imageAlt="Comunidad IDEAD en el campus de la Universidad del Tolima">
                {data.team.length ? `${data.team.slice(0, 3).map((t) => t.name).join(' · ')}` : 'Conoce las dependencias que acompañan tu proceso formativo.'}
              </FeatureCard>
              <CoverageCard cats={data.cats} />
            </div>
          </>
        )}

        <section aria-labelledby="modulos" className="mt-12 rounded-[1.5rem] border border-white bg-white/90 p-6 shadow-[0_10px_30px_-14px_rgba(120,20,20,0.3)] backdrop-blur md:p-8">
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

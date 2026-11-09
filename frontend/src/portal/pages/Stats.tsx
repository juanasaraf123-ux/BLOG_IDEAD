import { Link, useParams } from 'react-router-dom';
import { publicGet } from '../../shared/api';
import { Icon } from '../../shared/icons';
import type { IndicatorMeta, ModuleInfo } from '../../shared/types';
import { ErrorBox, Spinner, useAsync, useDocumentTitle } from '../../shared/ui';
import { FilterBar, useFilters } from '../components/Filters';
import { IndicatorCard } from '../components/IndicatorCard';
import { ModulesGrid } from '../components/HomeBlocks';
import { PageShell } from '../components/Layout';
import NotFound from './NotFound';

export function StatsIndex() {
  useDocumentTitle('Estadísticas e indicadores');
  const { data, error, loading } = useAsync(() => publicGet<ModuleInfo[]>('modules'), []);
  return (
    <PageShell title="Estadísticas e indicadores" intro="Los 13 módulos de información institucional del IDEAD. Cada indicador muestra su fuente, dependencia responsable, período y estado de validación metodológica.">
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {data && <ModulesGrid modules={data} />}
    </PageShell>
  );
}

/** Dimensiones que realmente filtran algún indicador del módulo (no se muestran filtros que no aplican). */
function filtersFor(indicators: IndicatorMeta[]) {
  const dims = new Set(indicators.flatMap((i) => i.allowed_dimensions));
  const show = ['year', 'period'];
  if (dims.has('level')) show.push('level');
  if (dims.has('program')) show.push('program');
  if (dims.has('department') || dims.has('cat')) show.push('department');
  if (dims.has('cat')) show.push('cat');
  return show;
}

export function ModulePage() {
  const { slug } = useParams();
  const { data, error, loading, status } = useAsync(() => publicGet<{ module: ModuleInfo; indicators: IndicatorMeta[] }>(`modules/${slug}`), [slug]);
  const { values } = useFilters();
  useDocumentTitle(data?.module.name ?? 'Estadísticas');
  if (status === 404) return <NotFound />;
  return (
    <PageShell title={data?.module.name ?? '…'} crumbs={[{ to: '/estadisticas', label: 'Estadísticas' }]}
      intro={data && <>{data.module.description} <span className="block text-base">Módulo {data.module.number} · {data.indicators.length} indicadores.</span></>}>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {data && (
        <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="no-print lg:sticky lg:top-28 lg:self-start">
            <nav aria-label="Indicadores del módulo" className="rounded-xl border border-line p-3">
              <p className="mb-2 px-2 text-xs font-bold text-muted uppercase">En esta página</p>
              <ol className="space-y-0.5 text-sm">
                {data.indicators.map((i) => <li key={i.code}><a href={`#${i.code}`} className="block rounded px-2 py-1.5 hover:bg-surface hover:text-ut-red"><span className="font-bold text-ut-red">{i.code.slice(4)}</span> {i.name}</a></li>)}
              </ol>
              <button onClick={() => window.print()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-ut-red hover:text-ut-red"><Icon name="print" /> Imprimir / PDF</button>
            </nav>
          </aside>
          <div className="min-w-0 space-y-6">
            <FilterBar show={filtersFor(data.indicators)} />
            {data.indicators.map((i) => <IndicatorCard key={i.code} meta={i} filters={values} />)}
            <p className="text-sm text-muted">¿Buscas la metodología y fuentes de todos los indicadores? Consulta <Link to="/transparencia" className="text-ut-red underline">Transparencia</Link>.</p>
          </div>
        </div>
      )}
    </PageShell>
  );
}

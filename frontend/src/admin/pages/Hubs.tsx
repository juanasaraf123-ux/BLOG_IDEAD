import { useParams, useSearchParams } from 'react-router-dom';
import { Icon } from '../../shared/icons';
import { useAuth } from '../auth';
import { PageHeader } from '../components/PageHeader';
import { ResourcePage } from '../components/ResourcePage';
import { RESOURCES } from '../resources';

/**
 * Pantallas que agrupan varias listas relacionadas en pestañas, para que el menú sea corto:
 * cada pestaña es una lista de RESOURCES y solo aparece si el rol puede usarla.
 */
export const HUBS: Record<string, { title: string; description: string; icon: string; eyebrow: string; tabs: { key: string; label: string; perms: string[] }[] }> = {
  'inicio-portal': {
    title: 'Página de inicio del portal', eyebrow: 'Portal público', icon: 'home',
    description: 'Lo que ve primero el público: imágenes del carrusel, cifras destacadas, equipo del IDEAD y categorías de noticias.',
    tabs: [
      { key: 'carrusel', label: 'Carrusel', perms: ['content.site'] },
      { key: 'destacados', label: 'Cifras destacadas', perms: ['content.site'] },
      { key: 'equipo', label: 'Equipo IDEAD', perms: ['content.site'] },
      { key: 'categorias-noticias', label: 'Categorías de noticias', perms: ['content.site'] },
    ],
  },
  cat: {
    title: 'Centros de Atención Tutorial (CAT)', eyebrow: 'Fichas institucionales', icon: 'building',
    description: 'Ficha pública de cada CAT y los programas que ofrece en cada semestre.',
    tabs: [
      { key: 'cat', label: 'Fichas de los CAT', perms: ['cats.edit', 'entities.publish'] },
      { key: 'oferta', label: 'Programas ofrecidos por CAT', perms: ['programs.edit'] },
    ],
  },
  proyectos: {
    title: 'Proyectos', eyebrow: 'Fichas institucionales', icon: 'project',
    description: 'Proyectos de inversión con su ficha pública y el registro de sus avances.',
    tabs: [
      { key: 'proyectos', label: 'Proyectos', perms: ['projects.edit', 'entities.publish'] },
      { key: 'avances', label: 'Avances', perms: ['projects.edit'] },
    ],
  },
  publicaciones: {
    title: 'Publicaciones y listados', eyebrow: 'Fichas institucionales', icon: 'book',
    description: 'Publicaciones del IDEAD y otros listados que se muestran en el portal (grupos de investigación, semilleros, etc.).',
    tabs: [
      { key: 'publicaciones', label: 'Publicaciones', perms: ['lists.edit', 'entities.publish'] },
      { key: 'listados', label: 'Otros listados', perms: ['lists.edit', 'entities.publish'] },
    ],
  },
  'caja-menor': {
    title: 'Caja menor', eyebrow: 'Documentos y caja menor', icon: 'money',
    description: 'Presupuesto de la vigencia y registro de gastos con sus facturas y soportes. No se publica.',
    tabs: [
      { key: 'caja-menor-gastos', label: 'Gastos', perms: ['petty_cash.view'] },
      { key: 'caja-menor', label: 'Presupuestos', perms: ['petty_cash.view'] },
    ],
  },
  referencias: {
    title: 'Listas de referencia', eyebrow: 'Administración', icon: 'filter',
    description: 'Valores que usan los formularios y las plantillas: semestres, dependencias, municipios, niveles… Se configuran una vez.',
    tabs: [
      { key: 'periodos', label: 'Períodos', perms: ['catalogs.manage'] },
      { key: 'dependencias', label: 'Dependencias', perms: ['catalogs.manage'] },
      { key: 'fuentes', label: 'Fuentes', perms: ['catalogs.manage'] },
      { key: 'municipios', label: 'Municipios', perms: ['catalogs.manage'] },
      { key: 'departamentos', label: 'Departamentos', perms: ['catalogs.manage'] },
      { key: 'niveles', label: 'Niveles de formación', perms: ['catalogs.manage'] },
      { key: 'areas', label: 'Áreas de conocimiento', perms: ['catalogs.manage'] },
      { key: 'clasificadores', label: 'Variables para desagregar', perms: ['catalogs.manage'] },
      { key: 'categorias-clasificador', label: 'Valores de las variables', perms: ['catalogs.manage'] },
      { key: 'categorias-documentales', label: 'Tipos de documento', perms: ['catalogs.manage'] },
    ],
  },
};

export function HubPage() {
  const { hub = '' } = useParams();
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const cfg = HUBS[hub];
  if (!cfg) return <p>Página no encontrada.</p>;
  const tabs = cfg.tabs.filter((t) => can(...t.perms) && RESOURCES[t.key]);
  if (!tabs.length) return <p>No tiene permisos para esta sección.</p>;
  const active = tabs.find((t) => t.key === params.get('tab')) ?? tabs[0];
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={cfg.title} description={cfg.description} icon={cfg.icon} eyebrow={cfg.eyebrow} />
      {tabs.length > 1 && (
        <nav role="tablist" aria-label="Secciones" className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1.5 shadow-sm">
          {tabs.map((t) => (
            <button key={t.key} role="tab" aria-selected={t.key === active.key} onClick={() => setParams({ tab: t.key })}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${t.key === active.key ? 'bg-ut-red text-white shadow' : 'text-[#4a4f55] hover:bg-ut-red-50 hover:text-ut-red'}`}>
              {RESOURCES[t.key].icon && <Icon name={RESOURCES[t.key].icon!} />} {t.label}
            </button>
          ))}
        </nav>
      )}
      <ResourcePage key={active.key} cfg={RESOURCES[active.key]} embedded hideDescription={tabs.length === 1} />
    </div>
  );
}

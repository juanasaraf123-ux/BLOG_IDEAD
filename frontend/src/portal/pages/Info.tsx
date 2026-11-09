import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { publicGet } from '../../shared/api';
import { fmtBytes, fmtDate, label } from '../../shared/format';
import { Icon } from '../../shared/icons';
import type { HomeData, IndicatorMeta } from '../../shared/types';
import { Badge, ErrorBox, Pending, SectionTitle, Spinner, useAsync, useDocumentTitle } from '../../shared/ui';
import { DataTable } from '../../shared/DataTable';
import { PageShell } from '../components/Layout';
import { AgreementsTable } from '../components/Widgets';
import { useSite } from '../site';
import NotFound from './NotFound';

type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function Transparency() {
  useDocumentTitle('Transparencia');
  const { data, error, loading } = useAsync(() => publicGet<{ modules: { number: number; slug: string; name: string; indicators: IndicatorMeta[] }[]; documents: Any[] }>('transparency'), []);
  const rows = data?.modules.flatMap((m) => m.indicators.map((i) => ({ ...i, module: `${m.number}. ${m.name}`, slug: m.slug }))) ?? [];
  return (
    <PageShell title="Transparencia" intro="Catálogo completo de indicadores con su fuente institucional, dependencia responsable, estado metodológico y fecha de última publicación, además de documentos y convenios públicos.">
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {data && (
        <div className="space-y-12">
          <section>
            <SectionTitle>Catálogo de indicadores ({rows.length})</SectionTitle>
            <DataTable rows={rows} pageSize={20} caption="Catálogo de indicadores" csvName="catalogo_indicadores" columns={[
              { key: 'code', label: 'Código', render: (r: Any) => <Link to={`/estadisticas/${r.slug}#${r.code}`} className="font-bold text-ut-red hover:underline">{r.code}</Link> },
              { key: 'name', label: 'Indicador' }, { key: 'module', label: 'Módulo' }, { key: 'source', label: 'Fuente' },
              { key: 'responsible', label: 'Responsable', value: (r: Any) => r.responsible ?? 'Pendiente' },
              { key: 'methodology_status', label: 'Metodología', value: (r: Any) => label(r.methodology_status), render: (r: Any) => <Badge tone={r.methodology_status === 'validada' ? 'green' : 'amber'}>{label(r.methodology_status)}</Badge> },
              { key: 'publication_level', label: 'Publicación', value: (r: Any) => label(r.publication_level) },
              { key: 'last_published_at', label: 'Última publicación', render: (r: Any) => (r.last_published_at ? fmtDate(r.last_published_at, { dateStyle: 'medium' }) : 'Pendiente') },
            ]} />
          </section>
          <section>
            <SectionTitle>Documentos públicos</SectionTitle>
            {data.documents.length === 0 ? <Pending text="No hay documentos públicos." /> : (
              <ul className="grid gap-3 md:grid-cols-2">
                {data.documents.map((d) => (
                  <li key={d.id} id={`doc-${d.id}`} className="flex items-start gap-3 rounded-xl border border-line p-4">
                    <Icon name="file" className="mt-1 text-2xl text-ut-red" />
                    <div className="min-w-0 flex-1"><p className="font-bold">{d.title}</p><p className="text-sm text-muted">{d.category} · {fmtDate(d.date)} · v{d.version} · {fmtBytes(d.size_bytes)}</p></div>
                    <a href={`/api/public/v1/documents/${d.id}/download`} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-ut-red"><Icon name="download" /> Descargar</a>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section><SectionTitle>Convenios institucionales públicos</SectionTitle><AgreementsTable /></section>
        </div>
      )}
    </PageShell>
  );
}

export function About() {
  useDocumentTitle('Sobre IDEAD');
  const page = useAsync(() => publicGet<Any>('pages/sobre-idead'), []);
  const home = useAsync(() => publicGet<HomeData>('home'), []);
  return (
    <PageShell title="Sobre el IDEAD">
      {page.loading && <Spinner />}
      {page.data ? <div className="prose-idead max-w-4xl" dangerouslySetInnerHTML={{ __html: page.data.body ?? '' }} /> : !page.loading && <Pending />}
      <section className="mt-12">
        <SectionTitle>Equipo IDEAD</SectionTitle>
        <ul className="grid gap-4 md:grid-cols-3">
          {home.data?.team.map((t) => (
            <li key={t.id} className="rounded-2xl border border-line p-5">
              <span className="grid h-12 w-16 place-items-center rounded-2xl bg-ut-red text-2xl text-white"><Icon name="people" /></span>
              <h3 className="mt-3 text-lg font-bold">{t.name}</h3>
              {t.description && <p className="text-sm text-muted">{t.description}</p>}
              {t.email && <p className="mt-2 text-sm"><a href={`mailto:${t.email}`} className="text-ut-red underline">{t.email}</a></p>}
              {t.phone && <p className="text-sm">{t.phone}</p>}
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}

export function CmsPage() {
  const { slug } = useParams();
  const { data, error, loading, status } = useAsync(() => publicGet<Any>(`pages/${slug}`), [slug]);
  useDocumentTitle(data?.title ?? '');
  if (status === 404) return <NotFound />;
  return (
    <PageShell title={data?.title ?? '…'}>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {data && <><div className="prose-idead max-w-4xl" dangerouslySetInnerHTML={{ __html: data.body ?? '' }} /><p className="mt-6 text-sm text-muted">Actualizado: {fmtDate(data.updated_at)}</p></>}
    </PageShell>
  );
}

const TYPES: Record<string, string> = { programas: 'Programas', cat: 'CAT', noticias: 'Noticias', actividades: 'Actividades', proyectos: 'Proyectos', indicadores: 'Indicadores', publicaciones: 'Publicaciones y documentos' };

export function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const type = params.get('type') ?? '';
  const [input, setInput] = useState(q);
  const nav = useNavigate();
  useDocumentTitle(q ? `Búsqueda: ${q}` : 'Buscar');
  const { data, error, loading } = useAsync(() => (q.length >= 2 ? publicGet<{ results: Any[] }>('search', { q, type }) : Promise.resolve({ results: [] })), [q, type]);
  const submit = (e: FormEvent) => { e.preventDefault(); nav(`/buscar?q=${encodeURIComponent(input.trim())}${type ? `&type=${type}` : ''}`); };
  const grouped = (data?.results ?? []).reduce<Record<string, Any[]>>((m, r) => ((m[r.type] ??= []).push(r), m), {});
  return (
    <PageShell title="Buscar en el portal">
      <form role="search" onSubmit={submit} className="flex max-w-2xl gap-2">
        <label htmlFor="q" className="sr-only">Términos de búsqueda</label>
        <input id="q" value={input} onChange={(e) => setInput(e.target.value)} minLength={2} placeholder="Programa, CAT, indicador, noticia…" className="flex-1 rounded-lg border border-line px-4 py-2.5 text-lg focus:border-ut-red focus:outline-none" />
        <button className="rounded-lg bg-ut-red px-5 font-semibold text-white hover:bg-ut-red-dark">Buscar</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
        {[['', 'Todo'], ...Object.entries(TYPES)].map(([k, l]) => (
          <button key={k} aria-pressed={type === k} onClick={() => { const p = new URLSearchParams(params); if (k) p.set('type', k); else p.delete('type'); setParams(p); }}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${type === k ? 'bg-ut-red text-white' : 'border border-line'}`}>{l}</button>
        ))}
      </div>
      <div className="mt-8" aria-live="polite">
        {loading && <Spinner />}
        {error && <ErrorBox message={error} />}
        {q.length >= 2 && data && data.results.length === 0 && <p className="text-muted">No se encontraron resultados para «{q}».</p>}
        {Object.entries(grouped).map(([t, items]) => (
          <section key={t} className="mb-8">
            <h2 className="mb-3 text-lg font-extrabold text-ut-red">{TYPES[t]} ({items.length})</h2>
            <ul className="space-y-3">
              {items.map((r, i) => (
                <li key={i} className="rounded-xl border border-line p-4">
                  {r.url.startsWith('http') ? <a href={r.url} className="font-bold text-ink hover:text-ut-red" rel="noopener noreferrer">{r.title}</a> : <Link to={r.url} className="font-bold text-ink hover:text-ut-red">{r.title}</Link>}
                  {r.excerpt && <p className="text-sm text-muted">{r.excerpt}</p>}
                  {r.date && <p className="text-xs text-muted">{fmtDate(r.date)}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

export function SiteMap() {
  useDocumentTitle('Mapa del sitio');
  const site = useSite();
  const links = [['/', 'Inicio'], ['/cat', 'Centros de Atención Tutorial'], ['/programas', 'Oferta académica'], ['/actividades', 'Actividades'], ['/proyectos', 'Proyectos'], ['/noticias', 'Noticias'], ['/multimedia', 'Multimedia'], ['/estadisticas', 'Estadísticas'], ['/transparencia', 'Transparencia'], ['/sobre-idead', 'Sobre IDEAD'], ['/buscar', 'Buscar']];
  return (
    <PageShell title="Mapa del sitio">
      <div className="grid gap-8 md:grid-cols-3">
        <ul className="space-y-2">{links.map(([to, l]) => <li key={to}><Link to={to} className="text-ut-red hover:underline">{l}</Link></li>)}</ul>
        <div><h2 className="mb-2 font-bold">Estadísticas</h2><ul className="space-y-2">{site?.modules.map((m) => <li key={m.slug}><Link to={`/estadisticas/${m.slug}`} className="text-ut-red hover:underline">{m.number}. {m.name}</Link></li>)}</ul></div>
        <div><h2 className="mb-2 font-bold">Páginas</h2><ul className="space-y-2">{site?.pages.map((p) => <li key={p.slug}><Link to={`/pagina/${p.slug}`} className="text-ut-red hover:underline">{p.title}</Link></li>)}</ul></div>
      </div>
    </PageShell>
  );
}

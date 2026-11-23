import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { admin, errorText } from '../../shared/api';
import { fmtBytes, fmtDateTime, fmtNumber, label } from '../../shared/format';
import { BarChart, Donut, LineChart, ModuleBars } from '../components/DashCharts';
import { ColombiaMap } from '../../portal/components/ColombiaMap';
import { Icon } from '../../shared/icons';
import { Badge, ErrorBox, Spinner, useAsync } from '../../shared/ui';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../auth';
import { Button, FieldInput, FilePicker, inputCls, Notice, useOptions } from '../components/Form';
import { PASSWORD_HELP } from './AuthPages';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const CONF_TONE: Record<string, 'green' | 'gray' | 'amber' | 'red'> = { publico: 'green', interno: 'gray', restringido: 'amber', financiero: 'red' };

// ------------------------------------------------------------------ Tablero

const PENDING_LABELS: Record<string, [string, string, string]> = {
  lotes_por_revisar: ['Cargas de indicadores por revisar', '/cargas', 'search'], lotes_por_publicar: ['Cargas aprobadas por publicar', '/cargas', 'upload'],
  mis_lotes_devueltos: ['Mis cargas devueltas para corregir', '/cargas', 'alert'], mis_borradores: ['Mis cargas en borrador', '/cargas', 'file'],
  contenidos_en_revision: ['Contenidos en revisión', '/r/noticias', 'book'],
  solicitudes_abiertas: ['Solicitudes para mi dependencia', '/r/solicitudes', 'mail'],
  solicitudes_vencidas: ['Solicitudes vencidas', '/r/solicitudes', 'clock'],
};

/** Accesos rápidos (solo los que el rol puede usar). */
const QUICK: { to: string; label: string; text: string; icon: string; tone: string; perms: string[] }[] = [
  { to: '/r/noticias', label: 'Gestionar Noticias', text: 'Publicar novedades', icon: 'book', tone: 'from-ut-red to-ut-red-dark', perms: ['content.create', 'content.publish'] },
  { to: '/r/actividades', label: 'Crear Actividad', text: 'Agenda y calendario', icon: 'calendar', tone: 'from-idead-teal to-idead-teal-dark', perms: ['content.create', 'content.publish'] },
  { to: '/informes', label: 'Generar Reportes', text: 'PDF y Excel', icon: 'download', tone: 'from-idead-blue to-[#1d4f88]', perms: ['reports.internal.export', 'petty_cash.view'] },
  { to: '/h/cat', label: 'CAT y Mapas', text: 'Fichas territoriales', icon: 'pin', tone: 'from-ut-red to-ut-red-dark', perms: ['cats.edit', 'entities.publish', 'programs.edit'] },
  { to: '/cargas', label: 'Cargar Indicadores', text: 'Datos por período', icon: 'upload', tone: 'from-idead-blue to-[#1d4f88]', perms: ['indicators.submit', 'indicators.review'] },
  { to: '/bases', label: 'Bases de Datos', text: 'Estudiantes, docentes…', icon: 'table', tone: 'from-idead-teal to-idead-teal-dark', perms: ['records.view', 'records.import'] },
  { to: '/documentos', label: 'Documentos', text: 'Actas y contratos', icon: 'file', tone: 'from-ut-red to-ut-red-dark', perms: ['documents.view.internal', 'documents.upload'] },
  { to: '/h/caja-menor', label: 'Caja Menor', text: 'Gastos y facturas', icon: 'money', tone: 'from-idead-teal to-idead-teal-dark', perms: ['petty_cash.view'] },
  { to: '/usuarios', label: 'Usuarios', text: 'Cuentas y roles', icon: 'user', tone: 'from-idead-blue to-[#1d4f88]', perms: ['users.view', 'users.manage'] },
];

/** Tarjetas de cifras generales: cada una con su color suave distintivo. */
const KPI_CARDS: { key: string; label: string; icon: string; tone: string; glow: string; to?: string }[] = [
  { key: 'cats', label: 'CAT activos', icon: 'building', tone: 'bg-ut-red-50 text-ut-red', glow: 'from-ut-red/10', to: '/h/cat' },
  { key: 'students', label: 'Estudiantes', icon: 'students', tone: 'bg-idead-teal-50 text-idead-teal-dark', glow: 'from-idead-teal/12', to: '/indicadores' },
  { key: 'teachers', label: 'Docentes', icon: 'teacher', tone: 'bg-idead-blue-50 text-idead-blue', glow: 'from-idead-blue/10', to: '/indicadores' },
  { key: 'municipalities', label: 'Municipios', icon: 'pin', tone: 'bg-[#fdf1e4] text-[#a35a00]', glow: 'from-[#f0a040]/14', to: '/indicadores' },
  { key: 'programs', label: 'Programas', icon: 'graduation', tone: 'bg-ut-red-50 text-ut-red', glow: 'from-ut-red/10', to: '/r/programas' },
  { key: 'events', label: 'Actividades', icon: 'calendar', tone: 'bg-idead-teal-50 text-idead-teal-dark', glow: 'from-idead-teal/12', to: '/r/actividades' },
  { key: 'projects', label: 'Proyectos', icon: 'project', tone: 'bg-idead-blue-50 text-idead-blue', glow: 'from-idead-blue/10', to: '/h/proyectos' },
];

/** Estados de las cargas de indicadores, con color e icono (nunca solo color). */
const SUBMISSION_STATES: { key: string; label: string; text: string; icon: string; tone: string }[] = [
  { key: 'borrador', label: 'En borrador', text: 'Cargas sin enviar', icon: 'file', tone: 'border-[#ddd5cd] bg-warm text-[#55504b]' },
  { key: 'enviado', label: 'Por revisar', text: 'Enviadas por las oficinas', icon: 'search', tone: 'border-amber-300/60 bg-amber-50 text-amber-900' },
  { key: 'devuelto', label: 'Devueltas', text: 'Requieren corrección', icon: 'alert', tone: 'border-ut-red/30 bg-ut-red-50 text-ut-red-dark' },
  { key: 'aprobado', label: 'Por publicar', text: 'Aprobadas, sin publicar', icon: 'upload', tone: 'border-idead-blue/25 bg-idead-blue-50 text-[#1d4f88]' },
  { key: 'publicado', label: 'Publicadas', text: 'Visibles en el portal', icon: 'check', tone: 'border-idead-teal/30 bg-idead-teal-50 text-idead-teal-dark' },
];

const ACTIVITY_ICON: Record<string, [string, string]> = {
  News: ['book', 'bg-ut-red-50 text-ut-red'], Event: ['calendar', 'bg-idead-teal-50 text-idead-teal-dark'], MediaItem: ['image', 'bg-idead-blue-50 text-idead-blue'],
  Page: ['file', 'bg-warm text-ink'], Cat: ['building', 'bg-ut-red-50 text-ut-red'], Program: ['graduation', 'bg-idead-blue-50 text-idead-blue'],
  Project: ['project', 'bg-idead-teal-50 text-idead-teal-dark'], HeroSlide: ['home', 'bg-warm text-ink'], DataSubmission: ['upload', 'bg-idead-blue-50 text-idead-blue'], Document: ['file', 'bg-warm text-ink'],
};

function timeAgo(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'hace un momento';
  if (m < 60) return `hace ${m} min`;
  if (m < 60 * 24) return `hace ${Math.round(m / 60)} h`;
  if (m < 60 * 24 * 7) return `hace ${Math.round(m / 1440)} d`;
  return fmtDateTime(iso);
}

function Card({ title, subtitle, children, className = '', action, icon }: { title: string; subtitle?: ReactNode; children: ReactNode; className?: string; action?: ReactNode; icon?: string }) {
  return (
    <section className={`admin-card p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start gap-3">
        {icon && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ut-red-50 text-lg text-ut-red"><Icon name={icon} /></span>}
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.05rem] font-extrabold text-ink">{title}</h2>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Dashboard() {
  const { me, can } = useAuth();
  const { data, loading } = useAsync(() => admin.get<Row>('dashboard'), []);
  const quick = QUICK.filter((q) => can(...q.perms)).slice(0, 8);
  const first = (me?.user.name ?? '').split(/\s+/)[0];
  const today = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const charts = data?.charts;
  const territory = (charts?.territory ?? {}) as Record<string, { name: string; value: number }>;
  const subs = (charts?.submissions ?? {}) as Record<string, number>;
  const demo = charts?.is_demo ? <Badge tone="amber">DEMO</Badge> : null;

  const recent = data?.recent && (
    <Card title="Actividad Reciente" icon="history"
      action={can('audit.view') ? <Link to="/auditoria" className="inline-flex items-center gap-1 text-sm font-semibold text-ut-red underline-offset-2 hover:underline">Ver todas <Icon name="arrowRight" /></Link> : undefined}>
      {data.recent.length === 0 ? <p className="text-sm text-muted">Sin cambios registrados.</p> : (
        <ol className="space-y-1">
          {data.recent.map((r: Row) => {
            const [ic, tone] = ACTIVITY_ICON[r.entity] ?? ['info', 'bg-warm text-ink'];
            return (
              <li key={r.id} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-ivory">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg ${tone}`}><Icon name={ic} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.85rem] font-medium text-ink" title={r.title}>{r.type} {r.action === 'creó' ? 'creada' : r.action === 'actualizó' ? 'actualizada' : 'eliminada'}: {r.title}</p>
                  <p className="truncate text-xs text-muted">{r.user}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-[0.7rem] text-muted">{timeAgo(r.at)}<span className="h-1.5 w-1.5 rounded-full bg-idead-blue" aria-hidden /></span>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
  const quickCard = quick.length > 0 && (
    <Card title="Accesos Rápidos" icon="home">
      <div className="grid grid-cols-4 gap-2">
        {quick.map((q) => (
          <Link key={q.to} to={q.to} title={q.text} className="admin-card-hover group flex flex-col items-center gap-1.5 rounded-2xl border border-[#ece4dc] bg-white px-1 py-3 text-center">
            <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${q.tone} text-xl text-white shadow-md transition group-hover:scale-110`}><Icon name={q.icon} /></span>
            <span className="text-[0.68rem] leading-tight font-semibold text-ink group-hover:text-ut-red">{q.label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      {/* Banner de bienvenida del boceto: edificio de la UT, degradado rosado-rojo, ondas y lema */}
      <section className="relative isolate overflow-hidden rounded-[1.375rem] bg-gradient-to-r from-white via-[#fbe3e4] to-[#f5b9bd] shadow-[0_18px_40px_-22px_rgb(149_21_29/0.6)]">
        <img src="/img/fondos/edificio-ut.webp" alt="Edificio de la Universidad del Tolima" className="absolute inset-y-0 left-0 -z-10 hidden h-full w-[24%] object-cover [mask-image:linear-gradient(to_right,black_75%,transparent)] md:block" />
        <svg className="absolute inset-y-0 right-0 -z-10 h-full w-[55%]" viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden>
          <path d="M180 200 C 260 120, 330 60, 470 0 H600 V200Z" fill="#c91520" fillOpacity=".10" />
          <path d="M250 200 C 330 130, 400 70, 540 0 H600 V200Z" fill="#c91520" fillOpacity=".55" />
          <path d="M330 200 C 400 140, 470 80, 600 30 V200Z" fill="#95151d" fillOpacity=".75" />
          <path d="M150 200 C 240 130, 330 60, 480 0" stroke="#fff" strokeOpacity=".7" strokeWidth="2" fill="none" />
          <path d="M300 200 C 380 140, 450 80, 600 20" stroke="#20a99c" strokeOpacity=".6" strokeWidth="2" fill="none" />
        </svg>
        <div className="flex flex-wrap items-center gap-6 px-6 py-7 md:pl-[26%] lg:pr-8">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted first-letter:uppercase">{today}</p>
            <h1 className="mt-0.5 text-[1.75rem] font-extrabold text-ink md:text-[2rem]">¡Te damos la bienvenida, {first}!</h1>
            <p className="text-[1.05rem] text-ink">Gestiona y administra el contenido del portal IDEAD</p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-ut-red-dark shadow-sm ring-1 ring-ut-red/15"><Icon name="user" /> {me?.user.roles.map((r) => r.name).join(' · ') || 'Sin rol asignado'}</p>
          </div>
          <div className="hidden rounded-2xl bg-white/85 px-5 py-3 text-right shadow-lg backdrop-blur lg:block" aria-hidden>
            <p className="font-display text-[2rem] leading-none font-extrabold text-ut-red">Conocimiento</p>
            <p className="font-serif text-[1.6rem] leading-tight text-ink italic">que <span className="text-ut-red">Transforma</span></p>
          </div>
        </div>
      </section>

      {!me?.user.mfa_enabled && <Notice kind="info">Recomendación de seguridad: active la verificación en dos pasos en <Link to="/cuenta" className="font-semibold underline">Mi cuenta</Link>.</Notice>}

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_23rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-5">
          {loading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((k) => <div key={k} className="skeleton h-24" />)}</div>}
          {data?.kpis && (
            <section aria-label="Indicadores generales" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {KPI_CARDS.map((k) => {
                const v = (data.kpis[k.key] ?? { value: null, note: 'Sin datos' }) as Row;
                const body = (
                  <>
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-[1.5rem] ${k.tone}`}><Icon name={k.icon} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-display text-[1.55rem] leading-none font-extrabold text-ink tabular-nums">{v.value === null || v.value === undefined ? '—' : fmtNumber(v.value, 0)}</span>
                        {typeof v.change === 'number' && (
                          <span className={`text-xs font-bold ${v.change >= 0 ? 'text-[#14935a]' : 'text-ut-red'}`} title={`Variación frente a ${v.versus}`}>{v.change >= 0 ? '↑' : '↓'} {Math.abs(v.change).toLocaleString('es-CO')}%</span>
                        )}
                      </span>
                      <span className="mt-1 block truncate text-sm text-muted" title={k.label}>{k.label}</span>
                      <span className="block truncate text-[0.7rem] text-muted/80" title={v.note}>{v.note}{v.is_demo ? ' · DEMO' : ''}</span>
                    </span>
                  </>
                );
                const cls = 'admin-card flex items-center gap-3 p-4';
                return k.to ? <Link key={k.key} to={k.to} className={`${cls} admin-card-hover`}>{body}</Link> : <div key={k.key} className={cls}>{body}</div>;
              })}
            </section>
          )}

          {charts && (
            <>
              <div className="grid gap-5 lg:grid-cols-2">
                <Card title="Estudiantes matriculados" subtitle={<>Últimos {charts.enrollment.length} semestres · M02-I01 {demo}</>} icon="students">
                  <LineChart data={charts.enrollment} label="Estudiantes matriculados por semestre" />
                </Card>
                <Card title="Distribución por CAT" subtitle={<>Estudiantes · período {charts.period ?? '—'}</>} icon="building">
                  <Donut data={charts.by_cat} center="estudiantes" />
                </Card>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <Card title="Estudiantes nuevos" subtitle={<>Comparación entre períodos · M02-I04 {demo}</>} icon="chart">
                  <BarChart data={charts.new_students} unit="estudiantes nuevos" />
                </Card>
                <Card title="Presencia territorial" subtitle={`Estudiantes por departamento del CAT · ${charts.period ?? ''}`} icon="pin">
                  <div className="grid items-center gap-3 sm:grid-cols-2">
                    <ColombiaMap title="Estudiantes del IDEAD por departamento" values={Object.fromEntries(Object.entries(territory).map(([c, t]) => [c, t.value]))} formatValue={(v) => `${fmtNumber(v, 0)} estudiantes`} className="[&_figcaption]:hidden" />
                    <ul className="space-y-1.5 text-sm">
                      {Object.entries(territory).sort((x, y) => y[1].value - x[1].value).map(([c, t]) => (
                        <li key={c} className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate">{t.name}</span><span className="font-semibold tabular-nums">{fmtNumber(t.value, 0)}</span></li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>
              <Card title="Comportamiento de los indicadores" subtitle="Por módulo del portal" icon="chart">
                <ModuleBars modules={charts.modules} />
              </Card>
            </>
          )}
        </div>

        <aside className="min-w-0 space-y-5" aria-label="Actividad y accesos">
          {recent}
          {quickCard}
          {charts && (
            <Card title="Estado de las cargas" subtitle="Indicadores enviados por las oficinas" icon="upload"
              action={<Link to="/cargas" className="text-sm font-semibold text-ut-red hover:underline">Ver</Link>}>
              <ul className="space-y-2">
                {SUBMISSION_STATES.map((st) => (
                  <li key={st.key}>
                    <Link to="/cargas" className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition hover:shadow-sm ${st.tone}`}>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/80 text-base"><Icon name={st.icon} /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{st.label}</span><span className="block truncate text-[0.7rem] opacity-80">{st.text}</span></span>
                      <span className="font-display text-xl font-extrabold tabular-nums">{subs[st.key] ?? 0}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {data && Object.keys(data.pending).length > 0 && (
            <Card title="Mis pendientes" icon="clock">
              <ul className="space-y-1.5">
                {Object.entries(data.pending as Record<string, number>).map(([k, v]) => (
                  <li key={k}>
                    <Link to={PENDING_LABELS[k]?.[1] ?? '/'} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-ivory">
                      <span className={`grid h-8 min-w-8 place-items-center rounded-full px-1.5 text-sm font-bold ${v > 0 ? 'bg-ut-red text-white' : 'bg-idead-teal-50 text-idead-teal-dark'}`}>{v}</span>
                      <span className="min-w-0 flex-1 text-sm">{PENDING_LABELS[k]?.[0] ?? k}</span>
                      {v === 0 && <span className="text-xs text-idead-teal-dark">Al día</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {data?.indicators && (
            <section className="admin-card p-4">
              <div className="flex items-end justify-between"><p className="text-sm font-semibold text-ink">Indicadores con datos publicados</p><p className="font-display text-lg font-extrabold text-ink">{data.indicators.con_datos_publicados}<span className="text-sm font-semibold text-muted"> / {data.indicators.total}</span></p></div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#f3eee9]"><div className="h-full rounded-full bg-gradient-to-r from-idead-teal to-idead-teal-dark" style={{ width: `${Math.round((data.indicators.con_datos_publicados / data.indicators.total) * 100)}%` }} /></div>
              <p className="mt-1.5 text-xs text-muted">{data.indicators.metodologia_validada} con metodología validada</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Documentos

export function Documents() {
  const { can } = useAuth();
  const [filters, setFilters] = useState<Row>({ q: '', confidentiality: '', category_id: '', status: '' });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<number | 'new' | null>(null);
  const cats = useOptions('document-categories');
  const { data, error, loading, reload } = useAsync(() => admin.get<Row>('documents', { ...filters, page }), [JSON.stringify(filters), page]);
  return (
    <div>
      <PageHeader title="Documentos" icon="file" eyebrow="Documentos y caja menor" description="Archivos en almacenamiento privado, con versiones y descargas registradas. Solo ve los niveles de confidencialidad autorizados para su rol."
        actions={can('documents.upload') ? <Button variant="primary" onClick={() => setOpen('new')}><Icon name="upload" /> Cargar documento</Button> : undefined} />
      <div className="mb-3 flex flex-wrap gap-3">
        <label className="text-xs font-bold text-muted uppercase">Buscar<input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className={inputCls} /></label>
        <label className="text-xs font-bold text-muted uppercase">Reserva<select value={filters.confidentiality} onChange={(e) => setFilters({ ...filters, confidentiality: e.target.value })} className={inputCls}><option value="">Todas</option>{['publico', 'interno', 'restringido', 'financiero'].map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
        <label className="text-xs font-bold text-muted uppercase">Categoría<select value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })} className={inputCls}><option value="">Todas</option>{cats.map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>)}</select></label>
        <label className="text-xs font-bold text-muted uppercase">Estado<select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className={inputCls}><option value="">Todos</option>{['borrador', 'vigente', 'archivado'].map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
      </div>
      {error && <ErrorBox message={error} />}
      {loading && <Spinner />}
      <div className="overflow-x-auto admin-card">
        <table className="admin-table w-full text-left text-sm">
          <thead className="text-[0.7rem] uppercase"><tr><th className="px-3 py-2">Documento</th><th className="px-3 py-2">Categoría</th><th className="px-3 py-2">Reserva</th><th className="px-3 py-2">Dependencia</th><th className="px-3 py-2">Versión</th><th className="px-3 py-2">Cargó</th><th className="px-3 py-2">Actualizado</th><th /></tr></thead>
          <tbody className="divide-y divide-line">
            {data?.data.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-muted">Sin documentos visibles.</td></tr>}
            {data?.data.map((d: Row) => (
              <tr key={d.id}><td className="px-3 py-2 font-semibold">{d.title}</td><td className="px-3 py-2">{d.category?.name}</td><td className="px-3 py-2"><Badge tone={CONF_TONE[d.confidentiality]}>{label(d.confidentiality)}</Badge></td><td className="px-3 py-2">{d.dependency?.code ?? '—'}</td><td className="px-3 py-2">v{d.current_version}</td><td className="px-3 py-2">{d.creator?.name}</td><td className="px-3 py-2">{fmtDateTime(d.updated_at)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap"><a href={admin.url(`documents/${d.id}/download`)} className="mr-3 text-ut-red hover:underline">Descargar</a><button onClick={() => setOpen(d.id)} className="font-semibold text-ut-red hover:underline">Abrir</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.last_page > 1 && <div className="mt-3 flex justify-end gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button><Button variant="secondary" disabled={page >= data.last_page} onClick={() => setPage(page + 1)}>Siguiente</Button></div>}
      {open !== null && <DocumentEditor id={open === 'new' ? null : open} onClose={() => setOpen(null)} onSaved={reload} />}
    </div>
  );
}

function DocumentEditor({ id, onClose, onSaved }: { id: number | null; onClose: () => void; onSaved: () => void }) {
  const { can } = useAuth();
  const [doc, setDoc] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>({ title: '', description: '', category_id: null, dependency_id: null, confidentiality: null, status: 'vigente', related_type: null, related_id: null });
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ k: 'ok' | 'error'; t: string } | null>(null);
  const load = async () => { if (!id) return; const d = await admin.get<Row>(`documents/${id}`); setDoc(d); setForm({ ...d }); };
  useEffect(() => { load().catch((e) => setMsg({ k: 'error', t: errorText(e) })); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: string) => (v: unknown) => setForm({ ...form, [k]: v });
  const save = async () => {
    setMsg(null);
    try {
      if (id) { await admin.put(`documents/${id}`, form); setMsg({ k: 'ok', t: 'Metadatos guardados.' }); await load(); }
      else {
        if (!file) throw new Error('Seleccione un archivo.');
        const extra = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== null && v !== '').map(([k, v]) => [k, String(v)]));
        await admin.upload('documents', file, extra); onClose();
      }
      onSaved();
    } catch (e) { setMsg({ k: 'error', t: errorText(e) }); }
  };
  const version = async () => {
    if (!file) return setMsg({ k: 'error', t: 'Seleccione el archivo de la nueva versión.' });
    try { await admin.upload(`documents/${id}/versions`, file, { change_note: note }); setFile(null); setNote(''); setMsg({ k: 'ok', t: 'Nueva versión cargada.' }); await load(); onSaved(); } catch (e) { setMsg({ k: 'error', t: errorText(e) }); }
  };
  return (
    <div className="fade-in fixed inset-0 z-50 flex justify-end bg-[#2b1416]/40 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Documento">
      <div className="admin-ui flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-ivory p-5 shadow-2xl sm:rounded-l-[1.375rem]">
        <div className="mb-4 flex items-center"><h2 className="text-lg font-bold">{id ? doc?.title : 'Cargar documento'}</h2><button onClick={onClose} autoFocus className="ml-auto p-2 text-xl" aria-label="Cerrar"><Icon name="close" /></button></div>
        {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><FieldInput def={{ name: 'title', label: 'Título', type: 'text', required: true }} value={form.title} onChange={set('title')} /></div>
          <FieldInput def={{ name: 'category_id', label: 'Categoría', type: 'relation', endpoint: 'document-categories', required: true }} value={form.category_id} onChange={set('category_id')} />
          <FieldInput def={{ name: 'confidentiality', label: 'Reserva (quién puede verlo)', type: 'select', help: id ? undefined : 'Si se deja vacío se usa la del tipo de documento.', options: ['publico', 'interno', 'restringido', 'financiero'].map((v) => ({ value: v, label: label(v) })) }} value={form.confidentiality} onChange={set('confidentiality')} />
          <FieldInput def={{ name: 'dependency_id', label: 'Dependencia', type: 'relation', endpoint: 'dependencies', optionLabel: (o) => `${o.code} — ${o.name}` }} value={form.dependency_id} onChange={set('dependency_id')} />
          <FieldInput def={{ name: 'status', label: 'Estado', type: 'select', options: ['borrador', 'vigente', 'archivado'].map((v) => ({ value: v, label: label(v) })) }} value={form.status} onChange={set('status')} />
          <FieldInput def={{ name: 'related_type', label: 'Asociado a', type: 'select', options: [['project', 'Proyecto'], ['agreement', 'Convenio'], ['cat', 'CAT']].map(([value, l]) => ({ value, label: l })) }} value={form.related_type} onChange={(v) => { set('related_type')(v); set('related_id')(null); }} />
          {form.related_type && ({ project: 'projects', agreement: 'agreements', cat: 'cats' } as Record<string, string>)[form.related_type] && (
            <FieldInput key={form.related_type} def={{ name: 'related_id', label: form.related_type === 'project' ? '¿Cuál proyecto?' : form.related_type === 'agreement' ? '¿Cuál convenio?' : '¿Cuál CAT?', type: 'relation', endpoint: ({ project: 'projects', agreement: 'agreements', cat: 'cats' } as Record<string, string>)[form.related_type], optionLabel: (o) => String(o.name ?? ([o.number, o.counterpart].filter(Boolean).join(' — ') || o.id)) }} value={form.related_id} onChange={set('related_id')} />
          )}
          <div className="md:col-span-2"><FieldInput def={{ name: 'description', label: 'Descripción', type: 'textarea' }} value={form.description} onChange={set('description')} /></div>
          {!id && <div className="text-sm font-semibold md:col-span-2">Archivo (PDF, Word, Excel, PowerPoint, CSV, JPG o PNG)<FilePicker file={file} onPick={setFile} /></div>}
        </div>
        {(can('documents.upload') || can('documents.edit')) && <Button className="mt-4 self-start" onClick={save}><Icon name="check" /> {id ? 'Guardar cambios' : 'Subir documento'}</Button>}
        {id && doc && (
          <section className="mt-6">
            <h3 className="mb-2 font-bold">Versiones</h3>
            <ul className="space-y-1 text-sm">{doc.versions.map((v: Row) => <li key={v.id} className="flex flex-wrap gap-2"><strong>v{v.version_no}</strong> {v.file?.original_name} · {fmtBytes(v.file?.size_bytes)} · {v.uploader?.name} · {fmtDateTime(v.created_at)} · {v.change_note}<a href={admin.url(`documents/${id}/download/${v.version_no}`)} className="text-ut-red hover:underline">Descargar</a></li>)}</ul>
            {can('documents.upload') && (
              <div className="mt-3 grid gap-2 rounded-lg border border-dashed border-line p-3 md:grid-cols-[1fr_1fr_auto]">
                <FilePicker file={file} onPick={setFile} label="Elegir nueva versión" />
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Descripción del cambio" className="rounded border border-line px-2 py-1 text-sm" />
                <Button variant="secondary" onClick={version}>Cargar versión</Button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Usuarios y roles

export function Users() {
  const { can, me } = useAuth();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Row | null>(null);
  const { data, error, loading, reload } = useAsync(() => admin.get<Row>('users', { q, per_page: 100 }), [q]);
  const roles = useAsync(() => admin.get<Row[]>('roles'), []);
  const deps = useOptions('dependencies');
  const [msg, setMsg] = useState<{ k: 'ok' | 'error'; t: string } | null>(null);
  const save = async () => {
    setMsg(null);
    try {
      const body = { ...open, role_ids: open!.role_ids, dependency_ids: open!.dependency_ids };
      if (open!.id) await admin.put(`users/${open!.id}`, body); else await admin.post('users', body);
      setOpen(null); reload();
    } catch (e) { setMsg({ k: 'error', t: errorText(e) }); }
  };
  const toggle = (k: 'role_ids' | 'dependency_ids', idv: number) => setOpen((o) => ({ ...o!, [k]: o![k].includes(idv) ? o![k].filter((x: number) => x !== idv) : [...o![k], idv] }));
  return (
    <div>
      <PageHeader title="Usuarios" icon="user" eyebrow="Administración" description="Cuentas de los funcionarios, su rol y la oficina a la que pertenecen."
        actions={can('users.manage') ? <Button variant="primary" onClick={() => { setMsg(null); setOpen({ name: '', email: '', password: '', is_active: true, role_ids: [], dependency_ids: [] }); }}><Icon name="plus" /> Nuevo usuario</Button> : undefined} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o correo" className={`${inputCls} mb-3 max-w-sm`} />
      {loading && <Spinner />}{error && <ErrorBox message={error} />}
      <div className="overflow-x-auto admin-card">
        <table className="admin-table w-full text-left text-sm">
          <thead className="text-[0.7rem] uppercase"><tr><th className="px-3 py-2">Nombre</th><th className="px-3 py-2">Correo</th><th className="px-3 py-2">Roles</th><th className="px-3 py-2">Dependencias</th><th className="px-3 py-2">Verificación en dos pasos</th><th className="px-3 py-2">Último acceso</th><th className="px-3 py-2">Estado</th><th /></tr></thead>
          <tbody className="divide-y divide-line">{data?.data.map((u: Row) => (
            <tr key={u.id}><td className="px-3 py-2 font-semibold">{u.name}</td><td className="px-3 py-2">{u.email}</td><td className="px-3 py-2">{u.roles.map((r: Row) => r.name).join(', ')}</td><td className="px-3 py-2">{(u.dependencies.length > 4 ? `${u.dependencies.length} oficinas` : u.dependencies.map((d: Row) => d.name ?? d.code).join(', ')) || '—'}</td><td className="px-3 py-2">{u.mfa_enabled ? <Badge tone="green">Activo</Badge> : <Badge>No</Badge>}</td><td className="px-3 py-2">{fmtDateTime(u.last_login_at) || '—'}</td><td className="px-3 py-2">{u.is_active ? <Badge tone="green">Activo</Badge> : <Badge tone="red">Inactivo</Badge>}</td>
              <td className="px-3 py-2 text-right">{can('users.manage') && <button className="font-semibold text-ut-red hover:underline" onClick={() => { setMsg(null); setOpen({ ...u, password: '', role_ids: u.roles.map((r: Row) => r.id), dependency_ids: u.dependencies.map((d: Row) => d.id) }); }}>Editar</button>}</td></tr>
          ))}</tbody>
        </table>
      </div>
      {open && (
        <div className="fade-in fixed inset-0 z-50 flex justify-end bg-[#2b1416]/40 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Usuario">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-3 flex"><h2 className="text-lg font-bold">{open.id ? 'Editar usuario' : 'Nuevo usuario'}</h2><button autoFocus className="ml-auto p-2 text-xl" onClick={() => setOpen(null)} aria-label="Cerrar"><Icon name="close" /></button></div>
            {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
            <div className="mt-3 space-y-3">
              <label className="block text-sm font-semibold">Nombre<input value={open.name} onChange={(e) => setOpen({ ...open, name: e.target.value })} className={inputCls} /></label>
              <label className="block text-sm font-semibold">Correo<input type="email" value={open.email} onChange={(e) => setOpen({ ...open, email: e.target.value })} className={inputCls} /></label>
              <label className="block text-sm font-semibold">{open.id ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña inicial'}<input type="password" autoComplete="new-password" value={open.password} onChange={(e) => setOpen({ ...open, password: e.target.value })} className={inputCls} /></label>
              <p className="text-xs text-muted">{PASSWORD_HELP}</p>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={open.is_active} disabled={open.id === me?.user.id} onChange={(e) => setOpen({ ...open, is_active: e.target.checked })} /> Cuenta activa</label>
              <fieldset disabled={open.id === me?.user.id}><legend className="text-sm font-semibold">Roles {open.id === me?.user.id && <span className="font-normal text-muted">(no puede modificar sus propios roles)</span>}</legend>
                {roles.data?.map((r) => <label key={r.id} className="flex items-start gap-2 py-1 text-sm"><input type="checkbox" className="mt-1" checked={open.role_ids.includes(r.id)} onChange={() => toggle('role_ids', r.id)} /><span><strong>{r.name}</strong><br /><span className="text-muted">{r.description}</span></span></label>)}
              </fieldset>
              <fieldset><legend className="text-sm font-semibold">Dependencias (alcance de los datos)</legend>
                <div className="grid max-h-48 grid-cols-2 overflow-y-auto rounded border border-line p-2">{deps.map((d) => <label key={String(d.id)} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={open.dependency_ids.includes(d.id)} onChange={() => toggle('dependency_ids', Number(d.id))} />{String(d.code)}</label>)}</div>
              </fieldset>
              {open.id && open.mfa_enabled && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!open.reset_mfa} onChange={(e) => setOpen({ ...open, reset_mfa: e.target.checked })} /> Restablecer segundo factor (pérdida del dispositivo)</label>}
              <div className="flex gap-2 pt-2"><Button onClick={save}><Icon name="check" /> Guardar</Button>
                {open.id && open.id !== me?.user.id && open.is_active && <Button variant="danger" onClick={async () => { if (confirm('¿Desactivar la cuenta? Se conserva su historial.')) { await admin.del(`users/${open.id}`); setOpen(null); reload(); } }}>Desactivar</Button>}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Roles() {
  const { can, me } = useAuth();
  const { data, reload } = useAsync(() => admin.get<Row[]>('roles'), []);
  const perms = useAsync(() => admin.get<Row[]>('permissions'), []);
  const [edit, setEdit] = useState<Row | null>(null);
  const [msg, setMsg] = useState<{ k: 'ok' | 'error'; t: string } | null>(null);
  const groups = (perms.data ?? []).reduce<Record<string, Row[]>>((m, p) => ((m[p.group] ??= []).push(p), m), {});
  const mine = new Set(me?.user.roles.map((r) => r.id));
  const save = async () => {
    setMsg(null);
    try { if (edit!.id) await admin.put(`roles/${edit!.id}`, edit); else await admin.post('roles', edit); setEdit(null); reload(); setMsg({ k: 'ok', t: 'Rol guardado.' }); } catch (e) { setMsg({ k: 'error', t: errorText(e) }); }
  };
  return (
    <div>
      <PageHeader title="Roles y permisos" icon="shield" eyebrow="Administración" description="Qué puede ver y hacer cada rol. Ningún rol tiene acceso ilimitado."
        actions={can('roles.manage') ? <Button variant="primary" onClick={() => setEdit({ code: '', name: '', description: '', permission_ids: [] })}><Icon name="plus" /> Nuevo rol</Button> : undefined} />
      {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {data?.map((r) => (
          <div key={r.id} className="admin-card p-4">
            <div className="flex items-start gap-2"><div><p className="font-bold">{r.name}</p><p className="text-xs text-muted">{r.users_count} {r.users_count === 1 ? 'usuario' : 'usuarios'}</p></div>
              {can('roles.manage') && !mine.has(r.id) && <button className="ml-auto text-sm font-semibold text-ut-red hover:underline" onClick={() => setEdit({ ...r, permission_ids: r.permissions.map((p: Row) => p.id) })}>Editar</button>}</div>
            <p className="mt-1 text-sm text-muted">{r.description}</p>
            <p className="mt-2 flex flex-wrap gap-1">{r.permissions.map((p: Row) => <Badge key={p.id}>{p.description ?? p.code}</Badge>)}</p>
          </div>
        ))}
      </div>
      {edit && (
        <div className="fade-in fixed inset-0 z-50 flex justify-end bg-[#2b1416]/40 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Rol">
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-3 flex"><h2 className="text-lg font-bold">{edit.id ? 'Editar rol' : 'Nuevo rol'}</h2><button autoFocus className="ml-auto p-2 text-xl" onClick={() => setEdit(null)} aria-label="Cerrar"><Icon name="close" /></button></div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold">Código<input value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value })} className={inputCls} /></label>
              <label className="text-sm font-semibold">Nombre<input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={inputCls} /></label>
              <label className="text-sm font-semibold md:col-span-2">Descripción<textarea value={edit.description ?? ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className={inputCls} /></label>
            </div>
            {Object.entries(groups).map(([g, ps]) => (
              <fieldset key={g} className="mt-4"><legend className="font-bold">{g}</legend>
                {ps.map((p) => <label key={p.id} className="flex items-start gap-2 py-0.5 text-sm"><input type="checkbox" className="mt-1" checked={edit.permission_ids.includes(p.id)} onChange={(e) => setEdit({ ...edit, permission_ids: e.target.checked ? [...edit.permission_ids, p.id] : edit.permission_ids.filter((x: number) => x !== p.id) })} /><span>{p.description}</span></label>)}
              </fieldset>
            ))}
            <div className="mt-4 flex gap-2"><Button onClick={save}><Icon name="check" /> Guardar</Button>{edit.id && edit.users_count === 0 && <Button variant="danger" onClick={async () => { await admin.del(`roles/${edit.id}`); setEdit(null); reload(); }}>Eliminar</Button>}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Auditoría, configuración e informes

const AUDIT_LABELS: Record<string, string> = {
  'auth.login': 'Ingresó al panel', 'auth.logout': 'Salió del panel', 'auth.failed': 'Intento de ingreso fallido', 'auth.locked': 'Cuenta bloqueada por intentos fallidos',
  'auth.mfa_enabled': 'Activó la verificación en dos pasos', 'auth.mfa_disabled': 'Desactivó la verificación en dos pasos', 'auth.mfa_failed': 'Código de verificación incorrecto',
  'auth.password_changed': 'Cambió su contraseña', 'auth.password_reset': 'Restableció su contraseña', 'auth.password_reset_requested': 'Pidió recuperar la contraseña',
  'content.enviar': 'Envió un contenido a revisión', 'content.publicar': 'Publicó un contenido', 'content.devolver': 'Devolvió un contenido con observaciones', 'content.despublicar': 'Retiró un contenido del portal',
  'document.download': 'Descargó un documento', 'document.uploaded': 'Subió un documento', 'document.version_added': 'Subió una nueva versión de un documento', 'document.reclassified': 'Cambió la reserva de un documento',
  'indicator.publish': 'Publicó datos de un indicador', 'indicator.unpublish': 'Retiró datos de un indicador', 'indicator.authorization_changed': 'Cambió la autorización de un indicador',
  'records.import': 'Cargó una base de datos', 'records.undo': 'Deshizo la carga de una base', 'records.view_personal': 'Consultó datos personales',
  'report.export': 'Descargó un informe', 'report.petty_cash': 'Descargó el informe de caja menor',
  'role.permissions_changed': 'Cambió los permisos de un rol', 'role.deleted': 'Eliminó un rol', 'settings.updated': 'Cambió la configuración',
  'user.created': 'Creó un usuario', 'user.created_cli': 'Creó un usuario (consola)', 'user.deactivated': 'Desactivó un usuario', 'user.roles_changed': 'Cambió el rol de un usuario', 'user.mfa_reset': 'Reinició la verificación de un usuario',
};
const ENTITY_LABELS: Record<string, string> = {
  News: 'Noticia', Event: 'Actividad', Page: 'Página', MediaItem: 'Multimedia', Document: 'Documento', User: 'Usuario', Role: 'Rol', DataSubmission: 'Lote de indicador',
  Indicator: 'Indicador', RecordImport: 'Carga de base', Project: 'Proyecto', Cat: 'CAT', Program: 'Programa', Publication: 'Publicación', Agreement: 'Convenio',
};
const META_KEYS: Record<string, string> = { entity: 'base', period: 'semestre', rows: 'registros', page: 'página', email: 'correo', format: 'formato', role: 'rol', roles: 'roles', status: 'estado', title: 'título', reason: 'motivo', from: 'antes', to: 'después', indicator: 'indicador', submission: 'carga' };
const metaText = (m: Row | null) => (m ? Object.entries(m).map(([k, v]) => `${META_KEYS[k] ?? k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ') : '');

export function Audit() {
  const [f, setF] = useState({ action: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const { data, loading, error } = useAsync(() => admin.get<Row>('audit', { ...f, page }), [JSON.stringify(f), page]);
  return (
    <div>
      <PageHeader title="Auditoría" icon="history" eyebrow="Administración" description="Quién hizo qué y cuándo: ingresos, intentos fallidos, cambios de permisos, publicaciones, descargas y consultas de datos personales. No se puede modificar." />
      <div className="mb-3 flex flex-wrap gap-3">
        <label className="text-xs font-bold text-muted uppercase">Qué pasó<select value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })} className={`${inputCls} normal-case`}><option value="">Todo</option>{Object.entries(AUDIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="text-xs font-bold text-muted uppercase">Desde<input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} className={inputCls} /></label>
        <label className="text-xs font-bold text-muted uppercase">Hasta<input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} className={inputCls} /></label>
      </div>
      {loading && <Spinner />}{error && <ErrorBox message={error} />}
      <div className="overflow-x-auto admin-card">
        <table className="admin-table w-full text-left text-sm"><thead className="text-[0.7rem] uppercase"><tr><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Usuario</th><th className="px-3 py-2">Qué pasó</th><th className="px-3 py-2">Sobre</th><th className="px-3 py-2">Detalle</th><th className="px-3 py-2">Equipo (IP)</th></tr></thead>
          <tbody className="divide-y divide-line">{data?.data.map((a: Row) => <tr key={a.id}><td className="px-3 py-1.5 whitespace-nowrap">{fmtDateTime(a.created_at)}</td><td className="px-3 py-1.5">{a.user?.name ?? '—'}</td><td className="px-3 py-1.5">{AUDIT_LABELS[a.action] ?? a.action}</td><td className="px-3 py-1.5">{a.entity_type ? `${ENTITY_LABELS[a.entity_type] ?? a.entity_type} n.º ${a.entity_id}` : '—'}</td><td className="max-w-xs truncate px-3 py-1.5 text-xs text-muted" title={metaText(a.meta)}>{metaText(a.meta)}</td><td className="px-3 py-1.5">{a.ip}</td></tr>)}</tbody>
        </table>
      </div>
      {data && data.last_page > 1 && <div className="mt-3 flex justify-end gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button><span className="self-center text-sm">{page} / {data.last_page}</span><Button variant="secondary" disabled={page >= data.last_page} onClick={() => setPage(page + 1)}>Siguiente</Button></div>}
    </div>
  );
}

export function Settings() {
  const { data, error } = useAsync(() => admin.get<Row>('settings'), []);
  const [form, setForm] = useState<Row | null>(null);
  const [msg, setMsg] = useState<{ k: 'ok' | 'error'; t: string } | null>(null);
  useEffect(() => {
    const arr = (v: unknown) => { try { const x = typeof v === 'string' ? JSON.parse(v || '[]') : v; return Array.isArray(x) ? x : []; } catch { return []; } };
    if (data) setForm({ ...data, mfa_enforced: data.mfa_enforced === '1', news_requires_review: data.news_requires_review === '1', official_links: arr(data.official_links), social_links: arr(data.social_links) });
  }, [data]);
  if (error) return <ErrorBox message={error} />;
  if (!form) return <Spinner />;
  const t = (k: string, l: string, type: 'text' | 'textarea' | 'number' | 'checkbox' | 'image' = 'text', help?: string) => <FieldInput def={{ name: k, label: l, type, help }} value={form[k]} onChange={(v) => setForm({ ...form, [k]: v })} />;
  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader title="Configuración" icon="settings" eyebrow="Administración" description="Logotipo, datos de contacto y parámetros generales del portal." />
      {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
      <section className="grid gap-4 admin-card p-5 md:grid-cols-2">
        <h2 className="font-bold md:col-span-2">Identidad y contacto</h2>
        {t('site_name', 'Nombre del sitio')}{t('university_name', 'Universidad')}
        {t('contact_address', 'Dirección')}{t('contact_phone', 'Teléfono')}{t('contact_email', 'Correo')}
        <div className="md:col-span-2">{t('logo_file_id', 'Logotipo oficial (reemplaza el temporal extraído del boceto)', 'image')}</div>
        <div className="md:col-span-2">{t('hero_title', 'Título institucional del inicio')}</div>
        <div className="md:col-span-2">{t('hero_text', 'Descripción breve del inicio', 'textarea')}</div>
        <div className="md:col-span-2"><FieldInput def={{ name: 'official_links', label: 'Enlaces oficiales (pie de página del portal)', type: 'repeater', fields: [{ name: 'label', label: 'Nombre', type: 'text' }, { name: 'url', label: 'Dirección (https://…)', type: 'url' }] }} value={form.official_links} onChange={(v) => setForm({ ...form, official_links: v })} /></div>
        <div className="md:col-span-2"><FieldInput def={{ name: 'social_links', label: 'Redes sociales', type: 'repeater', fields: [{ name: 'label', label: 'Red (Facebook, Instagram…)', type: 'text' }, { name: 'url', label: 'Dirección (https://…)', type: 'url' }] }} value={form.social_links} onChange={(v) => setForm({ ...form, social_links: v })} /></div>
      </section>
      <section className="grid gap-4 admin-card p-5 md:grid-cols-2">
        <h2 className="font-bold md:col-span-2">Seguridad y publicación</h2>
        {t('max_upload_mb', 'Tamaño máximo de archivo (MB)', 'number')}
        {t('min_cell_size', 'Umbral general de supresión de celdas pequeñas (k)', 'number')}
        {t('mfa_enforced', 'Exigir verificación en dos pasos a todos los usuarios del panel', 'checkbox')}
        {t('news_requires_review', 'Los contenidos requieren revisión antes de publicarse', 'checkbox')}
      </section>
      <Button onClick={async () => { setMsg(null); try { const { logo_file_id, ...rest } = form; await admin.put('settings', { ...rest, official_links: JSON.stringify(form.official_links ?? []), social_links: JSON.stringify(form.social_links ?? []), logo_file_id: logo_file_id ? Number(logo_file_id) : null, max_upload_mb: Number(form.max_upload_mb), min_cell_size: Number(form.min_cell_size) }); setMsg({ k: 'ok', t: 'Configuración guardada.' }); } catch (e) { setMsg({ k: 'error', t: errorText(e) }); } }}><Icon name="check" /> Guardar</Button>
    </div>
  );
}

export function Reports() {
  const { can } = useAuth();
  const ind = can('reports.internal.export');
  const mods = useAsync(() => (ind ? admin.get<Row[]>('indicator-modules') : Promise.resolve([])), [ind]);
  const periods = useOptions(ind ? 'periods' : undefined);
  const cats = useOptions(ind ? 'cats' : undefined);
  const programs = useOptions(ind ? 'programs' : undefined);
  const budgets = useOptions(can('petty_cash.view') ? 'petty-cash-budgets' : undefined);
  const [f, setF] = useState<Row>({ module_id: '', period: '', cat: '', program: '', format: 'xlsx' });
  const [pc, setPc] = useState('');
  const sel = (k: string, l: string, options: { v: string; l: string }[]) => (
    <label className="text-xs font-bold text-muted uppercase">{l}<select value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={inputCls}><option value="">Todos</option>{options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></label>
  );
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Informes" icon="download" eyebrow="Información e indicadores" description="Descargue en Excel los indicadores y la caja menor para informes de gestión." />
      {can('reports.internal.export') && (
        <section className="admin-card p-5">
          <h2 className="font-bold">Informe interno de indicadores</h2>
          <p className="mb-3 text-sm text-muted">Incluye datos aprobados aún no publicados. Respeta su rol: sin el permiso financiero se excluye el módulo de gestión financiera; los coordinadores solo exportan sus dependencias. Cada exportación queda auditada.</p>
          <div className="grid gap-3 md:grid-cols-3">
            {sel('module_id', 'Módulo', (mods.data ?? []).map((m) => ({ v: String(m.id), l: `${m.number}. ${m.name}` })))}
            {sel('period', 'Período', periods.map((p) => ({ v: String(p.code), l: String(p.code) })))}
            {sel('cat', 'CAT', cats.map((c) => ({ v: String(c.id), l: String(c.name) })))}
            {sel('program', 'Programa', programs.map((c) => ({ v: String(c.id), l: String(c.name) })))}
            <label className="text-xs font-bold text-muted uppercase">Formato<select value={f.format} onChange={(e) => setF({ ...f, format: e.target.value })} className={inputCls}><option value="xlsx">Excel</option><option value="csv">CSV</option></select></label>
          </div>
          <a href={admin.url('reports/indicators', f)} className="mt-4 inline-flex items-center gap-1 rounded-lg bg-ut-red px-4 py-2 text-sm font-semibold text-white hover:bg-ut-red-dark"><Icon name="download" /> Generar informe</a>
          <p className="mt-3 text-xs text-muted">Para un informe en PDF, abra el módulo correspondiente en el portal público y use «Imprimir / PDF».</p>
        </section>
      )}
      {can('petty_cash.view') && (
        <section className="admin-card p-5">
          <h2 className="font-bold">Informe de caja menor</h2>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <label className="text-xs font-bold text-muted uppercase">Presupuesto<select value={pc} onChange={(e) => setPc(e.target.value)} className={inputCls}><option value="">Todos</option>{budgets.map((b) => <option key={String(b.id)} value={String(b.id)}>{String(b.year)} — {String(b.name)}</option>)}</select></label>
            <a href={admin.url('reports/petty-cash', { budget_id: pc, format: 'xlsx' })} className="inline-flex items-center gap-1 rounded-lg bg-ut-red px-4 py-2 text-sm font-semibold text-white hover:bg-ut-red-dark"><Icon name="download" /> Excel</a>
          </div>
        </section>
      )}
      {!can('reports.internal.export') && !can('petty_cash.view') && <Notice kind="info">Su rol no tiene informes asignados.</Notice>}
    </div>
  );
}

import { useEffect, useState, type ReactNode } from 'react';
import { admin, errorText } from '../../shared/api';
import { fmtDateTime, label } from '../../shared/format';
import { Icon } from '../../shared/icons';
import { Badge, ErrorBox, Spinner, STATUS_TONE, useAsync } from '../../shared/ui';
import type { Paginated } from '../../shared/types';
import { useAuth } from '../auth';
import { Button, clearOptionCache, FieldInput, inputCls, Notice, type FieldDef } from './Form';
import { PageHeader } from './PageHeader';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface ResourceConfig {
  title: string;
  endpoint: string;
  /** Tipo de entidad para el historial de cambios (class_basename del modelo). */
  entity?: string;
  description?: string;
  editPermission: string[];
  /** Permisos para crear registros (por defecto, los de edición). */
  createPermission?: string[];
  publishPermission?: string[];
  workflowField?: 'status' | 'publication_status';
  fields: FieldDef[];
  columns: { key: string; label: string; render?: (r: Row) => ReactNode }[];
  filters?: { name: string; label: string; options: { value: string; label: string }[] }[];
  /** Transforma el registro cargado en valores de formulario (p. ej. relaciones → arreglos de ids). */
  toForm?: (r: Row) => Row;
  imageUrls?: (r: Row) => Record<string, string | null | undefined>;
  defaults?: Row;
  /** Ícono del encabezado. */
  icon?: string;
  /** Vista de tarjetas (galería editorial): imagen, subtítulo y datos complementarios de cada registro. */
  card?: { image?: (r: Row) => string | null | undefined; subtitle?: (r: Row) => ReactNode; meta?: (r: Row) => ReactNode; title?: (r: Row) => ReactNode };
  /** Vista de calendario mensual según un campo de fecha. */
  calendar?: { dateField: string };
}

const WF_ACTIONS: { action: string; label: string; from: string[]; publish: boolean; variant: 'primary' | 'secondary' | 'danger' }[] = [
  { action: 'enviar', label: 'Enviar a revisión', from: ['borrador', 'devuelto', 'despublicado'], publish: false, variant: 'secondary' },
  { action: 'publicar', label: 'Aprobar y publicar', from: ['en_revision', 'borrador', 'devuelto', 'despublicado'], publish: true, variant: 'primary' },
  { action: 'devolver', label: 'Devolver con observaciones', from: ['en_revision'], publish: true, variant: 'danger' },
  { action: 'despublicar', label: 'Despublicar', from: ['publicado'], publish: true, variant: 'danger' },
];

export function StatusBadge({ s }: { s?: string | null }) {
  return s ? <Badge tone={STATUS_TONE[s] ?? 'gray'}>{label(s)}</Badge> : null;
}

function History({ entity, id }: { entity: string; id: number }) {
  const { data, loading, error } = useAsync(() => admin.get<Row[]>(`history/${entity}/${id}`), [entity, id]);
  if (loading) return <Spinner />;
  if (error) return <p className="text-sm text-muted">{error}</p>;
  return (
    <ol className="space-y-2 text-sm">
      {data?.length === 0 && <li className="text-muted">Sin cambios registrados.</li>}
      {data?.map((h) => (
        <li key={h.id} className="admin-card p-3">
          <p className="font-semibold">{fmtDateTime(h.created_at)} · {h.user?.name ?? 'Sistema'} · {h.event === 'created' ? 'Creación' : h.event === 'updated' ? 'Modificación' : 'Eliminación'}</p>
          {h.event === 'updated' && h.changes && (
            <ul className="mt-1 text-xs text-muted">{Object.entries(h.changes as Record<string, { old: unknown; new: unknown }>).map(([f, c]) => <li key={f}><strong>{f}</strong>: {String(c.old ?? '∅').slice(0, 80)} → {String(c.new ?? '∅').slice(0, 80)}</li>)}</ul>
          )}
        </li>
      ))}
    </ol>
  );
}

function Editor({ cfg, id, onClose, onSaved }: { cfg: ResourceConfig; id: number | null; onClose: () => void; onSaved: () => void }) {
  const { can, me } = useAuth();
  const [item, setItem] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>(cfg.defaults ?? {});
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState('');
  const [tab, setTab] = useState<'form' | 'history'>('form');
  const load = async (rid: number) => {
    const r = await admin.get<Row>(`${cfg.endpoint}/${rid}`);
    setItem(r);
    const base = Object.fromEntries(cfg.fields.map((f) => [f.name, r[f.name] ?? (f.type === 'checkbox' ? false : null)]));
    setForm({ ...base, ...(cfg.toForm ? cfg.toForm(r) : {}) });
  };
  useEffect(() => { if (id) load(id).catch((e) => setMsg({ kind: 'error', text: errorText(e) })); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const editable = can(...cfg.editPermission) && !(cfg.workflowField && item?.[cfg.workflowField] === 'publicado' && !can(...(cfg.publishPermission ?? [])));
  const save = async () => {
    setBusy(true); setErrors({}); setMsg(null);
    try {
      const r = id ? await admin.put<Row>(`${cfg.endpoint}/${id}`, form) : await admin.post<Row>(cfg.endpoint, form);
      clearOptionCache();
      setMsg({ kind: 'ok', text: 'Cambios guardados.' });
      onSaved();
      if (!id) { onClose(); return; }
      await load(r.id);
    } catch (e) {
      setErrors((e as { errors?: Record<string, string[]> }).errors ?? {});
      setMsg({ kind: 'error', text: errorText(e) });
    } finally { setBusy(false); }
  };
  const workflow = async (action: string) => {
    setBusy(true); setMsg(null);
    try {
      await admin.post(`${cfg.endpoint}/${id}/workflow`, { action, comment: comment || null });
      setComment('');
      setMsg({ kind: 'ok', text: 'Estado actualizado.' });
      await load(id!);
      onSaved();
    } catch (e) { setMsg({ kind: 'error', text: errorText(e) }); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!confirm('¿Eliminar este registro? Esta acción queda registrada en el historial.')) return;
    try { await admin.del(`${cfg.endpoint}/${id}`); onSaved(); onClose(); } catch (e) { setMsg({ kind: 'error', text: errorText(e) }); }
  };
  const status = cfg.workflowField ? item?.[cfg.workflowField] : null;
  const isAuthor = item?.author_id && item.author_id === me?.user.id;
  const imgs = item && cfg.imageUrls ? cfg.imageUrls(item) : {};

  const wfActions = WF_ACTIONS.filter((a) => a.from.includes(status) && (a.publish ? can(...(cfg.publishPermission ?? [])) : can(...cfg.editPermission)));
  return (
    <div className="fade-in fixed inset-0 z-50 flex justify-end bg-[#2b1416]/40 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={id ? `Editar ${cfg.title}` : `Nuevo registro de ${cfg.title}`} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="admin-ui flex h-full w-full max-w-3xl flex-col bg-ivory shadow-2xl sm:rounded-l-[1.375rem]">
        <header className="relative flex items-center gap-3 overflow-hidden bg-gradient-to-r from-ut-red to-ut-red-dark px-5 py-4 text-white sm:rounded-tl-[1.375rem]">
          <span className="pointer-events-none absolute -top-10 right-24 h-28 w-28 rounded-full bg-white/10" aria-hidden />
          {cfg.icon && <span className="admin-glass grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl"><Icon name={cfg.icon} /></span>}
          <div className="min-w-0"><p className="text-[0.68rem] font-bold tracking-[0.14em] text-white/75 uppercase">{id ? 'Editar registro' : 'Nuevo registro'}</p><h2 className="truncate text-lg font-extrabold">{cfg.title}</h2></div>
          {status && <StatusBadge s={status} />}
          {item?.is_demo && <Badge tone="amber">Demo</Badge>}
          <button onClick={onClose} className="relative ml-auto rounded-xl p-2 text-xl text-white hover:bg-white/15" aria-label="Cerrar" autoFocus><Icon name="close" /></button>
        </header>
        {id && cfg.entity && (
          <div className="flex gap-1 border-b border-line bg-white px-5" role="tablist">
            {(['form', 'history'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`border-b-[3px] px-3 py-2.5 text-sm font-semibold transition ${tab === t ? 'border-ut-red text-ut-red' : 'border-transparent text-muted hover:text-ink'}`}>{t === 'form' ? 'Datos' : 'Historial de cambios'}</button>)}
          </div>
        )}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          {tab === 'history' && id && cfg.entity ? <History entity={cfg.entity} id={id} /> : (
            <>
              {!editable && id && <Notice kind="info">{cfg.workflowField && status === 'publicado' && can(...cfg.editPermission)
                ? 'Este contenido ya está publicado en el portal, por eso no se puede cambiar aquí. Si necesita corregirlo, pida a la Dirección que lo retire del portal o que haga el cambio.'
                : 'Puede consultar esta información, pero su rol no permite modificarla.'}</Notice>}
              <fieldset disabled={!editable || busy} className="admin-card grid gap-x-5 gap-y-4 p-5 md:grid-cols-2">
                <legend className="sr-only">Datos del registro</legend>
                {cfg.fields.map((f) => (
                  <div key={f.name} className={f.full || ['html', 'textarea', 'repeater', 'multirelation', 'image'].includes(f.type) ? 'md:col-span-2' : ''}>
                    <FieldInput def={f} value={form[f.name]} onChange={(v) => setForm((x) => ({ ...x, [f.name]: v }))} error={errors[f.name]?.[0] ?? Object.entries(errors).find(([k]) => k.startsWith(`${f.name}.`))?.[1]?.[0]} imageUrl={imgs[f.name]} />
                  </div>
                ))}
              </fieldset>
              {item?.reviews?.length > 0 && (
                <section className="admin-card p-4">
                  <h3 className="mb-2 text-sm font-bold">Revisiones</h3>
                  <ol className="space-y-1 text-sm">{item!.reviews.map((r: Row) => <li key={r.id}>{fmtDateTime(r.created_at)} · <StatusBadge s={r.decision} /> · {r.reviewer?.name}{r.comment ? ` — «${r.comment}»` : ''}</li>)}</ol>
                </section>
              )}
            </>
          )}
        </div>
        {tab === 'form' && (
          <footer className="space-y-3 border-t border-line bg-white px-5 py-3.5">
            {id && cfg.workflowField && wfActions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {wfActions.some((a) => a.action === 'devolver') && <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Observaciones para el autor (obligatorio si lo devuelve)" className="min-w-[12rem] flex-1 rounded-xl border border-[#e3dbd3] px-3 py-2 text-sm focus:border-ut-red focus:ring-4 focus:ring-ut-red/12 focus:outline-none" />}
                {wfActions.map((a) => (
                  <Button key={a.action} variant={a.variant} disabled={busy || (a.action === 'publicar' && !!isAuthor && cfg.workflowField === 'status')} onClick={() => workflow(a.action)}
                    title={a.action === 'publicar' && isAuthor ? 'El autor no puede aprobar su propio contenido' : undefined}>{a.label}</Button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              {editable && <Button onClick={save} disabled={busy}><Icon name="check" /> {busy ? 'Guardando…' : 'Guardar'}</Button>}
              <Button variant="secondary" onClick={onClose}>Cerrar</Button>
              {id && editable && status !== 'publicado' && <Button variant="ghost" className="ml-auto text-ut-red" onClick={remove}><Icon name="trash" /> Eliminar</Button>}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

type View = 'cards' | 'calendar' | 'table';
const VIEW_LABEL: Record<View, [string, string]> = { cards: ['Tarjetas', 'image'], calendar: ['Calendario', 'calendar'], table: ['Tabla', 'table'] };

/** Números de página visibles (0 = separador «…»). */
function pages(cur: number, last: number): number[] {
  const set = [...new Set([1, cur - 1, cur, cur + 1, last].filter((n) => n >= 1 && n <= last))].sort((a, b) => a - b);
  return set.flatMap((n, i) => (i && n - set[i - 1] > 1 ? [0, n] : [n]));
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-muted">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-warm text-2xl"><Icon name="search" /></span>
      <p className="font-semibold text-ink">Sin registros</p>
      <p className="text-sm">No hay resultados con los filtros actuales.</p>
    </div>
  );
}

const WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Calendario mensual (p. ej. actividades): cada evento se ubica en su día; clic para abrirlo. */
function CalendarView({ cfg, q, filters, onOpen }: { cfg: ResourceConfig; q: string; filters: Record<string, string>; onOpen: (id: number) => void }) {
  const field = cfg.calendar!.dateField;
  const { data, loading } = useAsync(() => admin.get<Paginated<Row>>(cfg.endpoint, { q, per_page: 200, ...filters }), [cfg.endpoint, q, JSON.stringify(filters)]);
  const rows = data?.data ?? [];
  const today = new Date();
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const dates = rows.map((r) => String(r[field] ?? '')).filter(Boolean).sort();
  // Mes inicial: el actual si tiene actividades; si no, el de la próxima actividad (o la más reciente).
  const target = dates.some((d) => d.startsWith(ym(today))) ? null : dates.find((d) => d >= ym(today)) ?? dates[dates.length - 1];
  const [month, setMonth] = useState<Date | null>(null);
  const base = month ?? (target ? new Date(`${target.slice(0, 7)}-01T00:00`) : new Date(today.getFullYear(), today.getMonth(), 1));
  const y = base.getFullYear(), m = base.getMonth();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => i - lead + 1);
  const key = (d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const byDay: Record<string, Row[]> = {};
  rows.forEach((r) => { const k = String(r[field] ?? '').slice(0, 10); (byDay[k] ??= []).push(r); });
  const monthName = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(base);
  const isToday = (d: number) => d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
  return (
    <section className="admin-card overflow-hidden" aria-label={`Calendario de ${monthName}`}>
      <header className="flex items-center gap-2 bg-gradient-to-r from-ut-red to-ut-red-dark px-4 py-3 text-white">
        <button type="button" onClick={() => setMonth(new Date(y, m - 1, 1))} className="rounded-lg p-1.5 hover:bg-white/15" aria-label="Mes anterior"><Icon name="chevronLeft" /></button>
        <h2 className="flex-1 text-center text-lg font-extrabold first-letter:uppercase">{monthName}</h2>
        <button type="button" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="rounded-lg bg-white/15 px-3 py-1 text-xs font-bold hover:bg-white/25">Hoy</button>
        <button type="button" onClick={() => setMonth(new Date(y, m + 1, 1))} className="rounded-lg p-1.5 hover:bg-white/15" aria-label="Mes siguiente"><Icon name="chevronRight" /></button>
      </header>
      {loading ? <div className="p-4"><Spinner /></div> : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[44rem] grid-cols-7">
            {WEEK.map((w) => <div key={w} className="border-b border-line bg-[#faf7f4] py-2 text-center text-xs font-bold text-muted uppercase">{w}</div>)}
            {cells.map((d, i) => (
              <div key={i} className={`min-h-28 border-r border-b border-[#efe9e3] p-1.5 ${d < 1 || d > days ? 'bg-[#fbf9f7]' : 'bg-white'} ${i % 7 === 6 ? 'border-r-0' : ''}`}>
                {d >= 1 && d <= days && (
                  <>
                    <span className={`inline-grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${isToday(d) ? 'bg-ut-red text-white' : 'text-ink'}`}>{d}</span>
                    <ul className="mt-1 space-y-1">
                      {(byDay[key(d)] ?? []).map((r) => (
                        <li key={r.id}>
                          <button type="button" onClick={() => onOpen(r.id)} title={String(r[cfg.columns[0].key] ?? '')}
                            className={`block w-full truncate rounded-lg border-l-[3px] px-1.5 py-1 text-left text-[0.72rem] font-semibold transition hover:shadow ${r[cfg.workflowField ?? 'status'] === 'publicado' ? 'border-idead-teal bg-idead-teal-50 text-idead-teal-dark' : 'border-ut-red bg-ut-red-50 text-ut-red-dark'}`}>
                            {String(r[field]).slice(11, 16) !== '00:00' && <span className="mr-1 opacity-70">{String(r[field]).slice(11, 16)}</span>}{String(r[cfg.columns[0].key] ?? '')}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="flex flex-wrap gap-4 border-t border-line px-4 py-2.5 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-idead-teal" /> Publicada</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ut-red" /> En preparación o revisión</span>
      </p>
    </section>
  );
}

/** Página CRUD genérica: listado con búsqueda, filtros, estado y paginación + editor lateral con flujo editorial e historial. */
export function ResourcePage({ cfg, embedded = false, hideDescription = false }: { cfg: ResourceConfig; embedded?: boolean; hideDescription?: boolean }) {
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<number | null | 'new'>(null);
  const views: View[] = [...(cfg.card ? ['cards' as const] : []), ...(cfg.calendar ? ['calendar' as const] : []), 'table'];
  const [view, setView] = useState<View>(views[0]);
  const { data, error, loading, reload } = useAsync(() => admin.get<Paginated<Row>>(cfg.endpoint, { q, page, ...filters }), [cfg.endpoint, q, page, JSON.stringify(filters)]);
  useEffect(() => { setPage(1); setFilters({}); setQ(''); setEditing(null); setView(views[0]); }, [cfg.endpoint]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      {embedded ? (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {cfg.description && !hideDescription && <p className="max-w-3xl text-sm text-muted">{cfg.description}</p>}
          {can(...(cfg.createPermission ?? cfg.editPermission)) && <Button className="ml-auto" onClick={() => setEditing('new')}><Icon name="plus" /> Nuevo</Button>}
        </div>
      ) : (
        <PageHeader title={cfg.title} description={cfg.description} icon={cfg.icon}
          actions={can(...(cfg.createPermission ?? cfg.editPermission)) ? <Button variant="primary" onClick={() => setEditing('new')}><Icon name="plus" /> Nuevo</Button> : undefined} />
      )}
      <div className="admin-card mb-4 flex flex-wrap items-end gap-3 p-3.5">
        <label className="min-w-[14rem] flex-1 text-[0.7rem] font-bold tracking-wider text-muted uppercase">Buscar
          <span className="relative mt-1 block">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg text-muted" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={`Buscar en ${cfg.title.toLowerCase()}…`} className={`${inputCls} !mt-0 pl-10 font-normal tracking-normal normal-case`} />
          </span>
        </label>
        {cfg.workflowField && (
          <label className="text-[0.7rem] font-bold tracking-wider text-muted uppercase">Estado
            <select value={filters.estado ?? ''} onChange={(e) => { setFilters((f) => ({ ...f, estado: e.target.value })); setPage(1); }} className={`${inputCls} font-normal tracking-normal normal-case`}>
              <option value="">Todos</option>{['borrador', 'en_revision', 'devuelto', 'publicado', 'despublicado'].map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </label>
        )}
        {cfg.filters?.map((f) => (
          <label key={f.name} className="text-[0.7rem] font-bold tracking-wider text-muted uppercase">{f.label}
            <select value={filters[f.name] ?? ''} onChange={(e) => { setFilters((x) => ({ ...x, [f.name]: e.target.value })); setPage(1); }} className={`${inputCls} font-normal tracking-normal normal-case`}>
              <option value="">Todos</option>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        ))}
        {views.length > 1 && (
          <div className="ml-auto flex rounded-xl bg-warm p-1" role="group" aria-label="Vista">
            {views.map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} title={VIEW_LABEL[v][0]}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${view === v ? 'bg-white text-ut-red shadow-sm' : 'text-muted hover:text-ink'}`}>
                <Icon name={VIEW_LABEL[v][1]} /> <span className="hidden sm:inline">{VIEW_LABEL[v][0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {view === 'cards' && cfg.card && (
        <>
          {loading && <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{[0, 1, 2, 3].map((k) => <div key={k} className="skeleton h-72" />)}</div>}
          {!loading && data?.data.length === 0 && <Empty />}
          {!loading && (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {data?.data.map((r) => {
                const img = cfg.card!.image?.(r);
                return (
                  <li key={r.id}>
                    <button type="button" onClick={() => setEditing(r.id)} className="admin-card admin-card-hover group flex h-full w-full flex-col overflow-hidden text-left">
                      <span className="relative block aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#fbe9e8] via-ivory to-idead-teal-50">
                        {img ? <><img src={img} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" aria-hidden /></> : (
                          <span className="relative grid h-full w-full place-items-center">
                            <span className="absolute -right-6 -bottom-8 h-32 w-32 rounded-full border-[14px] border-ut-red/10" aria-hidden />
                            <span className="absolute top-4 left-6 h-10 w-10 rounded-full bg-idead-teal/15" aria-hidden />
                            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-4xl text-ut-red shadow-lg"><Icon name={cfg.icon ?? 'image'} /></span>
                            <span className="absolute bottom-2 left-3 text-[0.65rem] font-semibold text-muted">Sin fotografía cargada</span>
                          </span>
                        )}
                        <span className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          {cfg.workflowField && r[cfg.workflowField] && <span className="rounded-full bg-white/95 shadow-sm"><StatusBadge s={r[cfg.workflowField]} /></span>}
                          {r.is_demo && <Badge tone="amber">Demo</Badge>}
                        </span>
                      </span>
                      <span className="flex flex-1 flex-col p-4">
                        {cfg.card!.subtitle && <span className="text-xs font-bold tracking-wide text-ut-red uppercase">{cfg.card!.subtitle(r)}</span>}
                        <span className="font-display mt-0.5 line-clamp-2 font-bold text-ink group-hover:text-ut-red">{cfg.card!.title ? cfg.card!.title(r) : String(r[cfg.columns[0].key] ?? '—')}</span>
                        {cfg.card!.meta && <span className="mt-auto pt-3 text-xs text-muted">{cfg.card!.meta(r)}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      {view === 'calendar' && cfg.calendar && <CalendarView cfg={cfg} q={q} filters={filters} onOpen={(rid) => setEditing(rid)} />}
      {view === 'table' && (
        <div className="admin-card overflow-x-auto">
          <table className="admin-table w-full min-w-[40rem] text-left text-sm">
            <thead className="text-[0.7rem] uppercase"><tr>{cfg.columns.map((c, i) => <th key={c.key} scope="col" className={`px-4 py-3 ${i === 0 ? 'rounded-tl-[1.125rem]' : ''}`}>{c.label}</th>)}{cfg.workflowField && <th className="px-4 py-3">Publicación</th>}<th className="rounded-tr-[1.125rem] px-4 py-3"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody className="divide-y divide-[#efe9e3]">
              {loading && <tr><td colSpan={9} className="px-4"><Spinner /></td></tr>}
              {!loading && data?.data.length === 0 && <tr><td colSpan={9}><Empty /></td></tr>}
              {!loading && data?.data.map((r) => (
                <tr key={r.id}>
                  {cfg.columns.map((c, i) => <td key={c.key} className={`px-4 py-3 ${i === 0 ? 'font-semibold text-ink' : 'text-[#4a4f55]'}`}>{c.render ? c.render(r) : String(r[c.key] ?? '—')}{c.key === cfg.columns[0].key && r.is_demo && <> <Badge tone="amber">Demo</Badge></>}</td>)}
                  {cfg.workflowField && <td className="px-4 py-3"><StatusBadge s={r[cfg.workflowField]} /></td>}
                  <td className="px-4 py-3 text-right"><Button variant="secondary" onClick={() => setEditing(r.id)}><Icon name="edit" /> Abrir</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {view !== 'calendar' && data && data.last_page > 1 && (
        <nav className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm" aria-label="Paginación">
          <span className="text-muted">Página <strong className="text-ink">{data.current_page}</strong> de {data.last_page} · {data.total} registros</span>
          <span className="flex items-center gap-1">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Página anterior"><Icon name="chevronLeft" /></Button>
            {pages(data.current_page, data.last_page).map((n, i) => n === 0 ? <span key={`g${i}`} className="px-1 text-muted">…</span> : (
              <button key={n} type="button" onClick={() => setPage(n)} aria-current={n === data.current_page ? 'page' : undefined}
                className={`h-9 min-w-9 rounded-xl px-2 font-semibold transition ${n === data.current_page ? 'bg-ut-red text-white shadow-md shadow-ut-red/30' : 'bg-white text-ink ring-1 ring-[#e3dbd3] hover:text-ut-red'}`}>{n}</button>
            ))}
            <Button variant="secondary" disabled={page >= data.last_page} onClick={() => setPage(page + 1)} aria-label="Página siguiente"><Icon name="chevronRight" /></Button>
          </span>
        </nav>
      )}
      {editing !== null && <Editor cfg={cfg} id={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </div>
  );
}

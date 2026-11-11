import { useEffect, useState, type ReactNode } from 'react';
import { admin, errorText } from '../../shared/api';
import { fmtDateTime, label } from '../../shared/format';
import { Icon } from '../../shared/icons';
import { Badge, ErrorBox, Spinner, STATUS_TONE, useAsync } from '../../shared/ui';
import type { Paginated } from '../../shared/types';
import { useAuth } from '../auth';
import { Button, clearOptionCache, FieldInput, Notice, type FieldDef } from './Form';
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
        <li key={h.id} className="rounded-lg border border-line p-2">
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

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" role="dialog" aria-modal="true" aria-label={id ? `Editar ${cfg.title}` : `Nuevo registro de ${cfg.title}`} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
        <header className="flex items-center gap-3 border-b border-line px-5 py-3">
          <h2 className="text-lg font-bold">{id ? 'Editar' : 'Nuevo'} · {cfg.title}</h2>
          {status && <StatusBadge s={status} />}
          {item?.is_demo && <Badge tone="amber">Demo</Badge>}
          <button onClick={onClose} className="ml-auto rounded p-2 text-xl hover:bg-surface" aria-label="Cerrar" autoFocus><Icon name="close" /></button>
        </header>
        {id && cfg.entity && (
          <div className="flex gap-1 border-b border-line px-5" role="tablist">
            {(['form', 'history'] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`border-b-2 px-3 py-2 text-sm font-semibold ${tab === t ? 'border-ut-red text-ut-red' : 'border-transparent text-muted'}`}>{t === 'form' ? 'Datos' : 'Historial de cambios'}</button>)}
          </div>
        )}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          {tab === 'history' && id && cfg.entity ? <History entity={cfg.entity} id={id} /> : (
            <>
              {!editable && id && <Notice kind="info">Solo lectura: no tiene permiso para modificar este registro en su estado actual.</Notice>}
              <fieldset disabled={!editable || busy} className="grid gap-4 md:grid-cols-2">
                {cfg.fields.map((f) => (
                  <div key={f.name} className={f.full || ['html', 'textarea', 'repeater', 'multirelation', 'image'].includes(f.type) ? 'md:col-span-2' : ''}>
                    <FieldInput def={f} value={form[f.name]} onChange={(v) => setForm((x) => ({ ...x, [f.name]: v }))} error={errors[f.name]?.[0] ?? Object.entries(errors).find(([k]) => k.startsWith(`${f.name}.`))?.[1]?.[0]} imageUrl={imgs[f.name]} />
                  </div>
                ))}
              </fieldset>
              {item?.reviews?.length > 0 && (
                <section className="rounded-lg border border-line p-3">
                  <h3 className="mb-2 text-sm font-bold">Revisiones</h3>
                  <ol className="space-y-1 text-sm">{item!.reviews.map((r: Row) => <li key={r.id}>{fmtDateTime(r.created_at)} · <StatusBadge s={r.decision} /> · {r.reviewer?.name}{r.comment ? ` — «${r.comment}»` : ''}</li>)}</ol>
                </section>
              )}
            </>
          )}
        </div>
        {tab === 'form' && (
          <footer className="space-y-3 border-t border-line px-5 py-3">
            {id && cfg.workflowField && (
              <div className="flex flex-wrap items-center gap-2">
                <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentario (obligatorio para devolver)" className="min-w-[12rem] flex-1 rounded-lg border border-line px-3 py-2 text-sm" />
                {WF_ACTIONS.filter((a) => a.from.includes(status) && (a.publish ? can(...(cfg.publishPermission ?? [])) : can(...cfg.editPermission))).map((a) => (
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

/** Página CRUD genérica: listado con búsqueda, filtros, estado y paginación + editor lateral con flujo editorial e historial. */
export function ResourcePage({ cfg, embedded = false, hideDescription = false }: { cfg: ResourceConfig; embedded?: boolean; hideDescription?: boolean }) {
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<number | null | 'new'>(null);
  const { data, error, loading, reload } = useAsync(() => admin.get<Paginated<Row>>(cfg.endpoint, { q, page, ...filters }), [cfg.endpoint, q, page, JSON.stringify(filters)]);
  useEffect(() => { setPage(1); setFilters({}); setQ(''); setEditing(null); }, [cfg.endpoint]);
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
      <div className="mb-3 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
        <label className="text-xs font-bold text-muted uppercase">Buscar
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="mt-1 block rounded-lg border border-line px-3 py-2 text-sm font-normal text-ink normal-case" />
        </label>
        {cfg.workflowField && (
          <label className="text-xs font-bold text-muted uppercase">Estado
            <select value={filters.estado ?? ''} onChange={(e) => { setFilters((f) => ({ ...f, estado: e.target.value })); setPage(1); }} className="mt-1 block rounded-lg border border-line px-2 py-2 text-sm text-ink normal-case">
              <option value="">Todos</option>{['borrador', 'en_revision', 'devuelto', 'publicado', 'despublicado'].map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </label>
        )}
        {cfg.filters?.map((f) => (
          <label key={f.name} className="text-xs font-bold text-muted uppercase">{f.label}
            <select value={filters[f.name] ?? ''} onChange={(e) => { setFilters((x) => ({ ...x, [f.name]: e.target.value })); setPage(1); }} className="mt-1 block rounded-lg border border-line px-2 py-2 text-sm text-ink normal-case">
              <option value="">Todos</option>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        ))}
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b-2 border-ut-red/60 bg-white text-xs text-muted uppercase"><tr>{cfg.columns.map((c) => <th key={c.key} scope="col" className="px-3 py-2.5">{c.label}</th>)}{cfg.workflowField && <th className="px-3 py-2.5">Publicación</th>}<th className="px-3 py-2.5"><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={9}><Spinner /></td></tr>}
            {!loading && data?.data.length === 0 && <tr><td colSpan={9} className="px-3 py-6 text-center text-muted">Sin registros.</td></tr>}
            {!loading && data?.data.map((r) => (
              <tr key={r.id} className="hover:bg-surface/60">
                {cfg.columns.map((c) => <td key={c.key} className="px-3 py-2">{c.render ? c.render(r) : String(r[c.key] ?? '—')}{c.key === cfg.columns[0].key && r.is_demo && <Badge tone="amber">Demo</Badge>}</td>)}
                {cfg.workflowField && <td className="px-3 py-2"><StatusBadge s={r[cfg.workflowField]} /></td>}
                <td className="px-3 py-2 text-right"><Button variant="secondary" onClick={() => setEditing(r.id)}><Icon name="edit" /> Abrir</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.last_page > 1 && (
        <nav className="mt-3 flex items-center justify-end gap-2 text-sm" aria-label="Paginación">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span>Página {data.current_page} de {data.last_page} · {data.total} registros</span>
          <Button variant="secondary" disabled={page >= data.last_page} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </nav>
      )}
      {editing !== null && <Editor cfg={cfg} id={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={reload} />}
    </div>
  );
}

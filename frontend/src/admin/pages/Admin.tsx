import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { admin, errorText } from '../../shared/api';
import { fmtBytes, fmtDateTime, label } from '../../shared/format';
import { Icon } from '../../shared/icons';
import { Badge, ErrorBox, Spinner, useAsync } from '../../shared/ui';
import { useAuth } from '../auth';
import { Button, FieldInput, inputCls, Notice, useOptions } from '../components/Form';
import { PASSWORD_HELP } from './AuthPages';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const CONF_TONE: Record<string, 'green' | 'gray' | 'amber' | 'red'> = { publico: 'green', interno: 'gray', restringido: 'amber', financiero: 'red' };

// ------------------------------------------------------------------ Tablero

const PENDING_LABELS: Record<string, [string, string]> = {
  lotes_por_revisar: ['Lotes de datos por revisar', '/cargas'], lotes_por_publicar: ['Lotes aprobados por publicar', '/cargas'],
  mis_lotes_devueltos: ['Mis lotes devueltos para corrección', '/cargas'], mis_borradores: ['Mis borradores', '/cargas'],
  contenidos_en_revision: ['Contenidos en revisión', '/r/noticias'],
  solicitudes_abiertas: ['Solicitudes de actualización para mi dependencia', '/r/solicitudes'],
  solicitudes_vencidas: ['Solicitudes de actualización vencidas', '/r/solicitudes'],
};

export function Dashboard() {
  const { me } = useAuth();
  const { data, loading } = useAsync(() => admin.get<Row>('dashboard'), []);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-green-dark">Hola, {me?.user.name}</h1>
        <p className="text-muted">Roles: {me?.user.roles.map((r) => r.name).join(', ') || 'sin rol asignado'}</p>
      </div>
      {!me?.user.mfa_enabled && <Notice kind="info">Recomendación de seguridad: active la verificación en dos pasos en <Link to="/cuenta" className="underline">Mi cuenta</Link>.</Notice>}
      {loading && <Spinner />}
      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(data.pending as Record<string, number>).map(([k, v]) => (
              <Link key={k} to={PENDING_LABELS[k]?.[1] ?? '/'} className="rounded-xl border border-line bg-white p-4 hover:border-green">
                <p className={`text-3xl font-extrabold ${v > 0 ? 'text-ut-red' : 'text-green-dark'}`}>{v}</p>
                <p className="text-sm">{PENDING_LABELS[k]?.[0] ?? k}</p>
              </Link>
            ))}
          </section>
          {data.indicators && (
            <section className="rounded-xl border border-line bg-white p-5">
              <h2 className="mb-2 font-bold">Estado de los indicadores</h2>
              <p>{data.indicators.con_datos_publicados} de {data.indicators.total} indicadores tienen datos publicados · {data.indicators.metodologia_validada} con metodología validada.</p>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface"><div className="h-full bg-green" style={{ width: `${(data.indicators.con_datos_publicados / data.indicators.total) * 100}%` }} /></div>
            </section>
          )}
        </>
      )}
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
      <div className="mb-4 flex items-center gap-3">
        <div><h1 className="text-2xl font-extrabold text-green-dark">Gestión documental</h1><p className="text-sm text-muted">Archivos en almacenamiento privado, con versiones y descargas auditadas. Solo ve los niveles de confidencialidad autorizados para su rol.</p></div>
        {can('documents.upload') && <Button className="ml-auto" onClick={() => setOpen('new')}><Icon name="upload" /> Cargar documento</Button>}
      </div>
      <div className="mb-3 flex flex-wrap gap-3">
        <label className="text-xs font-bold text-muted uppercase">Buscar<input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className={inputCls} /></label>
        <label className="text-xs font-bold text-muted uppercase">Confidencialidad<select value={filters.confidentiality} onChange={(e) => setFilters({ ...filters, confidentiality: e.target.value })} className={inputCls}><option value="">Todas</option>{['publico', 'interno', 'restringido', 'financiero'].map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
        <label className="text-xs font-bold text-muted uppercase">Categoría<select value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })} className={inputCls}><option value="">Todas</option>{cats.map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>)}</select></label>
        <label className="text-xs font-bold text-muted uppercase">Estado<select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className={inputCls}><option value="">Todos</option>{['borrador', 'vigente', 'archivado'].map((v) => <option key={v} value={v}>{label(v)}</option>)}</select></label>
      </div>
      {error && <ErrorBox message={error} />}
      {loading && <Spinner />}
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs text-muted uppercase"><tr><th className="px-3 py-2">Documento</th><th className="px-3 py-2">Categoría</th><th className="px-3 py-2">Confidencialidad</th><th className="px-3 py-2">Dependencia</th><th className="px-3 py-2">Versión</th><th className="px-3 py-2">Cargó</th><th className="px-3 py-2">Actualizado</th><th /></tr></thead>
          <tbody className="divide-y divide-line">
            {data?.data.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-muted">Sin documentos visibles.</td></tr>}
            {data?.data.map((d: Row) => (
              <tr key={d.id}><td className="px-3 py-2 font-semibold">{d.title}</td><td className="px-3 py-2">{d.category?.name}</td><td className="px-3 py-2"><Badge tone={CONF_TONE[d.confidentiality]}>{label(d.confidentiality)}</Badge></td><td className="px-3 py-2">{d.dependency?.code ?? '—'}</td><td className="px-3 py-2">v{d.current_version}</td><td className="px-3 py-2">{d.creator?.name}</td><td className="px-3 py-2">{fmtDateTime(d.updated_at)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap"><a href={admin.url(`documents/${d.id}/download`)} className="mr-3 text-green-dark hover:underline">Descargar</a><button onClick={() => setOpen(d.id)} className="font-semibold text-green-dark hover:underline">Abrir</button></td></tr>
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
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" role="dialog" aria-modal="true" aria-label="Documento">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center"><h2 className="text-lg font-bold">{id ? doc?.title : 'Cargar documento'}</h2><button onClick={onClose} autoFocus className="ml-auto p-2 text-xl" aria-label="Cerrar"><Icon name="close" /></button></div>
        {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><FieldInput def={{ name: 'title', label: 'Título', type: 'text', required: true }} value={form.title} onChange={set('title')} /></div>
          <FieldInput def={{ name: 'category_id', label: 'Categoría', type: 'relation', endpoint: 'document-categories', required: true }} value={form.category_id} onChange={set('category_id')} />
          <FieldInput def={{ name: 'confidentiality', label: 'Confidencialidad', type: 'select', help: id ? undefined : 'Si se deja vacío se usa la de la categoría.', options: ['publico', 'interno', 'restringido', 'financiero'].map((v) => ({ value: v, label: label(v) })) }} value={form.confidentiality} onChange={set('confidentiality')} />
          <FieldInput def={{ name: 'dependency_id', label: 'Dependencia', type: 'relation', endpoint: 'dependencies', optionLabel: (o) => `${o.code} — ${o.name}` }} value={form.dependency_id} onChange={set('dependency_id')} />
          <FieldInput def={{ name: 'status', label: 'Estado', type: 'select', options: ['borrador', 'vigente', 'archivado'].map((v) => ({ value: v, label: label(v) })) }} value={form.status} onChange={set('status')} />
          <FieldInput def={{ name: 'related_type', label: 'Asociado a', type: 'select', options: [['project', 'Proyecto'], ['agreement', 'Convenio'], ['cat', 'CAT'], ['submission', 'Lote de datos'], ['petty_cash', 'Caja menor']].map(([value, l]) => ({ value, label: l })) }} value={form.related_type} onChange={set('related_type')} />
          <FieldInput def={{ name: 'related_id', label: 'Identificador del registro asociado', type: 'number' }} value={form.related_id} onChange={set('related_id')} />
          <div className="md:col-span-2"><FieldInput def={{ name: 'description', label: 'Descripción', type: 'textarea' }} value={form.description} onChange={set('description')} /></div>
          {!id && <label className="text-sm font-semibold md:col-span-2">Archivo (PDF, Word, Excel, PowerPoint, ODF, CSV, JPG, PNG)<input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={inputCls} /></label>}
        </div>
        {(can('documents.upload') || can('documents.edit')) && <Button className="mt-4 self-start" onClick={save}><Icon name="check" /> {id ? 'Guardar metadatos' : 'Cargar'}</Button>}
        {id && doc && (
          <section className="mt-6">
            <h3 className="mb-2 font-bold">Versiones</h3>
            <ul className="space-y-1 text-sm">{doc.versions.map((v: Row) => <li key={v.id} className="flex flex-wrap gap-2"><strong>v{v.version_no}</strong> {v.file?.original_name} · {fmtBytes(v.file?.size_bytes)} · {v.uploader?.name} · {fmtDateTime(v.created_at)} · {v.change_note}<a href={admin.url(`documents/${id}/download/${v.version_no}`)} className="text-green-dark hover:underline">Descargar</a></li>)}</ul>
            {can('documents.upload') && (
              <div className="mt-3 grid gap-2 rounded-lg border border-dashed border-line p-3 md:grid-cols-[1fr_1fr_auto]">
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" aria-label="Archivo de la nueva versión" />
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
      <div className="mb-4 flex items-center gap-3"><h1 className="text-2xl font-extrabold text-green-dark">Usuarios</h1>
        {can('users.manage') && <Button className="ml-auto" onClick={() => { setMsg(null); setOpen({ name: '', email: '', password: '', is_active: true, role_ids: [], dependency_ids: [] }); }}><Icon name="plus" /> Nuevo usuario</Button>}</div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o correo" className={`${inputCls} mb-3 max-w-sm`} />
      {loading && <Spinner />}{error && <ErrorBox message={error} />}
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs text-muted uppercase"><tr><th className="px-3 py-2">Nombre</th><th className="px-3 py-2">Correo</th><th className="px-3 py-2">Roles</th><th className="px-3 py-2">Dependencias</th><th className="px-3 py-2">2FA</th><th className="px-3 py-2">Último acceso</th><th className="px-3 py-2">Estado</th><th /></tr></thead>
          <tbody className="divide-y divide-line">{data?.data.map((u: Row) => (
            <tr key={u.id}><td className="px-3 py-2 font-semibold">{u.name}</td><td className="px-3 py-2">{u.email}</td><td className="px-3 py-2">{u.roles.map((r: Row) => r.name).join(', ')}</td><td className="px-3 py-2">{u.dependencies.map((d: Row) => d.code).join(', ')}</td><td className="px-3 py-2">{u.mfa_enabled ? <Badge tone="green">Activo</Badge> : <Badge>No</Badge>}</td><td className="px-3 py-2">{fmtDateTime(u.last_login_at) || '—'}</td><td className="px-3 py-2">{u.is_active ? <Badge tone="green">Activo</Badge> : <Badge tone="red">Inactivo</Badge>}</td>
              <td className="px-3 py-2 text-right">{can('users.manage') && <button className="font-semibold text-green-dark hover:underline" onClick={() => { setMsg(null); setOpen({ ...u, password: '', role_ids: u.roles.map((r: Row) => r.id), dependency_ids: u.dependencies.map((d: Row) => d.id) }); }}>Editar</button>}</td></tr>
          ))}</tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30" role="dialog" aria-modal="true" aria-label="Usuario">
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
      <div className="mb-4 flex items-center gap-3"><div><h1 className="text-2xl font-extrabold text-green-dark">Roles y permisos</h1><p className="text-sm text-muted">Control de acceso basado en roles. Los permisos son independientes y configurables; ningún rol tiene acceso ilimitado.</p></div>
        {can('roles.manage') && <Button className="ml-auto" onClick={() => setEdit({ code: '', name: '', description: '', permission_ids: [] })}><Icon name="plus" /> Nuevo rol</Button>}</div>
      {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {data?.map((r) => (
          <div key={r.id} className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-start gap-2"><div><p className="font-bold">{r.name}</p><p className="text-xs text-muted">{r.code} · {r.users_count} usuario(s)</p></div>
              {can('roles.manage') && !mine.has(r.id) && <button className="ml-auto text-sm font-semibold text-green-dark hover:underline" onClick={() => setEdit({ ...r, permission_ids: r.permissions.map((p: Row) => p.id) })}>Editar</button>}</div>
            <p className="mt-1 text-sm text-muted">{r.description}</p>
            <p className="mt-2 flex flex-wrap gap-1">{r.permissions.map((p: Row) => <Badge key={p.id}>{p.code}</Badge>)}</p>
          </div>
        ))}
      </div>
      {edit && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30" role="dialog" aria-modal="true" aria-label="Rol">
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-3 flex"><h2 className="text-lg font-bold">{edit.id ? 'Editar rol' : 'Nuevo rol'}</h2><button autoFocus className="ml-auto p-2 text-xl" onClick={() => setEdit(null)} aria-label="Cerrar"><Icon name="close" /></button></div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold">Código<input value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value })} className={inputCls} /></label>
              <label className="text-sm font-semibold">Nombre<input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className={inputCls} /></label>
              <label className="text-sm font-semibold md:col-span-2">Descripción<textarea value={edit.description ?? ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className={inputCls} /></label>
            </div>
            {Object.entries(groups).map(([g, ps]) => (
              <fieldset key={g} className="mt-4"><legend className="font-bold">{g}</legend>
                {ps.map((p) => <label key={p.id} className="flex items-start gap-2 py-0.5 text-sm"><input type="checkbox" className="mt-1" checked={edit.permission_ids.includes(p.id)} onChange={(e) => setEdit({ ...edit, permission_ids: e.target.checked ? [...edit.permission_ids, p.id] : edit.permission_ids.filter((x: number) => x !== p.id) })} /><span><code className="text-xs">{p.code}</code> — {p.description}</span></label>)}
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

export function Audit() {
  const [f, setF] = useState({ action: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const { data, loading, error } = useAsync(() => admin.get<Row>('audit', { ...f, page }), [JSON.stringify(f), page]);
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-green-dark">Registro de auditoría</h1>
      <p className="mb-4 text-sm text-muted">Inicios de sesión, intentos fallidos, cambios de permisos, publicaciones, descargas de documentos privados y exportaciones. Registro de solo inserción.</p>
      <div className="mb-3 flex flex-wrap gap-3">
        <label className="text-xs font-bold text-muted uppercase">Acción<input value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })} placeholder="auth.login" className={inputCls} /></label>
        <label className="text-xs font-bold text-muted uppercase">Desde<input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} className={inputCls} /></label>
        <label className="text-xs font-bold text-muted uppercase">Hasta<input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} className={inputCls} /></label>
      </div>
      {loading && <Spinner />}{error && <ErrorBox message={error} />}
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-left text-sm"><thead className="bg-surface text-xs text-muted uppercase"><tr><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Usuario</th><th className="px-3 py-2">Acción</th><th className="px-3 py-2">Entidad</th><th className="px-3 py-2">Detalle</th><th className="px-3 py-2">IP</th></tr></thead>
          <tbody className="divide-y divide-line">{data?.data.map((a: Row) => <tr key={a.id}><td className="px-3 py-1.5 whitespace-nowrap">{fmtDateTime(a.created_at)}</td><td className="px-3 py-1.5">{a.user?.name ?? '—'}</td><td className="px-3 py-1.5"><code>{a.action}</code></td><td className="px-3 py-1.5">{a.entity_type ? `${a.entity_type} #${a.entity_id}` : '—'}</td><td className="max-w-xs truncate px-3 py-1.5 text-xs text-muted" title={JSON.stringify(a.meta)}>{a.meta ? JSON.stringify(a.meta) : ''}</td><td className="px-3 py-1.5">{a.ip}</td></tr>)}</tbody>
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
  useEffect(() => { if (data) setForm({ ...data, mfa_enforced: data.mfa_enforced === '1', news_requires_review: data.news_requires_review === '1' }); }, [data]);
  if (error) return <ErrorBox message={error} />;
  if (!form) return <Spinner />;
  const t = (k: string, l: string, type: 'text' | 'textarea' | 'number' | 'checkbox' | 'image' = 'text', help?: string) => <FieldInput def={{ name: k, label: l, type, help }} value={form[k]} onChange={(v) => setForm({ ...form, [k]: v })} />;
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold text-green-dark">Configuración del sistema</h1>
      {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
      <section className="grid gap-4 rounded-xl border border-line bg-white p-5 md:grid-cols-2">
        <h2 className="font-bold md:col-span-2">Identidad y contacto</h2>
        {t('site_name', 'Nombre del sitio')}{t('university_name', 'Universidad')}
        {t('contact_address', 'Dirección')}{t('contact_phone', 'Teléfono')}{t('contact_email', 'Correo')}
        <div className="md:col-span-2">{t('logo_file_id', 'Logotipo oficial (reemplaza el temporal extraído del boceto)', 'image')}</div>
        <div className="md:col-span-2">{t('hero_title', 'Título institucional del inicio')}</div>
        <div className="md:col-span-2">{t('hero_text', 'Descripción breve del inicio', 'textarea')}</div>
        <div className="md:col-span-2">{t('official_links', 'Enlaces oficiales (JSON)', 'textarea', 'Formato: [{"label":"Universidad del Tolima","url":"https://www.ut.edu.co"}]')}</div>
        <div className="md:col-span-2">{t('social_links', 'Redes sociales (JSON)', 'textarea', 'Mismo formato.')}</div>
      </section>
      <section className="grid gap-4 rounded-xl border border-line bg-white p-5 md:grid-cols-2">
        <h2 className="font-bold md:col-span-2">Seguridad y publicación</h2>
        {t('max_upload_mb', 'Tamaño máximo de archivo (MB)', 'number')}
        {t('min_cell_size', 'Umbral general de supresión de celdas pequeñas (k)', 'number')}
        {t('mfa_enforced', 'Exigir verificación en dos pasos a todos los usuarios del panel', 'checkbox')}
        {t('news_requires_review', 'Los contenidos requieren revisión antes de publicarse', 'checkbox')}
      </section>
      <Button onClick={async () => { setMsg(null); try { const { logo_file_id, ...rest } = form; await admin.put('settings', { ...rest, logo_file_id: logo_file_id ? Number(logo_file_id) : null, max_upload_mb: Number(form.max_upload_mb), min_cell_size: Number(form.min_cell_size) }); setMsg({ k: 'ok', t: 'Configuración guardada.' }); } catch (e) { setMsg({ k: 'error', t: errorText(e) }); } }}><Icon name="check" /> Guardar</Button>
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
      <h1 className="text-2xl font-extrabold text-green-dark">Informes y exportaciones</h1>
      {can('reports.internal.export') && (
        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-bold">Informe interno de indicadores</h2>
          <p className="mb-3 text-sm text-muted">Incluye datos aprobados aún no publicados. Respeta su rol: sin el permiso financiero se excluye el módulo de gestión financiera; los coordinadores solo exportan sus dependencias. Cada exportación queda auditada.</p>
          <div className="grid gap-3 md:grid-cols-3">
            {sel('module_id', 'Módulo', (mods.data ?? []).map((m) => ({ v: String(m.id), l: `${m.number}. ${m.name}` })))}
            {sel('period', 'Período', periods.map((p) => ({ v: String(p.code), l: String(p.code) })))}
            {sel('cat', 'CAT', cats.map((c) => ({ v: String(c.id), l: String(c.name) })))}
            {sel('program', 'Programa', programs.map((c) => ({ v: String(c.id), l: String(c.name) })))}
            <label className="text-xs font-bold text-muted uppercase">Formato<select value={f.format} onChange={(e) => setF({ ...f, format: e.target.value })} className={inputCls}><option value="xlsx">Excel</option><option value="csv">CSV</option></select></label>
          </div>
          <a href={admin.url('reports/indicators', f)} className="mt-4 inline-flex items-center gap-1 rounded-lg bg-green-dark px-4 py-2 text-sm font-semibold text-white hover:bg-green"><Icon name="download" /> Generar informe</a>
          <p className="mt-3 text-xs text-muted">Para un informe en PDF, abra el módulo correspondiente en el portal público y use «Imprimir / PDF».</p>
        </section>
      )}
      {can('petty_cash.view') && (
        <section className="rounded-xl border border-line bg-white p-5">
          <h2 className="font-bold">Informe de caja menor</h2>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <label className="text-xs font-bold text-muted uppercase">Presupuesto<select value={pc} onChange={(e) => setPc(e.target.value)} className={inputCls}><option value="">Todos</option>{budgets.map((b) => <option key={String(b.id)} value={String(b.id)}>{String(b.year)} — {String(b.name)}</option>)}</select></label>
            <a href={admin.url('reports/petty-cash', { budget_id: pc, format: 'xlsx' })} className="inline-flex items-center gap-1 rounded-lg bg-green-dark px-4 py-2 text-sm font-semibold text-white hover:bg-green"><Icon name="download" /> Excel</a>
          </div>
        </section>
      )}
      {!can('reports.internal.export') && !can('petty_cash.view') && <Notice kind="info">Su rol no tiene informes asignados.</Notice>}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { admin, errorText } from '../../shared/api';
import { fmtDateTime, fmtValue, label } from '../../shared/format';
import { Icon } from '../../shared/icons';
import { Badge, ErrorBox, Spinner, useAsync } from '../../shared/ui';
import { useAuth } from '../auth';
import { Button, FieldInput, inputCls, Notice, useOptions } from '../components/Form';
import { StatusBadge } from '../components/ResourcePage';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const DIMS: { key: string; col: string; label: string; endpoint?: string; opt?: (o: Row) => string }[] = [
  { key: 'program', col: 'program_id', label: 'Programa', endpoint: 'programs' },
  { key: 'cat', col: 'cat_id', label: 'CAT', endpoint: 'cats' },
  { key: 'department', col: 'department_id', label: 'Departamento', endpoint: 'departments' },
  { key: 'municipality', col: 'municipality_id', label: 'Municipio', endpoint: 'municipalities' },
  { key: 'level', col: 'level_id', label: 'Nivel', endpoint: 'education-levels' },
  { key: 'area', col: 'area_id', label: 'Área', endpoint: 'knowledge-areas' },
  { key: 'classifier', col: 'classifier_item_id', label: 'Categoría' },
];

export function IndicatorList() {
  const { can } = useAuth();
  const [module, setModule] = useState('');
  const [q, setQ] = useState('');
  const [mine, setMine] = useState(false);
  const mods = useAsync(() => admin.get<Row[]>('indicator-modules'), []);
  const { data, error, loading } = useAsync(() => admin.get<Row[]>('indicators', { module_id: module, q, mine: mine ? 1 : undefined }), [module, q, mine]);
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-green-dark">Catálogo de indicadores</h1>
      <p className="mb-4 text-sm text-muted">76 indicadores del documento «Indicadores sugeridos». Desde aquí se edita su ficha técnica y se registran sus datos.</p>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="text-xs font-bold text-muted uppercase">Módulo
          <select value={module} onChange={(e) => setModule(e.target.value)} className={inputCls}><option value="">Todos</option>{mods.data?.map((m) => <option key={m.id} value={m.id}>{m.number}. {m.name}</option>)}</select>
        </label>
        <label className="text-xs font-bold text-muted uppercase">Buscar<input value={q} onChange={(e) => setQ(e.target.value)} className={inputCls} /></label>
        {can('indicators.submit') && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Solo mis dependencias</label>}
      </div>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs text-muted uppercase"><tr><th className="px-3 py-2">Código</th><th className="px-3 py-2">Indicador</th><th className="px-3 py-2">Responsable</th><th className="px-3 py-2">Metodología</th><th className="px-3 py-2">Publicación</th><th className="px-3 py-2">Último lote</th><th /></tr></thead>
          <tbody className="divide-y divide-line">
            {data?.map((i) => (
              <tr key={i.id} className="hover:bg-surface/60">
                <td className="px-3 py-2 font-bold text-green-dark">{i.code}</td>
                <td className="px-3 py-2">{i.name}{i.pending_count > 0 && <Badge tone="amber">{i.pending_count} por revisar</Badge>}</td>
                <td className="px-3 py-2">{i.responsible_dependency?.code ?? '—'}</td>
                <td className="px-3 py-2"><Badge tone={i.methodology_status === 'validada' ? 'green' : 'amber'}>{label(i.methodology_status)}</Badge></td>
                <td className="px-3 py-2">{label(i.publication_level)}{!i.publication_authorized && <Badge tone="red">Sin autorizar</Badge>}</td>
                <td className="px-3 py-2">{i.last_submission ? <StatusBadge s={i.last_submission.status} /> : <span className="text-muted">Sin datos</span>}</td>
                <td className="px-3 py-2 text-right"><Link to={`/indicadores/${i.id}`} className="font-semibold text-green-dark hover:underline">Abrir</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function IndicatorDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const nav = useNavigate();
  const { data, error, loading, reload } = useAsync(() => admin.get<Row>(`indicators/${id}`), [id]);
  const subs = useAsync(() => admin.get<{ data: Row[] }>('submissions', { indicator_id: id, per_page: 50 }), [id]);
  const [form, setForm] = useState<Row | null>(null);
  const [msg, setMsg] = useState<{ k: 'ok' | 'error'; t: string } | null>(null);
  useEffect(() => { if (data) setForm({ ...data, source_ids: data.sources.map((s: Row) => s.id) }); }, [data]);
  if (loading) return <Spinner />;
  if (error || !data || !form) return <ErrorBox message={error ?? 'Error'} />;
  const editable = can('indicators.catalog.manage');
  const f = (name: string, lbl: string, type: Parameters<typeof FieldInput>[0]['def']['type'], extra: Row = {}) => (
    <FieldInput def={{ name, label: lbl, type, ...extra }} value={form[name]} onChange={(v) => setForm({ ...form, [name]: v })} />
  );
  const save = async () => { setMsg(null); try { await admin.put(`indicators/${id}`, form); setMsg({ k: 'ok', t: 'Ficha técnica guardada.' }); reload(); } catch (e) { setMsg({ k: 'error', t: errorText(e) }); } };
  const newSub = async (supersedes?: number) => {
    try { const s = await admin.post<Row>('submissions', { indicator_id: Number(id), title: supersedes ? 'Corrección de lote publicado' : 'Nueva carga', supersedes_id: supersedes ?? null }); nav(`/cargas/${s.id}`); } catch (e) { setMsg({ k: 'error', t: errorText(e) }); }
  };
  const p = data.internal_preview;
  return (
    <div className="space-y-6">
      <div>
        <Link to="/indicadores" className="text-sm text-green-dark hover:underline">← Catálogo</Link>
        <h1 className="text-2xl font-extrabold text-green-dark">{data.code} · {data.name}</h1>
        <p className="text-sm text-muted">{data.module.number}. {data.module.name} · Fuente (Excel): {data.source_text}</p>
      </div>
      {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
      <section className="rounded-xl border border-line bg-white p-5">
        <div className="mb-3 flex items-center gap-2"><h2 className="font-bold">Datos registrados</h2>
          {can('indicators.submit') && <Button className="ml-auto" onClick={() => newSub()}><Icon name="plus" /> Nueva carga de datos</Button>}
          {can('indicators.submit') && <a href={admin.url(`indicators/${id}/template`)} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-green"><Icon name="download" /> Plantilla Excel</a>}
        </div>
        <p className="mb-3 text-sm text-muted">Vista interna (incluye datos aprobados no publicados): {p.row_count} valores; último total {p.kpi ? `${fmtValue(p.kpi.value, data.value_type)} (${p.kpi.period})` : '—'}.</p>
        <table className="w-full text-sm"><thead className="text-xs text-muted uppercase"><tr><th className="py-1 text-left">Lote</th><th className="text-left">Estado</th><th className="text-left">Valores</th><th className="text-left">Registró</th><th className="text-left">Publicado</th><th /></tr></thead>
          <tbody className="divide-y divide-line">{subs.data?.data.map((s) => (
            <tr key={s.id}><td className="py-1.5">#{s.id} {s.title}{s.is_demo && <Badge tone="amber">Demo</Badge>}</td><td><StatusBadge s={s.status} /></td><td>{s.values_count}</td><td>{s.creator?.name}</td><td>{fmtDateTime(s.published_at)}</td>
              <td className="text-right"><Link to={`/cargas/${s.id}`} className="font-semibold text-green-dark hover:underline">Abrir</Link>{s.status === 'publicado' && can('indicators.submit') && <button onClick={() => newSub(s.id)} className="ml-3 text-sm text-ut-red hover:underline">Corregir</button>}</td></tr>
          ))}</tbody>
        </table>
      </section>
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="mb-3 font-bold">Ficha técnica {!editable && <span className="text-sm font-normal text-muted">(solo lectura)</span>}</h2>
        <fieldset disabled={!editable} className="grid gap-4 md:grid-cols-2">
          {f('name', 'Nombre', 'text')}
          {f('unit', 'Unidad de medida', 'text')}
          <div className="md:col-span-2">{f('description', 'Descripción pública', 'textarea')}</div>
          {f('value_type', 'Tipo de valor', 'select', { options: [['count', 'Conteo'], ['percent', 'Porcentaje'], ['currency', 'Pesos'], ['ratio', 'Razón'], ['number', 'Número (promedio, puntaje…)']].map(([value, l]) => ({ value, label: l })) })}
          {f('periodicity', 'Periodicidad', 'select', { options: ['semestral', 'anual', 'vigencia', 'cohorte', 'eventual'].map((v) => ({ value: v, label: label(v) })) })}
          {f('chart_type', 'Visualización', 'select', { options: [['bar', 'Barras'], ['line', 'Líneas'], ['stacked', 'Barras apiladas'], ['distribution', 'Distribución porcentual'], ['kpi', 'Cifras destacadas'], ['table', 'Tabla'], ['map', 'Mapa'], ['progress', 'Avance']].map(([value, l]) => ({ value, label: l })) })}
          {f('group_by', 'Desagregación principal del gráfico', 'select', { options: DIMS.map((d) => ({ value: d.key, label: d.label })) })}
          {f('classifier_id', 'Clasificador de categorías', 'relation', { endpoint: 'classifiers' })}
          <div>
            <p className="text-sm font-semibold">Desagregaciones admitidas</p>
            <div className="mt-1 flex flex-wrap gap-3">{DIMS.map((d) => <label key={d.key} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={form.allowed_dimensions.includes(d.key)} onChange={(e) => setForm({ ...form, allowed_dimensions: e.target.checked ? [...form.allowed_dimensions, d.key] : form.allowed_dimensions.filter((x: string) => x !== d.key) })} />{d.label}</label>)}</div>
          </div>
          {f('publication_level', 'Nivel de publicación', 'select', { options: ['PUB', 'AGR', 'AGR_S', 'MIX'].map((v) => ({ value: v, label: label(v) })) })}
          {f('min_cell_size', 'Umbral de supresión de celdas (k)', 'number')}
          {f('responsible_dependency_id', 'Dependencia responsable', 'relation', { endpoint: 'dependencies', optionLabel: (o: Row) => `${o.code} — ${o.name}` })}
          {f('methodology_status', 'Estado de la metodología', 'select', { options: [{ value: 'pendiente', label: 'Pendiente de validación' }, { value: 'validada', label: 'Validada' }] })}
          <div className="md:col-span-2">{f('methodology', 'Metodología de cálculo (definición y fórmula institucional)', 'textarea')}</div>
          <div className="md:col-span-2">{f('observations', 'Observaciones', 'textarea')}</div>
          <div className="md:col-span-2">{f('source_ids', 'Fuentes de información', 'multirelation', { endpoint: 'data-sources', optionLabel: (o: Row) => `${o.code} — ${o.name}` })}</div>
          {f('publication_authorized', 'Publicación autorizada en el portal', 'checkbox', { help: 'Obligatorio para datos sensibles (AGR_S)' })}
          {f('is_active', 'Activo', 'checkbox')}
        </fieldset>
        {editable && <Button className="mt-4" onClick={save}><Icon name="check" /> Guardar ficha técnica</Button>}
      </section>
    </div>
  );
}

/** Editor de un lote: valores por período y dimensiones, importación, envío, revisión y publicación. */
export function SubmissionDetail() {
  const { id } = useParams();
  const { can, me } = useAuth();
  const { data: s, error, loading, reload } = useAsync(() => admin.get<Row>(`submissions/${id}`), [id]);
  const periods = useOptions('periods');
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<{ k: 'ok' | 'error'; t: string } | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (s) setRows(s.values.map((v: Row) => ({ ...v }))); }, [s]);
  if (loading) return <Spinner />;
  if (error || !s) return <ErrorBox message={error ?? 'Error'} />;
  const ind = s.indicator;
  const dims = DIMS.filter((d) => ind.allowed_dimensions.includes(d.key));
  const editable = ['borrador', 'devuelto'].includes(s.status) && can('indicators.submit');
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg({ k: 'ok', t: ok }); setComment(''); reload(); } catch (e) { setMsg({ k: 'error', t: errorText(e) }); } finally { setBusy(false); }
  };
  const ownSub = s.created_by === me?.user.id || s.submitted_by === me?.user.id;
  return (
    <div className="space-y-5">
      <div>
        <Link to={`/indicadores/${ind.id}`} className="text-sm text-green-dark hover:underline">← {ind.code} {ind.name}</Link>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold text-green-dark">Lote #{s.id} <StatusBadge s={s.status} />{s.is_demo && <Badge tone="amber">Demo</Badge>}</h1>
        <p className="text-sm text-muted">Registró: {s.creator?.name} · Envió: {s.submitter?.name ?? '—'} ({fmtDateTime(s.submitted_at)}) · Aprobó: {s.approver?.name ?? '—'} ({fmtDateTime(s.approved_at)}) · Publicó: {s.publisher?.name ?? '—'} ({fmtDateTime(s.published_at)})</p>
        {s.supersedes_id && <p className="text-sm text-amber-800">Corrige y reemplazará al lote #{s.supersedes_id} al publicarse.</p>}
      </div>
      {msg && <Notice kind={msg.k}>{msg.t}</Notice>}

      <section className="rounded-xl border border-line bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="font-bold">Valores ({rows.length})</h2>
          <span className="text-xs text-muted">Desagregaciones admitidas: {dims.map((d) => d.label).join(', ') || 'ninguna (solo total por período)'} · Unidad: {ind.unit}</span>
          {editable && (
            <div className="ml-auto flex flex-wrap gap-2">
              <a href={admin.url(`indicators/${ind.id}/template`)} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-green"><Icon name="download" /> Plantilla</a>
              {can('indicators.import') && (
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-green"><Icon name="upload" /> Importar Excel/CSV
                  <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) run(() => admin.upload(`submissions/${id}/import`, f), 'Archivo importado y validado. Los valores anteriores del lote fueron reemplazados.'); e.target.value = ''; }} />
                </label>
              )}
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs text-muted uppercase"><tr><th className="px-2 py-2 text-left">Período</th>{dims.map((d) => <th key={d.key} className="px-2 py-2 text-left">{d.label}</th>)}<th className="px-2 py-2 text-right">Valor</th><th className="px-2 py-2 text-left">Nota</th><th /></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="px-1 py-1"><select disabled={!editable} value={r.period_id ?? ''} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, period_id: Number(e.target.value) } : x)))} className="rounded border border-line px-1 py-1"><option value="">—</option>{periods.map((p) => <option key={String(p.id)} value={String(p.id)}>{String(p.code)}</option>)}</select></td>
                  {dims.map((d) => <td key={d.key} className="px-1 py-1"><DimSelect d={d} items={ind.classifier?.items ?? []} value={r[d.col]} disabled={!editable} onChange={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, [d.col]: v } : x)))} /></td>)}
                  <td className="px-1 py-1 text-right"><input disabled={!editable} type="number" step="any" value={r.value ?? ''} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} className="w-32 rounded border border-line px-2 py-1 text-right" />{r.is_suppressed && <span className="block text-xs text-amber-800">Reservado al publicar</span>}</td>
                  <td className="px-1 py-1"><input disabled={!editable} value={r.note ?? ''} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} className="w-40 rounded border border-line px-2 py-1" /></td>
                  <td>{editable && <button aria-label="Quitar fila" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="p-1 text-ut-red"><Icon name="trash" /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editable && (
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => setRows([...rows, { period_id: rows.at(-1)?.period_id ?? null, value: null }])}><Icon name="plus" /> Agregar fila</Button>
            <Button disabled={busy} onClick={() => run(() => admin.put(`submissions/${id}/values`, { values: rows.map((r) => ({ period_id: r.period_id, value: r.value, note: r.note, ...Object.fromEntries(dims.map((d) => [d.col, r[d.col] ?? null])) })) }), 'Valores validados y guardados.')}><Icon name="check" /> Guardar valores</Button>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-line bg-white p-5">
        <h2 className="font-bold">Flujo de revisión y publicación</h2>
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentario (obligatorio para devolver)" className={inputCls} />
        <div className="flex flex-wrap gap-2">
          {editable && <Button disabled={busy} onClick={() => run(() => admin.post(`submissions/${id}/submit`, { comment }), 'Lote enviado a revisión.')}>Enviar a revisión</Button>}
          {s.status === 'enviado' && can('indicators.review') && !ownSub && <>
            <Button disabled={busy} onClick={() => run(() => admin.post(`submissions/${id}/review`, { decision: 'aprobado', comment }), 'Lote aprobado.')}>Aprobar</Button>
            <Button variant="danger" disabled={busy} onClick={() => run(() => admin.post(`submissions/${id}/review`, { decision: 'devuelto', comment }), 'Lote devuelto para corrección.')}>Devolver</Button>
          </>}
          {s.status === 'enviado' && can('indicators.review') && ownSub && <Notice kind="info">Separación de funciones: otra persona debe revisar este lote.</Notice>}
          {s.status === 'aprobado' && can('indicators.publish') && <Button disabled={busy} onClick={() => run(() => admin.post(`submissions/${id}/publish`), 'Lote publicado en el portal.')}>Publicar en el portal</Button>}
          {s.status === 'publicado' && can('indicators.publish') && <Button variant="danger" disabled={busy} onClick={() => run(() => admin.post(`submissions/${id}/unpublish`, { comment }), 'Lote retirado del portal.')}>Retirar del portal</Button>}
          {s.status === 'borrador' && can('indicators.submit') && <Button variant="ghost" className="text-ut-red" onClick={async () => { if (confirm('¿Eliminar el borrador?')) { await admin.del(`submissions/${id}`); history.back(); } }}>Eliminar borrador</Button>}
        </div>
        <ol className="space-y-1 text-sm">{s.reviews.map((r: Row) => <li key={r.id}>{fmtDateTime(r.created_at)} · <StatusBadge s={r.decision} /> · {r.reviewer?.name}{r.comment ? ` — «${r.comment}»` : ''}</li>)}</ol>
        {s.source_note && <p className="text-sm text-muted">Nota de fuente: {s.source_note}</p>}
      </section>
    </div>
  );
}

function DimSelect({ d, items, value, onChange, disabled }: { d: (typeof DIMS)[number]; items: Row[]; value: unknown; onChange: (v: number | null) => void; disabled: boolean }) {
  const opts = useOptions(d.endpoint);
  const list: Row[] = d.key === 'classifier' ? items.map((i) => ({ id: i.id, name: i.label })) : opts;
  return (
    <select disabled={disabled} value={value === null || value === undefined ? '' : String(value)} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} className="max-w-[12rem] rounded border border-line px-1 py-1">
      <option value="">(total)</option>
      {list.map((o) => <option key={String(o.id)} value={String(o.id)}>{String(o.name ?? o.label ?? o.code)}</option>)}
    </select>
  );
}

export function SubmissionList() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, loading } = useAsync(() => admin.get<Row>('submissions', { status, page }), [status, page]);
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-green-dark">Cargas de datos</h1>
      <p className="mb-4 text-sm text-muted">Lotes de datos de indicadores y su estado en el flujo: borrador → enviado → aprobado → publicado.</p>
      <label className="mb-3 inline-block text-xs font-bold text-muted uppercase">Estado
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={inputCls}><option value="">Todos</option>{['borrador', 'enviado', 'devuelto', 'aprobado', 'publicado', 'reemplazado', 'retirado'].map((v) => <option key={v} value={v}>{label(v)}</option>)}</select>
      </label>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs text-muted uppercase"><tr><th className="px-3 py-2">Lote</th><th className="px-3 py-2">Indicador</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Valores</th><th className="px-3 py-2">Registró</th><th className="px-3 py-2">Actualizado</th><th /></tr></thead>
          <tbody className="divide-y divide-line">{data?.data.map((s: Row) => (
            <tr key={s.id}><td className="px-3 py-2">#{s.id}{s.is_demo && <Badge tone="amber">Demo</Badge>}</td><td className="px-3 py-2">{s.indicator?.code} {s.indicator?.name}</td><td className="px-3 py-2"><StatusBadge s={s.status} /></td><td className="px-3 py-2">{s.values_count}</td><td className="px-3 py-2">{s.creator?.name}</td><td className="px-3 py-2">{fmtDateTime(s.updated_at)}</td><td className="px-3 py-2 text-right"><Link to={`/cargas/${s.id}`} className="font-semibold text-green-dark hover:underline">Abrir</Link></td></tr>
          ))}</tbody>
        </table>
      </div>
      {data && data.last_page > 1 && <div className="mt-3 flex justify-end gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button><span className="self-center text-sm">{page} / {data.last_page}</span><Button variant="secondary" disabled={page >= data.last_page} onClick={() => setPage(page + 1)}>Siguiente</Button></div>}
    </div>
  );
}

import { useEffect, useId, useState, type ReactNode } from 'react';
import { admin, errorText } from '../../shared/api';
import { Icon } from '../../shared/icons';

/** Definición declarativa de campos de formulario del panel. */
export type FieldDef = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'html' | 'number' | 'date' | 'datetime' | 'select' | 'relation' | 'multirelation' | 'checkbox' | 'image' | 'repeater' | 'email' | 'url' | 'password';
  required?: boolean;
  help?: string;
  options?: { value: string; label: string }[];
  /** Para relation/multirelation: endpoint del panel y forma de mostrar cada opción. */
  endpoint?: string;
  optionLabel?: (o: Record<string, unknown>) => string;
  /** Para repeater: subcampos. */
  fields?: FieldDef[];
  full?: boolean;
  step?: string;
};

export const inputCls = 'mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-ut-red focus:ring-2 focus:ring-ut-red/20 focus:outline-none disabled:bg-surface';

const optionCache = new Map<string, Promise<Record<string, unknown>[]>>();
export function useOptions(endpoint?: string) {
  const [opts, setOpts] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    if (!endpoint) return;
    if (!optionCache.has(endpoint)) {
      optionCache.set(endpoint, admin.get<{ data?: Record<string, unknown>[] } | Record<string, unknown>[]>(endpoint, { per_page: 200 })
        .then((r) => (Array.isArray(r) ? r : r.data ?? [])).catch(() => { optionCache.delete(endpoint); return []; }));
    }
    optionCache.get(endpoint)!.then(setOpts);
  }, [endpoint]);
  return opts;
}
export const clearOptionCache = () => optionCache.clear();

const toLocalInput = (v: unknown) => (typeof v === 'string' && v ? v.slice(0, 16).replace(' ', 'T') : '');

function ImageField({ value, onChange, url }: { value: unknown; onChange: (v: unknown) => void; url?: string | null }) {
  const [preview, setPreview] = useState<string | null>(url ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => setPreview(url ?? null), [url]);
  return (
    <div className="mt-1 flex flex-wrap items-center gap-3">
      {preview ? <img src={preview} alt="" className="h-20 w-32 rounded border border-line object-cover" /> : <div className="grid h-20 w-32 place-items-center rounded border border-dashed border-line text-xs text-muted">Sin imagen</div>}
      <label className="cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-ut-red">
        {busy ? 'Subiendo…' : 'Cargar imagen (JPG, PNG, WebP)'}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true); setErr(null);
          try { const r = await admin.upload<{ id: number; url: string }>('uploads/image', f); onChange(r.id); setPreview(r.url); } catch (x) { setErr(errorText(x)); } finally { setBusy(false); }
        }} />
      </label>
      {value ? <button type="button" onClick={() => { onChange(null); setPreview(null); }} className="text-sm text-ut-red hover:underline">Quitar</button> : null}
      {err && <p className="w-full text-sm text-ut-red">{err}</p>}
    </div>
  );
}

function Repeater({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const rows = (Array.isArray(value) ? value : []) as Record<string, unknown>[];
  const set = (i: number, k: string, v: unknown) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div className="mt-1 space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-surface/50 p-2">
          {def.fields!.map((f) => (
            <div key={f.name} className="min-w-[8rem] flex-1">
              <FieldInput def={{ ...f, label: f.label }} value={r[f.name]} onChange={(v) => set(i, f.name, v)} compact />
            </div>
          ))}
          <button type="button" aria-label="Quitar fila" onClick={() => onChange(rows.filter((_, j) => j !== i))} className="mb-1 rounded p-2 text-ut-red hover:bg-ut-red-50"><Icon name="trash" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, Object.fromEntries(def.fields!.map((f) => [f.name, f.type === 'checkbox' ? true : null]))])}
        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-line px-3 py-1.5 text-sm font-semibold hover:border-ut-red"><Icon name="plus" /> Agregar</button>
    </div>
  );
}

export function FieldInput({ def, value, onChange, error, compact, imageUrl }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void; error?: string; compact?: boolean; imageUrl?: string | null }) {
  const opts = useOptions(def.type === 'relation' || def.type === 'multirelation' ? def.endpoint : undefined);
  const id = `f-${def.name}-${useId()}`;
  const lbl = (o: Record<string, unknown>) => (def.optionLabel ? def.optionLabel(o) : String(o.name ?? o.title ?? o.label ?? o.code ?? o.id));
  let input: ReactNode;
  switch (def.type) {
    case 'textarea':
    case 'html':
      input = <textarea id={id} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} rows={def.type === 'html' ? 10 : 3} className={`${inputCls} ${def.type === 'html' ? 'font-mono text-xs' : ''}`} />;
      break;
    case 'number':
      input = <input id={id} type="number" step={def.step ?? 'any'} value={value === null || value === undefined ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} className={inputCls} />;
      break;
    case 'date':
      input = <input id={id} type="date" value={typeof value === 'string' ? value.slice(0, 10) : ''} onChange={(e) => onChange(e.target.value || null)} className={inputCls} />;
      break;
    case 'datetime':
      input = <input id={id} type="datetime-local" value={toLocalInput(value)} onChange={(e) => onChange(e.target.value ? e.target.value.replace('T', ' ') + ':00' : null)} className={inputCls} />;
      break;
    case 'select':
      input = (
        <select id={id} value={value === null || value === undefined ? '' : String(value)} onChange={(e) => onChange(e.target.value || null)} className={inputCls}>
          <option value="">— Seleccione —</option>
          {def.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
      break;
    case 'relation':
      input = (
        <select id={id} value={value === null || value === undefined ? '' : String(value)} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} className={inputCls}>
          <option value="">— Ninguno —</option>
          {opts.map((o) => <option key={String(o.id)} value={String(o.id)}>{lbl(o)}</option>)}
        </select>
      );
      break;
    case 'multirelation': {
      const sel = new Set(((value as number[]) ?? []).map(Number));
      input = (
        <div className="mt-1 max-h-44 overflow-y-auto rounded-lg border border-line p-2">
          {opts.length === 0 && <p className="text-sm text-muted">Sin opciones.</p>}
          {opts.map((o) => (
            <label key={String(o.id)} className="flex items-center gap-2 py-0.5 text-sm">
              <input type="checkbox" checked={sel.has(Number(o.id))} onChange={(e) => { const n = new Set(sel); if (e.target.checked) n.add(Number(o.id)); else n.delete(Number(o.id)); onChange([...n]); }} />
              {lbl(o)}
            </label>
          ))}
        </div>
      );
      break;
    }
    case 'checkbox':
      return (
        <label className={`flex items-center gap-2 text-sm font-semibold ${compact ? 'mb-2' : 'mt-6'}`}>
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-ut-red" /> {def.label}
          {def.help && <span className="font-normal text-muted">— {def.help}</span>}
        </label>
      );
    case 'image':
      input = <ImageField value={value} onChange={onChange} url={imageUrl} />;
      break;
    case 'repeater':
      input = <Repeater def={def} value={value} onChange={onChange} />;
      break;
    default:
      input = <input id={id} type={def.type === 'email' ? 'email' : def.type === 'url' ? 'url' : def.type === 'password' ? 'password' : 'text'} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={inputCls} autoComplete={def.type === 'password' ? 'new-password' : undefined} />;
  }
  return (
    <div>
      <label htmlFor={id} className={`block font-semibold text-ink ${compact ? 'text-xs' : 'text-sm'}`}>{def.label}{def.required && <span className="text-ut-red"> *</span>}</label>
      {input}
      {def.type === 'html' && <p className="mt-1 text-xs text-muted">Admite HTML básico (párrafos, títulos, listas, enlaces, imágenes). Los scripts y estilos se eliminan automáticamente al guardar.</p>}
      {def.help && <p className="mt-1 text-xs text-muted">{def.help}</p>}
      {error && <p className="mt-1 text-sm text-ut-red" role="alert">{error}</p>}
    </div>
  );
}

export function Notice({ kind, children }: { kind: 'ok' | 'error' | 'info'; children: ReactNode }) {
  const cls = kind === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : kind === 'error' ? 'border-ut-red/40 bg-ut-red-50 text-ut-red-dark' : 'border-sky-200 bg-sky-50 text-sky-900';
  return <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-2.5 text-sm ${cls}`}>{children}</div>;
}

export function Button({ children, variant = 'primary', ...props }: { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'light' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = {
    primary: 'bg-ut-red text-white hover:bg-ut-red-dark', secondary: 'border border-line bg-white hover:border-ut-red hover:text-ut-red',
    danger: 'border border-ut-red bg-white text-ut-red hover:bg-ut-red-50', light: 'bg-white text-ut-red shadow hover:bg-ut-red-50', ghost: 'hover:bg-surface',
  }[variant];
  return <button type="button" {...props} className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold disabled:opacity-50 ${v} ${props.className ?? ''}`}>{children}</button>;
}

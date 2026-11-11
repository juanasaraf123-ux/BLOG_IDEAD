import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { admin, errorText } from '../../shared/api';
import { fmtDateTime, fmtNumber } from '../../shared/format';
import { Icon } from '../../shared/icons';
import { Badge, ErrorBox, Spinner, useAsync } from '../../shared/ui';
import { useAuth } from '../auth';
import { Button, inputCls, Notice, useOptions } from '../components/Form';

/**
 * Bases de datos institucionales: cada oficina diligencia una plantilla de Excel, aquí se sube,
 * se revisa (errores por fila y columna) y se confirma. Luego se consultan los totales.
 */

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Period = { id: number; code: string; total: number };
type Base = {
  entity: string; title: string; short: string; icon: string; source: string; description: string; by_period: boolean;
  total: number; periods: Period[]; last_import: { date: string; user: string; period: string | null; rows: number } | null;
};
type Analysis = {
  rows_total: number; rows_valid: number; rows_error: number; errors: { row: number; column: string; message: string }[];
  missing_columns: string[]; unknown_columns: string[]; replaces: number; period: string | null; sample: Row[];
};

const templateUrl = (entity: string) => admin.url(`records/${entity}/template`);

/** Color de cada base (franja superior e ícono). */
const BASE_COLOR: Record<string, [string, string]> = {
  estudiantes: ['bg-ut-red', 'from-ut-red to-ut-red-dark'],
  docentes: ['bg-green', 'from-green to-green-dark'],
  graduados: ['bg-[#d4952e]', 'from-[#e0a43a] to-[#b7791f]'],
  personal: ['bg-[#4d6079]', 'from-[#5b6f8a] to-[#3d4d63]'],
};

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

function IconBubble({ name, tone = 'teal' }: { name: string; tone?: 'teal' | 'red' | 'green' | 'amber' }) {
  const t = { teal: 'bg-teal/15 text-green-dark', red: 'bg-ut-red-50 text-ut-red', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-800' }[tone];
  return <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xl ${t}`}><Icon name={name} /></span>;
}

// ------------------------------------------------------------------ Inicio: las cuatro bases

export function RecordsHome() {
  const { data, loading, error, reload } = useAsync(() => admin.get<{ data: Base[]; can: { import: boolean } }>('records'), []);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-bold tracking-wider text-muted uppercase">Información e indicadores</p>
        <h1 className="text-3xl font-extrabold text-ut-red">Bases de datos</h1>
        <p className="mt-1 max-w-3xl text-muted">Aquí se cargan las bases que envían las oficinas. Los datos personales quedan cifrados y solo los ven personas autorizadas; en el portal se publican únicamente totales.</p>
      </header>

      <Card className="bg-gradient-to-r from-green-dark to-green text-white">
        <h2 className="mb-3 font-bold">¿Cómo funciona?</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            ['download', 'Descargue la plantilla', 'Envíela a la oficina con el correo de solicitud.'],
            ['upload', 'Suba el archivo diligenciado', 'El sistema revisa cada fila y le dice qué corregir.'],
            ['check', 'Confirme la carga', 'Los totales quedan listos para consultar.'],
          ].map(([icon, t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 text-xl"><Icon name={icon} /></span>
              <div><p className="font-semibold">{i + 1}. {t}</p><p className="text-sm text-white/85">{d}</p></div>
            </li>
          ))}
        </ol>
      </Card>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (
        <div className="grid gap-5 md:grid-cols-2">
          {data.data.map((b) => (
            <Card key={b.entity} className="relative flex flex-col overflow-hidden">
              <span className={`absolute inset-x-0 top-0 h-1.5 ${BASE_COLOR[b.entity]?.[0] ?? 'bg-teal'}`} aria-hidden />
              <div className="flex items-start gap-3">
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl text-white shadow ${BASE_COLOR[b.entity]?.[1] ?? 'from-teal to-green'}`}><Icon name={b.icon} /></span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-ink">{b.title}</h2>
                  <p className="text-sm text-muted">Envía: {b.source}</p>
                </div>
              </div>
              <div className="my-5 flex-1">
                {b.total > 0 ? (
                  <>
                    <p className="text-4xl font-extrabold text-green-dark">{fmtNumber(b.total)}</p>
                    <p className="text-sm text-muted">registros{b.periods.length ? ` · ${b.periods.length} ${b.periods.length === 1 ? 'semestre' : 'semestres'}` : ''}</p>
                    {b.last_import && <p className="mt-2 text-xs text-muted">Última carga: {fmtDateTime(b.last_import.date)} por {b.last_import.user}{b.last_import.period ? ` (${b.last_import.period})` : ''}</p>}
                  </>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-dashed border-line bg-surface px-4 py-3 text-sm text-muted">
                    <Icon name="clock" className="text-lg" /> Aún no se ha cargado información.
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {data.can.import && <Link to={`/bases/${b.entity}`} className="inline-flex items-center gap-1.5 rounded-lg bg-ut-red px-3.5 py-2 text-sm font-semibold text-white hover:bg-ut-red-dark"><Icon name="upload" /> Cargar archivo</Link>}
                <Link to={`/bases/${b.entity}?tab=consultar`} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-sm font-semibold hover:border-green"><Icon name="chart" /> Ver datos</Link>
                <a href={templateUrl(b.entity)} className="ml-auto inline-flex items-center gap-1 px-2 py-2 text-sm font-semibold text-green-dark hover:underline"><Icon name="download" /> Plantilla</a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Detalle de una base

const TABS = [['cargar', 'Cargar archivo', 'upload'], ['consultar', 'Consultar', 'chart'], ['historial', 'Historial', 'history']] as const;

export function RecordDetail() {
  const { entity = '' } = useParams();
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const canImport = can('records.import');
  const tab = params.get('tab') ?? (canImport ? 'cargar' : 'consultar');
  const { data: def, error, reload } = useAsync(() => admin.get<Row>(`records/${entity}`), [entity]);

  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!def) return <Spinner />;
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link to="/bases" className="inline-flex items-center gap-1 text-sm font-semibold text-green-dark hover:underline"><Icon name="chevronLeft" /> Bases de datos</Link>
      <header className="flex items-start gap-3">
        <IconBubble name={def.icon} />
        <div>
          <h1 className="text-2xl font-extrabold text-ut-red">{def.title}</h1>
          <p className="text-muted">Envía: {def.source}. {def.description}</p>
        </div>
      </header>
      <nav role="tablist" aria-label="Secciones" className="flex gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-line sm:inline-flex">
        {TABS.filter(([k]) => k !== 'cargar' || canImport).map(([k, label, icon]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setParams({ tab: k })}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === k ? 'bg-ut-red text-white' : 'text-ink hover:bg-surface'}`}>
            <Icon name={icon} /> {label}
          </button>
        ))}
      </nav>
      {tab === 'cargar' && canImport && <Upload def={def} onDone={() => { reload(); }} goTo={(t) => setParams({ tab: t })} />}
      {tab === 'consultar' && <Explore def={def} />}
      {tab === 'historial' && <History entity={entity} canImport={canImport} onChange={reload} />}
    </div>
  );
}

// ------------------------------------------------------------------ Cargar

function Steps({ step }: { step: number }) {
  const names = ['Plantilla', 'Archivo', 'Revisión', 'Listo'];
  return (
    <ol className="flex items-center gap-2 text-sm" aria-label="Pasos">
      {names.map((n, i) => (
        <li key={n} className="flex items-center gap-2" aria-current={i === step ? 'step' : undefined}>
          <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${i < step ? 'bg-green text-white' : i === step ? 'bg-ut-red text-white ring-4 ring-ut-red/20' : 'bg-surface text-muted ring-1 ring-line'}`}>
            {i < step ? <Icon name="check" /> : i + 1}
          </span>
          <span className={`hidden sm:inline ${i === step ? 'font-semibold text-ink' : 'text-muted'}`}>{n}</span>
          {i < names.length - 1 && <span className="mx-1 h-px w-6 bg-line sm:w-10" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

function useSemesters() {
  const all = useOptions('periods');
  const year = new Date().getFullYear();
  return useMemo(() => all.filter((p) => p.type === 'semestre' && Number(p.year) >= 2015 && Number(p.year) <= year + 1)
    .sort((a, b) => String(b.code).localeCompare(String(a.code))), [all, year]);
}

function Upload({ def, onDone, goTo }: { def: Row; onDone: () => void; goTo: (t: string) => void }) {
  const semesters = useSemesters();
  const [period, setPeriod] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [done, setDone] = useState<{ rows_valid: number; period: string | null } | null>(null);
  const [showCols, setShowCols] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const step = done ? 3 : analysis ? 2 : file ? 1 : 0;
  const extra = (): Record<string, string> => (def.by_period ? { period_id: period } : {});
  const ready = !!file && (!def.by_period || !!period);

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    if (!/\.(xlsx|csv)$/i.test(f.name)) { setErr('El archivo debe ser Excel (.xlsx) o CSV.'); return; }
    setErr(null); setAnalysis(null); setFile(f);
  };
  const analyze = async () => {
    if (!file) return;
    setBusy(true); setErr(null);
    try { setAnalysis(await admin.upload<Analysis>(`records/${def.entity}/analyze`, file, extra())); } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  const confirm = async () => {
    if (!file) return;
    setBusy(true); setErr(null);
    try { setDone(await admin.upload(`records/${def.entity}/import`, file, extra())); onDone(); } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  const reset = () => { setFile(null); setAnalysis(null); setDone(null); setErr(null); if (input.current) input.current.value = ''; };

  if (done) {
    return (
      <Card className="py-10 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-4xl text-emerald-700"><Icon name="check" /></span>
        <h2 className="mt-4 text-xl font-extrabold text-green-dark">¡Listo! Se cargaron {fmtNumber(done.rows_valid)} registros{done.period ? ` del semestre ${done.period}` : ''}.</h2>
        <p className="mt-1 text-muted">Los datos personales quedaron cifrados. Ya puede consultar los totales.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => goTo('consultar')}><Icon name="chart" /> Ver datos</Button>
          <Button variant="secondary" onClick={reset}><Icon name="upload" /> Cargar otro archivo</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Steps step={step} />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        {/* Paso 1 */}
        <Card>
          <h2 className="flex items-center gap-2 font-bold"><span className="grid h-6 w-6 place-items-center rounded-full bg-ut-red text-xs text-white">1</span> Descargue la plantilla</h2>
          <p className="mt-2 text-sm text-muted">Es un Excel con las columnas que necesita el portal, instrucciones y la lista de programas y CAT válidos. Adjúntela al correo para la oficina.</p>
          <a href={templateUrl(def.entity)} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-ut-red bg-white px-3.5 py-2 text-sm font-semibold text-ut-red hover:bg-ut-red-50"><Icon name="download" /> Descargar plantilla (.xlsx)</a>
          <button onClick={() => setShowCols(!showCols)} aria-expanded={showCols} className="mt-4 flex items-center gap-1 text-sm font-semibold text-green-dark hover:underline">
            <Icon name="chevronDown" className={`transition ${showCols ? 'rotate-180' : ''}`} /> Ver las {def.columns.length} columnas
          </button>
          {showCols && (
            <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto pr-1 text-sm">
              {def.columns.map((c: Row) => (
                <li key={c.key} className="rounded-lg bg-surface px-3 py-2">
                  <span className="font-semibold">{c.label}</span> {c.required && <Badge tone="red">Obligatoria</Badge>}
                  <p className="text-xs text-muted">{c.help}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Paso 2 */}
        <Card>
          <h2 className="flex items-center gap-2 font-bold"><span className="grid h-6 w-6 place-items-center rounded-full bg-ut-red text-xs text-white">2</span> Suba el archivo que envió la oficina</h2>
          {def.by_period && (
            <label className="mt-3 block text-sm font-semibold">¿De qué semestre es la información?
              <select className={inputCls} value={period} onChange={(e) => { setPeriod(e.target.value); setAnalysis(null); }}>
                <option value="">Seleccione el semestre…</option>
                {semesters.map((p) => <option key={String(p.id)} value={String(p.id)}>{String(p.code)}</option>)}
              </select>
            </label>
          )}
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
            onClick={() => input.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
            role="button" tabIndex={0} aria-label="Elegir archivo de Excel o CSV"
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${drag ? 'border-green bg-teal/10' : file ? 'border-green/60 bg-emerald-50/50' : 'border-line hover:border-green hover:bg-surface'}`}>
            <span className="text-4xl text-green"><Icon name={file ? 'file' : 'upload'} /></span>
            {file ? (
              <>
                <p className="mt-2 font-semibold text-ink">{file.name}</p>
                <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB · haga clic para cambiarlo</p>
              </>
            ) : (
              <>
                <p className="mt-2 font-semibold text-ink">Arrastre aquí el archivo o haga clic para buscarlo</p>
                <p className="text-xs text-muted">Excel (.xlsx) o CSV · máximo 15 MB</p>
              </>
            )}
            <input ref={input} type="file" accept=".xlsx,.csv" className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0])} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={analyze} disabled={!ready || busy}>{busy && !analysis ? 'Revisando…' : <><Icon name="search" /> Revisar archivo</>}</Button>
            {!ready && <span className="text-xs text-muted">{def.by_period && !period ? 'Elija el semestre y el archivo.' : 'Elija el archivo.'}</span>}
          </div>
          <p className="mt-3 text-xs text-muted">Revisar no guarda nada: primero verá si hay errores.</p>
        </Card>
      </div>

      {err && <Notice kind="error">{err}</Notice>}
      {analysis && <Review a={analysis} busy={busy} onConfirm={confirm} onReset={reset} />}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'gray' | 'green' | 'red' }) {
  const t = { gray: 'text-ink', green: 'text-emerald-700', red: 'text-ut-red' }[tone];
  return (
    <div className="rounded-xl bg-surface px-4 py-3">
      <p className={`text-3xl font-extrabold ${t}`}>{fmtNumber(value)}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function Review({ a, busy, onConfirm, onReset }: { a: Analysis; busy: boolean; onConfirm: () => void; onReset: () => void }) {
  const allGood = a.rows_error === 0;
  return (
    <Card>
      <h2 className="flex items-center gap-2 font-bold"><span className="grid h-6 w-6 place-items-center rounded-full bg-ut-red text-xs text-white">3</span> Revisión del archivo</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Filas leídas" value={a.rows_total} tone="gray" />
        <Stat label="Listas para cargar" value={a.rows_valid} tone="green" />
        <Stat label="Con errores" value={a.rows_error} tone={a.rows_error ? 'red' : 'gray'} />
      </div>

      <div className="mt-4 space-y-2">
        {allGood && a.rows_valid > 0 && <Notice kind="ok">Todo está correcto. Puede confirmar la carga.</Notice>}
        {a.replaces > 0 && <Notice kind="info">Ya hay {fmtNumber(a.replaces)} registros del semestre {a.period}. Al confirmar se <strong>reemplazan</strong> por los de este archivo.</Notice>}
        {a.unknown_columns.length > 0 && <Notice kind="info">Estas columnas no son de la plantilla y se ignorarán: {a.unknown_columns.join(', ')}.</Notice>}
      </div>

      {a.errors.length > 0 && (
        <div className="mt-5">
          <h3 className="font-semibold text-ut-red-dark">Qué corregir en el archivo</h3>
          <p className="text-sm text-muted">Corrija en el Excel y vuelva a subirlo, o cargue solo las filas correctas y pida a la oficina las demás.</p>
          <div className="mt-2 max-h-80 overflow-auto rounded-xl ring-1 ring-line">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-ut-red-50 text-ut-red-dark"><tr><th className="px-3 py-2">Fila</th><th className="px-3 py-2">Columna</th><th className="px-3 py-2">Qué pasa</th></tr></thead>
              <tbody>
                {a.errors.map((e, i) => (
                  <tr key={i} className="border-t border-line"><td className="px-3 py-2 font-semibold">{e.row}</td><td className="px-3 py-2">{e.column || '—'}</td><td className="px-3 py-2">{e.message}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {a.sample.length > 0 && (
        <div className="mt-5">
          <h3 className="font-semibold">Así se ven los primeros registros</h3>
          <p className="text-sm text-muted">Sin nombres ni documentos completos, para verificar que programas y CAT se reconocieron bien.</p>
          <div className="mt-2 overflow-x-auto rounded-xl ring-1 ring-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-muted"><tr><th className="px-3 py-2">Fila</th><th className="px-3 py-2">Documento</th><th className="px-3 py-2">Programa</th><th className="px-3 py-2">CAT</th><th className="px-3 py-2">Sexo</th></tr></thead>
              <tbody>{a.sample.map((r) => <tr key={r.fila} className="border-t border-line"><td className="px-3 py-2">{r.fila}</td><td className="px-3 py-2">{r.documento}</td><td className="px-3 py-2">{r.programa}</td><td className="px-3 py-2">{r.cat}</td><td className="px-3 py-2">{r.sexo}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
        {a.rows_valid > 0 && (
          <Button onClick={onConfirm} disabled={busy}>{busy ? 'Cargando…' : <><Icon name="check" /> {allGood ? `Cargar ${fmtNumber(a.rows_valid)} registros` : `Cargar solo las ${fmtNumber(a.rows_valid)} filas correctas`}</>}</Button>
        )}
        <Button variant="secondary" onClick={onReset} disabled={busy}>Elegir otro archivo</Button>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------ Consultar

const COLUMNS: Record<string, [string, string][]> = {
  estudiantes: [['periodo', 'Semestre'], ['programa', 'Programa'], ['cat', 'CAT'], ['estado', 'Estado'], ['primer_ingreso', 'Primer ingreso'], ['sexo', 'Sexo']],
  docentes: [['periodo', 'Semestre'], ['vinculacion', 'Vinculación'], ['formacion', 'Formación'], ['cat', 'CAT'], ['cursos', 'Cursos']],
  graduados: [['programa', 'Programa'], ['cat', 'CAT'], ['fecha_grado', 'Fecha de grado'], ['sexo', 'Sexo']],
  personal: [['periodo', 'Semestre'], ['condicion', 'Condición'], ['cargo', 'Cargo'], ['dependencia', 'Dependencia'], ['cat', 'CAT']],
};

function Explore({ def }: { def: Row }) {
  const { can } = useAuth();
  const periods: Period[] = def.periods ?? [];
  const [period, setPeriod] = useState<string>(periods[0] ? String(periods[0].id) : '');
  const [cat, setCat] = useState('');
  const [program, setProgram] = useState('');
  const [personal, setPersonal] = useState(false);
  const [page, setPage] = useState(1);
  const cats = useOptions('cats');
  const programs = useOptions('programs');
  const filters = { period_id: period, cat_id: cat, program_id: program };
  const summary = useAsync(() => admin.get<Row>(`records/${def.entity}/summary`, filters), [def.entity, period, cat, program]);
  const rows = useAsync(() => admin.get<Row>(`records/${def.entity}/rows`, { ...filters, page, personal: personal ? 1 : undefined }), [def.entity, period, cat, program, page, personal]);
  const set = (f: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => { f(e.target.value); setPage(1); };
  const cols: [string, string][] = [...(personal ? [['nombre', 'Nombre'] as [string, string]] : []), ['documento', 'Documento'], ...(COLUMNS[def.entity] ?? [])];

  if (!summary.loading && summary.data && summary.data.kpis[0].value === 0 && !period && !cat && !program) {
    return (
      <Card className="py-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface text-3xl text-muted"><Icon name="clock" /></span>
        <h2 className="mt-3 text-lg font-bold">Aún no hay información cargada</h2>
        <p className="text-muted">Cuando la oficina envíe el archivo, cárguelo en la pestaña «Cargar archivo».</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-end gap-3 !p-4">
        {periods.length > 0 && (
          <label className="flex flex-col text-sm font-semibold">Semestre
            <select className={inputCls} value={period} onChange={set(setPeriod)}>
              <option value="">Todos</option>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
            </select>
          </label>
        )}
        <label className="flex flex-col text-sm font-semibold">CAT
          <select className={inputCls} value={cat} onChange={set(setCat)}>
            <option value="">Todos</option>
            {cats.map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>)}
          </select>
        </label>
        {def.entity !== 'personal' && (
          <label className="flex flex-col text-sm font-semibold">Programa
            <select className={`${inputCls} max-w-xs`} value={program} onChange={set(setProgram)}>
              <option value="">Todos</option>
              {programs.map((p) => <option key={String(p.id)} value={String(p.id)}>{String(p.name)}</option>)}
            </select>
          </label>
        )}
        {(cat || program) && <Button variant="ghost" onClick={() => { setCat(''); setProgram(''); setPage(1); }}>Quitar filtros</Button>}
      </Card>

      {summary.error && <ErrorBox message={summary.error} onRetry={summary.reload} />}
      {summary.data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {summary.data.kpis.map((k: Row) => (
              <Card key={k.label} className="!p-4"><p className="text-3xl font-extrabold text-green-dark">{fmtNumber(k.value)}</p><p className="text-sm text-muted">{k.label}</p></Card>
            ))}
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {summary.data.groups.map((g: Row) => <GroupTable key={g.title} title={g.title} rows={g.rows} total={summary.data!.kpis[0].value} />)}
          </div>
        </>
      )}

      <Card>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="font-bold">Registros</h2>
          {rows.data && <span className="text-sm text-muted">{fmtNumber(rows.data.meta.total)} en total</span>}
          {can('records.view_personal') && (
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={personal} onChange={(e) => { setPersonal(e.target.checked); setPage(1); }} className="h-4 w-4 accent-ut-red" />
              <Icon name="eye" /> Mostrar nombres y documentos
            </label>
          )}
        </div>
        {personal && <div className="mb-3"><Notice kind="info">Está viendo datos personales. Esta consulta queda registrada en la auditoría.</Notice></div>}
        {rows.loading && <Spinner />}
        {rows.error && <ErrorBox message={rows.error} onRetry={rows.reload} />}
        {rows.data && (
          <>
            <div className="overflow-x-auto rounded-xl ring-1 ring-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface text-muted"><tr>{cols.map(([k, l]) => <th key={k} className="px-3 py-2 whitespace-nowrap">{l}</th>)}</tr></thead>
                <tbody>
                  {rows.data.data.map((r: Row) => <tr key={r.id} className="border-t border-line">{cols.map(([k]) => <td key={k} className="px-3 py-2">{r[k] ?? '—'}</td>)}</tr>)}
                  {rows.data.data.length === 0 && <tr><td colSpan={cols.length} className="px-3 py-6 text-center text-muted">No hay registros con estos filtros.</td></tr>}
                </tbody>
              </table>
            </div>
            {rows.data.meta.last_page > 1 && (
              <div className="mt-3 flex items-center justify-end gap-2 text-sm">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}><Icon name="chevronLeft" /> Anterior</Button>
                <span>Página {rows.data.meta.current_page} de {rows.data.meta.last_page}</span>
                <Button variant="secondary" disabled={page >= rows.data.meta.last_page} onClick={() => setPage(page + 1)}>Siguiente <Icon name="chevronRight" /></Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function GroupTable({ title, rows, total }: { title: string; rows: { label: string; count: number }[]; total: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 6);
  return (
    <Card className="!p-4">
      <h3 className="mb-2 font-bold">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-muted">Sin información.</p> : (
        <table className="w-full text-sm">
          <tbody>
            {shown.map((r) => (
              <tr key={r.label} className="border-t border-line first:border-0">
                <td className="py-1.5 pr-2">{r.label}</td>
                <td className="py-1.5 text-right font-semibold tabular-nums">{fmtNumber(r.count)}</td>
                <td className="w-16 py-1.5 text-right text-muted tabular-nums">{total ? `${fmtNumber((r.count / total) * 100)} %` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {rows.length > 6 && <button onClick={() => setAll(!all)} className="mt-2 text-sm font-semibold text-green-dark hover:underline">{all ? 'Ver menos' : `Ver todos (${rows.length})`}</button>}
    </Card>
  );
}

// ------------------------------------------------------------------ Historial

const IMPORT_STATUS: Record<string, [string, 'green' | 'gray' | 'red']> = { cargado: ['Vigente', 'green'], reemplazado: ['Reemplazada', 'gray'], anulado: ['Deshecha', 'red'] };

function History({ entity, canImport, onChange }: { entity: string; canImport: boolean; onChange: () => void }) {
  const { data, loading, error, reload } = useAsync(() => admin.get<{ data: Row[] }>(`records/${entity}/imports`), [entity]);
  const [msg, setMsg] = useState<string | null>(null);
  const undo = async (r: Row) => {
    if (!window.confirm(`¿Deshacer la carga de ${fmtNumber(r.rows_valid)} registros${r.period ? ` del semestre ${r.period}` : ''}? Los registros se eliminarán.`)) return;
    try { await admin.del(`records/${entity}/imports/${r.id}`); setMsg('La carga se deshizo.'); reload(); onChange(); } catch (e) { setMsg(errorText(e)); }
  };
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <Card>
      {msg && <div className="mb-3"><Notice kind="ok">{msg}</Notice></div>}
      {data!.data.length === 0 ? <p className="py-6 text-center text-muted">Todavía no se ha cargado ningún archivo.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted"><tr><th className="py-2 pr-3">Fecha</th><th className="py-2 pr-3">Semestre</th><th className="py-2 pr-3">Archivo</th><th className="py-2 pr-3">Cargó</th><th className="py-2 pr-3 text-right">Registros</th><th className="py-2 pr-3 text-right">Filas con error</th><th className="py-2 pr-3">Estado</th><th /></tr></thead>
            <tbody>
              {data!.data.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(r.date)}</td>
                  <td className="py-2 pr-3">{r.period ?? '—'}</td>
                  <td className="max-w-56 truncate py-2 pr-3" title={r.file_name}>{r.file_name}</td>
                  <td className="py-2 pr-3">{r.user}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtNumber(r.rows_valid)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{fmtNumber(r.rows_error)}</td>
                  <td className="py-2 pr-3"><Badge tone={IMPORT_STATUS[r.status]?.[1] ?? 'gray'}>{IMPORT_STATUS[r.status]?.[0] ?? r.status}</Badge></td>
                  <td className="py-2 text-right">{canImport && r.status === 'cargado' && <button onClick={() => undo(r)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-ut-red hover:bg-ut-red-50"><Icon name="history" /> Deshacer</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

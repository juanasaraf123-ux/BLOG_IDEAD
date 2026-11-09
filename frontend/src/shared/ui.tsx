import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './icons';
import { errorText } from './api';

/** Hook de carga de datos con estados (cargando / error / datos) y recarga. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({ data: null, error: null, loading: true });
  const seq = useRef(0);
  const run = useCallback(() => {
    const id = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then(
      (data) => id === seq.current && setState({ data, error: null, loading: false }),
      (e) => id === seq.current && setState({ data: null, error: errorText(e), loading: false }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-6 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-ut-red border-t-transparent" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-ut-red/30 bg-ut-red-50 px-4 py-3 text-ut-red-dark">
      <Icon name="alert" className="text-xl" />
      <span>{message}</span>
      {onRetry && <button onClick={onRetry} className="ml-auto rounded border border-ut-red px-3 py-1 text-sm font-semibold hover:bg-white">Reintentar</button>}
    </div>
  );
}

/** Estado institucional para datos aún no suministrados (regla: no inventar cifras). */
export function Pending({ text = 'Información pendiente de actualización', detail }: { text?: string; detail?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-line bg-surface px-4 py-4 text-muted">
      <Icon name="clock" className="mt-0.5 shrink-0 text-xl" />
      <div>
        <p className="font-semibold">{text}</p>
        {detail && <p className="text-sm">{detail}</p>}
      </div>
    </div>
  );
}

export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span title="Datos de demostración: no son cifras oficiales" className={`inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[0.68rem] font-bold tracking-wide text-amber-900 uppercase ${className}`}>
      Demo
    </span>
  );
}

export function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'red' | 'green' | 'amber' | 'teal' | 'blue' }) {
  const tones = {
    gray: 'bg-gray-100 text-gray-700', red: 'bg-ut-red-50 text-ut-red-dark', green: 'bg-emerald-50 text-emerald-800',
    amber: 'bg-amber-50 text-amber-900', teal: 'bg-teal-50 text-green-dark', blue: 'bg-sky-50 text-sky-900',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export const STATUS_TONE: Record<string, 'gray' | 'red' | 'green' | 'amber' | 'teal' | 'blue'> = {
  borrador: 'gray', en_revision: 'amber', enviado: 'amber', devuelto: 'red', aprobado: 'blue', publicado: 'green', despublicado: 'gray',
  reemplazado: 'gray', retirado: 'gray', vigente: 'green', archivado: 'gray', activo: 'green', inactivo: 'gray',
};

export function SectionTitle({ children, id, action }: { children: ReactNode; id?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <h2 id={id} className="text-xl font-extrabold text-ut-red md:text-2xl">{children}</h2>
      {action}
    </div>
  );
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · IDEAD – Universidad del Tolima` : 'IDEAD · Universidad del Tolima';
  }, [title]);
}

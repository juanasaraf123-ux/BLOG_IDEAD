const nf = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

export const fmtNumber = (v: number | null | undefined, digits = 1) =>
  v === null || v === undefined || Number.isNaN(v) ? '—' : (digits === 2 ? nf2 : nf).format(v);

/** Pesos colombianos en formato compacto legible: $42.000 millones / $1,2 billones. */
export function fmtCurrency(v: number | null | undefined, compact = true): string {
  if (v === null || v === undefined) return '—';
  if (!compact) return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
  const abs = Math.abs(v);
  if (abs >= 1e12) return `$${nf.format(v / 1e12)} billones`;
  if (abs >= 1e6) return `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: abs >= 1e9 ? 0 : 1 }).format(v / 1e6)} millones`;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
}

export function fmtValue(v: number | null | undefined, valueType?: string): string {
  if (v === null || v === undefined) return '—';
  switch (valueType) {
    case 'percent': return `${fmtNumber(v)} %`;
    case 'currency': return fmtCurrency(v);
    case 'ratio': return fmtNumber(v, 2);
    default: return fmtNumber(v);
  }
}

/** Fechas puras (AAAA-MM-DD) se interpretan al mediodía local para no desplazarse un día por la zona horaria. */
export const toDate = (iso: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00` : iso);

export const fmtDate = (iso?: string | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  iso ? new Intl.DateTimeFormat('es-CO', opts).format(toDate(iso)) : '';

export const fmtDateTime = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : '';

export const fmtBytes = (b?: number | null) =>
  !b ? '' : b > 1048576 ? `${nf.format(b / 1048576)} MB` : `${Math.ceil(b / 1024)} KB`;

export const LABELS: Record<string, string> = {
  PUB: 'Público', AGR: 'Público agregado', AGR_S: 'Agregado sensible', MIX: 'Mixto',
  pendiente: 'Pendiente de validación', validada: 'Validada',
  semestral: 'Semestral', anual: 'Anual', vigencia: 'Por vigencia', cohorte: 'Por cohorte', eventual: 'Eventual',
  radicado: 'Radicado', aprobado: 'Aprobado', en_ejecucion: 'En ejecución', finalizado: 'Finalizado', suspendido: 'Suspendido',
  infraestructura: 'Infraestructura', equipos: 'Equipos', tecnologia: 'Tecnología', academia: 'Academia', bienestar: 'Bienestar', investigacion: 'Investigación', otra: 'Otra',
  vigente: 'Vigente', terminado: 'Terminado', en_liquidacion: 'En liquidación',
  activo: 'Activo', inactivo: 'Inactivo', reactivado: 'Reactivado', en_cierre: 'En cierre', proyectado: 'Proyectado',
  publica: 'Pública', privada: 'Privada', propia: 'Propia',
  aula: 'Aulas', laboratorio: 'Laboratorios', sala_computo: 'Salas de cómputo', biblioteca: 'Bibliotecas', auditorio: 'Auditorios', deportivo: 'Espacios deportivos', conectividad: 'Conectividad',
  apertura: 'Apertura', cierre: 'Cierre', reactivacion: 'Reactivación', hito: 'Hito',
  borrador: 'Borrador', en_revision: 'En revisión', devuelto: 'Devuelto', publicado: 'Publicado', despublicado: 'Despublicado',
  enviado: 'Enviado', reemplazado: 'Reemplazado', retirado: 'Retirado',
  publico: 'Público', interno: 'Interno', restringido: 'Restringido', financiero: 'Financiero', archivado: 'Archivado',
  registrado: 'Registrado', legalizado: 'Legalizado', anulado: 'Anulado',
};
export const label = (k?: string | null) => (k ? LABELS[k] ?? k.replace(/_/g, ' ') : '');

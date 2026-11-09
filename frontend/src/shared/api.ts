/**
 * Cliente HTTP del portal y del panel.
 * - Público: GET de solo lectura a /api/public/v1.
 * - Panel: sesión por cookie HttpOnly + token CSRF (cookie XSRF-TOKEN → cabecera X-XSRF-TOKEN), según Laravel Sanctum.
 */
export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;
  body: unknown;
  constructor(status: number, message: string, errors: Record<string, string[]> = {}, body: unknown = null) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.body = body;
  }
}

export type Query = Record<string, string | number | boolean | null | undefined>;

export function qs(params?: Query): string {
  if (!params) return '';
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
}

async function parse(res: Response) {
  if (res.status === 204) return null;
  const type = res.headers.get('content-type') ?? '';
  const body = type.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (body && typeof body === 'object' && 'message' in body ? String((body as { message: string }).message) : '') || `Error ${res.status}`;
    throw new ApiError(res.status, msg, (body as { errors?: Record<string, string[]> })?.errors ?? {}, body);
  }
  return body;
}

export async function publicGet<T>(path: string, params?: Query): Promise<T> {
  const res = await fetch(`/api/public/v1/${path}${qs(params)}`, { headers: { Accept: 'application/json' } });
  return parse(res) as Promise<T>;
}

export const publicUrl = (path: string, params?: Query) => `/api/public/v1/${path}${qs(params)}`;

function xsrf(): string | null {
  const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function ensureCsrf() {
  if (!xsrf()) await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });
}

/** Evento global para que el panel reaccione a sesiones expiradas. */
export const SESSION_EXPIRED = 'idead:session-expired';

async function adminRequest<T>(method: string, path: string, body?: unknown, params?: Query, retried = false): Promise<T> {
  await ensureCsrf();
  const isForm = body instanceof FormData;
  const token = xsrf();
  const res = await fetch(`/api/admin/v1/${path}${qs(params)}`, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(isForm || body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { 'X-XSRF-TOKEN': token } : {}),
    },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });
  if (res.status === 401 && !path.startsWith('auth/')) window.dispatchEvent(new Event(SESSION_EXPIRED));
  if (res.status === 419 && !retried) {
    // token CSRF expirado: se renueva y se reintenta una vez
    await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });
    return adminRequest<T>(method, path, body, params, true);
  }
  return parse(res) as Promise<T>;
}

export const admin = {
  get: <T,>(path: string, params?: Query) => adminRequest<T>('GET', path, undefined, params),
  post: <T,>(path: string, body?: unknown) => adminRequest<T>('POST', path, body ?? {}),
  put: <T,>(path: string, body?: unknown) => adminRequest<T>('PUT', path, body ?? {}),
  del: <T,>(path: string) => adminRequest<T>('DELETE', path),
  upload: <T,>(path: string, file: File, extra: Record<string, string> = {}) => {
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
    return adminRequest<T>('POST', path, fd);
  },
  url: (path: string, params?: Query) => `/api/admin/v1/${path}${qs(params)}`,
};

export function errorText(e: unknown): string {
  if (e instanceof ApiError) {
    const first = Object.values(e.errors)[0]?.[0];
    return first ?? e.message;
  }
  return e instanceof Error ? e.message : 'Error inesperado';
}

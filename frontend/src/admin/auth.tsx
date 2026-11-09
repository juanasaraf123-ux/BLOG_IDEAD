import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { admin, SESSION_EXPIRED } from '../shared/api';

export interface Me {
  user: { id: number; name: string; email: string; mfa_enabled: boolean; roles: { id: number; code: string; name: string }[]; dependencies: { id: number; code: string; name: string }[] };
  permissions: string[];
  mfa_enforced: boolean;
  must_setup_mfa: boolean;
}

interface AuthCtx { me: Me | null; loading: boolean; refresh: () => Promise<void>; setMe: (m: Me | null) => void; can: (...perms: string[]) => boolean; logout: () => Promise<void> }
const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);

/** Sesión del panel. La autorización real ocurre en el servidor; `can` solo adapta la interfaz. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { setMe(await admin.get<Me>('auth/me')); } catch { setMe(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => setMe(null);
    window.addEventListener(SESSION_EXPIRED, h);
    return () => window.removeEventListener(SESSION_EXPIRED, h);
  }, []);
  const can = (...perms: string[]) => !!me && perms.some((p) => me.permissions.includes(p));
  const logout = async () => { try { await admin.post('auth/logout'); } finally { setMe(null); } };
  return <Ctx.Provider value={{ me, loading, refresh, setMe, can, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

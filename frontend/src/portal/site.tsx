import { createContext, useContext, type ReactNode } from 'react';
import { publicGet } from '../shared/api';
import type { SiteData } from '../shared/types';
import { useAsync } from '../shared/ui';

const SiteContext = createContext<SiteData | null>(null);

/** Configuración global del sitio (nombre, contacto, módulos, modo demostración), cargada una vez. */
export function SiteProvider({ children }: { children: ReactNode }) {
  const { data } = useAsync(() => publicGet<SiteData>('site'), []);
  return <SiteContext.Provider value={data}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);

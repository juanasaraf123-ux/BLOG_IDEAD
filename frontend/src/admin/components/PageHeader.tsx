import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../shared/icons';

/**
 * Encabezado institucional de cada pantalla del panel: franja roja con texto blanco (colores de la Universidad del Tolima).
 * `actions` se muestra a la derecha (use Button variant="light").
 */
export function PageHeader({ title, description, icon, actions, back, eyebrow }: {
  title: ReactNode; description?: ReactNode; icon?: string; actions?: ReactNode; back?: { to: string; label: string }; eyebrow?: string;
}) {
  return (
    <header className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-ut-red via-ut-red to-ut-red-dark px-5 py-5 text-white shadow-lg md:px-7 md:py-6">
      <span className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-white/10" aria-hidden />
      <span className="pointer-events-none absolute -right-6 -bottom-24 h-44 w-44 rounded-full bg-ut-red-900/40" aria-hidden />
      <span className="pointer-events-none absolute top-5 right-48 hidden h-12 w-12 rounded-full border-4 border-white/15 lg:block" aria-hidden />
      <div className="relative flex flex-wrap items-center gap-4">
        {icon && <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-3xl text-ut-red shadow"><Icon name={icon} /></span>}
        <div className="min-w-0 flex-1">
          {back && <Link to={back.to} className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-white/85 hover:text-white hover:underline"><Icon name="chevronLeft" /> {back.label}</Link>}
          {eyebrow && <p className="text-xs font-bold tracking-wider text-white/75 uppercase">{eyebrow}</p>}
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-white/90 md:text-base">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

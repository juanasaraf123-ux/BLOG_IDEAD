import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../shared/icons';

/**
 * Encabezado de cada pantalla: tarjeta blanca con acento rojo institucional.
 */
export function PageHeader({ title, description, icon, actions, back, eyebrow }: {
  title: ReactNode; description?: ReactNode; icon?: string; actions?: ReactNode; back?: { to: string; label: string }; eyebrow?: string;
}) {
  return (
    <header className="relative mb-6 overflow-hidden rounded-2xl border border-line bg-white px-5 py-5 shadow-sm md:px-7">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-ut-red" aria-hidden />
      <div className="relative flex flex-wrap items-center gap-4">
        {icon && <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ut-red-50 text-3xl text-ut-red"><Icon name={icon} /></span>}
        <div className="min-w-0 flex-1">
          {back && <Link to={back.to} className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-ut-red hover:underline"><Icon name="chevronLeft" /> {back.label}</Link>}
          {eyebrow && <p className="text-xs font-bold tracking-wider text-muted uppercase">{eyebrow}</p>}
          <h1 className="text-2xl font-extrabold text-ut-red md:text-3xl">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-muted md:text-base">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

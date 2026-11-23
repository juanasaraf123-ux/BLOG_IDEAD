import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../shared/icons';

/** Fotografías institucionales reales (idead.ut.edu.co) que acompañan los encabezados según el tipo de módulo. */
const PHOTOS = ['/img/home/grupo-idead.jpg', '/img/home/estudiantes-circulo.jpg', '/img/home/estudiante-campo.jpg'];
const PHOTO_BY_ICON: Record<string, number> = { building: 0, people: 0, user: 0, shield: 0, graduation: 1, calendar: 1, book: 1, image: 1, project: 2, chart: 2, table: 2, upload: 2, flask: 2 };

/**
 * Encabezado de cada módulo: banner con degradado institucional, círculos translúcidos, ondas,
 * fotografía integrada a la derecha, icono, título, descripción y acciones principales.
 */
export function PageHeader({ title, description, icon, actions, back, eyebrow, photo }: {
  title: ReactNode; description?: ReactNode; icon?: string; actions?: ReactNode; back?: { to: string; label: string }; eyebrow?: string;
  /** Fotografía del banner; `false` para omitirla. */
  photo?: string | false;
}) {
  const img = photo === false ? null : photo ?? PHOTOS[PHOTO_BY_ICON[icon ?? ''] ?? 1];
  return (
    <header className="relative mb-6 overflow-hidden rounded-[1.375rem] bg-gradient-to-br from-ut-red via-[#b3161f] to-ut-red-dark text-white shadow-[0_18px_40px_-18px_rgb(149_21_29/0.65)]">
      {img && (
        <div className="absolute inset-y-0 right-0 hidden w-[38%] md:block" aria-hidden>
          <img src={img} alt="" className="h-full w-full object-cover [mask-image:linear-gradient(to_right,transparent,black_45%)] opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#b3161f] via-ut-red/25 to-ut-red-dark/10" />
        </div>
      )}
      <span className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-white/[0.07]" aria-hidden />
      <span className="pointer-events-none absolute right-[30%] -bottom-20 h-44 w-44 rounded-full border-[14px] border-white/[0.07]" aria-hidden />
      <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden>
        <path d="M0 30 C 200 10, 380 40, 600 22 S 1000 4, 1200 20 V40 H0Z" fill="#20a99c" fillOpacity=".22" />
        <path d="M0 36 C 240 22, 420 44, 660 30 S 1020 16, 1200 28 V40 H0Z" fill="#fff" fillOpacity=".10" />
      </svg>
      <div className="relative flex flex-wrap items-center gap-4 px-5 py-6 md:px-7 md:py-7">
        {icon && <span className="admin-glass grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl text-white shadow-lg"><Icon name={icon} /></span>}
        <div className="min-w-0 flex-1">
          {back && <Link to={back.to} className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-white/90 hover:text-white hover:underline"><Icon name="chevronLeft" /> {back.label}</Link>}
          {eyebrow && <p className="text-[0.7rem] font-bold tracking-[0.14em] text-white/75 uppercase">{eyebrow}</p>}
          <h1 className="text-2xl font-extrabold drop-shadow-sm md:text-[1.9rem]">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-white/85 md:text-[0.95rem]">{description}</p>}
        </div>
        {actions && <div className="relative flex flex-wrap gap-2 rounded-2xl bg-white/95 p-1.5 shadow-lg">{actions}</div>}
      </div>
    </header>
  );
}

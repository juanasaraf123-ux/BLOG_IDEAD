/** Iconografía lineal coherente (trazo 1.6) inspirada en el boceto. Decorativa salvo que se indique `title`. */
import type { SVGProps } from 'react';

const paths: Record<string, string> = {
  building: 'M4 21V8l8-5 8 5v13M4 21h16M8 21v-4h8v4M7.5 10h2m5 0h2m-9 3.5h2m5 0h2M10.5 6.5h3',
  students: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.5 3.3-6 6.5-6s5.9 2.5 6.5 6M14 20h7.5M14.5 9.5H21v8h-6.5M17.5 9.5V6.5',
  teacher: 'M8 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 21v-5a4 4 0 0 1 4-4h2l3 3M12 4h9v9h-6M14 8h4M9 21v-4',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  graduation: 'M2 9.5 12 5l10 4.5-10 4.5L2 9.5zM6 11.5V16c1.7 1.6 3.8 2.5 6 2.5s4.3-.9 6-2.5v-4.5M21 10v5.5',
  graduate: 'M12 3 3 7l9 4 9-4-9-4zM7 9v5c1.5 1.3 3.2 2 5 2s3.5-.7 5-2V9M12 16v5M9 21h6',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4M7.5 13.5h2m2.5 0h2m2.5 0h2m-11 3.5h2m2.5 0h2m2.5 0h2',
  search: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM21 21l-5.2-5.2',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'M5 5l14 14M19 5 5 19',
  chevronDown: 'M6 9l6 6 6-6',
  chevronLeft: 'M15 5l-7 7 7 7',
  chevronRight: 'M9 5l7 7-7 7',
  arrowRight: 'M4 12h15M13 6l6 6-6 6',
  download: 'M12 3v12M7 10l5 5 5-5M4 20h16',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
  people: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2.5 20c.5-3.2 2.7-5.5 5.5-5.5s5 2.3 5.5 5.5M14 14.6c.8-.4 1.6-.6 2.5-.6 2.4 0 4.3 2 4.8 5',
  heart: 'M12 20s-7.5-4.6-9-9.4C2 7 4.2 4.5 7 4.5c2 0 3.6 1.2 5 3 1.4-1.8 3-3 5-3 2.8 0 5 2.5 4 6.1C19.5 15.4 12 20 12 20z',
  flask: 'M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7.5 15h9',
  hands: 'M3 13l4-4 3 1 3-3 4 1 4 4M3 13l5 6h6l5-5M10 10l3 3',
  money: 'M3 6h18v12H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 9v.01M18 15v.01',
  project: 'M4 4h16v16H4zM4 9h16M9 9v11M12.5 13h4.5M12.5 16.5h3',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3zM8.5 12l2.5 2.5 4.5-5',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3M20 16V6',
  book: 'M4 5c2.5-1 5.5-1 8 1 2.5-2 5.5-2 8-1v14c-2.5-1-5.5-1-8 1-2.5-2-5.5-2-8-1V5zM12 6v14',
  lock: 'M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  print: 'M7 8V3h10v5M7 17H4v-7h16v7h-3M7 14h10v7H7z',
  filter: 'M3 5h18l-7 8v6l-4 2v-8L3 5z',
  table: 'M3 5h18v14H3zM3 10h18M3 14.5h18M9 5v14',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5v.01',
  video: 'M3 6h13v12H3zM16 10l5-3v10l-5-3',
  file: 'M6 3h8l5 5v13H6zM14 3v5h5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  alert: 'M12 4 2.5 20h19L12 4zM12 10v4.5M12 17.5v.5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
  home: 'M3 11l9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 3',
  upload: 'M12 21V9M7 14l5-5 5 5M4 4h16',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  phone: 'M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
};

export type IconName = keyof typeof paths;

export function Icon({ name, title, ...props }: { name: string; title?: string } & SVGProps<SVGSVGElement>) {
  const d = paths[name] ?? paths.info;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} width="1em" height="1em" {...props}>
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  );
}

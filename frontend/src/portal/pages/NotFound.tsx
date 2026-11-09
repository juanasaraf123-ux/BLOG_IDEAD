import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../shared/ui';

export default function NotFound() {
  useDocumentTitle('Página no encontrada');
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-ut-red">404</p>
      <h1 className="mt-4 text-2xl font-bold">Página no encontrada</h1>
      <p className="mt-2 text-muted">El contenido que busca no existe, fue retirado o aún no ha sido publicado.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/" className="rounded-lg bg-ut-red px-5 py-2.5 font-semibold text-white hover:bg-ut-red-dark">Ir al inicio</Link>
        <Link to="/buscar" className="rounded-lg border border-line px-5 py-2.5 font-semibold hover:border-ut-red">Buscar</Link>
      </div>
    </div>
  );
}

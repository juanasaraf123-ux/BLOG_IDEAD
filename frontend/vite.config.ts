import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Dos aplicaciones independientes: portal público (index.html) y panel privado (admin/index.html).
// El código del panel no se incluye en el paquete que descarga el público.
const backend = process.env.API_ORIGIN ?? 'http://127.0.0.1:8000';

/** En desarrollo, las rutas profundas del panel (/admin/...) deben servir admin/index.html. */
const adminFallback = {
  name: 'admin-spa-fallback',
  configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: unknown, next: () => void) => void) => void } }) {
    server.middlewares.use((req, _res, next) => {
      if (req.url && /^\/admin(\/[^.]*)?(\?.*)?$/.test(req.url)) req.url = '/admin/index.html';
      next();
    });
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), adminFallback],
  build: {
    rollupOptions: {
      input: { portal: resolve(__dirname, 'index.html'), admin: resolve(__dirname, 'admin/index.html') },
    },
    chunkSizeWarningLimit: 900,
  },
  server: {
    proxy: {
      '/api': backend,
      '/sanctum': backend,
      '/storage': backend,
    },
  },
  preview: { proxy: { '/api': backend, '/sanctum': backend, '/storage': backend } },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], globals: true },
} as never);

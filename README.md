# Portal institucional IDEAD – Universidad del Tolima

Portal de información, indicadores y gestión del Instituto de Educación a Distancia (IDEAD): **portal público** con los 13 módulos de indicadores del documento «Indicadores sugeridos» y diseño según el boceto aprobado, y **panel privado** con roles, flujo de revisión y publicación, gestión documental, contenidos y auditoría.

| | |
|---|---|
| Frontend | React 19 + TypeScript + Vite (portal `/` y panel `/admin` como paquetes independientes) |
| Backend | Laravel 13 (PHP ≥ 8.3), API REST, sesión segura + CSRF, 2FA TOTP |
| Base de datos | MariaDB 10.11+ / MySQL 8.4 (SQLite para desarrollo y pruebas) |

## Inicio rápido (desarrollo, con datos de demostración)

```bash
cd backend && composer install && cp .env.example .env
# en .env: APP_ENV=local, APP_DEBUG=true, DB_CONNECTION=sqlite, IDEAD_DEMO_DATA=true, DEMO_PASSWORD=<clave>
touch database/database.sqlite && php artisan key:generate
php artisan migrate --seed && php artisan db:seed --class=DemoDataSeeder && php artisan storage:link
php artisan serve
```

```bash
cd frontend && npm install && npm run dev
```

Portal: <http://localhost:5173> · Panel: <http://localhost:5173/admin/> (usuarios `director@`, `coordinador@`, `comunicaciones@`, `documental@`, `cajamenor@`, `admin@demo.idead.local`).

> Los datos de demostración están marcados como **DEMO** y nunca deben cargarse en producción. Sin ellos, el portal muestra «Información pendiente de actualización» en lugar de cifras.

## Pruebas

```bash
cd backend && php artisan test          # 32 pruebas (seguridad, indicadores, registros, solicitudes, portal)
cd frontend && npm test && npm run build
npm run e2e:portal && npm run e2e:a11y   # con los servidores en marcha (Playwright + axe)
```

## Documentación

| Documento | Contenido |
|---|---|
| [docs/fase-1/01-diagnostico-tecnico.md](docs/fase-1/01-diagnostico-tecnico.md) | Diagnóstico, decisiones pendientes y plan |
| [docs/fase-1/02-matriz-indicadores.md](docs/fase-1/02-matriz-indicadores.md) | Los 76 indicadores ↔ módulos, visualización, filtros, fuente, publicación |
| [docs/tecnica/arquitectura.md](docs/tecnica/arquitectura.md) | Arquitectura, modelo de indicadores, seguridad, cambios respecto a la Fase 1 |
| [docs/tecnica/api.md](docs/tecnica/api.md) | API REST (27 endpoints públicos, 212 del panel) |
| [docs/tecnica/diccionario-datos.md](docs/tecnica/diccionario-datos.md) · [scripts SQL](backend/database/sql) · [modelo de datos](docs/tecnica/modelo-datos.md) · [modelo ER](docs/fase-1/03-modelo-datos-preliminar.md) | Base de datos |
| [docs/fase-1/04-roles-permisos.md](docs/fase-1/04-roles-permisos.md) | Roles y flujo de publicación (la lista final de permisos está en `BaseCatalogSeeder`) |
| [docs/tecnica/instalacion-despliegue.md](docs/tecnica/instalacion-despliegue.md) | Requisitos del servidor, instalación, respaldo, recuperación, mantenimiento |
| [docs/manual-usuario.md](docs/manual-usuario.md) | Manual del portal público |
| [docs/manual-administracion.md](docs/manual-administracion.md) | Manual del panel por rol |
| [docs/pruebas/resultados.md](docs/pruebas/resultados.md) | Resultados de las pruebas ejecutadas |
| [deploy/](deploy) | Nginx, Apache, respaldo cifrado, cron, servicio de colas |

## Pendientes institucionales

Logotipo y manual de identidad oficiales (se usa temporalmente el logotipo extraído del boceto), cifras reales por dependencia, metodologías de cálculo, listado verificado de CAT con coordenadas, autorizaciones de publicación de datos sensibles, significado de las fuentes no definidas en el Excel (CIBAGUE, SGUT, OPDI, «profesor Llanos»…) y datos del servidor. Ver §10 del diagnóstico.

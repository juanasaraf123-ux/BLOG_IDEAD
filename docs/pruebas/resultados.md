# Resultados de pruebas

Fecha de ejecución: 2026-11-09. Entorno: contenedor de desarrollo (Ubuntu 24.04, PHP 8.3.6, MariaDB 10.11.14, SQLite, Node 22, Chromium/Playwright). **Todas las pruebas listadas se ejecutaron realmente**; las que no se ejecutaron se indican al final.

## 1. Pruebas automatizadas del backend (PHPUnit)

`cd backend && php artisan test` — **24 pruebas, 95 aserciones, todas aprobadas**, en SQLite y en **MariaDB 10.11** (mismo resultado en ambos motores).

| Grupo | Pruebas |
|---|---|
| Seguridad (`SecurityTest`) | Rutas privadas exigen sesión (401) · inicio de sesión fuera del navegador rechazado (400) · contraseña errónea y bloqueo tras 5 intentos · contraseñas con hash · desafío 2FA obligatorio y código TOTP válido/incorrecto · administrador técnico sin acceso a documentos financieros/restringidos y caja menor sí a financieros · nadie modifica sus propios roles · rechazo de archivos PHP disfrazados de imagen (doble extensión y contenido falso) y aceptación de PNG real · saneamiento de HTML (`<script>`, `onclick`, `javascript:`) · documentos privados no descargables públicamente |
| Indicadores (`IndicatorWorkflowTest`) | El catálogo tiene los 76 indicadores y 13 módulos · flujo completo borrador → enviado → aprobado → publicado con separación de funciones (el coordinador no puede aprobar ni publicar) · nada visible antes de publicar · supresión de celda pequeña (n=3 < k=5 → «Reservado») · validaciones (porcentaje > 100, desagregación no admitida) · coordinador sin acceso a indicadores de otra dependencia · indicador sensible sin autorización no se publica · importación CSV con separador «;» |
| Registros institucionales (`InstitutionalRecordsTest`) | Clave seudónima estable, irreversible y que exige llave configurada · datos sensibles cifrados en la base y ocultos en las respuestas · un estudiante no se matricula dos veces en el mismo programa y período · graduados (personas) y títulos se cuentan por separado |
| Portal (`PublicPortalTest`) | 16 endpoints públicos responden · sin datos publicados las cifras del inicio quedan «pendientes» · borradores, contenido programado a futuro y datos demo ocultos (también en el buscador) · cabeceras de seguridad |

## 2. Pruebas del frontend (Vitest)

`cd frontend && npm test` — **7 pruebas aprobadas**: formatos colombianos (pesos, porcentajes, fechas sin desfase de zona horaria), tabla consultable (filtro y orden), estado «pendiente», distribución porcentual por variable.

Scripts SQL (`backend/database/sql`): ejecutados sobre una base vacía de MariaDB 10.11 → 66 tablas, 120 claves foráneas, 76 indicadores y registro de migraciones reconocido por Laravel.

Compilación de producción (`npm run build`, verificación de tipos estricta de TypeScript): sin errores.

## 3. Pruebas funcionales de extremo a extremo (Playwright, navegador Chromium)

| Prueba | Resultado |
|---|---|
| Recorrido de 32 rutas públicas, incluidos los 13 módulos con filtros (`e2e/recorrido-portal.cjs`) | Sin errores de JavaScript ni respuestas de error de la API (salvo el 404 esperado de una noticia inexistente). Ningún módulo quedó con indicadores «pendientes» con datos demo cargados |
| Panel por rol (`e2e/panel-por-rol.cjs`): Director, Administrador técnico, Comunicaciones, Caja menor, Coordinador | Inicio de sesión y navegación de todas sus secciones sin errores. Se detectó y corrigió una consulta no autorizada (403) en Informes para Caja menor |
| Flujo por API real con sesión y CSRF (curl): crear lote, valores, importación CSV, envío, revisión, publicación, retiro; noticia con flujo editorial; exportación de informe; descarga de documento | Correcto. El rol sin permiso recibió 403 en cada intento indebido |

## 4. Accesibilidad (axe-core, WCAG 2.0/2.1 A y AA)

`e2e/accesibilidad.cjs` en Inicio, módulo de Estudiantes, ficha de CAT, Noticias, Transparencia y acceso al panel: **0 violaciones** (tras corregir la estructura de la lista de contacto de la ficha CAT). Navegación por teclado, enlace «Saltar al contenido», foco visible, tablas equivalentes a cada gráfico y movimiento reducido implementados. La paleta de gráficos se validó con el verificador de daltonismo y contraste de la guía de visualización.

## 5. Diseño adaptable

Capturas a 1600×900, 1440×900, 1280×800 y iPhone 13 (390×844): sin desbordamiento horizontal; menú móvil, tarjetas y tablas con desplazamiento propio.

## 6. Rendimiento (indicativo)

Servidor de desarrollo de PHP con 4 procesos, SQLite, 300 solicitudes con 10 concurrentes (`e2e/carga.mjs`):

| Endpoint | req/s | p50 | p95 | Errores |
|---|---|---|---|---|
| `home` | 70 | 130 ms | 161 ms | 0 |
| `indicators/M02-I05` | 65 | 147 ms | 179 ms | 0 |
| `modules/estudiantes` | 74 | 129 ms | 159 ms | 0 |
| `cats/cat-ibague` (antes de caché) | 7 | 1.223 ms | 2.082 ms | 0 |
| `cats/cat-ibague` (con caché) | 68 | 139 ms | 174 ms | 0 |
| `search?q=programa` | 37 | 242 ms | 419 ms | 0 |

Estas cifras **no** representan producción (servidor de desarrollo, sin OPcache ni PHP-FPM). Las pruebas de carga definitivas deben ejecutarse en el servidor institucional con los escenarios de concurrencia que defina TI.

## 7. No ejecutado (pendiente)

- Pruebas en el servidor institucional real, con HTTPS y la configuración de `deploy/`.
- Envío real de correo de recuperación de contraseña (en desarrollo el correo se escribe en el registro).
- Pruebas con lectores de pantalla reales (NVDA/JAWS/VoiceOver) y con usuarios.
- Prueba de restauración de respaldos (`deploy/backup.sh` se verificó solo en sintaxis).
- Pruebas de penetración por un tercero.

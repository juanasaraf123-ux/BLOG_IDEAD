# Instalación, despliegue, respaldo y mantenimiento

## 1. Requisitos del servidor

| Componente | Mínimo | Probado en este proyecto |
|---|---|---|
| Sistema operativo | Linux (recomendado) o Windows Server con IIS | Ubuntu 24.04 |
| PHP | **8.3** (Laravel 13). PHP 5.6 **no es compatible** ni seguro | 8.3.6 |
| Extensiones PHP | pdo_mysql, mbstring, openssl, tokenizer, xml, ctype, json, bcmath, **fileinfo**, curl, zip, gd, intl | — |
| Base de datos | MariaDB 10.6+ o MySQL 8.0+ (`utf8mb4`) | MariaDB 10.11.14 |
| Servidor web | Nginx 1.24+ o Apache 2.4 con PHP-FPM | Servidor de desarrollo de PHP |
| Node.js | Solo para **compilar** el frontend (22 LTS); no se requiere en producción | 22.23 |
| Composer | 2.x | 2.x |
| Procesos | cron (cada minuto) y, recomendado, un trabajador de colas (systemd/Supervisor) | — |
| HTTPS | Certificado válido | — |

Dimensionamiento inicial **a validar con TI** mediante pruebas de carga en el servidor real (ver `docs/pruebas/resultados.md`): 2–4 vCPU, 4–8 GB de RAM, 50–100 GB de disco según el volumen documental.

## 2. Instalación paso a paso

```bash
# 1. Código
git clone <repositorio> /var/www/idead && cd /var/www/idead

# 2. Backend
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env            # completar APP_URL, DB_*, MAIL_*, SANCTUM_STATEFUL_DOMAINS
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force     # catálogo: roles, permisos, 76 indicadores, fuentes, departamentos (sin cifras)
php artisan storage:link
php artisan idead:crear-admin --name="Administrador técnico" --email=admin@ut.edu.co
php artisan config:cache && php artisan route:cache
chown -R www-data:www-data storage bootstrap/cache && chmod -R o-rwx storage

# 3. Frontend (en el servidor o en un equipo de compilación)
cd ../frontend
npm ci && npm run build         # genera frontend/dist

# 4. Servidor web: deploy/nginx.conf o deploy/apache-vhost.conf
# 5. Tareas: deploy/crontab.example y deploy/idead-queue.service
```

Base de datos (como administrador de MariaDB):

```sql
CREATE DATABASE idead_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'idead_app'@'localhost' IDENTIFIED BY '<contraseña-fuerte>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES ON idead_portal.* TO 'idead_app'@'localhost';
```

El script SQL equivalente al esquema completo está en `backend/database/sql/` (00, 01 y 02) (la fuente de verdad son las migraciones).

### Primer uso

1. Ingresar a `/admin` con el administrador técnico, activar 2FA (Mi cuenta).
2. Crear los usuarios reales y asignar roles y dependencias (Usuarios).
3. En Configuración: datos de contacto, logotipo oficial, enlaces, tamaño de archivos, umbral *k*, y activar «Exigir verificación en dos pasos».
4. Registrar CAT, programas, oferta por período y equipo; cargar los datos de indicadores por dependencia.

### Entorno de demostración (nunca en producción)

```bash
php artisan db:seed --class=DemoDataSeeder   # se niega a ejecutarse si APP_ENV=production
# y en .env: IDEAD_DEMO_DATA=true
```

Usuarios demo (contraseña = variable `DEMO_PASSWORD`): `director@`, `documental@`, `cajamenor@`, `comunicaciones@`, `coordinador@`, `admin@demo.idead.local`.

## 3. Entorno de desarrollo

```bash
cd backend && cp .env.example .env   # DB_CONNECTION=sqlite, IDEAD_DEMO_DATA=true, APP_ENV=local
touch database/database.sqlite && php artisan key:generate && php artisan migrate --seed && php artisan db:seed --class=DemoDataSeeder
php artisan serve                     # http://127.0.0.1:8000
cd ../frontend && npm install && npm run dev   # http://localhost:5173 (proxy a la API) — panel: /admin/
```

## 4. Respaldo y recuperación

- `deploy/backup.sh`: volcado consistente de la base (`--single-transaction`) + archivos públicos y privados, **cifrados con GPG**, sumas SHA-256 y retención configurable (30 días por defecto). Copiar a un servidor de respaldos institucional.
- Recomendado: diario completo; retención 30 días diarios + 12 mensuales; prueba de restauración trimestral.

Restauración:

```bash
gpg --decrypt db_AAAAMMDD_HHMMSS.sql.gz.gpg | gunzip | mariadb idead_portal
gpg --decrypt files_AAAAMMDD_HHMMSS.tar.gz.gpg | tar -xz -C /var/www/idead/backend/storage/app
php artisan cache:clear
```

## 5. Mantenimiento

| Frecuencia | Tarea |
|---|---|
| Mensual | `composer update` y `npm update` en un entorno de prueba; correr `php artisan test` y `npm test`; actualizar parches de PHP/MariaDB del sistema operativo |
| Mensual | Revisar Auditoría (accesos fallidos, descargas privadas, cambios de permisos) |
| Semestral | Revisar usuarios activos y roles; desactivar cuentas de personal retirado |
| Por período académico | Crear el período en Catálogos → Períodos; actualizar oferta por CAT |
| Anual | Verificar el calendario de soporte de PHP (php.net/supported-versions) y planear la actualización |

Registro de errores: `backend/storage/logs/`. Modo mantenimiento: `php artisan down` / `php artisan up`.

## 6. Lista de verificación de seguridad para producción

- [ ] `APP_ENV=production`, `APP_DEBUG=false`, `IDEAD_DEMO_DATA=false`
- [ ] HTTPS con HSTS; `SESSION_SECURE_COOKIE=true`
- [ ] Base de datos no expuesta a Internet
- [ ] `storage/app/private` fuera del docroot (por defecto lo está)
- [ ] 2FA exigido en Configuración
- [ ] Panel restringido por red institucional o VPN (opcional, recomendado)
- [ ] Respaldos cifrados probados
- [ ] Usuarios demo eliminados (no existen si nunca se ejecutó `DemoDataSeeder`)

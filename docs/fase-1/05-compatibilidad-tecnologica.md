# Evaluación de compatibilidad tecnológica

## 1. Situación conocida

- En conversaciones anteriores se identificó **PHP 5.6.40** como versión probada en el entorno existente.
- No se conocen: sistema operativo, servidor web, otras versiones de PHP instaladas, motor y versión de base de datos, Node.js, memoria, disco, HTTPS, permisos de ejecución (cron, procesos en segundo plano) ni políticas de TI.
- **Nada de lo anterior ha sido verificado en este diagnóstico**; por eso se presentan requisitos y escenarios, no una conclusión sobre el servidor.

## 2. Posición frente a PHP 5.6

PHP 5.6 dejó de recibir parches de seguridad el 31 de diciembre de 2018. Ejecutar sobre él un sistema con autenticación, datos personales y documentos financieros expone a la institución a vulnerabilidades públicas conocidas sin corrección. Además, ninguna versión de Laravel con soporte, ni las bibliotecas actuales de hash (Argon2id), MFA o validación de archivos, funcionan en PHP 5.6.

**Conclusión:** el backend **no** se desarrollará para PHP 5.6. Esto no impide reutilizar el servidor actual para servir el **frontend estático** (HTML/CSS/JS), que no ejecuta PHP.

## 3. Requisitos de la arquitectura propuesta

| Componente | Mínimo | Recomendado | Observaciones |
|---|---|---|---|
| Sistema operativo | Cualquiera que soporte los componentes | Linux LTS (Ubuntu 24.04 / Debian 12 / RHEL 9) | Windows Server + IIS es viable para PHP 8, con más trabajo de configuración. |
| Servidor web | Apache 2.4 o Nginx 1.24 o IIS 10 | Nginx | Reescritura de URL para la SPA (`try_files` / `.htaccess` / `web.config`). |
| PHP | **8.3** | **8.4** | Soporte de seguridad: 8.3 hasta fin de 2027; 8.4 hasta fin de 2028 (verificar calendario oficial en php.net al instalar). |
| Extensiones PHP | `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `fileinfo`, `curl`, `zip`, `gd` o `intl` | + `sodium` (Argon2id), `opcache`, `redis` (opcional) | `fileinfo` es obligatorio para validar el tipo real de los archivos. |
| Composer | 2.x | 2.x | Puede ejecutarse en la máquina de construcción si el servidor no lo permite. |
| Node.js | **No requerido en el servidor** | Node 22 LTS en la máquina de construcción / CI | El frontend se entrega compilado. |
| Base de datos | MariaDB 10.6 / MySQL 8.0 | MariaDB 10.11 / 11.4 LTS o MySQL 8.4 LTS | Solo accesible desde la red interna o `localhost`. |
| Procesos en segundo plano | Cron cada minuto (`schedule:run`) | Supervisor/systemd para `queue:work` | Sin cron, las importaciones y la programación de noticias se ejecutan de forma síncrona (degradado). |
| HTTPS | Certificado válido | TLS 1.2+ con HSTS | Obligatorio para el panel. |
| Memoria / CPU / disco | A estimar en Fase 8 | Punto de partida: 2–4 vCPU, 4–8 GB RAM, 50–100 GB | Ver §6.5 del diagnóstico. No es una cifra definitiva. |
| Correo | SMTP institucional | — | Recuperación de contraseña y notificaciones. |
| Respaldos | Copia diaria de BD y archivos privados | Copia cifrada fuera del servidor, retención 30/90 días, prueba de restauración trimestral | — |

## 4. Lista de verificación para la Oficina de TI

Se solicita completar (o permitir ejecutar) lo siguiente en el servidor candidato:

```bash
uname -a; cat /etc/os-release                      # sistema operativo
php -v; php -m                                     # versiones y extensiones PHP (y si hay varias: ls /usr/bin/php*)
apache2 -v || httpd -v || nginx -v                 # servidor web
mysql --version || mariadb --version               # motor de base de datos
node -v; composer -V                               # herramientas (opcionales en servidor)
free -h; nproc; df -h                              # memoria, CPU, disco
crontab -l                                         # posibilidad de tareas programadas
```

Preguntas adicionales: ¿se permite instalar o actualizar PHP? ¿hay contenedores (Docker/Podman)? ¿existe un subdominio y certificado HTTPS? ¿hay VPN o restricción por IP para el panel? ¿política de respaldos existente? ¿límites de tamaño de carga (`upload_max_filesize`, `post_max_size`, proxy)?

## 5. Escenarios de despliegue

| Escenario | Descripción | Cuándo aplica | Riesgo |
|---|---|---|---|
| **A. Actualizar el servidor actual** | Instalar PHP 8.3/8.4 (en paralelo a 5.6 si otros sistemas lo necesitan, mediante PHP-FPM por sitio), MariaDB/MySQL soportado y HTTPS | TI permite actualizar | Bajo, si las aplicaciones existentes en PHP 5.6 quedan aisladas por pool FPM. |
| **B. Servidor/VM independiente** *(recomendado si A no es posible)* | Nueva VM Linux institucional (o nube autorizada) para API + BD; el servidor actual puede seguir sirviendo el frontend estático o redirigir | El servidor actual no puede actualizarse | Bajo; requiere aprovisionar una VM. |
| **C. Contenedores** | Imágenes Docker para API, BD y servidor web, orquestadas con Compose | TI admite contenedores | Bajo; facilita migrar a infraestructura futura sin reconstruir. |

En los tres escenarios el código es el mismo: la API se configura por variables de entorno y el frontend por una URL base. Esto cumple el requisito de **migrar a infraestructura más moderna sin reconstruir la aplicación**.

## 6. Entorno de desarrollo

Durante el desarrollo se usará un entorno reproducible con contenedores (PHP 8.4, MariaDB 11.4 LTS, Node 22 LTS) para no depender del servidor institucional. Las pruebas se ejecutarán sobre ese entorno y se informarán sus resultados reales.

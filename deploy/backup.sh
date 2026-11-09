#!/usr/bin/env bash
# Respaldo diario del Portal IDEAD: base de datos + archivos privados y públicos, cifrado y con retención.
# Programar con cron (ej.: 15 2 * * * /var/www/idead/deploy/backup.sh) bajo un usuario sin privilegios de web.
# Requiere: mariadb-dump (o mysqldump), tar, gpg y una clave pública GPG institucional (BACKUP_GPG_RECIPIENT).
set -euo pipefail
APP_DIR="${APP_DIR:-/var/www/idead}"
DEST="${BACKUP_DIR:-/var/backups/idead}"
DB="${DB_DATABASE:-idead_portal}"
RECIPIENT="${BACKUP_GPG_RECIPIENT:?Defina BACKUP_GPG_RECIPIENT}"
KEEP_DAYS="${KEEP_DAYS:-30}"
STAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DEST"
umask 077
# Credenciales en ~/.my.cnf del usuario de respaldo (nunca en la línea de comandos)
mariadb-dump --single-transaction --routines --triggers "$DB" | gzip > "$DEST/db_$STAMP.sql.gz"
tar -czf "$DEST/files_$STAMP.tar.gz" -C "$APP_DIR/backend/storage/app" private public
for f in "$DEST/db_$STAMP.sql.gz" "$DEST/files_$STAMP.tar.gz"; do
  gpg --batch --yes --encrypt --recipient "$RECIPIENT" --output "$f.gpg" "$f" && rm -f "$f"
done
sha256sum "$DEST"/*_"$STAMP"*.gpg > "$DEST/SHA256SUMS_$STAMP"
find "$DEST" -type f -mtime +"$KEEP_DAYS" -delete
# Copia fuera del servidor (configurar destino institucional):
# rsync -a "$DEST/" respaldo@servidor-respaldos:/respaldos/idead/
echo "Respaldo $STAMP completado"

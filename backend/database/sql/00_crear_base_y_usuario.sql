-- =====================================================================================
-- Portal IDEAD — Paso 0: crear la base de datos y el usuario de la aplicación.
-- Ejecutar como administrador de MariaDB 10.6+ / MySQL 8.0+ (phpMyAdmin, Workbench o consola).
-- Cambie la contraseña antes de ejecutar. La base NO debe quedar expuesta a Internet.
-- =====================================================================================
CREATE DATABASE IF NOT EXISTS idead_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'idead_app'@'localhost' IDENTIFIED BY 'CAMBIAR-POR-UNA-CONTRASEÑA-FUERTE';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES ON idead_portal.* TO 'idead_app'@'localhost';
FLUSH PRIVILEGES;

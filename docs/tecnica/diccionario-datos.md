# Diccionario de datos

Generado automáticamente desde el esquema real (`idead_portal`, MariaDB 10.11) con `scripts/generar_diccionario_datos.py`.
Las tablas técnicas de Laravel (sesiones, caché, colas, migraciones) se omiten. Script de creación: [`esquema-mariadb.sql`](esquema-mariadb.sql); fuente de verdad: `backend/database/migrations`.

## `academic_periods`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `code` | varchar(20) | no | UNI |  |  |
| `year` | smallint(5) unsigned | no | MUL |  |  |
| `term` | tinyint(3) unsigned | sí |  | NULL |  |
| `type` | varchar(20) | no |  |  |  |
| `starts_on` | date | sí |  | NULL |  |
| `ends_on` | date | sí |  | NULL |  |

Índices: `academic_periods_code_unique` (code) — único; `academic_periods_year_term_index` (year,term); `PRIMARY` (id) — único

## `agreements`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `number` | varchar(60) | sí |  | NULL |  |
| `counterpart` | varchar(255) | no |  |  |  |
| `object` | text | no |  |  |  |
| `start_date` | date | sí |  | NULL |  |
| `end_date` | date | sí |  | NULL |  |
| `status` | varchar(20) | no |  | 'vigente' |  |
| `contributed_amount` | decimal(18,2) | sí |  | NULL |  |
| `is_public` | tinyint(1) | no |  | 0 |  |
| `dependency_id` | bigint(20) unsigned | sí | MUL | NULL | dependencies.id |
| `project_id` | bigint(20) unsigned | sí | MUL | NULL | projects.id |
| `is_demo` | tinyint(1) | no |  | 0 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `agreements_dependency_id_foreign` (dependency_id); `agreements_project_id_foreign` (project_id); `PRIMARY` (id) — único

## `audit_logs`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `user_id` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `action` | varchar(80) | no | MUL |  |  |
| `entity_type` | varchar(80) | sí | MUL | NULL |  |
| `entity_id` | bigint(20) unsigned | sí |  | NULL |  |
| `meta` | longtext | sí |  | NULL |  |
| `ip` | varchar(45) | sí |  | NULL |  |
| `user_agent` | varchar(255) | sí |  | NULL |  |
| `created_at` | timestamp | no |  | current_timestamp() |  |

Índices: `audit_logs_action_created_at_index` (action,created_at); `audit_logs_entity_type_entity_id_index` (entity_type,entity_id); `audit_logs_user_id_foreign` (user_id); `PRIMARY` (id) — único

## `catalog_items`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `list_type` | varchar(60) | no | MUL |  |  |
| `title` | varchar(255) | no |  |  |  |
| `description` | text | sí |  | NULL |  |
| `category` | varchar(120) | sí |  | NULL |  |
| `url` | varchar(255) | sí |  | NULL |  |
| `state` | varchar(60) | sí |  | NULL |  |
| `year` | smallint(5) unsigned | sí |  | NULL |  |
| `date` | date | sí |  | NULL |  |
| `cat_id` | bigint(20) unsigned | sí | MUL | NULL | cats.id |
| `program_id` | bigint(20) unsigned | sí | MUL | NULL | programs.id |
| `dependency_id` | bigint(20) unsigned | sí | MUL | NULL | dependencies.id |
| `publication_status` | varchar(20) | no |  | 'borrador' |  |
| `is_demo` | tinyint(1) | no |  | 0 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `catalog_items_cat_id_foreign` (cat_id); `catalog_items_dependency_id_foreign` (dependency_id); `catalog_items_list_type_publication_status_index` (list_type,publication_status); `catalog_items_program_id_foreign` (program_id); `PRIMARY` (id) — único

## `cats`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `slug` | varchar(120) | no | UNI |  |  |
| `name` | varchar(255) | no |  |  |  |
| `municipality_id` | bigint(20) unsigned | no | MUL |  | municipalities.id |
| `address` | varchar(255) | sí |  | NULL |  |
| `latitude` | decimal(9,6) | sí |  | NULL |  |
| `longitude` | decimal(9,6) | sí |  | NULL |  |
| `coords_verified` | tinyint(1) | no |  | 0 |  |
| `history` | text | sí |  | NULL |  |
| `phone` | varchar(60) | sí |  | NULL |  |
| `email` | varchar(255) | sí |  | NULL |  |
| `schedule` | text | sí |  | NULL |  |
| `manager_name` | varchar(255) | sí |  | NULL |  |
| `manager_public` | tinyint(1) | no |  | 0 |  |
| `opened_on` | date | sí |  | NULL |  |
| `status` | varchar(20) | no |  | 'activo' |  |
| `photo_file_id` | bigint(20) unsigned | sí | MUL | NULL | files.id |
| `publication_status` | varchar(20) | no | MUL | 'borrador' |  |
| `dependency_id` | bigint(20) unsigned | sí | MUL | NULL | dependencies.id |
| `is_demo` | tinyint(1) | no |  | 0 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `cats_dependency_id_foreign` (dependency_id); `cats_municipality_id_foreign` (municipality_id); `cats_photo_file_id_foreign` (photo_file_id); `cats_publication_status_status_index` (publication_status,status); `cats_slug_unique` (slug) — único; `PRIMARY` (id) — único

## `cat_events`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `cat_id` | bigint(20) unsigned | no | MUL |  | cats.id |
| `event_type` | varchar(20) | no |  |  |  |
| `event_date` | date | no |  |  |  |
| `description` | varchar(255) | sí |  | NULL |  |
| `act_reference` | varchar(255) | sí |  | NULL |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `cat_events_cat_id_foreign` (cat_id); `PRIMARY` (id) — único

## `cat_facilities`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `cat_id` | bigint(20) unsigned | no | MUL |  | cats.id |
| `facility_type` | varchar(40) | no |  |  |  |
| `quantity` | int(10) unsigned | no |  | 0 |  |
| `capacity` | int(10) unsigned | sí |  | NULL |  |
| `notes` | varchar(255) | sí |  | NULL |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `cat_facilities_cat_id_facility_type_unique` (cat_id,facility_type) — único; `PRIMARY` (id) — único

## `cat_municipality`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `cat_id` | bigint(20) unsigned | no | PRI |  | cats.id |
| `municipality_id` | bigint(20) unsigned | no | PRI |  | municipalities.id |

Índices: `cat_municipality_municipality_id_foreign` (municipality_id); `PRIMARY` (cat_id,municipality_id) — único

## `cat_project`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `cat_id` | bigint(20) unsigned | no | PRI |  | cats.id |
| `project_id` | bigint(20) unsigned | no | PRI |  | projects.id |

Índices: `cat_project_project_id_foreign` (project_id); `PRIMARY` (cat_id,project_id) — único

## `cat_sites`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `cat_id` | bigint(20) unsigned | no | MUL |  | cats.id |
| `name` | varchar(255) | no |  |  |  |
| `ownership` | varchar(20) | no |  |  |  |
| `address` | varchar(255) | sí |  | NULL |  |
| `is_active` | tinyint(1) | no |  | 1 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `cat_sites_cat_id_foreign` (cat_id); `PRIMARY` (id) — único

## `change_history`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `entity_type` | varchar(80) | no | MUL |  |  |
| `entity_id` | bigint(20) unsigned | no |  |  |  |
| `event` | varchar(20) | no |  |  |  |
| `changes` | longtext | sí |  | NULL |  |
| `user_id` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `created_at` | timestamp | no |  | current_timestamp() |  |

Índices: `change_history_entity_type_entity_id_index` (entity_type,entity_id); `change_history_user_id_foreign` (user_id); `PRIMARY` (id) — único

## `classifiers`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `code` | varchar(60) | no | UNI |  |  |
| `name` | varchar(255) | no |  |  |  |
| `is_partition` | tinyint(1) | no |  | 0 |  |

Índices: `classifiers_code_unique` (code) — único; `PRIMARY` (id) — único

## `classifier_items`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `classifier_id` | bigint(20) unsigned | no | MUL |  | classifiers.id |
| `code` | varchar(60) | no |  |  |  |
| `label` | varchar(255) | no |  |  |  |
| `sort` | smallint(5) unsigned | no |  | 0 |  |

Índices: `classifier_items_classifier_id_code_unique` (classifier_id,code) — único; `PRIMARY` (id) — único

## `data_sources`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `code` | varchar(60) | no | UNI |  |  |
| `name` | varchar(255) | no |  |  |  |
| `kind` | varchar(30) | no |  | 'dependencia' |  |
| `official_name_status` | varchar(20) | no |  | 'pendiente' |  |

Índices: `data_sources_code_unique` (code) — único; `PRIMARY` (id) — único

## `data_source_indicator`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `indicator_id` | bigint(20) unsigned | no | PRI |  | indicators.id |
| `data_source_id` | bigint(20) unsigned | no | PRI |  | data_sources.id |

Índices: `data_source_indicator_data_source_id_foreign` (data_source_id); `PRIMARY` (indicator_id,data_source_id) — único

## `data_submissions`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `indicator_id` | bigint(20) unsigned | no | MUL |  | indicators.id |
| `title` | varchar(255) | sí |  | NULL |  |
| `status` | varchar(20) | no |  | 'borrador' |  |
| `created_by` | bigint(20) unsigned | no | MUL |  | users.id |
| `submitted_by` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `submitted_at` | timestamp | sí |  | NULL |  |
| `approved_by` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `approved_at` | timestamp | sí |  | NULL |  |
| `published_by` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `published_at` | timestamp | sí |  | NULL |  |
| `supersedes_id` | bigint(20) unsigned | sí | MUL | NULL | data_submissions.id |
| `source_file_id` | bigint(20) unsigned | sí | MUL | NULL | files.id |
| `source_note` | text | sí |  | NULL |  |
| `is_demo` | tinyint(1) | no |  | 0 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `data_submissions_approved_by_foreign` (approved_by); `data_submissions_created_by_foreign` (created_by); `data_submissions_indicator_id_status_index` (indicator_id,status); `data_submissions_published_by_foreign` (published_by); `data_submissions_source_file_id_foreign` (source_file_id); `data_submissions_submitted_by_foreign` (submitted_by); `data_submissions_supersedes_id_foreign` (supersedes_id); `PRIMARY` (id) — único

## `departments`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `code` | char(2) | no | UNI |  |  |
| `name` | varchar(255) | no |  |  |  |

Índices: `departments_code_unique` (code) — único; `PRIMARY` (id) — único

## `dependencies`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `code` | varchar(40) | no | UNI |  |  |
| `name` | varchar(255) | no |  |  |  |
| `description` | text | sí |  | NULL |  |
| `parent_id` | bigint(20) unsigned | sí | MUL | NULL | dependencies.id |
| `is_active` | tinyint(1) | no |  | 1 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `dependencies_code_unique` (code) — único; `dependencies_parent_id_foreign` (parent_id); `PRIMARY` (id) — único

## `dependency_user`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `dependency_id` | bigint(20) unsigned | no | PRI |  | dependencies.id |
| `user_id` | bigint(20) unsigned | no | PRI |  | users.id |

Índices: `dependency_user_user_id_foreign` (user_id); `PRIMARY` (dependency_id,user_id) — único

## `documents`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `title` | varchar(255) | no |  |  |  |
| `description` | text | sí |  | NULL |  |
| `category_id` | bigint(20) unsigned | no | MUL |  | document_categories.id |
| `dependency_id` | bigint(20) unsigned | sí | MUL | NULL | dependencies.id |
| `confidentiality` | varchar(20) | no | MUL |  |  |
| `status` | varchar(20) | no |  | 'vigente' |  |
| `related_type` | varchar(40) | sí | MUL | NULL |  |
| `related_id` | bigint(20) unsigned | sí |  | NULL |  |
| `current_version` | int(10) unsigned | no |  | 1 |  |
| `created_by` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `documents_category_id_foreign` (category_id); `documents_confidentiality_status_index` (confidentiality,status); `documents_created_by_foreign` (created_by); `documents_dependency_id_foreign` (dependency_id); `documents_related_type_related_id_index` (related_type,related_id); `PRIMARY` (id) — único

## `document_categories`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `code` | varchar(60) | no | UNI |  |  |
| `name` | varchar(255) | no |  |  |  |
| `default_confidentiality` | varchar(20) | no |  | 'interno' |  |

Índices: `document_categories_code_unique` (code) — único; `PRIMARY` (id) — único

## `document_versions`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `document_id` | bigint(20) unsigned | no | MUL |  | documents.id |
| `version_no` | int(10) unsigned | no |  |  |  |
| `file_id` | bigint(20) unsigned | no | MUL |  | files.id |
| `change_note` | varchar(255) | sí |  | NULL |  |
| `uploaded_by` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `document_versions_document_id_version_no_unique` (document_id,version_no) — único; `document_versions_file_id_foreign` (file_id); `document_versions_uploaded_by_foreign` (uploaded_by); `PRIMARY` (id) — único

## `education_levels`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `code` | varchar(40) | no | UNI |  |  |
| `name` | varchar(255) | no |  |  |  |
| `cycle` | varchar(20) | no |  |  |  |
| `sort` | smallint(5) unsigned | no |  | 0 |  |

Índices: `education_levels_code_unique` (code) — único; `PRIMARY` (id) — único

## `events`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `slug` | varchar(180) | no | UNI |  |  |
| `title` | varchar(255) | no |  |  |  |
| `summary` | varchar(500) | sí |  | NULL |  |
| `body` | longtext | sí |  | NULL |  |
| `category` | varchar(60) | sí |  | NULL |  |
| `starts_at` | datetime | no |  |  |  |
| `ends_at` | datetime | sí |  | NULL |  |
| `location` | varchar(255) | sí |  | NULL |  |
| `cat_id` | bigint(20) unsigned | sí | MUL | NULL | cats.id |
| `cover_file_id` | bigint(20) unsigned | sí | MUL | NULL | files.id |
| `status` | varchar(20) | no | MUL | 'borrador' |  |
| `publish_at` | timestamp | sí |  | NULL |  |
| `author_id` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `approved_by` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `is_demo` | tinyint(1) | no |  | 0 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `events_approved_by_foreign` (approved_by); `events_author_id_foreign` (author_id); `events_cat_id_foreign` (cat_id); `events_cover_file_id_foreign` (cover_file_id); `events_slug_unique` (slug) — único; `events_status_starts_at_index` (status,starts_at); `PRIMARY` (id) — único

## `files`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `disk` | varchar(20) | no |  |  |  |
| `path` | varchar(255) | no |  |  |  |
| `original_name` | varchar(255) | no |  |  |  |
| `mime` | varchar(120) | no |  |  |  |
| `size_bytes` | bigint(20) unsigned | no |  |  |  |
| `sha256` | char(64) | no |  |  |  |
| `uploaded_by` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `files_uploaded_by_foreign` (uploaded_by); `PRIMARY` (id) — único

## `hero_slides`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `title` | varchar(255) | no |  |  |  |
| `subtitle` | varchar(255) | sí |  | NULL |  |
| `image_file_id` | bigint(20) unsigned | sí | MUL | NULL | files.id |
| `link_url` | varchar(255) | sí |  | NULL |  |
| `sort` | smallint(5) unsigned | no |  | 0 |  |
| `is_active` | tinyint(1) | no |  | 1 |  |
| `starts_on` | date | sí |  | NULL |  |
| `ends_on` | date | sí |  | NULL |  |
| `is_demo` | tinyint(1) | no |  | 0 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `hero_slides_image_file_id_foreign` (image_file_id); `PRIMARY` (id) — único

## `home_highlights`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `label` | varchar(255) | no |  |  |  |
| `icon` | varchar(40) | no |  |  |  |
| `metric_type` | varchar(30) | no |  | 'indicator' |  |
| `indicator_id` | bigint(20) unsigned | sí | MUL | NULL | indicators.id |
| `classifier_item_id` | bigint(20) unsigned | sí | MUL | NULL | classifier_items.id |
| `link` | varchar(255) | sí |  | NULL |  |
| `sort` | smallint(5) unsigned | no |  | 0 |  |
| `is_active` | tinyint(1) | no |  | 1 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `home_highlights_classifier_item_id_foreign` (classifier_item_id); `home_highlights_indicator_id_foreign` (indicator_id); `PRIMARY` (id) — único

## `indicators`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `code` | varchar(20) | no | UNI |  |  |
| `module_id` | bigint(20) unsigned | no | MUL |  | indicator_modules.id |
| `sort` | smallint(5) unsigned | no |  | 0 |  |
| `name` | varchar(255) | no |  |  |  |
| `description` | text | sí |  | NULL |  |
| `information_required` | text | sí |  | NULL |  |
| `suggested_visualization` | varchar(255) | sí |  | NULL |  |
| `source_text` | varchar(255) | sí |  | NULL |  |
| `unit` | varchar(30) | no |  | 'personas' |  |
| `value_type` | varchar(20) | no |  | 'count' |  |
| `periodicity` | varchar(20) | no |  | 'semestral' |  |
| `chart_type` | varchar(20) | no |  | 'bar' |  |
| `group_by` | varchar(20) | sí |  | NULL |  |
| `classifier_id` | bigint(20) unsigned | sí | MUL | NULL | classifiers.id |
| `allowed_dimensions` | longtext | no |  |  |  |
| `widget` | varchar(60) | sí |  | NULL |  |
| `filters_text` | varchar(255) | sí |  | NULL |  |
| `publication_level` | varchar(10) | no |  | 'PUB' |  |
| `min_cell_size` | tinyint(3) unsigned | sí |  | NULL |  |
| `methodology` | text | sí |  | NULL |  |
| `methodology_status` | varchar(20) | no |  | 'pendiente' |  |
| `responsible_dependency_id` | bigint(20) unsigned | sí | MUL | NULL | dependencies.id |
| `observations` | text | sí |  | NULL |  |
| `publication_authorized` | tinyint(1) | no |  | 1 |  |
| `is_active` | tinyint(1) | no |  | 1 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `indicators_classifier_id_foreign` (classifier_id); `indicators_code_unique` (code) — único; `indicators_module_id_sort_index` (module_id,sort); `indicators_responsible_dependency_id_foreign` (responsible_dependency_id); `PRIMARY` (id) — único

## `indicator_modules`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `number` | tinyint(3) unsigned | no | UNI |  |  |
| `slug` | varchar(80) | no | UNI |  |  |
| `name` | varchar(255) | no |  |  |  |
| `description` | text | sí |  | NULL |  |
| `icon` | varchar(40) | sí |  | NULL |  |

Índices: `indicator_modules_number_unique` (number) — único; `indicator_modules_slug_unique` (slug) — único; `PRIMARY` (id) — único

## `indicator_values`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `submission_id` | bigint(20) unsigned | no | MUL |  | data_submissions.id |
| `period_id` | bigint(20) unsigned | no | MUL |  | academic_periods.id |
| `program_id` | bigint(20) unsigned | sí | MUL | NULL | programs.id |
| `cat_id` | bigint(20) unsigned | sí | MUL | NULL | cats.id |
| `department_id` | bigint(20) unsigned | sí | MUL | NULL | departments.id |
| `municipality_id` | bigint(20) unsigned | sí | MUL | NULL | municipalities.id |
| `level_id` | bigint(20) unsigned | sí | MUL | NULL | education_levels.id |
| `area_id` | bigint(20) unsigned | sí | MUL | NULL | knowledge_areas.id |
| `classifier_item_id` | bigint(20) unsigned | sí | MUL | NULL | classifier_items.id |
| `value` | decimal(20,4) | sí |  | NULL |  |
| `is_suppressed` | tinyint(1) | no |  | 0 |  |
| `note` | varchar(255) | sí |  | NULL |  |
| `dims_hash` | varchar(64) | no |  |  |  |

Índices: `indicator_values_area_id_foreign` (area_id); `indicator_values_cat_id_period_id_index` (cat_id,period_id); `indicator_values_classifier_item_id_foreign` (classifier_item_id); `indicator_values_department_id_foreign` (department_id); `indicator_values_level_id_foreign` (level_id); `indicator_values_municipality_id_foreign` (municipality_id); `indicator_values_period_id_index` (period_id); `indicator_values_program_id_period_id_index` (program_id,period_id); `indicator_values_submission_id_dims_hash_unique` (submission_id,dims_hash) — único; `PRIMARY` (id) — único

## `knowledge_areas`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `code` | varchar(40) | no | UNI |  |  |
| `name` | varchar(255) | no |  |  |  |
| `classification` | varchar(40) | no |  | 'pendiente' |  |

Índices: `knowledge_areas_code_unique` (code) — único; `PRIMARY` (id) — único

## `media_items`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `title` | varchar(255) | no |  |  |  |
| `type` | varchar(10) | no |  |  |  |
| `file_id` | bigint(20) unsigned | sí | MUL | NULL | files.id |
| `video_url` | varchar(255) | sí |  | NULL |  |
| `description` | text | sí |  | NULL |  |
| `album` | varchar(120) | sí |  | NULL |  |
| `cat_id` | bigint(20) unsigned | sí | MUL | NULL | cats.id |
| `image_authorized` | tinyint(1) | no |  | 0 |  |
| `status` | varchar(20) | no |  | 'borrador' |  |
| `publish_at` | timestamp | sí |  | NULL |  |
| `author_id` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `approved_by` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `is_demo` | tinyint(1) | no |  | 0 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `media_items_approved_by_foreign` (approved_by); `media_items_author_id_foreign` (author_id); `media_items_cat_id_foreign` (cat_id); `media_items_file_id_foreign` (file_id); `PRIMARY` (id) — único

## `municipalities`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `department_id` | bigint(20) unsigned | no | MUL |  | departments.id |
| `code` | varchar(5) | sí | UNI | NULL |  |
| `name` | varchar(255) | no |  |  |  |
| `latitude` | decimal(9,6) | sí |  | NULL |  |
| `longitude` | decimal(9,6) | sí |  | NULL |  |

Índices: `municipalities_code_unique` (code) — único; `municipalities_department_id_index` (department_id); `PRIMARY` (id) — único

## `news`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `slug` | varchar(180) | no | UNI |  |  |
| `title` | varchar(255) | no |  |  |  |
| `summary` | varchar(500) | sí |  | NULL |  |
| `body` | longtext | sí |  | NULL |  |
| `category_id` | bigint(20) unsigned | sí | MUL | NULL | news_categories.id |
| `cover_file_id` | bigint(20) unsigned | sí | MUL | NULL | files.id |
| `cat_id` | bigint(20) unsigned | sí | MUL | NULL | cats.id |
| `is_featured` | tinyint(1) | no |  | 0 |  |
| `status` | varchar(20) | no | MUL | 'borrador' |  |
| `publish_at` | timestamp | sí |  | NULL |  |
| `author_id` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `approved_by` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `is_demo` | tinyint(1) | no |  | 0 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `news_approved_by_foreign` (approved_by); `news_author_id_foreign` (author_id); `news_category_id_foreign` (category_id); `news_cat_id_foreign` (cat_id); `news_cover_file_id_foreign` (cover_file_id); `news_slug_unique` (slug) — único; `news_status_publish_at_index` (status,publish_at); `PRIMARY` (id) — único

## `news_categories`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `slug` | varchar(80) | no | UNI |  |  |
| `name` | varchar(255) | no |  |  |  |

Índices: `news_categories_slug_unique` (slug) — único; `PRIMARY` (id) — único

## `pages`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `slug` | varchar(120) | no | UNI |  |  |
| `title` | varchar(255) | no |  |  |  |
| `body` | longtext | sí |  | NULL |  |
| `status` | varchar(20) | no |  | 'borrador' |  |
| `publish_at` | timestamp | sí |  | NULL |  |
| `author_id` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `approved_by` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `pages_approved_by_foreign` (approved_by); `pages_author_id_foreign` (author_id); `pages_slug_unique` (slug) — único; `PRIMARY` (id) — único

## `permissions`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `code` | varchar(80) | no | UNI |  |  |
| `group` | varchar(60) | no |  |  |  |
| `description` | varchar(255) | no |  |  |  |

Índices: `permissions_code_unique` (code) — único; `PRIMARY` (id) — único

## `permission_role`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `role_id` | bigint(20) unsigned | no | PRI |  | roles.id |
| `permission_id` | bigint(20) unsigned | no | PRI |  | permissions.id |

Índices: `permission_role_permission_id_foreign` (permission_id); `PRIMARY` (role_id,permission_id) — único

## `petty_cash_budgets`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `year` | smallint(5) unsigned | no |  |  |  |
| `name` | varchar(255) | no |  |  |  |
| `amount` | decimal(18,2) | no |  |  |  |
| `notes` | text | sí |  | NULL |  |
| `created_by` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `petty_cash_budgets_created_by_foreign` (created_by); `PRIMARY` (id) — único

## `petty_cash_expenses`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `budget_id` | bigint(20) unsigned | no | MUL |  | petty_cash_budgets.id |
| `expense_date` | date | no |  |  |  |
| `concept` | varchar(255) | no |  |  |  |
| `provider` | varchar(255) | sí |  | NULL |  |
| `invoice_number` | varchar(60) | sí |  | NULL |  |
| `amount` | decimal(18,2) | no |  |  |  |
| `document_id` | bigint(20) unsigned | sí | MUL | NULL | documents.id |
| `status` | varchar(20) | no |  | 'registrado' |  |
| `created_by` | bigint(20) unsigned | sí | MUL | NULL | users.id |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `petty_cash_expenses_budget_id_foreign` (budget_id); `petty_cash_expenses_created_by_foreign` (created_by); `petty_cash_expenses_document_id_foreign` (document_id); `PRIMARY` (id) — único

## `programs`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `slug` | varchar(150) | no | UNI |  |  |
| `snies_code` | varchar(20) | sí | UNI | NULL |  |
| `name` | varchar(255) | no |  |  |  |
| `level_id` | bigint(20) unsigned | no | MUL |  | education_levels.id |
| `area_id` | bigint(20) unsigned | sí | MUL | NULL | knowledge_areas.id |
| `dependency_id` | bigint(20) unsigned | sí | MUL | NULL | dependencies.id |
| `modality` | varchar(40) | no |  | 'distancia' |  |
| `duration_semesters` | smallint(5) unsigned | sí |  | NULL |  |
| `credits` | smallint(5) unsigned | sí |  | NULL |  |
| `description` | text | sí |  | NULL |  |
| `qualified_registry_until` | date | sí |  | NULL |  |
| `accreditation_until` | date | sí |  | NULL |  |
| `status` | varchar(20) | no |  | 'activo' |  |
| `publication_status` | varchar(20) | no |  | 'borrador' |  |
| `is_demo` | tinyint(1) | no |  | 0 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `PRIMARY` (id) — único; `programs_area_id_foreign` (area_id); `programs_dependency_id_foreign` (dependency_id); `programs_level_id_foreign` (level_id); `programs_slug_unique` (slug) — único; `programs_snies_code_unique` (snies_code) — único

## `program_offerings`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `program_id` | bigint(20) unsigned | no | MUL |  | programs.id |
| `cat_id` | bigint(20) unsigned | no | MUL |  | cats.id |
| `period_id` | bigint(20) unsigned | no | MUL |  | academic_periods.id |
| `admits_new` | tinyint(1) | no |  | 1 |  |
| `approved_quota` | int(10) unsigned | sí |  | NULL |  |
| `act_reference` | varchar(255) | sí |  | NULL |  |
| `is_demo` | tinyint(1) | no |  | 0 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `PRIMARY` (id) — único; `program_offerings_cat_id_period_id_index` (cat_id,period_id); `program_offerings_period_id_foreign` (period_id); `program_offerings_program_id_cat_id_period_id_unique` (program_id,cat_id,period_id) — único

## `projects`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `slug` | varchar(180) | no | UNI |  |  |
| `code` | varchar(40) | sí |  | NULL |  |
| `name` | varchar(255) | no |  |  |  |
| `objective` | text | sí |  | NULL |  |
| `description` | longtext | sí |  | NULL |  |
| `investment_line` | varchar(60) | sí |  | NULL |  |
| `status` | varchar(20) | no | MUL | 'radicado' |  |
| `location` | varchar(255) | sí |  | NULL |  |
| `approved_amount` | decimal(18,2) | sí |  | NULL |  |
| `executed_amount` | decimal(18,2) | sí |  | NULL |  |
| `progress_pct` | decimal(5,2) | sí |  | NULL |  |
| `beneficiaries_count` | int(10) unsigned | sí |  | NULL |  |
| `results` | text | sí |  | NULL |  |
| `start_date` | date | sí |  | NULL |  |
| `end_date` | date | sí |  | NULL |  |
| `dependency_id` | bigint(20) unsigned | sí | MUL | NULL | dependencies.id |
| `cover_file_id` | bigint(20) unsigned | sí | MUL | NULL | files.id |
| `publication_status` | varchar(20) | no |  | 'borrador' |  |
| `is_demo` | tinyint(1) | no |  | 0 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `PRIMARY` (id) — único; `projects_cover_file_id_foreign` (cover_file_id); `projects_dependency_id_foreign` (dependency_id); `projects_slug_unique` (slug) — único; `projects_status_publication_status_index` (status,publication_status)

## `project_progress`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `project_id` | bigint(20) unsigned | no | MUL |  | projects.id |
| `reported_on` | date | no |  |  |  |
| `progress_pct` | decimal(5,2) | no |  |  |  |
| `executed_amount` | decimal(18,2) | sí |  | NULL |  |
| `note` | varchar(255) | sí |  | NULL |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `PRIMARY` (id) — único; `project_progress_project_id_foreign` (project_id)

## `reviews`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `reviewable_type` | varchar(60) | no | MUL |  |  |
| `reviewable_id` | bigint(20) unsigned | no |  |  |  |
| `reviewer_id` | bigint(20) unsigned | no | MUL |  | users.id |
| `decision` | varchar(20) | no |  |  |  |
| `comment` | text | sí |  | NULL |  |
| `created_at` | timestamp | no |  | current_timestamp() |  |

Índices: `PRIMARY` (id) — único; `reviews_reviewable_type_reviewable_id_index` (reviewable_type,reviewable_id); `reviews_reviewer_id_foreign` (reviewer_id)

## `roles`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `code` | varchar(60) | no | UNI |  |  |
| `name` | varchar(255) | no |  |  |  |
| `description` | text | sí |  | NULL |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `PRIMARY` (id) — único; `roles_code_unique` (code) — único

## `role_user`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `role_id` | bigint(20) unsigned | no | PRI |  | roles.id |
| `user_id` | bigint(20) unsigned | no | PRI |  | users.id |

Índices: `PRIMARY` (role_id,user_id) — único; `role_user_user_id_foreign` (user_id)

## `settings`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `key` | varchar(80) | no | PRI |  |  |
| `value` | text | sí |  | NULL |  |
| `is_public` | tinyint(1) | no |  | 0 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `PRIMARY` (key) — único

## `team_units`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `name` | varchar(255) | no |  |  |  |
| `description` | text | sí |  | NULL |  |
| `icon` | varchar(40) | sí |  | NULL |  |
| `email` | varchar(255) | sí |  | NULL |  |
| `phone` | varchar(60) | sí |  | NULL |  |
| `link` | varchar(255) | sí |  | NULL |  |
| `sort` | smallint(5) unsigned | no |  | 0 |  |
| `is_active` | tinyint(1) | no |  | 1 |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `PRIMARY` (id) — único

## `users`

| Campo | Tipo | Nulo | Clave | Por defecto | Referencia |
|---|---|---|---|---|---|
| `id` | bigint(20) unsigned auto_increment | no | PRI |  |  |
| `name` | varchar(255) | no |  |  |  |
| `email` | varchar(255) | no | UNI |  |  |
| `email_verified_at` | timestamp | sí |  | NULL |  |
| `password` | varchar(255) | no |  |  |  |
| `is_active` | tinyint(1) | no |  | 1 |  |
| `mfa_secret` | text | sí |  | NULL |  |
| `mfa_enabled` | tinyint(1) | no |  | 0 |  |
| `last_login_at` | timestamp | sí |  | NULL |  |
| `password_changed_at` | timestamp | sí |  | NULL |  |
| `remember_token` | varchar(100) | sí |  | NULL |  |
| `created_at` | timestamp | sí |  | NULL |  |
| `updated_at` | timestamp | sí |  | NULL |  |

Índices: `PRIMARY` (id) — único; `users_email_unique` (email) — único

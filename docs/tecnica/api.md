# API REST del Portal IDEAD

Generada desde `php artisan route:list`. Todas las respuestas son JSON (UTF-8). Errores: `401` sin sesión, `403` sin permiso, `404` inexistente o no publicado, `419` token CSRF vencido, `422` validación (`errors` por campo), `429` límite de solicitudes.

## Convenciones

- **Pública** (`/api/public/v1`): solo lectura, sin autenticación, únicamente contenido publicado y autorizado; respuestas en caché que se invalida en cada publicación. Límite: 1.500 solicitudes/minuto por IP (30/min para exportaciones y descargas).
- **Panel** (`/api/admin/v1`): sesión por cookie `HttpOnly` + cabecera `X-XSRF-TOKEN` (obtener antes `GET /sanctum/csrf-cookie`). Cada operación verifica permisos del rol y alcance por dependencia en el servidor. Límite de inicio de sesión: 10/min por IP y 5 intentos fallidos por correo+IP (bloqueo 15 min).
- **Filtros de indicadores**: `period` (código o id), `year`, `program`, `cat`, `department`, `municipality`, `level`, `area`, `classifier` (ids). Los filtros no admitidos por un indicador se informan en `ignored_filters`.
- **Recursos CRUD del panel** (`news`, `events`, `media`, `pages`, `hero-slides`, `highlights`, `team-units`, `news-categories`, `cats`, `programs`, `offerings`, `projects`, `project-progress`, `agreements`, `catalog-items`, `departments`, `municipalities`, `education-levels`, `knowledge-areas`, `periods`, `classifiers`, `classifier-items`, `data-sources`, `dependencies`, `document-categories`, `petty-cash-budgets`, `petty-cash-expenses`): `GET` lista paginada (`q`, `per_page`, `estado`, filtros), `POST` crea, `GET/PUT/DELETE {id}`, `POST {id}/workflow` con `action` = `enviar|devolver|publicar|despublicar` y `comment`.

## Ejemplo: datos de un indicador

```http
GET /api/public/v1/indicators/M02-I03?period=2026-2&department=23
```

```json
{ "indicator": { "code": "M02-I03", "name": "Distribución de estudiantes", "unit": "personas", "methodology_status": "pendiente", "source": "BD matriculados", ... },
  "status": "publicado",
  "data": { "kpi": { "period": "2026-2", "value": 11016, "suppressed": false, "derived": false },
            "trend": [...], "breakdown": [{ "label": "CAT Ibagué", "value": 1350, "suppressed": false }], "series_by_group": [...],
            "rows": [...], "last_published_at": "...", "is_demo": false } }
```

## Endpoints públicos

| Método | Ruta | Acción |
|---|---|---|
| GET | `/api/public/v1/agreements` | PortalController@agreements |
| GET | `/api/public/v1/cats` | PortalController@cats |
| GET | `/api/public/v1/cats/{slug}` | PortalController@cat |
| GET | `/api/public/v1/documents` | PortalController@documents |
| GET | `/api/public/v1/documents/{id}/download` | PortalController@documentDownload |
| GET | `/api/public/v1/events` | PortalController@events |
| GET | `/api/public/v1/events/{slug}` | PortalController@event |
| GET | `/api/public/v1/filters` | PortalController@filterOptions |
| GET | `/api/public/v1/home` | PortalController@home |
| GET | `/api/public/v1/indicators/{code}` | PortalController@indicatorData |
| GET | `/api/public/v1/indicators/{code}/export` | PortalController@indicatorExport |
| GET | `/api/public/v1/lists/{type}` | PortalController@lists |
| GET | `/api/public/v1/media` | PortalController@media |
| GET | `/api/public/v1/modules` | PortalController@modules |
| GET | `/api/public/v1/modules/{slug}` | PortalController@module |
| GET | `/api/public/v1/news` | PortalController@news |
| GET | `/api/public/v1/news-categories` | PortalController@newsCategories |
| GET | `/api/public/v1/news/{slug}` | PortalController@newsItem |
| GET | `/api/public/v1/offerings` | PortalController@offerings |
| GET | `/api/public/v1/pages/{slug}` | PortalController@page |
| GET | `/api/public/v1/programs` | PortalController@programs |
| GET | `/api/public/v1/programs/{slug}` | PortalController@program |
| GET | `/api/public/v1/projects` | PortalController@projects |
| GET | `/api/public/v1/projects/{slug}` | PortalController@project |
| GET | `/api/public/v1/search` | PortalController@search |
| GET | `/api/public/v1/site` | PortalController@site |
| GET | `/api/public/v1/transparency` | PortalController@transparency |

## Endpoints del panel

| Método | Ruta | Acción |
|---|---|---|
| GET | `/api/admin/v1/agreements` | AgreementController@index |
| POST | `/api/admin/v1/agreements` | AgreementController@store |
| GET | `/api/admin/v1/agreements/{id}` | AgreementController@show |
| PUT | `/api/admin/v1/agreements/{id}` | AgreementController@update |
| DELETE | `/api/admin/v1/agreements/{id}` | AgreementController@destroy |
| POST | `/api/admin/v1/agreements/{id}/workflow` | AgreementController@workflow |
| GET | `/api/admin/v1/audit` | MiscController@audit |
| POST | `/api/admin/v1/auth/forgot-password` | AuthController@forgotPassword |
| POST | `/api/admin/v1/auth/login` | AuthController@login |
| POST | `/api/admin/v1/auth/logout` | AuthController@logout |
| GET | `/api/admin/v1/auth/me` | AuthController@me |
| POST | `/api/admin/v1/auth/mfa` | AuthController@mfaChallenge |
| POST | `/api/admin/v1/auth/mfa/confirm` | AuthController@mfaConfirm |
| POST | `/api/admin/v1/auth/mfa/disable` | AuthController@mfaDisable |
| POST | `/api/admin/v1/auth/mfa/setup` | AuthController@mfaSetup |
| POST | `/api/admin/v1/auth/password` | AuthController@changePassword |
| POST | `/api/admin/v1/auth/reset-password` | AuthController@resetPassword |
| GET | `/api/admin/v1/catalog-items` | CatalogItemController@index |
| POST | `/api/admin/v1/catalog-items` | CatalogItemController@store |
| GET | `/api/admin/v1/catalog-items/{id}` | CatalogItemController@show |
| PUT | `/api/admin/v1/catalog-items/{id}` | CatalogItemController@update |
| DELETE | `/api/admin/v1/catalog-items/{id}` | CatalogItemController@destroy |
| POST | `/api/admin/v1/catalog-items/{id}/workflow` | CatalogItemController@workflow |
| GET | `/api/admin/v1/cats` | CatController@index |
| POST | `/api/admin/v1/cats` | CatController@store |
| GET | `/api/admin/v1/cats/{id}` | CatController@show |
| PUT | `/api/admin/v1/cats/{id}` | CatController@update |
| DELETE | `/api/admin/v1/cats/{id}` | CatController@destroy |
| POST | `/api/admin/v1/cats/{id}/workflow` | CatController@workflow |
| GET | `/api/admin/v1/classifier-items` | ClassifierItemController@index |
| POST | `/api/admin/v1/classifier-items` | ClassifierItemController@store |
| GET | `/api/admin/v1/classifier-items/{id}` | ClassifierItemController@show |
| PUT | `/api/admin/v1/classifier-items/{id}` | ClassifierItemController@update |
| DELETE | `/api/admin/v1/classifier-items/{id}` | ClassifierItemController@destroy |
| POST | `/api/admin/v1/classifier-items/{id}/workflow` | ClassifierItemController@workflow |
| GET | `/api/admin/v1/classifiers` | ClassifierController@index |
| POST | `/api/admin/v1/classifiers` | ClassifierController@store |
| GET | `/api/admin/v1/classifiers/{id}` | ClassifierController@show |
| PUT | `/api/admin/v1/classifiers/{id}` | ClassifierController@update |
| DELETE | `/api/admin/v1/classifiers/{id}` | ClassifierController@destroy |
| POST | `/api/admin/v1/classifiers/{id}/workflow` | ClassifierController@workflow |
| GET | `/api/admin/v1/dashboard` | MiscController@dashboard |
| GET | `/api/admin/v1/data-sources` | DataSourceController@index |
| POST | `/api/admin/v1/data-sources` | DataSourceController@store |
| GET | `/api/admin/v1/data-sources/{id}` | DataSourceController@show |
| PUT | `/api/admin/v1/data-sources/{id}` | DataSourceController@update |
| DELETE | `/api/admin/v1/data-sources/{id}` | DataSourceController@destroy |
| POST | `/api/admin/v1/data-sources/{id}/workflow` | DataSourceController@workflow |
| GET | `/api/admin/v1/departments` | DepartmentController@index |
| POST | `/api/admin/v1/departments` | DepartmentController@store |
| GET | `/api/admin/v1/departments/{id}` | DepartmentController@show |
| PUT | `/api/admin/v1/departments/{id}` | DepartmentController@update |
| DELETE | `/api/admin/v1/departments/{id}` | DepartmentController@destroy |
| POST | `/api/admin/v1/departments/{id}/workflow` | DepartmentController@workflow |
| GET | `/api/admin/v1/dependencies` | DependencyController@index |
| POST | `/api/admin/v1/dependencies` | DependencyController@store |
| GET | `/api/admin/v1/dependencies/{id}` | DependencyController@show |
| PUT | `/api/admin/v1/dependencies/{id}` | DependencyController@update |
| DELETE | `/api/admin/v1/dependencies/{id}` | DependencyController@destroy |
| POST | `/api/admin/v1/dependencies/{id}/workflow` | DependencyController@workflow |
| GET | `/api/admin/v1/document-categories` | DocumentCategoryController@index |
| POST | `/api/admin/v1/document-categories` | DocumentCategoryController@store |
| GET | `/api/admin/v1/document-categories/{id}` | DocumentCategoryController@show |
| PUT | `/api/admin/v1/document-categories/{id}` | DocumentCategoryController@update |
| DELETE | `/api/admin/v1/document-categories/{id}` | DocumentCategoryController@destroy |
| POST | `/api/admin/v1/document-categories/{id}/workflow` | DocumentCategoryController@workflow |
| GET | `/api/admin/v1/documents` | DocumentController@index |
| POST | `/api/admin/v1/documents` | DocumentController@store |
| GET | `/api/admin/v1/documents/{id}` | DocumentController@show |
| PUT | `/api/admin/v1/documents/{id}` | DocumentController@update |
| GET | `/api/admin/v1/documents/{id}/download/{version?}` | DocumentController@download |
| POST | `/api/admin/v1/documents/{id}/versions` | DocumentController@newVersion |
| GET | `/api/admin/v1/education-levels` | EducationLevelController@index |
| POST | `/api/admin/v1/education-levels` | EducationLevelController@store |
| GET | `/api/admin/v1/education-levels/{id}` | EducationLevelController@show |
| PUT | `/api/admin/v1/education-levels/{id}` | EducationLevelController@update |
| DELETE | `/api/admin/v1/education-levels/{id}` | EducationLevelController@destroy |
| POST | `/api/admin/v1/education-levels/{id}/workflow` | EducationLevelController@workflow |
| GET | `/api/admin/v1/events` | EventController@index |
| POST | `/api/admin/v1/events` | EventController@store |
| GET | `/api/admin/v1/events/{id}` | EventController@show |
| PUT | `/api/admin/v1/events/{id}` | EventController@update |
| DELETE | `/api/admin/v1/events/{id}` | EventController@destroy |
| POST | `/api/admin/v1/events/{id}/workflow` | EventController@workflow |
| GET | `/api/admin/v1/hero-slides` | HeroSlideController@index |
| POST | `/api/admin/v1/hero-slides` | HeroSlideController@store |
| GET | `/api/admin/v1/hero-slides/{id}` | HeroSlideController@show |
| PUT | `/api/admin/v1/hero-slides/{id}` | HeroSlideController@update |
| DELETE | `/api/admin/v1/hero-slides/{id}` | HeroSlideController@destroy |
| POST | `/api/admin/v1/hero-slides/{id}/workflow` | HeroSlideController@workflow |
| GET | `/api/admin/v1/highlights` | HomeHighlightController@index |
| POST | `/api/admin/v1/highlights` | HomeHighlightController@store |
| GET | `/api/admin/v1/highlights/{id}` | HomeHighlightController@show |
| PUT | `/api/admin/v1/highlights/{id}` | HomeHighlightController@update |
| DELETE | `/api/admin/v1/highlights/{id}` | HomeHighlightController@destroy |
| POST | `/api/admin/v1/highlights/{id}/workflow` | HomeHighlightController@workflow |
| GET | `/api/admin/v1/history/{type}/{id}` | MiscController@history |
| GET | `/api/admin/v1/indicator-modules` | IndicatorController@modules |
| GET | `/api/admin/v1/indicators` | IndicatorController@index |
| GET | `/api/admin/v1/indicators/{id}` | IndicatorController@show |
| PUT | `/api/admin/v1/indicators/{id}` | IndicatorController@update |
| GET | `/api/admin/v1/indicators/{id}/template` | IndicatorController@template |
| GET | `/api/admin/v1/knowledge-areas` | KnowledgeAreaController@index |
| POST | `/api/admin/v1/knowledge-areas` | KnowledgeAreaController@store |
| GET | `/api/admin/v1/knowledge-areas/{id}` | KnowledgeAreaController@show |
| PUT | `/api/admin/v1/knowledge-areas/{id}` | KnowledgeAreaController@update |
| DELETE | `/api/admin/v1/knowledge-areas/{id}` | KnowledgeAreaController@destroy |
| POST | `/api/admin/v1/knowledge-areas/{id}/workflow` | KnowledgeAreaController@workflow |
| GET | `/api/admin/v1/media` | MediaItemController@index |
| POST | `/api/admin/v1/media` | MediaItemController@store |
| GET | `/api/admin/v1/media/{id}` | MediaItemController@show |
| PUT | `/api/admin/v1/media/{id}` | MediaItemController@update |
| DELETE | `/api/admin/v1/media/{id}` | MediaItemController@destroy |
| POST | `/api/admin/v1/media/{id}/workflow` | MediaItemController@workflow |
| GET | `/api/admin/v1/municipalities` | MunicipalityController@index |
| POST | `/api/admin/v1/municipalities` | MunicipalityController@store |
| GET | `/api/admin/v1/municipalities/{id}` | MunicipalityController@show |
| PUT | `/api/admin/v1/municipalities/{id}` | MunicipalityController@update |
| DELETE | `/api/admin/v1/municipalities/{id}` | MunicipalityController@destroy |
| POST | `/api/admin/v1/municipalities/{id}/workflow` | MunicipalityController@workflow |
| GET | `/api/admin/v1/news` | NewsController@index |
| POST | `/api/admin/v1/news` | NewsController@store |
| GET | `/api/admin/v1/news-categories` | NewsCategoryController@index |
| POST | `/api/admin/v1/news-categories` | NewsCategoryController@store |
| GET | `/api/admin/v1/news-categories/{id}` | NewsCategoryController@show |
| PUT | `/api/admin/v1/news-categories/{id}` | NewsCategoryController@update |
| DELETE | `/api/admin/v1/news-categories/{id}` | NewsCategoryController@destroy |
| POST | `/api/admin/v1/news-categories/{id}/workflow` | NewsCategoryController@workflow |
| GET | `/api/admin/v1/news/{id}` | NewsController@show |
| PUT | `/api/admin/v1/news/{id}` | NewsController@update |
| DELETE | `/api/admin/v1/news/{id}` | NewsController@destroy |
| POST | `/api/admin/v1/news/{id}/workflow` | NewsController@workflow |
| GET | `/api/admin/v1/offerings` | ProgramOfferingController@index |
| POST | `/api/admin/v1/offerings` | ProgramOfferingController@store |
| GET | `/api/admin/v1/offerings/{id}` | ProgramOfferingController@show |
| PUT | `/api/admin/v1/offerings/{id}` | ProgramOfferingController@update |
| DELETE | `/api/admin/v1/offerings/{id}` | ProgramOfferingController@destroy |
| POST | `/api/admin/v1/offerings/{id}/workflow` | ProgramOfferingController@workflow |
| GET | `/api/admin/v1/pages` | PageController@index |
| POST | `/api/admin/v1/pages` | PageController@store |
| GET | `/api/admin/v1/pages/{id}` | PageController@show |
| PUT | `/api/admin/v1/pages/{id}` | PageController@update |
| DELETE | `/api/admin/v1/pages/{id}` | PageController@destroy |
| POST | `/api/admin/v1/pages/{id}/workflow` | PageController@workflow |
| GET | `/api/admin/v1/periods` | AcademicPeriodController@index |
| POST | `/api/admin/v1/periods` | AcademicPeriodController@store |
| GET | `/api/admin/v1/periods/{id}` | AcademicPeriodController@show |
| PUT | `/api/admin/v1/periods/{id}` | AcademicPeriodController@update |
| DELETE | `/api/admin/v1/periods/{id}` | AcademicPeriodController@destroy |
| POST | `/api/admin/v1/periods/{id}/workflow` | AcademicPeriodController@workflow |
| GET | `/api/admin/v1/permissions` | UserController@permissions |
| GET | `/api/admin/v1/petty-cash-budgets` | PettyCashBudgetController@index |
| POST | `/api/admin/v1/petty-cash-budgets` | PettyCashBudgetController@store |
| GET | `/api/admin/v1/petty-cash-budgets/{id}` | PettyCashBudgetController@show |
| PUT | `/api/admin/v1/petty-cash-budgets/{id}` | PettyCashBudgetController@update |
| DELETE | `/api/admin/v1/petty-cash-budgets/{id}` | PettyCashBudgetController@destroy |
| POST | `/api/admin/v1/petty-cash-budgets/{id}/workflow` | PettyCashBudgetController@workflow |
| GET | `/api/admin/v1/petty-cash-expenses` | PettyCashExpenseController@index |
| POST | `/api/admin/v1/petty-cash-expenses` | PettyCashExpenseController@store |
| GET | `/api/admin/v1/petty-cash-expenses/{id}` | PettyCashExpenseController@show |
| PUT | `/api/admin/v1/petty-cash-expenses/{id}` | PettyCashExpenseController@update |
| DELETE | `/api/admin/v1/petty-cash-expenses/{id}` | PettyCashExpenseController@destroy |
| POST | `/api/admin/v1/petty-cash-expenses/{id}/workflow` | PettyCashExpenseController@workflow |
| GET | `/api/admin/v1/programs` | ProgramController@index |
| POST | `/api/admin/v1/programs` | ProgramController@store |
| GET | `/api/admin/v1/programs/{id}` | ProgramController@show |
| PUT | `/api/admin/v1/programs/{id}` | ProgramController@update |
| DELETE | `/api/admin/v1/programs/{id}` | ProgramController@destroy |
| POST | `/api/admin/v1/programs/{id}/workflow` | ProgramController@workflow |
| GET | `/api/admin/v1/project-progress` | ProjectProgressController@index |
| POST | `/api/admin/v1/project-progress` | ProjectProgressController@store |
| GET | `/api/admin/v1/project-progress/{id}` | ProjectProgressController@show |
| PUT | `/api/admin/v1/project-progress/{id}` | ProjectProgressController@update |
| DELETE | `/api/admin/v1/project-progress/{id}` | ProjectProgressController@destroy |
| POST | `/api/admin/v1/project-progress/{id}/workflow` | ProjectProgressController@workflow |
| GET | `/api/admin/v1/projects` | ProjectController@index |
| POST | `/api/admin/v1/projects` | ProjectController@store |
| GET | `/api/admin/v1/projects/{id}` | ProjectController@show |
| PUT | `/api/admin/v1/projects/{id}` | ProjectController@update |
| DELETE | `/api/admin/v1/projects/{id}` | ProjectController@destroy |
| POST | `/api/admin/v1/projects/{id}/workflow` | ProjectController@workflow |
| GET | `/api/admin/v1/reports/indicators` | ReportController@indicators |
| GET | `/api/admin/v1/reports/petty-cash` | ReportController@pettyCash |
| GET | `/api/admin/v1/roles` | UserController@roles |
| POST | `/api/admin/v1/roles` | UserController@saveRole |
| PUT | `/api/admin/v1/roles/{id}` | UserController@saveRole |
| DELETE | `/api/admin/v1/roles/{id}` | UserController@deleteRole |
| GET | `/api/admin/v1/settings` | MiscController@settings |
| PUT | `/api/admin/v1/settings` | MiscController@saveSettings |
| GET | `/api/admin/v1/submissions` | SubmissionController@index |
| POST | `/api/admin/v1/submissions` | SubmissionController@store |
| GET | `/api/admin/v1/submissions/{id}` | SubmissionController@show |
| PUT | `/api/admin/v1/submissions/{id}` | SubmissionController@update |
| DELETE | `/api/admin/v1/submissions/{id}` | SubmissionController@destroy |
| POST | `/api/admin/v1/submissions/{id}/import` | SubmissionController@import |
| POST | `/api/admin/v1/submissions/{id}/publish` | SubmissionController@publish |
| POST | `/api/admin/v1/submissions/{id}/review` | SubmissionController@review |
| POST | `/api/admin/v1/submissions/{id}/submit` | SubmissionController@submit |
| POST | `/api/admin/v1/submissions/{id}/unpublish` | SubmissionController@unpublish |
| PUT | `/api/admin/v1/submissions/{id}/values` | SubmissionController@values |
| GET | `/api/admin/v1/team-units` | TeamUnitController@index |
| POST | `/api/admin/v1/team-units` | TeamUnitController@store |
| GET | `/api/admin/v1/team-units/{id}` | TeamUnitController@show |
| PUT | `/api/admin/v1/team-units/{id}` | TeamUnitController@update |
| DELETE | `/api/admin/v1/team-units/{id}` | TeamUnitController@destroy |
| POST | `/api/admin/v1/team-units/{id}/workflow` | TeamUnitController@workflow |
| POST | `/api/admin/v1/uploads/image` | MiscController@uploadImage |
| GET | `/api/admin/v1/users` | UserController@index |
| POST | `/api/admin/v1/users` | UserController@store |
| GET | `/api/admin/v1/users/{id}` | UserController@show |
| PUT | `/api/admin/v1/users/{id}` | UserController@update |
| DELETE | `/api/admin/v1/users/{id}` | UserController@destroy |

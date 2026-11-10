<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Public\PortalController as P;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API pública (solo lectura) — /api/public/v1
|--------------------------------------------------------------------------
*/
Route::prefix('public/v1')->middleware('throttle:public')->group(function () {
    Route::get('site', [P::class, 'site']);
    Route::get('home', [P::class, 'home']);
    Route::get('filters', [P::class, 'filterOptions']);
    Route::get('modules', [P::class, 'modules']);
    Route::get('modules/{slug}', [P::class, 'module']);
    Route::get('indicators/{code}', [P::class, 'indicatorData'])->where('code', 'M\d{2}-I\d{2}');
    Route::get('indicators/{code}/export', [P::class, 'indicatorExport'])->where('code', 'M\d{2}-I\d{2}')->middleware('throttle:public-heavy');
    Route::get('transparency', [P::class, 'transparency']);
    Route::get('lists/{type}', [P::class, 'lists'])->where('type', '[a-z_]+');
    Route::get('cats', [P::class, 'cats']);
    Route::get('cats/{slug}', [P::class, 'cat']);
    Route::get('programs', [P::class, 'programs']);
    Route::get('programs/{slug}', [P::class, 'program']);
    Route::get('offerings', [P::class, 'offerings']);
    Route::get('news', [P::class, 'news']);
    Route::get('news-categories', [P::class, 'newsCategories']);
    Route::get('news/{slug}', [P::class, 'newsItem']);
    Route::get('events', [P::class, 'events']);
    Route::get('events/{slug}', [P::class, 'event']);
    Route::get('media', [P::class, 'media']);
    Route::get('pages/{slug}', [P::class, 'page']);
    Route::get('projects', [P::class, 'projects']);
    Route::get('projects/{slug}', [P::class, 'project']);
    Route::get('agreements', [P::class, 'agreements']);
    Route::get('publications', [P::class, 'publications']);
    Route::get('documents', [P::class, 'documents']);
    Route::get('documents/{id}/download', [P::class, 'documentDownload'])->whereNumber('id')->middleware('throttle:public-heavy');
    Route::get('search', [P::class, 'search']);
});

/*
|--------------------------------------------------------------------------
| API del panel privado — /api/admin/v1  (sesión + CSRF, usuario activo, permisos por recurso)
|--------------------------------------------------------------------------
*/
Route::prefix('admin/v1')->name('admin.')->group(function () {
    Route::post('auth/login', [Admin\AuthController::class, 'login'])->middleware('throttle:auth');
    Route::post('auth/mfa', [Admin\AuthController::class, 'mfaChallenge'])->middleware('throttle:auth');
    Route::post('auth/forgot-password', [Admin\AuthController::class, 'forgotPassword'])->middleware('throttle:auth');
    Route::post('auth/reset-password', [Admin\AuthController::class, 'resetPassword'])->middleware('throttle:auth');

    Route::middleware(['auth:sanctum', 'active', 'throttle:admin'])->group(function () {
        Route::get('auth/me', [Admin\AuthController::class, 'me'])->name('me');
        Route::post('auth/logout', [Admin\AuthController::class, 'logout'])->name('logout');
        Route::post('auth/mfa/setup', [Admin\AuthController::class, 'mfaSetup'])->name('mfa.setup');
        Route::post('auth/mfa/confirm', [Admin\AuthController::class, 'mfaConfirm'])->name('mfa.confirm');
        Route::post('auth/mfa/disable', [Admin\AuthController::class, 'mfaDisable']);
        Route::post('auth/password', [Admin\AuthController::class, 'changePassword'])->name('password.change');

        Route::get('dashboard', [Admin\MiscController::class, 'dashboard']);
        Route::post('uploads/image', [Admin\MiscController::class, 'uploadImage'])->middleware('throttle:uploads');
        Route::get('audit', [Admin\MiscController::class, 'audit']);
        Route::get('history/{type}/{id}', [Admin\MiscController::class, 'history'])->whereNumber('id');
        Route::get('settings', [Admin\MiscController::class, 'settings']);
        Route::put('settings', [Admin\MiscController::class, 'saveSettings']);

        // Usuarios, roles y permisos
        Route::get('users', [Admin\UserController::class, 'index']);
        Route::post('users', [Admin\UserController::class, 'store']);
        Route::get('users/{id}', [Admin\UserController::class, 'show'])->whereNumber('id');
        Route::put('users/{id}', [Admin\UserController::class, 'update'])->whereNumber('id');
        Route::delete('users/{id}', [Admin\UserController::class, 'destroy'])->whereNumber('id');
        Route::get('roles', [Admin\UserController::class, 'roles']);
        Route::post('roles', [Admin\UserController::class, 'saveRole']);
        Route::put('roles/{id}', [Admin\UserController::class, 'saveRole'])->whereNumber('id');
        Route::delete('roles/{id}', [Admin\UserController::class, 'deleteRole'])->whereNumber('id');
        Route::get('permissions', [Admin\UserController::class, 'permissions']);

        // Indicadores y lotes de datos
        Route::get('indicator-modules', [Admin\IndicatorController::class, 'modules']);
        Route::get('indicators', [Admin\IndicatorController::class, 'index']);
        Route::get('indicators/{id}', [Admin\IndicatorController::class, 'show'])->whereNumber('id');
        Route::put('indicators/{id}', [Admin\IndicatorController::class, 'update'])->whereNumber('id');
        Route::get('indicators/{id}/template', [Admin\IndicatorController::class, 'template'])->whereNumber('id');
        Route::get('submissions', [Admin\SubmissionController::class, 'index']);
        Route::post('submissions', [Admin\SubmissionController::class, 'store']);
        Route::get('submissions/{id}', [Admin\SubmissionController::class, 'show'])->whereNumber('id');
        Route::put('submissions/{id}', [Admin\SubmissionController::class, 'update'])->whereNumber('id');
        Route::delete('submissions/{id}', [Admin\SubmissionController::class, 'destroy'])->whereNumber('id');
        Route::put('submissions/{id}/values', [Admin\SubmissionController::class, 'values'])->whereNumber('id');
        Route::post('submissions/{id}/import', [Admin\SubmissionController::class, 'import'])->whereNumber('id')->middleware('throttle:uploads');
        Route::post('submissions/{id}/submit', [Admin\SubmissionController::class, 'submit'])->whereNumber('id');
        Route::post('submissions/{id}/review', [Admin\SubmissionController::class, 'review'])->whereNumber('id');
        Route::post('submissions/{id}/publish', [Admin\SubmissionController::class, 'publish'])->whereNumber('id');
        Route::post('submissions/{id}/unpublish', [Admin\SubmissionController::class, 'unpublish'])->whereNumber('id');

        // Documentos
        Route::get('documents', [Admin\DocumentController::class, 'index']);
        Route::post('documents', [Admin\DocumentController::class, 'store'])->middleware('throttle:uploads');
        Route::get('documents/{id}', [Admin\DocumentController::class, 'show'])->whereNumber('id');
        Route::put('documents/{id}', [Admin\DocumentController::class, 'update'])->whereNumber('id');
        Route::post('documents/{id}/versions', [Admin\DocumentController::class, 'newVersion'])->whereNumber('id');
        Route::get('documents/{id}/download/{version?}', [Admin\DocumentController::class, 'download'])->whereNumber('id');

        // Bases de datos institucionales (estudiantes, docentes, graduados, personal)
        Route::get('records', [Admin\RecordController::class, 'index']);
        Route::prefix('records/{entity}')->where(['entity' => 'estudiantes|docentes|graduados|personal'])->group(function () {
            Route::get('/', [Admin\RecordController::class, 'show']);
            Route::get('template', [Admin\RecordController::class, 'template']);
            Route::post('analyze', [Admin\RecordController::class, 'analyze'])->middleware('throttle:uploads');
            Route::post('import', [Admin\RecordController::class, 'import'])->middleware('throttle:uploads');
            Route::get('summary', [Admin\RecordController::class, 'summary']);
            Route::get('rows', [Admin\RecordController::class, 'rows']);
            Route::get('imports', [Admin\RecordController::class, 'imports']);
            Route::delete('imports/{id}', [Admin\RecordController::class, 'undo'])->whereNumber('id');
        });

        // Informes
        Route::get('reports/indicators', [Admin\ReportController::class, 'indicators']);
        Route::get('reports/petty-cash', [Admin\ReportController::class, 'pettyCash']);

        // Recursos CRUD genéricos (permisos verificados en cada controlador)
        $resources = [
            'news' => Admin\NewsController::class,
            'events' => Admin\EventController::class,
            'media' => Admin\MediaItemController::class,
            'pages' => Admin\PageController::class,
            'hero-slides' => Admin\HeroSlideController::class,
            'highlights' => Admin\HomeHighlightController::class,
            'team-units' => Admin\TeamUnitController::class,
            'news-categories' => Admin\NewsCategoryController::class,
            'cats' => Admin\CatController::class,
            'programs' => Admin\ProgramController::class,
            'offerings' => Admin\ProgramOfferingController::class,
            'projects' => Admin\ProjectController::class,
            'project-progress' => Admin\ProjectProgressController::class,
            'agreements' => Admin\AgreementController::class,
            'catalog-items' => Admin\CatalogItemController::class,
            'publications' => Admin\PublicationController::class,
            'update-requests' => Admin\UpdateRequestController::class,
            'departments' => Admin\DepartmentController::class,
            'municipalities' => Admin\MunicipalityController::class,
            'education-levels' => Admin\EducationLevelController::class,
            'knowledge-areas' => Admin\KnowledgeAreaController::class,
            'periods' => Admin\AcademicPeriodController::class,
            'classifiers' => Admin\ClassifierController::class,
            'classifier-items' => Admin\ClassifierItemController::class,
            'data-sources' => Admin\DataSourceController::class,
            'dependencies' => Admin\DependencyController::class,
            'document-categories' => Admin\DocumentCategoryController::class,
            'petty-cash-budgets' => Admin\PettyCashBudgetController::class,
            'petty-cash-expenses' => Admin\PettyCashExpenseController::class,
        ];
        foreach ($resources as $uri => $controller) {
            Route::get($uri, [$controller, 'index']);
            Route::post($uri, [$controller, 'store']);
            Route::get("$uri/{id}", [$controller, 'show'])->whereNumber('id');
            Route::put("$uri/{id}", [$controller, 'update'])->whereNumber('id');
            Route::delete("$uri/{id}", [$controller, 'destroy'])->whereNumber('id');
            Route::post("$uri/{id}/workflow", [$controller, 'workflow'])->whereNumber('id');
        }
    });
});

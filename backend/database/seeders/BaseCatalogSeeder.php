<?php

namespace Database\Seeders;

use App\Models\AcademicPeriod;
use App\Models\Classifier;
use App\Models\DataSource;
use App\Models\Department;
use App\Models\Dependency;
use App\Models\DocumentCategory;
use App\Models\EducationLevel;
use App\Models\HomeHighlight;
use App\Models\Indicator;
use App\Models\IndicatorModule;
use App\Models\KnowledgeArea;
use App\Models\NewsCategory;
use App\Models\Page;
use App\Models\Permission;
use App\Models\Role;
use App\Models\TeamUnit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Catálogo estructural del sistema (NO contiene cifras institucionales):
 * permisos, roles, dependencias y fuentes del Excel, departamentos DANE, niveles, clasificadores,
 * los 13 módulos y los 76 indicadores con su ficha técnica, categorías y páginas base.
 * Es idempotente: puede ejecutarse varias veces.
 */
class BaseCatalogSeeder extends Seeder
{
    public const PERMISSIONS = [
        // grupo => [código => descripción]
        'Indicadores' => [
            'indicators.view_internal' => 'Consultar indicadores y datos internos (no publicados)',
            'indicators.submit' => 'Registrar lotes de datos y enviarlos a revisión',
            'indicators.import' => 'Importar datos desde Excel/CSV',
            'indicators.review' => 'Aprobar o devolver lotes de datos',
            'indicators.publish' => 'Publicar y despublicar datos de indicadores',
            'indicators.catalog.manage' => 'Editar la ficha técnica de los indicadores (metodología, autorización)',
            'scope.all_dependencies' => 'Alcance sobre todas las dependencias',
        ],
        'Bases de datos institucionales' => [
            'records.view' => 'Consultar las bases de estudiantes, docentes, graduados y personal (totales, sin datos personales)',
            'records.import' => 'Cargar bases desde la plantilla de Excel/CSV y deshacer cargas',
            'records.view_personal' => 'Ver datos personales de estudiantes, docentes, graduados y personal (parte privada)',
        ],
        'Informes' => [
            'reports.internal.export' => 'Exportar informes internos',
            'reports.financial.view' => 'Incluir información financiera en informes',
        ],
        'Documentos' => [
            'documents.view.internal' => 'Ver documentos internos',
            'documents.view.restricted' => 'Ver documentos restringidos (contratos, convenios)',
            'documents.view.financial' => 'Ver documentos financieros',
            'documents.upload' => 'Cargar documentos y nuevas versiones',
            'documents.edit' => 'Editar metadatos de documentos',
            'documents.classify' => 'Reclasificar documentos (categoría y confidencialidad)',
            'documents.archive' => 'Archivar documentos',
        ],
        'Convenios y caja menor' => [
            'agreements.view' => 'Consultar convenios',
            'agreements.manage' => 'Gestionar convenios asignados',
            'petty_cash.view' => 'Consultar caja menor',
            'petty_cash.manage' => 'Registrar presupuestos, facturas y soportes de caja menor',
        ],
        'Contenidos' => [
            'content.create' => 'Crear y editar noticias, actividades y páginas',
            'content.publish' => 'Revisar, aprobar y publicar contenidos',
            'content.site' => 'Gestionar carrusel, cifras destacadas, equipo y categorías',
            'media.manage' => 'Gestionar fotografías y multimedia',
        ],
        'Fichas institucionales' => [
            'cats.edit' => 'Editar fichas de CAT',
            'programs.edit' => 'Editar programas y oferta por CAT',
            'projects.edit' => 'Editar proyectos de inversión y su avance',
            'lists.edit' => 'Editar listados institucionales (grupos, plataformas, formación continua...)',
            'entities.publish' => 'Publicar fichas (CAT, programas, proyectos, listados)',
        ],
        'Administración técnica' => [
            'users.view' => 'Consultar usuarios',
            'users.manage' => 'Crear, editar y desactivar usuarios',
            'roles.manage' => 'Gestionar roles y permisos',
            'audit.view' => 'Consultar registros de auditoría',
            'settings.manage' => 'Configurar parámetros del sistema',
            'catalogs.manage' => 'Gestionar catálogos (períodos, territorio, dependencias, fuentes, clasificadores)',
        ],
    ];

    public const ROLES = [
        'director' => ['Director del IDEAD', 'Consulta general, supervisión, revisión y publicación de información institucional.', [
            'indicators.view_internal', 'indicators.review', 'indicators.publish', 'indicators.catalog.manage', 'scope.all_dependencies',
            'records.view', 'records.import', 'records.view_personal', 'reports.internal.export', 'reports.financial.view', 'documents.view.internal', 'documents.view.restricted', 'documents.view.financial',
            'agreements.view', 'petty_cash.view', 'content.publish', 'entities.publish', 'audit.view',
        ]],
        'administracion_documental' => ['Administración documental', 'Registro, clasificación y control de versiones de documentos, contratos y convenios.', [
            'documents.view.internal', 'documents.view.restricted', 'documents.upload', 'documents.edit', 'documents.classify', 'documents.archive',
            'agreements.view', 'agreements.manage', 'scope.all_dependencies',
        ]],
        'caja_menor' => ['Caja menor', 'Registro de presupuestos, facturas y soportes de caja menor.', [
            'petty_cash.view', 'petty_cash.manage', 'documents.view.financial', 'documents.upload', 'reports.financial.view',
        ]],
        'comunicaciones' => ['Comunicaciones', 'Creación y edición de noticias, actividades, fotografías y novedades (publicación previa autorización).', [
            'content.create', 'content.site', 'media.manage',
        ]],
        'coordinador' => ['Coordinador / responsable de dependencia', 'Registro y actualización de indicadores e información de su dependencia; envío a revisión.', [
            'indicators.view_internal', 'indicators.submit', 'indicators.import', 'reports.internal.export', 'documents.view.internal', 'documents.upload',
            'cats.edit', 'programs.edit', 'projects.edit', 'lists.edit', 'records.view', 'records.import',
        ]],
        'admin_tecnico' => ['Administrador técnico', 'Usuarios, roles, permisos, parámetros y auditoría. Sin acceso a documentos financieros ni restringidos.', [
            'users.view', 'users.manage', 'roles.manage', 'audit.view', 'settings.manage', 'catalogs.manage',
        ]],
    ];

    public const DEPENDENCIES = [
        'DIRECCION' => 'Dirección del IDEAD',
        'DARCA' => 'Dirección de Admisión, Registro y Control Académico',
        'CDIDEAD' => 'Consejo Directivo IDEAD',
        'DP' => 'Direcciones de programa',
        'CP' => 'Coordinación de Programas',
        'SAIDEAD' => 'Secretaría Académica IDEAD',
        'CRIDEAD' => 'Centros Regionales IDEAD',
        'VICIEPS' => 'Vicerrectoría de Investigación, Creación, Innovación, Extensión y Proyección Social',
        'PIDEAD' => 'Publicaciones IDEAD (según glosario del Excel; validar si corresponde a Planeación)',
        'PSIDEAD' => 'Proyección Social IDEAD',
        'ECIDEAD' => 'Educación Continuada IDEAD',
        'PRIDEAD' => 'Presupuesto IDEAD',
        'ACIDEAD' => 'Aseguramiento de la Calidad IDEAD',
        'TUIDEAD' => 'TUIDEAD (nombre oficial pendiente de validación)',
        'OG' => 'Oficina de Graduados',
        'DEPTOS' => 'Departamentos académicos',
        'SGUT' => 'SGUT (nombre oficial pendiente de validación)',
        'BIBLIOTECA' => 'Biblioteca',
        'OPDI' => 'OPDI (nombre oficial pendiente de validación)',
        'COMUNICACIONES' => 'Comunicaciones IDEAD',
        'GESTION_DOC' => 'Administración documental',
        'CAJA_MENOR' => 'Caja menor',
    ];

    /** Fuentes del Excel. official_name_status = pendiente cuando la abreviatura no está definida en el glosario. */
    public const SOURCES = [
        'PAGINA_WEB' => ['Página web institucional', 'sistema', 'validado'],
        'BD_MATRICULADOS' => ['Base de datos de matriculados', 'base_datos', 'validado'],
        'BD_REPRESENTANTES' => ['Base de datos de representantes estudiantiles', 'base_datos', 'validado'],
        'BD_DEPARTAMENTOS' => ['Bases de datos de los departamentos académicos', 'base_datos', 'validado'],
        'DARCA' => ['Dirección de Admisión, Registro y Control Académico', 'dependencia', 'validado'],
        'CDIDEAD' => ['Consejo Directivo IDEAD', 'dependencia', 'validado'],
        'ACUERDOS' => ['Acuerdos y resoluciones institucionales', 'acto_administrativo', 'validado'],
        'ICFES' => ['Instituto Colombiano para la Evaluación de la Educación (ICFES)', 'externo', 'validado'],
        'SAIDEAD' => ['Secretaría Académica IDEAD', 'dependencia', 'validado'],
        'DP' => ['Direcciones de programa', 'dependencia', 'validado'],
        'CP' => ['Coordinación de Programas', 'dependencia', 'validado'],
        'DEPTOS' => ['Departamentos académicos', 'dependencia', 'validado'],
        'PROF_LLANOS' => ['«Profesor Llanos» (fuente nominal: formalizar dependencia)', 'persona', 'pendiente'],
        'INFORME_SNIES' => ['Informe SNIES', 'externo', 'validado'],
        'SGUT' => ['SGUT (significado pendiente de validación)', 'sistema', 'pendiente'],
        'OG' => ['Oficina de Graduados', 'dependencia', 'validado'],
        'CRIDEAD' => ['Centros Regionales IDEAD', 'dependencia', 'validado'],
        'COORDINADORES_CAT' => ['Coordinadores de CAT', 'dependencia', 'validado'],
        'ACTORES_CLAVES' => ['«Actores claves» (fuente pendiente de formalizar)', 'persona', 'pendiente'],
        'INFO_RECOLECTADA' => ['Información previamente recolectada en el portal', 'sistema', 'validado'],
        'TUIDEAD' => ['TUIDEAD (nombre oficial pendiente de validación)', 'dependencia', 'pendiente'],
        'INFORMES_OPERADORES' => ['Informes de operadores de bienestar', 'externo', 'pendiente'],
        'BIBLIOTECA' => ['Biblioteca', 'dependencia', 'validado'],
        'PERMANENCIA' => ['Programa de permanencia estudiantil', 'dependencia', 'pendiente'],
        'VICIEPS' => ['Vicerrectoría de Investigación, Creación, Innovación, Extensión y Proyección Social', 'dependencia', 'validado'],
        'PIDEAD' => ['PIDEAD — «Publicaciones IDEAD» según glosario (validar)', 'dependencia', 'pendiente'],
        'PSIDEAD' => ['Proyección Social IDEAD', 'dependencia', 'validado'],
        'ECIDEAD' => ['Educación Continuada IDEAD', 'dependencia', 'validado'],
        'PRIDEAD' => ['Presupuesto IDEAD', 'dependencia', 'validado'],
        'OPDI' => ['OPDI (significado pendiente de validación)', 'dependencia', 'pendiente'],
        'CIBAGUE' => ['CIBAGUE (abreviatura no definida en el Excel)', 'dependencia', 'pendiente'],
        'CAT_FUENTE' => ['Centros de Atención Tutorial', 'dependencia', 'validado'],
        'ACIDEAD' => ['Aseguramiento de la Calidad IDEAD', 'dependencia', 'validado'],
    ];

    public const MODULES = [
        1 => ['oferta-academica', 'Oferta académica y acceso', 'Programas de pregrado y posgrado, oferta por CAT, cupos, inscripción, admisión e ingreso.', 'graduation'],
        2 => ['estudiantes', 'Estudiantes y matrícula', 'Matrícula, evolución, distribución territorial y caracterización agregada de la población estudiantil.', 'students'],
        3 => ['permanencia', 'Permanencia y resultados académicos', 'Continuidad, deserción, reintegros, pruebas de Estado y opciones de grado.', 'chart'],
        4 => ['docentes', 'Docentes', 'Cuerpo docente por vinculación, formación, perfil, carga académica e investigación.', 'teacher'],
        5 => ['graduados', 'Graduados', 'Graduados y títulos otorgados, evolución, distribución, perfil y trayectoria.', 'graduate'],
        6 => ['personal-administrativo', 'Personal administrativo', 'Personal administrativo y contratistas, vinculación, distribución y desarrollo.', 'people'],
        7 => ['cat', 'Centros de Atención Tutorial (CAT) e infraestructura', 'Cobertura territorial, sedes, espacios, tecnología y fichas de cada CAT.', 'building'],
        8 => ['bienestar', 'Bienestar universitario y TUIDEAD', 'Beneficiarios, servicios, participación, apoyos y satisfacción.', 'heart'],
        9 => ['investigacion', 'Investigación y producción académica', 'Grupos, semilleros, proyectos, producción académica e investigación formativa.', 'flask'],
        10 => ['extension', 'Extensión, proyección social y formación continua', 'Proyectos de extensión, beneficiarios y formación continua.', 'hands'],
        11 => ['gestion-financiera', 'Gestión financiera', 'Presupuesto, ejecución, distribución por destino e inversión territorial.', 'money'],
        12 => ['proyectos', 'Proyectos de inversión y gestión institucional', 'Estado, líneas, cobertura, financiación y avance de proyectos; convenios y metas.', 'project'],
        13 => ['calidad', 'Calidad académica y recursos digitales', 'Registros calificados, acreditación, planes de mejoramiento y plataformas digitales.', 'shield'],
    ];

    /** «VALLE DEL CAUCA» → «Valle del Cauca», «BOGOTÁ, D.C.» → «Bogotá, D.C.». */
    public static function properName(string $upper): string
    {
        $fixed = ['QUINDIO' => 'Quindío', 'BOGOTÁ, D.C.' => 'Bogotá, D.C.'];
        if (isset($fixed[$upper])) {
            return $fixed[$upper];
        }
        $words = explode(' ', mb_convert_case(mb_strtolower($upper), MB_CASE_TITLE));
        foreach ($words as $i => $w) {
            if ($i > 0 && in_array(mb_strtolower($w), ['de', 'del', 'y', 'la'], true)) {
                $words[$i] = mb_strtolower($w);
            }
        }

        return implode(' ', $words);
    }

    public function run(): void
    {
        // Permisos y roles
        foreach (self::PERMISSIONS as $group => $perms) {
            foreach ($perms as $code => $desc) {
                Permission::updateOrCreate(['code' => $code], ['group' => $group, 'description' => $desc]);
            }
        }
        foreach (self::ROLES as $code => [$name, $desc, $perms]) {
            $role = Role::updateOrCreate(['code' => $code], ['name' => $name, 'description' => $desc]);
            $role->permissions()->sync(Permission::whereIn('code', $perms)->pluck('id'));
        }

        foreach (self::DEPENDENCIES as $code => $name) {
            Dependency::updateOrCreate(['code' => $code], ['name' => $name]);
        }
        foreach (self::SOURCES as $code => [$name, $kind, $status]) {
            DataSource::updateOrCreate(['code' => $code], ['name' => $name, 'kind' => $kind, 'official_name_status' => $status]);
        }

        // Departamentos (DANE — MGN)
        foreach (json_decode(file_get_contents(database_path('data/departamentos.json')), true) as [$code, $name]) {
            Department::updateOrCreate(['code' => $code], ['name' => self::properName($name)]);
        }

        foreach ([
            ['tecnico', 'Técnico profesional', 'pregrado', 1], ['tecnologico', 'Tecnológico', 'pregrado', 2], ['universitario', 'Profesional universitario', 'pregrado', 3],
            ['especializacion', 'Especialización', 'posgrado', 4], ['maestria', 'Maestría', 'posgrado', 5], ['doctorado', 'Doctorado', 'posgrado', 6],
        ] as [$code, $name, $cycle, $sort]) {
            EducationLevel::updateOrCreate(['code' => $code], ['name' => $name, 'cycle' => $cycle, 'sort' => $sort]);
        }
        // Áreas de conocimiento: clasificación oficial pendiente (D: NBC SNIES / CINE-F). Se crean las áreas SNIES generales.
        foreach ([
            'agronomia' => 'Agronomía, veterinaria y afines', 'bellas_artes' => 'Bellas artes', 'educacion' => 'Ciencias de la educación',
            'salud' => 'Ciencias de la salud', 'sociales' => 'Ciencias sociales y humanas', 'economia' => 'Economía, administración, contaduría y afines',
            'ingenieria' => 'Ingeniería, arquitectura, urbanismo y afines', 'matematicas' => 'Matemáticas y ciencias naturales',
        ] as $code => $name) {
            KnowledgeArea::updateOrCreate(['code' => $code], ['name' => $name, 'classification' => 'NBC']);
        }

        // Períodos 2018–2027 (semestres y años)
        for ($y = 2018; $y <= 2027; $y++) {
            AcademicPeriod::updateOrCreate(['code' => (string) $y], ['year' => $y, 'term' => null, 'type' => 'anio', 'starts_on' => "$y-01-01", 'ends_on' => "$y-12-31"]);
            foreach ([1, 2] as $t) {
                AcademicPeriod::updateOrCreate(['code' => "$y-$t"], ['year' => $y, 'term' => $t, 'type' => 'semestre',
                    'starts_on' => $t === 1 ? "$y-01-01" : "$y-07-01", 'ends_on' => $t === 1 ? "$y-06-30" : "$y-12-31"]);
            }
        }

        // Clasificadores
        foreach (json_decode(file_get_contents(database_path('data/classifiers.json')), true) as $code => $c) {
            $cl = Classifier::updateOrCreate(['code' => $code], ['name' => $c['name'], 'is_partition' => $c['is_partition']]);
            foreach ($c['items'] as $i => $item) {
                $cl->items()->updateOrCreate(['code' => $item['code']], ['label' => $item['label'], 'sort' => $i]);
            }
        }

        // Módulos e indicadores
        foreach (self::MODULES as $n => [$slug, $name, $desc, $icon]) {
            IndicatorModule::updateOrCreate(['number' => $n], ['slug' => $slug, 'name' => $name, 'description' => $desc, 'icon' => $icon]);
        }
        $modules = IndicatorModule::pluck('id', 'number');
        $deps = Dependency::pluck('id', 'code');
        $classifiers = Classifier::pluck('id', 'code');
        foreach (json_decode(file_get_contents(database_path('data/indicators.json')), true) as $d) {
            $ind = Indicator::firstOrNew(['code' => $d['code']]);
            $catalog = [
                'module_id' => $modules[$d['module']], 'sort' => $d['sort'], 'name' => $d['name'],
                'information_required' => $d['information_required'], 'suggested_visualization' => $d['suggested_visualization'],
                'source_text' => $d['source_text'], 'filters_text' => $d['filters_text'], 'publication_level' => $d['publication_level'],
            ];
            // La configuración técnica solo se fija al crear (no sobrescribe ajustes hechos luego en el panel).
            if (! $ind->exists) {
                $catalog += [
                    'unit' => $d['unit'], 'value_type' => $d['value_type'], 'periodicity' => $d['periodicity'], 'chart_type' => $d['chart_type'],
                    'group_by' => $d['group_by'], 'allowed_dimensions' => $d['allowed_dimensions'], 'widget' => $d['widget'],
                    'classifier_id' => $d['classifier'] ? $classifiers[$d['classifier']] : null,
                    'observations' => $d['observations'], 'responsible_dependency_id' => $deps[$d['responsible']] ?? null,
                    'publication_authorized' => $d['publication_authorized'], 'methodology_status' => 'pendiente',
                    'min_cell_size' => in_array($d['publication_level'], ['AGR', 'AGR_S'], true) ? 5 : null,
                ];
            }
            if ($ind->exists && $ind->widget === null && $d['widget'] !== null) {
                $catalog['widget'] = $d['widget']; // nuevos listados asociados sin sobrescribir ajustes hechos en el panel
            }
            $ind->fill($catalog)->save();
            $ind->sources()->sync(DataSource::whereIn('code', $d['sources'])->pluck('id'));
        }

        foreach ([
            ['informe', 'Informes', 'publico'], ['contrato', 'Contratos', 'restringido'], ['convenio', 'Convenios', 'restringido'],
            ['presupuesto', 'Presupuestos', 'financiero'], ['factura', 'Facturas', 'financiero'], ['soporte', 'Soportes administrativos', 'interno'],
            ['fotografia', 'Fotografías', 'interno'], ['archivo_indicador', 'Archivos de indicadores', 'interno'], ['acto_administrativo', 'Actos administrativos', 'publico'],
            ['publicacion', 'Publicaciones institucionales', 'publico'],
        ] as [$code, $name, $conf]) {
            DocumentCategory::updateOrCreate(['code' => $code], ['name' => $name, 'default_confidentiality' => $conf]);
        }
        foreach (['institucional' => 'Institucional', 'academica' => 'Académica', 'territorio' => 'Territorio', 'investigacion' => 'Investigación', 'bienestar' => 'Bienestar', 'eventos' => 'Eventos'] as $slug => $name) {
            NewsCategory::updateOrCreate(['slug' => $slug], ['name' => $name]);
        }

        // Cifras destacadas del inicio (según boceto). Cada una se conecta a su indicador o a un conteo de registros publicados.
        if (HomeHighlight::count() === 0) {
            $ind = Indicator::pluck('id', 'code');
            $cov = Classifier::where('code', 'medida_cobertura')->first()->items->pluck('id', 'code');
            foreach ([
                ['CAT', 'building', 'cats_count', null, null, '/cat'],
                ['Estudiantes', 'students', 'indicator', $ind['M02-I01'], null, '/estadisticas/estudiantes'],
                ['Docentes', 'teacher', 'indicator', $ind['M04-I01'], null, '/estadisticas/docentes'],
                ['Municipios', 'pin', 'indicator', $ind['M07-I01'], $cov['municipios'], '/cat'],
                ['Programas Académicos', 'graduation', 'programs_count', null, null, '/programas'],
                ['Actividades', 'calendar', 'events_year', null, null, '/actividades'],
            ] as $i => [$label, $icon, $type, $indId, $item, $link]) {
                HomeHighlight::create(['label' => $label, 'icon' => $icon, 'metric_type' => $type, 'indicator_id' => $indId, 'classifier_item_id' => $item, 'link' => $link, 'sort' => $i]);
            }
        }
        // Equipo IDEAD (boceto): solo nombres de unidades; contactos pendientes de suministro.
        if (TeamUnit::count() === 0) {
            foreach (['Dirección', 'Centros Regionales', 'Secretaría Académica'] as $i => $name) {
                TeamUnit::create(['name' => $name, 'description' => 'Información de contacto pendiente de suministro institucional.', 'sort' => $i, 'icon' => 'people']);
            }
        }
        foreach ([
            'sobre-idead' => ['Sobre el IDEAD', '<p>Contenido institucional pendiente de suministro por la Dirección del IDEAD (misión, visión, historia y estructura).</p>'],
            'privacidad' => ['Política de privacidad y tratamiento de datos personales', '<p>El portal publica únicamente información agregada y autorizada. La política de tratamiento de datos personales de la Universidad del Tolima (Ley 1581 de 2012 y Decreto 1074 de 2015) debe enlazarse aquí: <strong>pendiente de suministro institucional</strong>.</p>'],
            'accesibilidad' => ['Accesibilidad', '<p>Este portal se diseñó siguiendo las pautas WCAG 2.1 nivel AA: navegación por teclado, contraste suficiente, textos alternativos y tablas equivalentes para cada gráfico. Si encuentra una barrera de accesibilidad, comuníquese con el IDEAD.</p>'],
            'contacto' => ['Contacto', '<p>Datos de contacto pendientes de suministro institucional.</p>'],
        ] as $slug => [$title, $body]) {
            Page::firstOrCreate(['slug' => $slug], ['title' => $title, 'body' => $body, 'status' => 'publicado', 'publish_at' => now()]);
        }
    }
}

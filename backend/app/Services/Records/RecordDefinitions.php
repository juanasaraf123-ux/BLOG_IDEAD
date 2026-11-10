<?php

namespace App\Services\Records;

/**
 * Definición de las bases institucionales que se cargan desde el panel con una plantilla de Excel/CSV.
 * Cada columna: clave, encabezado de la plantilla, si es obligatoria, tipo, ayuda y ejemplo.
 * Las columnas coinciden con lo solicitado a cada oficina en «Requerimientos de información portal institucional».
 */
class RecordDefinitions
{
    public const DOC_TYPES = ['CC' => 'Cédula de ciudadanía', 'TI' => 'Tarjeta de identidad', 'CE' => 'Cédula de extranjería', 'PA' => 'Pasaporte', 'PEP' => 'Permiso especial de permanencia', 'PPT' => 'Permiso por protección temporal', 'RC' => 'Registro civil'];

    public const SEX = ['femenino' => 'Femenino', 'masculino' => 'Masculino', 'otro' => 'Otro', 'no_informa' => 'No informa'];

    /** Columnas de identificación comunes a las bases de personas. */
    private static function person(): array
    {
        return [
            ['key' => 'tipo_documento', 'label' => 'Tipo de documento', 'required' => true, 'type' => 'doctype', 'help' => 'CC, TI, CE, PA, PEP, PPT o RC.', 'example' => 'CC'],
            ['key' => 'numero_documento', 'label' => 'Número de documento', 'required' => true, 'type' => 'document', 'help' => 'Solo el número, sin puntos ni espacios.', 'example' => '1110555123'],
            ['key' => 'nombres_apellidos', 'label' => 'Nombres y apellidos', 'required' => true, 'type' => 'text', 'max' => 200, 'help' => 'Nombre completo.', 'example' => 'Ana María Pérez Gómez'],
            ['key' => 'correo', 'label' => 'Correo electrónico', 'required' => false, 'type' => 'email', 'help' => 'Correo institucional o personal.', 'example' => 'ana.perez@ut.edu.co'],
            ['key' => 'telefono', 'label' => 'Teléfono', 'required' => false, 'type' => 'text', 'max' => 40, 'help' => 'Celular o fijo.', 'example' => '3001234567'],
        ];
    }

    public static function all(): array
    {
        return [
            'estudiantes' => [
                'model' => \App\Models\Enrollment::class,
                'title' => 'Estudiantes matriculados',
                'short' => 'Estudiantes',
                'icon' => 'students',
                'source' => 'DARCA – Admisiones, Registro y Control Académico',
                'description' => 'Un registro por estudiante, programa y semestre.',
                'by_period' => true,
                'columns' => array_merge(self::person(), [
                    ['key' => 'programa', 'label' => 'Programa', 'required' => true, 'type' => 'program', 'help' => 'Nombre del programa o código SNIES (ver hoja «Valores válidos»).', 'example' => 'Licenciatura en Pedagogía Infantil'],
                    ['key' => 'cat', 'label' => 'CAT', 'required' => true, 'type' => 'cat', 'help' => 'Nombre del CAT o municipio sede (ver hoja «Valores válidos»).', 'example' => 'Ibagué'],
                    ['key' => 'estado_matricula', 'label' => 'Estado de matrícula', 'required' => false, 'type' => 'enum', 'options' => ['matriculado' => 'Matriculado', 'retirado' => 'Retirado', 'aplazado' => 'Aplazado', 'graduando' => 'Graduando'], 'help' => 'Si se deja vacío: Matriculado.', 'example' => 'Matriculado'],
                    ['key' => 'primer_ingreso', 'label' => 'Primer ingreso', 'required' => false, 'type' => 'bool', 'help' => 'Sí si es estudiante nuevo en el semestre; No si es antiguo.', 'example' => 'No'],
                    ['key' => 'semestre', 'label' => 'Semestre que cursa', 'required' => false, 'type' => 'int', 'min' => 1, 'max' => 12, 'help' => 'Número del 1 al 12.', 'example' => '3'],
                    ['key' => 'sexo', 'label' => 'Sexo', 'required' => false, 'type' => 'sex', 'help' => 'Femenino, Masculino, Otro o No informa.', 'example' => 'Femenino'],
                    ['key' => 'fecha_nacimiento', 'label' => 'Fecha de nacimiento', 'required' => false, 'type' => 'date', 'help' => 'dd/mm/aaaa. Solo se guarda el rango de edad.', 'example' => '15/03/2001'],
                    ['key' => 'estado_civil', 'label' => 'Estado civil', 'required' => false, 'type' => 'enum', 'options' => ['soltero' => 'Soltero(a)', 'casado' => 'Casado(a)', 'union_libre' => 'Unión libre', 'separado' => 'Separado(a)', 'divorciado' => 'Divorciado(a)', 'viudo' => 'Viudo(a)'], 'help' => 'Soltero, Casado, Unión libre, Separado, Divorciado o Viudo.', 'example' => 'Soltero'],
                    ['key' => 'estrato', 'label' => 'Estrato', 'required' => false, 'type' => 'int', 'min' => 1, 'max' => 6, 'help' => 'Número del 1 al 6.', 'example' => '2'],
                    ['key' => 'zona', 'label' => 'Zona de residencia', 'required' => false, 'type' => 'enum', 'options' => ['urbana' => 'Urbana', 'rural' => 'Rural'], 'help' => 'Urbana o Rural.', 'example' => 'Rural'],
                    ['key' => 'municipio_residencia', 'label' => 'Municipio de residencia', 'required' => false, 'type' => 'municipality', 'help' => 'Nombre del municipio o código DANE.', 'example' => 'Chaparral'],
                    ['key' => 'poblacion_especial', 'label' => 'Población especial', 'required' => false, 'type' => 'list', 'help' => 'Si aplica, separadas por punto y coma: indígena; afrodescendiente; discapacidad; víctima del conflicto…', 'example' => ''],
                    ['key' => 'promedio', 'label' => 'Promedio acumulado', 'required' => false, 'type' => 'decimal', 'min' => 0, 'max' => 5, 'help' => 'De 0 a 5 (ejemplo: 4,2).', 'example' => '4,2'],
                    ['key' => 'representante_estudiantil', 'label' => 'Representante estudiantil', 'required' => false, 'type' => 'bool', 'help' => 'Sí o No.', 'example' => 'No'],
                ]),
            ],
            'docentes' => [
                'model' => \App\Models\Teacher::class,
                'title' => 'Docentes',
                'short' => 'Docentes',
                'icon' => 'teacher',
                'source' => 'Departamentos académicos',
                'description' => 'Una fila por docente, CAT y programa donde tiene carga en el semestre.',
                'by_period' => true,
                'columns' => array_merge(self::person(), [
                    ['key' => 'vinculacion', 'label' => 'Tipo de vinculación', 'required' => true, 'type' => 'enum', 'options' => ['carrera' => 'Planta / carrera', 'catedra' => 'Cátedra', 'ocasional' => 'Ocasional', 'otra' => 'Otra'], 'help' => 'Planta, Cátedra, Ocasional u Otra.', 'example' => 'Cátedra'],
                    ['key' => 'nivel_formacion', 'label' => 'Máximo nivel de formación', 'required' => false, 'type' => 'enum', 'options' => ['profesional' => 'Profesional', 'especializacion' => 'Especialización', 'maestria' => 'Maestría', 'doctorado' => 'Doctorado'], 'help' => 'Profesional, Especialización, Maestría o Doctorado.', 'example' => 'Maestría'],
                    ['key' => 'categoria', 'label' => 'Categoría (planta)', 'required' => false, 'type' => 'enum', 'options' => ['auxiliar' => 'Auxiliar', 'asistente' => 'Asistente', 'asociado' => 'Asociado', 'titular' => 'Titular'], 'help' => 'Solo docentes de planta.', 'example' => ''],
                    ['key' => 'sexo', 'label' => 'Sexo', 'required' => false, 'type' => 'sex', 'help' => 'Femenino, Masculino, Otro o No informa.', 'example' => 'Masculino'],
                    ['key' => 'fecha_nacimiento', 'label' => 'Fecha de nacimiento', 'required' => false, 'type' => 'date', 'help' => 'dd/mm/aaaa. Solo se guarda el rango de edad.', 'example' => '20/08/1980'],
                    ['key' => 'fecha_vinculacion', 'label' => 'Fecha de vinculación', 'required' => false, 'type' => 'date', 'help' => 'dd/mm/aaaa. Se usa para calcular la antigüedad.', 'example' => '01/02/2015'],
                    ['key' => 'departamento_academico', 'label' => 'Departamento académico', 'required' => false, 'type' => 'dependency', 'help' => 'Nombre de la dependencia (ver hoja «Valores válidos»).', 'example' => ''],
                    ['key' => 'cat', 'label' => 'CAT', 'required' => true, 'type' => 'cat', 'help' => 'CAT donde tiene carga (ver hoja «Valores válidos»).', 'example' => 'Ibagué'],
                    ['key' => 'programa', 'label' => 'Programa', 'required' => false, 'type' => 'program', 'help' => 'Programa donde orienta cursos.', 'example' => 'Licenciatura en Pedagogía Infantil'],
                    ['key' => 'cursos', 'label' => 'Número de cursos', 'required' => false, 'type' => 'int', 'min' => 0, 'max' => 100, 'help' => 'Cursos en ese CAT y programa.', 'example' => '2'],
                    ['key' => 'horas', 'label' => 'Horas', 'required' => false, 'type' => 'int', 'min' => 0, 'max' => 2000, 'help' => 'Horas asignadas en el semestre.', 'example' => '64'],
                    ['key' => 'grupo_investigacion', 'label' => 'Pertenece a grupo de investigación', 'required' => false, 'type' => 'bool', 'help' => 'Sí o No.', 'example' => 'No'],
                    ['key' => 'semillero', 'label' => 'Pertenece a semillero', 'required' => false, 'type' => 'bool', 'help' => 'Sí o No.', 'example' => 'No'],
                    ['key' => 'seminario_docencia', 'label' => 'Participó en seminario de docencia', 'required' => false, 'type' => 'bool', 'help' => 'Sí o No.', 'example' => 'Sí'],
                ]),
            ],
            'graduados' => [
                'model' => \App\Models\Graduation::class,
                'title' => 'Graduados',
                'short' => 'Graduados',
                'icon' => 'graduate',
                'source' => 'Oficina de Graduados / SGUT',
                'description' => 'Una fila por título otorgado. El semestre de grado se toma de la fecha de grado.',
                'by_period' => false,
                'columns' => array_merge(self::person(), [
                    ['key' => 'programa', 'label' => 'Programa', 'required' => true, 'type' => 'program', 'help' => 'Nombre del programa o código SNIES.', 'example' => 'Licenciatura en Pedagogía Infantil'],
                    ['key' => 'cat', 'label' => 'CAT', 'required' => false, 'type' => 'cat', 'help' => 'CAT donde cursó el programa.', 'example' => 'Chaparral'],
                    ['key' => 'fecha_grado', 'label' => 'Fecha de grado', 'required' => true, 'type' => 'date', 'help' => 'dd/mm/aaaa.', 'example' => '12/12/2025'],
                    ['key' => 'periodo_ingreso', 'label' => 'Semestre de ingreso', 'required' => false, 'type' => 'period', 'help' => 'Por ejemplo 2020-1.', 'example' => '2020-1'],
                    ['key' => 'opcion_grado', 'label' => 'Opción de grado', 'required' => false, 'type' => 'text', 'max' => 60, 'help' => 'Trabajo de grado, pasantía, seminario…', 'example' => 'Trabajo de grado'],
                    ['key' => 'sexo', 'label' => 'Sexo', 'required' => false, 'type' => 'sex', 'help' => 'Femenino, Masculino, Otro o No informa.', 'example' => 'Femenino'],
                    ['key' => 'promedio_final', 'label' => 'Promedio final', 'required' => false, 'type' => 'decimal', 'min' => 0, 'max' => 5, 'help' => 'De 0 a 5.', 'example' => '4,1'],
                    ['key' => 'situacion_laboral', 'label' => 'Situación laboral', 'required' => false, 'type' => 'enum', 'options' => ['empleado' => 'Empleado', 'emprendedor' => 'Emprendedor / independiente', 'desempleado' => 'Desempleado', 'sin_dato' => 'Sin dato'], 'help' => 'Empleado, Emprendedor, Desempleado o Sin dato.', 'example' => 'Empleado'],
                ]),
            ],
            'personal' => [
                'model' => \App\Models\AdministrativeStaff::class,
                'title' => 'Personal administrativo y contratistas',
                'short' => 'Personal',
                'icon' => 'people',
                'source' => 'Centros Regionales (CRIDEAD)',
                'description' => 'Una fila por persona en el semestre (planta o contratista).',
                'by_period' => true,
                'columns' => array_merge(self::person(), [
                    ['key' => 'condicion', 'label' => 'Condición', 'required' => true, 'type' => 'enum', 'options' => ['administrativo' => 'Planta', 'contratista' => 'Contratista'], 'help' => 'Planta o Contratista.', 'example' => 'Contratista'],
                    ['key' => 'tipo_vinculacion', 'label' => 'Tipo de vinculación', 'required' => false, 'type' => 'enum', 'options' => ['carrera_administrativa' => 'Carrera administrativa', 'libre_nombramiento' => 'Libre nombramiento', 'provisional' => 'Provisional', 'temporal' => 'Temporal', 'prestacion_servicios' => 'Prestación de servicios'], 'help' => 'Carrera administrativa, Libre nombramiento, Provisional, Temporal o Prestación de servicios.', 'example' => 'Prestación de servicios'],
                    ['key' => 'cargo', 'label' => 'Cargo u objeto', 'required' => false, 'type' => 'text', 'max' => 120, 'help' => 'Cargo o rol que desempeña.', 'example' => 'Auxiliar administrativo'],
                    ['key' => 'grado', 'label' => 'Grado', 'required' => false, 'type' => 'text', 'max' => 20, 'help' => 'Solo personal de planta.', 'example' => ''],
                    ['key' => 'funcion_principal', 'label' => 'Función principal', 'required' => false, 'type' => 'text', 'max' => 255, 'help' => 'Breve descripción.', 'example' => 'Atención a estudiantes'],
                    ['key' => 'numero_contrato', 'label' => 'Número de contrato', 'required' => false, 'type' => 'text', 'max' => 60, 'help' => 'Solo contratistas.', 'example' => 'CPS-123-2026'],
                    ['key' => 'inicio_contrato', 'label' => 'Inicio del contrato', 'required' => false, 'type' => 'date', 'help' => 'dd/mm/aaaa.', 'example' => '01/02/2026'],
                    ['key' => 'fin_contrato', 'label' => 'Fin del contrato', 'required' => false, 'type' => 'date', 'help' => 'dd/mm/aaaa.', 'example' => '30/06/2026'],
                    ['key' => 'dependencia', 'label' => 'Dependencia', 'required' => false, 'type' => 'dependency', 'help' => 'Dependencia donde trabaja.', 'example' => 'Centros Regionales'],
                    ['key' => 'cat', 'label' => 'CAT', 'required' => false, 'type' => 'cat', 'help' => 'Si trabaja en un CAT.', 'example' => 'Ibagué'],
                    ['key' => 'sexo', 'label' => 'Sexo', 'required' => false, 'type' => 'sex', 'help' => 'Femenino, Masculino, Otro o No informa.', 'example' => 'Femenino'],
                    ['key' => 'fecha_nacimiento', 'label' => 'Fecha de nacimiento', 'required' => false, 'type' => 'date', 'help' => 'dd/mm/aaaa. Solo se guarda el rango de edad.', 'example' => '05/05/1990'],
                    ['key' => 'nivel_formacion', 'label' => 'Nivel de formación', 'required' => false, 'type' => 'enum', 'options' => ['bachiller' => 'Bachiller', 'tecnico' => 'Técnico', 'tecnologo' => 'Tecnólogo', 'profesional' => 'Profesional', 'especializacion' => 'Especialización', 'maestria' => 'Maestría', 'doctorado' => 'Doctorado'], 'help' => 'Bachiller, Técnico, Tecnólogo, Profesional, Especialización, Maestría o Doctorado.', 'example' => 'Profesional'],
                    ['key' => 'fecha_vinculacion', 'label' => 'Fecha de vinculación', 'required' => false, 'type' => 'date', 'help' => 'dd/mm/aaaa. Se usa para calcular la antigüedad.', 'example' => '01/02/2020'],
                    ['key' => 'capacitado', 'label' => 'Recibió capacitación en el semestre', 'required' => false, 'type' => 'bool', 'help' => 'Sí o No.', 'example' => 'Sí'],
                ]),
            ],
        ];
    }

    public static function get(string $entity): array
    {
        $all = self::all();
        abort_unless(isset($all[$entity]), 404, 'Base no reconocida.');

        return $all[$entity] + ['entity' => $entity];
    }
}

<?php

namespace Database\Seeders;

use App\Models\Cat;
use App\Models\CatalogItem;
use App\Models\Department;
use App\Models\EducationLevel;
use App\Models\Event;
use App\Models\Municipality;
use App\Models\Page;
use App\Models\Program;
use App\Models\Publication;
use App\Models\TeamUnit;
use App\Services\Settings;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Información PÚBLICA y OFICIAL tomada de las páginas de la Universidad del Tolima (consulta del 23-11-2026).
 * No son datos de demostración (is_demo = false). Es idempotente: se puede ejecutar varias veces.
 *
 *   php artisan db:seed --class=UniversidadTolimaSeeder
 *
 * Fuentes:
 *  - Misión, visión y principios: Acuerdo 0237 de 2026 del Consejo Directivo del IDEAD.
 *  - Historia y directores: https://idead.ut.edu.co/el-instituto/presentacion.html
 *  - Programas: fichas de https://idead.ut.edu.co/programas-idead/pregrados.html y posgrados.html
 *  - CAT: directorio de la Universidad (du_id_oficina=1175) e historia de los CAT.
 *  - Publicaciones: Excel «Artículos y autores revistas IDEAD» y revista Experiencias Educativas.
 *  - Calendario académico 2027 (modalidad distancia): https://ut.edu.co/calendario-academico.html
 */
class UniversidadTolimaSeeder extends Seeder
{
    private const DATA = 'data/ut/';

    public function run(): void
    {
        DB::transaction(function () {
            $this->settings();
            $this->pages();
            $this->team();
            $this->programs();
            $this->cats();
            $this->publications();
            $this->continuingEducation();
            $this->calendar();
        });
        \App\Support\PublicCache::bump();
    }

    private function settings(): void
    {
        Settings::set('contact_address', 'IDEAD, bloque 31B, sede central Universidad del Tolima. Calle 42 No. 1-02, barrio Santa Helena parte alta, Ibagué, Tolima');
        Settings::set('contact_phone', '(608) 2771212 ext. 9413 · Línea gratuita 018000181313');
        Settings::set('contact_email', 'atencionalciudadano@ut.edu.co');
        Settings::set('official_links', json_encode([
            ['label' => 'Universidad del Tolima', 'url' => 'https://www.ut.edu.co'],
            ['label' => 'Página del IDEAD', 'url' => 'https://idead.ut.edu.co'],
            ['label' => 'Calendario académico', 'url' => 'https://ut.edu.co/calendario-academico.html'],
            ['label' => 'Aspirantes e inscripciones', 'url' => 'http://aspirantes.ut.edu.co/'],
            ['label' => 'Normatividad (SIAAD)', 'url' => 'http://siaad.ut.edu.co:8080/actosadministrativos/publico/documento/buscardocumento.xhtml'],
            ['label' => 'PQRDSF', 'url' => 'http://pqr.ut.edu.co/'],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        Settings::set('social_links', json_encode([
            ['label' => 'Facebook', 'url' => 'https://www.facebook.com/unitolima'],
            ['label' => 'Instagram', 'url' => 'https://www.instagram.com/unitolima_ut/'],
            ['label' => 'X (Twitter)', 'url' => 'https://twitter.com/Uni_Tolima'],
            ['label' => 'YouTube', 'url' => 'https://www.youtube.com/user/UniversidaddelTolima'],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function page(string $slug, string $title, string $body): void
    {
        Page::updateOrCreate(['slug' => $slug], ['title' => $title, 'body' => $body, 'status' => 'publicado', 'publish_at' => now()]);
    }

    private function pages(): void
    {
        $principios = [
            ['Arraigados al territorio', 'Nuestra labor educativa se construye desde el diálogo con los territorios. Reconocemos sus saberes, prácticas, necesidades y potencialidades como base para una formación pertinente, situada y transformadora, que fortalece la relación entre la Universidad y las comunidades.'],
            ['Incluyentes y diversos', 'Fomentamos entornos de aprendizaje abiertos, respetuosos y plurales, donde se valora la diferencia como riqueza pedagógica. Promovemos la equidad, la interculturalidad, el respeto por los pueblos ancestrales y las voces históricamente silenciadas, garantizando condiciones de aprendizaje justas para todas y todos.'],
            ['Integradores', 'Promovemos la integración participativa académica y social, el diálogo comunitario y la responsabilidad entre pares, como mecanismos que generan nuevos saberes.'],
            ['Autónomos', 'Creemos en la capacidad del ser humano para articular el trabajo individual y colectivo con los recursos académicos, como expresión de la autoformación.'],
            ['Estéticos', 'Encontramos en la sensibilidad el medio para descubrir, comprender y apreciar las distintas expresiones del mundo y de lo humano.'],
            ['Innovadores', 'Impulsamos una pedagogía flexible y en constante evolución, que integra las tecnologías digitales como mediadoras del aprendizaje significativo. Promovemos la creación de experiencias educativas que respondan a los desafíos del presente y estimulen el pensamiento crítico, colaborativo y contextualizado.'],
            ['Exploradores', 'Creemos en la investigación formativa como un proceso pedagógico que genera nuevos saberes y procesos transformadores. Promovemos la articulación entre saber académico y saber comunitario para comprender, intervenir y transformar realidades concretas.'],
            ['Ambientalmente conscientes', 'Asumimos el compromiso institucional con el cuidado del entorno y el respeto por la vida en todas sus formas. Promovemos una cultura ambiental que vincula la formación, la investigación y la proyección social, de cara a la conservación de los ecosistemas y de quienes los integran.'],
        ];
        $acuerdo = 'https://idead.ut.edu.co/images/idead/ACUERDO_No._0237_MISI%C3%93N_Y_VISI%C3%93N_DEL_IDEAD.pdf';
        $body = '<h2>Misión</h2><p>Somos el Instituto de Educación a Distancia de la Universidad del Tolima, con impacto nacional, comprometido con la transformación social y cultural de los territorios, que propende por la formación integral de ciudadanos orientados al desarrollo sociocultural y económico de las regiones, la investigación de problemáticas propias de los contextos locales y la proyección social y comunitaria, para la resignificación de sus realidades; guiados por prácticas pedagógicas humanistas, con principios de igualdad, equidad, inclusión y diversidad. Con pertinencia territorial, que aporta a la construcción social de país y a la calidad de vida de la población.</p>'
            .'<h2>Visión</h2><p>En el año 2032, el Instituto de Educación a Distancia de la Universidad del Tolima será reconocido a nivel nacional como el referente de educación pública superior a distancia, comprometido con la justicia social, el sentido territorial, la investigación, la proyección social y la transformación educativa. Caracterizado por la implementación de procesos formativos innovadores, inclusivos, diversos y culturalmente contextualizados; a partir del uso de mediaciones pedagógicas y herramientas tecnológicas, que potenciarán el desarrollo de la comunidad educativa, las regiones y los actores sociales del país.</p>'
            .'<h2>Valores de formación</h2><ul>'.implode('', array_map(fn ($p) => "<li><strong>{$p[0]}.</strong> {$p[1]}</li>", $principios)).'</ul>'
            .'<h2>Principios</h2><p>Respeto, justicia, transparencia, igualdad, equidad, honestidad, confidencialidad y responsabilidad social.</p>'
            .'<p><em>Aprobados por el Consejo Directivo del IDEAD mediante el <a href="'.$acuerdo.'">Acuerdo 0237 del 29 de enero de 2026</a>.</em></p>'
            .'<h2>Historia</h2>'
            .'<p>El 30 de diciembre de 1982, mediante el Acuerdo 080 del Consejo Superior de la Universidad del Tolima, se creó el Programa de Universidad Abierta y a Distancia, para ofrecer educación superior a quienes, por razones de trabajo, lugar de residencia o disponibilidad de tiempo, no podían seguir programas presenciales.</p>'
            .'<p>El Centro Especial de Educación a Distancia inició labores en 1984 con 505 estudiantes de la Licenciatura en Educación Preescolar, con sede central en Ibagué y centros en Espinal, Chaparral, Lérida y Armero. El 7 de marzo de 1991, mediante el Acuerdo 027, adoptó el nombre de Instituto de Educación a Distancia. Desde 1994 amplió su presencia a otras regiones del departamento y del país.</p>'
            .'<p>Desde el 1 de octubre de 2024, mediante la Resolución 1114 del 30 de septiembre de 2024, la directora del IDEAD es la Dra. Marien Alexandra Gil Serna.</p>'
            .'<h3>Directores y directoras del IDEAD</h3><ul>'
            .'<li>Luis Alfonso Cruz Londoño (1982–1983)</li><li>Sandra Cecilia Amaya de Pujana (1983–1993)</li><li>Ana Myriam Pinto Blanco, encargada (1993–1994)</li>'
            .'<li>Luis Alberto Malagón Plata (1994–1999)</li><li>Juan Carlos Ferrero Otero (2000–2005)</li><li>Lucía Durán Pinilla (2005–2006)</li><li>Gerardo Montoya de la Cruz (2007–2010)</li>'
            .'<li>Germán Rubio Guerrero (2011)</li><li>Liliana Margarita del Basto Sabogal, encargada (2012)</li><li>Libardo Vargas Celemín, encargado, y Luis Alberto Malagón Plata (2013)</li>'
            .'<li>Indira Orfa Tatiana Rojas, encargada (2014)</li><li>Luz Ángela Prada Rojas, encargada (2015)</li><li>Martha Lucía Núñez Rodríguez (2015–2018)</li>'
            .'<li>Carlos Arturo Gamboa Bobadilla (2018–2024)</li><li>Marien Alexandra Gil Serna (desde 2024)</li></ul>'
            .'<p><em>Fuente: <a href="https://idead.ut.edu.co/el-instituto/presentacion.html">Presentación del IDEAD</a>.</em></p>';
        $this->page('sobre-idead', 'Sobre el IDEAD', $body);

        $this->page('privacidad', 'Política de privacidad y tratamiento de datos personales',
            '<p>El portal publica únicamente información agregada y autorizada. Los datos personales se tratan conforme a la Ley 1581 de 2012 y a la <a href="https://administrativos.ut.edu.co/images/RES._0676_DEL_27-05-19_ADOPTA_MANUAL_DE_POLITICAS.pdf">Política para el tratamiento y protección de datos personales de la Universidad del Tolima</a> (Resolución 0676 de 2019).</p>');

        $this->page('contacto', 'Contacto',
            '<h2>Instituto de Educación a Distancia – IDEAD</h2><p>Bloque 31B, sede central de la Universidad del Tolima. Calle 42 No. 1-02, barrio Santa Helena parte alta, Ibagué, Tolima.</p>'
            .'<ul><li>Dirección del IDEAD: PBX (608) 2771212 ext. 9413</li><li>Secretaría Académica: ext. 9429</li><li>Centros Regionales: ext. 9481</li></ul>'
            .'<h2>Universidad del Tolima</h2><ul><li>Teléfono: (608) 2771212 · Línea gratuita 018000181313</li><li>WhatsApp: +57 317 368 6404</li><li>Correo: atencionalciudadano@ut.edu.co</li>'
            .'<li>Horario: lunes a jueves de 8:00 a. m. a 12:00 m. y de 2:00 a 6:00 p. m.; viernes de 7:30 a. m. a 12:30 p. m. y de 2:00 a 5:00 p. m.</li>'
            .'<li><a href="http://pqr.ut.edu.co/">Peticiones, quejas, reclamos, denuncias, sugerencias y felicitaciones (PQRDSF)</a></li></ul>'
            .'<p>Los datos de cada CAT están en su ficha, en la sección <a href="/cat">Centros de Atención Tutorial</a>.</p>');

        $doc = fn ($t, $u) => "<li><a href=\"$u\">$t</a></li>";
        $this->page('normatividad', 'Normatividad',
            '<p>Normas de la Universidad del Tolima que rigen al IDEAD. Los acuerdos y resoluciones (incluidos los del Consejo Directivo del IDEAD) se consultan en el <a href="http://siaad.ut.edu.co:8080/actosadministrativos/publico/documento/buscardocumento.xhtml">SIAAD</a>.</p><ul>'
            .$doc('Acuerdo 0237 de 2026 – Misión, visión, principios y valores del IDEAD', $acuerdo)
            .$doc('Estatuto General', 'https://administrativos.ut.edu.co/images/universidad/normatividad/1_Estatuto_general_ajuste_24.pdf')
            .$doc('Estatuto Estudiantil', 'https://administrativos.ut.edu.co/images/universidad/normatividad/Estatuto_Estudiantil.pdf')
            .$doc('Estatuto Profesoral', 'https://administrativos.ut.edu.co/images/universidad/normatividad/V4_estatuto_profesoral.pdf')
            .$doc('Estatuto Administrativo', 'https://administrativos.ut.edu.co/images/universidad/normatividad/Estatutoadministrativo.pdf')
            .$doc('Estatuto Disciplinario (Acuerdo 044)', 'https://administrativos.ut.edu.co/images/universidad/normatividad/Acuerdo_044.pdf')
            .$doc('Proyecto Educativo Institucional (PEI)', 'https://administrativos.ut.edu.co/images/universidad/PEI/Pei_V3-210323.pdf')
            .$doc('Política de tratamiento de datos personales (Resolución 0676 de 2019)', 'https://administrativos.ut.edu.co/images/RES._0676_DEL_27-05-19_ADOPTA_MANUAL_DE_POLITICAS.pdf')
            .$doc('Planeación estratégica del IDEAD (planes de desarrollo, inversión, acción y operativo)', 'https://idead.ut.edu.co/el-instituto/presentacion/planeacion-estrategica.html')
            .$doc('Informes de gestión de la Universidad', 'https://administrativos.ut.edu.co/rectoria/dependencias/oficina-de-planeacion-y-desarrollo-institucional/informes-de-gestion.html')
            .$doc('Manual para la presentación de trabajos escritos (IDEAD)', 'https://idead.ut.edu.co/images/noticias/2023/MANUAL_PRESENTACION_TRABAJOS_ESCRITOS.pdf')
            .'</ul>');
    }

    private function team(): void
    {
        $units = [
            ['Dirección', 'Dirección del IDEAD. Directora: Dra. Marien Alexandra Gil Serna.', '(608) 2771212 ext. 9413', 'https://idead.ut.edu.co/la-directora.html'],
            ['Centros Regionales', 'Coordinación de los Centros de Atención Tutorial (CAT).', '(608) 2771212 ext. 9481', 'https://idead.ut.edu.co/el-instituto/historia-de-los-cat.html'],
            ['Secretaría Académica', 'Procesos académicos del IDEAD y del Consejo Directivo.', '(608) 2771212 ext. 9429', null],
        ];
        foreach ($units as $i => [$name, $desc, $phone, $link]) {
            TeamUnit::updateOrCreate(['name' => $name], ['description' => $desc, 'phone' => $phone, 'link' => $link, 'sort' => $i, 'icon' => 'people', 'is_active' => true]);
        }
    }

    private function json(string $file): array
    {
        return json_decode(file_get_contents(database_path(self::DATA.$file)), true);
    }

    private function programs(): void
    {
        $levels = EducationLevel::pluck('id', 'code');
        foreach ($this->json('programas.json') as $p) {
            if ($p['snies']) {
                // Un código SNIES pertenece a un solo programa: se libera si lo tenía otro registro (p. ej. de demostración).
                Program::where('snies_code', $p['snies'])->where('slug', '!=', $p['slug'])->update(['snies_code' => null]);
            }
            $prog = Program::firstOrNew(['slug' => $p['slug']]);
            if ($prog->exists && $prog->is_demo) {
                // Venía de los datos de demostración: se quitan los valores inventados que la ficha oficial no trae.
                $prog->fill(['area_id' => null, 'qualified_registry_until' => null, 'accreditation_until' => null]);
                $prog->offerings()->where('is_demo', true)->delete();
            }
            $prog->fill([
                'name' => $p['name'], 'snies_code' => $p['snies'], 'level_id' => $levels[$p['level']],
                'modality' => $p['modality'], 'duration_semesters' => $p['duration_semesters'], 'credits' => $p['credits'],
                'description' => $p['description'], 'status' => 'activo', 'publication_status' => 'publicado', 'is_demo' => false,
            ])->save();
        }
    }

    private function cats(): void
    {
        foreach ($this->json('cats.json') as $c) {
            $dep = Department::where('code', $c['departamento'])->firstOrFail();
            $mun = Municipality::firstOrCreate(['code' => $c['dane']], ['department_id' => $dep->id, 'name' => $c['municipio']]);
            $attrs = [
                'name' => $c['name'], 'municipality_id' => $mun->id, 'address' => $c['address'], 'phone' => mb_substr($c['phone'], 0, 60),
                'schedule' => $c['schedule'], 'status' => 'activo', 'publication_status' => 'publicado', 'is_demo' => false,
            ];
            if ($c['history']) {
                $attrs['history'] = $c['history'];
            }
            $cat = Cat::firstOrNew(['slug' => $c['slug']]);
            if ($cat->exists && $cat->is_demo) {
                // Venía de los datos de demostración: se quitan los valores y relaciones inventados.
                $cat->fill(['latitude' => null, 'longitude' => null, 'coords_verified' => false, 'manager_name' => null, 'manager_public' => false,
                    'opened_on' => null, 'photo_file_id' => null, 'email' => null, 'history' => null]);
                $cat->sites()->delete();
                $cat->facilities()->delete();
                $cat->events()->delete();
                $cat->coverage()->detach();
                $cat->projects()->detach();
                $cat->offerings()->where('is_demo', true)->delete();
            }
            $cat->fill($attrs)->save();
        }
    }

    private function publications(): void
    {
        $f = fopen(database_path(self::DATA.'articulos_revistas_idead.csv'), 'r');
        fgetcsv($f, 0, ';'); // encabezado
        $names = ['IDEALES' => 'Ideales', 'ENTRELINEAS' => 'Entrelíneas', 'ERGOLETRIAS' => 'Ergoletrías', 'USTELEE' => 'Ustelee', 'GESTION Y FINANZAS' => 'Gestión y Finanzas'];
        $i = 0;
        while (($r = fgetcsv($f, 0, ';')) !== false) {
            [$rev, $num, $title, $authors, $program] = array_pad($r, 5, '');
            $title = trim(preg_replace('/\s+/u', ' ', str_replace("\u{FEFF}", '', $title)));
            if ($title === '' || ! isset($names[trim($rev)])) {
                continue;
            }
            $i++;
            preg_match('/(19|20)\d{2}/', $num, $y);
            $journal = $names[trim($rev)];
            Publication::updateOrCreate(['slug' => 'revista-'.Str::slug($journal).'-'.$i], [
                'title' => mb_substr($title === mb_strtoupper($title) ? Str::ucfirst(mb_strtolower($title)) : $title, 0, 250), 'publication_type' => 'articulo',
                'authors' => trim($authors) ?: null, 'year' => $y[0] ?? 2000, 'publisher' => "Revista $journal, ".trim($num),
                'url' => 'https://idead.ut.edu.co/servicios/articulos-y-autores-revistas-idead.html',
                'abstract' => trim($program) ? 'Programa: '.trim($program) : null,
                'publication_status' => 'publicado', 'is_demo' => false,
            ]);
        }
        fclose($f);
        $base = 'https://idead.ut.edu.co/images/idead/revistas/Experiencias_Educativas/';
        foreach ([[1, 2020, 'EXPERIENCIAS_DIVERSIDAD_VOLUMEN_1_A%C3%B1o_2020v2.pdf'], [2, 2021, 'EXPERIENCIAS_DIVERSIDAD_VOLUMEN_2_A%C3%B1o_2021v2.pdf'], [3, 2022, 'EXPERIENCIAS_DIVERSIDAD_VOLUMEN_3_A%C3%B1o_2022v2.pdf'], [4, 2023, 'EXPERIENCIAS_DIVERSIDAD_VOLUMEN_4_A%C3%B1o_2023.pdf'], [5, 2024, 'Volumen_No._5_-_A%C3%B1o_2024_EEDN.pdf']] as [$v, $y, $file]) {
            Publication::updateOrCreate(['slug' => "experiencias-educativas-diversidad-ninez-vol-$v"], [
                'title' => "Experiencias Educativas para la Diversidad en la Niñez – Volumen $v", 'publication_type' => 'revista', 'year' => $y,
                'publisher' => 'IDEAD – Especialización en Educación para la Diversidad en la Niñez', 'url' => $base.$file,
                'publication_status' => 'publicado', 'is_demo' => false,
            ]);
        }
    }

    private function continuingEducation(): void
    {
        $offer = [
            'Seminario' => ['Seminario de Docencia Universitaria'],
            'Diplomado de opción de grado' => ['Diplomado en la pedagogía lúdica como ambiente de aprendizaje en contextos escolares', 'Diplomado en Discapacidad y Atención a la Diversidad Educativa', 'Diplomado en Agroecología para la Sustentabilidad', 'Diplomado en Sistemas Integrados de Gestión: Herramientas de Calidad para la Competitividad Empresarial', 'Diplomado en Derecho Laboral', 'Diplomado en Gestión Estratégica Integral del Talento Humano'],
            'Diplomado' => ['Diplomado en Pedagogías para la Paz', 'Diplomado Conéctate con la U (Saber Pro)', 'Diplomado en Estrategias Musicales para la Primera Infancia', 'Diplomado La Escuela en la Red', 'Diplomado en Gerencia y Gestión de Instituciones Educativas', 'Diplomado en Plan de Ordenamiento y Manejo de Cuencas Hidrográficas', 'Diplomado en Marketing Digital', 'Diplomado en Sistemas de Gestión de Calidad, Seguridad y Medio Ambiente', 'Diplomado en Emprendimiento Óptimo, Formal y Digital', 'Diplomado en Operación y Mantenimiento de Maquinaria Pesada, Equipos Agrícolas y Portuarios', 'Diplomado en Administración de Obra con Enfoque en la Mujer', 'Diplomado en Gerencia del Talento Humano con Énfasis en Seguridad y Salud en el Trabajo', 'Diplomado en Gestión de Operaciones Turísticas'],
            'Diplomado de inglés' => ['Diplomado en Comprensión Lectora y Escritora en Inglés B1', 'Diplomado Improving My English to Reach a Higher Level B1'],
            'Curso' => ['Curso de Extensión en Gestión de la Comunicación Asertiva en Entornos Laborales', 'Curso Básico de Animación', 'Curso de Fotografía Básica con Dispositivos Móviles'],
        ];
        foreach ($offer as $category => $titles) {
            foreach ($titles as $title) {
                CatalogItem::updateOrCreate(['list_type' => 'formacion_continua', 'title' => $title], [
                    'category' => $category, 'url' => 'https://idead.ut.edu.co/educacion-continuada.html', 'state' => 'vigente',
                    'publication_status' => 'publicado', 'is_demo' => false,
                ]);
            }
        }
    }

    private function calendar(): void
    {
        $src = '<p>Fuente: <a href="https://ut.edu.co/calendario-academico.html">Calendario académico de la Universidad del Tolima</a>.</p>';
        $events = [
            ['inscripciones-2027-a', 'Inscripciones en línea – semestre A de 2027', 'Inscripciones para las modalidades presencial, a distancia e híbrida.', '2026-10-19 08:00', '2026-12-18 18:00'],
            ['reintegros-y-cambios-de-cat-2027-a', 'Solicitudes de reintegro y de cambio de CAT – semestre A de 2027', 'Recepción de solicitudes de reintegro y de cambio de Centro de Atención Tutorial (IDEAD).', '2026-11-23 08:00', '2027-01-22 18:00'],
            ['admitidos-2027-a', 'Publicación del primer listado de admitidos – semestre A de 2027', null, '2027-01-15 08:00', null],
            ['matricula-antiguos-distancia-2027-a', 'Matrícula de estudiantes antiguos, modalidad distancia – semestre A de 2027', 'Pago de matrícula financiera y registro de matrícula académica en plataforma.', '2027-02-08 08:00', '2027-02-28 18:00'],
            ['induccion-distancia-2027-a', 'Jornadas de inducción de estudiantes nuevos, modalidad distancia – semestre A de 2027', null, '2027-02-27 08:00', '2027-02-28 17:00'],
            ['inscripciones-2027-b', 'Inscripciones en línea – semestre B de 2027', 'Inscripciones para las modalidades presencial, a distancia e híbrida.', '2027-04-05 08:00', '2027-06-04 18:00'],
        ];
        foreach ($events as [$slug, $title, $summary, $start, $end]) {
            Event::updateOrCreate(['slug' => $slug], [
                'title' => $title, 'summary' => $summary, 'body' => $src, 'category' => 'académica', 'starts_at' => $start, 'ends_at' => $end,
                'location' => 'Universidad del Tolima – IDEAD', 'status' => 'publicado', 'publish_at' => now(), 'is_demo' => false,
            ]);
        }
    }
}

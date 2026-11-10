<?php

namespace App\Services\Records;

use App\Models\Cat;
use App\Models\Dependency;
use App\Models\Program;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\CellVerticalAlignment;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Entity\SheetView;
use OpenSpout\Writer\XLSX\Writer;

/**
 * Plantilla de Excel para que cada oficina diligencie su base:
 *  - Hoja «Datos»: encabezados (los obligatorios en rojo) y una fila de ejemplo que se debe borrar.
 *  - Hoja «Instrucciones»: qué escribir en cada columna.
 *  - Hoja «Valores válidos»: programas, CAT, dependencias y opciones de las listas.
 */
class RecordTemplate
{
    public static function build(array $def): string
    {
        $tmp = tempnam(sys_get_temp_dir(), 'tpl').'.xlsx';
        $w = new Writer;
        $w->openToFile($tmp);

        $head = fn (bool $req) => new Style(fontBold: true, fontColor: 'FFFFFF', backgroundColor: $req ? 'C51718' : '17534B', shouldWrapText: true, cellVerticalAlignment: CellVerticalAlignment::CENTER);
        $title = new Style(fontBold: true, fontSize: 14, fontColor: '17534B');
        $bold = new Style(fontBold: true);
        $wrap = new Style(shouldWrapText: true, cellVerticalAlignment: CellVerticalAlignment::TOP);
        $example = new Style(fontItalic: true, fontColor: '5F656B', backgroundColor: 'F6F5F4');

        // Hoja 1: Datos
        $sheet = $w->getCurrentSheet();
        $sheet->setName('Datos');
        $sheet->setSheetView((new SheetView)->withFreezeRow(2));
        $cols = $def['columns'];
        foreach ($cols as $i => $c) {
            $sheet->setColumnWidth(max(14, min(40, mb_strlen($c['label']) + 4)), $i + 1);
        }
        $w->addRow(Row::fromValuesWithStyles(array_map(fn ($c) => $c['label'], $cols), array_map(fn ($c) => $head($c['required']), $cols), 32));
        $w->addRow(Row::fromValuesWithStyle(array_map(fn ($c) => (string) $c['example'], $cols), $example));

        // Hoja 2: Instrucciones
        $ins = $w->addNewSheetAndMakeItCurrent();
        $ins->setName('Instrucciones');
        $ins->setColumnWidth(34, 1);
        $ins->setColumnWidth(14, 2);
        $ins->setColumnWidth(70, 3);
        $ins->setColumnWidth(30, 4);
        $w->addRow(Row::fromValuesWithStyle(['Plantilla: '.$def['title']], $title));
        foreach ([
            'Fuente: '.$def['source'].'. '.$def['description'],
            '1. Escriba o pegue los datos en la hoja «Datos», desde la fila 2. Borre la fila de ejemplo (en gris).',
            '2. No cambie ni elimine los encabezados. Las columnas en rojo son obligatorias.',
            '3. Una persona por fila. Escriba el documento solo con números, sin puntos.',
            '4. Fechas en formato dd/mm/aaaa. Para programas, CAT y dependencias use los nombres de la hoja «Valores válidos».',
            '5. Guarde el archivo en Excel (.xlsx) y envíelo como respuesta al correo de solicitud.',
            'Los datos personales se guardan cifrados en la parte privada del portal (Ley 1581 de 2012). Al público solo se muestran totales.',
        ] as $line) {
            $w->addRow(Row::fromValuesWithStyle([$line], $wrap));
        }
        $w->addRow(Row::fromValues(['']));
        $w->addRow(Row::fromValuesWithStyle(['Columna', '¿Obligatoria?', 'Qué escribir', 'Ejemplo'], $head(false)));
        foreach ($cols as $c) {
            $w->addRow(Row::fromValuesWithStyles([$c['label'], $c['required'] ? 'Sí' : 'No', $c['help'], (string) $c['example']], [$bold, $wrap, $wrap, $wrap]));
        }

        // Hoja 3: Valores válidos
        $val = $w->addNewSheetAndMakeItCurrent();
        $val->setName('Valores válidos');
        $types = array_column($cols, 'type');
        $lists = [];
        if (in_array('program', $types, true)) {
            // Los datos de demostración nunca se incluyen en una plantilla.
            $progs = Program::where('is_demo', false)->orderBy('name')->get(['name', 'snies_code']);
            $lists['Programas (nombre)'] = $progs->pluck('name')->all() ?: ['(Escriba el nombre oficial del programa)'];
            $lists['Programas (código SNIES)'] = $progs->map(fn ($p) => (string) $p->snies_code)->all();
        }
        if (in_array('cat', $types, true)) {
            $lists['CAT'] = Cat::where('is_demo', false)->orderBy('name')->pluck('name')->all() ?: ['(Escriba el municipio sede del CAT)'];
        }
        if (in_array('dependency', $types, true)) {
            $lists['Dependencias'] = Dependency::orderBy('name')->pluck('name')->all();
        }
        $lists['Tipo de documento'] = array_map(fn ($k, $v) => "$k ($v)", array_keys(RecordDefinitions::DOC_TYPES), RecordDefinitions::DOC_TYPES);
        foreach ($cols as $c) {
            if ($c['type'] === 'enum') {
                $lists[$c['label']] = array_values($c['options']);
            } elseif ($c['type'] === 'sex' && ! isset($lists['Sexo'])) {
                $lists['Sexo'] = array_values(RecordDefinitions::SEX);
            } elseif ($c['type'] === 'bool' && ! isset($lists['Sí / No'])) {
                $lists['Sí / No'] = ['Sí', 'No'];
            }
        }
        $names = array_keys($lists);
        foreach ($names as $i => $n) {
            $val->setColumnWidth(in_array($n, ['Programas (nombre)', 'CAT', 'Dependencias'], true) ? 45 : 28, $i + 1);
        }
        $w->addRow(Row::fromValuesWithStyle($names, $head(false)));
        $max = max(array_map('count', $lists));
        for ($r = 0; $r < $max; $r++) {
            $w->addRow(Row::fromValues(array_map(fn ($l) => $l[$r] ?? '', array_values($lists))));
        }

        $w->setCurrentSheet($sheet);
        $w->close();

        return $tmp;
    }
}

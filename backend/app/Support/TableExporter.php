<?php

namespace App\Support;

use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\CSV\Writer as CsvWriter;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;

/** Exporta tablas a CSV (UTF-8 con BOM, separador ;) o XLSX. Neutraliza fórmulas para evitar inyección CSV. */
class TableExporter
{
    /** @param array<int,array<int,mixed>> $rows */
    public static function download(string $filename, array $header, array $rows, string $format, array $preamble = [])
    {
        $format = $format === 'xlsx' ? 'xlsx' : 'csv';
        $tmp = tempnam(sys_get_temp_dir(), 'exp').'.'.$format;
        if ($format === 'csv') {
            $w = new CsvWriter(new \OpenSpout\Writer\CSV\Options(FIELD_DELIMITER: ';'));
        } else {
            $w = new XlsxWriter;
        }
        $w->openToFile($tmp);
        foreach ($preamble as $line) {
            $w->addRow(Row::fromValues(array_map([self::class, 'safe'], $line)));
        }
        if ($preamble) {
            $w->addRow(Row::fromValues(['']));
        }
        $w->addRow(Row::fromValues($header));
        foreach ($rows as $r) {
            $w->addRow(Row::fromValues(array_map([self::class, 'safe'], $r)));
        }
        $w->close();

        return response()->download($tmp, $filename.'.'.$format, [
            'Content-Type' => $format === 'csv' ? 'text/csv; charset=UTF-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend();
    }

    public static function safe(mixed $v): mixed
    {
        if (is_string($v) && $v !== '' && in_array($v[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$v;
        }

        return $v ?? '';
    }

    /** Filas exportables de un resultado de IndicatorQuery. */
    public static function indicatorRows(string $code, string $name, string $unit, array $result): array
    {
        return array_map(fn ($r) => [
            $code, $name, $r['period'], $r['program'], $r['cat'], $r['department'], $r['municipality'], $r['level'], $r['area'], $r['category'],
            $r['suppressed'] ? 'Reservado (celda pequeña)' : $r['value'], $unit, $r['note'],
        ], $result['rows']);
    }

    public const INDICATOR_HEADER = ['código', 'indicador', 'período', 'programa', 'cat', 'departamento', 'municipio', 'nivel', 'área', 'categoría', 'valor', 'unidad', 'nota'];
}

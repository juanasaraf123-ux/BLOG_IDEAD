<?php

return [
    /*
     | Datos de demostración: si es true, el portal público muestra los registros marcados como is_demo
     | (siempre con el aviso «DATOS DE DEMOSTRACIÓN»). En producción DEBE ser false.
     */
    'demo_data' => (bool) env('IDEAD_DEMO_DATA', false),
];

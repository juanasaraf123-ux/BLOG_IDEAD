<?php

return [
    /*
     | Datos de demostración: si es true, el portal público muestra los registros marcados como is_demo
     | (siempre con el aviso «DATOS DE DEMOSTRACIÓN»). En producción DEBE ser false.
     */
    'demo_data' => (bool) env('IDEAD_DEMO_DATA', false),

    /*
     | Llave secreta para seudonimizar personas en matrículas, docentes, graduados y personal administrativo
     | (App\Support\Pseudonym). Mínimo 32 caracteres; distinta de APP_KEY; custodiar fuera del repositorio.
     */
    'pseudonym_key' => env('IDEAD_PSEUDONYM_KEY'),
];

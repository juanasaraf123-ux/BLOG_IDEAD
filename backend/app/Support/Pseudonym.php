<?php

namespace App\Support;

use RuntimeException;

/**
 * Seudonimización de personas en los registros institucionales (matrículas, docentes, graduados, personal).
 *
 * clave = HMAC-SHA256(documento normalizado, IDEAD_PSEUDONYM_KEY)
 * - Permite contar personas únicas y cruzar períodos (continuidad, deserción, graduación por cohorte)
 *   sin guardar nombres ni números de documento.
 * - Sin la llave secreta no es posible obtener el documento a partir de la clave.
 * - La llave debe custodiarse fuera del repositorio; si se pierde, las claves nuevas no coincidirán con las anteriores.
 */
class Pseudonym
{
    public static function key(string $documentNumber): string
    {
        $secret = (string) config('idead.pseudonym_key');
        if (strlen($secret) < 32) {
            throw new RuntimeException('Configure IDEAD_PSEUDONYM_KEY (mínimo 32 caracteres) antes de cargar registros de personas.');
        }
        $normalized = preg_replace('/\D+/', '', $documentNumber);
        if ($normalized === '') {
            throw new RuntimeException('Documento vacío o inválido.');
        }

        return hash_hmac('sha256', $normalized, $secret);
    }
}

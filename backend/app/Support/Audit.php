<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/** Registro de eventos importantes (inicio de sesión, publicaciones, descargas privadas, cambios de permisos...). */
class Audit
{
    public static function log(string $action, ?Model $entity = null, array $meta = [], ?int $userId = null): void
    {
        $request = request();
        AuditLog::create([
            'user_id' => $userId ?? Auth::id(),
            'action' => $action,
            'entity_type' => $entity ? class_basename($entity) : null,
            'entity_id' => $entity?->getKey(),
            'meta' => $meta ?: null,
            'ip' => $request?->ip(),
            'user_agent' => $request ? mb_substr((string) $request->userAgent(), 0, 255) : null,
            'created_at' => now(),
        ]);
    }
}

<?php

namespace App\Models\Concerns;

use App\Models\ChangeHistory;
use Illuminate\Support\Facades\Auth;

/**
 * Registra automáticamente en `change_history` la creación, modificación (con valores anterior/nuevo)
 * y eliminación del modelo, junto con el usuario autenticado que hizo el cambio.
 */
trait TracksChanges
{
    /** Campos que nunca se guardan en el historial (secretos). */
    protected static array $historyHidden = ['password', 'mfa_secret', 'remember_token'];

    public static function bootTracksChanges(): void
    {
        static::created(fn ($m) => $m->writeHistory('created', $m->historySnapshot($m->getAttributes())));
        static::updated(function ($m) {
            $changes = [];
            foreach ($m->getChanges() as $field => $new) {
                if (in_array($field, ['updated_at', 'created_at'], true)) {
                    continue;
                }
                $hidden = in_array($field, static::$historyHidden, true);
                $changes[$field] = [
                    'old' => $hidden ? '***' : $m->getOriginal($field),
                    'new' => $hidden ? '***' : $new,
                ];
            }
            if ($changes) {
                $m->writeHistory('updated', $changes);
            }
        });
        static::deleted(fn ($m) => $m->writeHistory('deleted', null));
    }

    protected function historySnapshot(array $attrs): array
    {
        foreach (static::$historyHidden as $h) {
            unset($attrs[$h]);
        }
        foreach ($attrs as $k => $v) {
            if (is_string($v) && strlen($v) > 2000) {
                $attrs[$k] = mb_substr($v, 0, 2000).'…';
            }
        }

        return $attrs;
    }

    protected function writeHistory(string $event, ?array $changes): void
    {
        ChangeHistory::create([
            'entity_type' => class_basename($this),
            'entity_id' => $this->getKey(),
            'event' => $event,
            'changes' => $changes,
            'user_id' => Auth::id(),
        ]);
    }
}

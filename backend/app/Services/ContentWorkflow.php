<?php

namespace App\Services;

use App\Models\Review;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

/**
 * Flujo editorial para contenidos (noticias, actividades, multimedia, páginas) y fichas (CAT, programas,
 * proyectos, listados): borrador → en_revision → (devuelto | publicado) → despublicado.
 * La fecha `publish_at` futura convierte la publicación en programada.
 */
class ContentWorkflow
{
    public const TRANSITIONS = [
        'enviar' => [['borrador', 'devuelto', 'despublicado'], 'en_revision'],
        'devolver' => [['en_revision'], 'devuelto'],
        'publicar' => [['en_revision', 'borrador', 'devuelto', 'despublicado'], 'publicado'],
        'despublicar' => [['publicado'], 'despublicado'],
    ];

    public function transition(Model $m, string $action, User $user, ?string $comment, string $field = 'status', bool $requireReview = true): void
    {
        [$from, $to] = self::TRANSITIONS[$action] ?? throw ValidationException::withMessages(['action' => 'Acción inválida.']);
        $current = $m->{$field};
        if (! in_array($current, $from, true)) {
            throw ValidationException::withMessages(['action' => "No se puede «{$action}» un contenido en estado «{$current}»."]);
        }
        if ($action === 'publicar' && $requireReview && $current !== 'en_revision') {
            throw ValidationException::withMessages(['action' => 'El contenido debe enviarse a revisión antes de publicarse.']);
        }
        if ($action === 'publicar' && $requireReview && isset($m->author_id) && $m->author_id === $user->id) {
            throw ValidationException::withMessages(['action' => 'Separación de funciones: el autor no puede aprobar su propio contenido.']);
        }
        if ($action === 'devolver' && blank($comment)) {
            throw ValidationException::withMessages(['comment' => 'Indique el motivo de la devolución.']);
        }
        $update = [$field => $to];
        if ($action === 'publicar' && array_key_exists('approved_by', $m->getAttributes())) {
            $update['approved_by'] = $user->id;
        }
        if ($action === 'publicar' && array_key_exists('publish_at', $m->getAttributes()) && $m->publish_at === null) {
            $update['publish_at'] = now();
        }
        $m->update($update);
        Review::create([
            'reviewable_type' => strtolower(class_basename($m)), 'reviewable_id' => $m->getKey(), 'reviewer_id' => $user->id,
            'decision' => $to, 'comment' => $comment, 'created_at' => now(),
        ]);
        if (in_array($action, ['publicar', 'despublicar'], true)) {
            Audit::log('content.'.$action, $m);
        }
    }
}

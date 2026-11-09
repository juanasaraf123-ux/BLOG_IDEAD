<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Caché de respuestas de la API pública. Cada publicación o cambio de contenido incrementa la «versión»,
 * de modo que el portal refleja lo publicado de inmediato sin purgar toda la caché.
 */
class PublicCache
{
    public const TTL = 600;

    public static function version(): int
    {
        return (int) Cache::rememberForever('public.version', fn () => 1);
    }

    public static function bump(): void
    {
        Cache::forever('public.version', self::version() + 1);
    }

    public static function remember(string $key, callable $fn): mixed
    {
        // Se guarda la representación JSON (no objetos Eloquent) para que lo cacheado sea idéntico a lo servido.
        $json = Cache::remember('public.'.self::version().'.'.$key, self::TTL, fn () => json_encode($fn()));

        return json_decode($json, true);
    }
}

<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

/** Parámetros configurables del sistema (tamaños de archivo, umbral de supresión, datos de contacto...). */
class Settings
{
    public const DEFAULTS = [
        'site_name' => ['Instituto de Educación a Distancia – IDEAD', true],
        'university_name' => ['Universidad del Tolima', true],
        'contact_address' => ['Pendiente de suministro institucional', true],
        'contact_phone' => ['Pendiente de suministro institucional', true],
        'contact_email' => ['Pendiente de suministro institucional', true],
        'official_links' => ['[{"label":"Universidad del Tolima","url":"https://www.ut.edu.co"}]', true],
        'social_links' => ['[]', true],
        'hero_title' => ['Educación a distancia que llega a los territorios', true],
        'hero_text' => ['Consulta la oferta académica, los Centros de Atención Tutorial y los indicadores institucionales del IDEAD.', true],
        'logo_file_id' => [null, true],
        'max_upload_mb' => ['20', false],
        'min_cell_size' => ['5', true],
        'mfa_enforced' => ['0', false],
        'news_requires_review' => ['1', false],
    ];

    public static function get(string $key, mixed $default = null): mixed
    {
        $all = self::all();

        return $all[$key] ?? $default ?? (self::DEFAULTS[$key][0] ?? null);
    }

    public static function all(): array
    {
        return Cache::remember('settings.all', 300, function () {
            $values = [];
            foreach (self::DEFAULTS as $k => [$v]) {
                $values[$k] = $v;
            }
            foreach (Setting::all() as $s) {
                $values[$s->key] = $s->value;
            }

            return $values;
        });
    }

    public static function publicValues(): array
    {
        $public = [];
        $flags = Setting::pluck('is_public', 'key')->all();
        foreach (self::all() as $k => $v) {
            $isPublic = $flags[$k] ?? (self::DEFAULTS[$k][1] ?? false);
            if ($isPublic) {
                $public[$k] = $v;
            }
        }

        return $public;
    }

    public static function set(string $key, ?string $value): void
    {
        Setting::updateOrCreate(['key' => $key], ['value' => $value, 'is_public' => self::DEFAULTS[$key][1] ?? false]);
        Cache::forget('settings.all');
        \App\Support\PublicCache::bump();
    }
}

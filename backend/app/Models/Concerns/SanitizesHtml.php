<?php

namespace App\Models\Concerns;

use App\Support\Html;

/**
 * Sanea (contra XSS) los atributos HTML enumerados en $htmlAttributes antes de guardarlos.
 */
trait SanitizesHtml
{
    public static function bootSanitizesHtml(): void
    {
        static::saving(function ($m) {
            foreach ($m->htmlAttributes ?? [] as $attr) {
                if ($m->isDirty($attr) && $m->{$attr} !== null) {
                    $m->{$attr} = Html::clean($m->{$attr});
                }
            }
        });
    }
}

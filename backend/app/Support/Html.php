<?php

namespace App\Support;

use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;

/** Saneamiento de HTML enriquecido (noticias, páginas, historias de CAT). */
class Html
{
    private static ?HtmlSanitizer $sanitizer = null;

    public static function clean(string $html): string
    {
        self::$sanitizer ??= new HtmlSanitizer(
            (new HtmlSanitizerConfig)
                ->allowSafeElements()
                ->allowRelativeLinks()
                ->allowLinkSchemes(['https', 'http', 'mailto'])
                ->allowMediaSchemes(['https'])
                ->forceAttribute('a', 'rel', 'noopener noreferrer')
                ->dropElement('style')
                ->dropElement('script')
                ->dropElement('iframe')
        );

        return self::$sanitizer->sanitize($html);
    }
}

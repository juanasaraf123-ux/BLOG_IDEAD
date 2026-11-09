<?php

namespace Tests\Feature;

use App\Models\News;

class PublicPortalTest extends IdeadTestCase
{
    public function test_public_endpoints_respond(): void
    {
        foreach (['site', 'home', 'modules', 'modules/estudiantes', 'filters', 'transparency', 'cats', 'programs', 'news', 'events', 'media', 'projects', 'documents', 'agreements', 'search?q=matricula', 'pages/privacidad'] as $uri) {
            $this->getJson("/api/public/v1/$uri")->assertOk();
        }
    }

    public function test_home_highlights_are_pending_without_published_data(): void
    {
        $values = collect($this->getJson('/api/public/v1/home')->json('highlights'))->pluck('value')->unique()->all();
        $this->assertSame([null], $values, 'Sin datos publicados no se muestran cifras');
    }

    public function test_drafts_and_demo_content_are_hidden(): void
    {
        News::create(['slug' => 'borrador', 'title' => 'Borrador secreto', 'status' => 'borrador']);
        News::create(['slug' => 'demo', 'title' => 'Noticia demo', 'status' => 'publicado', 'publish_at' => now()->subDay(), 'is_demo' => true]);
        News::create(['slug' => 'futura', 'title' => 'Programada', 'status' => 'publicado', 'publish_at' => now()->addDay()]);
        News::create(['slug' => 'ok', 'title' => 'Publicada', 'status' => 'publicado', 'publish_at' => now()->subHour()]);
        $titles = collect($this->getJson('/api/public/v1/news')->json('data'))->pluck('title')->all();
        $this->assertSame(['Publicada'], $titles);
        $this->getJson('/api/public/v1/news/borrador')->assertNotFound();
        $this->getJson('/api/public/v1/search?q=secreto')->assertJsonCount(0, 'results');
    }

    public function test_security_headers(): void
    {
        $this->getJson('/api/public/v1/site')->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('X-Frame-Options', 'DENY');
    }
}

<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentCategory;
use App\Models\DocumentVersion;
use App\Models\StoredFile;
use Illuminate\Http\UploadedFile;
use PragmaRX\Google2FA\Google2FA;

class SecurityTest extends IdeadTestCase
{
    public function test_private_routes_require_authentication(): void
    {
        foreach (['users', 'documents', 'submissions', 'audit', 'settings', 'petty-cash-budgets'] as $uri) {
            $this->getJson("/api/admin/v1/$uri")->assertUnauthorized();
        }
    }

    public function test_login_without_browser_session_is_rejected(): void
    {
        $u = $this->userWithRole('director');
        $this->postJson('/api/admin/v1/auth/login', ['email' => $u->email, 'password' => 'Clave-Segura-2026!'])->assertStatus(400);
    }

    public function test_login_with_wrong_password_fails_and_is_rate_limited(): void
    {
        $u = $this->userWithRole('director');
        $this->withHeaders(['Origin' => 'http://localhost:5173', 'Referer' => 'http://localhost:5173/']);
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/admin/v1/auth/login', ['email' => $u->email, 'password' => 'incorrecta'])->assertStatus(422);
        }
        $this->postJson('/api/admin/v1/auth/login', ['email' => $u->email, 'password' => 'Clave-Segura-2026!'])
            ->assertStatus(422)->assertJsonPath('errors.email.0', fn ($m) => str_contains($m, 'Demasiados intentos'));
    }

    public function test_passwords_are_hashed(): void
    {
        $u = $this->userWithRole('director');
        $this->assertNotSame('Clave-Segura-2026!', $u->getRawOriginal('password'));
        $this->assertStringStartsWith('$2y$', $u->getRawOriginal('password'));
    }

    public function test_mfa_challenge_is_required_when_enabled(): void
    {
        $u = $this->userWithRole('director');
        $g = new Google2FA;
        $secret = $g->generateSecretKey(32);
        $u->forceFill(['mfa_secret' => $secret, 'mfa_enabled' => true])->save();
        $this->withHeaders(['Origin' => 'http://localhost:5173', 'Referer' => 'http://localhost:5173/']);

        $this->postJson('/api/admin/v1/auth/login', ['email' => $u->email, 'password' => 'Clave-Segura-2026!'])->assertOk()->assertJson(['mfa_required' => true]);
        $this->getJson('/api/admin/v1/auth/me')->assertUnauthorized();
        $this->postJson('/api/admin/v1/auth/mfa', ['code' => '000000'])->assertStatus(422);
        $this->postJson('/api/admin/v1/auth/mfa', ['code' => $g->getCurrentOtp($secret)])->assertOk()->assertJsonPath('user.email', $u->email);
    }

    public function test_technical_admin_cannot_see_financial_or_restricted_documents(): void
    {
        $this->makeDocument('financiero');
        $this->makeDocument('restringido');
        $this->makeDocument('publico');
        $admin = $this->userWithRole('admin_tecnico');
        $this->actingAs($admin)->getJson('/api/admin/v1/documents')->assertForbidden();

        $caja = $this->userWithRole('caja_menor');
        $levels = collect($this->actingAs($caja)->getJson('/api/admin/v1/documents')->assertOk()->json('data'))->pluck('confidentiality')->all();
        $this->assertContains('financiero', $levels);
        $this->assertNotContains('restringido', $levels);
    }

    public function test_user_cannot_change_own_roles(): void
    {
        $admin = $this->userWithRole('admin_tecnico');
        $this->actingAs($admin)->putJson("/api/admin/v1/users/{$admin->id}", [
            'name' => $admin->name, 'email' => $admin->email, 'role_ids' => [1, 2, 3, 4, 5, 6],
        ])->assertForbidden();
    }

    public function test_executable_uploads_are_rejected(): void
    {
        $com = $this->userWithRole('comunicaciones');
        $fake = UploadedFile::fake()->createWithContent('foto.php.jpg', '<?php system($_GET["c"]); ?>');
        $this->actingAs($com)->postJson('/api/admin/v1/uploads/image', ['file' => $fake])->assertStatus(422);
        $fake2 = UploadedFile::fake()->createWithContent('imagen.jpg', '<?php echo 1; ?>');
        $this->actingAs($com)->postJson('/api/admin/v1/uploads/image', ['file' => $fake2])->assertStatus(422);
        $ok = UploadedFile::fake()->image('real.png', 40, 40);
        $this->actingAs($com)->postJson('/api/admin/v1/uploads/image', ['file' => $ok])->assertCreated();
    }

    public function test_html_is_sanitized(): void
    {
        $com = $this->userWithRole('comunicaciones');
        $r = $this->actingAs($com)->postJson('/api/admin/v1/news', [
            'title' => 'Prueba', 'body' => '<p onclick="x()">Hola<script>alert(1)</script><a href="javascript:alert(1)">l</a></p>',
        ])->assertCreated();
        $this->assertStringNotContainsString('script', $r->json('body'));
        $this->assertStringNotContainsString('onclick', $r->json('body'));
        $this->assertStringNotContainsString('javascript:', $r->json('body'));
    }

    public function test_private_documents_are_not_publicly_downloadable(): void
    {
        $doc = $this->makeDocument('financiero');
        $this->get("/api/public/v1/documents/{$doc->id}/download")->assertNotFound();
        $pub = $this->makeDocument('publico');
        $this->get("/api/public/v1/documents/{$pub->id}/download")->assertOk();
    }

    private function makeDocument(string $conf): Document
    {
        \Illuminate\Support\Facades\Storage::disk('local')->put("t/$conf.pdf", '%PDF-1.4 test');
        $f = StoredFile::create(['disk' => 'local', 'path' => "t/$conf.pdf", 'original_name' => "$conf.pdf", 'mime' => 'application/pdf', 'size_bytes' => 13, 'sha256' => str_repeat('a', 64)]);
        $d = Document::create(['title' => "Doc $conf", 'category_id' => DocumentCategory::first()->id, 'confidentiality' => $conf, 'status' => 'vigente']);
        DocumentVersion::create(['document_id' => $d->id, 'version_no' => 1, 'file_id' => $f->id]);

        return $d;
    }
}

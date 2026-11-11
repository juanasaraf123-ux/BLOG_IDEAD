import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { admin, errorText } from '../../shared/api';
import { Icon } from '../../shared/icons';
import { useAuth, type Me } from '../auth';
import { Button, inputCls, Notice } from '../components/Form';

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="h-1.5 bg-ut-red" aria-hidden />
      <div className="grid flex-1 place-items-center p-4">
        <main className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <img src="/img/logo-ut-temporal.png" alt="Universidad del Tolima" className="h-12 w-auto" />
            <span className="border-l border-gray-300 pl-3 text-[0.7rem] leading-tight font-medium text-ink uppercase">Instituto de<br />Educación<br />a Distancia</span>
          </div>
          <p className="text-xs font-bold tracking-wider text-muted uppercase">Panel de gestión</p>
          <h1 className="text-2xl font-extrabold text-ut-red">{title}</h1>
          <p className="mb-6 text-sm text-muted">Acceso exclusivo para funcionarios autorizados del IDEAD.</p>
          {children}
        </main>
      </div>
      <footer className="bg-green-dark px-4 py-3 text-center text-xs text-white/80">Universidad del Tolima · Instituto de Educación a Distancia</footer>
    </div>
  );
}

export function Login() {
  const { setMe } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'login' | 'mfa'>('login');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      if (step === 'login') {
        const r = await admin.post<Me & { mfa_required?: boolean }>('auth/login', { email, password });
        if (r.mfa_required) { setStep('mfa'); return; }
        setMe(r); nav('/');
      } else {
        setMe(await admin.post<Me>('auth/mfa', { code })); nav('/');
      }
    } catch (x) { setErr(errorText(x)); } finally { setBusy(false); }
  };
  return (
    <Frame title={step === 'login' ? 'Iniciar sesión' : 'Verificación en dos pasos'}>
      <form onSubmit={submit} className="space-y-4">
        {err && <Notice kind="error">{err}</Notice>}
        {step === 'login' ? (
          <>
            <label className="block text-sm font-semibold">Correo institucional<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></label>
            <label className="block text-sm font-semibold">Contraseña<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} /></label>
          </>
        ) : (
          <label className="block text-sm font-semibold">Código de 6 dígitos de su aplicación autenticadora
            <input inputMode="numeric" pattern="\d{6}" maxLength={6} required autoFocus autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className={`${inputCls} text-center text-2xl tracking-[0.5em]`} />
          </label>
        )}
        <Button type="submit" disabled={busy} className="w-full justify-center py-2.5">{busy ? 'Verificando…' : step === 'login' ? 'Ingresar' : 'Verificar'}</Button>
        {step === 'login' && <Link to="/recuperar" className="block text-center text-sm text-green-dark hover:underline">¿Olvidó su contraseña?</Link>}
        <a href="/" className="block text-center text-sm text-muted hover:underline">← Volver al portal público</a>
      </form>
    </Frame>
  );
}

export function Forgot() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ k: 'ok' | 'error'; t: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try { const r = await admin.post<{ message: string }>('auth/forgot-password', { email }); setMsg({ k: 'ok', t: r.message }); } catch (x) { setMsg({ k: 'error', t: errorText(x) }); }
  };
  return (
    <Frame title="Recuperar contraseña">
      <form onSubmit={submit} className="space-y-4">
        {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
        <label className="block text-sm font-semibold">Correo institucional<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></label>
        <Button type="submit" className="w-full justify-center">Enviar instrucciones</Button>
        <Link to="/login" className="block text-center text-sm text-green-dark hover:underline">Volver</Link>
      </form>
    </Frame>
  );
}

export const PASSWORD_HELP = 'Mínimo 12 caracteres, con mayúsculas, minúsculas, números y símbolos.';

export function Reset() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ k: 'ok' | 'error'; t: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const r = await admin.post<{ message: string }>('auth/reset-password', { token: params.get('token'), email: params.get('email'), password, password_confirmation: confirm });
      setMsg({ k: 'ok', t: r.message });
    } catch (x) { setMsg({ k: 'error', t: errorText(x) }); }
  };
  return (
    <Frame title="Nueva contraseña">
      <form onSubmit={submit} className="space-y-4">
        {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
        <label className="block text-sm font-semibold">Nueva contraseña<input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} /></label>
        <label className="block text-sm font-semibold">Confirmar contraseña<input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} /></label>
        <p className="text-xs text-muted">{PASSWORD_HELP}</p>
        <Button type="submit" className="w-full justify-center">Guardar contraseña</Button>
        <Link to="/login" className="block text-center text-sm text-green-dark hover:underline">Ir al inicio de sesión</Link>
      </form>
    </Frame>
  );
}

/** Mi cuenta: segundo factor (TOTP) y cambio de contraseña. */
export function Account() {
  const { me, setMe } = useAuth();
  const [setup, setSetup] = useState<{ secret: string; otpauth_uri: string } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [disablePw, setDisablePw] = useState('');
  const [msg, setMsg] = useState<{ k: 'ok' | 'error'; t: string } | null>(null);
  useEffect(() => { if (setup) QRCode.toDataURL(setup.otpauth_uri, { margin: 1, width: 220 }).then(setQr); }, [setup]);
  const run = async (fn: () => Promise<void>) => { setMsg(null); try { await fn(); } catch (x) { setMsg({ k: 'error', t: errorText(x) }); } };
  if (!me) return null;
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-extrabold text-ut-red">Mi cuenta</h1>
      {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
      {me.must_setup_mfa && <Notice kind="info">La política institucional exige configurar el segundo factor antes de usar el panel.</Notice>}
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="font-bold">Datos</h2>
        <p className="text-sm">{me.user.name} · {me.user.email}</p>
        <p className="text-sm text-muted">Roles: {me.user.roles.map((r) => r.name).join(', ') || 'ninguno'} · Dependencias: {me.user.dependencies.map((d) => d.code).join(', ') || 'ninguna'}</p>
      </section>
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="flex items-center gap-2 font-bold"><Icon name="shield" /> Verificación en dos pasos (TOTP)</h2>
        {me.user.mfa_enabled ? (
          <div className="mt-2 space-y-3">
            <Notice kind="ok">Activa. Se solicitará un código en cada inicio de sesión.</Notice>
            {!me.mfa_enforced && (
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-sm font-semibold">Contraseña para desactivar<input type="password" value={disablePw} onChange={(e) => setDisablePw(e.target.value)} className={inputCls} /></label>
                <Button variant="danger" onClick={() => run(async () => { setMe(await admin.post<Me>('auth/mfa/disable', { password: disablePw })); setMsg({ k: 'ok', t: 'Segundo factor desactivado.' }); })}>Desactivar</Button>
              </div>
            )}
          </div>
        ) : !setup ? (
          <div className="mt-2"><p className="mb-3 text-sm text-muted">Use una aplicación autenticadora (Google Authenticator, Microsoft Authenticator, FreeOTP…).</p><Button onClick={() => run(async () => setSetup(await admin.post('auth/mfa/setup')))}>Configurar</Button></div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-6">
            {qr && <img src={qr} alt="Código QR para la aplicación autenticadora" className="h-[220px] w-[220px] rounded border border-line" />}
            <div className="space-y-3">
              <p className="text-sm">Escanee el código o ingrese la clave manualmente:</p>
              <code className="block rounded bg-surface p-2 text-sm break-all">{setup.secret}</code>
              <label className="block text-sm font-semibold">Código generado<input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className={inputCls} /></label>
              <Button onClick={() => run(async () => { setMe(await admin.post<Me>('auth/mfa/confirm', { code })); setSetup(null); setMsg({ k: 'ok', t: 'Segundo factor activado.' }); })}>Activar</Button>
            </div>
          </div>
        )}
      </section>
      <section className="rounded-xl border border-line bg-white p-5">
        <h2 className="font-bold">Cambiar contraseña</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-sm font-semibold">Actual<input type="password" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} className={inputCls} /></label>
          <label className="text-sm font-semibold">Nueva<input type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} className={inputCls} /></label>
          <label className="text-sm font-semibold">Confirmar<input type="password" autoComplete="new-password" value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} className={inputCls} /></label>
        </div>
        <p className="mt-1 text-xs text-muted">{PASSWORD_HELP}</p>
        <Button className="mt-3" onClick={() => run(async () => { const r = await admin.post<{ message: string }>('auth/password', pw); setPw({ current_password: '', password: '', password_confirmation: '' }); setMsg({ k: 'ok', t: r.message }); })}>Actualizar contraseña</Button>
      </section>
    </div>
  );
}

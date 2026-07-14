import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Turnstile } from '@marsidev/react-turnstile';
import { useToast } from '../components/ui/Toast';
import { Logo } from '../components/ui/Logo';
import { Spinner } from '../components/ui/Spinner';
import {
  Smile,
  ShieldCheck,
  CalendarClock,
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';

type Mode = 'welcome' | 'login' | 'register' | 'reset';

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('welcome');
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-mint-100 via-cream-50 to-lilac-100 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-mint-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-lilac-200/40 blur-3xl" />
        <div className="relative">
          <Logo size="lg" />
        </div>
        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-bold leading-tight text-ink-800">
            Tu sonrisa,<br />cuidada con cariño.
          </h1>
          <p className="mt-4 text-lg text-ink-600">
            Reserva tu cita en línea en minutos, gestiona tus tratamientos y mantén tu salud bucal al día.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: CalendarClock, title: 'Agenda 24/7', desc: 'Reserva cuando quieras, sin llamadas.' },
              { icon: Sparkles, title: 'Tratamientos premium', desc: 'Ortodoncia, blanqueamiento, implantes y más.' },
              { icon: ShieldCheck, title: 'Historial seguro', desc: 'Tus datos médicos siempre protegidos.' },
            ].map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/80 text-mint-600 shadow-soft">
                  <f.icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-ink-800">{f.title}</p>
                  <p className="text-sm text-ink-500">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-ink-400">© {new Date().getFullYear()} Clínica Sonrisa</p>
      </div>

      {/* Right: form panel */}
      <div className="flex min-h-screen items-center justify-center bg-cream-50 p-6 lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>
          {mode === 'welcome' && <WelcomeCard onPick={setMode} />}
          {mode === 'login' && <LoginForm onBack={() => setMode('welcome')} onSwitch={() => setMode('register')} onForgot={() => setMode('reset')} />}
          {mode === 'register' && <RegisterForm onBack={() => setMode('welcome')} onSwitch={() => setMode('login')} />}          {mode === 'reset' && <ResetForm onBack={() => setMode('login')} />}
        </div>
      </div>
    </div>
  );
}

function WelcomeCard({ onPick }: { onPick: (m: Mode) => void }) {
  return (
    <div className="card animate-scale-in">
      <h2 className="font-display text-3xl font-bold text-ink-800">Bienvenido</h2>
      <p className="mt-2 text-ink-500">¿Cómo deseas continuar?</p>

      <div className="mt-8 space-y-3">
        <button
          onClick={() => onPick('login')}
          className="group flex w-full items-center gap-4 rounded-2xl bg-mint-50 p-4 text-left ring-1 ring-mint-200 transition-all hover:bg-mint-100 hover:ring-mint-300"
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-mint-500 text-white shadow-soft">
            <User size={22} />
          </div>
          <div className="flex-1">
            <p className="font-display text-lg font-bold text-ink-800">Ya tengo cuenta</p>
            <p className="text-sm text-ink-500">Inicia sesión para gestionar tus citas</p>
          </div>
          <ArrowRight className="text-mint-500 transition-transform group-hover:translate-x-1" size={20} />
        </button>

        <button
          onClick={() => onPick('register')}
          className="group flex w-full items-center gap-4 rounded-2xl bg-lilac-50 p-4 text-left ring-1 ring-lilac-200 transition-all hover:bg-lilac-100 hover:ring-lilac-300"
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-lilac-500 text-white shadow-soft">
            <Stethoscope size={22} />
          </div>
          <div className="flex-1">
            <p className="font-display text-lg font-bold text-ink-800">Soy nuevo aquí</p>
            <p className="text-sm text-ink-500">Crea tu cuenta de paciente</p>
          </div>
          <ArrowRight className="text-lilac-500 transition-transform group-hover:translate-x-1" size={20} />
        </button>
      </div>

      <div className="mt-6 rounded-2xl bg-cream-100 p-4 text-sm text-ink-500">
        <p className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-mint-500" />
          ¿Eres administrador? Inicia sesión con tu correo corporativo.
        </p>
      </div>
    </div>
  );
}

function LoginForm({ onBack, onSwitch, onForgot }: { onBack: () => void; onSwitch: () => void; onForgot: () => void }) {
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
    setLoading(false);
    if (error) {
      push('error', error.message);
      return;
    }
    push('success', 'Sesión iniciada');
  }

  return (
    <div className="card animate-scale-in">
      <button onClick={onBack} className="mb-4 text-sm font-semibold text-ink-500 hover:text-ink-700">
        ← Volver
      </button>
      <h2 className="font-display text-3xl font-bold text-ink-800">Iniciar sesión</h2>
      <p className="mt-2 text-ink-500">Accede a tu cuenta de Sonrisa</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label">Correo electrónico</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value.slice(0, 100))} maxLength={100}
              placeholder="tu@correo.com"
              className="input pl-10"
            />
          </div>
        </div>
        <div>
          <label className="label">Contraseña</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input pl-10"
            />
          </div>
        </div>
        <Turnstile siteKey="0x4AAAAAAD1Qfl_QVzDqPJ4X" onSuccess={setCaptchaToken} />
        <button type="submit" disabled={loading || !captchaToken} className="btn-primary w-full">
          {loading ? <Spinner /> : <>Entrar <ArrowRight size={18} /></>}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        <button onClick={onForgot} className="font-semibold text-mint-600 hover:text-mint-700">¿Olvidaste tu contraseña?</button>
      </p>

      <p className="mt-6 text-center text-sm text-ink-500">
        ¿No tienes cuenta?{' '}
        <button onClick={onSwitch} className="font-semibold text-mint-600 hover:text-mint-700">
          Regístrate
        </button>
      </p>
    </div>
  );
}

function RegisterForm({ onBack, onSwitch }: { onBack: () => void; onSwitch: () => void }) {
  const { push } = useToast();
  const [captchaToken, setCaptchaToken] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre, rol: 'paciente' }, captchaToken },
    });
    setLoading(false);
    if (error) {
      push('error', error.message);
      return;
    }
    if (data.user) {
      push('success', 'Cuenta creada. ¡Bienvenido a Sonrisa!');
    }
  }

  return (
    <div className="card animate-scale-in">
      <button onClick={onBack} className="mb-4 text-sm font-semibold text-ink-500 hover:text-ink-700">
        ← Volver
      </button>
      <h2 className="font-display text-3xl font-bold text-ink-800">Crear cuenta</h2>
      <p className="mt-2 text-ink-500">Regístrate como paciente</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label">Nombre completo</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value.replace(/[^a-zA-ZÁÉÍÓÚáéíóúÑñ\s]/g, "").slice(0, 50))} maxLength={50}
              placeholder="Ana López"
              className="input pl-10"
            />
          </div>
        </div>
        <div>
          <label className="label">Correo electrónico</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value.slice(0, 100))} maxLength={100}
              placeholder="tu@correo.com"
              className="input pl-10"
            />
          </div>
        </div>
        <div>
          <label className="label">Contraseña</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="password"
              required
              minLength={8}
              maxLength={64}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="input pl-10"
            />
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-2xl bg-mint-50 p-3 text-xs text-mint-700">
          <Smile size={16} className="mt-0.5 shrink-0" />
          <p>Tu rol será <strong>paciente</strong> automáticamente. Podrás completar tus datos médicos después.</p>
        </div>
        <Turnstile siteKey="0x4AAAAAAD1Qfl_QVzDqPJ4X" onSuccess={setCaptchaToken} />
        <button type="submit" disabled={loading || !captchaToken} className="btn-primary w-full">
          {loading ? <Spinner /> : <>Crear cuenta <ArrowRight size={18} /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        ¿Ya tienes cuenta?{' '}
        <button onClick={onSwitch} className="font-semibold text-mint-600 hover:text-mint-700">
          Inicia sesión
        </button>
      </p>
    </div>

  );
}


function ResetForm({ onBack }: { onBack: () => void }) {
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) {
      push('error', error.message);
      return;
    }
    setSent(true);
    push('success', 'Correo enviado');
  }

  if (sent) {
    return (
      <div className="card animate-scale-in text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-mint-100 text-mint-600">
          <Mail size={28} />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink-800">Revisa tu correo</h2>
        <p className="mt-2 text-ink-500">
          Te enviamos un enlace a <strong>{email}</strong> para restablecer tu contraseña.
        </p>
        <button onClick={onBack} className="btn-secondary mt-6 w-full">Volver a iniciar sesión</button>
      </div>
    );
  }

  return (
    <div className="card animate-scale-in">
      <button onClick={onBack} className="mb-4 text-sm font-semibold text-ink-500 hover:text-ink-700">
        ← Volver
      </button>
      <h2 className="font-display text-3xl font-bold text-ink-800">Recuperar contraseña</h2>
      <p className="mt-2 text-ink-500">Te enviaremos un enlace para crear una nueva.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label">Correo electrónico</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value.slice(0, 100))} maxLength={100}
              placeholder="tu@correo.com"
              className="input pl-10"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner /> : <>Enviar enlace <ArrowRight size={18} /></>}
        </button>
      </form>
    </div>
  );
}

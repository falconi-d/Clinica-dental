import { useEffect, useState, type FormEvent } from 'react';
import { supabase, type Tratamiento } from '../../lib/supabase';
import { validarCedulaEcuador, validarTelefonoEcuador } from '../../lib/validaciones';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { ArrowLeft, CheckCircle2, PartyPopper, Calendar, Clock, DollarSign, User, FileText } from 'lucide-react';

interface Props {
  tratamiento: Tratamiento;
  fecha: string;
  hora: string;
  onBack: () => void;
  onDone: () => void;
}

export function ConfirmPage({ tratamiento, fecha, hora, onBack, onDone }: Props) {
  const { profile, refreshProfile } = useAuth();
  const { push } = useToast();
  const [cedula, setCedula] = useState(profile?.cedula ?? '');
  const [direccion, setDireccion] = useState(profile?.direccion ?? '');
  const [telefono, setTelefono] = useState(profile?.telefono ?? '');
  const [alergias, setAlergias] = useState(profile?.alergias ?? '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setCedula(profile.cedula ?? '');
      setDireccion(profile.direccion ?? '');
      setTelefono(profile.telefono ?? '');
      setAlergias(profile.alergias ?? '');
    }
  }, [profile]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;

    if (!validarCedulaEcuador(cedula)) {
      push('error', 'La cédula ingresada no es válida.');
      return;
    }
    if (!validarTelefonoEcuador(telefono)) {
      push('error', 'El teléfono ingresado no es válido (celular: 09XXXXXXXX, fijo: 0XXXXXXXX).');
      return;
    }

    setLoading(true);

    // 1. Update profile with billing/medical data
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ cedula, direccion, telefono, alergias })
      .eq('id', profile.id);
    if (profileErr) {
      push('error', 'No se pudieron guardar tus datos: ' + profileErr.message);
      setLoading(false);
      return;
    }

    // 2. Insert cita
    const { error: citaErr } = await supabase.from('citas').insert({
      paciente_id: profile.id,
      tratamiento_id: tratamiento.id,
      fecha,
      hora,
      estado: 'pendiente',
    });

    setLoading(false);
    if (citaErr) {
      push('error', 'No se pudo agendar la cita: ' + citaErr.message);
      return;
    }

    await refreshProfile();
    setSuccess(true);
    push('success', '¡Cita confirmada con éxito!');
  }

  if (success) {
    return (
      <div className="grid place-items-center py-12">
        <div className="card max-w-md text-center animate-pop">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-mint-100 text-mint-600">
            <PartyPopper size={40} />
          </div>
          <h2 className="font-display text-3xl font-bold text-ink-800">¡Cita confirmada!</h2>
          <p className="mt-2 text-ink-500">Te esperamos en la clínica Sonrisa.</p>
          <div className="mt-6 space-y-2 rounded-2xl bg-cream-50 p-4 text-left text-sm">
            <p className="flex items-center gap-2 text-ink-700"><User size={16} className="text-mint-500" /> {profile?.nombre}</p>
            <p className="flex items-center gap-2 text-ink-700"><FileText size={16} className="text-mint-500" /> {tratamiento.nombre}</p>
            <p className="flex items-center gap-2 text-ink-700"><Calendar size={16} className="text-mint-500" /> {fecha}</p>
            <p className="flex items-center gap-2 text-ink-700"><Clock size={16} className="text-mint-500" /> {hora}</p>
            <p className="flex items-center gap-2 text-ink-700"><DollarSign size={16} className="text-mint-500" /> ${Number(tratamiento.precio).toFixed(2)}</p>
          </div>
          <button onClick={onDone} className="btn-primary mt-6 w-full">
            Ver mis citas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-700">
        <ArrowLeft size={18} /> Cambiar fecha u hora
      </button>

      <h1 className="font-display text-3xl font-bold text-ink-800">Confirma tu cita</h1>
      <p className="mt-1 text-ink-500">Completa tus datos de facturación e historial médico.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="chip bg-mint-50 text-mint-700"><FileText size={14} /> {tratamiento.nombre}</span>
        <span className="chip bg-lilac-50 text-lilac-700"><Calendar size={14} /> {fecha}</span>
        <span className="chip bg-cream-100 text-ink-700"><Clock size={14} /> {hora}</span>
        <span className="chip bg-cream-100 text-ink-700"><DollarSign size={14} /> ${Number(tratamiento.precio).toFixed(2)}</span>
      </div>

      <form onSubmit={submit} className="card mt-6 space-y-5">
        <div>
          <h3 className="font-display text-lg font-bold text-ink-800">Datos de facturación</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Cédula</label>
              <input required value={cedula} onChange={(e) => setCedula(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="1234567890" maxLength={10} inputMode="numeric" className="input" />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input required value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="0999999999" maxLength={10} inputMode="numeric" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Dirección</label>
              <input required value={direccion} onChange={(e) => setDireccion(e.target.value.slice(0, 60))} placeholder="Calle, numero, ciudad" maxLength={60} className="input" />
            </div>
          </div>
        </div>

        <div className="border-t border-ink-100 pt-5">
          <h3 className="font-display text-lg font-bold text-ink-800">Historial médico</h3>
          <div className="mt-4">
            <label className="label">Alergias o condiciones relevantes</label>
            <textarea
              value={alergias}
              onChange={(e) => setAlergias(e.target.value.slice(0, 200))} maxLength={200}
              placeholder="Ej: alergia a la penicilina, diabetes, embarazo…"
              rows={3}
              className="input resize-none"
            />
            <p className="mt-1 text-xs text-ink-400">Esta información es confidencial y solo la verá el equipo de la clínica.</p>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full text-base">
          {loading ? <Spinner /> : <><CheckCircle2 size={20} /> Confirmar cita</>}
        </button>
      </form>
    </div>
  );
}

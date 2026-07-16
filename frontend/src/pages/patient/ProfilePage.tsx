import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { User, Mail, Phone, MapPin, FileText, AlertTriangle, Save } from 'lucide-react';
import { validarCedulaEcuador, validarTelefonoEcuador } from '../../lib/validaciones';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { push } = useToast();
  const [nombre, setNombre] = useState(profile?.nombre ?? '');
  const [telefono, setTelefono] = useState(profile?.telefono ?? '');
  const [cedula, setCedula] = useState(profile?.cedula ?? '');
  const [direccion, setDireccion] = useState(profile?.direccion ?? '');
  const [alergias, setAlergias] = useState(profile?.alergias ?? '');
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<{ nombre?: string; telefono?: string; cedula?: string }>({});

  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre);
      setTelefono(profile.telefono ?? '');
      setCedula(profile.cedula ?? '');
      setDireccion(profile.direccion ?? '');
      setAlergias(profile.alergias ?? '');
    }
  }, [profile]);

  function handleNombreChange(e: ChangeEvent<HTMLInputElement>) {
    setNombre(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').slice(0, 50));
  }

  function handleTelefonoChange(e: ChangeEvent<HTMLInputElement>) {
    setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10));
  }

  function handleCedulaChange(e: ChangeEvent<HTMLInputElement>) {
    setCedula(e.target.value.replace(/\D/g, '').slice(0, 10));
  }

  function handleDireccionChange(e: ChangeEvent<HTMLInputElement>) {
    setDireccion(e.target.value.slice(0, 60));
  }

  function handleAlergiasChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setAlergias(e.target.value.slice(0, 200));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;

    const nuevosErrores: { nombre?: string; telefono?: string; cedula?: string } = {};
    if (!nombre.trim()) {
      nuevosErrores.nombre = 'El nombre no puede estar vacío.';
    }
    if (telefono && !validarTelefonoEcuador(telefono)) {
      nuevosErrores.telefono = 'Teléfono no válido (ej: 0912345678)';
    }
    if (cedula && !validarCedulaEcuador(cedula)) {
      nuevosErrores.cedula = 'Cédula no válida';
    }
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ nombre, telefono, cedula, direccion, alergias })
      .eq('id', profile.id);
    setLoading(false);
    if (error) {
      push('error', 'No se pudo guardar: ' + error.message);
      return;
    }
    await refreshProfile();
    push('success', 'Perfil actualizado');
  }

  if (!profile) return null;

  return (
    <div className="animate-fade-in max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-ink-800">Mi Perfil</h1>
      <p className="mt-1 text-ink-500">Actualiza tus datos personales y médicos.</p>

      <div className="card mt-6">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-mint-100 to-lilac-100 text-2xl font-bold text-mint-700">
            {profile.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-display text-xl font-bold text-ink-800">{profile.nombre}</p>
            <p className="text-sm text-ink-500">Paciente · {profile.correo}</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="card mt-4 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nombre completo</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input required value={nombre} onChange={handleNombreChange} maxLength={50} className="input pl-10" />
            </div>
            {errores.nombre && <p className="mt-1 text-xs text-rose-600">{errores.nombre}</p>}
          </div>
          <div>
            <label className="label">Correo</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={profile.correo} disabled className="input pl-10 opacity-60" />
            </div>
          </div>
          <div>
            <label className="label">Teléfono</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={telefono} onChange={handleTelefonoChange} maxLength={10} inputMode="numeric" placeholder="0912345678" className="input pl-10" />
            </div>
            {errores.telefono && <p className="mt-1 text-xs text-rose-600">{errores.telefono}</p>}
          </div>
          <div>
            <label className="label">Cédula</label>
            <div className="relative">
              <FileText size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={cedula} onChange={handleCedulaChange} maxLength={10} inputMode="numeric" placeholder="1234567890" className="input pl-10" />
            </div>
            {errores.cedula && <p className="mt-1 text-xs text-rose-600">{errores.cedula}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Dirección</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input value={direccion} onChange={handleDireccionChange} maxLength={60} placeholder="Calle, número, ciudad" className="input pl-10" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Alergias / condiciones</label>
            <div className="relative">
              <AlertTriangle size={18} className="absolute left-3 top-3 text-ink-400" />
              <textarea value={alergias} onChange={handleAlergiasChange} maxLength={200} rows={3} placeholder="Penicilina, diabetes, embarazo…" className="input resize-none pl-10" />
            </div>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner /> : <><Save size={18} /> Guardar cambios</>}
        </button>
      </form>
    </div>
  );
}

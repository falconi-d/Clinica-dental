import { useCallback, useEffect, useState } from 'react';
import { supabase, type Profile, type Cita, type Tratamiento } from '../../lib/supabase';
import { Spinner } from '../../components/ui/Spinner';
import { Search, Users, Phone, MapPin, AlertTriangle, Calendar, X, ChevronRight } from 'lucide-react';

type CitaConTrat = Cita & { tratamiento: Tratamiento | null };

export function PacientesPage() {
  const [pacientes, setPacientes] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('rol', 'paciente')
      .order('creado_en', { ascending: false });
    if (error) console.error(error);
    setPacientes((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = pacientes.filter(
    (p) =>
      p.nombre.toLowerCase().includes(query.toLowerCase()) ||
      p.correo.toLowerCase().includes(query.toLowerCase()) ||
      (p.cedula ?? '').includes(query),
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink-800">Pacientes</h1>
        <p className="mt-1 text-ink-500">{pacientes.length} pacientes registrados.</p>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, correo o cédula…" className="input pl-10" />
      </div>

      {loading ? (
        <div className="grid place-items-center py-20"><Spinner size={28} className="text-mint-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center text-ink-400">
          <Users size={36} className="text-ink-300" />
          <p>No se encontraron pacientes.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-cream-50 text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Paciente</th>
                <th className="hidden px-5 py-3 font-semibold sm:table-cell">Teléfono</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">Cédula</th>
                <th className="px-5 py-3 font-semibold">Registro</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-ink-50 transition-colors hover:bg-cream-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-mint-100 to-lilac-100 text-sm font-bold text-mint-700">
                        {p.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-ink-800">{p.nombre}</p>
                        <p className="text-xs text-ink-400">{p.correo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-5 py-3 text-ink-600 sm:table-cell">{p.telefono ?? '—'}</td>
                  <td className="hidden px-5 py-3 text-ink-600 md:table-cell">{p.cedula ?? '—'}</td>
                  <td className="px-5 py-3 text-ink-500">{new Date(p.creado_en).toLocaleDateString('es-ES')}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setSelected(p)} className="btn-ghost h-8 w-8 p-0"><ChevronRight size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <PacienteDetail paciente={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function PacienteDetail({ paciente, onClose }: { paciente: Profile; onClose: () => void }) {
  const [citas, setCitas] = useState<CitaConTrat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('citas')
      .select('*, tratamiento:tratamientos(*)')
      .eq('paciente_id', paciente.id)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setCitas((data as CitaConTrat[]) ?? []);
        setLoading(false);
      });
  }, [paciente.id]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto scrollbar-thin animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-mint-100 to-lilac-100 text-xl font-bold text-mint-700">
              {paciente.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-ink-800">{paciente.nombre}</h3>
              <p className="text-sm text-ink-500">{paciente.correo}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost h-9 w-9 p-0"><X size={18} /></button>
        </div>

        <div className="mt-4 space-y-2 rounded-2xl bg-cream-50 p-4 text-sm">
          <p className="flex items-center gap-2 text-ink-700"><Phone size={16} className="text-ink-400" /> {paciente.telefono ?? '—'}</p>
          <p className="flex items-center gap-2 text-ink-700"><MapPin size={16} className="text-ink-400" /> {paciente.direccion ?? '—'}</p>
          <p className="flex items-center gap-2 text-ink-700"><Calendar size={16} className="text-ink-400" /> Cédula: {paciente.cedula ?? '—'}</p>
        </div>

        <div className="mt-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-700"><AlertTriangle size={16} /> Alergias / condiciones</p>
          <p className="mt-1 text-sm text-ink-600">{paciente.alergias || 'Sin reportar'}</p>
        </div>

        <div className="mt-5">
          <h4 className="mb-2 font-display text-lg font-bold text-ink-800">Historial de citas ({citas.length})</h4>
          {loading ? (
            <div className="grid place-items-center py-6"><Spinner size={22} className="text-mint-500" /></div>
          ) : citas.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-400">Sin citas registradas.</p>
          ) : (
            <ul className="space-y-2">
              {citas.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-2xl bg-cream-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-ink-800">{c.tratamiento?.nombre ?? 'Tratamiento'}</p>
                    <p className="text-xs text-ink-500">{c.fecha} · {c.hora}</p>
                  </div>
                  <span className={`chip ${
                    c.estado === 'confirmada' ? 'bg-mint-50 text-mint-700' :
                    c.estado === 'cancelada' ? 'bg-rose-50 text-rose-600' :
                    'bg-amber-50 text-amber-700'
                  }`}>{c.estado}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

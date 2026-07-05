import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase, type Tratamiento } from '../../lib/supabase';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { Plus, Pencil, Power, Trash2, X, Clock, DollarSign, Stethoscope } from 'lucide-react';

export function TratamientosPage() {
  const { push } = useToast();
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Tratamiento | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tratamientos').select('*').order('creado_en', { ascending: false });
    if (error) console.error(error);
    setTratamientos((data as Tratamiento[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActivo(t: Tratamiento) {
    const { error } = await supabase.from('tratamientos').update({ activo: !t.activo }).eq('id', t.id);
    if (error) { push('error', error.message); return; }
    push('success', t.activo ? 'Tratamiento desactivado' : 'Tratamiento activado');
    load();
  }

  async function eliminar(t: Tratamiento) {
    if (!confirm(`¿Eliminar "${t.nombre}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from('tratamientos').delete().eq('id', t.id);
    if (error) { push('error', error.message); return; }
    push('success', 'Tratamiento eliminado');
    load();
  }

  if (loading) {
    return <div className="grid place-items-center py-24"><Spinner size={28} className="text-mint-500" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-800">Gestión de tratamientos</h1>
          <p className="mt-1 text-ink-500">Crea, edita y desactiva tratamientos.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <Plus size={18} /> Nuevo tratamiento
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tratamientos.map((t) => (
          <div key={t.id} className={`card flex flex-col ${t.activo ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-mint-100 to-lilac-100 text-mint-600">
                <Stethoscope size={22} />
              </div>
              <span className={`chip ${t.activo ? 'bg-mint-50 text-mint-700' : 'bg-ink-100 text-ink-500'}`}>
                {t.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <h3 className="mt-3 font-display text-lg font-bold text-ink-800">{t.nombre}</h3>
            <p className="mt-1 flex-1 text-sm text-ink-500">{t.descripcion}</p>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span className="chip bg-cream-100 text-ink-700"><Clock size={14} /> {t.duracion_minutos} min</span>
              <span className="chip bg-lilac-50 text-lilac-700"><DollarSign size={14} /> ${Number(t.precio).toFixed(2)}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setEditing(t); setShowForm(true); }} className="btn-secondary flex-1">
                <Pencil size={16} /> Editar
              </button>
              <button onClick={() => toggleActivo(t)} className="btn-ghost" title={t.activo ? 'Desactivar' : 'Activar'}>
                <Power size={18} />
              </button>
              <button onClick={() => eliminar(t)} className="btn-ghost text-rose-500 hover:bg-rose-50" title="Eliminar">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <TratamientoForm
          tratamiento={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function TratamientoForm({
  tratamiento, onClose, onSaved,
}: {
  tratamiento: Tratamiento | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const [nombre, setNombre] = useState(tratamiento?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(tratamiento?.descripcion ?? '');
  const [duracion, setDuracion] = useState(tratamiento?.duracion_minutos ?? 30);
  const [precio, setPrecio] = useState(tratamiento?.precio ?? 0);
  const [activo, setActivo] = useState(tratamiento?.activo ?? true);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = { nombre, descripcion, duracion_minutos: Number(duracion), precio: Number(precio), activo };
    let error;
    if (tratamiento) {
      ({ error } = await supabase.from('tratamientos').update(payload).eq('id', tratamiento.id));
    } else {
      ({ error } = await supabase.from('tratamientos').insert(payload));
    }
    setLoading(false);
    if (error) { push('error', error.message); return; }
    push('success', tratamiento ? 'Tratamiento actualizado' : 'Tratamiento creado');
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} className="card w-full max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="font-display text-xl font-bold text-ink-800">{tratamiento ? 'Editar tratamiento' : 'Nuevo tratamiento'}</h3>
          <button type="button" onClick={onClose} className="btn-ghost h-9 w-9 p-0"><X size={18} /></button>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="input" placeholder="Limpieza Dental" />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className="input resize-none" placeholder="Breve descripción del tratamiento" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Duración (min)</label>
              <input type="number" min={5} step={5} required value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} className="input" />
            </div>
            <div>
              <label className="label">Precio ($)</label>
              <input type="number" min={0} step="0.01" required value={precio} onChange={(e) => setPrecio(Number(e.target.value))} className="input" />
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-2xl bg-cream-50 px-4 py-3">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-5 w-5 rounded text-mint-500 focus:ring-mint-400" />
            <span className="text-sm font-semibold text-ink-700">Activo (visible en el catálogo de pacientes)</span>
          </label>
        </div>
        <button type="submit" disabled={loading} className="btn-primary mt-5 w-full">
          {loading ? <Spinner /> : <>{tratamiento ? 'Guardar cambios' : 'Crear tratamiento'}</>}
        </button>
      </form>
    </div>
  );
}

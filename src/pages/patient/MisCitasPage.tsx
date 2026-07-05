import { useCallback, useEffect, useState } from 'react';
import { supabase, type Cita } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { CalendarDays, CalendarX, Clock, Calendar, CheckCircle2, XCircle, X, RotateCw, Plus } from 'lucide-react';

interface Props {
  onNueva: () => void;
}

function isMoreThan24hAway(fecha: string, hora: string): boolean {
  const slot = new Date(`${fecha}T${hora}:00`);
  return slot.getTime() - Date.now() > 24 * 60 * 60 * 1000;
}

export function MisCitasPage({ onNueva }: Props) {
  const { profile } = useAuth();
  const { push } = useToast();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('citas')
      .select('*, tratamiento:tratamientos(*)')
      .eq('paciente_id', profile.id)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });
    if (error) console.error(error);
    setCitas((data as Cita[]) ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  async function cancelar(cita: Cita) {
    setCancellingId(cita.id);
    const { error } = await supabase
      .from('citas')
      .update({ estado: 'cancelada' })
      .eq('id', cita.id);
    setCancellingId(null);
    if (error) {
      push('error', 'No se pudo cancelar: ' + error.message);
      return;
    }
    push('success', 'Cita cancelada');
    load();
  }

  const now = new Date();
  const proximas = citas
    .filter((c) => c.estado !== 'cancelada' && new Date(`${c.fecha}T${c.hora}:00`) >= now)
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  const pasadas = citas
    .filter((c) => c.estado === 'cancelada' || new Date(`${c.fecha}T${c.hora}:00`) < now)
    .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));

  if (loading) {
    return <div className="grid place-items-center py-24"><Spinner size={28} className="text-mint-500" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-800">Mis Citas</h1>
          <p className="mt-1 text-ink-500">Gestiona tus citas agendadas.</p>
        </div>
        <button onClick={onNueva} className="btn-primary">
          <Plus size={18} /> Nueva cita
        </button>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-ink-800">
          <CalendarDays size={20} className="text-mint-500" /> Próximas ({proximas.length})
        </h2>
        {proximas.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 py-10 text-center text-ink-400">
            <CalendarX size={36} className="text-ink-300" />
            <p>No tienes citas próximas.</p>
            <button onClick={onNueva} className="btn-secondary">Agendar una cita</button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {proximas.map((c) => (
              <CitaCard key={c.id} cita={c} onCancel={cancelar} cancelling={cancellingId === c.id} canCancel={isMoreThan24hAway(c.fecha, c.hora)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-ink-800">
          <Clock size={20} className="text-ink-400" /> Historial ({pasadas.length})
        </h2>
        {pasadas.length === 0 ? (
          <div className="card py-8 text-center text-ink-400">Aún no tienes citas pasadas.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {pasadas.map((c) => (
              <CitaCard key={c.id} cita={c} onCancel={cancelar} cancelling={cancellingId === c.id} canCancel={false} past />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CitaCard({
  cita,
  onCancel,
  cancelling,
  canCancel,
  past,
}: {
  cita: Cita;
  onCancel: (c: Cita) => void;
  cancelling: boolean;
  canCancel: boolean;
  past?: boolean;
}) {
  const estadoChip = {
    pendiente: { cls: 'bg-amber-50 text-amber-700 ring-amber-200', icon: Clock, label: 'Pendiente' },
    confirmada: { cls: 'bg-mint-50 text-mint-700 ring-mint-200', icon: CheckCircle2, label: 'Confirmada' },
    cancelada: { cls: 'bg-rose-50 text-rose-600 ring-rose-200', icon: XCircle, label: 'Cancelada' },
  }[cita.estado];

  return (
    <div className={`card flex flex-col ${cita.estado === 'cancelada' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-lg font-bold text-ink-800">{cita.tratamiento?.nombre ?? 'Tratamiento'}</p>
          <p className="text-sm text-ink-500">{cita.tratamiento?.descripcion}</p>
        </div>
        <span className={`chip ring-1 ${estadoChip.cls}`}>
          <estadoChip.icon size={14} /> {estadoChip.label}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-600">
        <span className="flex items-center gap-1.5"><Calendar size={16} className="text-mint-500" /> {cita.fecha}</span>
        <span className="flex items-center gap-1.5"><Clock size={16} className="text-mint-500" /> {cita.hora}</span>
        {cita.tratamiento && (
          <span className="chip bg-cream-100 text-ink-700">${Number(cita.tratamiento.precio).toFixed(2)}</span>
        )}
      </div>
      {!past && canCancel && cita.estado !== 'cancelada' && (
        <div className="mt-4 flex gap-2">
          <button onClick={() => onCancel(cita)} disabled={cancelling} className="btn-danger flex-1">
            {cancelling ? <Spinner size={16} /> : <><X size={16} /> Cancelar</>}
          </button>
          <button disabled className="btn-secondary flex-1 opacity-50 cursor-not-allowed">
            <RotateCw size={16} /> Reprogramar
          </button>
        </div>
      )}
      {!past && !canCancel && cita.estado !== 'cancelada' && (
        <p className="mt-3 text-xs text-ink-400">Solo puedes cancelar hasta 24h antes de la cita.</p>
      )}
    </div>
  );
}

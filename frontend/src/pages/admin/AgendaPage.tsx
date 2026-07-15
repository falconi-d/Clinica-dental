import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, type Cita, type HorarioBloqueado, type Profile, type Tratamiento } from '../../lib/supabase';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Lock, X, User, Phone, MapPin, AlertTriangle, Trash2, Plus,
} from 'lucide-react';

const WEEKDAYS = ['Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie', 'SÃ¡b', 'Dom'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30'];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

type CitaConRelaciones = Cita & { paciente: Profile | null; tratamiento: Tratamiento | null };

export function AgendaPage() {
  const { push } = useToast();
  const [viewMonth, setViewMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState<string | null>(toISODate(new Date()));
  const [citas, setCitas] = useState<CitaConRelaciones[]>([]);
  const [bloqueos, setBloqueos] = useState<HorarioBloqueado[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailCita, setDetailCita] = useState<CitaConRelaciones | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const calendarDays = useMemo(() => {
    const first = new Date(viewMonth);
    const startDay = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(first.getFullYear(), first.getMonth(), d));
    return cells;
  }, [viewMonth]);

  const load = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    const [citasRes, blockedRes] = await Promise.all([
      supabase.from('citas').select('*, paciente:profiles(*), tratamiento:tratamientos(*)').eq('fecha', selectedDate).order('hora'),
      supabase.from('horarios_bloqueados').select('*').eq('fecha', selectedDate),
    ]);
    if (citasRes.error) console.error(citasRes.error);
    if (blockedRes.error) console.error(blockedRes.error);
    setCitas((citasRes.data as CitaConRelaciones[]) ?? []);
    setBloqueos((blockedRes.data as HorarioBloqueado[]) ?? []);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  function isBlocked(hora: string): boolean {
    return bloqueos.some((b) => hora >= b.hora_inicio.slice(0,5) && hora < b.hora_fin.slice(0,5));
  }
  function citaAt(hora: string): CitaConRelaciones | undefined {
    return citas.find((c) => c.hora.slice(0,5) === hora && c.estado !== 'cancelada');
  }

  async function confirmarCita(cita: Cita) {
    const { error } = await supabase.from('citas').update({ estado: 'confirmada' }).eq('id', cita.id);
    if (error) { push('error', error.message); return; }
    push('success', 'Cita confirmada');
    load();
  }

  async function cancelarCita(cita: Cita) {
    const { error } = await supabase.from('citas').update({ estado: 'cancelada' }).eq('id', cita.id);
    if (error) { push('error', error.message); return; }
    push('success', 'Cita cancelada');
    setDetailCita(null);
    load();
  }

  async function deleteBloqueo(id: string) {
    const { error } = await supabase.from('horarios_bloqueados').delete().eq('id', id);
    if (error) { push('error', error.message); return; }
    push('success', 'Bloqueo eliminado');
    load();
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-800">Agenda general</h1>
          <p className="mt-1 text-ink-500">Todas las citas de la clÃ­nica.</p>
        </div>
        <button onClick={() => setShowBlockModal(true)} className="btn-secondary">
          <Lock size={18} /> Bloquear horario
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Mini calendar */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-800">{MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}</h2>
            <div className="flex gap-1">
              <button onClick={() => { const d = new Date(viewMonth); d.setMonth(d.getMonth()-1); setViewMonth(d); }} className="btn-ghost h-9 w-9 p-0"><ChevronLeft size={18} /></button>
              <button onClick={() => { const d = new Date(viewMonth); d.setMonth(d.getMonth()+1); setViewMonth(d); }} className="btn-ghost h-9 w-9 p-0"><ChevronRight size={18} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-400">
            {WEEKDAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((d, i) => {
              if (!d) return <div key={i} />;
              const iso = toISODate(d);
              const selected = selectedDate === iso;
              const isToday = iso === toISODate(new Date());
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(iso)}
                  className={`aspect-square rounded-xl text-sm font-semibold transition-all ${
                    selected ? 'bg-mint-500 text-white shadow-soft' : 'bg-cream-50 text-ink-700 hover:bg-mint-100'
                  } ${isToday && !selected ? 'ring-2 ring-mint-400' : ''}`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day timeline */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink-800">
              {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
            </h2>
            <span className="text-sm text-ink-400">{citas.length} citas Â· {bloqueos.length} bloqueos</span>
          </div>
          {loading ? (
            <div className="grid place-items-center py-12"><Spinner size={24} className="text-mint-500" /></div>
          ) : (
            <div className="max-h-[520px] space-y-1 overflow-y-auto scrollbar-thin pr-1">
              {SLOTS.map((hora) => {
                const cita = citaAt(hora);
                const blocked = isBlocked(hora);
                if (cita) {
                  return (
                    <button
                      key={hora}
                      onClick={() => setDetailCita(cita)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-mint-50 px-4 py-3 text-left ring-1 ring-mint-200 transition-all hover:bg-mint-100"
                    >
                      <span className="w-16 text-sm font-bold text-mint-700">{hora}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-ink-800">{cita.paciente?.nombre}</p>
                        <p className="text-xs text-ink-500">{cita.tratamiento?.nombre}</p>
                      </div>
                      <span className={`chip ${
                        cita.estado === 'confirmada' ? 'bg-mint-100 text-mint-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{cita.estado}</span>
                    </button>
                  );
                }
                if (blocked) {
                  const b = bloqueos.find((x) => hora >= x.hora_inicio.slice(0,5) && hora < x.hora_fin.slice(0,5))!;
                  return (
                    <div key={hora} className="flex items-center gap-3 rounded-2xl bg-ink-50 px-4 py-3 text-ink-400 ring-1 ring-ink-200">
                      <span className="w-16 text-sm font-bold">{hora}</span>
                      <div className="flex-1">
                        <p className="font-semibold flex items-center gap-1.5"><Lock size={14} /> Bloqueado</p>
                        {b.motivo && <p className="text-xs">{b.motivo}</p>}
                      </div>
                      <button onClick={() => deleteBloqueo(b.id)} className="btn-ghost h-8 w-8 p-0 text-rose-500 hover:bg-rose-50"><Trash2 size={16} /></button>
                    </div>
                  );
                }
                return (
                  <div key={hora} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-ink-300">
                    <span className="w-16 text-sm font-semibold">{hora}</span>
                    <span className="text-sm">Libre</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {detailCita && (
        <CitaDetailModal
          cita={detailCita}
          onClose={() => setDetailCita(null)}
          onConfirm={() => confirmarCita(detailCita)}
          onCancel={() => cancelarCita(detailCita)}
        />
      )}

      {showBlockModal && selectedDate && (
        <BlockModal
          fecha={selectedDate}
          onClose={() => setShowBlockModal(false)}
          onDone={() => { setShowBlockModal(false); load(); }}
        />
      )}
    </div>
  );
}

function CitaDetailModal({
  cita, onClose, onConfirm, onCancel,
}: {
  cita: CitaConRelaciones;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const p = cita.paciente;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-ink-800">Detalle de cita</h3>
            <p className="text-sm text-ink-500">{cita.fecha} Â· {cita.hora}</p>
          </div>
          <button onClick={onClose} className="btn-ghost h-9 w-9 p-0"><X size={18} /></button>
        </div>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-cream-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-ink-800"><User size={16} className="text-mint-500" /> {p?.nombre}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-ink-600"><Phone size={14} className="text-ink-400" /> {p?.telefono ?? 'â€”'}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-ink-600"><MapPin size={14} className="text-ink-400" /> {p?.direccion ?? 'â€”'}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-ink-600"><CalendarIcon size={14} className="text-ink-400" /> CÃ©dula: {p?.cedula ?? 'â€”'}</p>
          </div>
          <div className="rounded-2xl bg-lilac-50 p-4">
            <p className="font-semibold text-ink-800">{cita.tratamiento?.nombre}</p>
            <p className="text-sm text-ink-500">{cita.tratamiento?.descripcion}</p>
            <p className="mt-1 text-sm font-semibold text-lilac-700">${Number(cita.tratamiento?.precio ?? 0).toFixed(2)} Â· {cita.tratamiento?.duracion_minutos} min</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-700"><AlertTriangle size={16} /> Alergias / condiciones</p>
            <p className="mt-1 text-sm text-ink-600">{p?.alergias || 'Sin reportar'}</p>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          {cita.estado === 'pendiente' && (
            <button onClick={onConfirm} className="btn-primary flex-1">Confirmar cita</button>
          )}
          {cita.estado !== 'cancelada' && (
            <button onClick={onCancel} className="btn-danger flex-1">Cancelar cita</button>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockModal({ fecha, onClose, onDone }: { fecha: string; onClose: () => void; onDone: () => void }) {
  const { push } = useToast();
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('10:00');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (horaFin <= horaInicio) { push('error', 'La hora fin debe ser mayor'); return; }
    setLoading(true);
    const { error } = await supabase.from('horarios_bloqueados').insert({ fecha, hora_inicio: horaInicio, hora_fin: horaFin, motivo });
    setLoading(false);
    if (error) { push('error', error.message); return; }
    push('success', 'Horario bloqueado');
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} className="card w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-ink-800">Bloquear horario</h3>
            <p className="text-sm text-ink-500">{fecha}</p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost h-9 w-9 p-0"><X size={18} /></button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="label">Hora inicio</label>
            <select value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="input">
              {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Hora fin</label>
            <select value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="input">
              {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              <option value="19:00">19:00</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="label">Motivo (vacaciones, feriado, etc.)</label>
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Feriado nacional" className="input" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary mt-5 w-full">
          {loading ? <Spinner /> : <><Plus size={18} /> Bloquear</>}
        </button>
      </form>
    </div>
  );
}


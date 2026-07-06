import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, type Tratamiento, type Cita, type HorarioBloqueado } from '../../lib/supabase';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface Props {
  tratamiento: Tratamiento;
  onBack: () => void;
  onConfirm: (fecha: string, hora: string) => void;
}

const SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30',
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0; // Sunday closed
}

function isPast(d: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

export function SchedulePage({ tratamiento, onBack, onConfirm }: Props) {
  const { push } = useToast();
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [takenSlots, setTakenSlots] = useState<Set<string>>(new Set());
  const [blockedRanges, setBlockedRanges] = useState<HorarioBloqueado[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const calendarDays = useMemo(() => {
    const first = new Date(viewMonth);
    const startDay = (first.getDay() + 6) % 7; // Monday=0
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(first.getFullYear(), first.getMonth(), d));
    return cells;
  }, [viewMonth]);

  const loadAvailability = useCallback(async (date: string) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    const [citasRes, blockedRes] = await Promise.all([
      supabase.rpc('horas_ocupadas', { p_fecha: date }),
      supabase.from('horarios_bloqueados').select('*').eq('fecha', date),
    ]);
    if (citasRes.error) console.error(citasRes.error);
    if (blockedRes.error) console.error(blockedRes.error);
    const taken = new Set<string>(((citasRes.data as Pick<Cita, 'hora'>[]) ?? []).map((r) => r.hora));
    setTakenSlots(taken);
    setBlockedRanges((blockedRes.data as HorarioBloqueado[]) ?? []);
    setLoadingSlots(false);
  }, []);

  useEffect(() => {
    if (selectedDate) loadAvailability(selectedDate);
  }, [selectedDate, loadAvailability]);

  function isSlotBlocked(hora: string): boolean {
    if (takenSlots.has(hora)) return true;
    return blockedRanges.some((b) => {
      const start = b.hora_inicio.slice(0, 5);
      const end = b.hora_fin.slice(0, 5);
      return hora >= start && hora < end;
    });
  }

  function isSlotPast(hora: string): boolean {
    if (!selectedDate) return false;
    const now = new Date();
    const slot = new Date(`${selectedDate}T${hora}:00`);
    return slot <= now;
  }

  function prevMonth() {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() - 1);
    setViewMonth(d);
  }
  function nextMonth() {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() + 1);
    setViewMonth(d);
  }

  function handleConfirm() {
    if (!selectedDate || !selectedSlot) {
      push('error', 'Selecciona fecha y hora');
      return;
    }
    onConfirm(selectedDate, selectedSlot);
  }

  return (
    <div className="animate-fade-in">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-700">
        <ArrowLeft size={18} /> Volver al catálogo
      </button>

      <div className="mb-6 flex items-start gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-mint-100 to-lilac-100 text-3xl">
          🦷
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-800">{tratamiento.nombre}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-500">
            <span className="chip bg-mint-50 text-mint-700"><Clock size={14} /> {tratamiento.duracion_minutos} min</span>
            <span className="chip bg-lilac-50 text-lilac-700">Costo: ${Number(tratamiento.precio).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendar */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink-800">
              {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </h2>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="btn-ghost h-9 w-9 p-0"><ChevronLeft size={18} /></button>
              <button onClick={nextMonth} className="btn-ghost h-9 w-9 p-0"><ChevronRight size={18} /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-400">
            {WEEKDAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((d, i) => {
              if (!d) return <div key={i} />;
              const iso = toISODate(d);
              const weekend = isWeekend(d);
              const past = isPast(d);
              const disabled = weekend || past;
              const selected = selectedDate === iso;
              return (
                <button
                  key={i}
                  disabled={disabled}
                  onClick={() => setSelectedDate(iso)}
                  className={`aspect-square rounded-2xl text-sm font-semibold transition-all ${
                    selected
                      ? 'bg-mint-500 text-white shadow-soft'
                      : disabled
                      ? 'cursor-not-allowed bg-ink-50 text-ink-300'
                      : 'bg-cream-50 text-ink-700 hover:bg-mint-100 hover:ring-1 hover:ring-mint-300'
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-ink-400">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-mint-500" /> Seleccionado</span>
            <span className="flex items-center gap-1"><Lock size={12} /> Domingo cerrado</span>
          </div>
        </div>

        {/* Time slots */}
        <div className="card">
          <h2 className="font-display text-xl font-bold text-ink-800">Horarios disponibles</h2>
          {!selectedDate ? (
            <div className="mt-6 flex flex-col items-center justify-center gap-3 py-12 text-center text-ink-400">
              <CalendarIcon size={40} className="text-ink-300" />
              <p>Selecciona una fecha para ver los horarios.</p>
            </div>
          ) : loadingSlots ? (
            <div className="mt-6 grid place-items-center py-12"><Spinner size={24} className="text-mint-500" /></div>
          ) : (
            <>
              <p className="mt-1 text-sm text-ink-500">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {SLOTS.map((s) => {
                  const blocked = isSlotBlocked(s);
                  const past = isSlotPast(s);
                  const disabled = blocked || past;
                  const selected = selectedSlot === s;
                  return (
                    <button
                      key={s}
                      disabled={disabled}
                      onClick={() => setSelectedSlot(s)}
                      className={`rounded-2xl px-2 py-3 text-sm font-semibold transition-all ${
                        selected
                          ? 'bg-mint-500 text-white shadow-soft'
                          : disabled
                          ? 'cursor-not-allowed bg-ink-50 text-ink-300 line-through'
                          : 'bg-cream-50 text-ink-700 hover:bg-mint-100 hover:ring-1 hover:ring-mint-300'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-400">
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-ink-50 ring-1 ring-ink-200" /> Ocupado / bloqueado</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-mint-500" /> Libre</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-ink-500">
          {selectedDate && selectedSlot ? (
            <span className="flex items-center gap-2 font-semibold text-mint-700">
              <CheckCircle2 size={18} /> {selectedDate} a las {selectedSlot}
            </span>
          ) : 'Selecciona fecha y hora para continuar.'}
        </p>
        <button
          onClick={handleConfirm}
          disabled={!selectedDate || !selectedSlot}
          className="btn-primary w-full sm:w-auto"
        >
          Continuar <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

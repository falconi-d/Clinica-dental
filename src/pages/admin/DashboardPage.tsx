import { useEffect, useState } from 'react';
import { supabase, type Cita, type Tratamiento } from '../../lib/supabase';
import { Spinner } from '../../components/ui/Spinner';
import { CalendarDays, CalendarRange, DollarSign, TrendingUp, Clock, Users, ArrowUpRight } from 'lucide-react';

interface Stats {
  citasHoy: number;
  citasSemana: number;
  ingresosMes: number;
  topTratamientos: { nombre: string; count: number; precio: number }[];
  citasRecientes: (Cita & { paciente?: { nombre: string } | null; tratamiento?: Tratamiento | null })[];
  totalPacientes: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const startWeek = startOfWeek.toISOString().slice(0, 10);
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

      const [citasHoy, citasSemana, citasMes, citasRecientes, pacientes] = await Promise.all([
        supabase.from('citas').select('*, tratamiento:tratamientos(*), paciente:profiles(nombre)').eq('fecha', today).neq('estado', 'cancelada'),
        supabase.from('citas').select('id').gte('fecha', startWeek).neq('estado', 'cancelada'),
        supabase.from('citas').select('*, tratamiento:tratamientos(precio)').gte('fecha', startMonth).neq('estado', 'cancelada'),
        supabase.from('citas').select('*, tratamiento:tratamientos(*), paciente:profiles(nombre)').order('creado_en', { ascending: false }).limit(6),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('rol', 'paciente'),
      ]);

      const hoyData = (citasHoy.data as Cita[]) ?? [];
      const semanaCount = citasSemana.count ?? 0;
      const mesData = (citasMes.data as Cita[]) ?? [];
      const ingresosMes = mesData.reduce((sum, c) => {
        const p = (c as unknown as { tratamiento?: { precio: number } | null }).tratamiento?.precio;
        return sum + (p ? Number(p) : 0);
      }, 0);

      const counts = new Map<string, { count: number; precio: number }>();
      mesData.forEach((c) => {
        const t = (c as unknown as { tratamiento?: Tratamiento | null }).tratamiento;
        if (!t) return;
        const cur = counts.get(t.nombre) ?? { count: 0, precio: Number(t.precio) };
        cur.count += 1;
        counts.set(t.nombre, cur);
      });
      const topTratamientos = Array.from(counts.entries())
        .map(([nombre, v]) => ({ nombre, count: v.count, precio: v.precio }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        citasHoy: hoyData.length,
        citasSemana: semanaCount,
        ingresosMes,
        topTratamientos,
        citasRecientes: (citasRecientes.data as Stats['citasRecientes']) ?? [],
        totalPacientes: pacientes.count ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !stats) {
    return <div className="grid place-items-center py-24"><Spinner size={28} className="text-mint-500" /></div>;
  }

  const maxCount = Math.max(1, ...stats.topTratamientos.map((t) => t.count));

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-ink-800">Dashboard</h1>
        <p className="mt-1 text-ink-500">Resumen general de la clínica.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={CalendarDays} label="Citas de hoy" value={String(stats.citasHoy)} accent="mint" />
        <MetricCard icon={CalendarRange} label="Citas de la semana" value={String(stats.citasSemana)} accent="lilac" />
        <MetricCard icon={DollarSign} label="Ingresos del mes" value={`$${stats.ingresosMes.toFixed(2)}`} accent="cream" />
        <MetricCard icon={Users} label="Pacientes activos" value={String(stats.totalPacientes)} accent="mint" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink-800">Tratamientos más solicitados</h2>
            <TrendingUp size={20} className="text-mint-500" />
          </div>
          {stats.topTratamientos.length === 0 ? (
            <p className="py-8 text-center text-ink-400">Sin datos este mes.</p>
          ) : (
            <div className="space-y-3">
              {stats.topTratamientos.map((t) => (
                <div key={t.nombre}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink-700">{t.nombre}</span>
                    <span className="text-ink-400">{t.count} citas</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-cream-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-mint-400 to-mint-600 transition-all"
                      style={{ width: `${(t.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink-800">Citas recientes</h2>
            <Clock size={20} className="text-ink-400" />
          </div>
          {stats.citasRecientes.length === 0 ? (
            <p className="py-8 text-center text-ink-400">Aún no hay citas.</p>
          ) : (
            <ul className="space-y-2">
              {stats.citasRecientes.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-2xl bg-cream-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-ink-800">{c.paciente?.nombre ?? 'Paciente'}</p>
                    <p className="text-xs text-ink-500">{c.tratamiento?.nombre ?? 'Tratamiento'} · {c.fecha} {c.hora}</p>
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

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  accent: 'mint' | 'lilac' | 'cream';
}) {
  const accents = {
    mint: 'from-mint-100 to-mint-50 text-mint-600',
    lilac: 'from-lilac-100 to-lilac-50 text-lilac-600',
    cream: 'from-cream-100 to-cream-50 text-cream-500',
  }[accent];
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-ink-500">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink-800">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${accents}`}>
          <Icon size={22} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-mint-600">
        <ArrowUpRight size={14} /> En tiempo real
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase, type Tratamiento } from '../../lib/supabase';
import { Spinner } from '../../components/ui/Spinner';
import { Clock, DollarSign, ArrowRight, Search } from 'lucide-react';

interface Props {
  onAgendar: (t: Tratamiento) => void;
}

const ICONS: Record<string, string> = {
  'Limpieza Dental': '🪥',
  Ortodoncia: '😁',
  Blanqueamiento: '✨',
  Endodoncia: '🦷',
  'Implante Dental': '⚙️',
  Extracción: '🔧',
  Prótesis: '🦷',
  'Control General': '🩺',
};

export function CatalogPage({ onAgendar }: Props) {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    supabase
      .from('tratamientos')
      .select('*')
      .eq('activo', true)
      .order('nombre')
      .then(({ data, error }) => {
        if (error) console.error(error);
        setTratamientos((data as Tratamiento[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = tratamientos.filter(
    (t) =>
      t.nombre.toLowerCase().includes(query.toLowerCase()) ||
      (t.descripcion ?? '').toLowerCase().includes(query.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner size={28} className="text-mint-500" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink-800">Catálogo de tratamientos</h1>
        <p className="mt-1 text-ink-500">Elige el tratamiento que deseas agendar.</p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar tratamiento…"
          className="input pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center text-ink-500">No se encontraron tratamientos.</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, i) => (
            <div
              key={t.id}
              className="group card flex flex-col animate-slide-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-mint-100 to-lilac-100 text-3xl">
                {ICONS[t.nombre] ?? '🦷'}
              </div>
              <h3 className="font-display text-xl font-bold text-ink-800">{t.nombre}</h3>
              <p className="mt-1 flex-1 text-sm text-ink-500">{t.descripcion}</p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="chip bg-mint-50 text-mint-700">
                  <Clock size={14} /> {t.duracion_minutos} min
                </span>
                <span className="chip bg-lilac-50 text-lilac-700">
                  <DollarSign size={14} /> ${Number(t.precio).toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => onAgendar(t)}
                className="btn-primary mt-5 w-full group-hover:shadow-card"
              >
                Agendar <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

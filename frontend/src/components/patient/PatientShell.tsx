import { type ReactNode } from 'react';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../lib/auth';
import { Calendar, LayoutGrid, CalendarDays, LogOut, UserCircle } from 'lucide-react';

export type PatientTab = 'catalog' | 'mis-citas' | 'perfil';

interface Props {
  tab: PatientTab;
  onTab: (t: PatientTab) => void;
  children: ReactNode;
}

export function PatientShell({ tab, onTab, children }: Props) {
  const { profile, signOut } = useAuth();

  const nav: { id: PatientTab; label: string; icon: typeof Calendar }[] = [
    { id: 'catalog', label: 'Tratamientos', icon: LayoutGrid },
    { id: 'mis-citas', label: 'Mis Citas', icon: CalendarDays },
    { id: 'perfil', label: 'Mi Perfil', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-cream-50/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo size="sm" />
          <nav className="hidden gap-1 sm:flex">
            {nav.map((n) => (
              <button
                key={n.id}
                onClick={() => onTab(n.id)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${
                  tab === n.id
                    ? 'bg-mint-500 text-white shadow-soft'
                    : 'text-ink-600 hover:bg-ink-100'
                }`}
              >
                <n.icon size={18} />
                {n.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink-800">{profile?.nombre}</p>
              <p className="text-xs text-ink-400">Paciente</p>
            </div>
            <button onClick={signOut} className="btn-ghost" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-3 sm:hidden">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => onTab(n.id)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${
                tab === n.id ? 'bg-mint-500 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200'
              }`}
            >
              <n.icon size={18} />
              {n.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

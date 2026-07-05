import { type ReactNode } from 'react';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../lib/auth';
import { LayoutDashboard, CalendarDays, Stethoscope, Users, LogOut, ShieldCheck } from 'lucide-react';

export type AdminTab = 'dashboard' | 'agenda' | 'tratamientos' | 'pacientes';

interface Props {
  tab: AdminTab;
  onTab: (t: AdminTab) => void;
  children: ReactNode;
}

export function AdminShell({ tab, onTab, children }: Props) {
  const { profile, signOut } = useAuth();

  const nav: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: CalendarDays },
    { id: 'tratamientos', label: 'Tratamientos', icon: Stethoscope },
    { id: 'pacientes', label: 'Pacientes', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-cream-50 lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex lg:flex-col lg:justify-between lg:border-r lg:border-ink-100 lg:bg-white lg:p-5">
        <div>
          <Logo size="md" />
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-lilac-50 px-3 py-2 text-xs font-semibold text-lilac-700 ring-1 ring-lilac-200">
            <ShieldCheck size={14} /> Panel de Administrador
          </div>
          <nav className="mt-6 space-y-1">
            {nav.map((n) => (
              <button
                key={n.id}
                onClick={() => onTab(n.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  tab === n.id
                    ? 'bg-mint-500 text-white shadow-soft'
                    : 'text-ink-600 hover:bg-cream-100'
                }`}
              >
                <n.icon size={18} />
                {n.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl bg-cream-50 p-3">
            <p className="text-sm font-semibold text-ink-800">{profile?.nombre}</p>
            <p className="text-xs text-ink-400">{profile?.correo}</p>
          </div>
          <button onClick={signOut} className="btn-ghost w-full justify-start text-rose-600 hover:bg-rose-50">
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-30 border-b border-ink-100 bg-cream-50/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3">
            <Logo size="sm" />
            <button onClick={signOut} className="btn-ghost text-rose-600"><LogOut size={18} /></button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-4 pb-3">
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
      </div>

      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

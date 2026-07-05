import { Loader2 } from 'lucide-react';

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}

export function FullScreenSpinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-cream-50">
      <div className="flex flex-col items-center gap-3 text-ink-500">
        <Spinner size={32} className="text-mint-500" />
        <p className="font-semibold">{label}</p>
      </div>
    </div>
  );
}

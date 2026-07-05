import { Smile } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { box: 'h-9 w-9', icon: 18, text: 'text-lg' },
    md: { box: 'h-11 w-11', icon: 22, text: 'text-xl' },
    lg: { box: 'h-16 w-16', icon: 32, text: 'text-3xl' },
  }[size];

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${sizes.box} grid place-items-center rounded-2xl bg-gradient-to-br from-mint-400 to-mint-600 text-white shadow-soft`}>
        <Smile size={sizes.icon} strokeWidth={2.4} />
      </div>
      <span className={`font-display font-bold ${sizes.text} text-ink-800`}>
        Sonrisa
      </span>
    </div>
  );
}

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppTheme } from '../lib/themeHelper';
import { cn } from '../lib/utils';

interface ThemeToggleButtonProps {
  variant?: 'pill' | 'icon' | 'compact';
  className?: string;
}

export default function ThemeToggleButton({ variant = 'pill', className }: ThemeToggleButtonProps) {
  const { isLight, toggle } = useAppTheme();

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "p-2 rounded-xl border transition-all duration-200 flex items-center justify-center shadow-sm",
          isLight 
            ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200" 
            : "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700",
          className
        )}
        title={isLight ? "Beralih ke Tampilan Gelap (Dark Mode)" : "Beralih ke Tampilan Putih (Light Mode)"}
        aria-label="Ganti Tema Tampilan"
      >
        {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm",
          isLight 
            ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300" 
            : "bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700",
          className
        )}
        title={isLight ? "Beralih ke Tampilan Gelap" : "Beralih ke Tampilan Putih"}
      >
        {isLight ? (
          <>
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Gelap</span>
          </>
        ) : (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Putih</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all duration-200 shadow-sm cursor-pointer",
        isLight
          ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-indigo-100/50"
          : "bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-300 border-amber-500/40 shadow-amber-950/20",
        className
      )}
      title={isLight ? "Klik untuk ganti ke Tampilan Gelap (Dark Mode)" : "Klik untuk ganti ke Tampilan Putih (Mode Terang)"}
    >
      {isLight ? (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>Tampilan Gelap</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
          <span>Tampilan Putih</span>
        </>
      )}
    </button>
  );
}

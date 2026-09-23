import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lock, Shield, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

interface SecretAdminMarkerProps {
  onTrigger: () => void;
  variant?: 'dot' | 'version' | 'logo-wrapper' | 'footer-lock';
  children?: React.ReactNode;
  className?: string;
  tapCountRequired?: number;
}

/**
 * Custom Hook to listen for secret admin shortcuts:
 * - Keyboard shortcut: Ctrl + Shift + A or Alt + A
 */
export function useSecretAdminShortcut(onTrigger: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an input/textarea
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        // Still allow if explicitly Ctrl + Shift + A
        if (!(e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a'))) {
          return;
        }
      }

      // Check for Ctrl + Shift + A or Alt + A
      const isCtrlShiftA = e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a');
      const isAltA = e.altKey && (e.key === 'a' || e.key === 'A');

      if (isCtrlShiftA || isAltA) {
        e.preventDefault();
        e.stopPropagation();
        onTrigger();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTrigger]);
}

/**
 * Secret Admin Marker Component
 * Discreet visual markers and tap-sequence triggers known only to the Administrator
 */
export default function SecretAdminMarker({
  onTrigger,
  variant = 'dot',
  children,
  className = '',
  tapCountRequired = 3
}: SecretAdminMarkerProps) {
  const [tapCount, setTapCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTap = useCallback((e?: React.MouseEvent) => {
    if (e) {
      // Don't prevent default unless in multi-tap sequence
      if (variant === 'logo-wrapper') {
        // Allow normal click/tap but count
      }
    }

    if (variant === 'dot' || variant === 'version' || variant === 'footer-lock') {
      // Direct discreet trigger
      onTrigger();
      return;
    }

    // For logo-wrapper: require triple-tap within 1.5 seconds
    setTapCount((prev) => {
      const next = prev + 1;
      if (timerRef.current) clearTimeout(timerRef.current);

      if (next >= tapCountRequired) {
        // Trigger secret access
        if (navigator.vibrate) {
          try {
            navigator.vibrate([50, 50, 50]);
          } catch (_) {}
        }
        onTrigger();
        return 0;
      }

      timerRef.current = setTimeout(() => {
        setTapCount(0);
      }, 1400);

      return next;
    });
  }, [onTrigger, tapCountRequired, variant]);

  // Variant: Logo Wrapper (detects 3 taps on the school emblem/title)
  if (variant === 'logo-wrapper') {
    return (
      <div 
        onClick={handleTap} 
        className={cn("cursor-pointer select-none relative group", className)}
        title=""
      >
        {children}
        {/* Subtle secret glow indicator when user starts tapping */}
        {tapCount > 0 && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400/80 animate-ping pointer-events-none" />
        )}
      </div>
    );
  }

  // Variant: Dot (A subtle green/cyan micro-dot that looks like system status)
  if (variant === 'dot') {
    return (
      <button
        type="button"
        onClick={handleTap}
        className={cn(
          "inline-flex items-center justify-center p-1.5 rounded-full hover:bg-slate-800/60 transition-colors group cursor-pointer focus:outline-none",
          className
        )}
        title="Sistem Siaga"
        aria-label="Status Sistem"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 group-hover:opacity-80"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500/70 group-hover:bg-emerald-400"></span>
        </span>
      </button>
    );
  }

  // Variant: Version (Looks like an innocuous software version tag)
  if (variant === 'version') {
    return (
      <button
        type="button"
        onClick={handleTap}
        className={cn(
          "inline-flex items-center gap-1.5 font-mono text-[10px] text-slate-500 hover:text-slate-300 transition-colors py-0.5 px-1.5 rounded hover:bg-slate-800/40 cursor-pointer",
          className
        )}
        title="Status Operasional"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 inline-block"></span>
        <span>v3.2</span>
      </button>
    );
  }

  // Variant: Footer Lock (Ultra-discreet lock icon with low opacity)
  if (variant === 'footer-lock') {
    return (
      <button
        type="button"
        onClick={handleTap}
        className={cn(
          "inline-flex items-center justify-center p-1 text-slate-600 hover:text-slate-400 transition-all opacity-25 hover:opacity-80 rounded-md cursor-pointer",
          className
        )}
        title="Area Khusus"
        aria-label="Akses Internal"
      >
        <Lock className="w-3 h-3" />
      </button>
    );
  }

  return null;
}

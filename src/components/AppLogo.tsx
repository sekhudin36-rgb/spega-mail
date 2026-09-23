import React, { useState, useEffect } from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  withGlow?: boolean;
  withBorder?: boolean;
  alt?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * AppLogo - Official SMP Negeri 3 Kras heraldic emblem badge
 * Supports dynamic real-time logo updates from user custom upload or official presets.
 */
export default function AppLogo({
  size = 'md',
  className = '',
  withGlow = false,
  withBorder = false,
  alt = 'Logo Resmi SMP Negeri 3 Kras',
  onClick,
}: AppLogoProps) {
  const [logoSrc, setLogoSrc] = useState<string>(() => {
    return localStorage.getItem('appLogo') || '/app-logo.png';
  });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const updateLogo = (e?: any) => {
      const newLogo = e?.detail?.logo || localStorage.getItem('appLogo') || '/app-logo.png';
      setLogoSrc(newLogo);
      setHasError(false);
    };

    window.addEventListener('app-logo-updated', updateLogo);
    window.addEventListener('storage', updateLogo);

    return () => {
      window.removeEventListener('app-logo-updated', updateLogo);
      window.removeEventListener('storage', updateLogo);
    };
  }, []);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
    '2xl': 'w-24 h-24 sm:w-28 sm:h-28',
    custom: '',
  }[size];

  // Completely frameless without border or background container
  const borderClass = '';

  const glowClass = withGlow 
    ? 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:drop-shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition-all' 
    : '';

  if (hasError) {
    return (
      <div 
        onClick={onClick}
        className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-700 text-amber-300 font-bold select-none ${sizeClasses} ${className}`}
        title={alt}
      >
        <span className="text-[10px] font-mono tracking-wider">SMPN3</span>
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => {
        // Fallback to local default if custom url fails
        if (logoSrc !== '/app-logo.png') {
          setLogoSrc('/app-logo.png');
        } else {
          setHasError(true);
        }
      }}
      onClick={onClick}
      className={`object-contain select-none shrink-0 ${sizeClasses} ${borderClass} ${glowClass} ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}

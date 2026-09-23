import { useState, useEffect } from 'react';

export const THEME_EVENT = 'appThemeChanged';

export function getCurrentTheme(): string {
  if (typeof window === 'undefined') return 'high-density';
  return localStorage.getItem('themeStyle') || 'high-density';
}

export function isLightTheme(theme?: string): boolean {
  const t = theme || getCurrentTheme();
  return ['light', 'white', 'clean-light', 'paper', 'frost', 'construct', 'zen'].includes(t);
}

export function applyTheme(theme: string, colorRgb?: string, colorHex?: string) {
  if (typeof window === 'undefined') return;

  const effectiveTheme = theme || 'high-density';
  localStorage.setItem('themeStyle', effectiveTheme);

  // Set body class
  document.body.className = '';
  document.body.classList.add(`theme-${effectiveTheme}`);

  // Theme color accents
  const rgb = colorRgb || localStorage.getItem('themeColorRgb') || (isLightTheme(effectiveTheme) ? '79, 70, 229' : '99, 102, 241');
  const hex = colorHex || localStorage.getItem('themeColorHex') || (isLightTheme(effectiveTheme) ? '#4f46e5' : '#818cf8');

  localStorage.setItem('themeColorRgb', rgb);
  localStorage.setItem('themeColorHex', hex);

  document.documentElement.style.setProperty('--accent-rgb', rgb);
  document.documentElement.style.setProperty('--accent-glow', `rgba(${rgb}, ${isLightTheme(effectiveTheme) ? '0.2' : '0.4'})`);
  document.documentElement.style.setProperty('--accent-text', hex);

  // Notify listeners
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme: effectiveTheme, isLight: isLightTheme(effectiveTheme) } }));
}

export function toggleTheme(): string {
  const current = getCurrentTheme();
  const nextTheme = isLightTheme(current) ? 'high-density' : 'light';
  applyTheme(nextTheme);
  return nextTheme;
}

export function useAppTheme() {
  const [theme, setThemeState] = useState<string>(getCurrentTheme);
  const [isLight, setIsLight] = useState<boolean>(() => isLightTheme(getCurrentTheme()));

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      const activeTheme = e?.detail?.theme || getCurrentTheme();
      setThemeState(activeTheme);
      setIsLight(isLightTheme(activeTheme));
    };

    window.addEventListener(THEME_EVENT, handleThemeChange);
    window.addEventListener('storage', handleThemeChange);

    return () => {
      window.removeEventListener(THEME_EVENT, handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  const toggle = () => {
    const next = toggleTheme();
    setThemeState(next);
    setIsLight(isLightTheme(next));
  };

  const setSpecificTheme = (newTheme: string) => {
    applyTheme(newTheme);
    setThemeState(newTheme);
    setIsLight(isLightTheme(newTheme));
  };

  return {
    theme,
    isLight,
    toggle,
    setTheme: setSpecificTheme
  };
}

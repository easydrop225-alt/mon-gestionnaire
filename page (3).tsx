'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';
interface ThemeContextValue { theme: Theme; toggleTheme: () => void; }

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Fournit le mode clair/sombre à toute l'application (cf. 08_DESIGN_SYSTEM.md - Mode sombre).
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem('mg-theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored ?? (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      window.localStorage.setItem('mg-theme', next);
      return next;
    });
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé à l\'intérieur de <ThemeProvider>');
  return ctx;
}

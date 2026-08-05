'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Changer de thème"
      className="inline-flex h-9 w-9 items-center justify-center rounded border border-border bg-surface text-foreground transition-colors hover:bg-muted"
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}

'use client';

import { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

// Page de connexion — vitrine du Design System Marron / Terracotta.
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-lg">
            MG
          </div>
          <h1 className="text-xl font-semibold text-foreground">Mon Gestionnaire</h1>
          <p className="mt-1 text-sm text-muted-foreground">Connectez-vous à votre espace entreprise</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Adresse e-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.com"
                className="w-full rounded border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Se connecter <ArrowRight size={16} />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{' '}
          <a href="#" className="font-medium text-primary hover:text-primary-hover">Créer une entreprise</a>
        </p>
      </div>
    </main>
  );
}

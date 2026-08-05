'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) {
      router.push(res.isSuperAdmin ? '/platform-admin' : '/dashboard');
    } else {
      setError(res.message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <img src="/icon-192.png" alt="Mon Gestionnaire" className="mx-auto mb-4 h-14 w-14 rounded-lg" />
          <h1 className="text-xl font-semibold text-foreground">Mon Gestionnaire</h1>
          <p className="mt-1 text-sm text-muted-foreground">Connectez-vous à votre espace entreprise</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Adresse e-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
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
                required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            Se connecter
          </button>

          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{' '}
          <a href="/register" className="font-medium text-primary hover:text-primary-hover">Créer une entreprise</a>
        </p>
      </div>
    </main>
  );
}

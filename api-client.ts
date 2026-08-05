'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    tenantName: '', email: '', password: '', firstName: '', lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await register(form);
    setResult(res);
    setLoading(false);
    if (res.ok) {
      setTimeout(() => router.push('/login'), 1500);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <img src="/icon-192.png" alt="Mon Gestionnaire" className="mx-auto mb-4 h-14 w-14 rounded-lg" />
          <h1 className="text-xl font-semibold text-foreground">Créer votre entreprise</h1>
          <p className="mt-1 text-sm text-muted-foreground">14 jours d'essai gratuit, sans engagement</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              required value={form.tenantName} onChange={(e) => update('tenantName', e.target.value)}
              placeholder="Nom de votre entreprise"
              className="w-full rounded border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                required value={form.firstName} onChange={(e) => update('firstName', e.target.value)}
                placeholder="Prénom"
                className="w-full rounded border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
              />
            </div>
            <input
              required value={form.lastName} onChange={(e) => update('lastName', e.target.value)}
              placeholder="Nom"
              className="w-full rounded border border-border bg-background py-2 px-3 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              required type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
              placeholder="vous@entreprise.com"
              className="w-full rounded border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              required type="password" minLength={12} value={form.password} onChange={(e) => update('password', e.target.value)}
              placeholder="Mot de passe (12 caractères min.)"
              className="w-full rounded border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            Créer mon entreprise
          </button>
        </form>

        {result && (
          <p className={`mt-4 text-center text-sm ${result.ok ? 'text-success' : 'text-destructive'}`}>
            {result.message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà un compte ? <a href="/login" className="font-medium text-primary hover:text-primary-hover">Se connecter</a>
        </p>
      </div>
    </main>
  );
}

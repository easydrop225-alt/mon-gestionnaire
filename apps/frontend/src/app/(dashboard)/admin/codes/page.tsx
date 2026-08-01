'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, Copy, Check } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const DURATIONS = [
  { code: 'MONTHLY', label: 'Mensuel' },
  { code: 'THREE_MONTHS', label: '3 mois' },
  { code: 'SIX_MONTHS', label: '6 mois' },
  { code: 'TWELVE_MONTHS', label: '1 an' },
  { code: 'LIFETIME', label: 'Accès à vie' },
];
const PLANS = [
  { code: 'STARTER', label: 'Starter' },
  { code: 'PRO', label: 'Pro' },
  { code: 'ENTERPRISE', label: 'Enterprise' },
];

export default function AdminCodesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [plan, setPlan] = useState('PRO');
  const [duration, setDuration] = useState('SIX_MONTHS');
  const [quantity, setQuantity] = useState('10');
  const [priceFcfa, setPriceFcfa] = useState('');
  const [soldChannel, setSoldChannel] = useState('Vente en personne');
  const [generating, setGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setGeneratedCodes([]);
    const { ok, body } = await apiFetch<{ codes: string[] }>('/access-codes/generate', {
      method: 'POST',
      body: JSON.stringify({
        plan, duration, quantity: Number(quantity),
        priceFcfa: priceFcfa ? Number(priceFcfa) : undefined,
        soldChannel: soldChannel || undefined,
      }),
    });
    setGenerating(false);
    if (ok) {
      setGeneratedCodes(body.data.codes);
    } else {
      setError(body.message ?? "Impossible de générer les codes (vérifie que ton compte a la permission licenses.manage).");
    }
  }

  function copyCode(code: string, index: number) {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  function copyAll() {
    navigator.clipboard.writeText(generatedCodes.join('\n'));
  }

  if (isLoading || !isAuthenticated) return null;

  return (
    <DashboardShell>
      <div className="p-6">
        <h1 className="mb-1 text-lg font-semibold text-foreground">Générer des codes d'accès</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Ces codes se vendent hors application (transfert Wave/Orange Money, en personne...). Le décompte démarre à l'activation, pas à la génération.
        </p>

        <form onSubmit={handleGenerate} className="mb-6 grid grid-cols-1 gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Plan</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2">
              {PLANS.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Durée</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2">
              {DURATIONS.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Quantité</label>
            <input type="number" min="1" max="1000" value={quantity} onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Prix de vente (FCFA, optionnel)</label>
            <input type="number" min="0" value={priceFcfa} onChange={(e) => setPriceFcfa(e.target.value)}
              placeholder="ex: 35000"
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2" />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Canal de vente (optionnel)</label>
            <input value={soldChannel} onChange={(e) => setSoldChannel(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2" />
          </div>

          <button type="submit" disabled={generating}
            className="flex items-center justify-center gap-2 rounded bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:col-span-2 disabled:opacity-60">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            Générer les codes
          </button>

          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
        </form>

        {generatedCodes.length > 0 && (
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">{generatedCodes.length} code(s) généré(s)</h2>
              <button onClick={copyAll} className="text-xs font-medium text-primary hover:text-primary-hover">
                Copier tous les codes
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {generatedCodes.map((code, i) => (
                <button
                  key={code} onClick={() => copyCode(code, i)}
                  className="flex items-center justify-between rounded border border-border bg-background px-3 py-2 text-left font-mono text-xs text-foreground hover:border-primary/50"
                >
                  {code}
                  {copiedIndex === i ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-muted-foreground" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

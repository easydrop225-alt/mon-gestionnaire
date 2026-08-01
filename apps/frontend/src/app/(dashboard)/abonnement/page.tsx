'use client';

import { useState } from 'react';
import { KeyRound, CheckCircle2, Loader2, Infinity as InfinityIcon } from 'lucide-react';

// Page d'abonnement : activation par code d'accès uniquement (3 mois / 6 mois /
// 12 mois / à vie). Le paiement en ligne (CinetPay) sera ajouté plus tard.
export default function AbonnementPage() {
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleRedeem() {
    setRedeeming(true);
    setResult(null);
    try {
      const res = await fetch('/api/v1/access-codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      setResult({
        ok: res.ok && json?.success !== false,
        message: json?.message ?? json?.data?.message ?? 'Une erreur est survenue.',
      });
    } catch {
      setResult({ ok: false, message: 'Impossible de contacter le serveur. Réessayez.' });
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KeyRound size={22} />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Activer votre abonnement</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Entrez le code d'accès reçu lors de votre achat (3 mois, 6 mois, 12 mois ou accès à vie).
          </p>
        </div>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="MG-XXXX-XXXX-XXXX"
          className="mb-3 w-full rounded border border-border bg-background px-3 py-2.5 text-center text-sm tracking-wider text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
        />

        <button
          onClick={handleRedeem}
          disabled={redeeming || code.length < 10}
          className="flex w-full items-center justify-center gap-2 rounded bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {redeeming ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          Activer le code
        </button>

        {result && (
          <p className={`mt-4 text-center text-sm ${result.ok ? 'text-success' : 'text-destructive'}`}>
            {result.message}
          </p>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 rounded border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
          <InfinityIcon size={14} />
          Un code "Accès à vie" ne peut être utilisé qu'une seule fois, par une seule boutique.
        </div>
      </div>
    </div>
  );
}

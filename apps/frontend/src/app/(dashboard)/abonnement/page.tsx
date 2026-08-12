'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, CheckCircle2, Loader2, Infinity as InfinityIcon } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';

export default function AbonnementPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  async function handleRedeem() {
    setRedeeming(true);
    setResult(null);
    const { ok, body } = await apiFetch<{ message: string }>('/access-codes/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    setResult({ ok, message: body.message ?? (ok ? 'OK' : 'Error') });
    setRedeeming(false);
  }

  if (isLoading || !isAuthenticated) return null;

  return (
    <DashboardShell>
      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound size={22} />
            </div>
            <h1 className="text-lg font-semibold text-foreground">{t('subscription_title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('subscription_subtitle')}</p>
          </div>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t('subscription_placeholder')}
            className="mb-3 w-full rounded border border-border bg-background px-3 py-2.5 text-center text-sm tracking-wider text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
          />

          <button
            onClick={handleRedeem}
            disabled={redeeming || code.length < 10}
            className="flex w-full items-center justify-center gap-2 rounded bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {redeeming ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {t('subscription_activate')}
          </button>

          {result && (
            <p className={`mt-4 text-center text-sm ${result.ok ? 'text-success' : 'text-destructive'}`}>
              {result.message}
            </p>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 rounded border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            <InfinityIcon size={14} />
            {t('subscription_lifetime_note')}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

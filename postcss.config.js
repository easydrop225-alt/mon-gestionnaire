'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Users, TrendingUp, Truck, Infinity as InfinityIcon } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface License {
  plan: string;
  status: string;
  seats: number;
  seatsUsed: number;
  isLifetime: boolean;
  currentPeriodEnd: string | null;
}

const PLAN_LABELS: Record<string, string> = { TRIAL: 'Essai', STARTER: 'Starter', PRO: 'Pro', ENTERPRISE: 'Enterprise' };
const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'Essai en cours', ACTIVE: 'Actif', PAST_DUE: 'Paiement en retard', SUSPENDED: 'Suspendu', CANCELLED: 'Annulé',
};

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [license, setLicense] = useState<License | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiFetch<License>('/licenses/me').then(({ ok, body }) => { if (ok) setLicense(body.data); });
    apiFetch<any[]>('/products').then(({ ok, body }) => { if (ok) setProductCount(body.data.length); });
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) return null;

  const stats = [
    { label: 'Produits actifs', value: productCount ?? '—', icon: Package },
    { label: 'Clients', value: '—', icon: Users },
    { label: 'Ventes (mois)', value: '—', icon: TrendingUp },
    { label: 'Livraisons en cours', value: '—', icon: Truck },
  ];

  return (
    <DashboardShell>
      <div className="p-6">
        <h1 className="mb-6 text-lg font-semibold text-foreground">Tableau de bord</h1>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-lg border border-border bg-surface p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-accent/20 text-accent">
                <Icon size={20} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Licence de l'entreprise</h2>
          {!license ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <div className="flex items-center justify-between rounded border border-border bg-background p-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  Plan {PLAN_LABELS[license.plan] ?? license.plan}
                  {license.isLifetime && <InfinityIcon size={14} className="text-primary" />}
                  {' — '}{license.seatsUsed}/{license.seats} sièges utilisés
                </p>
                <p className="text-xs text-muted-foreground">
                  {license.isLifetime
                    ? 'Accès à vie — aucune expiration'
                    : license.currentPeriodEnd
                      ? `Renouvellement le ${new Date(license.currentPeriodEnd).toLocaleDateString('fr-FR')}`
                      : "Aucune période active"}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  license.status === 'ACTIVE' || license.status === 'TRIAL'
                    ? 'bg-success/15 text-success'
                    : 'bg-destructive/15 text-destructive'
                }`}
              >
                {STATUS_LABELS[license.status] ?? license.status}
              </span>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

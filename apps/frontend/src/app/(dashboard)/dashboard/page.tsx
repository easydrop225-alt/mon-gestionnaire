'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Users, TrendingUp, Truck, Infinity as InfinityIcon } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';

interface License {
  plan: string;
  status: string;
  seats: number;
  seatsUsed: number;
  isLifetime: boolean;
  currentPeriodEnd: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t, language } = useI18n();
  const [license, setLicense] = useState<License | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);

  const PLAN_LABELS: Record<string, string> = {
    TRIAL: t('status_trial'), STARTER: t('plan_starter'), PRO: t('plan_pro'), ENTERPRISE: t('plan_enterprise'),
  };
  const STATUS_LABELS: Record<string, string> = {
    TRIAL: t('status_trial'), ACTIVE: t('status_active'), PAST_DUE: t('status_past_due'),
    SUSPENDED: t('status_suspended'), CANCELLED: t('status_cancelled'),
  };

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
    { label: t('dashboard_active_products'), value: productCount ?? '—', icon: Package },
    { label: t('dashboard_clients'), value: '—', icon: Users },
    { label: t('dashboard_sales_month'), value: '—', icon: TrendingUp },
    { label: t('dashboard_deliveries'), value: '—', icon: Truck },
  ];

  return (
    <DashboardShell>
      <div className="p-6">
        <h1 className="mb-6 text-lg font-semibold text-foreground">{t('dashboard_title')}</h1>

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
          <h2 className="mb-3 text-sm font-semibold text-foreground">{t('dashboard_license_title')}</h2>
          {!license ? (
            <p className="text-sm text-muted-foreground">{t('dashboard_loading')}</p>
          ) : (
            <div className="flex items-center justify-between rounded border border-border bg-background p-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {PLAN_LABELS[license.plan] ?? license.plan}
                  {license.isLifetime && <InfinityIcon size={14} className="text-primary" />}
                  {' — '}{license.seatsUsed}/{license.seats} {t('dashboard_seats_used')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {license.isLifetime
                    ? t('dashboard_lifetime')
                    : license.currentPeriodEnd
                      ? `${t('dashboard_renewal')} ${new Date(license.currentPeriodEnd).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}`
                      : t('dashboard_no_period')}
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

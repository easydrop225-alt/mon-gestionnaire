'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Check } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';

export default function ParametresPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { language, setLanguage, t } = useI18n();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  return (
    <DashboardShell>
      <div className="p-6">
        <h1 className="mb-6 text-lg font-semibold text-foreground">{t('settings_title')}</h1>

        <div className="max-w-md rounded-lg border border-border bg-surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">{t('settings_language')}</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{t('settings_language_desc')}</p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { code: 'fr' as const, label: 'Français' },
              { code: 'en' as const, label: 'English' },
            ].map((opt) => (
              <button
                key={opt.code}
                onClick={() => setLanguage(opt.code)}
                className={`flex items-center justify-between rounded border px-4 py-2.5 text-sm transition-colors ${
                  language === opt.code
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-border text-foreground hover:border-primary/50'
                }`}
              >
                {opt.label}
                {language === opt.code && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

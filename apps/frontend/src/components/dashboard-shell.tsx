'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, CreditCard, LogOut, Settings, HelpCircle } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { t } = useI18n();

  const NAV_ITEMS = [
    { href: '/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { href: '/produits', label: t('nav_products'), icon: Package },
    { href: '/abonnement', label: t('nav_subscription'), icon: CreditCard },
    { href: '/parametres', label: t('nav_settings'), icon: Settings },
    { href: '/aide', label: t('nav_help'), icon: HelpCircle },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 flex-col border-r border-border bg-surface p-4">
        <div className="mb-8 flex items-center gap-2 px-2">
          <img src="/icon-192.png" alt="Mon Gestionnaire" className="h-8 w-8 rounded" />
          <span className="text-sm font-semibold text-foreground">Mon Gestionnaire</span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-2.5 rounded px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut size={16} />
          {t('nav_logout')}
        </button>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-end border-b border-border bg-surface px-6 py-3">
          <ThemeToggle />
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

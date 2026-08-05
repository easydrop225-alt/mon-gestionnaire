'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, CreditCard, LogOut } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/produits', label: 'Produits', icon: Package },
  { href: '/abonnement', label: 'Abonnement', icon: CreditCard },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();

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
          Se déconnecter
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

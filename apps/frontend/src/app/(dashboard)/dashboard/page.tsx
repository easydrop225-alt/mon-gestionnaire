import { Package, Users, TrendingUp, Truck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const stats = [
  { label: 'Produits actifs', value: '1 284', icon: Package },
  { label: 'Clients', value: '342', icon: Users },
  { label: 'Ventes (mois)', value: '8 450 000 F', icon: TrendingUp },
  { label: 'Livraisons en cours', value: '17', icon: Truck },
];

// Aperçu du Design System sur un écran type (cartes, palette Marron/Terracotta, dark mode).
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">Tableau de bord</h1>
        <ThemeToggle />
      </header>

      <main className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded bg-accent/20 text-accent">
              <Icon size={20} className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
          </div>
        ))}

        <div className="col-span-full rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Licence de l'entreprise</h2>
          <div className="flex items-center justify-between rounded border border-border bg-background p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Plan Pro — 5/10 sièges utilisés</p>
              <p className="text-xs text-muted-foreground">Renouvellement le 15 septembre 2026</p>
            </div>
            <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">Actif</span>
          </div>
        </div>
      </main>
    </div>
  );
}

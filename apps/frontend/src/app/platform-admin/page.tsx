'use client';

import { useState } from 'react';
import { ShieldCheck, Loader2, Save, Users, Package } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  license: {
    plan: string;
    status: string;
    seats: number;
    seatsUsed: number;
    isLifetime: boolean;
    currentPeriodEnd: string | null;
  } | null;
  _count: { users: number; products: number };
}

/**
 * Console d'administration PLATEFORME (toi uniquement) — protégée par un
 * secret séparé (PLATFORM_ADMIN_SECRET), pas par un compte utilisateur normal.
 * Ne jamais partager l'URL /platform-admin ni le code secret.
 */
export default function PlatformAdminPage() {
  const [secret, setSecret] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  async function unlock() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/v1/admin/tenants', { headers: { 'x-admin-secret': secret } });
    if (!res.ok) {
      setError('Code secret incorrect ou accès refusé.');
      setLoading(false);
      return;
    }
    const json = await res.json();
    setTenants(json.data);
    setUnlocked(true);
    setLoading(false);
  }

  function startEdit(tenant: TenantRow) {
    setEditingId(tenant.id);
    setForm({
      plan: tenant.license?.plan ?? 'STARTER',
      status: tenant.license?.status ?? 'ACTIVE',
      seats: tenant.license?.seats ?? 1,
      isLifetime: tenant.license?.isLifetime ?? false,
      currentPeriodEnd: tenant.license?.currentPeriodEnd
        ? tenant.license.currentPeriodEnd.slice(0, 10)
        : '',
    });
  }

  async function saveEdit(tenantId: string) {
    setSavingId(tenantId);
    const body: Record<string, any> = {
      plan: form.plan,
      status: form.status,
      seats: Number(form.seats),
      isLifetime: form.isLifetime,
    };
    if (!form.isLifetime && form.currentPeriodEnd) {
      body.currentPeriodEnd = new Date(form.currentPeriodEnd).toISOString();
    }

    const res = await fetch(`/api/v1/admin/tenants/${tenantId}/license`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify(body),
    });
    setSavingId(null);
    if (res.ok) {
      setEditingId(null);
      unlock(); // recharge la liste à jour
    }
  }

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="absolute right-6 top-6"><ThemeToggle /></div>
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
          <div className="mb-6 text-center">
            <ShieldCheck size={28} className="mx-auto mb-3 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Administration plateforme</h1>
            <p className="mt-1 text-sm text-muted-foreground">Accès réservé — code secret requis</p>
          </div>
          <input
            type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
            placeholder="Code secret administrateur"
            className="mb-3 w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
          />
          <button
            onClick={unlock} disabled={loading || !secret}
            className="flex w-full items-center justify-center gap-2 rounded bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            Déverrouiller
          </button>
          {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Entreprises & abonnements</h1>
          <ThemeToggle />
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Entreprise</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Sièges</th>
                <th className="px-4 py-3 font-medium">Expiration</th>
                <th className="px-4 py-3 font-medium">Données</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 align-top">
                  <td className="px-4 py-3 text-foreground">{t.name}</td>

                  {editingId === t.id ? (
                    <>
                      <td className="px-4 py-3">
                        <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}
                          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground">
                          <option value="STARTER">Starter</option>
                          <option value="PRO">Pro</option>
                          <option value="ENTERPRISE">Enterprise</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground">
                          <option value="TRIAL">Essai</option>
                          <option value="ACTIVE">Actif</option>
                          <option value="PAST_DUE">Paiement en retard</option>
                          <option value="SUSPENDED">Suspendu</option>
                          <option value="CANCELLED">Annulé</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" min={1} value={form.seats}
                          onChange={(e) => setForm({ ...form, seats: e.target.value })}
                          className="w-16 rounded border border-border bg-background px-2 py-1 text-xs text-foreground" />
                      </td>
                      <td className="px-4 py-3">
                        <label className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <input type="checkbox" checked={form.isLifetime}
                            onChange={(e) => setForm({ ...form, isLifetime: e.target.checked })} />
                          À vie
                        </label>
                        {!form.isLifetime && (
                          <input type="date" value={form.currentPeriodEnd}
                            onChange={(e) => setForm({ ...form, currentPeriodEnd: e.target.value })}
                            className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {t._count.users} util. · {t._count.products} prod.
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => saveEdit(t.id)} disabled={savingId === t.id}
                          className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
                          {savingId === t.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          Enregistrer
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-foreground">{t.license?.plan ?? '—'}</td>
                      <td className="px-4 py-3 text-foreground">{t.license?.status ?? '—'}</td>
                      <td className="px-4 py-3 text-foreground">{t.license?.seatsUsed ?? 0}/{t.license?.seats ?? 0}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {t.license?.isLifetime ? 'À vie' : t.license?.currentPeriodEnd
                          ? new Date(t.license.currentPeriodEnd).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users size={12} />{t._count.users}</span>
                        <span className="flex items-center gap-1"><Package size={12} />{t._count.products}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => startEdit(t)} className="text-xs font-medium text-primary hover:text-primary-hover">
                          Modifier
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Réactiver un abonnement expiré (statut → Actif, ou changer la date d'expiration) restaure
          l'accès complet : aucune donnée de l'entreprise (produits, utilisateurs...) n'est jamais supprimée.
        </p>
      </div>
    </div>
  );
}

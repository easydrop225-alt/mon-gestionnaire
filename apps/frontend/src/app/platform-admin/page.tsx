'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, Loader2, Save, Users, Package, Search, Building2,
  KeyRound, DollarSign, Copy, Check, UserPlus, HelpCircle, Layers, Activity, Infinity as InfinityIcon,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api-client';

const PLANS = [
  { code: 'STARTER', label: 'Starter' },
  { code: 'PRO', label: 'Pro' },
  { code: 'ENTERPRISE', label: 'Enterprise' },
];
const DURATIONS = [
  { code: 'MONTHLY', label: 'Mensuel' },
  { code: 'THREE_MONTHS', label: '3 mois' },
  { code: 'SIX_MONTHS', label: '6 mois' },
  { code: 'TWELVE_MONTHS', label: '12 mois' },
  { code: 'CUSTOM', label: 'Personnalisé' },
  { code: 'LIFETIME', label: 'Accès à vie' },
];
const PRICING_DURATIONS = DURATIONS.filter((d) => d.code !== 'CUSTOM');
const STATUS_OPTIONS = [
  { code: '', label: 'Tous les statuts' },
  { code: 'TRIAL', label: 'Essai' },
  { code: 'ACTIVE', label: 'Actif' },
  { code: 'PAST_DUE', label: 'Paiement en retard' },
  { code: 'SUSPENDED', label: 'Suspendu' },
  { code: 'CANCELLED', label: 'Annulé' },
];

interface TenantRow {
  id: string; name: string; slug: string; status: string;
  license: {
    plan: string; status: string; seats: number; seatsUsed: number;
    isLifetime: boolean; currentPeriodEnd: string | null;
  } | null;
  _count: { users: number; products: number };
}

export default function PlatformAdminPage() {
  const router = useRouter();
  const { isAuthenticated, isSuperAdmin, isLoading, logout } = useAuth();
  const [tab, setTab] = useState<'tenants' | 'codes' | 'pricing' | 'account' | 'help'>('tenants');

  useEffect(() => {
    if (isLoading) return;
    // Un compte normal (non super admin) n'a rien à faire ici.
    if (isAuthenticated && !isSuperAdmin) { router.replace('/dashboard'); }
  }, [isLoading, isAuthenticated, isSuperAdmin, router]);

  if (isLoading) return null;
  if (isAuthenticated && !isSuperAdmin) return null;

  // Pas encore connecté : seule la création d'un premier compte Super Admin
  // est proposée (protégée par le code secret) — pas d'accès à la console.
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="absolute right-6 top-6"><ThemeToggle /></div>
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <ShieldCheck size={28} className="mx-auto mb-3 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Créer votre compte administrateur</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Première utilisation : crée ton compte personnel, puis connecte-toi normalement sur{' '}
              <a href="/login" className="font-medium text-primary hover:text-primary-hover">/login</a>.
            </p>
          </div>
          <AccountTab />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Console administrateur</h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground">Déconnexion</button>
        </div>
      </header>

      <nav className="flex gap-1 border-b border-border bg-surface px-6">
        {[
          { id: 'tenants', label: 'Entreprises', icon: Building2 },
          { id: 'codes', label: "Codes d'accès", icon: KeyRound },
          { id: 'pricing', label: 'Tarifs', icon: DollarSign },
          { id: 'account', label: 'Comptes admin', icon: UserPlus },
          { id: 'help', label: 'Aide', icon: HelpCircle },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id as any)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </nav>

      <div className="p-6">
        {tab === 'tenants' && <TenantsTab />}
        {tab === 'codes' && <CodesTab />}
        {tab === 'pricing' && <PricingTab />}
        {tab === 'account' && <AccountTab />}
        {tab === 'help' && <HelpTab />}
      </div>
    </div>
  );
}

// ============================================================================
// ONGLET COMPTES ADMIN — créer un compte Super Admin personnel
// ============================================================================
function AccountTab() {
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/v1/auth/register-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': bootstrapSecret },
        body: JSON.stringify(form),
      });
      const text = await res.text();
      let json: any = {};
      try { json = text ? JSON.parse(text) : {}; } catch { json = { message: text.slice(0, 300) }; }

      setResult({ ok: res.ok, message: json.message ?? (res.ok ? 'Compte créé.' : `Échec (code ${res.status}).`) });
      if (res.ok) setForm({ email: '', password: '', firstName: '', lastName: '' });
    } catch (err: any) {
      setResult({ ok: false, message: `Impossible de contacter le serveur : ${err?.message ?? 'erreur réseau'}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-4 text-sm text-muted-foreground">
        Crée un compte administrateur personnel (e-mail + mot de passe), totalement séparé
        des entreprises clientes. Une fois créé, connecte-toi via l'onglet "Mon compte" à l'écran d'accueil.
      </p>
      <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-border bg-surface p-5">
        <input type="password" required value={bootstrapSecret} onChange={(e) => setBootstrapSecret(e.target.value)}
          placeholder="Code secret plateforme (pour autoriser la création)"
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2" />
        <div className="grid grid-cols-2 gap-2">
          <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="Prénom"
            className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2" />
          <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Nom"
            className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2" />
        </div>
        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="E-mail personnel"
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2" />
        <input required type="password" minLength={12} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Mot de passe (12 caractères min.)"
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2" />
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Créer le compte
        </button>
        {result && <p className={`text-center text-sm ${result.ok ? 'text-success' : 'text-destructive'}`}>{result.message}</p>}
      </form>
    </div>
  );
}

// ============================================================================
// ONGLET ENTREPRISES
// ============================================================================
function TenantsTab() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (planFilter) params.set('plan', planFilter);
    const { body } = await apiFetch<{ tenants: TenantRow[]; summary: Record<string, number> }>(`/admin/tenants?${params.toString()}`);
    setTenants(body.data?.tenants ?? []);
    setSummary(body.data?.summary ?? null);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(t: TenantRow) {
    setEditingId(t.id);
    setForm({
      plan: t.license?.plan ?? 'STARTER',
      status: t.license?.status ?? 'ACTIVE',
      seats: t.license?.seats ?? 1,
      isLifetime: t.license?.isLifetime ?? false,
      duration: 'MONTHLY',
      customDays: 30,
      activationDate: new Date().toISOString().slice(0, 10),
    });
  }

  async function saveEdit(tenantId: string) {
    setSavingId(tenantId);
    const body: Record<string, any> = {
      plan: form.plan, status: form.status, seats: Number(form.seats), isLifetime: form.isLifetime,
    };
    if (!form.isLifetime) {
      body.duration = form.duration;
      if (form.duration === 'CUSTOM') body.customDays = Number(form.customDays);
      body.activationDate = new Date(form.activationDate).toISOString();
    }
    await apiFetch(`/admin/tenants/${tenantId}/license`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    setSavingId(null);
    setEditingId(null);
    load();
  }

  return (
    <div>
      {summary && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'Entreprises', value: summary.total },
            { label: 'Actifs', value: summary.active },
            { label: 'Essai', value: summary.trial },
            { label: 'Retard/Suspendu', value: summary.pastDueOrSuspended },
            { label: 'À vie', value: summary.lifetime },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-surface p-3 text-center">
              <p className="text-xl font-semibold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Rechercher une entreprise..."
            className="w-full rounded border border-border bg-surface py-2 pl-8 pr-3 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground">
          {STATUS_OPTIONS.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
        </select>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground">
          <option value="">Tous les plans</option>
          {PLANS.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
        </select>
        <button onClick={load} className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
          Filtrer
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
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
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Chargement...</td></tr>
            ) : tenants.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Aucune entreprise trouvée.</td></tr>
            ) : tenants.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 align-top">
                <td className="px-4 py-3 text-foreground">{t.name}</td>
                {editingId === t.id ? (
                  <>
                    <td className="px-4 py-3">
                      <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}
                        className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground">
                        {PLANS.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground">
                        {STATUS_OPTIONS.filter((s) => s.code).map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" min={1} value={form.seats}
                        onChange={(e) => setForm({ ...form, seats: e.target.value })}
                        className="w-16 rounded border border-border bg-background px-2 py-1 text-xs text-foreground" />
                    </td>
                    <td className="px-4 py-3 space-y-1">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <input type="checkbox" checked={form.isLifetime}
                          onChange={(e) => setForm({ ...form, isLifetime: e.target.checked })} />
                        Accès à vie
                      </label>
                      {!form.isLifetime && (
                        <>
                          <select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground">
                            {DURATIONS.filter((d) => d.code !== 'LIFETIME').map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
                          </select>
                          {form.duration === 'CUSTOM' && (
                            <input type="number" min={1} placeholder="Jours" value={form.customDays}
                              onChange={(e) => setForm({ ...form, customDays: e.target.value })}
                              className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground" />
                          )}
                          <div>
                            <label className="text-[10px] text-muted-foreground">Date d'activation</label>
                            <input type="date" value={form.activationDate}
                              onChange={(e) => setForm({ ...form, activationDate: e.target.value })}
                              className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground" />
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t._count.users} util. · {t._count.products} prod.</td>
                    <td className="px-4 py-3">
                      <button onClick={() => saveEdit(t.id)} disabled={savingId === t.id}
                        className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
                        {savingId === t.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Enregistrer
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-foreground">{t.license?.plan ?? '—'}</td>
                    <td className="px-4 py-3 text-foreground">{t.license?.status ?? '—'}</td>
                    <td className="px-4 py-3 text-foreground">{t.license?.seatsUsed ?? 0}/{t.license?.seats ?? 0}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {t.license?.isLifetime ? 'À vie' : t.license?.currentPeriodEnd ? new Date(t.license.currentPeriodEnd).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users size={12} />{t._count.users}</span>
                      <span className="flex items-center gap-1"><Package size={12} />{t._count.products}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEdit(t)} className="text-xs font-medium text-primary hover:text-primary-hover">Modifier</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Réactiver un abonnement expiré ne touche que la licence : aucune donnée de l'entreprise
        (produits, utilisateurs...) n'est jamais supprimée entre-temps.
      </p>
    </div>
  );
}

// ============================================================================
// ONGLET CODES D'ACCÈS
// ============================================================================
function CodesTab() {
  const [plan, setPlan] = useState('PRO');
  const [duration, setDuration] = useState('SIX_MONTHS');
  const [customDays, setCustomDays] = useState('30');
  const [quantity, setQuantity] = useState('10');
  const [priceFcfa, setPriceFcfa] = useState('');
  const [soldChannel, setSoldChannel] = useState('Vente en personne');
  const [generating, setGenerating] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true); setError(null); setCodes([]);
    const { ok, body } = await apiFetch<{ codes: string[] }>('/admin/access-codes/generate', {
      method: 'POST',
      body: JSON.stringify({
        plan, duration, customDays: duration === 'CUSTOM' ? Number(customDays) : undefined,
        quantity: Number(quantity), priceFcfa: priceFcfa ? Number(priceFcfa) : undefined,
        soldChannel: soldChannel || undefined,
      }),
    });
    setGenerating(false);
    if (ok) setCodes(body.data.codes);
    else setError(body.message ?? 'Impossible de générer les codes.');
  }

  function copyCode(code: string, i: number) {
    navigator.clipboard.writeText(code); setCopiedIndex(i); setTimeout(() => setCopiedIndex(null), 1500);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-4 text-sm text-muted-foreground">
        Ces codes se vendent hors application. Le décompte démarre à l'activation, pas à la génération.
      </p>

      <form onSubmit={handleGenerate} className="mb-6 grid grid-cols-1 gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Plan</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground">
            {PLANS.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Durée</label>
          <select value={duration} onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground">
            {DURATIONS.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
          </select>
        </div>
        {duration === 'CUSTOM' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Nombre de jours</label>
            <input type="number" min={1} value={customDays} onChange={(e) => setCustomDays(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground" />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Quantité</label>
          <input type="number" min={1} max={1000} value={quantity} onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Prix de vente (FCFA)</label>
          <input type="number" min={0} value={priceFcfa} onChange={(e) => setPriceFcfa(e.target.value)}
            placeholder="ex: 35000"
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-foreground">Canal de vente (optionnel)</label>
          <input value={soldChannel} onChange={(e) => setSoldChannel(e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </div>
        <button type="submit" disabled={generating}
          className="flex items-center justify-center gap-2 rounded bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover sm:col-span-2 disabled:opacity-60">
          {generating ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Générer les codes
        </button>
        {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      </form>

      {codes.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">{codes.length} code(s) généré(s)</h2>
            <button onClick={() => navigator.clipboard.writeText(codes.join('\n'))}
              className="text-xs font-medium text-primary hover:text-primary-hover">Copier tous les codes</button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {codes.map((code, i) => (
              <button key={code} onClick={() => copyCode(code, i)}
                className="flex items-center justify-between rounded border border-border bg-background px-3 py-2 text-left font-mono text-xs text-foreground hover:border-primary/50">
                {code}
                {copiedIndex === i ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-muted-foreground" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ONGLET TARIFS
// ============================================================================
function PricingTab() {
  const [rows, setRows] = useState<{ plan: string; duration: string; priceFcfa: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { body } = await apiFetch<typeof rows>('/admin/pricing');
    setRows(body.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function savePrice(plan: string, duration: string, priceFcfa: string) {
    const key = `${plan}_${duration}`;
    setSavingKey(key);
    await apiFetch('/admin/pricing', {
      method: 'PATCH',
      body: JSON.stringify({ plan, duration, priceFcfa: Number(priceFcfa) }),
    });
    setSavingKey(null);
    load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-4 text-sm text-muted-foreground">
        Prix par défaut affichés lors de la génération de codes — toujours modifiables au cas par cas.
      </p>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Plan</th>
              {PRICING_DURATIONS.map((d) => <th key={d.code} className="px-4 py-3 font-medium">{d.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {PLANS.map((p) => (
              <tr key={p.code} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">{p.label}</td>
                {PRICING_DURATIONS.map((d) => {
                  const row = rows.find((r) => r.plan === p.code && r.duration === d.code);
                  const key = `${p.code}_${d.code}`;
                  return (
                    <td key={d.code} className="px-4 py-3">
                      <input
                        type="number" min={0} defaultValue={row?.priceFcfa ?? ''}
                        placeholder="—"
                        onBlur={(e) => e.target.value && savePrice(p.code, d.code, e.target.value)}
                        className="w-24 rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
                      />
                      {savingKey === key && <Loader2 size={12} className="ml-1 inline animate-spin text-muted-foreground" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// ONGLET AIDE — explication détaillée de chaque élément (côté admin)
// ============================================================================
function HelpTab() {
  return (
    <div className="mx-auto max-w-3xl">
      <AdminSection icon={Layers} title="Les plans (Starter / Pro / Enterprise)">
        <p>
          Le plan détermine les fonctionnalités et le nombre de sièges accordés à une entreprise
          lorsqu'elle active un code d'accès ou paie un abonnement.
        </p>
        <ul className="mt-2 space-y-1.5 list-disc pl-5">
          <li><strong>Starter</strong> — 3 sièges. Produits, stock, clients (fonctions de base).</li>
          <li><strong>Pro</strong> — 10 sièges. Ajoute synchronisation Google Sheets/Excel + rapports avancés.</li>
          <li><strong>Enterprise</strong> — 50 sièges. Ajoute SSO + export du journal d'audit.</li>
        </ul>
      </AdminSection>

      <AdminSection icon={Users} title="Sièges (seats / seatsUsed)">
        <p>
          <strong>Sièges</strong> = nombre maximum d'utilisateurs autorisés pour cette entreprise
          (défini par son plan). <strong>Sièges utilisés</strong> = nombre de comptes déjà créés.
          Tu peux ajuster manuellement ce nombre dans l'onglet Entreprises si un client négocie un
          nombre de sièges différent du standard de son plan.
        </p>
      </AdminSection>

      <AdminSection icon={Activity} title="Statuts de licence">
        <ul className="space-y-2">
          <li><strong>TRIAL (Essai)</strong> — période de découverte gratuite, 14 jours par défaut à l'inscription.</li>
          <li><strong>ACTIVE (Actif)</strong> — abonnement payé et à jour, accès complet.</li>
          <li><strong>PAST_DUE (Paiement en retard)</strong> — à utiliser si un renouvellement traîne, sans couper l'accès immédiatement.</li>
          <li><strong>SUSPENDED (Suspendu)</strong> — bloque l'accès à l'API pour cette entreprise. Ses données restent intactes.</li>
          <li><strong>CANCELLED (Annulé)</strong> — abonnement résilié. Les données restent conservées, réactivable à tout moment.</li>
        </ul>
      </AdminSection>

      <AdminSection icon={KeyRound} title="Durées et date d'activation">
        <p className="mb-2">
          <strong>Mensuel / 3 mois / 6 mois / 12 mois</strong> — durées standards, calculées en jours
          (30/90/180/365) à partir de la date d'activation.
        </p>
        <p className="mb-2">
          <strong>Personnalisé</strong> — tu précises toi-même le nombre de jours exact (utile pour un
          forfait sur-mesure négocié avec un client).
        </p>
        <p>
          <strong>Date d'activation</strong> (dans l'édition d'une entreprise) — par défaut aujourd'hui,
          mais modifiable : utile pour antidater un paiement reçu hors application (ex: reçu la semaine
          dernière) ou programmer une activation future.
        </p>
      </AdminSection>

      <AdminSection icon={InfinityIcon} title="Accès à vie">
        <p>
          N'expire jamais (<code>currentPeriodEnd</code> = null, <code>isLifetime</code> = true). Un
          code "Accès à vie" ne peut être activé qu'une seule fois, de façon permanente et
          irréversible pour l'entreprise qui l'active — vérifie bien l'identité du client avant
          d'en distribuer, la valeur est élevée.
        </p>
      </AdminSection>

      <AdminSection icon={DollarSign} title="Tarifs (onglet Tarifs)">
        <p>
          Grille de prix par défaut (plan x durée) affichée pour t'aider lors de la génération de
          codes — un simple repère, tu peux toujours saisir un prix différent au cas par cas dans
          l'onglet Codes d'accès.
        </p>
      </AdminSection>

      <AdminSection icon={ShieldCheck} title="Garantie : aucune perte de données">
        <p>
          Modifier ou même annuler l'abonnement d'une entreprise (onglet Entreprises) ne touche
          JAMAIS à ses produits, utilisateurs ou historique. Seule la ligne de licence est modifiée.
          Réactiver un abonnement — même après plusieurs mois d'inactivité — restaure l'accès complet
          aux données existantes, intactes.
        </p>
      </AdminSection>
    </div>
  );
}

function AdminSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-lg border border-border bg-surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={17} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

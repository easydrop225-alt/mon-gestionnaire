'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2, Package } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard-shell';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  priceFcfa: number;
  stockQuantity: number;
  status: string;
}

export default function ProduitsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t, language } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', priceFcfa: '', stockQuantity: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  async function loadProducts() {
    setLoadingList(true);
    const { ok, body } = await apiFetch<Product[]>('/products');
    if (ok) setProducts(body.data);
    setLoadingList(false);
  }

  useEffect(() => {
    if (isAuthenticated) loadProducts();
  }, [isAuthenticated]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { ok, body } = await apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        sku: form.sku || undefined,
        priceFcfa: Number(form.priceFcfa),
        stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : 0,
      }),
    });
    setSubmitting(false);
    if (ok) {
      setForm({ name: '', sku: '', priceFcfa: '', stockQuantity: '' });
      setShowForm(false);
      loadProducts();
    } else {
      setError(body.message ?? (language === 'fr' ? 'Impossible de créer le produit.' : 'Could not create the product.'));
    }
  }

  async function handleDelete(id: string) {
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    loadProducts();
  }

  if (isLoading || !isAuthenticated) return null;

  return (
    <DashboardShell>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">{t('products_title')}</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Plus size={16} /> {t('products_new')}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface p-5 sm:grid-cols-4">
            <input
              required placeholder={t('products_name')} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
            />
            <input
              placeholder={t('products_sku')} value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
            />
            <input
              required type="number" min="0" placeholder={t('products_price')} value={form.priceFcfa}
              onChange={(e) => setForm({ ...form, priceFcfa: e.target.value })}
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
            />
            <input
              type="number" min="0" placeholder={t('products_stock')} value={form.stockQuantity}
              onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
              className="rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/30 focus:ring-2"
            />
            <button
              type="submit" disabled={submitting}
              className="flex items-center justify-center gap-2 rounded bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover sm:col-span-4 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {t('products_save')}
            </button>
            {error && <p className="text-sm text-destructive sm:col-span-4">{error}</p>}
          </form>
        )}

        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          {loadingList ? (
            <p className="p-6 text-center text-sm text-muted-foreground">{t('products_loading')}</p>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <Package size={28} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('products_empty')}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t('products_col_name')}</th>
                  <th className="px-4 py-3 font-medium">{t('products_col_sku')}</th>
                  <th className="px-4 py-3 font-medium">{t('products_col_price')}</th>
                  <th className="px-4 py-3 font-medium">{t('products_col_stock')}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.sku ?? '—'}</td>
                    <td className="px-4 py-3 text-foreground">{p.priceFcfa.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')} FCFA</td>
                    <td className="px-4 py-3 text-foreground">{p.stockQuantity}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

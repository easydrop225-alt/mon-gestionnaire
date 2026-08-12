'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Language = 'fr' | 'en';

/**
 * Dictionnaire de traduction pour l'espace ENTREPRISE (client) uniquement.
 * La console admin plateforme reste en français (usage interne).
 */
const translations = {
  fr: {
    // Navigation
    nav_dashboard: 'Tableau de bord',
    nav_products: 'Produits',
    nav_subscription: 'Abonnement',
    nav_settings: 'Paramètres',
    nav_help: 'Aide',
    nav_logout: 'Se déconnecter',

    // Tableau de bord
    dashboard_title: 'Tableau de bord',
    dashboard_active_products: 'Produits actifs',
    dashboard_clients: 'Clients',
    dashboard_sales_month: 'Ventes (mois)',
    dashboard_deliveries: 'Livraisons en cours',
    dashboard_license_title: "Licence de l'entreprise",
    dashboard_seats_used: 'sièges utilisés',
    dashboard_lifetime: 'Accès à vie — aucune expiration',
    dashboard_renewal: 'Renouvellement le',
    dashboard_no_period: 'Aucune période active',
    dashboard_loading: 'Chargement...',

    // Produits
    products_title: 'Produits',
    products_new: 'Nouveau produit',
    products_name: 'Nom du produit',
    products_sku: 'Référence (SKU)',
    products_price: 'Prix (FCFA)',
    products_stock: 'Stock initial',
    products_save: 'Enregistrer',
    products_empty: 'Aucun produit pour le moment.',
    products_col_name: 'Nom',
    products_col_sku: 'Référence',
    products_col_price: 'Prix',
    products_col_stock: 'Stock',
    products_loading: 'Chargement...',

    // Abonnement
    subscription_title: 'Activer votre abonnement',
    subscription_subtitle: "Entrez le code d'accès reçu lors de votre achat (3 mois, 6 mois, 12 mois ou accès à vie).",
    subscription_placeholder: 'MG-XXXX-XXXX-XXXX',
    subscription_activate: 'Activer le code',
    subscription_lifetime_note: 'Un code "Accès à vie" ne peut être utilisé qu\'une seule fois, par une seule boutique.',

    // Statuts de licence
    status_trial: 'Essai en cours',
    status_active: 'Actif',
    status_past_due: 'Paiement en retard',
    status_suspended: 'Suspendu',
    status_cancelled: 'Annulé',

    // Plans
    plan_starter: 'Starter',
    plan_pro: 'Pro',
    plan_enterprise: 'Enterprise',

    // Paramètres
    settings_title: 'Paramètres',
    settings_language: 'Langue de l\'interface',
    settings_language_desc: 'Choisissez la langue dans laquelle votre équipe utilise l\'application.',
  },
  en: {
    nav_dashboard: 'Dashboard',
    nav_products: 'Products',
    nav_subscription: 'Subscription',
    nav_settings: 'Settings',
    nav_help: 'Help',
    nav_logout: 'Sign out',

    dashboard_title: 'Dashboard',
    dashboard_active_products: 'Active products',
    dashboard_clients: 'Customers',
    dashboard_sales_month: 'Sales (this month)',
    dashboard_deliveries: 'Deliveries in progress',
    dashboard_license_title: 'Company license',
    dashboard_seats_used: 'seats used',
    dashboard_lifetime: 'Lifetime access — never expires',
    dashboard_renewal: 'Renews on',
    dashboard_no_period: 'No active period',
    dashboard_loading: 'Loading...',

    products_title: 'Products',
    products_new: 'New product',
    products_name: 'Product name',
    products_sku: 'SKU / reference',
    products_price: 'Price (FCFA)',
    products_stock: 'Initial stock',
    products_save: 'Save',
    products_empty: 'No products yet.',
    products_col_name: 'Name',
    products_col_sku: 'SKU',
    products_col_price: 'Price',
    products_col_stock: 'Stock',
    products_loading: 'Loading...',

    subscription_title: 'Activate your subscription',
    subscription_subtitle: 'Enter the access code you received at purchase (3 months, 6 months, 12 months, or lifetime).',
    subscription_placeholder: 'MG-XXXX-XXXX-XXXX',
    subscription_activate: 'Activate code',
    subscription_lifetime_note: 'A "Lifetime" code can only be used once, by a single business.',

    status_trial: 'Trial in progress',
    status_active: 'Active',
    status_past_due: 'Payment overdue',
    status_suspended: 'Suspended',
    status_cancelled: 'Cancelled',

    plan_starter: 'Starter',
    plan_pro: 'Pro',
    plan_enterprise: 'Enterprise',

    settings_title: 'Settings',
    settings_language: 'Interface language',
    settings_language_desc: 'Choose the language your team uses the application in.',
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    const stored = localStorage.getItem('mg-language') as Language | null;
    if (stored === 'fr' || stored === 'en') setLanguageState(stored);
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    localStorage.setItem('mg-language', lang);
  }

  function t(key: TranslationKey): string {
    return translations[language][key] ?? translations.fr[key] ?? key;
  }

  return <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n doit être utilisé à l\'intérieur de <I18nProvider>');
  return ctx;
}

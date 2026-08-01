/**
 * Catalogue des plans commerciaux (niveau de fonctionnalités).
 * Utilisé uniquement pour déterminer les fonctionnalités/sièges accordés
 * par un code d'accès — indépendant de la durée (voir durations.config.ts).
 */
export interface PlanDefinition {
  code: 'STARTER' | 'PRO' | 'ENTERPRISE';
  label: string;
  seats: number;
  features: string[];
}

export const PLANS: Record<string, PlanDefinition> = {
  STARTER: {
    code: 'STARTER',
    label: 'Starter',
    seats: 3,
    features: ['products.basic', 'stock.basic', 'clients.basic'],
  },
  PRO: {
    code: 'PRO',
    label: 'Pro',
    seats: 10,
    features: ['products.basic', 'stock.basic', 'clients.basic', 'sync.google_sheets', 'sync.excel', 'reports.advanced'],
  },
  ENTERPRISE: {
    code: 'ENTERPRISE',
    label: 'Enterprise',
    seats: 50,
    features: ['products.basic', 'stock.basic', 'clients.basic', 'sync.google_sheets', 'sync.excel', 'reports.advanced', 'sso', 'audit.export'],
  },
};

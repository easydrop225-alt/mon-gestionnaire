/**
 * Durées disponibles pour les codes d'accès.
 * `null` pour LIFETIME = aucune expiration (accès à vie).
 * CUSTOM : le nombre de jours est fourni explicitement (voir customDays).
 */
export type CodeDurationCode = 'MONTHLY' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS' | 'CUSTOM' | 'LIFETIME';

export const DURATION_DAYS: Record<Exclude<CodeDurationCode, 'CUSTOM'>, number | null> = {
  MONTHLY: 30,
  THREE_MONTHS: 90,
  SIX_MONTHS: 180,
  TWELVE_MONTHS: 365,
  LIFETIME: null,
};

export const DURATION_LABELS: Record<CodeDurationCode, string> = {
  MONTHLY: 'Mensuel',
  THREE_MONTHS: '3 mois',
  SIX_MONTHS: '6 mois',
  TWELVE_MONTHS: '12 mois',
  CUSTOM: 'Personnalisé',
  LIFETIME: 'Accès à vie',
};

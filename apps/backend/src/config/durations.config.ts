/**
 * Durées disponibles pour les codes d'accès.
 * `null` pour LIFETIME = aucune expiration (accès à vie).
 */
export type CodeDurationCode = 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS' | 'LIFETIME';

export const DURATION_DAYS: Record<CodeDurationCode, number | null> = {
  THREE_MONTHS: 90,
  SIX_MONTHS: 180,
  TWELVE_MONTHS: 365,
  LIFETIME: null,
};

export const DURATION_LABELS: Record<CodeDurationCode, string> = {
  THREE_MONTHS: '3 mois',
  SIX_MONTHS: '6 mois',
  TWELVE_MONTHS: '12 mois',
  LIFETIME: 'Accès à vie',
};

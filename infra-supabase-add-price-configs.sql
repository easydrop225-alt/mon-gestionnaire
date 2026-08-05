-- ============================================================================
-- MON GESTIONNAIRE — Table de tarification (étape 2, à exécuter APRÈS
-- infra-supabase-add-custom-duration.sql, dans une requête séparée)
-- ============================================================================

create table if not exists price_configs (
  id uuid primary key default gen_random_uuid(),
  plan license_plan not null,
  duration code_duration not null,
  price_fcfa int not null,
  updated_at timestamptz not null default now(),
  unique (plan, duration)
);

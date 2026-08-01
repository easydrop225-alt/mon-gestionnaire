-- ============================================================================
-- MON GESTIONNAIRE — Ajout de la table Produits
-- À coller dans Supabase > SQL Editor > New query > Run
-- (Ne touche à rien de ce qui existe déjà — sûr à exécuter après le script initial)
-- ============================================================================

create type product_status as enum ('ACTIVE','ARCHIVED');

create table products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  sku text,
  price_fcfa int not null,
  stock_quantity int not null default 0,
  status product_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index products_tenant_id_idx on products(tenant_id);

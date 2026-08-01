-- ============================================================================
-- MON GESTIONNAIRE — Script d'initialisation Supabase
-- À coller intégralement dans Supabase > SQL Editor > New query > Run
-- Correspond exactement à apps/backend/prisma/schema.prisma
-- ============================================================================

create extension if not exists pgcrypto;

-- --- ENUMS ---
create type tenant_status as enum ('TRIAL','ACTIVE','SUSPENDED','CANCELLED');
create type license_plan as enum ('TRIAL','STARTER','PRO','ENTERPRISE');
create type license_status as enum ('TRIAL','ACTIVE','PAST_DUE','SUSPENDED','CANCELLED');
create type user_status as enum ('PENDING','ACTIVE','DISABLED','ARCHIVED');
create type code_duration as enum ('THREE_MONTHS','SIX_MONTHS','TWELVE_MONTHS','LIFETIME');
create type access_code_status as enum ('UNUSED','ACTIVE','EXPIRED','REVOKED');

-- --- TENANTS ---
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  status tenant_status not null default 'TRIAL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- --- LICENSES ---
create table licenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid unique not null references tenants(id),
  plan license_plan not null default 'TRIAL',
  status license_status not null default 'TRIAL',
  seats int not null default 1,
  seats_used int not null default 0,
  features jsonb not null default '[]',
  is_lifetime boolean not null default false,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --- USERS ---
create table users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  email text unique not null,
  phone text unique,
  password_hash text not null,
  first_name text not null,
  last_name text not null,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  status user_status not null default 'PENDING',
  mfa_enabled boolean not null default false,
  mfa_secret text,
  failed_login_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index users_tenant_id_idx on users(tenant_id);

-- --- ROLES / PERMISSIONS (RBAC) ---
create table roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  module text not null,
  action text not null,
  description text
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- --- SESSIONS / INVITATIONS ---
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  refresh_token_hash text not null,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index sessions_user_id_idx on sessions(user_id);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  email text not null,
  role_id text,
  token text unique not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- --- AUDIT LOG ---
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  user_id uuid references users(id),
  action text not null,
  resource text,
  result text not null,
  ip_address text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_tenant_created_idx on audit_logs(tenant_id, created_at);

-- --- CODES D'ACCÈS (3 mois / 6 mois / 12 mois / à vie) ---
create table access_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  batch_id uuid,
  plan license_plan not null,
  duration code_duration not null,
  period_days int,
  price_fcfa int,
  sold_channel text,
  status access_code_status not null default 'UNUSED',
  tenant_id uuid references tenants(id),
  redeemed_by_email text,
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  created_by text
);
create index access_codes_batch_id_idx on access_codes(batch_id);
create index access_codes_tenant_id_idx on access_codes(tenant_id);

-- ============================================================================
-- PERMISSIONS PAR DÉFAUT (équivalent du script prisma:seed)
-- ============================================================================
insert into permissions (code, module, action, description) values
  ('products.read','products','read','Consulter les produits'),
  ('products.create','products','create','Créer des produits'),
  ('products.update','products','update','Modifier des produits'),
  ('products.delete','products','delete','Supprimer des produits'),
  ('stock.read','stock','read','Consulter le stock'),
  ('stock.adjust','stock','adjust','Ajuster le stock'),
  ('clients.read','clients','read','Consulter les clients'),
  ('clients.create','clients','create','Créer des clients'),
  ('clients.update','clients','update','Modifier des clients'),
  ('clients.delete','clients','delete','Supprimer des clients'),
  ('orders.read','orders','read','Consulter les commandes'),
  ('orders.create','orders','create','Créer des commandes'),
  ('orders.validate','orders','validate','Valider des commandes'),
  ('orders.cancel','orders','cancel','Annuler des commandes'),
  ('users.invite','users','invite','Inviter des utilisateurs'),
  ('users.manage','users','manage','Gérer les utilisateurs'),
  ('settings.manage','settings','manage','Gérer les paramètres'),
  ('licenses.manage','licenses','manage','Gérer la licence et générer des codes d''accès');

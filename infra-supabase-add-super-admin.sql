-- ============================================================================
-- MON GESTIONNAIRE — Statut Super Admin
-- À coller dans Supabase > SQL Editor > New query > Run
-- ============================================================================

alter table users add column if not exists is_super_admin boolean not null default false;

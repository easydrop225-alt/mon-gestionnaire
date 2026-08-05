-- ============================================================================
-- MON GESTIONNAIRE — Durée personnalisée + table de tarification
-- À exécuter dans Supabase > SQL Editor
-- ⚠️ Exécute la ligne 1 SEULE d'abord (ALTER TYPE), clique Run,
--    PUIS colle et exécute le reste (create table) séparément.
-- ============================================================================

-- Étape 1 (requête isolée) :
alter type code_duration add value if not exists 'CUSTOM';

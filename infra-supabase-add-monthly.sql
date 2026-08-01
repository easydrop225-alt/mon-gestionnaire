-- ============================================================================
-- MON GESTIONNAIRE — Ajout de la durée "Mensuel"
-- À coller dans Supabase > SQL Editor > New query > Run
-- IMPORTANT : exécute cette requête SEULE (pas dans le même onglet qu'un
-- autre script), Postgres exige que l'ajout d'une valeur d'énumération
-- soit une requête isolée.
-- ============================================================================

alter type code_duration add value if not exists 'MONTHLY';

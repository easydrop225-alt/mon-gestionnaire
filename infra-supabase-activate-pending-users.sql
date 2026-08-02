-- Active immédiatement tous les comptes en attente (à exécuter une seule fois,
-- pour débloquer les comptes créés avant la correction du flux d'inscription).
update users set status = 'ACTIVE', email_verified_at = now() where status = 'PENDING';

# Mon Gestionnaire — Scaffold Phase 0/1/2

Ce paquet contient les fondations générées pour le projet **Mon Gestionnaire** :

## Contenu

- `apps/backend/` — API NestJS : Prisma (multi-tenant + RBAC + licence), Auth (JWT access/refresh,
  sessions, verrouillage anti brute-force), Guards (JwtAuthGuard, PermissionsGuard, LicenseGuard),
  format de réponse standardisé, module Codes d'accès (3 mois / 6 mois / 12 mois / à vie).
- `apps/frontend/` — Next.js : Design System Marron/Terracotta avec mode sombre (tokens CSS variables),
  page de connexion et tableau de bord de démonstration.
- `docker-compose.yml` — PostgreSQL + Redis prêts à l'emploi.

## Démarrage rapide

```bash
cp .env.example .env          # puis éditer les secrets
docker compose up -d          # démarre Postgres + Redis
npm install
npm run db:migrate --workspace=apps/backend
npm run dev:backend           # http://localhost:4000/api/v1
npm run dev:frontend          # http://localhost:3000
```

## Système de licence retenu

Licence rattachée au **Tenant** (entreprise), identifiant utilisateur = **e-mail** (+ téléphone
optionnel pour la MFA). Le statut d'accès est crédité uniquement via un **code d'accès**
(3 mois / 6 mois / 12 mois / à vie — voir plus bas) et vérifié côté serveur à chaque requête
(`LicenseGuard`). Voir `apps/backend/src/modules/licenses/` et `apps/backend/src/modules/access-codes/`.

## Prochaines étapes (Phase 3/4)

1. Modules métier : Produits → Stock → Clients → Fournisseurs → Commandes → Ventes → Livraisons → Paiements
2. Seed des permissions par défaut (`products.read`, `orders.validate`, etc.) + rôles système
3. Notifications (e-mail de vérification, invitations)
4. PWA (manifest.json + service worker)

---

## Moyens de paiement — codes d'accès uniquement (pour l'instant)

Le paiement en ligne (Wave / Orange Money / Visa via un agrégateur type CinetPay)
est **volontairement mis de côté pour l'instant**. Le seul moyen d'activer un
abonnement est le **code d'accès**, vendu hors application (transfert Wave/Orange
Money manuel vers votre propre numéro, vente en personne, revendeur...).

### Les 4 durées disponibles

| Durée | Code technique | Jours | Expiration |
|---|---|---|---|
| 3 mois | `THREE_MONTHS` | 90 | oui |
| 6 mois | `SIX_MONTHS` | 180 | oui |
| 12 mois | `TWELVE_MONTHS` | 365 | oui |
| Accès à vie | `LIFETIME` | — | **jamais** |

### Générer un lot de codes à vendre

```bash
# 50 codes "Pro / 6 mois" à vendre 20 000 FCFA chacun
curl -X POST http://localhost:4000/api/v1/access-codes/generate \
  -H "Authorization: Bearer <token_admin>" \
  -H "Content-Type: application/json" \
  -d '{"plan":"PRO","duration":"SIX_MONTHS","quantity":50,"priceFcfa":20000,"soldChannel":"Vente en personne"}'

# 10 codes "Accès à vie" (Enterprise) — génère un lot séparé, à surveiller de près
curl -X POST http://localhost:4000/api/v1/access-codes/generate \
  -H "Authorization: Bearer <token_admin>" \
  -H "Content-Type: application/json" \
  -d '{"plan":"ENTERPRISE","duration":"LIFETIME","quantity":10,"priceFcfa":250000,"soldChannel":"Vente en personne"}'
```

La réponse contient la liste des codes générés (`MG-7F3K-9XQ2-P1LM`) — à copier
dans un tableur pour impression/suivi avant la vente. Récupère aussi le lot plus
tard via `GET /api/v1/access-codes/batch/:batchId`.

Le client saisit ensuite son code dans l'application (page `/abonnement`, ou
`POST /api/v1/access-codes/redeem`). **Le décompte des jours démarre à cet instant
précis**, jamais à la génération du code.

### Sécurité anti-partage (important pour les codes "Accès à vie")

Un code d'accès — et en particulier un code `LIFETIME`, qui a beaucoup plus de
valeur — ne peut être activé **qu'une seule fois, définitivement** :

1. **Activation atomique** : la transition `UNUSED → ACTIVE` se fait par une
   écriture SQL conditionnelle (`WHERE status = 'UNUSED'`), pas un "lire puis
   écrire". Si deux personnes tentent d'activer le même code au même moment
   (ex: code revendu en cachette à quelqu'un d'autre), une seule des deux
   requêtes réussit — jamais les deux.
2. **Verrouillage permanent** : le `tenantId` et l'e-mail de la personne qui
   active le code sont enregistrés de façon définitive sur l'enregistrement.
   Un code déjà `ACTIVE` ne peut plus jamais être réutilisé — même par son
   acheteur d'origine, même s'il supprime son compte plus tard.
3. **Traçabilité** : chaque activation (surtout `LIFETIME`) crée une entrée
   `AuditLog` avec l'action `access_code.redeemed.lifetime`, consultable pour
   repérer tout comportement suspect (ex: plusieurs tentatives rapprochées sur
   un même code).

Ce que cela **ne** couvre **pas** : rien n'empêche techniquement une personne de
créer plusieurs comptes (tenants) avec plusieurs e-mails pour activer plusieurs
codes différents — mais c'est un comportement normal de revente/multi-usage, pas
un contournement de la protection "un code = une seule activation, jamais deux".

### À ne pas oublier

- Exécute `npm run prisma:seed --workspace=apps/backend` après la première
  migration : cela crée les permissions par défaut, dont `licenses.manage`
  (nécessaire pour générer des codes).
- Le paiement en ligne pourra être réintroduit plus tard (CinetPay ou autre) en
  créant un nouveau module qui appelle simplement `LicensesService.grantPeriod()`
  — exactement comme le fait déjà `AccessCodesService`. Aucune refonte nécessaire.

---

## Déploiement — GitHub + Supabase + Vercel

### 1. GitHub — héberger le code

```bash
cd mon-gestionnaire
git init
git add .
git commit -m "chore: initial scaffold"
```
Crée un dépôt vide sur https://github.com/new (ne coche aucune option d'initialisation),
puis :
```bash
git remote add origin https://github.com/<ton-compte>/mon-gestionnaire.git
git branch -M main
git push -u origin main
```

### 2. Supabase — base de données PostgreSQL managée

1. Crée un projet sur https://supabase.com/dashboard (choisis une région proche,
   ex. `eu-west-3` Paris pour de bonnes performances depuis la Côte d'Ivoire).
2. Une fois créé, va dans **Project Settings → Database → Connection string**.
   Tu y trouveras deux URLs à copier dans ton `.env` :
   - **Connection pooling** (port `6543`) → variable `DATABASE_URL`
   - **Direct connection** (port `5432`) → variable `DIRECT_URL`
3. Depuis ta machine locale, applique le schéma sur Supabase :
   ```bash
   npm run db:migrate --workspace=apps/backend
   npm run prisma:seed --workspace=apps/backend
   ```
   (Prisma utilise automatiquement `DIRECT_URL` pour les migrations et `DATABASE_URL`
   pour l'exécution normale — c'est déjà configuré dans `schema.prisma`.)

Tu n'as pas besoin de `docker-compose.yml` en production : il ne sert que si tu veux
une base Postgres locale pour développer hors-ligne, sans dépendre de Supabase.

### 3. Vercel — deux projets séparés (backend + frontend)

Le backend NestJS et le frontend Next.js sont déployés comme **deux projets Vercel
distincts** à partir du même dépôt GitHub.

**Projet "backend"** (API) :
1. Sur https://vercel.com/new, importe ton dépôt GitHub.
2. **Root Directory** → `apps/backend`.
3. **Environment Variables** → colle tout le contenu de ton `.env` (DATABASE_URL,
   DIRECT_URL, JWT_*, etc.). Mets `FRONTEND_URL` à l'URL Vercel de ton futur
   projet frontend.
4. Déploie. Note l'URL générée (ex. `https://mon-gestionnaire-api.vercel.app`).

**Projet "frontend"** :
1. Nouveau projet Vercel, même dépôt GitHub.
2. **Root Directory** → `apps/frontend`.
3. **Environment Variables** → ajoute `BACKEND_URL` = l'URL du projet backend
   ci-dessus. Le frontend proxie automatiquement tous les appels `/api/v1/*` vers
   ce backend (voir `next.config.js`) — aucun souci de CORS entre les deux domaines.
4. Déploie. Ton app est accessible sur l'URL générée par Vercel (ou un domaine
   personnalisé à connecter dans Settings → Domains).

Chaque `git push` sur `main` redéploie automatiquement les deux projets — c'est
tout l'intérêt de la combinaison GitHub + Vercel.

### Point d'attention : NestJS en serverless

Le backend tourne comme fonction serverless sur Vercel (`apps/backend/api/index.ts`),
pas comme serveur qui reste allumé en permanence. Cela veut dire :
- Léger délai ("cold start") au tout premier appel après une période d'inactivité.
- Sur le plan gratuit (Hobby), les fonctions ont un timeout de 10 secondes — largement
  suffisant pour nos endpoints actuels, mais à surveiller si tu ajoutes des traitements
  lourds (ex. génération de rapports volumineux) : ceux-là devront passer par une
  file de tâches en arrière-plan plutôt que par une requête HTTP directe.

---

## Application fonctionnelle (Phase 3 complétée)

L'application dispose maintenant d'un parcours complet et réel :

- **Inscription** (`/register`) : crée l'entreprise, l'administrateur, une licence d'essai 14 jours.
- **Connexion** (`/login`) : authentification JWT réelle, tokens gérés automatiquement (rafraîchissement transparent).
- **Tableau de bord** (`/dashboard`) : affiche la vraie licence de l'entreprise (plan, sièges, expiration ou accès à vie).
- **Produits** (`/produits`) : premier module métier complet — créer, lister, supprimer des produits (CRUD réel relié à la base de données).
- **Codes d'accès** (`/admin/codes`) : génère des lots de codes (3/6/12 mois ou à vie) directement depuis l'interface, avec copie en un clic — reste protégé par la permission `licenses.manage`.
- **Abonnement** (`/abonnement`) : activation d'un code d'accès par l'utilisateur final.

### Mise à jour de ta base Supabase existante

Si ta base Supabase a déjà été initialisée avec le premier script SQL, exécute uniquement le complément fourni (`infra-supabase-add-products.sql`) — il n'ajoute que la table `products`, sans toucher au reste.

### Prochaines étapes naturelles

Stock, Clients, Fournisseurs, Commandes, Ventes, Livraisons — chacun suit exactement le même schéma que le module Produits (modèle Prisma → service → contrôleur → permissions → page frontend), donc chaque ajout futur sera rapide.

---

## Logo & icône d'application (PWA)

Le logo fourni a été découpé automatiquement (le blason circulaire, sans le texte) et
décliné dans toutes les tailles nécessaires : `apps/frontend/public/favicon.png`,
`apple-touch-icon.png` (iPhone), `icon-192.png` / `icon-512.png` (Android/PWA), plus
une variante `icon-maskable-512.png` avec marge de sécurité pour les icônes adaptatives
Android. Le fichier `manifest.json` les référence déjà — quand un utilisateur "installe"
l'app sur son téléphone ou son PC (Chrome propose ça automatiquement pour une PWA), c'est
ce logo qui apparaît comme icône, pas une icône générique.

## Durées d'abonnement (mise à jour)

Les codes d'accès proposent maintenant : **Mensuel**, **3 mois**, **6 mois**, **1 an**,
**Accès à vie**. Si ta base Supabase a déjà été initialisée, exécute le complément
`infra-supabase-add-monthly.sql` (requête isolée, exigence Postgres pour l'ajout d'une
valeur d'énumération).

## Éditer un abonnement manuellement — console admin plateforme

Une page séparée, protégée par un code secret (pas un compte utilisateur classique),
te permet de consulter **toutes** les entreprises et d'ajuster n'importe quel abonnement
à la main : `/platform-admin`.

- Défini via la variable d'environnement `PLATFORM_ADMIN_SECRET` (backend) — génère une
  valeur longue et aléatoire, ne la partage jamais, ne la commite jamais en clair.
- Permet de changer le plan, le statut, le nombre de sièges, la date d'expiration, ou de
  basculer en accès à vie, pour n'importe quelle entreprise.
- **Garantie : cette action ne touche QUE la ligne de licence.** Réactiver un abonnement
  expiré — même après plusieurs mois d'inactivité — restaure l'accès complet aux données
  existantes de l'entreprise (produits, utilisateurs, historique). Rien n'est jamais
  supprimé automatiquement quand une licence expire ou est suspendue : `LicenseGuard` se
  contente de bloquer temporairement l'accès à l'API, il ne détruit jamais rien.

⚠️ Ne partage jamais l'URL `/platform-admin` ni le code secret publiquement — c'est ta
console à toi, pas une fonctionnalité cliente.

---

## Séparation Admin plateforme / Entreprises clientes (mise à jour)

Deux univers bien distincts désormais :

- **Compte client** (`/register`, `/login`) : un administrateur d'entreprise gère
  UNIQUEMENT ses propres données (produits, futurs employés). Il ne génère plus
  lui-même de codes d'accès — il les reçoit et les active sur `/abonnement`.
- **Console admin plateforme** (`/platform-admin`, protégée par `PLATFORM_ADMIN_SECRET`) :
  réservée à toi, l'éditeur du logiciel. Trois onglets :
  - **Entreprises** : liste de toutes les entreprises inscrites avec filtres
    (recherche par nom, statut de licence, plan), cartes de synthèse (total,
    actifs, essais, en retard/suspendus, à vie), et édition de n'importe quel
    abonnement — plan, statut, sièges, et calcul automatique de la date
    d'expiration à partir d'une **durée** (Mensuel/3 mois/6 mois/12 mois/
    Personnalisé) et d'une **date d'activation modifiable** (permet d'antidater
    un paiement reçu en dehors de l'app, ou de programmer une activation future).
  - **Codes d'accès** : génération de lots de codes à vendre (mêmes durées,
    dont Personnalisé avec nombre de jours libre).
  - **Tarifs** : grille éditable des prix par défaut (plan x durée), affichés
    en tant qu'indication lors de la génération de codes.

Comme précédemment : réactiver un abonnement expiré ne touche jamais aux
données de l'entreprise (produits, utilisateurs) — uniquement la ligne `License`.

### Mise à jour de ta base Supabase existante

Exécute, dans l'ordre et séparément :
1. `infra-supabase-add-custom-duration.sql`
2. `infra-supabase-add-price-configs.sql`

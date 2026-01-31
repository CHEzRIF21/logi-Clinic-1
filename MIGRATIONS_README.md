# Guide des migrations – Logiclinic

Ce document décrit comment appliquer les **migrations backend (Prisma)** et les **migrations Supabase** dans le bon ordre.

---

## 1. Migrations backend (Prisma)

Le serveur Node.js utilise **Prisma** pour le schéma et les migrations sur la base PostgreSQL (Supabase).

### Prérequis

- `DATABASE_URL` configurée dans `server/.env` (chaîne de connexion PostgreSQL / Supabase).

### Commandes (dans `server/`)

```bash
cd server

# Générer le client Prisma après modification du schema
npm run generate

# Développement : créer une nouvelle migration et l'appliquer
npm run migrate

# Production : appliquer les migrations existantes sans en créer
npm run migrate:deploy

# Réinitialiser la base (⚠️ efface les données)
npm run migrate:reset
```

### Structure

- **Schéma** : `server/prisma/schema.prisma`
- **Migrations** : `server/prisma/migrations/`
  - Chaque sous-dossier (ex. `001_init`, `20250101000000_hierarchical_admin_system`) contient un fichier `migration.sql`.

### Ordre des migrations Prisma (historique)

1. `001_init`
2. `002_enrich_schema`
3. `003_inventory_security_extensions`
4. `004_add_app_security_fields`
5. `005_update_payment_methods`
6. `20250101000000_hierarchical_admin_system`
7. `20251128152517_ch_ez_rif_123456789`

Prisma gère l’ordre via la table `_prisma_migrations`. Il suffit d’exécuter `npm run migrate:deploy` pour appliquer toutes les migrations en attente.

---

## 2. Migrations Supabase

Deux mécanismes coexistent :

- **Dossier officiel Supabase CLI** : `supabase/migrations/`
- **Dossier manuel / scripts** : `supabase_migrations/` (à exécuter via SQL Editor ou scripts).

### 2.1 Migrations Supabase CLI (`supabase/migrations/`)

Une seule migration est définie pour le moment :

- `20251223120000_fix_rls_and_view_security.sql`  
  - Corrige les vues (SECURITY INVOKER) et active RLS sur les tables publiques avec des politiques permissives.

**Application avec Supabase CLI :**

```bash
# À la racine du projet
supabase db push
# ou
supabase migration up
```

**Application manuelle :**

1. Ouvrir le **SQL Editor** du projet Supabase.
2. Copier le contenu de `supabase/migrations/20251223120000_fix_rls_and_view_security.sql`.
3. Exécuter la requête.

### 2.2 Migrations manuelles (`supabase_migrations/`)

Ces fichiers sont des scripts SQL à exécuter **manuellement** dans l’ordre (Dashboard Supabase → SQL Editor), ou via un script PowerShell (voir plus bas).

**Fichier de consolidation (démarrage rapide) :**

- `supabase_migrations/apply_all_migrations_and_rls.sql`  
  - Patients (colonnes accompagnant / personne à prévenir), `patient_files`, `patient_care_timeline`, bucket Storage, RLS de base.  
  - À utiliser si la base est neuve ou si ces objets n’existent pas encore.

**Migrations critiques (ordre recommandé) :**

Pour une base déjà utilisée en production, appliquer dans cet ordre (en ne gardant que celles qui correspondent à votre version) :

1. `65_FIX_REGISTRATION_REQUESTS_RLS_CRITICAL.sql` – RLS `registration_requests`
2. `66_FIX_PERMISSIVE_RLS_PART1_CORE.sql` – RLS core (patients, consultations, etc.)
3. `67_FIX_PERMISSIVE_RLS_PART2_STOCK.sql` – RLS stock
4. `68_FIX_PERMISSIVE_RLS_PART3_IMAGING_LAB.sql` – RLS imagerie / labo
5. `69_FIX_PERMISSIVE_RLS_PART4_MISC.sql` – RLS divers
6. `supabase/migrations/20251223120000_fix_rls_and_view_security.sql` – Vues + RLS linter

**Fichiers en double de numéro (choisir un seul par numéro) :**

- `25_*` : `25_FIX_CLINIC_CODE_VALIDATION.sql` ou `25_FIX_GET_MY_CLINIC_ID_WITH_FALLBACK.sql`
- `38_*` : `38_ADD_PAYMENT_REQUIRED_PROCESS.sql` ou `38_CREATE_CUSTOM_PROFILES_TABLE.sql`
- `52_*`, `53_*`, `56_*`, `57_*` : vérifier la doc ou l’historique du projet pour savoir lequel appliquer.

---

## 3. Ordre global recommandé

1. **Backend (Prisma)**  
   - `cd server && npm run migrate:deploy`  
   - Crée/met à jour les tables gérées par Prisma (User, Clinic, Patient, Invoice, etc. selon le schéma).

2. **Supabase – scripts manuels**  
   - Si base neuve : exécuter `supabase_migrations/apply_all_migrations_and_rls.sql` dans le SQL Editor.  
   - Sinon : appliquer les migrations numérotées (65, 66, 67, 68, 69, etc.) dans l’ordre indiqué ci-dessus.

3. **Supabase – migration CLI**  
   - Exécuter `supabase/migrations/20251223120000_fix_rls_and_view_security.sql` (CLI ou copier-coller dans le SQL Editor).

---

## 4. Script PowerShell (optionnel)

Un script peut lister les fichiers de `supabase_migrations` dans l’ordre et ouvrir le SQL Editor (à adapter selon votre env) :

```powershell
# Exemple : afficher l'ordre des migrations à appliquer
Get-ChildItem -Path "supabase_migrations" -Filter "*.sql" -Recurse | 
  Where-Object { $_.Name -match '^\d{2,3}_' } | 
  Sort-Object Name | 
  ForEach-Object { $_.FullName }
```

Vous pouvez ensuite copier le contenu de chaque fichier et l’exécuter dans le SQL Editor un par un.

---

## 5. En cas d’erreur

- **Prisma** : vérifier que `DATABASE_URL` pointe vers la même base que le projet Supabase (connection string PostgreSQL).
- **Supabase** : si une migration échoue (table déjà existante, colonne déjà là), adapter le script (ex. `IF NOT EXISTS`, `DROP POLICY IF EXISTS` puis `CREATE POLICY`) ou commenter la partie déjà appliquée.
- **RLS** : après toute migration RLS, tester avec un utilisateur authentifié (role et `clinic_id`) pour confirmer que les accès sont corrects.

---

## 6. Résumé

| Type              | Dossier / Fichier                    | Commande / Action                                      |
|-------------------|--------------------------------------|--------------------------------------------------------|
| Backend           | `server/prisma/`                     | `cd server && npm run migrate:deploy`                  |
| Supabase CLI      | `supabase/migrations/*.sql`         | `supabase db push` ou copier-coller dans SQL Editor   |
| Supabase manuel   | `supabase_migrations/*.sql`          | SQL Editor, dans l’ordre indiqué (65 → 69, etc.)      |
| Consolidation     | `apply_all_migrations_and_rls.sql`   | SQL Editor (base neuve ou sans ces objets)            |

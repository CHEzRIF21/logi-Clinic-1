# 🏥 Guide Multi-Tenancy - Logi Clinic

## Vue d'ensemble

Logi Clinic utilise une architecture **Multi-Tenancy** (multi-entités) avec **Row Level Security (RLS)** pour gérer plusieurs cliniques sur une seule base de données Supabase.

## Architecture

### 1. Tables Principales

| Table | Rôle |
|-------|------|
| `clinics` | Stocke les informations des cliniques (code, nom, is_demo) |
| `users` | Utilisateurs avec `clinic_id` pour lier à une clinique |
| `registration_requests` | Demandes d'inscription en attente de validation |
| `clinic_temporary_codes` | Codes temporaires pour les nouvelles cliniques |

### 2. Hiérarchie des Rôles

```
SUPER_ADMIN
    │
    ├── Accès total à toutes les cliniques
    ├── Création de nouvelles cliniques
    └── Gestion des codes temporaires
    
CLINIC_ADMIN
    │
    ├── Accès uniquement à SA clinique
    ├── Validation des demandes d'inscription
    └── Gestion des utilisateurs de sa clinique
    
STAFF (MEDECIN, INFIRMIER, PHARMACIEN, etc.)
    │
    └── Accès uniquement aux données de SA clinique
```

### 3. Isolation des Données (RLS)

Chaque table de données métier a une colonne `clinic_id` et des politiques RLS :

```sql
-- Exemple de politique RLS
CREATE POLICY "clinic_users_own_clinic" ON patients
FOR ALL TO authenticated
USING (clinic_id = get_current_user_clinic_id())
WITH CHECK (clinic_id = get_current_user_clinic_id());
```

## Workflow d'Inscription

### Étape 1 : Création par le Super-Admin

1. Le Super-Admin crée une clinique via l'interface admin
2. Un code clinique unique est généré (ex: `CLINIC-123456`)
3. Un admin de clinique est créé avec un mot de passe temporaire

### Étape 2 : Inscription du Staff

1. Le membre du staff accède à la page d'inscription
2. Il saisit :
   - **Code Clinique** (obligatoire) - fourni par l'admin
   - Informations personnelles (nom, email, etc.)
   - Questions de sécurité
3. L'application vérifie que le code existe
4. La demande est créée avec `statut = 'pending'`

### Étape 3 : Validation par l'Admin

1. L'admin de la clinique se connecte
2. Il voit les demandes en attente pour SA clinique
3. Il valide → l'utilisateur passe en `status = 'PENDING'`
4. À la première connexion, l'utilisateur change son mot de passe

## Application des Migrations

### Migration 15 : Multi-Tenancy Complet

Cette migration :
1. Ajoute `is_demo` à la table `clinics`
2. Ajoute `clinic_id` à toutes les tables métier
3. Active RLS sur toutes les tables
4. Assigne les données existantes à CLINIC001 (démo)

**Exécution :**

```bash
# Dans le SQL Editor de Supabase
# Copier-coller le contenu de:
# supabase_migrations/15_COMPLETE_MULTI_TENANCY_SETUP.sql
```

### Vérification après migration

```sql
-- Vérifier les cliniques
SELECT code, name, is_demo, active FROM clinics;

-- Vérifier les tables avec clinic_id
SELECT table_name 
FROM information_schema.columns 
WHERE column_name = 'clinic_id' 
  AND table_schema = 'public';

-- Vérifier les politiques RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Gestion du Compte Démo

### Isolation des données

La clinique démo `CLINIC001` est marquée avec `is_demo = true`.

Pour réinitialiser les cliniques réelles sans toucher à la démo :

```sql
-- Supprimer uniquement les données des cliniques non-démo
DELETE FROM patients 
WHERE clinic_id IN (
  SELECT id FROM clinics WHERE is_demo = false
);
```

### Comptes démo disponibles

| Code Clinique | Email | Mot de passe | Rôle |
|---------------|-------|--------------|------|
| CLINIC001 | admin | admin123 | CLINIC_ADMIN |
| CLINIC001 | medecin | medecin123 | MEDECIN |
| CLINIC001 | infirmier | infirmier123 | INFIRMIER |
| CLINIC001 | receptionniste | receptionniste123 | RECEPTIONNISTE |

## Fonctions Helper SQL

### Validation du code clinique

```sql
-- Retourne les infos de la clinique si le code est valide
SELECT * FROM validate_clinic_code('CLINIC001');
```

### Récupérer l'ID de clinique de l'utilisateur courant

```sql
SELECT get_current_user_clinic_id();
```

### Vérifier si l'utilisateur est admin

```sql
SELECT check_is_super_admin();
SELECT check_is_clinic_admin();
```

## Bonnes Pratiques

### 1. Toujours inclure clinic_id

Lors de la création de nouvelles tables :

```sql
CREATE TABLE ma_nouvelle_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  -- autres colonnes...
);

-- Activer RLS
ALTER TABLE ma_nouvelle_table ENABLE ROW LEVEL SECURITY;

-- Créer les politiques
SELECT create_standard_rls_policies('ma_nouvelle_table');
```

### 2. Filtrer côté application

Même avec RLS, toujours filtrer les données :

```typescript
// Dans les services
const { data } = await supabase
  .from('patients')
  .select('*')
  .eq('clinic_id', user.clinicId);
```

### 3. Logs et audit

Chaque action importante doit être loguée avec le `clinic_id` :

```sql
INSERT INTO audit_log (action, clinic_id, user_id, details)
VALUES ('CREATE_PATIENT', $1, $2, $3);
```

## Dépannage

### Erreur "new row violates RLS policy"

L'utilisateur n'a pas les droits pour cette clinique. Vérifiez :
1. Le `clinic_id` de l'utilisateur
2. Les politiques RLS de la table
3. Que l'utilisateur est authentifié

### Erreur "infinite recursion in RLS"

Les politiques RLS font référence à des tables avec RLS. Solution :
- Utiliser des fonctions `SECURITY DEFINER` :

```sql
CREATE FUNCTION get_current_user_clinic_id()
RETURNS UUID 
SECURITY DEFINER  -- Ignore RLS
SET search_path = public
AS $$ ... $$;
```

## Résumé des Fichiers

| Fichier | Description |
|---------|-------------|
| `15_COMPLETE_MULTI_TENANCY_SETUP.sql` | Migration complète multi-tenancy |
| `server/src/routes/auth.ts` | API d'inscription avec code clinique |
| `src/components/auth/Login.tsx` | Formulaire avec validation du code |


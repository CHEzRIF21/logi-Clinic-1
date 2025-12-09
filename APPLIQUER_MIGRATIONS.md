# 🚀 Guide pour appliquer les migrations Supabase

## ⚠️ IMPORTANT : Résoudre l'erreur RLS

L'erreur "new row violates row-level security policy" signifie que les politiques RLS bloquent l'insertion. Suivez ces étapes pour corriger.

## 📋 Étapes à suivre

### 1. Ouvrir Supabase Dashboard
1. Allez sur https://supabase.com/dashboard
2. Connectez-vous à votre compte
3. Sélectionnez votre projet

### 2. Ouvrir l'éditeur SQL
1. Dans le menu de gauche, cliquez sur **"SQL Editor"**
2. Cliquez sur **"New query"**

### 3. Copier et exécuter la migration complète
1. Ouvrez le fichier `supabase_migrations/apply_all_migrations_and_rls.sql`
2. **Copiez tout le contenu** du fichier
3. **Collez-le** dans l'éditeur SQL de Supabase
4. Cliquez sur **"Run"** ou appuyez sur `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### 4. Vérifier que la migration a réussi
Vous devriez voir le message :
```
Migration complète appliquée avec succès!
```

### 5. Tester la création d'un patient
1. Retournez dans votre application
2. Essayez de créer un nouveau patient
3. Cela devrait maintenant fonctionner ! ✅

## 🔍 Vérification manuelle (optionnel)

Si vous voulez vérifier que tout est bien configuré, exécutez cette requête SQL :

```sql
-- Vérifier les colonnes de la table patients
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND (column_name LIKE '%accompagnant%' OR column_name LIKE '%personne_prevenir%')
ORDER BY column_name;

-- Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'patients';

-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('patient_files', 'patient_care_timeline');

-- Vérifier le bucket Storage
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'patient-files';
```

## 🛡️ Sécurité (Production)

⚠️ **Note importante** : Les politiques RLS créées permettent l'accès complet aux utilisateurs anonymes (`anon`). C'est pratique pour le développement, mais **en production**, vous devriez :

1. Supprimer les politiques `anon`
2. Utiliser uniquement les politiques `authenticated`
3. Implémenter un système d'authentification approprié

Pour supprimer les politiques anonymes en production :

```sql
-- Supprimer les politiques anon pour patients
DROP POLICY IF EXISTS "Allow all operations for anon users" ON patients;

-- Supprimer les politiques anon pour patient_files
DROP POLICY IF EXISTS "Allow all operations for anon users" ON patient_files;

-- Supprimer les politiques anon pour patient_care_timeline
DROP POLICY IF EXISTS "Allow all operations for anon users" ON patient_care_timeline;

-- Supprimer les politiques anon pour storage
DROP POLICY IF EXISTS "Allow anon users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon users to delete files" ON storage.objects;
```

## ❓ En cas de problème

Si vous rencontrez des erreurs :

1. **Vérifiez les logs** dans Supabase Dashboard > Logs
2. **Vérifiez que RLS est activé** sur les tables
3. **Vérifiez que les politiques existent** avec la requête de vérification ci-dessus
4. **Assurez-vous d'avoir les permissions** nécessaires dans Supabase

## ✅ Après la migration

Une fois la migration appliquée avec succès :
- ✅ Création de patients fonctionnelle
- ✅ Sections Accompagnant et Personne à prévenir disponibles
- ✅ Upload de fichiers disponible
- ✅ Suivi des étapes de soins disponible


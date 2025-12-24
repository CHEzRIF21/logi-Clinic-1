# 🔧 Correction : Erreur RLS sur la Table Clinics

## Problème

Erreur lors de la connexion : `Code temporaire trouvé mais clinique associée introuvable`

**Cause** : Les RLS policies sur la table `clinics` bloquent l'accès pour les utilisateurs anonymes/non authentifiés.

## Solution : Appliquer 3 Scripts SQL

### ✅ Étape 1 : Permettre la lecture publique des cliniques

Exécutez dans **Supabase SQL Editor** :

```sql
-- Fichier: supabase_migrations/09_FIX_RLS_CLINICS_PUBLIC_READ.sql
```

Ce script ajoute des policies RLS pour permettre la lecture des cliniques actives.

### ✅ Étape 2 : Créer la fonction de récupération (Recommandé)

Exécutez dans **Supabase SQL Editor** :

```sql
-- Fichier: supabase_migrations/10_FUNCTION_GET_CLINIC_BY_TEMP_CODE.sql
```

Cette fonction utilise `SECURITY DEFINER` pour contourner les RLS et récupérer les données de la clinique.

### ✅ Étape 3 : Vérifier la configuration CAMPUS-001

Exécutez dans **Supabase SQL Editor** :

```sql
-- Fichier: supabase_migrations/07_VERIFY_AND_FIX_CAMPUS001.sql
```

## Ordre d'Application Recommandé

1. **09_FIX_RLS_CLINICS_PUBLIC_READ.sql** - Corrige les RLS policies
2. **10_FUNCTION_GET_CLINIC_BY_TEMP_CODE.sql** - Crée la fonction de récupération
3. **07_VERIFY_AND_FIX_CAMPUS001.sql** - Vérifie et corrige CAMPUS-001

## Vérification

Après avoir appliqué les scripts, testez avec cette requête :

```sql
-- Tester la fonction
SELECT * FROM get_clinic_by_temp_code('CAMPUS-001');
```

Cette requête doit retourner les données de la clinique.

## Test de Connexion

Une fois les scripts appliqués, testez la connexion avec :
- **Code clinique** : `CAMPUS-001`
- **Email** : `bagarayannick1@gmail.com`
- **Mot de passe** : `TempClinic2024!`

## Si le Problème Persiste

### Vérifier les RLS Policies

```sql
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'clinics'
ORDER BY policyname;
```

Vous devriez voir au moins une policy avec `roles` contenant `{anon,authenticated}`.

### Vérifier la Fonction

```sql
SELECT 
  proname,
  prosecdef, -- Doit être true pour SECURITY DEFINER
  proacl
FROM pg_proc
WHERE proname = 'get_clinic_by_temp_code';
```

### Vérifier les Permissions

```sql
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_routine_grants
WHERE routine_name = 'get_clinic_by_temp_code';
```

## Notes Techniques

### Pourquoi SECURITY DEFINER ?

La fonction utilise `SECURITY DEFINER` pour :
- Contourner les RLS policies lors de l'exécution
- Permettre la récupération des données même pour les utilisateurs anonymes
- Maintenir la sécurité en validant les conditions (code non converti, non expiré)

### Alternative : Policy RLS Plus Permissive

Si vous préférez ne pas utiliser `SECURITY DEFINER`, vous pouvez rendre les policies RLS plus permissives :

```sql
-- Policy très permissive (à utiliser avec précaution)
CREATE POLICY "public_read_all_clinics" ON clinics
  FOR SELECT
  TO anon, authenticated
  USING (true); -- Permet la lecture de toutes les cliniques
```

⚠️ **Attention** : Cette approche est moins sécurisée car elle expose toutes les cliniques publiquement.

## Support

Si le problème persiste après avoir appliqué tous les scripts :
1. Vérifiez les logs Supabase (Dashboard > Logs)
2. Vérifiez que toutes les migrations ont été appliquées
3. Vérifiez que la table `clinic_temporary_codes` contient l'entrée pour CAMPUS-001



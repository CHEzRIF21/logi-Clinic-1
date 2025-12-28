# Guide d'Application de la Migration 25

## 🔧 Problème Résolu

La migration `25_FIX_GET_MY_CLINIC_ID_WITH_FALLBACK.sql` corrige le problème de récupération du `clinic_id` lors de la création de consultations.

**Erreur originale :**
```
Error: Clinic ID non trouvé
```

**Solution :** Amélioration de la fonction `get_my_clinic_id()` avec fallback pour fonctionner même sans Supabase Auth.

## 📋 Méthodes d'Application

### Méthode 1 : Via Supabase Dashboard (Recommandé)

1. **Ouvrir le SQL Editor**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet
   - Cliquez sur "SQL Editor" dans le menu de gauche

2. **Copier le contenu de la migration**
   - Ouvrez le fichier `supabase_migrations/25_FIX_GET_MY_CLINIC_ID_WITH_FALLBACK.sql`
   - Copiez tout le contenu (Ctrl+A, Ctrl+C)

3. **Exécuter la migration**
   - Collez le contenu dans le SQL Editor
   - Cliquez sur "Run" ou appuyez sur Ctrl+Enter
   - Vérifiez qu'il n'y a pas d'erreur

4. **Vérifier le résultat**
   - Vous devriez voir un message de succès
   - La fonction `get_my_clinic_id()` est maintenant améliorée

### Méthode 2 : Via Supabase CLI

```bash
# Se connecter à Supabase
supabase login

# Lier au projet (remplacez YOUR_PROJECT_REF par votre référence de projet)
supabase link --project-ref YOUR_PROJECT_REF

# Appliquer la migration
supabase db push
```

### Méthode 3 : Via PowerShell Script

```powershell
# Si vous avez configuré DATABASE_URL
.\apply_migrations.ps1 -DbUrl $env:DATABASE_URL -NonInteractive
```

## ✅ Vérification Post-Migration

### 1. Vérifier que la fonction existe

Exécutez dans le SQL Editor :

```sql
-- Vérifier que la fonction existe
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'get_my_clinic_id';
```

Vous devriez voir deux versions :
- `get_my_clinic_id()` - sans paramètre (utilisée par les politiques RLS)
- `get_my_clinic_id(p_user_id UUID DEFAULT NULL)` - avec paramètre (fallback)

### 2. Tester la fonction

```sql
-- Test avec auth.uid() (si un utilisateur est connecté)
SELECT get_my_clinic_id();

-- Test avec un user_id spécifique (remplacez par un ID réel)
SELECT get_my_clinic_id('00000000-0000-0000-0000-000000000000'::UUID);
```

### 3. Vérifier que les politiques RLS fonctionnent toujours

```sql
-- Vérifier que les politiques utilisent toujours get_my_clinic_id()
SELECT 
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE qual LIKE '%get_my_clinic_id%' 
   OR with_check LIKE '%get_my_clinic_id%';
```

Vous devriez voir toutes les politiques qui utilisent `get_my_clinic_id()`.

## 🔍 Dépannage

### Erreur : "function get_my_clinic_id() does not exist"

**Cause :** La migration n'a pas été appliquée correctement.

**Solution :**
1. Vérifiez que vous avez bien exécuté la migration
2. Vérifiez que vous êtes connecté au bon projet Supabase
3. Réessayez d'exécuter la migration

### Erreur : "cannot drop function get_my_clinic_id() because other objects depend on it"

**Cause :** Vous avez essayé d'utiliser `DROP FUNCTION` au lieu de `CREATE OR REPLACE FUNCTION`.

**Solution :** Utilisez la migration `25_FIX_GET_MY_CLINIC_ID_WITH_FALLBACK.sql` qui utilise `CREATE OR REPLACE FUNCTION` pour préserver les dépendances.

### Erreur : "Clinic ID non trouvé" persiste après la migration

**Cause :** Le problème peut venir du frontend qui n'utilise pas correctement le fallback.

**Solution :**
1. Vérifiez que `src/services/clinicService.ts` a été mis à jour avec les fallbacks
2. Vérifiez que `src/services/consultationService.ts` utilise le fallback dans `createConsultation()`
3. Videz le cache du navigateur et reconnectez-vous

## 📝 Notes Importantes

- ✅ La migration utilise `CREATE OR REPLACE FUNCTION` pour préserver les dépendances RLS
- ✅ La signature de `get_my_clinic_id()` sans paramètre reste identique pour compatibilité
- ✅ Une nouvelle surcharge avec paramètre `p_user_id` est ajoutée pour le fallback
- ✅ Toutes les politiques RLS existantes continuent de fonctionner sans modification

## 🎯 Prochaines Étapes

Après avoir appliqué la migration :

1. **Tester la création de consultation**
   - Connectez-vous avec un compte utilisateur
   - Sélectionnez un patient
   - Créez une nouvelle consultation
   - Vérifiez qu'il n'y a plus d'erreur "Clinic ID non trouvé"

2. **Vérifier les autres modules**
   - Testez les autres fonctionnalités qui utilisent `get_my_clinic_id()`
   - Vérifiez que l'isolation multi-tenant fonctionne toujours correctement

3. **Surveiller les logs**
   - Vérifiez les logs de l'application pour détecter d'éventuelles erreurs
   - Vérifiez les logs Supabase pour les erreurs SQL

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs Supabase dans le dashboard
2. Vérifiez les logs de l'application frontend
3. Consultez le document `CORRECTIONS_CONNEXION_CLINIQUE.md` pour plus de détails


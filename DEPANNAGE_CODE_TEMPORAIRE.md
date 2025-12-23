# 🔧 Dépannage : Code Temporaire CAMPUS-001 Non Trouvé

## Problème

L'erreur `Code clinique "CAMPUS-001" introuvable` apparaît lors de la connexion.

## Solutions par ordre de priorité

### ✅ Solution 1 : Vérifier et Corriger la Configuration (Recommandé)

Exécutez ce script dans **Supabase SQL Editor** :

```sql
-- Fichier: supabase_migrations/07_VERIFY_AND_FIX_CAMPUS001.sql
```

Ce script :
- ✅ Vérifie que la clinique CAMPUS-001 existe
- ✅ Crée l'entrée dans `clinic_temporary_codes` si manquante
- ✅ Met à jour les flags nécessaires
- ✅ Vérifie l'utilisateur admin

### ✅ Solution 2 : Corriger les RLS Policies

Si après la Solution 1 le problème persiste, exécutez :

```sql
-- Fichier: supabase_migrations/08_FIX_RLS_TEMP_CODES.sql
```

Ce script corrige les permissions pour permettre la lecture des codes temporaires.

### ✅ Solution 3 : Vérification Manuelle

Exécutez cette requête pour diagnostiquer :

```sql
-- Vérifier la clinique
SELECT 
  id, code, name, active, is_temporary_code, requires_code_change
FROM clinics 
WHERE code = 'CAMPUS-001';

-- Vérifier le code temporaire
SELECT 
  id, clinic_id, temporary_code, expires_at, is_used, is_converted
FROM clinic_temporary_codes
WHERE temporary_code = 'CAMPUS-001';

-- Vérifier l'utilisateur
SELECT 
  id, email, clinic_id, role, status, temp_code_used
FROM users
WHERE email = 'bagarayannick1@gmail.com';
```

## Causes Possibles

### 1. Migration non appliquée
- **Symptôme** : La table `clinic_temporary_codes` n'existe pas
- **Solution** : Exécuter `06_TEMPORARY_CLINIC_CODES.sql`

### 2. Entrée manquante dans clinic_temporary_codes
- **Symptôme** : La clinique existe mais pas d'entrée dans `clinic_temporary_codes`
- **Solution** : Exécuter `07_VERIFY_AND_FIX_CAMPUS001.sql`

### 3. RLS Policies bloquent l'accès
- **Symptôme** : Erreur de permission dans les logs Supabase
- **Solution** : Exécuter `08_FIX_RLS_TEMP_CODES.sql`

### 4. Code déjà converti
- **Symptôme** : `is_converted = true` dans `clinic_temporary_codes`
- **Solution** : Utiliser le nouveau code permanent ou réinitialiser

## Réinitialisation Complète (Si Nécessaire)

Si vous devez tout réinitialiser :

```sql
-- 1. Supprimer l'entrée existante
DELETE FROM clinic_temporary_codes WHERE temporary_code = 'CAMPUS-001';

-- 2. Réinitialiser la clinique
UPDATE clinics
SET 
  is_temporary_code = true,
  requires_code_change = true,
  updated_at = NOW()
WHERE code = 'CAMPUS-001';

-- 3. Réinitialiser l'utilisateur
UPDATE users
SET 
  status = 'PENDING',
  temp_code_used = false,
  updated_at = NOW()
WHERE email = 'bagarayannick1@gmail.com';

-- 4. Recréer l'entrée du code temporaire
INSERT INTO clinic_temporary_codes (
  clinic_id,
  temporary_code,
  expires_at,
  is_used,
  is_converted
)
SELECT 
  id,
  'CAMPUS-001',
  NOW() + INTERVAL '72 hours',
  false,
  false
FROM clinics
WHERE code = 'CAMPUS-001';
```

## Vérification Finale

Après avoir appliqué les corrections, testez avec :

```sql
-- Cette requête doit retourner des résultats
SELECT 
  c.code as clinic_code,
  c.name as clinic_name,
  ctc.temporary_code,
  ctc.expires_at,
  ctc.is_used,
  ctc.is_converted,
  u.email as admin_email,
  u.status as admin_status
FROM clinics c
JOIN clinic_temporary_codes ctc ON ctc.clinic_id = c.id
LEFT JOIN users u ON u.clinic_id = c.id AND u.role = 'CLINIC_ADMIN'
WHERE ctc.temporary_code = 'CAMPUS-001';
```

## Test de Connexion

Une fois corrigé, testez la connexion avec :
- **Code clinique** : `CAMPUS-001`
- **Email** : `bagarayannick1@gmail.com`
- **Mot de passe** : `TempClinic2024!`

## Logs à Vérifier

Dans Supabase Dashboard > Logs, vérifiez :
1. **Auth Logs** : Erreurs d'authentification
2. **Postgres Logs** : Erreurs RLS ou SQL
3. **Edge Function Logs** : Si vous utilisez les fonctions Edge

## Support

Si le problème persiste après avoir appliqué toutes les solutions :
1. Vérifiez les logs Supabase
2. Vérifiez que toutes les migrations ont été appliquées dans l'ordre
3. Vérifiez que les colonnes `is_temporary_code` et `requires_code_change` existent dans `clinics`


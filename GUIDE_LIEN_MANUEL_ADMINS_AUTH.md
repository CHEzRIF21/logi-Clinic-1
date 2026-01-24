# 🔗 Guide : Lier Manuellement les Admins Créés dans Supabase Auth

## ✅ Oui, c'est possible !

Si vous créez les admins manuellement dans Supabase Auth, vous pouvez les lier directement aux cliniques. Voici comment faire.

---

## 📋 Méthode : Création Manuelle + Lien SQL

### Étape 1 : Créer les Admins dans Supabase Auth

1. Allez dans **Supabase Dashboard** → **"Authentication"** → **"Users"**
2. Cliquez sur **"Add user"** → **"Create new user"**
3. Pour chaque admin, créez l'utilisateur avec :
   - **Email** : L'email de l'admin
   - **Password** : Le mot de passe temporaire (`Admin1234!`)
   - **Auto Confirm User** : ✅ Cochez cette case (important !)

**Répétez pour chaque admin :**
- `laplenitude.hc@yahoo.com`
- `hakpovi95@yahoo.fr`
- `dieudange@gmail.com`

### Étape 2 : Récupérer les Auth User IDs

Après avoir créé chaque utilisateur dans Supabase Auth :

1. Dans la liste des utilisateurs, cliquez sur l'utilisateur
2. **Copiez l'UUID** (c'est l'`auth_user_id`)
3. Notez-le avec l'email correspondant

**Exemple :**
- `laplenitude.hc@yahoo.com` → `auth_user_id: abc123...`
- `hakpovi95@yahoo.fr` → `auth_user_id: def456...`
- `dieudange@gmail.com` → `auth_user_id: ghi789...`

### Étape 3 : Lier les Admins via SQL

Allez dans **Supabase Dashboard** → **"SQL Editor"** et exécutez ces requêtes :

#### Pour l'Admin 1 de la Clinique 1 (Chantal BOKO) :
```sql
UPDATE users
SET 
  auth_user_id = '[AUTH_USER_ID_DE_laplenitude.hc@yahoo.com]',
  status = 'PENDING',
  updated_at = NOW()
WHERE email = 'laplenitude.hc@yahoo.com'
  AND clinic_id = (SELECT id FROM clinics WHERE code = 'CLIN-PLENITUDE-001');
```

#### Pour l'Admin 2 de la Clinique 1 (Hilaire AKPOVI) :
```sql
UPDATE users
SET 
  auth_user_id = '[AUTH_USER_ID_DE_hakpovi95@yahoo.fr]',
  status = 'PENDING',
  updated_at = NOW()
WHERE email = 'hakpovi95@yahoo.fr'
  AND clinic_id = (SELECT id FROM clinics WHERE code = 'CLIN-PLENITUDE-001');
```

#### Pour l'Admin de la Clinique 2 (Ange Kevin Dieudonne MINHOU) :
```sql
UPDATE users
SET 
  auth_user_id = '[AUTH_USER_ID_DE_dieudange@gmail.com]',
  status = 'PENDING',
  updated_at = NOW()
WHERE email = 'dieudange@gmail.com'
  AND clinic_id = (SELECT id FROM clinics WHERE code = 'MAMELLES-001');
```

**⚠️ Remplacez `[AUTH_USER_ID_DE_...]` par les UUID que vous avez copiés à l'étape 2.**

---

## 🎯 Script SQL Complet (Tout en Un)

Si vous préférez, voici un script qui fait tout automatiquement. **Remplacez les UUID** par ceux que vous avez copiés :

```sql
-- ============================================
-- LIEN MANUEL DES ADMINS À SUPABASE AUTH
-- ============================================
-- Remplacez les UUID ci-dessous par les auth_user_id 
-- que vous avez copiés depuis Supabase Auth
-- ============================================

DO $$
DECLARE
  -- UUID des admins dans Supabase Auth (À REMPLACER !)
  v_admin1_auth_id UUID := '[UUID_DE_laplenitude.hc@yahoo.com]';
  v_admin2_auth_id UUID := '[UUID_DE_hakpovi95@yahoo.fr]';
  v_admin3_auth_id UUID := '[UUID_DE_dieudange@gmail.com]';
  
  -- IDs des cliniques
  v_clinic1_id UUID;
  v_clinic2_id UUID;
  
  -- Compteurs de mise à jour
  v_updated1 INT;
  v_updated2 INT;
  v_updated3 INT;
BEGIN
  -- Récupérer les IDs des cliniques
  SELECT id INTO v_clinic1_id FROM clinics WHERE code = 'CLIN-PLENITUDE-001';
  SELECT id INTO v_clinic2_id FROM clinics WHERE code = 'MAMELLES-001';
  
  -- Lier Admin 1 (Chantal BOKO)
  UPDATE users
  SET 
    auth_user_id = v_admin1_auth_id,
    status = 'PENDING',
    updated_at = NOW()
  WHERE email = 'laplenitude.hc@yahoo.com'
    AND clinic_id = v_clinic1_id;
  GET DIAGNOSTICS v_updated1 = ROW_COUNT;
  
  -- Lier Admin 2 (Hilaire AKPOVI)
  UPDATE users
  SET 
    auth_user_id = v_admin2_auth_id,
    status = 'PENDING',
    updated_at = NOW()
  WHERE email = 'hakpovi95@yahoo.fr'
    AND clinic_id = v_clinic1_id;
  GET DIAGNOSTICS v_updated2 = ROW_COUNT;
  
  -- Lier Admin 3 (Ange Kevin Dieudonne MINHOU)
  UPDATE users
  SET 
    auth_user_id = v_admin3_auth_id,
    status = 'PENDING',
    updated_at = NOW()
  WHERE email = 'dieudange@gmail.com'
    AND clinic_id = v_clinic2_id;
  GET DIAGNOSTICS v_updated3 = ROW_COUNT;
  
  -- Afficher les résultats
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LIEN DES ADMINS TERMINÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résultats:';
  RAISE NOTICE '   Admin 1 (laplenitude.hc@yahoo.com): % ligne(s) mise(s) à jour', v_updated1;
  RAISE NOTICE '   Admin 2 (hakpovi95@yahoo.fr): % ligne(s) mise(s) à jour', v_updated2;
  RAISE NOTICE '   Admin 3 (dieudange@gmail.com): % ligne(s) mise(s) à jour', v_updated3;
  RAISE NOTICE '';
  
  IF v_updated1 = 0 THEN
    RAISE WARNING '⚠️ Admin 1 non trouvé ou déjà lié';
  END IF;
  
  IF v_updated2 = 0 THEN
    RAISE WARNING '⚠️ Admin 2 non trouvé ou déjà lié';
  END IF;
  
  IF v_updated3 = 0 THEN
    RAISE WARNING '⚠️ Admin 3 non trouvé ou déjà lié';
  END IF;
END $$;

-- Vérification finale
SELECT 
  u.email,
  u.nom,
  u.prenom,
  u.auth_user_id,
  u.status,
  c.code AS clinic_code,
  c.name AS clinic_name
FROM users u
LEFT JOIN clinics c ON u.clinic_id = c.id
WHERE u.email IN (
  'laplenitude.hc@yahoo.com',
  'hakpovi95@yahoo.fr',
  'dieudange@gmail.com'
)
ORDER BY c.code, u.email;
```

---

## ✅ Vérification

Après avoir exécuté les requêtes, vérifiez que tout est correct :

```sql
-- Vérifier que tous les admins ont un auth_user_id
SELECT 
  email,
  nom,
  prenom,
  auth_user_id,
  clinic_id,
  CASE 
    WHEN auth_user_id IS NULL THEN '❌ Non lié'
    ELSE '✅ Lié'
  END AS statut_lien
FROM users
WHERE email IN (
  'laplenitude.hc@yahoo.com',
  'hakpovi95@yahoo.fr',
  'dieudange@gmail.com'
)
ORDER BY clinic_id, email;
```

Si tous les `auth_user_id` sont remplis, c'est bon ! ✅

---

## 📝 Résumé des Étapes

1. ✅ **Créer les admins dans Supabase Auth** (Dashboard → Authentication → Users)
2. ✅ **Copier les UUID** (auth_user_id) de chaque utilisateur
3. ✅ **Exécuter les requêtes SQL** pour lier les admins
4. ✅ **Vérifier** que les liens sont corrects

---

## ⚠️ Points Importants

### 1. Auto Confirm User
Lors de la création dans Supabase Auth, **cochez "Auto Confirm User"** pour que les admins puissent se connecter immédiatement.

### 2. Même Email
L'email dans Supabase Auth doit être **exactement le même** que celui dans la table `users` (même casse).

### 3. Mot de Passe
Le mot de passe dans Supabase Auth doit être le même que celui utilisé dans la migration (`Admin1234!`), ou vous devrez le mettre à jour.

### 4. Vérification du Lien
Après le lien, vérifiez que :
- `auth_user_id` n'est pas NULL dans la table `users`
- L'email correspond bien
- Le `clinic_id` est correct

---

## 🎉 Avantages de cette Méthode

✅ **Plus simple** : Pas besoin de Postman ou curl  
✅ **Visuel** : Vous voyez les utilisateurs dans Supabase Auth  
✅ **Contrôle** : Vous gérez vous-même la création  
✅ **Flexible** : Vous pouvez créer les utilisateurs quand vous voulez  

---

## 🔍 Si vous avez des problèmes

### L'utilisateur n'est pas trouvé dans la requête UPDATE
- Vérifiez que l'email est exactement le même (même casse)
- Vérifiez que la migration a bien créé les admins dans la table `users`

### L'auth_user_id n'est pas mis à jour
- Vérifiez que l'UUID est correct
- Vérifiez que l'email correspond bien

### L'admin ne peut pas se connecter
- Vérifiez que "Auto Confirm User" était coché lors de la création
- Vérifiez que le mot de passe est correct
- Vérifiez que `auth_user_id` est bien rempli dans la table `users`

---

**Cette méthode est parfaite si vous préférez créer les utilisateurs manuellement !** 🎯

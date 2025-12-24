# 🔧 RÉSOLUTION : Erreur "Code clinique invalide ou clinique inactive"

## 🔍 DIAGNOSTIC

L'erreur **"Code clinique invalide ou clinique inactive"** peut avoir plusieurs causes :

1. ❌ La clinique `CAMPUS-001` n'existe pas dans Supabase
2. ❌ La clinique existe mais `active = false`
3. ❌ Problème de RLS (Row Level Security) qui bloque l'accès
4. ❌ Variables d'environnement Supabase non configurées
5. ❌ Problème de connexion à Supabase

---

## ✅ SOLUTION ÉTAPE PAR ÉTAPE

### Étape 1 : Vérifier que la clinique existe

Exécuter dans **Supabase SQL Editor** :

```sql
-- Vérifier si la clinique existe
SELECT 
  id,
  code,
  name,
  active,
  created_at
FROM clinics
WHERE code = 'CAMPUS-001';
```

**Résultat attendu :** 1 ligne avec `code = 'CAMPUS-001'`

**Si aucun résultat :** La clinique n'existe pas → Passer à l'Étape 2

**Si résultat mais `active = false` :** Activer la clinique → Passer à l'Étape 3

---

### Étape 2 : Créer/Activer la clinique

Exécuter le script de diagnostic :

```
supabase_migrations/04_DIAGNOSTIC_CLINIQUE.sql
```

Ce script :
- ✅ Vérifie l'existence de la clinique
- ✅ Active la clinique si elle est inactive
- ✅ Crée la clinique si elle n'existe pas
- ✅ Lie l'admin clinique à la clinique

---

### Étape 3 : Vérifier les variables d'environnement

Vérifier que le fichier `.env` contient :

```env
VITE_SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8
```

**Important :**
- Le fichier `.env` doit être à la **racine du projet**
- Redémarrer l'application après modification

---

### Étape 4 : Vérifier les politiques RLS

Exécuter dans **Supabase SQL Editor** :

```sql
-- Vérifier les politiques RLS sur clinics
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'clinics';
```

**Résultat attendu :** Au moins une politique qui permet la lecture (`SELECT`) pour les utilisateurs authentifiés ou anonymes.

**Si aucune politique :** Créer une politique :

```sql
-- Permettre la lecture des cliniques actives pour tous
CREATE POLICY "Allow read active clinics"
ON clinics
FOR SELECT
USING (active = true);
```

---

### Étape 5 : Tester la connexion avec les logs

1. **Ouvrir la console du navigateur** (F12)
2. **Tenter la connexion** avec :
   - Code clinique : `CAMPUS-001`
   - Email : `bagarayannick1@gmail.com`
   - Mot de passe : `TempClinic2024!`
3. **Vérifier les logs** dans la console :
   - `🔍 Recherche de la clinique avec le code: CAMPUS-001`
   - `📊 Résultat de la recherche: {...}`
   - `✅ Clinique trouvée: {...}` ou `❌ Erreur: ...`

---

## 🛠️ CORRECTIONS APPORTÉES

### 1. Amélioration de la gestion d'erreur

Le composant `Login.tsx` affiche maintenant des messages d'erreur plus détaillés :
- ✅ "Code clinique 'XXX' introuvable" si la clinique n'existe pas
- ✅ "La clinique 'XXX' est inactive" si `active = false`
- ✅ Détails de l'erreur Supabase si problème de connexion

### 2. Script de diagnostic créé

`04_DIAGNOSTIC_CLINIQUE.sql` :
- Vérifie l'existence de la clinique
- Active la clinique si inactive
- Crée la clinique si elle n'existe pas
- Lie l'admin clinique à la clinique

---

## 📋 CHECKLIST DE VÉRIFICATION

- [ ] La clinique `CAMPUS-001` existe dans Supabase
- [ ] La clinique a `active = true`
- [ ] Les variables d'environnement sont configurées (`.env`)
- [ ] L'application a été redémarrée après modification de `.env`
- [ ] Les politiques RLS permettent la lecture des cliniques
- [ ] La console du navigateur affiche les logs de recherche
- [ ] Le code clinique est saisi en majuscules : `CAMPUS-001`

---

## 🆘 EN CAS DE PROBLÈME PERSISTANT

### 1. Vérifier la connexion Supabase

Dans la console du navigateur, vérifier :
```javascript
// Tester la connexion Supabase
import { supabase } from './src/services/supabase';

// Tester la requête
const { data, error } = await supabase
  .from('clinics')
  .select('*')
  .eq('code', 'CAMPUS-001');

console.log('Data:', data);
console.log('Error:', error);
```

### 2. Vérifier les logs Supabase

Dans **Supabase Dashboard** > **Logs** > **Postgres Logs**, vérifier les erreurs SQL.

### 3. Vérifier les permissions RLS

Exécuter :
```sql
-- Désactiver temporairement RLS pour tester (⚠️ À réactiver après)
ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;

-- Tester la connexion

-- Réactiver RLS
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
```

---

## ✅ SOLUTION RAPIDE

Si vous voulez une solution rapide, exécutez ce script dans **Supabase SQL Editor** :

```sql
-- Solution rapide : Créer/Activer la clinique
DO $$
DECLARE
  v_super_admin_id UUID;
  v_clinic_id UUID;
BEGIN
  -- Récupérer l'ID du Super-Admin
  SELECT id INTO v_super_admin_id
  FROM users
  WHERE email = 'babocher21@gmail.com'
  AND role = 'SUPER_ADMIN'
  LIMIT 1;
  
  -- Vérifier si la clinique existe
  SELECT id INTO v_clinic_id
  FROM clinics
  WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NULL THEN
    -- Créer la clinique
    INSERT INTO clinics (
      code, name, address, phone, email, active, created_by_super_admin
    ) VALUES (
      'CAMPUS-001',
      'Clinique du Campus',
      'Quartier Arafat; rue opposée universite ESAE',
      '+229 90904344',
      'cliniquemedicalecampus@gmail.com',
      true,
      v_super_admin_id
    )
    RETURNING id INTO v_clinic_id;
  ELSE
    -- Activer la clinique
    UPDATE clinics SET active = true WHERE id = v_clinic_id;
  END IF;
  
  -- Lier l'admin clinique
  UPDATE users
  SET clinic_id = v_clinic_id
  WHERE email = 'bagarayannick1@gmail.com';
  
  RAISE NOTICE '✅ Clinique CAMPUS-001 créée/activée avec succès';
END $$;
```

---

**✅ Après avoir exécuté ces étapes, la connexion devrait fonctionner !**



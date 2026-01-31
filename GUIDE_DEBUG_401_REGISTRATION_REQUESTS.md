# 🔍 Guide de Débogage - Erreur 401 sur Demandes d'Inscription

## Problème
Erreur 401 (Unauthorized) lors du chargement des demandes d'inscription dans le module "Demandes d'inscription".

---

## 🔎 Diagnostic Étape par Étape

### Étape 1: Vérifier le Token dans le Navigateur

1. **Ouvrez la Console du Navigateur** (F12 → Console)
2. **Exécutez cette commande:**
   ```javascript
   console.log('Token:', localStorage.getItem('token'));
   ```

3. **Vérifications:**
   - ✅ Le token existe et commence par `eyJ` (JWT valide)
   - ❌ Le token est `null` → **Problème: Session expirée**
   - ❌ Le token ne commence pas par `eyJ` → **Problème: Token invalide**

### Étape 2: Vérifier les Logs Backend

Dans les logs du serveur Node.js, cherchez:

```
🔐 Vérification du token Supabase Auth...
```

**Si vous voyez:**
- `❌ Erreur Supabase Auth:` → Le token est invalide ou expiré
- `✅ Token Supabase Auth valide pour:` → Le token est valide, problème ailleurs
- `❌ Profil utilisateur introuvable` → L'utilisateur n'existe pas dans la table `users`
- `⚠️ Compte utilisateur inactif` → L'utilisateur a `actif=false` ou `status=PENDING`

### Étape 3: Vérifier le Profil Utilisateur dans la Base

Exécutez cette requête SQL dans Supabase SQL Editor:

```sql
-- Remplacer 'bagarayannick1@gmail.com' par l'email de l'utilisateur concerné
SELECT 
  id,
  email,
  role,
  clinic_id,
  status,
  actif,
  auth_user_id,
  created_at
FROM users
WHERE email = 'bagarayannick1@gmail.com';
```

**Vérifications:**
- ✅ `actif = true` ET `status IN ('ACTIVE', 'APPROVED')`
- ✅ `clinic_id IS NOT NULL`
- ✅ `auth_user_id IS NOT NULL`
- ❌ Si `actif = false` → **Problème: Compte inactif**
- ❌ Si `status = 'PENDING'` → **Problème: Compte en attente**
- ❌ Si `clinic_id IS NULL` → **Problème: Utilisateur sans clinique**

### Étape 4: Vérifier la Session Supabase Auth

Dans la Console du Navigateur, exécutez:

```javascript
// Si vous utilisez le client Supabase
import { supabase } from './services/supabase';
const { data: { session } } = await supabase.auth.getSession();
console.log('Session Supabase:', session);
```

**Vérifications:**
- ✅ `session` existe et contient un `access_token`
- ❌ `session` est `null` → **Problème: Pas de session Supabase**

---

## 🔧 Solutions selon le Problème

### Solution 1: Token Manquant ou Expiré

**Symptômes:**
- Token `null` dans localStorage
- Erreur 401 immédiate

**Solution:**
1. Déconnectez-vous complètement
2. Reconnectez-vous avec vos identifiants
3. Vérifiez que le token est bien stocké après connexion

**Code de vérification:**
```javascript
// Après connexion, vérifier
const token = localStorage.getItem('token');
if (token && token.startsWith('eyJ')) {
  console.log('✅ Token JWT valide stocké');
} else {
  console.error('❌ Token invalide ou manquant');
}
```

---

### Solution 2: Compte Utilisateur Inactif ou PENDING

**Symptômes:**
- Token valide mais erreur 403 avec message "Compte inactif"
- Utilisateur avec `status = 'PENDING'` ou `actif = false`

**Solution SQL:**
```sql
-- Activer le compte utilisateur
UPDATE users
SET 
  actif = true,
  status = 'ACTIVE'
WHERE email = 'bagarayannick1@gmail.com'
  AND (actif = false OR status = 'PENDING');
```

**⚠️ Attention:** Vérifiez que l'utilisateur doit vraiment être activé avant d'exécuter cette requête.

---

### Solution 3: Utilisateur sans clinic_id

**Symptômes:**
- Token valide, compte actif, mais erreur 400 "Contexte de clinique manquant"
- `clinic_id IS NULL` dans la table `users`

**Solution SQL:**
```sql
-- Assigner une clinique à l'utilisateur
-- Remplacez 'CLINIC_CODE' par le code de la clinique appropriée
UPDATE users
SET clinic_id = (
  SELECT id FROM clinics WHERE code = 'CLINIC_CODE' LIMIT 1
)
WHERE email = 'bagarayannick1@gmail.com'
  AND clinic_id IS NULL;
```

---

### Solution 4: Profil Utilisateur Introuvable

**Symptômes:**
- Token Supabase Auth valide mais erreur 403 "Profil utilisateur introuvable"
- Pas de ligne dans `users` pour cet `auth_user_id`

**Solution:**
1. Vérifiez que l'utilisateur existe dans Supabase Auth
2. Vérifiez que l'utilisateur a un profil dans la table `users`
3. Si le profil manque, créez-le manuellement ou reconnectez-vous pour le créer automatiquement

**Vérification:**
```sql
-- Trouver l'auth_user_id depuis Supabase Auth
-- Puis vérifier dans users
SELECT * FROM users WHERE auth_user_id = 'UUID_FROM_SUPABASE_AUTH';
```

---

## 🧪 Test de la Route API Directement

Testez la route directement avec curl ou Postman:

```bash
# Remplacer TOKEN par votre token JWT
curl -X GET "http://localhost:7242/api/auth/registration-requests" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

**Réponses attendues:**
- `200 OK` → Tout fonctionne
- `401 Unauthorized` → Token invalide/expiré
- `403 Forbidden` → Compte inactif ou profil manquant
- `400 Bad Request` → Contexte de clinique manquant

---

## 📋 Checklist de Vérification

Avant de signaler le problème, vérifiez:

- [ ] Le token existe dans `localStorage.getItem('token')`
- [ ] Le token est un JWT valide (commence par `eyJ`)
- [ ] L'utilisateur existe dans la table `users`
- [ ] L'utilisateur a `actif = true`
- [ ] L'utilisateur a `status IN ('ACTIVE', 'APPROVED')`
- [ ] L'utilisateur a un `clinic_id` non NULL
- [ ] L'utilisateur a un `auth_user_id` correspondant à Supabase Auth
- [ ] Les logs backend montrent des erreurs spécifiques
- [ ] La migration `74_FIX_MULTI_TENANT_ISOLATION_COMPLETE.sql` a été appliquée

---

## 🔍 Logs à Surveiller

### Côté Frontend (Console Navigateur)
```
✅ Demandes d'inscription chargées: X
❌ Token manquant dans localStorage
❌ Token non-JWT détecté
❌ Erreur 401 - Authentification échouée
```

### Côté Backend (Logs Serveur)
```
🔐 Vérification du token Supabase Auth...
✅ Token Supabase Auth valide pour: email@example.com
📋 Profil utilisateur trouvé: { id, email, role, clinic_id, status, actif }
✅ Authentification réussie pour: { userId, email, role, clinicId }
📥 Requête GET /registration-requests reçue
🔐 Utilisateur récupérant les demandes: { userId, role, clinicId }
📋 Demandes d'inscription trouvées: { count, clinicId }
```

---

## 🚨 Problèmes Courants et Solutions

### Problème: "Token invalide ou expiré"
**Cause:** Le token JWT a expiré (durée de vie par défaut: 1 heure)  
**Solution:** Reconnectez-vous pour obtenir un nouveau token

### Problème: "Profil utilisateur introuvable"
**Cause:** L'utilisateur existe dans Supabase Auth mais pas dans la table `users`  
**Solution:** Créez le profil manuellement ou reconnectez-vous pour le créer automatiquement

### Problème: "Compte inactif, en attente d'activation"
**Cause:** `actif = false` ou `status = 'PENDING'`  
**Solution:** Activez le compte via SQL (voir Solution 2)

### Problème: "Contexte de clinique manquant"
**Cause:** L'utilisateur n'a pas de `clinic_id` assigné  
**Solution:** Assignez un `clinic_id` via SQL (voir Solution 3)

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide:

1. **Collectez les informations suivantes:**
   - Logs complets du backend (avec les messages `🔐`, `✅`, `❌`)
   - Résultat de la requête SQL de vérification du profil utilisateur
   - Token (premiers 20 caractères seulement pour sécurité)
   - Email de l'utilisateur concerné

2. **Vérifiez que:**
   - La migration `74_FIX_MULTI_TENANT_ISOLATION_COMPLETE.sql` a été appliquée
   - Les policies RLS sur `registration_requests` sont correctes
   - Le serveur backend est bien démarré et accessible

---

**Dernière mise à jour:** 2026-01-31

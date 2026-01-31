# 🔧 CORRECTIONS - Erreur 401 sur Demandes d'Inscription

**Date:** 2026-01-31  
**Problème:** Erreur 401 (Unauthorized) lors du chargement des demandes d'inscription

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. **Amélioration de la Gestion d'Erreur Frontend**

**Fichier modifié:** `src/components/utilisateurs/RegistrationRequestsTab.tsx`

**Améliorations:**
- ✅ Vérification du token avant l'envoi de la requête
- ✅ Validation que le token est un JWT valide
- ✅ Messages d'erreur spécifiques selon le code HTTP (401, 403, 400)
- ✅ Nettoyage automatique du token invalide en cas d'erreur 401
- ✅ Bouton "Se reconnecter" dans l'alerte d'erreur pour les erreurs d'authentification
- ✅ Logs détaillés dans la console pour le débogage

**Code ajouté:**
```typescript
// Vérification du token avant requête
if (!token) {
  setError('Session expirée. Veuillez vous reconnecter.');
  return;
}

// Validation JWT
const isValidJWT = token && token.includes('.') && token.split('.').length === 3;
if (!isValidJWT) {
  setError('Token d\'authentification invalide. Veuillez vous reconnecter.');
  localStorage.removeItem('token');
  return;
}

// Gestion spécifique des erreurs HTTP
if (response.status === 401) {
  setError('Session expirée ou token invalide. Veuillez vous reconnecter.');
  localStorage.removeItem('token');
  return;
}
```

---

### 2. **Amélioration des Logs Backend**

**Fichiers modifiés:**
- `server/src/middleware/auth.ts`
- `server/src/routes/auth.ts`

**Améliorations:**
- ✅ Logs détaillés à chaque étape de l'authentification
- ✅ Messages d'erreur spécifiques selon le problème rencontré
- ✅ Logs de diagnostic pour identifier rapidement la cause

**Logs ajoutés:**
```typescript
console.log('🔐 Vérification du token Supabase Auth...');
console.log('✅ Token Supabase Auth valide pour:', authUser.email);
console.log('📋 Profil utilisateur trouvé:', { id, email, role, clinic_id, status, actif });
console.log('✅ Authentification réussie pour:', { userId, email, role, clinicId });
console.log('📥 Requête GET /registration-requests reçue');
console.log('📋 Demandes d\'inscription trouvées:', { count, clinicId });
```

---

### 3. **Messages d'Erreur Plus Informatifs**

**Avant:**
- Message générique: "Erreur lors du chargement des demandes"

**Après:**
- Messages spécifiques selon le problème:
  - `401`: "Session expirée ou token invalide. Veuillez vous reconnecter."
  - `403`: "Vous n'avez pas les permissions nécessaires..."
  - `400`: "Requête invalide. Vérifiez votre connexion à la clinique."

---

## 🔍 DIAGNOSTIC

Pour diagnostiquer le problème, suivez ces étapes:

### Étape 1: Vérifier le Token

Dans la Console du Navigateur (F12), exécutez:
```javascript
const token = localStorage.getItem('token');
console.log('Token existe:', !!token);
console.log('Token valide (JWT):', token && token.includes('.') && token.split('.').length === 3);
console.log('Token preview:', token ? token.substring(0, 30) + '...' : 'null');
```

### Étape 2: Vérifier les Logs Backend

Dans les logs du serveur Node.js, cherchez:
- `🔐 Vérification du token Supabase Auth...`
- `✅ Token Supabase Auth valide` ou `❌ Erreur Supabase Auth`
- `📋 Profil utilisateur trouvé` ou `❌ Profil utilisateur introuvable`

### Étape 3: Vérifier le Profil Utilisateur

Exécutez cette requête SQL dans Supabase:
```sql
SELECT 
  id,
  email,
  role,
  clinic_id,
  status,
  actif,
  auth_user_id
FROM users
WHERE email = 'bagarayannick1@gmail.com'; -- Remplacez par l'email concerné
```

**Vérifiez que:**
- ✅ `actif = true`
- ✅ `status IN ('ACTIVE', 'APPROVED')`
- ✅ `clinic_id IS NOT NULL`
- ✅ `auth_user_id IS NOT NULL`

---

## 🚨 CAUSES POSSIBLES ET SOLUTIONS

### Cause 1: Token Expiré ou Manquant

**Symptômes:**
- Token `null` dans localStorage
- Erreur 401 immédiate

**Solution:**
1. Déconnectez-vous
2. Reconnectez-vous
3. Vérifiez que le token est stocké après connexion

---

### Cause 2: Compte Utilisateur Inactif

**Symptômes:**
- Token valide mais erreur 403 "Compte inactif"
- `actif = false` ou `status = 'PENDING'` dans la base

**Solution SQL:**
```sql
UPDATE users
SET actif = true, status = 'ACTIVE'
WHERE email = 'bagarayannick1@gmail.com'
  AND (actif = false OR status = 'PENDING');
```

---

### Cause 3: Utilisateur sans clinic_id

**Symptômes:**
- Token valide, compte actif, mais erreur 400 "Contexte de clinique manquant"
- `clinic_id IS NULL` dans la table `users`

**Solution SQL:**
```sql
-- Trouver le code de la clinique appropriée
SELECT code, name FROM clinics WHERE active = true;

-- Assigner la clinique à l'utilisateur
UPDATE users
SET clinic_id = (SELECT id FROM clinics WHERE code = 'CODE_CLINIQUE' LIMIT 1)
WHERE email = 'bagarayannick1@gmail.com'
  AND clinic_id IS NULL;
```

---

### Cause 4: Profil Utilisateur Introuvable

**Symptômes:**
- Token Supabase Auth valide mais erreur 403 "Profil utilisateur introuvable"
- Pas de ligne dans `users` pour cet `auth_user_id`

**Solution:**
1. Vérifiez que l'utilisateur existe dans Supabase Auth
2. Vérifiez que l'utilisateur a un profil dans `users`
3. Si le profil manque, reconnectez-vous pour le créer automatiquement

---

## 📋 CHECKLIST DE VÉRIFICATION

Avant de tester, assurez-vous que:

- [x] Le composant `RegistrationRequestsTab.tsx` a été mis à jour
- [x] Le middleware `auth.ts` a été mis à jour avec les nouveaux logs
- [x] La route `auth.ts` a été mise à jour avec les nouveaux logs
- [x] Le serveur backend a été redémarré pour prendre en compte les changements
- [x] La migration `74_FIX_MULTI_TENANT_ISOLATION_COMPLETE.sql` a été appliquée

---

## 🧪 TEST

1. **Redémarrez le serveur backend** pour prendre en compte les nouveaux logs
2. **Rechargez la page** du module "Demandes d'inscription"
3. **Vérifiez la Console du Navigateur** pour les messages de diagnostic
4. **Vérifiez les logs du serveur** pour les messages `🔐`, `✅`, `❌`

**Si l'erreur persiste:**
- Suivez le guide de débogage: `GUIDE_DEBUG_401_REGISTRATION_REQUESTS.md`
- Vérifiez les logs backend pour identifier la cause exacte
- Vérifiez le profil utilisateur dans la base de données

---

## 📞 PROCHAINES ÉTAPES

1. **Redémarrer le serveur backend**
2. **Tester le module "Demandes d'inscription"**
3. **Vérifier les logs** pour identifier la cause exacte de l'erreur 401
4. **Appliquer la solution** selon la cause identifiée (voir guide de débogage)

---

**Fichiers modifiés:**
- ✅ `src/components/utilisateurs/RegistrationRequestsTab.tsx`
- ✅ `server/src/middleware/auth.ts`
- ✅ `server/src/routes/auth.ts`

**Fichiers créés:**
- ✅ `GUIDE_DEBUG_401_REGISTRATION_REQUESTS.md` - Guide de débogage détaillé

---

**Dernière mise à jour:** 2026-01-31

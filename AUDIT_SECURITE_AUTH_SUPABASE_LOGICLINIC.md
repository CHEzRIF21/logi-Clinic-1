# 🔒 AUDIT DE SÉCURITÉ - AUTHENTIFICATION & AUTORISATION
## Logiclinic SaaS Multi-Tenant

**Date** : 2026-01-30  
**Auditeur** : Expert Senior Sécurité SaaS  
**Scope** : Supabase Auth, RLS, Workflow Staff, Isolation Multi-Tenant

---

## 📋 RÉSUMÉ EXÉCUTIF

### ✅ Points Positifs
- ✅ Middleware `requireClinicContext` bloque correctement les utilisateurs sans `clinic_id`
- ✅ Policies RLS pour `registration_requests` sont correctement configurées
- ✅ Reset password implémenté avec session recovery obligatoire
- ✅ Pas de dépendance directe au `clinic_id` dans Supabase Auth

### ⚠️ Problèmes Critiques Identifiés
- 🔴 **CRITIQUE** : 1 utilisateur sans `clinic_id` (5% des utilisateurs)
- 🔴 **CRITIQUE** : 3 utilisateurs avec `status='PENDING'` mais `actif=true` (peuvent se connecter)
- 🟠 **ÉLEVÉ** : Policy RLS `users_admin_or_self_policy` trop complexe, risque de fuites
- 🟠 **ÉLEVÉ** : Fonction `get_my_clinic_id()` ne vérifie pas toujours `actif=true`
- 🟡 **MOYEN** : Workflow d'inscription peut créer des incohérences

---

## 1️⃣ AUDIT AUTH SUPABASE

### 1.1 Analyse des Méthodes Auth

#### ✅ `signInWithPassword` (Login.tsx:777)
**Statut** : ✅ Correctement implémenté

```typescript
const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
  email: email,
  password: credentials.password.trim(),
});
```

**Points positifs** :
- ✅ Gestion d'erreur correcte (400 = identifiants invalides)
- ✅ Fallback pour comptes démo (sans `auth_user_id`)
- ✅ Vérification que les comptes avec `auth_user_id` nécessitent une session Supabase Auth valide

**Problème identifié** :
- ⚠️ **Ligne 849-853** : Logique de filtrage par `clinic_id` qui permet aux SUPER_ADMIN de se connecter même si leur `clinic_id` ne correspond pas au code clinique saisi

```typescript
if (isSuperAdmin) {
  user = userData; // ⚠️ Pas de vérification clinic_id pour SUPER_ADMIN
} else if (userData.clinic_id === clinic.id) {
  user = userData;
}
```

**Recommandation** :
- Même les SUPER_ADMIN doivent avoir un `clinic_id` valide (conforme à `requireClinicContext`)

#### ✅ `resetPasswordForEmail` (ForgotPasswordDialog.tsx:81)
**Statut** : ✅ Correctement implémenté

**Points positifs** :
- ✅ Timeout de 30 secondes pour éviter les blocages
- ✅ Gestion d'erreurs spécifiques (504, 429, réseau)
- ✅ Message générique même si l'email n'existe pas (prévention user enumeration)

#### ✅ `updateUser` (ResetPassword.tsx:181)
**Statut** : ✅ Correctement implémenté

**Points positifs** :
- ✅ Validation de complexité du mot de passe (8+ caractères, majuscule, minuscule, chiffre)
- ✅ Déconnexion automatique après succès (`signOut()`)
- ✅ Redirection vers `/login` après 2 secondes

#### ✅ `signOut` (ResetPassword.tsx:196)
**Statut** : ✅ Correctement implémenté

**Points positifs** :
- ✅ Appelé après réinitialisation réussie
- ✅ Évite les sessions fantômes

### 1.2 Gestion des Erreurs

**Statut** : ✅ Bonne gestion globale

**Points positifs** :
- ✅ Détection des erreurs Supabase (400, 401, 403, 500)
- ✅ Messages d'erreur spécifiques selon le type
- ✅ Gestion des erreurs de maintenance Supabase

**Amélioration suggérée** :
- Ajouter un logging structuré pour les erreurs auth (sans exposer les credentials)

---

## 2️⃣ AUDIT USERS / PROFILES

### 2.1 Structure de la Table `users`

**Schéma vérifié** :
```sql
- id (uuid, PK)
- nom (varchar, NOT NULL)
- prenom (varchar, NOT NULL)
- email (varchar, NOT NULL)
- password_hash (text, nullable) ✅
- role (varchar, NOT NULL) ✅
- clinic_id (uuid, nullable) ⚠️ DEVRAIT ÊTRE NOT NULL
- status (varchar, default 'PENDING') ✅
- actif (boolean, default true) ⚠️ DEVRAIT ÊTRE false par défaut
- auth_user_id (uuid, nullable) ✅
```

### 2.2 Problèmes Identifiés dans la Base

**Requête d'audit exécutée** :
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN clinic_id IS NULL THEN 1 END) as users_without_clinic,
  COUNT(CASE WHEN status = 'PENDING' AND actif = true THEN 1 END) as pending_active,
  COUNT(CASE WHEN auth_user_id IS NULL AND password_hash IS NULL THEN 1 END) as users_no_auth
FROM users;
```

**Résultats** :
- 🔴 **1 utilisateur sans `clinic_id`** (sur 20 = 5%)
- 🔴 **3 utilisateurs avec `status='PENDING'` mais `actif=true`** (peuvent se connecter alors qu'ils ne devraient pas)
- ✅ **0 utilisateur sans moyen d'authentification**

### 2.3 Incohérences Auth ↔ Tables Métier

**Problème identifié** :
- ⚠️ **Ligne Login.tsx:835-837** : Cas où `auth_user_id` existe mais le profil `users` n'est pas trouvé

```typescript
if (!err && !userData) {
  authOkButProfileMissing = true; // ⚠️ Problème de synchronisation
}
```

**Impact** :
- L'utilisateur peut avoir un compte Supabase Auth valide mais pas de profil métier
- Risque de contournement si le middleware backend ne vérifie pas le profil

**Recommandation** :
- Créer un trigger Supabase qui crée automatiquement un profil `users` lors de la création d'un compte Auth
- Ou vérifier systématiquement l'existence du profil dans tous les middlewares

---

## 3️⃣ WORKFLOW INSCRIPTION STAFF

### 3.1 Flux d'Inscription

**Route** : `POST /api/auth/register-request` (server/src/routes/auth.ts:22)

**Points positifs** :
- ✅ Validation du code clinique obligatoire
- ✅ Validation des questions de sécurité
- ✅ Création dans `registration_requests` avec `statut='pending'`

### 3.2 Flux d'Approbation

**Route** : `POST /api/auth/registration-requests/:id/approve` (server/src/routes/auth.ts:390)

**Workflow actuel** :
1. ✅ Création du compte Supabase Auth (`supabaseAdmin.auth.admin.createUser`)
2. ✅ Création du profil `users` avec `actif=false`, `status='PENDING'`
3. ✅ Génération d'un lien de réinitialisation
4. ✅ Mise à jour de `registration_requests` avec `statut='approved'`

**Problème identifié** :
- ⚠️ **Ligne 530-531** : L'utilisateur est créé avec `actif=false` et `status='PENDING'`
- ⚠️ **Mais** : La requête SQL d'audit montre 3 utilisateurs avec `status='PENDING'` et `actif=true`

**Hypothèses** :
1. Un script ou une migration a modifié manuellement ces utilisateurs
2. Un endpoint d'activation existe mais ne vérifie pas le statut
3. Un bug dans le workflow d'activation

**Recommandation** :
- Vérifier l'endpoint `POST /auth/users/:id/activate` (mentionné ligne 34)
- S'assurer qu'il vérifie `status='PENDING'` ET `actif=false` avant activation

### 3.3 Affichage dans le Module Validation

**Composant** : `RegistrationRequests.tsx`

**Points positifs** :
- ✅ Filtrage par statut (`pending`, `approved`, `rejected`)
- ✅ Affichage des statistiques

**Problème potentiel** :
- ⚠️ **Ligne 113** : La requête utilise `?statut=${filterStatus}` mais le backend peut filtrer par `clinic_id` via RLS
- Si un utilisateur n'a pas de `clinic_id`, il ne verra aucune demande (même les siennes)

**Recommandation** :
- Vérifier que les admins de clinique voient bien toutes les demandes de leur clinique
- Ajouter des logs pour déboguer les cas où aucune demande n'apparaît

---

## 4️⃣ AUDIT RESET PASSWORD

### 4.1 Configuration Redirect URLs

**Statut** : ✅ Correctement configuré

**Vérification** :
- ✅ Page `/reset-password` existe et est accessible publiquement
- ✅ `redirectTo` dans `ForgotPasswordDialog.tsx:71` pointe vers `${window.location.origin}/reset-password`

**Recommandation** :
- Vérifier manuellement dans le dashboard Supabase que l'URL est bien dans la liste des Redirect URLs autorisées

### 4.2 Sécurité de la Page `/reset-password`

**Fichier** : `src/pages/ResetPassword.tsx`

**Points positifs** :
- ✅ Vérification de session recovery obligatoire (ligne 98: `event === "PASSWORD_RECOVERY"`)
- ✅ Nettoyage de l'URL après lecture des tokens (ligne 41-45)
- ✅ Validation de complexité du mot de passe
- ✅ Déconnexion après succès

**Points à améliorer** :
- ⚠️ **Ligne 120** : Vérification de `session.user?.app_metadata?.recovery` mais cette propriété peut ne pas exister
- ⚠️ **Ligne 70-73** : `setSession` avec tokens depuis l'URL peut être vulnérable si les tokens sont interceptés

**Recommandation** :
- Utiliser uniquement `onAuthStateChange` avec `PASSWORD_RECOVERY` pour détecter la session recovery
- Ne pas faire confiance à `app_metadata.recovery` qui peut être manipulé

### 4.3 Absence de Dépendance au `clinic_id`

**Statut** : ✅ Correct

**Vérification** :
- ✅ Aucune référence à `clinic_id` dans `ResetPassword.tsx`
- ✅ Aucune référence à `clinic_id` dans `ForgotPasswordDialog.tsx`
- ✅ Le reset password est global à l'utilisateur (bonne pratique SaaS)

---

## 5️⃣ AUDIT RÔLES & AUTORISATIONS

### 5.1 Vérification des Rôles

**Middleware Backend** : `server/src/middleware/auth.ts`

**Points positifs** :
- ✅ Le rôle est récupéré depuis la base de données (ligne 106: `userProfile.role`)
- ✅ Pas de décision de rôle uniquement côté frontend

**Problème identifié** :
- ⚠️ **Ligne 100** : Fallback vers `authUser.user_metadata?.clinic_id` si `userProfile.clinic_id` est NULL
- ⚠️ **Ligne 44** : En développement, utilisation de `req.headers['x-clinic-id']` (désactivé en production mais dangereux)

**Recommandation** :
- Supprimer complètement le fallback `user_metadata?.clinic_id`
- Supprimer complètement le code de développement avec `x-clinic-id`

### 5.2 Guards Frontend

**Statut** : ⚠️ À vérifier

**Recommandation** :
- Vérifier que tous les composants qui affichent des actions admin vérifient le rôle depuis le contexte utilisateur (pas depuis localStorage)
- Ajouter des guards sur les routes sensibles

### 5.3 Vérifications Backend

**Middleware** : `requireClinicContext` (server/src/middleware/clinicContext.ts)

**Points positifs** :
- ✅ Bloque les utilisateurs sans `clinic_id` (ligne 38-44)
- ✅ Même les SUPER_ADMIN doivent avoir un `clinic_id`

**Problème identifié** :
- ⚠️ **Ligne 35** : `isSuperAdmin` est calculé mais n'est utilisé que pour l'exposition dans `clinicReq.isSuperAdmin`
- Le middleware ne permet pas aux SUPER_ADMIN d'accéder à toutes les cliniques (conforme à l'isolation stricte)

**Recommandation** :
- ✅ **Conserver cette logique** : L'isolation stricte est une bonne pratique même pour SUPER_ADMIN

---

## 6️⃣ AUDIT RLS (LIEN AUTH ↔ DATA)

### 6.1 Fonction `get_my_clinic_id()`

**Définition** : `supabase_migrations/24_COMPLETE_MULTI_TENANT_ARCHITECTURE.sql:423`

**Version actuelle** :
```sql
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT clinic_id INTO v_clinic_id
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_clinic_id;
END;
$$;
```

**Problème identifié** :
- ⚠️ **Ne vérifie pas `actif=true`** : Un utilisateur inactif peut toujours avoir son `clinic_id` retourné
- ⚠️ **Ne vérifie pas `status`** : Un utilisateur `PENDING` ou `SUSPENDED` peut avoir son `clinic_id` retourné

**Impact** :
- Les policies RLS qui utilisent `get_my_clinic_id()` peuvent permettre l'accès aux données même si l'utilisateur est inactif

**Correction proposée** :
```sql
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT clinic_id INTO v_clinic_id
  FROM users
  WHERE auth_user_id = auth.uid()
    AND actif = true
    AND status IN ('ACTIVE', 'APPROVED') -- Exclure PENDING, SUSPENDED, REJECTED
  LIMIT 1;
  
  RETURN v_clinic_id;
END;
$$;
```

### 6.2 Policies RLS - Table `users`

**Policy actuelle** : `users_admin_or_self_policy`

**Définition** :
```sql
FOR ALL TO authenticated
USING (
  (id = (SELECT users_1.id FROM users users_1 WHERE users_1.auth_user_id = auth.uid() LIMIT 1))
  OR check_is_super_admin()
  OR (
    (clinic_id = (SELECT users_1.clinic_id FROM users users_1 WHERE users_1.auth_user_id = auth.uid() AND users_1.actif = true LIMIT 1))
    AND (EXISTS (SELECT 1 FROM users users_1 WHERE users_1.auth_user_id = auth.uid() AND ...))
  )
)
```

**Problèmes identifiés** :
- 🔴 **Trop complexe** : Plusieurs sous-requêtes qui peuvent être lentes
- 🔴 **Risque de fuite** : La logique `OR check_is_super_admin()` permet aux SUPER_ADMIN de voir tous les utilisateurs
- ⚠️ **Incohérence** : Certaines sous-requêtes vérifient `actif=true`, d'autres non

**Correction proposée** :
```sql
-- Policy pour lecture de son propre profil
CREATE POLICY "users_read_own_profile" ON users
FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());

-- Policy pour les admins de clinique (voir les utilisateurs de leur clinique)
CREATE POLICY "users_clinic_admin_read" ON users
FOR SELECT TO authenticated
USING (
  clinic_id = get_my_clinic_id()
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid()
      AND u.clinic_id = users.clinic_id
      AND u.role IN ('CLINIC_ADMIN', 'ADMIN')
      AND u.actif = true
      AND u.status = 'ACTIVE'
  )
);

-- Policy pour mise à jour de son propre profil
CREATE POLICY "users_update_own_profile" ON users
FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());
```

**Note** : Supprimer l'exception SUPER_ADMIN pour respecter l'isolation stricte.

### 6.3 Policies RLS - Table `registration_requests`

**Statut** : ✅ Correctement configurées

**Policies vérifiées** :
- ✅ `registration_requests_select` : Filtre par `clinic_id = get_my_clinic_id()` OU `check_is_super_admin()`
- ✅ `registration_requests_insert` : Permet l'insertion anonyme avec validation
- ✅ `registration_requests_update_admin` : Seulement pour admins de la même clinique

**Recommandation** :
- Supprimer l'exception `check_is_super_admin()` pour l'isolation stricte (optionnel selon les besoins métier)

### 6.4 Détection de Fuites Inter-Cliniques

**Méthode de test** :
1. Créer un utilisateur Clinique A
2. Créer un utilisateur Clinique B
3. Tenter d'accéder aux données de Clinique B avec le compte Clinique A

**Recommandation** :
- Exécuter des tests d'intégration automatisés pour vérifier l'isolation
- Vérifier que toutes les tables métier utilisent `clinic_id = get_my_clinic_id()` dans leurs policies

---

## 7️⃣ TESTS MULTI-SESSION

### 7.1 Scénario de Test Proposé

**Test 1 : Isolation Clinique A vs Clinique B**
```
1. Créer utilisateur A (clinic_id = UUID_A)
2. Créer utilisateur B (clinic_id = UUID_B)
3. Se connecter avec A
4. Tenter de lire les patients de B via API
5. Vérifier que la réponse est vide ou 403
```

**Test 2 : Utilisateur PENDING**
```
1. Créer utilisateur avec status='PENDING', actif=false
2. Tenter de se connecter
3. Vérifier que la connexion est refusée
```

**Test 3 : Utilisateur sans clinic_id**
```
1. Créer utilisateur sans clinic_id
2. Se connecter
3. Tenter d'accéder à une route protégée
4. Vérifier que requireClinicContext bloque (403)
```

**Test 4 : Reset Password**
```
1. Demander un reset password
2. Cliquer sur le lien dans l'email
3. Vérifier que la page /reset-password détecte PASSWORD_RECOVERY
4. Changer le mot de passe
5. Vérifier que la session est fermée après succès
```

---

## 8️⃣ TABLEAU RÉCAPITULATIF DES PROBLÈMES

| # | Problème | Origine | Gravité | Correction |
|---|----------|---------|--------|------------|
| 1 | 1 utilisateur sans `clinic_id` | Migration manuelle ou bug création | 🔴 CRITIQUE | Script de correction + contrainte NOT NULL |
| 2 | 3 utilisateurs `PENDING` mais `actif=true` | Bug workflow activation | 🔴 CRITIQUE | Script de correction + vérification endpoint activation |
| 3 | `get_my_clinic_id()` ne vérifie pas `actif` | Migration incomplète | 🟠 ÉLEVÉ | Migration SQL pour ajouter vérification |
| 4 | Policy `users_admin_or_self_policy` trop complexe | Design initial | 🟠 ÉLEVÉ | Refactoriser en 3 policies séparées |
| 5 | Fallback `user_metadata?.clinic_id` dans middleware | Code legacy | 🟡 MOYEN | Supprimer le fallback |
| 6 | Code dev avec `x-clinic-id` header | Mode développement | 🟡 MOYEN | Supprimer complètement |
| 7 | SUPER_ADMIN peut se connecter sans vérifier `clinic_id` | Login.tsx ligne 849 | 🟡 MOYEN | Forcer vérification `clinic_id` même pour SUPER_ADMIN |
| 8 | Vérification `app_metadata.recovery` dans ResetPassword | Implémentation | 🟢 FAIBLE | Utiliser uniquement `onAuthStateChange` |

---

## 9️⃣ CORRECTIONS PROPOSÉES

### 9.1 Script de Correction des Données

**Fichier** : `supabase_migrations/71_FIX_AUTH_DATA_INCONSISTENCIES.sql`

```sql
-- ============================================
-- CORRECTION DES INCOHÉRENCES AUTH
-- ============================================

BEGIN;

-- 1. Corriger les utilisateurs PENDING mais actifs
UPDATE users
SET actif = false
WHERE status = 'PENDING' AND actif = true;

-- 2. Identifier les utilisateurs sans clinic_id (ne pas corriger automatiquement)
-- Nécessite intervention manuelle pour déterminer leur clinic_id
SELECT 
  id,
  email,
  nom,
  prenom,
  role,
  status,
  actif,
  auth_user_id,
  created_at
FROM users
WHERE clinic_id IS NULL;

-- 3. Vérifier les utilisateurs avec auth_user_id mais sans profil valide
SELECT 
  u.id,
  u.email,
  u.auth_user_id,
  CASE 
    WHEN u.actif = false THEN 'INACTIF'
    WHEN u.status IN ('SUSPENDED', 'REJECTED') THEN 'SUSPENDU/REJETÉ'
    WHEN u.status = 'PENDING' THEN 'EN ATTENTE'
    ELSE 'ACTIF'
  END as etat
FROM users u
WHERE u.auth_user_id IS NOT NULL
  AND (u.actif = false OR u.status IN ('PENDING', 'SUSPENDED', 'REJECTED'))
ORDER BY u.created_at DESC;

COMMIT;
```

### 9.2 Migration pour Corriger `get_my_clinic_id()`

**Fichier** : `supabase_migrations/72_FIX_GET_MY_CLINIC_ID_SECURITY.sql`

```sql
-- ============================================
-- CORRECTION get_my_clinic_id() - Vérification actif/status
-- ============================================

CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  -- SÉCURITÉ: Vérifier que l'utilisateur est actif et approuvé
  SELECT clinic_id INTO v_clinic_id
  FROM users
  WHERE auth_user_id = auth.uid()
    AND actif = true
    AND status IN ('ACTIVE', 'APPROVED') -- Exclure PENDING, SUSPENDED, REJECTED
  LIMIT 1;
  
  RETURN v_clinic_id;
END;
$$;

COMMENT ON FUNCTION get_my_clinic_id() IS 
  'Récupère l''ID de la clinique de l''utilisateur connecté. Retourne NULL si l''utilisateur est inactif ou non approuvé.';
```

### 9.3 Refactorisation de la Policy RLS `users`

**Fichier** : `supabase_migrations/73_REFACTOR_USERS_RLS_POLICIES.sql`

```sql
-- ============================================
-- REFACTORISATION RLS USERS - Isolation stricte
-- ============================================

BEGIN;

-- Supprimer l'ancienne policy complexe
DROP POLICY IF EXISTS "users_admin_or_self_policy" ON users;

-- Policy 1: Lecture de son propre profil
CREATE POLICY "users_read_own_profile" ON users
FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());

-- Policy 2: Lecture pour les admins de clinique (même clinique uniquement)
CREATE POLICY "users_clinic_admin_read" ON users
FOR SELECT TO authenticated
USING (
  clinic_id = get_my_clinic_id()
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid()
      AND u.clinic_id = users.clinic_id
      AND u.role IN ('CLINIC_ADMIN', 'ADMIN')
      AND u.actif = true
      AND u.status = 'ACTIVE'
  )
);

-- Policy 3: Mise à jour de son propre profil
CREATE POLICY "users_update_own_profile" ON users
FOR UPDATE TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Policy 4: Mise à jour pour les admins de clinique (même clinique uniquement)
CREATE POLICY "users_clinic_admin_update" ON users
FOR UPDATE TO authenticated
USING (
  clinic_id = get_my_clinic_id()
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid()
      AND u.clinic_id = users.clinic_id
      AND u.role IN ('CLINIC_ADMIN', 'ADMIN')
      AND u.actif = true
      AND u.status = 'ACTIVE'
  )
)
WITH CHECK (
  clinic_id = get_my_clinic_id()
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.auth_user_id = auth.uid()
      AND u.clinic_id = users.clinic_id
      AND u.role IN ('CLINIC_ADMIN', 'ADMIN')
      AND u.actif = true
      AND u.status = 'ACTIVE'
  )
);

COMMIT;
```

### 9.4 Correction du Middleware Auth

**Fichier** : `server/src/middleware/auth.ts`

**Modifications** :
1. Supprimer le fallback `user_metadata?.clinic_id` (ligne 100)
2. Supprimer le code de développement avec `x-clinic-id` (ligne 44)

```typescript
// AVANT (ligne 100)
const clinicId = userProfile.clinic_id || authUser.user_metadata?.clinic_id;

// APRÈS
const clinicId = userProfile.clinic_id;
if (!clinicId) {
  return res.status(403).json({
    success: false,
    message: 'Votre compte n\'est pas associé à une clinique. Contactez l\'administrateur.',
    code: 'MISSING_CLINIC_ID',
  });
}
```

### 9.5 Correction du Login Frontend

**Fichier** : `src/components/auth/Login.tsx`

**Modifications** :
1. Forcer la vérification `clinic_id` même pour SUPER_ADMIN (ligne 849)

```typescript
// AVANT (ligne 849-853)
if (isSuperAdmin) {
  user = userData; // ⚠️ Pas de vérification
} else if (userData.clinic_id === clinic.id) {
  user = userData;
}

// APRÈS
if (userData.clinic_id === clinic.id) {
  user = userData;
} else if (isSuperAdmin && !userData.clinic_id) {
  // SUPER_ADMIN sans clinic_id : erreur (doit être corrigé en base)
  setError('Votre compte Super Admin n\'est pas associé à une clinique. Contactez l\'administrateur.');
  setIsLoading(false);
  return;
} else {
  user = null; // Même clinique requise pour tous
}
```

### 9.6 Amélioration Reset Password

**Fichier** : `src/pages/ResetPassword.tsx`

**Modifications** :
1. Supprimer la vérification `app_metadata.recovery` (ligne 120)
2. Utiliser uniquement `onAuthStateChange` avec `PASSWORD_RECOVERY`

```typescript
// SUPPRIMER (ligne 118-126)
if (session) {
  const isRecovery = session.user?.app_metadata?.recovery || false;
  if (isRecovery) {
    setReady(true);
  } else {
    setError('Lien de réinitialisation invalide ou expiré.');
  }
}

// CONSERVER UNIQUEMENT
authListener = supabase.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    cleanUrl();
    setReady(true);
    setCheckingSession(false);
  } else if (event === "SIGNED_OUT" && !session && !ready) {
    setError('Lien de réinitialisation invalide ou expiré.');
    setCheckingSession(false);
  }
});
```

---

## 🔟 CHECKLIST FINALE DE VALIDATION AUTH

### ✅ Configuration Supabase
- [ ] Redirect URLs configurées dans le dashboard Supabase
- [ ] Email templates personnalisés (optionnel)
- [ ] Rate limiting activé pour `resetPasswordForEmail`

### ✅ Base de Données
- [ ] Contrainte `NOT NULL` sur `users.clinic_id` (après correction des données)
- [ ] Contrainte `CHECK` sur `users.status` (valeurs autorisées)
- [ ] Index sur `users.auth_user_id` (déjà présent)
- [ ] Index sur `users.clinic_id` (déjà présent)
- [ ] Trigger pour créer automatiquement un profil `users` lors de la création Auth (recommandé)

### ✅ RLS Policies
- [ ] Toutes les tables métier utilisent `clinic_id = get_my_clinic_id()`
- [ ] Aucune policy permissive (`USING true`)
- [ ] Policies `users` refactorisées (3-4 policies séparées)
- [ ] Fonction `get_my_clinic_id()` vérifie `actif=true` et `status`

### ✅ Middleware Backend
- [ ] `authenticateToken` vérifie le profil `users`
- [ ] `requireClinicContext` bloque les utilisateurs sans `clinic_id`
- [ ] Pas de fallback vers `user_metadata` ou headers
- [ ] Blocage des comptes `PENDING`, `SUSPENDED`, `REJECTED`

### ✅ Frontend
- [ ] Login vérifie `clinic_id` même pour SUPER_ADMIN
- [ ] Reset password utilise uniquement `onAuthStateChange`
- [ ] Guards sur les routes sensibles
- [ ] Pas de logique métier critique côté client

### ✅ Workflow Staff
- [ ] Inscription crée `registration_requests` avec `statut='pending'`
- [ ] Approbation crée `users` avec `actif=false`, `status='PENDING'`
- [ ] Activation vérifie `status='PENDING'` ET `actif=false`
- [ ] Activation met à jour `actif=true`, `status='ACTIVE'`

### ✅ Tests
- [ ] Test isolation Clinique A vs Clinique B
- [ ] Test utilisateur PENDING (ne peut pas se connecter)
- [ ] Test utilisateur sans `clinic_id` (bloqué par middleware)
- [ ] Test reset password (session recovery obligatoire)
- [ ] Test multi-session (2 utilisateurs, 2 cliniques différentes)

---

## 📚 BONNES PRATIQUES SAAS SUPABASE

### 1. Isolation Multi-Tenant
- ✅ **Toujours** utiliser `clinic_id` dans les policies RLS
- ✅ **Jamais** d'exception pour SUPER_ADMIN dans les policies RLS (sauf si nécessaire métier)
- ✅ **Toujours** vérifier `actif=true` et `status='ACTIVE'` dans les fonctions helper

### 2. Authentification
- ✅ **Toujours** vérifier l'existence du profil `users` après Supabase Auth
- ✅ **Jamais** faire confiance aux headers HTTP (`x-clinic-id`, etc.)
- ✅ **Toujours** utiliser `auth.uid()` pour récupérer l'utilisateur dans RLS

### 3. Reset Password
- ✅ **Toujours** utiliser `onAuthStateChange` avec `PASSWORD_RECOVERY`
- ✅ **Toujours** déconnecter après réinitialisation réussie
- ✅ **Jamais** dépendre de `app_metadata` qui peut être manipulé

### 4. Workflow Staff
- ✅ **Toujours** créer les utilisateurs avec `actif=false`, `status='PENDING'`
- ✅ **Toujours** activer via un endpoint séparé avec vérifications
- ✅ **Toujours** générer un lien de réinitialisation lors de l'approbation

### 5. Sécurité Générale
- ✅ **Toujours** utiliser `SECURITY DEFINER` avec `SET search_path = public` pour les fonctions RLS
- ✅ **Toujours** utiliser `STABLE` pour les fonctions helper RLS
- ✅ **Jamais** exposer les erreurs détaillées en production

---

## 📝 CONCLUSION

### Résumé des Actions Requises

1. **URGENT** : Corriger les 3 utilisateurs `PENDING` mais `actif=true`
2. **URGENT** : Identifier et corriger l'utilisateur sans `clinic_id`
3. **IMPORTANT** : Migrer `get_my_clinic_id()` pour vérifier `actif` et `status`
4. **IMPORTANT** : Refactoriser la policy RLS `users`
5. **RECOMMANDÉ** : Supprimer les fallbacks dans le middleware auth
6. **RECOMMANDÉ** : Améliorer le reset password (supprimer `app_metadata.recovery`)

### Prochaines Étapes

1. Appliquer les migrations SQL proposées
2. Corriger le code backend et frontend
3. Exécuter les tests d'intégration
4. Vérifier manuellement dans le dashboard Supabase
5. Documenter les changements pour l'équipe

---

**Fin du rapport d'audit**

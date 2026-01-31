# 📋 GUIDE D'APPLICATION DES CORRECTIONS AUTH

**Date** : 2026-01-30  
**Rapport d'audit** : `AUDIT_SECURITE_AUTH_SUPABASE_LOGICLINIC.md`

---

## 🎯 OBJECTIF

Ce guide décrit les étapes pour appliquer les corrections identifiées dans l'audit de sécurité de l'authentification et de l'autorisation.

---

## ⚠️ AVANT DE COMMENCER

### Prérequis
- ✅ Accès au dashboard Supabase (pour vérifier les Redirect URLs)
- ✅ Accès à la base de données (pour exécuter les migrations)
- ✅ Accès au code source (pour modifier le backend/frontend)
- ✅ Environnement de test disponible (recommandé)

### Sauvegarde
- ✅ **OBLIGATOIRE** : Sauvegarder la base de données avant d'appliquer les migrations
- ✅ **OBLIGATOIRE** : Créer une branche Git pour les modifications de code
- ✅ **RECOMMANDÉ** : Tester dans un environnement de staging avant production

---

## 📝 PLAN D'ACTION

### Phase 1 : Correction des Données (URGENT)
**Durée estimée** : 30 minutes

1. **Appliquer la migration 71** : `71_FIX_AUTH_DATA_INCONSISTENCIES.sql`
   - Corrige les utilisateurs `PENDING` mais `actif=true`
   - Identifie les utilisateurs sans `clinic_id`

2. **Intervention manuelle** : Corriger les utilisateurs sans `clinic_id`
   ```sql
   -- Exemple: Assigner un clinic_id à un utilisateur
   UPDATE users
   SET clinic_id = 'UUID_DE_LA_CLINIQUE'
   WHERE id = 'UUID_UTILISATEUR';
   ```

3. **Vérification** :
   ```sql
   -- Vérifier qu'il n'y a plus d'utilisateurs PENDING actifs
   SELECT COUNT(*) FROM users WHERE status = 'PENDING' AND actif = true;
   -- Doit retourner 0
   
   -- Vérifier qu'il n'y a plus d'utilisateurs sans clinic_id
   SELECT COUNT(*) FROM users WHERE clinic_id IS NULL;
   -- Doit retourner 0 (ou le nombre de SUPER_ADMIN si exception métier)
   ```

### Phase 2 : Correction des Fonctions RLS (IMPORTANT)
**Durée estimée** : 15 minutes

1. **Appliquer la migration 72** : `72_FIX_GET_MY_CLINIC_ID_SECURITY.sql`
   - Corrige `get_my_clinic_id()` pour vérifier `actif` et `status`

2. **Vérification** :
   ```sql
   -- Tester la fonction avec un utilisateur inactif
   -- Doit retourner NULL
   SELECT get_my_clinic_id();
   ```

### Phase 3 : Refactorisation des Policies RLS (IMPORTANT)
**Durée estimée** : 20 minutes

1. **Appliquer la migration 73** : `73_REFACTOR_USERS_RLS_POLICIES.sql`
   - Refactorise les policies RLS de la table `users`

2. **Vérification** :
   ```sql
   -- Vérifier que les policies existent
   SELECT policyname FROM pg_policies 
   WHERE schemaname = 'public' AND tablename = 'users';
   -- Doit retourner au moins 4 policies
   ```

### Phase 4 : Correction du Code Backend (RECOMMANDÉ)
**Durée estimée** : 30 minutes

1. **Modifier** `server/src/middleware/auth.ts`
   - Supprimer le fallback `user_metadata?.clinic_id` (ligne 100)
   - Supprimer le code de développement avec `x-clinic-id` (ligne 44)

2. **Tester** :
   - Vérifier que les routes protégées fonctionnent toujours
   - Vérifier que les utilisateurs sans `clinic_id` sont bien bloqués (403)

### Phase 5 : Correction du Code Frontend (RECOMMANDÉ)
**Durée estimée** : 30 minutes

1. **Modifier** `src/components/auth/Login.tsx`
   - Forcer la vérification `clinic_id` même pour SUPER_ADMIN (ligne 849)

2. **Modifier** `src/pages/ResetPassword.tsx`
   - Supprimer la vérification `app_metadata.recovery` (ligne 120)
   - Utiliser uniquement `onAuthStateChange` avec `PASSWORD_RECOVERY`

3. **Tester** :
   - Vérifier que le login fonctionne toujours
   - Vérifier que le reset password fonctionne toujours

---

## 🔧 DÉTAILS DES MODIFICATIONS

### Modification 1 : Middleware Auth (Backend)

**Fichier** : `server/src/middleware/auth.ts`

**AVANT** (ligne 100) :
```typescript
const clinicId = userProfile.clinic_id || authUser.user_metadata?.clinic_id;
```

**APRÈS** :
```typescript
const clinicId = userProfile.clinic_id;
if (!clinicId) {
  return res.status(403).json({
    success: false,
    message: 'Votre compte n\'est pas associé à une clinique. Contactez l\'administrateur.',
    code: 'MISSING_CLINIC_ID',
  });
}
```

**AVANT** (ligne 36-47) :
```typescript
if (!token) {
  if (process.env.NODE_ENV === 'development' && !process.env.ENFORCE_AUTH) {
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@clinic.local',
      role: 'ADMIN',
      clinic_id: req.headers['x-clinic-id'] as string || undefined,
    };
    return next();
  }
  // ...
}
```

**APRÈS** :
```typescript
if (!token) {
  return res.status(401).json({
    success: false,
    message: 'Token d\'authentification manquant',
    code: 'MISSING_TOKEN',
  });
}
// Supprimer complètement le code de développement
```

### Modification 2 : Login Frontend

**Fichier** : `src/components/auth/Login.tsx`

**AVANT** (ligne 849-853) :
```typescript
if (isSuperAdmin) {
  user = userData;
} else if (userData.clinic_id === clinic.id) {
  user = userData;
}
```

**APRÈS** :
```typescript
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

### Modification 3 : Reset Password

**Fichier** : `src/pages/ResetPassword.tsx`

**SUPPRIMER** (ligne 118-126) :
```typescript
if (session) {
  const isRecovery = session.user?.app_metadata?.recovery || false;
  if (isRecovery) {
    setReady(true);
  } else {
    setError('Lien de réinitialisation invalide ou expiré.');
  }
}
```

**CONSERVER UNIQUEMENT** :
```typescript
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

## ✅ CHECKLIST DE VALIDATION

### Après Phase 1 (Correction Données)
- [ ] Migration 71 appliquée sans erreur
- [ ] 0 utilisateur avec `status='PENDING'` et `actif=true`
- [ ] 0 utilisateur sans `clinic_id` (ou exception documentée)

### Après Phase 2 (Correction Fonctions)
- [ ] Migration 72 appliquée sans erreur
- [ ] `get_my_clinic_id()` retourne NULL pour utilisateur inactif
- [ ] `get_my_clinic_id()` retourne NULL pour utilisateur PENDING

### Après Phase 3 (Refactorisation Policies)
- [ ] Migration 73 appliquée sans erreur
- [ ] Au moins 4 policies RLS sur la table `users`
- [ ] Test: Utilisateur A ne peut pas lire utilisateur B (clinique différente)

### Après Phase 4 (Code Backend)
- [ ] Modifications appliquées
- [ ] Tests unitaires passent
- [ ] Test: Utilisateur sans `clinic_id` → 403
- [ ] Test: Routes protégées fonctionnent toujours

### Après Phase 5 (Code Frontend)
- [ ] Modifications appliquées
- [ ] Test: Login fonctionne toujours
- [ ] Test: Reset password fonctionne toujours
- [ ] Test: SUPER_ADMIN avec `clinic_id` peut se connecter
- [ ] Test: SUPER_ADMIN sans `clinic_id` → erreur

---

## 🧪 TESTS RECOMMANDÉS

### Test 1 : Isolation Clinique
```bash
# Créer utilisateur A (Clinique 1)
# Créer utilisateur B (Clinique 2)
# Se connecter avec A
# Tenter de lire les patients de B via API
# Vérifier: Réponse vide ou 403
```

### Test 2 : Utilisateur PENDING
```bash
# Créer utilisateur avec status='PENDING', actif=false
# Tenter de se connecter
# Vérifier: Connexion refusée
```

### Test 3 : Utilisateur sans clinic_id
```bash
# Créer utilisateur sans clinic_id
# Se connecter
# Tenter d'accéder à une route protégée
# Vérifier: 403 avec message "Contexte de clinique manquant"
```

### Test 4 : Reset Password
```bash
# Demander un reset password
# Cliquer sur le lien dans l'email
# Vérifier: Page /reset-password détecte PASSWORD_RECOVERY
# Changer le mot de passe
# Vérifier: Session fermée après succès
```

---

## 📊 ORDRE D'APPLICATION RECOMMANDÉ

1. **URGENT** : Phase 1 (Correction Données)
   - Impact: Bloque les utilisateurs PENDING de se connecter
   - Risque: Faible (correction de données)

2. **IMPORTANT** : Phase 2 (Correction Fonctions)
   - Impact: Améliore la sécurité des policies RLS
   - Risque: Faible (fonction helper uniquement)

3. **IMPORTANT** : Phase 3 (Refactorisation Policies)
   - Impact: Améliore l'isolation multi-tenant
   - Risque: Moyen (peut bloquer certains accès légitimes si mal configuré)

4. **RECOMMANDÉ** : Phase 4 (Code Backend)
   - Impact: Supprime les fallbacks dangereux
   - Risque: Faible (améliore la sécurité)

5. **RECOMMANDÉ** : Phase 5 (Code Frontend)
   - Impact: Améliore la sécurité du reset password
   - Risque: Faible (améliore la sécurité)

---

## 🚨 ROLLBACK

En cas de problème, voici comment annuler les changements :

### Rollback Migration 71
```sql
-- Rétablir les utilisateurs PENDING actifs (si nécessaire)
UPDATE users
SET actif = true
WHERE status = 'PENDING' AND actif = false;
```

### Rollback Migration 72
```sql
-- Restaurer l'ancienne version de get_my_clinic_id()
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

### Rollback Migration 73
```sql
-- Restaurer l'ancienne policy (si sauvegardée)
-- Sinon, recréer une policy simple temporaire
CREATE POLICY "users_temp_policy" ON users
FOR ALL TO authenticated
USING (true);
```

---

## 📞 SUPPORT

En cas de problème lors de l'application des corrections :

1. Vérifier les logs de migration
2. Vérifier les logs de l'application
3. Consulter le rapport d'audit pour plus de détails
4. Tester dans un environnement de staging d'abord

---

**Fin du guide**

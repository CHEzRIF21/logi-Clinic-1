# 🔐 Guide Reset Password - Logiclinic Multi-Tenant

## 🎯 Objectif de cette étape

Quand l'utilisateur clique sur le lien reçu par email :

1. ✅ Supabase crée une session de récupération
2. ✅ Ton app détecte cette session
3. ✅ Tu autorises uniquement le changement de mot de passe
4. ✅ **Spécificité Logiclinic** : Le reset password est **global à l'utilisateur**, pas lié à un `clinic_id` spécifique (bonne pratique SaaS)

---

## 📁 3.1 Ouvre le bon fichier dans Cursor

👉 **Ouvre exactement ce fichier :**

```
src/pages/ResetPassword.tsx
```

⚠️ **Ne modifie encore rien. Lis seulement.**

---

## ✅ 3.2 Ce que CE fichier DOIT obligatoirement faire

Il doit gérer **3 choses, ni plus ni moins** :

1️⃣ **Détecter l'événement `PASSWORD_RECOVERY`**
2️⃣ **Autoriser l'affichage du formulaire UNIQUEMENT dans ce cas**
3️⃣ **Refuser l'accès sinon**

### 🔍 Spécificité Logiclinic

- ✅ **Pas de dépendance à `clinic_id`** : Le reset password est global (bonne pratique SaaS)
- ✅ **Compatible avec les comptes ayant `auth_user_id`** : Utilise Supabase Auth
- ⚠️ **Comptes sans `auth_user_id`** : Ne peuvent pas utiliser cette page (utilisent password_hash)

---

## 📝 3.3 Code MINIMAL attendu (référence saine)

### ✅ Code actuel dans Logiclinic (lignes 94-109)

```typescript
// Écouter les changements d'état d'authentification
authListener = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (mounted) {
      if (event === "PASSWORD_RECOVERY") {
        cleanUrl(); // Nettoyer l'URL quand on détecte l'événement
        setReady(true);
        setCheckingSession(false);
      } else if (event === "SIGNED_OUT" && !session && !ready) {
        // Si on est déconnecté et qu'on n'a pas de session recovery, c'est invalide
        setError('Lien de réinitialisation invalide ou expiré.');
        setCheckingSession(false);
      }
    }
  }
);
```

### 🎯 Code MINIMAL recommandé (simplifié)

Vérifie que tu as une logique équivalente à ceci 👇
(le style peut varier, la logique NON)

```typescript
useEffect(() => {
  let mounted = true;
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (!mounted) return;
    
    if (event === 'PASSWORD_RECOVERY') {
      // Nettoyer l'URL immédiatement (sécurité)
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      
      setReady(true);
      setCheckingSession(false);
    } else if (event === 'SIGNED_OUT' && !session && !ready) {
      // Pas de session recovery détectée
      setError('Lien de réinitialisation invalide ou expiré.');
      setCheckingSession(false);
    }
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);
```

### 🔍 Interprétation

- **`PASSWORD_RECOVERY`** = l'utilisateur vient **OBLIGATOIREMENT** de l'email
- Si ce event n'arrive pas → accès interdit
- **Spécificité Logiclinic** : Pas besoin de vérifier `clinic_id` car le reset est global

---

## 🛡️ 3.4 Protection ABSOLUE (très importante)

### ✅ Vérification actuelle dans Logiclinic (lignes 209-238, 241-283)

Si `ready === false`, tu dois :

- ✅ **Afficher un loader** (lignes 209-238) : `checkingSession === true`
- ✅ **Afficher "Lien invalide ou expiré"** (lignes 241-283) : `!ready && !success`
- ✅ **Rediriger vers /login** : Bouton présent dans le message d'erreur

❌ **Jamais afficher le formulaire directement**

### 📋 Checklist de protection

- [x] Loader affiché pendant `checkingSession === true`
- [x] Message d'erreur si `!ready && !success`
- [x] Formulaire affiché **UNIQUEMENT** si `ready === true`
- [x] Nettoyage de l'URL après détection de `PASSWORD_RECOVERY`

---

## 🔑 3.5 Changement du mot de passe (partie critique)

### ✅ Code actuel dans Logiclinic (lignes 180-200)

```typescript
const { error: updateError } = await supabase.auth.updateUser({
  password,
});

if (updateError) {
  setError(updateError.message || "Erreur lors de la mise à jour du mot de passe.");
  setLoading(false);
  return;
}

// Succès
setSuccess(true);

// Sécurité : on ferme la session recovery après un court délai
setTimeout(async () => {
  await supabase.auth.signOut();
  setTimeout(() => {
    navigate("/login");
  }, 1000);
}, 2000);
```

### 🎯 Code MINIMAL recommandé (immédiat)

Au clic sur "Valider" :

```typescript
// 1. Mettre à jour le mot de passe
const { error: updateError } = await supabase.auth.updateUser({
  password: newPassword,
});

if (updateError) {
  setError(updateError.message);
  setLoading(false);
  return;
}

// 2. Succès
setSuccess(true);

// 3. IMMÉDIATEMENT : Déconnexion et redirection
await supabase.auth.signOut();
navigate('/login');
```

### 📌 Pourquoi ?

1. **La session recovery est one-shot** : Une fois utilisée, elle ne doit plus être valide
2. **On évite toute fuite de session** : Pas de session fantôme
3. **Spécificité Logiclinic** : Compatible avec l'isolation multi-tenant (le reset est global)

### ⚠️ Amélioration suggérée

Le code actuel utilise un `setTimeout` de 2 secondes avant `signOut()`. C'est acceptable mais on peut simplifier :

```typescript
// AVANT (lignes 194-200)
setTimeout(async () => {
  await supabase.auth.signOut();
  setTimeout(() => {
    navigate("/login");
  }, 1000);
}, 2000);

// APRÈS (recommandé)
await supabase.auth.signOut();
navigate('/login');
```

---

## 🧪 3.6 Test IMMÉDIAT (obligatoire)

### 📋 Checklist de test pour Logiclinic

#### Test 1 : Reset Password avec email valide

1. **Demander un reset** :
   ```
   - Aller sur /login
   - Cliquer sur "Mot de passe oublié ?"
   - Entrer un email valide (compte avec auth_user_id)
   - Cliquer sur "Envoyer"
   ```

2. **Vérifier l'email** :
   ```
   - Ouvrir la boîte email
   - Vérifier que l'email arrive (peut prendre 1-2 minutes)
   - Vérifier le sujet : "Réinitialisation de votre mot de passe - Logiclinic"
   ```

3. **Cliquer sur le lien** :
   ```
   - Cliquer sur le lien dans l'email
   - Vérifier la redirection vers /reset-password
   - Vérifier que l'URL contient #access_token=...&type=recovery
   ```

4. **Vérifier la détection** :
   ```
   - Vérifier que le loader s'affiche ("Vérification du lien...")
   - Vérifier que l'événement PASSWORD_RECOVERY est détecté
   - Vérifier que le formulaire s'affiche
   ```

5. **Changer le mot de passe** :
   ```
   - Entrer un nouveau mot de passe valide (min 8 caractères, majuscule, minuscule, chiffre)
   - Confirmer le mot de passe
   - Cliquer sur "Valider"
   ```

6. **Vérifier la déconnexion** :
   ```
   - Vérifier que le message de succès s'affiche
   - Vérifier la redirection vers /login (après 2 secondes)
   ```

7. **Se reconnecter** :
   ```
   - Aller sur /login
   - Se connecter avec le nouveau mot de passe
   - Vérifier que la connexion fonctionne
   ```

#### Test 2 : Accès direct sans lien email

1. **Accéder directement** :
   ```
   - Aller sur /reset-password sans lien email
   - Vérifier que le message "Lien invalide ou expiré" s'affiche
   - Vérifier que le bouton "Retour à la connexion" fonctionne
   ```

#### Test 3 : Lien expiré

1. **Utiliser un ancien lien** :
   ```
   - Utiliser un lien de reset password expiré (> 1 heure)
   - Vérifier que le message d'erreur approprié s'affiche
   ```

#### Test 4 : Compte sans auth_user_id (compte démo)

1. **Tester avec compte démo** :
   ```
   - Essayer de demander un reset pour un compte sans auth_user_id
   - Vérifier que l'email n'est pas envoyé (ou message générique pour sécurité)
   - Note : Les comptes démo utilisent password_hash, pas Supabase Auth
   ```

### ❌ Si le formulaire ne s'affiche PAS

**Causes possibles** :
- ❌ `PASSWORD_RECOVERY` non détecté
- ❌ Problème de route ou de listener
- ❌ URL de redirection mal configurée dans Supabase Dashboard
- ❌ Token expiré ou invalide

**Actions** :
1. Vérifier les logs de la console navigateur
2. Vérifier que `onAuthStateChange` est bien appelé
3. Vérifier la configuration dans Supabase Dashboard → Authentication → URL Configuration

### ❌ Si le formulaire s'affiche sans email

**FAIL sécurité** :
- ❌ Logique à corriger immédiatement
- ❌ Vérifier que `ready === true` uniquement après `PASSWORD_RECOVERY`
- ❌ Vérifier que `checkingSession` bloque l'affichage du formulaire

### ✅ CONFIRMATION À ME DONNER (TRÈS PRÉCISE)

Après avoir testé, confirme-moi :

1. ✅ **Le formulaire s'affiche-t-il UNIQUEMENT après avoir cliqué sur le lien email ?**
   - [ ] Oui
   - [ ] Non (si non, détaille le problème)

2. ✅ **Le message "Lien invalide ou expiré" s'affiche-t-il si tu accèdes directement à /reset-password ?**
   - [ ] Oui
   - [ ] Non (si non, détaille le problème)

3. ✅ **Après avoir changé le mot de passe, es-tu redirigé vers /login ?**
   - [ ] Oui
   - [ ] Non (si non, détaille le problème)

4. ✅ **Peux-tu te reconnecter avec le nouveau mot de passe ?**
   - [ ] Oui
   - [ ] Non (si non, détaille le problème)

5. ✅ **L'URL est-elle nettoyée après la détection de PASSWORD_RECOVERY ?**
   - [ ] Oui (pas de tokens visibles dans l'URL)
   - [ ] Non (si non, détaille le problème)

---

## 🔧 Améliorations suggérées pour Logiclinic

### 1. Simplifier la logique de détection

**Actuel** : Vérifie hash params, query params, timeout, app_metadata  
**Recommandé** : Utiliser uniquement `onAuthStateChange` avec `PASSWORD_RECOVERY`

### 2. Supprimer la vérification `app_metadata.recovery`

**Actuel** (lignes 118-126) : Vérifie `session.user?.app_metadata?.recovery`  
**Recommandé** : Supprimer cette vérification (peut être manipulé)

### 3. Simplifier la déconnexion

**Actuel** : `setTimeout` de 2 secondes avant `signOut()`  
**Recommandé** : `signOut()` immédiatement après `updateUser()`

### 4. Ajouter des logs pour le debugging

```typescript
console.log('🔐 Reset Password - Event détecté:', event);
console.log('🔐 Reset Password - Session recovery:', event === 'PASSWORD_RECOVERY');
```

---

## 📚 Références Logiclinic

- **Fichier principal** : `src/pages/ResetPassword.tsx`
- **Route** : `/reset-password` (définie dans `src/App.tsx` ligne 150)
- **Demande de reset** : `src/components/auth/ForgotPasswordDialog.tsx`
- **Client Supabase** : `src/services/supabase.ts`
- **Configuration Supabase** : Dashboard → Authentication → URL Configuration

---

## ✅ Checklist finale Logiclinic

- [x] Page `/reset-password` existe et est accessible publiquement
- [x] Route configurée dans `App.tsx`
- [x] `PASSWORD_RECOVERY` détecté via `onAuthStateChange`
- [x] Protection avec `ready` et `checkingSession`
- [x] Formulaire affiché uniquement si `ready === true`
- [x] Message d'erreur si accès direct sans lien
- [x] Nettoyage de l'URL après détection
- [x] Validation de complexité du mot de passe (8+ caractères, majuscule, minuscule, chiffre)
- [x] `signOut()` après changement de mot de passe
- [x] Redirection vers `/login` après succès
- [x] Pas de dépendance à `clinic_id` (reset global)
- [ ] Tests manuels effectués et validés
- [ ] Configuration Supabase Dashboard vérifiée

---

**Fin du guide**

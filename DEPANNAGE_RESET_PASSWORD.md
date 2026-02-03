# 🔧 Dépannage Reset Password - Logiclinic

## ❌ Problème : Le lien de réinitialisation renvoie à la page d'accueil (landing) au lieu de la page de reset

**Symptôme :** Vous recevez l'email avec le lien de réinitialisation, mais en cliquant vous arrivez sur la page d'accueil (ou la page de connexion) au lieu de la page « Réinitialiser le mot de passe ».

**Cause :** Supabase redirige vers la **Site URL** (ex. `https://www.logiclinic.org/`) au lieu de `https://www.logiclinic.org/reset-password` lorsque l'URL `/reset-password` n'est pas dans la whitelist des Redirect URLs.

**Corrections :**

1. **Côté application (déjà en place)**  
   L'app détecte les tokens de réinitialisation dans l'URL (hash `#access_token=...&type=recovery`). Si vous arrivez sur `/` ou `/login` avec ce hash, vous êtes **automatiquement redirigé** vers `/reset-password` en conservant les tokens. Rechargez la page si la redirection ne s'est pas faite au premier clic.

2. **Côté Supabase (recommandé)**  
   Ajoutez l'URL exacte de la page de reset dans les Redirect URLs :
   - **Authentication** → **URL Configuration** → **Redirect URLs**
   - Ajoutez : `https://www.logiclinic.org/reset-password` (et en dev : `http://localhost:5173/reset-password`)
   - Pas de slash final, domaine exact (avec ou sans `www` selon votre site).

Après avoir ajouté l'URL, renvoyez un nouveau lien « Mot de passe oublié » : les prochains emails redirigeront directement vers la page de réinitialisation.

---

## ❌ Problème : Le formulaire ne s'affiche pas

Si vous voyez le message "Lien invalide ou expiré" sur `https://www.logiclinic.org/reset-password`, voici les étapes de dépannage :

---

## 🔍 Étape 1 : Vérifier la configuration Supabase Dashboard

### 1.1 Accéder à Supabase Dashboard

1. Aller sur : https://supabase.com/dashboard
2. Sélectionner votre projet Logiclinic
3. Aller dans **Authentication** → **URL Configuration**

### 1.2 Vérifier les Redirect URLs

**IMPORTANT** : L'URL `https://www.logiclinic.org/reset-password` DOIT être dans la liste des Redirect URLs autorisées.

**Configuration requise** :

```
Site URL:
https://www.logiclinic.org

Redirect URLs (Additional Redirect URLs):
https://www.logiclinic.org/reset-password
https://www.logiclinic.org/login
http://localhost:5173/reset-password
http://localhost:5173/login
```

### 1.3 Vérifier que l'URL correspond exactement

⚠️ **Points critiques** :
- ✅ Pas de trailing slash : `https://www.logiclinic.org/reset-password` (pas `/reset-password/`)
- ✅ HTTPS (pas HTTP en production)
- ✅ Domaine exact : `www.logiclinic.org` (pas `logiclinic.org` sans www)
- ✅ Chemin exact : `/reset-password` (pas `/reset_password` ou autre)

---

## 🔍 Étape 2 : Vérifier les logs de la console

Ouvrez la console du navigateur (F12) et vérifiez les messages :

### Messages attendus si tout fonctionne :

```
🔐 Reset Password - Tokens dans URL: { hasAccessToken: true, hasRefreshToken: true, type: 'recovery' }
🔐 Reset Password - Traitement du token recovery
✅ Session créée avec succès - attente de PASSWORD_RECOVERY
🔐 Reset Password - Event détecté: PASSWORD_RECOVERY
✅ PASSWORD_RECOVERY détecté - autorisation du formulaire
```

### Messages d'erreur possibles :

```
❌ Erreur lors de la récupération de session: ...
```
→ Le token est invalide ou expiré

```
⏱️ Timeout - PASSWORD_RECOVERY non détecté après 3 secondes
```
→ L'événement PASSWORD_RECOVERY n'a pas été déclenché

```
❌ Aucune session détectée - accès refusé
```
→ Pas de tokens dans l'URL et pas de session existante

---

## 🔍 Étape 3 : Vérifier l'URL du lien email

Quand vous cliquez sur le lien dans l'email de réinitialisation, l'URL doit ressembler à :

```
https://www.logiclinic.org/reset-password#access_token=eyJ...&refresh_token=...&type=recovery
```

**Vérifications** :
- ✅ L'URL commence par `https://www.logiclinic.org/reset-password`
- ✅ Il y a un `#access_token=...` dans l'URL
- ✅ Il y a `&type=recovery` dans l'URL
- ✅ Le token n'a pas expiré (les liens Supabase expirent après 1 heure)

---

## 🔍 Étape 4 : Vérifier la configuration dans ForgotPasswordDialog

Vérifiez que `ForgotPasswordDialog.tsx` utilise la bonne URL de redirection :

```typescript
// Dans src/components/auth/ForgotPasswordDialog.tsx (ligne ~71)
const redirectTo = `${window.location.origin}/reset-password`;
```

**En production**, `window.location.origin` doit être `https://www.logiclinic.org`

---

## 🔍 Étape 5 : Test de diagnostic

### Test 1 : Vérifier que Supabase est accessible

Ouvrez la console et exécutez :

```javascript
// Vérifier la connexion Supabase
const { data, error } = await supabase.auth.getSession();
console.log('Session actuelle:', data.session);
console.log('Erreur:', error);
```

### Test 2 : Simuler un reset password

Dans la console :

```javascript
// Remplacer par un email valide de votre base
const email = 'votre-email@example.com';
const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://www.logiclinic.org/reset-password'
});
console.log('Résultat:', { data, error });
```

Si `error` est présent, vérifiez le message d'erreur.

---

## ✅ Solutions possibles

### Solution 1 : Ajouter l'URL dans Supabase Dashboard

1. Aller dans Supabase Dashboard → Authentication → URL Configuration
2. Ajouter `https://www.logiclinic.org/reset-password` dans "Additional Redirect URLs"
3. Cliquer sur "Save"
4. Réessayer le lien de réinitialisation

### Solution 2 : Vérifier le domaine exact

Si votre domaine est `logiclinic.org` (sans www), utilisez :
- Site URL : `https://logiclinic.org`
- Redirect URL : `https://logiclinic.org/reset-password`

### Solution 3 : Vérifier que le lien n'a pas expiré

Les liens de réinitialisation Supabase expirent après **1 heure**. Si le lien a expiré :
1. Demander un nouveau lien de réinitialisation
2. Cliquer sur le nouveau lien immédiatement

### Solution 4 : Vérifier la configuration SMTP

Si les emails n'arrivent pas :
1. Aller dans Supabase Dashboard → Authentication → Email Templates
2. Vérifier que les templates sont configurés
3. Vérifier la configuration SMTP (Settings → Auth → SMTP Settings)

---

## 🧪 Test complet du flux

1. **Demander un reset** :
   - Aller sur `/login`
   - Cliquer sur "Mot de passe oublié ?"
   - Entrer un email valide
   - Cliquer sur "Envoyer"

2. **Vérifier l'email** :
   - Ouvrir la boîte email
   - Vérifier que l'email arrive (peut prendre 1-2 minutes)
   - Vérifier que le lien pointe vers `https://www.logiclinic.org/reset-password`

3. **Cliquer sur le lien** :
   - Ouvrir la console du navigateur (F12)
   - Cliquer sur le lien dans l'email
   - Vérifier les logs dans la console
   - Vérifier que le formulaire s'affiche

4. **Si le formulaire ne s'affiche pas** :
   - Vérifier les logs dans la console
   - Vérifier que l'URL contient `#access_token=...&type=recovery`
   - Vérifier la configuration Supabase Dashboard

---

## 📞 Support

Si le problème persiste après avoir vérifié tous les points ci-dessus :

1. **Vérifier les logs Supabase** :
   - Aller dans Supabase Dashboard → Logs → Auth Logs
   - Chercher les erreurs liées au reset password

2. **Vérifier les logs du navigateur** :
   - Ouvrir la console (F12)
   - Copier tous les messages d'erreur
   - Vérifier le Network tab pour les requêtes Supabase

3. **Vérifier la configuration** :
   - Vérifier que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont corrects
   - Vérifier que les variables d'environnement sont bien chargées en production

---

## 🔐 Sécurité

**IMPORTANT** : Ne jamais :
- ❌ Partager les tokens d'accès dans l'URL
- ❌ Utiliser des liens de réinitialisation expirés
- ❌ Accéder directement à `/reset-password` sans lien valide

**Toujours** :
- ✅ Utiliser uniquement les liens reçus par email
- ✅ Vérifier que l'URL contient `type=recovery`
- ✅ Nettoyer l'URL après traitement (fait automatiquement par le code)

---

**Dernière mise à jour** : Après amélioration du code ResetPassword.tsx

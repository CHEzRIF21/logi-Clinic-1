# Configuration Reset Password - Logiclinic

## 📋 Vue d'ensemble

La page `/reset-password` est maintenant complètement implémentée avec toutes les bonnes pratiques de sécurité pour un SaaS multi-tenant.

## ✅ Fonctionnalités implémentées

### 1. Page Reset Password (`src/pages/ResetPassword.tsx`)

- ✅ Gestion correcte de l'état `PASSWORD_RECOVERY` de Supabase
- ✅ Validation du mot de passe (minimum 8 caractères, majuscule, minuscule, chiffre)
- ✅ Vérification que les mots de passe correspondent
- ✅ Gestion des hash parameters (#) et query parameters (?) de Supabase
- ✅ Nettoyage automatique de l'URL après traitement (sécurité)
- ✅ Déconnexion automatique après succès
- ✅ UI moderne avec Material-UI
- ✅ **Aucune dépendance à `clinic_id`** (bonne pratique SaaS)

### 2. Route ajoutée dans `src/App.tsx`

- ✅ Route publique `/reset-password` accessible sans authentification
- ✅ Redirection automatique vers `/login` après succès

## 🔧 Configuration Supabase requise

### 1. Configurer les Redirect URLs

Dans le dashboard Supabase (https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/auth/url-configuration) :

1. **Site URL** : 
   ```
   https://logi-clinic-1-git-lint-fix-chezrifs-projects.vercel.app
   ```
   (ou votre domaine de production)

2. **Redirect URLs** (Additional Redirect URLs) :
   ```
   https://logi-clinic-1-git-lint-fix-chezrifs-projects.vercel.app/reset-password
   https://logi-clinic-1-git-lint-fix-chezrifs-projects.vercel.app/login
   http://localhost:5173/reset-password
   http://localhost:5173/login
   ```

### 2. Configuration locale (`supabase/config.toml`)

Assurez-vous que votre fichier `supabase/config.toml` contient :

```toml
[auth]
enabled = true
site_url = "https://logi-clinic-1-git-lint-fix-chezrifs-projects.vercel.app"
additional_redirect_urls = [
  "https://logi-clinic-1-git-lint-fix-chezrifs-projects.vercel.app/reset-password",
  "https://logi-clinic-1-git-lint-fix-chezrifs-projects.vercel.app/login",
  "http://localhost:5173/reset-password",
  "http://localhost:5173/login"
]
```

## 🔐 Points de sécurité implémentés

### ✅ Aucun `clinic_id` dans le reset
Le reset de mot de passe est **global à l'utilisateur**, pas à la clinique. C'est une bonne pratique SaaS car :
- L'utilisateur peut avoir accès à plusieurs cliniques
- Le reset ne doit pas être lié à un contexte clinique spécifique
- Supabase Auth gère déjà l'isolation au niveau utilisateur

### ✅ Session recovery obligatoire
La page vérifie que la session est bien en mode `PASSWORD_RECOVERY` avant d'autoriser le reset. Cela empêche :
- L'accès direct à la page sans lien email valide
- L'utilisation de liens expirés ou invalides
- Les tentatives de reset non autorisées

### ✅ Déconnexion après succès
Après un reset réussi, la session recovery est automatiquement fermée pour éviter :
- Les sessions fantômes
- Les réutilisations de tokens
- Les problèmes de sécurité

### ✅ Nettoyage de l'URL
Les tokens sont automatiquement retirés de l'URL après traitement pour éviter :
- L'exposition des tokens dans l'historique du navigateur
- Le partage accidentel de liens avec tokens
- Les problèmes de sécurité

## 📧 Comment utiliser

### Pour l'utilisateur final

1. L'utilisateur clique sur "Mot de passe oublié ?" sur la page de connexion
2. Il peut utiliser le formulaire de récupération de compte (AccountRecoveryForm)
3. OU utiliser directement Supabase Auth pour recevoir un email de réinitialisation

### Pour envoyer un email de réinitialisation (via Supabase)

```typescript
import { supabase } from '@/services/supabase';

// Envoyer un email de réinitialisation
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
});

if (error) {
  console.error('Erreur:', error);
} else {
  console.log('Email de réinitialisation envoyé !');
}
```

## 🧪 Tests

### Test manuel

1. **Test avec lien valide** :
   - Utilisez Supabase Dashboard pour envoyer un email de réinitialisation
   - Cliquez sur le lien dans l'email
   - Vérifiez que vous arrivez sur `/reset-password`
   - Vérifiez que le formulaire s'affiche correctement
   - Entrez un nouveau mot de passe valide
   - Vérifiez que vous êtes redirigé vers `/login` après succès

2. **Test avec lien invalide** :
   - Accédez directement à `/reset-password` sans lien valide
   - Vérifiez que vous voyez le message "Lien invalide ou expiré"
   - Vérifiez que le bouton "Retour à la connexion" fonctionne

3. **Test de validation** :
   - Essayez un mot de passe trop court (< 8 caractères)
   - Essayez un mot de passe sans majuscule
   - Essayez un mot de passe sans chiffre
   - Vérifiez que les messages d'erreur appropriés s'affichent

## 📝 Checklist de déploiement

- [ ] Redirect URLs configurées dans Supabase Dashboard
- [ ] `site_url` correctement configurée dans `supabase/config.toml`
- [ ] Route `/reset-password` accessible publiquement (pas de protection)
- [ ] Tester le flux complet en production
- [ ] Vérifier que les emails de réinitialisation arrivent correctement
- [ ] Vérifier que les liens dans les emails pointent vers `/reset-password`

## 🔍 Dépannage

### Le lien de réinitialisation ne fonctionne pas

1. Vérifiez que l'URL de redirection est bien configurée dans Supabase
2. Vérifiez que le domaine correspond exactement (pas de trailing slash, HTTPS vs HTTP)
3. Vérifiez les logs du navigateur pour les erreurs
4. Vérifiez que le token n'a pas expiré (les liens Supabase expirent après 1 heure par défaut)

### La page affiche "Lien invalide ou expiré"

- Le lien a peut-être expiré (relancez une demande de réinitialisation)
- Le lien n'est peut-être pas valide (vérifiez qu'il vient bien de Supabase)
- La configuration des redirect URLs n'est peut-être pas correcte

### L'email de réinitialisation n'arrive pas

- Vérifiez la configuration SMTP dans Supabase
- Vérifiez les spams/courriers indésirables
- Vérifiez que l'email existe bien dans Supabase Auth

## 📚 Références

- [Documentation Supabase Auth - Password Recovery](https://supabase.com/docs/guides/auth/auth-password-reset)
- [Documentation Supabase Auth - Redirect URLs](https://supabase.com/docs/guides/auth/auth-redirect-urls)

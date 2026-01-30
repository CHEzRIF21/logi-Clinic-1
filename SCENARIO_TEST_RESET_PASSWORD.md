# Scénario de Test - Reset Password & Mot de Passe Oublié

## 📋 Vue d'ensemble

Ce document décrit les scénarios de test complets pour la fonctionnalité de réinitialisation de mot de passe, incluant la gestion des erreurs, des timeouts et des cas limites.

## 🎯 Objectifs de test

1. Vérifier que l'envoi d'email de réinitialisation fonctionne correctement
2. Vérifier la gestion des timeouts et des erreurs réseau
3. Vérifier que la page de reset password fonctionne avec les liens Supabase
4. Vérifier la sécurité (pas de révélation d'informations sensibles)
5. Vérifier la validation des mots de passe

---

## 📧 Scénario 1 : Envoi d'email de réinitialisation (Succès)

### Prérequis
- Utilisateur avec un compte valide dans Supabase Auth
- Email valide et accessible
- Connexion internet stable

### Étapes

1. **Accéder à la page de connexion**
   - URL : `http://localhost:5173/login` ou URL de production
   - Vérifier que la page se charge correctement

2. **Cliquer sur "Mot de passe oublié ?"**
   - Localisation : Sous le formulaire de connexion
   - Action : Cliquer sur le bouton "Mot de passe oublié ?"
   - Résultat attendu : Un dialog s'ouvre avec un champ email

3. **Remplir le formulaire**
   - Entrer un email valide : `test@example.com`
   - Vérifier que le champ email accepte l'input
   - Vérifier que le bouton "Envoyer" est activé

4. **Envoyer la demande**
   - Cliquer sur "Envoyer"
   - Résultat attendu :
     - Un indicateur de chargement s'affiche
     - Le bouton affiche "Envoi..."
     - Après 2-5 secondes, un message de succès s'affiche

5. **Vérifier le message de succès**
   - Résultat attendu :
     - Icône de succès (CheckCircle)
     - Message : "Email envoyé avec succès"
     - Texte informatif sur la vérification de la boîte de réception
     - Note sur l'expiration du lien (1 heure)

6. **Vérifier l'email reçu**
   - Ouvrir la boîte de réception de l'email utilisé
   - Vérifier qu'un email de Supabase est reçu
   - Vérifier que le lien dans l'email pointe vers `/reset-password`

### Critères de succès
- ✅ Dialog s'ouvre correctement
- ✅ Email est envoyé sans erreur
- ✅ Message de succès s'affiche
- ✅ Email reçu dans la boîte de réception
- ✅ Lien dans l'email est valide

---

## ⏱️ Scénario 2 : Gestion du timeout

### Prérequis
- Connexion internet lente ou instable
- OU simulation d'un timeout (via DevTools)

### Étapes

1. **Ouvrir le dialog "Mot de passe oublié"**
   - Cliquer sur "Mot de passe oublié ?"

2. **Remplir le formulaire**
   - Entrer un email valide : `test@example.com`

3. **Simuler un timeout**
   - Option A : Utiliser DevTools Network → Throttling → Slow 3G
   - Option B : Utiliser DevTools Network → Offline après le clic
   - Option C : Attendre 30 secondes (timeout configuré)

4. **Vérifier la gestion du timeout**
   - Résultat attendu :
     - Après 30 secondes, une erreur s'affiche
     - Message : "La requête a pris trop de temps. Vérifiez votre connexion internet et réessayez."
     - Le bouton redevient cliquable
     - L'utilisateur peut réessayer

### Critères de succès
- ✅ Timeout détecté après 30 secondes
- ✅ Message d'erreur approprié affiché
- ✅ L'utilisateur peut réessayer
- ✅ Pas de crash de l'application

---

## 🌐 Scénario 3 : Erreur réseau (Connexion perdue)

### Prérequis
- Connexion internet instable

### Étapes

1. **Ouvrir le dialog "Mot de passe oublié"**
   - Cliquer sur "Mot de passe oublié ?"

2. **Remplir le formulaire**
   - Entrer un email valide : `test@example.com`

3. **Simuler une perte de connexion**
   - Utiliser DevTools Network → Offline
   - OU débrancher le réseau
   - Cliquer sur "Envoyer"

4. **Vérifier la gestion de l'erreur**
   - Résultat attendu :
     - Message d'erreur : "Erreur de connexion. Vérifiez votre connexion internet et réessayez."
     - Le bouton redevient cliquable
     - L'utilisateur peut réessayer après rétablissement de la connexion

### Critères de succès
- ✅ Erreur réseau détectée
- ✅ Message d'erreur approprié affiché
- ✅ L'utilisateur peut réessayer
- ✅ Pas de crash de l'application

---

## 🔒 Scénario 4 : Sécurité - Email inexistant

### Prérequis
- Email qui n'existe pas dans Supabase Auth

### Étapes

1. **Ouvrir le dialog "Mot de passe oublié"**
   - Cliquer sur "Mot de passe oublié ?"

2. **Remplir avec un email inexistant**
   - Entrer un email qui n'existe pas : `nonexistent@example.com`
   - Cliquer sur "Envoyer"

3. **Vérifier le comportement de sécurité**
   - Résultat attendu :
     - Message de succès s'affiche (même si l'email n'existe pas)
     - Message : "Si un compte existe avec l'adresse [email], vous recevrez un email..."
     - **IMPORTANT** : Pas de révélation que l'email n'existe pas

### Critères de succès
- ✅ Message de succès affiché (même pour email inexistant)
- ✅ Pas de révélation d'informations sensibles
- ✅ Comportement cohérent pour éviter l'énumération d'emails

---

## 🚫 Scénario 5 : Rate Limiting (Trop de tentatives)

### Prérequis
- Avoir envoyé plusieurs demandes rapidement

### Étapes

1. **Envoyer plusieurs demandes rapidement**
   - Ouvrir le dialog
   - Envoyer une demande avec un email valide
   - Fermer le dialog
   - Réouvrir et renvoyer immédiatement (répéter 5-10 fois)

2. **Vérifier la gestion du rate limiting**
   - Résultat attendu :
     - Après plusieurs tentatives, message d'erreur :
       "Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer."
     - Le bouton reste désactivé temporairement

### Critères de succès
- ✅ Rate limiting détecté
- ✅ Message d'erreur approprié affiché
- ✅ L'utilisateur est informé d'attendre

---

## ✅ Scénario 6 : Reset Password - Lien valide

### Prérequis
- Avoir reçu un email de réinitialisation avec un lien valide

### Étapes

1. **Cliquer sur le lien dans l'email**
   - Ouvrir l'email de réinitialisation
   - Cliquer sur le lien de réinitialisation
   - Résultat attendu : Redirection vers `/reset-password`

2. **Vérifier le chargement de la page**
   - Résultat attendu :
     - Page de reset password s'affiche
     - Message : "Vérification du lien de réinitialisation..."
     - Après 1-2 secondes, le formulaire s'affiche

3. **Remplir le formulaire**
   - Nouveau mot de passe : `NewPassword123`
   - Confirmer le mot de passe : `NewPassword123`
   - Vérifier que les champs acceptent l'input

4. **Valider le mot de passe**
   - Cliquer sur "Valider"
   - Résultat attendu :
     - Indicateur de chargement
     - Message de succès : "Mot de passe mis à jour avec succès"
     - Redirection automatique vers `/login` après 2 secondes

5. **Vérifier la connexion avec le nouveau mot de passe**
   - Se connecter avec le nouveau mot de passe
   - Résultat attendu : Connexion réussie

### Critères de succès
- ✅ Page de reset s'affiche correctement
- ✅ Formulaire fonctionne
- ✅ Mot de passe mis à jour avec succès
- ✅ Redirection vers login
- ✅ Connexion avec nouveau mot de passe fonctionne

---

## ❌ Scénario 7 : Reset Password - Lien invalide/expiré

### Prérequis
- Lien de réinitialisation expiré ou invalide

### Étapes

1. **Accéder directement à `/reset-password` sans lien valide**
   - URL : `http://localhost:5173/reset-password`
   - OU utiliser un lien expiré

2. **Vérifier le comportement**
   - Résultat attendu :
     - Message : "Vérification du lien de réinitialisation..."
     - Après vérification, message d'erreur :
       "Lien invalide ou expiré"
     - Texte explicatif
     - Bouton "Retour à la connexion"

3. **Vérifier la redirection**
   - Cliquer sur "Retour à la connexion"
   - Résultat attendu : Redirection vers `/login`

### Critères de succès
- ✅ Accès direct bloqué
- ✅ Message d'erreur approprié
- ✅ Redirection fonctionne

---

## 🔐 Scénario 8 : Validation du mot de passe

### Prérequis
- Avoir un lien de réinitialisation valide

### Étapes

1. **Accéder à la page de reset avec un lien valide**
   - Cliquer sur le lien dans l'email

2. **Tester un mot de passe trop court**
   - Nouveau mot de passe : `Short1`
   - Confirmer : `Short1`
   - Cliquer sur "Valider"
   - Résultat attendu :
     - Erreur : "Le mot de passe doit contenir au moins 8 caractères."

3. **Tester un mot de passe sans majuscule**
   - Nouveau mot de passe : `password123`
   - Confirmer : `password123`
   - Cliquer sur "Valider"
   - Résultat attendu :
     - Erreur : "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre."

4. **Tester un mot de passe sans chiffre**
   - Nouveau mot de passe : `Password`
   - Confirmer : `Password`
   - Cliquer sur "Valider"
   - Résultat attendu :
     - Erreur : "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre."

5. **Tester des mots de passe qui ne correspondent pas**
   - Nouveau mot de passe : `Password123`
   - Confirmer : `Password456`
   - Cliquer sur "Valider"
   - Résultat attendu :
     - Erreur : "Les mots de passe ne correspondent pas."

6. **Tester un mot de passe valide**
   - Nouveau mot de passe : `ValidPassword123`
   - Confirmer : `ValidPassword123`
   - Cliquer sur "Valider"
   - Résultat attendu : Succès et redirection

### Critères de succès
- ✅ Toutes les validations fonctionnent
- ✅ Messages d'erreur appropriés
- ✅ Mot de passe valide accepté

---

## 🔄 Scénario 9 : Réessayer après erreur

### Prérequis
- Avoir rencontré une erreur (timeout, réseau, etc.)

### Étapes

1. **Rencontrer une erreur**
   - Ouvrir le dialog
   - Simuler une erreur (timeout ou réseau)

2. **Fermer le dialog**
   - Cliquer sur "Annuler" ou la croix

3. **Rouvrir le dialog**
   - Cliquer à nouveau sur "Mot de passe oublié ?"

4. **Vérifier la réinitialisation**
   - Résultat attendu :
     - Dialog s'ouvre avec un formulaire vide
     - Pas d'erreur précédente affichée
     - Formulaire prêt pour une nouvelle tentative

### Critères de succès
- ✅ Dialog se réinitialise correctement
- ✅ Pas d'erreur persistante
- ✅ Nouvelle tentative possible

---

## 📱 Scénario 10 : Test sur différents navigateurs

### Prérequis
- Accès à plusieurs navigateurs

### Étapes

1. **Tester sur Chrome**
   - Répéter le Scénario 1 (Envoi d'email)
   - Vérifier que tout fonctionne

2. **Tester sur Firefox**
   - Répéter le Scénario 1
   - Vérifier que tout fonctionne

3. **Tester sur Safari**
   - Répéter le Scénario 1
   - Vérifier que tout fonctionne

4. **Tester sur Edge**
   - Répéter le Scénario 1
   - Vérifier que tout fonctionne

### Critères de succès
- ✅ Fonctionne sur tous les navigateurs
- ✅ Pas d'erreurs spécifiques au navigateur

---

## 🧪 Tests automatisés recommandés

### Tests unitaires

```typescript
// Exemple de test unitaire pour ForgotPasswordDialog
describe('ForgotPasswordDialog', () => {
  it('should validate email format', () => {
    // Test validation email
  });

  it('should handle timeout errors', () => {
    // Test gestion timeout
  });

  it('should handle network errors', () => {
    // Test gestion erreurs réseau
  });

  it('should not reveal if email exists', () => {
    // Test sécurité
  });
});
```

### Tests d'intégration

```typescript
// Exemple de test d'intégration
describe('Reset Password Flow', () => {
  it('should complete full reset flow', async () => {
    // 1. Ouvrir dialog
    // 2. Envoyer email
    // 3. Cliquer sur lien
    // 4. Reset password
    // 5. Vérifier connexion
  });
});
```

---

## 📊 Checklist de test complète

### Fonctionnalités de base
- [ ] Dialog s'ouvre correctement
- [ ] Validation de l'email fonctionne
- [ ] Envoi d'email fonctionne
- [ ] Message de succès s'affiche
- [ ] Email reçu dans la boîte de réception
- [ ] Lien dans l'email fonctionne

### Gestion des erreurs
- [ ] Timeout géré correctement
- [ ] Erreur réseau gérée correctement
- [ ] Rate limiting géré correctement
- [ ] Messages d'erreur appropriés
- [ ] Possibilité de réessayer

### Sécurité
- [ ] Pas de révélation d'emails inexistants
- [ ] Lien invalide bloqué
- [ ] Lien expiré bloqué
- [ ] Session recovery vérifiée
- [ ] Déconnexion après succès

### Validation
- [ ] Mot de passe trop court rejeté
- [ ] Mot de passe sans majuscule rejeté
- [ ] Mot de passe sans chiffre rejeté
- [ ] Mots de passe non correspondants rejetés
- [ ] Mot de passe valide accepté

### UX
- [ ] Indicateurs de chargement visibles
- [ ] Messages clairs et informatifs
- [ ] Navigation fluide
- [ ] Responsive design
- [ ] Accessibilité (clavier, screen readers)

---

## 🐛 Bugs connus et solutions

### Bug : "upstream request timeout"
**Symptôme** : Erreur "Failed to send password recovery: upstream request timeout"

**Solutions** :
1. Vérifier la configuration Supabase (SMTP, rate limits)
2. Vérifier la connexion internet
3. Réessayer après quelques minutes
4. Vérifier les logs Supabase pour plus de détails

### Bug : Email non reçu
**Symptôme** : Message de succès affiché mais email non reçu

**Solutions** :
1. Vérifier les spams/courriers indésirables
2. Vérifier que l'email est correct
3. Vérifier la configuration SMTP dans Supabase
4. Attendre quelques minutes (délai d'envoi)

---

## 📝 Notes importantes

1. **Sécurité** : Le système ne révèle jamais si un email existe ou non dans la base de données
2. **Timeouts** : Le timeout est configuré à 30 secondes par défaut
3. **Expiration** : Les liens de réinitialisation expirent après 1 heure
4. **Rate Limiting** : Supabase limite le nombre de demandes par email/IP
5. **Validation** : Les mots de passe doivent respecter les règles de complexité

---

## 🔗 Ressources

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth/auth-password-reset)
- [Configuration SMTP Supabase](https://supabase.com/docs/guides/auth/auth-smtp)
- [Rate Limiting Supabase](https://supabase.com/docs/guides/auth/rate-limits)

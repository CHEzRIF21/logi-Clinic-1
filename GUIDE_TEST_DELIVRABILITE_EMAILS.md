# 📧 GUIDE DE TEST DE DÉLIVRABILITÉ EMAILS

**Date** : 2026-01-30  
**Objectif** : Tester, tracer et valider l'envoi réel des emails

---

## 🎯 Vue d'Ensemble

Ce guide décrit comment utiliser les scripts de test pour valider la délivrabilité des emails dans Logiclinic.

---

## 📋 Prérequis

1. **Variables d'environnement configurées** :
   - `VITE_SUPABASE_URL` ou `SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` ou `SUPABASE_ANON_KEY`
   - Variables SMTP (pour tests backend) : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`

2. **Dépendances installées** :
   ```bash
   cd server
   npm install
   ```

---

## 🧪 Scripts de Test Disponibles

### 1. Test d'Envoi Réel (`test-email-delivery.ts`)

**Objectif** : Tester l'envoi réel d'emails avec logging détaillé

**Usage** :
```bash
cd server

# Test reset password
npx ts-node test-email-delivery.ts --type=reset-password --email=test@example.com

# Test account validation
npx ts-node test-email-delivery.ts --type=account-validation --email=test@example.com

# Test avec timeout personnalisé
npx ts-node test-email-delivery.ts --type=reset-password --email=test@example.com --timeout=10000

# Test sans SMTP (pour vérifier le fallback)
npx ts-node test-email-delivery.ts --type=account-validation --email=test@example.com --no-smtp
```

**Résultats** :
- Logs détaillés dans la console
- Fichier `email-delivery-tests.log` créé avec tous les résultats
- Résumé avec statut (succès/échec) et temps de réponse

**Exemple de sortie** :
```
📧 TEST DE DÉLIVRABILITÉ EMAIL - Logiclinic
================================================================================
Type: reset-password
Email: test@example.com
Timeout: 30000ms
SMTP Backend: Activé
================================================================================

🔄 Test: Reset Password pour test@example.com
   Type: reset-password
   Timeout: 30000ms
   Redirect URL: https://app.example.com/reset-password
✅ Email envoyé avec succès
   Temps de réponse: 1234ms
   Réponse Supabase: { "error": null }

================================================================================
📧 RÉSULTAT DU TEST D'ENVOI EMAIL
================================================================================
{
  "timestamp": "2026-01-30T10:00:00.000Z",
  "type": "reset-password",
  "email": "test@example.com",
  "source": "supabase-auth",
  "status": "success",
  "delivery_time_ms": 1234,
  "supabase_response": { "error": null }
}
================================================================================

📊 RÉSUMÉ:
   Statut: ✅ SUCCÈS
   Temps: 1234ms
```

---

### 2. Test Multi-Fournisseurs (`test-email-providers.ts`)

**Objectif** : Tester l'envoi vers différents fournisseurs d'email (Gmail, Outlook, Yahoo)

**Usage** :
```bash
cd server

# Test avec emails par défaut (Gmail, Outlook, Yahoo)
npx ts-node test-email-providers.ts

# Test avec emails personnalisés
npx ts-node test-email-providers.ts --emails=test@gmail.com,test@outlook.com,test@yahoo.com
```

**Résultats** :
- Tableau comparatif des résultats
- Délai de réponse pour chaque fournisseur
- Instructions pour vérification manuelle

**Exemple de sortie** :
```
📧 TEST MULTI-FOURNISSEURS EMAIL
================================================================================
Emails à tester: 3
   - test@gmail.com
   - test@outlook.com
   - test@yahoo.com
================================================================================

🔄 Test: Gmail (test@gmail.com)
   ✅ Email envoyé (1234ms)
   ⚠️  Vérifiez manuellement la réception dans Gmail

🔄 Test: Outlook (test@outlook.com)
   ✅ Email envoyé (2345ms)
   ⚠️  Vérifiez manuellement la réception dans Outlook

🔄 Test: Yahoo (test@yahoo.com)
   ✅ Email envoyé (3456ms)
   ⚠️  Vérifiez manuellement la réception dans Yahoo

================================================================================
📊 RÉSULTATS
================================================================================
| Fournisseur | Email                | Envoyé | Temps (ms) | Statut |
|-------------|----------------------|--------|------------|--------|
| Gmail       | test@gmail.com       | Oui    | 1234       | ✅     |
| Outlook     | test@outlook.com     | Oui    | 2345       | ✅     |
| Yahoo       | test@yahoo.com       | Oui    | 3456       | ✅     |
================================================================================

⚠️  IMPORTANT: Vérifiez manuellement la réception dans chaque boîte email
   - Vérifiez la boîte de réception
   - Vérifiez les spams/courriers indésirables
   - Notez le délai de réception
   - Notez si l'email est en inbox ou spam
```

---

### 3. Test Scénarios d'Échec (`test-email-failures.ts`)

**Objectif** : Tester les scénarios d'échec et vérifier que les erreurs sont bien gérées

**Usage** :
```bash
cd server

# Tous les scénarios
npx ts-node test-email-failures.ts --scenario=all

# Scénario spécifique
npx ts-node test-email-failures.ts --scenario=wrong-from-email
npx ts-node test-email-failures.ts --scenario=rate-limiting
```

**Scénarios disponibles** :
- `unverified-domain` : Domaine non vérifié dans Supabase
- `missing-spf-dkim` : Configuration SPF/DKIM manquante
- `wrong-from-email` : From Email non autorisé
- `rate-limiting` : Dépassement du rate limit

**Résultats** :
- Tableau des résultats avec vérification des messages d'erreur
- Indication si l'erreur est visible pour l'utilisateur
- Indication si les logs contiennent les détails techniques

---

## 📊 Interprétation des Résultats

### Statut "success"
- ✅ Email envoyé avec succès par Supabase/SMTP
- ⚠️ **Important** : Cela ne garantit pas la réception
- 🔍 **Action requise** : Vérifier manuellement la boîte email

### Statut "error"
- ❌ Erreur lors de l'envoi
- 📝 Vérifier les détails dans les logs
- 🔧 Corriger la configuration si nécessaire

### Statut "timeout"
- ⏱️ La requête a pris trop de temps
- 🔍 Vérifier la connexion réseau
- 🔧 Augmenter le timeout si nécessaire

---

## 🔍 Vérification Manuelle

### Pour Reset Password

1. **Exécuter le test** :
   ```bash
   npx ts-node test-email-delivery.ts --type=reset-password --email=votre-email@example.com
   ```

2. **Vérifier la boîte email** :
   - Ouvrir la boîte de réception
   - Vérifier les spams/courriers indésirables
   - Noter le délai de réception
   - Noter si l'email est en inbox ou spam

3. **Vérifier le lien** :
   - Cliquer sur le lien dans l'email
   - Vérifier que la page `/reset-password` s'ouvre
   - Vérifier que le formulaire de reset s'affiche

### Pour Account Validation

1. **Exécuter le test** :
   ```bash
   npx ts-node test-email-delivery.ts --type=account-validation --email=votre-email@example.com
   ```

2. **Vérifier la boîte email** :
   - Ouvrir la boîte de réception
   - Vérifier les spams/courriers indésirables
   - Vérifier le contenu de l'email (identifiants, format HTML)

---

## 📝 Logs et Traçabilité

### Fichiers de Log

1. **`email-delivery-tests.log`** :
   - Créé automatiquement par `test-email-delivery.ts`
   - Contient tous les résultats au format JSON
   - Utile pour l'analyse post-mortem

2. **Logs console** :
   - Format structuré avec emojis
   - Facile à lire pour le debugging
   - Contient les détails techniques

### Format des Logs

```json
{
  "timestamp": "2026-01-30T10:00:00.000Z",
  "type": "reset-password",
  "email": "test@example.com",
  "source": "supabase-auth",
  "status": "success",
  "delivery_time_ms": 1234,
  "supabase_response": { "error": null },
  "metadata": {
    "redirect_to": "https://app.example.com/reset-password"
  }
}
```

---

## 🚨 Dépannage

### Problème : "Variables Supabase manquantes"

**Solution** :
1. Vérifier que les variables sont définies dans `server/config.env`
2. Ou définir les variables d'environnement avant d'exécuter :
   ```bash
   export VITE_SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
   export VITE_SUPABASE_ANON_KEY=votre-cle
   npx ts-node test-email-delivery.ts --type=reset-password --email=test@example.com
   ```

### Problème : "SMTP non configuré"

**Solution** :
1. Vérifier que les variables SMTP sont définies dans `server/config.env`
2. Ou utiliser `--no-smtp` pour tester uniquement Supabase Auth :
   ```bash
   npx ts-node test-email-delivery.ts --type=account-validation --email=test@example.com --no-smtp
   ```

### Problème : "Timeout"

**Solution** :
1. Augmenter le timeout :
   ```bash
   npx ts-node test-email-delivery.ts --type=reset-password --email=test@example.com --timeout=60000
   ```
2. Vérifier la connexion réseau
3. Vérifier que Supabase est accessible

---

## ✅ Checklist de Validation

### Tests à Exécuter

- [ ] Test reset password avec email valide
- [ ] Test reset password avec email invalide
- [ ] Test account validation avec SMTP configuré
- [ ] Test account validation sans SMTP (fallback)
- [ ] Test multi-fournisseurs (Gmail, Outlook, Yahoo)
- [ ] Test scénarios d'échec (wrong-from-email, rate-limiting)

### Vérifications Manuelles

- [ ] Emails reçus dans la boîte de réception (pas en spam)
- [ ] Liens dans les emails fonctionnent correctement
- [ ] Format HTML des emails correct
- [ ] Messages d'erreur clairs pour l'utilisateur
- [ ] Logs contiennent les détails techniques

---

## 📚 Ressources

- [Rapport d'audit complet](./AUDIT_DELIVRABILITE_EMAILS_LOGICLINIC.md)
- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth/auth-password-reset)
- [Documentation Nodemailer](https://nodemailer.com/about/)

---

**Fin du guide**

# Guide de Configuration des Emails - Logi Clinic

Ce guide vous explique comment configurer l'envoi d'emails dans Logi Clinic pour activer les notifications automatiques.

## 📋 Prérequis

1. Un compte email avec accès SMTP (Gmail, Outlook, serveur SMTP personnalisé, etc.)
2. Les identifiants SMTP configurés
3. Node.js et npm installés

## 🚀 Installation

### 1. Installer les dépendances

Les dépendances nécessaires ont déjà été ajoutées au `package.json`. Installez-les avec :

```bash
cd server
npm install
```

Cela installera :
- `nodemailer` : Bibliothèque pour l'envoi d'emails
- `@types/nodemailer` : Types TypeScript pour nodemailer

### 2. Configuration avec Gmail

#### Étape 1 : Créer un mot de passe d'application Gmail

1. Connectez-vous à votre compte Gmail
2. Allez dans **Paramètres du compte Google**
3. Sélectionnez **Sécurité**
4. Activez la **Validation en deux étapes** (si ce n'est pas déjà fait)
5. Allez dans **Mots de passe des applications**
6. Sélectionnez "Autre (nom personnalisé)" et entrez "Logi Clinic"
7. Cliquez sur **Générer**
8. **Copiez le mot de passe généré** (16 caractères)

#### Étape 2 : Configurer les variables d'environnement

Ouvrez le fichier `server/config.env` et décommentez/modifiez les lignes suivantes :

```env
# Configuration SMTP pour l'envoi d'emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # Le mot de passe d'application généré
SMTP_FROM=noreply@logiclinic.org

# Emails de destination
TECH_EMAIL=tech@logiclinic.org
CONTACT_EMAIL=contact@logiclinic.org
ALERT_EMAIL=tech@logiclinic.org
```

**Important** : Remplacez `votre-email@gmail.com` par votre adresse Gmail et `xxxx xxxx xxxx xxxx` par le mot de passe d'application généré.

### 3. Configuration avec d'autres services

#### Microsoft Outlook / Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@outlook.com
SMTP_PASSWORD=votre-mot-de-passe
```

#### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=votre-api-key-sendgrid
```

#### Serveur SMTP personnalisé

```env
SMTP_HOST=smtp.votre-domaine.com
SMTP_PORT=587
SMTP_SECURE=false  # true pour port 465
SMTP_USER=votre-utilisateur
SMTP_PASSWORD=votre-mot-de-passe
```

## 📧 Types d'Emails Envoyés

Une fois configuré, le système enverra automatiquement les emails suivants :

### 1. Notification d'inscription (→ tech@logiclinic.org)

**Déclenché quand** : Un utilisateur soumet une demande d'inscription

**Contenu** :
- Nom et prénom du demandeur
- Email et téléphone
- Rôle souhaité
- Spécialité (si médecin)
- Lien vers l'interface admin (à implémenter)

### 2. Email de validation de compte (→ utilisateur)

**Déclenché quand** : Un admin valide une demande d'inscription

**Contenu** :
- Identifiants de connexion
- Code clinique
- Nom d'utilisateur
- Mot de passe temporaire
- Instructions de première connexion

### 3. Alertes techniques (→ tech@logiclinic.org)

**Déclenché quand** : 
- Tentative de déploiement non autorisée
- Problème technique détecté
- Alerte de sécurité

**Contenu** :
- Type d'alerte
- Date et heure
- Détails techniques

## 🧪 Tester la Configuration

### Test 1 : Vérifier la configuration

Créez un fichier de test `server/test-email.ts` :

```typescript
import { emailService } from './src/services/emailService';

async function testEmail() {
  console.log('Test de configuration email...');
  
  if (!emailService.isEmailConfigured()) {
    console.error('❌ Service email non configuré');
    return;
  }
  
  console.log('✅ Service email configuré');
  
  // Test d'envoi
  const success = await emailService.sendRegistrationNotification({
    nom: 'Test',
    prenom: 'Utilisateur',
    email: 'test@example.com',
    telephone: '+229 XX XX XX XX',
    roleSouhaite: 'medecin',
    specialite: 'Cardiologie',
  });
  
  if (success) {
    console.log('✅ Email de test envoyé avec succès');
  } else {
    console.error('❌ Échec de l\'envoi de l\'email de test');
  }
}

testEmail();
```

Exécutez le test :

```bash
cd server
npx ts-node test-email.ts
```

### Test 2 : Soumettre une vraie demande d'inscription

1. Allez sur la landing page
2. Cliquez sur "Inscription"
3. Remplissez le formulaire
4. Soumettez la demande
5. Vérifiez la réception de l'email sur tech@logiclinic.org

## 🔧 Dépannage

### Problème : "Service email non configuré"

**Solution** : Vérifiez que les variables SMTP sont bien définies dans `config.env`

```bash
# Vérifier que le fichier est chargé
cd server
node -e "require('dotenv').config({path:'./config.env'}); console.log(process.env.SMTP_HOST)"
```

### Problème : "Authentication failed" avec Gmail

**Solutions** :
1. Vérifiez que vous utilisez un **mot de passe d'application**, pas votre mot de passe Gmail normal
2. Activez la validation en deux étapes sur votre compte Google
3. Vérifiez que l'email SMTP_USER est correct

### Problème : Les emails vont dans les spams

**Solutions** :
1. Configurez un nom d'expéditeur professionnel dans SMTP_FROM
2. Utilisez un domaine vérifié (SPF, DKIM, DMARC)
3. Pour Gmail : ajoutez tech@logiclinic.org aux contacts

### Problème : "Connection timeout"

**Solutions** :
1. Vérifiez votre connexion Internet
2. Vérifiez que le port SMTP n'est pas bloqué par votre firewall
3. Essayez un autre port (587, 465, 25)
4. Vérifiez avec votre hébergeur que SMTP n'est pas bloqué

## 🔐 Sécurité

### ⚠️ Important

1. **Ne commitez JAMAIS** le fichier `config.env` avec vos vrais identifiants
2. Utilisez des **mots de passe d'application** plutôt que vos mots de passe principaux
3. Limitez les permissions du fichier config.env :
   ```bash
   chmod 600 server/config.env
   ```
4. En production, utilisez des variables d'environnement système ou un gestionnaire de secrets

### Variables d'environnement en production

Pour un déploiement en production (Heroku, AWS, etc.), définissez les variables directement dans l'environnement :

```bash
# Exemple avec Heroku
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=votre-email@gmail.com
heroku config:set SMTP_PASSWORD="votre-mot-de-passe-app"
heroku config:set TECH_EMAIL=tech@logiclinic.org
```

## 📊 Monitoring

### Logs

Le service email génère des logs pour chaque opération :

```
✅ Service email configuré avec succès
✅ Email de notification d'inscription envoyé à tech@logiclinic.org
✅ Alerte technique envoyée à tech@logiclinic.org
❌ Erreur lors de l'envoi de l'email : [détails]
📧 Email non configuré - Notification non envoyée
```

### Dashboard (à implémenter)

Pour un suivi avancé, vous pouvez :
1. Utiliser un service comme SendGrid avec analytics
2. Logger les emails dans une base de données
3. Créer un dashboard admin pour voir l'historique des emails

## 🎯 Étapes Suivantes

1. ✅ Installer nodemailer
2. ✅ Configurer SMTP dans config.env
3. ✅ Tester avec un email de test
4. ✅ Vérifier la réception sur tech@logiclinic.org
5. ⚠️ Configurer SPF/DKIM pour votre domaine (recommandé en production)
6. ⚠️ Mettre en place un système de templates d'emails avancé (optionnel)

## 📞 Support

Pour toute question sur la configuration des emails :
- **Email technique** : tech@logiclinic.org
- **Documentation** : Consultez `/docs/EMAIL_CONFIGURATION.md`

---

**Dernière mise à jour** : Décembre 2024


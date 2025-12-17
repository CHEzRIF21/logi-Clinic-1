# 🚀 Solution SMTP Immédiate - Options Disponibles

## 🔴 Problème Actuel

Les serveurs SMTP de logiclinic.org ne sont pas accessibles :
- `mail.logiclinic.org` - Connexion refusée
- `smtp.logiclinic.org` - Serveur non trouvé

## ✅ Solution 1 : Utiliser Gmail (Recommandé - Fonctionne Immédiatement)

### Avantages
- ✅ Configuration en 5 minutes
- ✅ Fiable et testé
- ✅ Gratuit jusqu'à 500 emails/jour
- ✅ Emails reçus normalement dans tech@logiclinic.org

### Étapes

#### 1. Créer un Mot de Passe d'Application Gmail

1. Allez sur votre compte Gmail (n'importe lequel)
2. **Compte Google** → **Sécurité**
3. Activez la **Validation en deux étapes**
4. **Mots de passe des applications** → Générer
5. Sélectionnez "Autre" → Entrez "LogiClinic"
6. **Copiez le mot de passe** (16 caractères)

#### 2. Configurer server/config.env

```env
# Configuration SMTP pour l'envoi d'emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM=tech@logiclinic.org
```

**Important** :
- `SMTP_USER` = votre email Gmail
- `SMTP_PASSWORD` = le mot de passe d'application généré
- `SMTP_FROM` = tech@logiclinic.org (pour que les destinataires voient ce nom)

#### 3. Tester

```bash
cd server
npx ts-node test-email.ts
```

✅ **Résultat attendu** : Emails envoyés avec succès !

---

## ✅ Solution 2 : Utiliser Outlook/Office 365

Si vous avez un compte Microsoft :

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@outlook.com
SMTP_PASSWORD=votre-mot-de-passe
SMTP_FROM=tech@logiclinic.org
```

---

## ✅ Solution 3 : Utiliser SendGrid (Service Professionnel)

SendGrid offre 100 emails/jour gratuits :

### Étapes

1. Créez un compte sur https://sendgrid.com
2. Générez une API Key
3. Configurez :

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=votre-api-key-sendgrid
SMTP_FROM=tech@logiclinic.org
```

---

## ✅ Solution 4 : Contacter Votre Hébergeur

Pour utiliser logiclinic.org, contactez votre hébergeur et demandez :

### Informations Nécessaires

**Questions à poser** :
1. Quel est le serveur SMTP pour tech@logiclinic.org ?
   - Exemples : mail.logiclinic.org, smtp.logiclinic.org, logiclinic.org
   
2. Quel port SMTP utiliser ?
   - 587 (STARTTLS - recommandé)
   - 465 (SSL)
   - 25 (Non sécurisé - éviter)
   
3. Type de sécurité ?
   - STARTTLS (SMTP_SECURE=false, port 587)
   - SSL/TLS (SMTP_SECURE=true, port 465)
   
4. Format d'authentification ?
   - Email complet : tech@logiclinic.org
   - Ou juste : tech

### Hébergeurs Courants

#### cPanel (le plus courant)
```env
SMTP_HOST=mail.votre-domaine.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tech@logiclinic.org
```

#### Plesk
```env
SMTP_HOST=smtp.votre-domaine.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tech@logiclinic.org
```

#### Google Workspace (si logiclinic.org utilise Google)
```env
SMTP_HOST=smtp-relay.gmail.com
# ou
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tech@logiclinic.org
```

---

## 🧪 Comment Tester Votre Configuration

### Méthode 1 : Webmail

Avant de tester dans l'application :

1. Allez sur le webmail de votre hébergeur
2. Connectez-vous avec tech@logiclinic.org
3. Essayez d'envoyer un email de test
4. Si ça fonctionne, les identifiants sont corrects

### Méthode 2 : Script de Test

Une fois configuré :

```bash
cd server
npx ts-node test-email.ts
```

### Méthode 3 : Client Email

Configurez tech@logiclinic.org dans Outlook/Thunderbird et notez les paramètres SMTP qui fonctionnent.

---

## 📋 Checklist de Configuration

- [ ] J'ai les identifiants corrects pour tech@logiclinic.org
- [ ] Je peux me connecter au webmail
- [ ] Je connais le serveur SMTP
- [ ] Je connais le port SMTP
- [ ] J'ai configuré server/config.env
- [ ] J'ai testé avec : `npx ts-node test-email.ts`
- [ ] J'ai reçu les emails de test
- [ ] Le serveur démarre sans erreur

---

## 🎯 Recommandation

**Pour démarrer rapidement** : Utilisez **Gmail** (Solution 1)
- Configuration en 5 minutes
- Fonctionne à 100%
- Vous pouvez toujours changer plus tard pour logiclinic.org

**Pour la production** : Utilisez logiclinic.org (Solution 4)
- Plus professionnel
- Nécessite la configuration correcte de l'hébergeur

---

## 📞 Besoin d'Aide ?

### Je veux utiliser Gmail maintenant

Dites-moi et je configure immédiatement avec Gmail !

### Je veux utiliser logiclinic.org

Trouvez les informations auprès de votre hébergeur et donnez-moi :
- Le serveur SMTP
- Le port
- Le type de sécurité (SSL/TLS/STARTTLS)

### Je ne sais pas quel hébergeur j'utilise

Utilisez cet outil en ligne :
- https://www.whois.com/whois/logiclinic.org
- Il vous dira qui héberge votre domaine

---

**Date** : 17 Décembre 2024  
**Statut** : En attente de configuration SMTP valide


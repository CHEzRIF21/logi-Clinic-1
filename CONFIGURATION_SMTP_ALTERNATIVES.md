# 🔧 Configuration SMTP - Guide de Dépannage

## ✅ Configuration Actuelle

Votre fichier `server/config.env` est maintenant configuré avec :

```env
SMTP_HOST=mail.logiclinic.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tech@logiclinic.org
SMTP_PASSWORD=CHEzRIF-ITA_122025
SMTP_FROM=tech@logiclinic.org
```

## 🧪 Tester la Configuration

### Étape 1 : Lancer le test

```bash
cd server
npx ts-node test-email.ts
```

### Étape 2 : Vérifier les résultats

Le script de test va :
1. ✅ Vérifier que toutes les variables SMTP sont définies
2. 📧 Envoyer un email de test d'inscription à `tech@logiclinic.org`
3. 🚨 Envoyer un email de test d'alerte à `tech@logiclinic.org`

**Résultat attendu** :
```
✅ Service email configuré avec succès
✅ Email de notification envoyé avec succès !
✅ Email d'alerte envoyé avec succès !
```

### Étape 3 : Vérifier la réception

1. Connectez-vous à `tech@logiclinic.org`
2. Vérifiez votre boîte de réception
3. **Important** : Vérifiez aussi le dossier **SPAM/Indésirables**

## ⚠️ Si les Tests Échouent

### Erreur : "Authentication failed" ou "Invalid credentials"

Les identifiants sont peut-être incorrects ou le serveur SMTP utilise des paramètres différents.

#### Solution 1 : Essayer avec SSL (port 465)

Modifiez `server/config.env` :

```env
SMTP_HOST=mail.logiclinic.org
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tech@logiclinic.org
SMTP_PASSWORD=CHEzRIF-ITA_122025
SMTP_FROM=tech@logiclinic.org
```

#### Solution 2 : Essayer smtp.logiclinic.org

Modifiez `server/config.env` :

```env
SMTP_HOST=smtp.logiclinic.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tech@logiclinic.org
SMTP_PASSWORD=CHEzRIF-ITA_122025
SMTP_FROM=tech@logiclinic.org
```

#### Solution 3 : Essayer sans le domaine complet

Certains serveurs nécessitent juste le nom d'utilisateur :

```env
SMTP_HOST=mail.logiclinic.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tech
SMTP_PASSWORD=CHEzRIF-ITA_122025
SMTP_FROM=tech@logiclinic.org
```

### Erreur : "Connection timeout" ou "ECONNREFUSED"

Le serveur SMTP n'est pas accessible sur ce port.

#### Solution 1 : Vérifier le pare-feu

Assurez-vous que les ports 587 et 465 ne sont pas bloqués.

#### Solution 2 : Essayer différents ports

Testez ces configurations dans l'ordre :

**Configuration A - Port 587 avec STARTTLS** (standard moderne)
```env
SMTP_HOST=mail.logiclinic.org
SMTP_PORT=587
SMTP_SECURE=false
```

**Configuration B - Port 465 avec SSL** (ancien standard)
```env
SMTP_HOST=mail.logiclinic.org
SMTP_PORT=465
SMTP_SECURE=true
```

**Configuration C - Port 25** (non recommandé, souvent bloqué)
```env
SMTP_HOST=mail.logiclinic.org
SMTP_PORT=25
SMTP_SECURE=false
```

### Erreur : "Self signed certificate"

Le serveur utilise un certificat SSL auto-signé.

#### Solution : Ajouter une option pour ignorer les certificats

Modifiez temporairement `server/src/services/emailService.ts` ligne ~20 :

```typescript
this.transporter = nodemailer.createTransport({
  host: smtpHost,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: smtpUser,
    pass: smtpPassword,
  },
  tls: {
    rejectUnauthorized: false  // ⚠️ À utiliser seulement en développement
  }
});
```

## 🔍 Identifier les Paramètres SMTP Corrects

### Méthode 1 : Vérifier avec votre hébergeur

Contactez votre fournisseur d'hébergement pour logiclinic.org et demandez :
- Serveur SMTP (ex: mail.logiclinic.org ou smtp.logiclinic.org)
- Port SMTP (587, 465, ou 25)
- Type de sécurité (SSL, TLS, STARTTLS)
- Format du nom d'utilisateur (email complet ou juste le nom)

### Méthode 2 : Vérifier dans votre client email

Si vous avez déjà configuré `tech@logiclinic.org` dans un client email (Outlook, Thunderbird, etc.) :

1. Ouvrez les paramètres du compte
2. Allez dans "Serveur sortant (SMTP)"
3. Notez les paramètres utilisés

### Méthode 3 : Test avec telnet

Pour tester si le serveur SMTP répond :

```bash
# Test port 587
telnet mail.logiclinic.org 587

# Test port 465
telnet mail.logiclinic.org 465
```

Si la connexion réussit, vous verrez une réponse du serveur.

## 📧 Configurations Communes par Hébergeur

### cPanel (le plus courant)
```env
SMTP_HOST=mail.votre-domaine.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tech@logiclinic.org
```

### Plesk
```env
SMTP_HOST=smtp.votre-domaine.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tech@logiclinic.org
```

### Google Workspace (si vous utilisez Google pour logiclinic.org)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tech@logiclinic.org
SMTP_PASSWORD=mot-de-passe-application
```

### Microsoft 365 / Office 365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tech@logiclinic.org
```

## 🔐 Vérifier les Identifiants

### Test de connexion email

Avant de tester dans l'application, vérifiez que vous pouvez vous connecter à votre email :

1. Allez sur le webmail de votre hébergeur
2. Essayez de vous connecter avec :
   - Email : `tech@logiclinic.org`
   - Mot de passe : `CHEzRIF-ITA_122025`

Si la connexion échoue, le mot de passe est incorrect.

## 🚀 Après la Configuration

Une fois que les tests passent :

### 1. Redémarrer le serveur

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez
npm run dev
```

### 2. Tester avec une vraie inscription

1. Allez sur http://localhost:5173 (ou votre URL)
2. Cliquez sur "Inscription"
3. Remplissez le formulaire
4. Soumettez
5. Vérifiez `tech@logiclinic.org` pour l'email

### 3. Vérifier les logs du serveur

Cherchez ces messages dans les logs :

```
✅ Service email configuré avec succès
✅ Email de notification d'inscription envoyé à tech@logiclinic.org
```

## 📊 Tableau de Dépannage Rapide

| Erreur | Cause Probable | Solution |
|--------|----------------|----------|
| Authentication failed | Identifiants incorrects | Vérifier email/password |
| ECONNREFUSED | Serveur/port incorrect | Essayer smtp.logiclinic.org ou port 465 |
| ETIMEDOUT | Port bloqué | Vérifier firewall, essayer port 465 |
| Self-signed certificate | Certificat SSL invalide | Ajouter `rejectUnauthorized: false` |
| Greeting never received | Mauvais protocole | Essayer SMTP_SECURE=true avec port 465 |

## 📞 Besoin d'Aide ?

### Option 1 : Utiliser Gmail temporairement

Si vous n'arrivez pas à configurer logiclinic.org, vous pouvez utiliser Gmail temporairement :

1. Créez un compte Gmail ou utilisez un existant
2. Générez un mot de passe d'application
3. Configurez :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=mot-de-passe-application
SMTP_FROM=noreply@logiclinic.org
```

### Option 2 : Contacter votre hébergeur

Contactez le support de l'hébergeur de logiclinic.org et demandez :
- Les paramètres SMTP pour tech@logiclinic.org
- Si le compte email est bien actif
- Si l'envoi SMTP est autorisé

### Option 3 : Partager les logs d'erreur

Si vous voyez des erreurs spécifiques dans les logs, partagez-les pour un diagnostic plus précis.

## ✅ Checklist Finale

Avant de considérer que tout fonctionne :

- [ ] Le test `npx ts-node test-email.ts` passe sans erreur
- [ ] Vous avez reçu 2 emails de test sur tech@logiclinic.org
- [ ] Une inscription sur le site envoie bien un email
- [ ] Le serveur démarre sans erreur SMTP
- [ ] Les logs montrent "Service email configuré avec succès"

---

**Configuration effectuée le** : 17 Décembre 2024  
**Email configuré** : tech@logiclinic.org  
**Support** : Consultez les logs du serveur pour plus de détails


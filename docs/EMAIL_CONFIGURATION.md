# Configuration des Emails - Logi Clinic

Ce document explique la configuration des différents emails utilisés dans l'application Logi Clinic et leurs usages spécifiques.

## Emails Configurés

### 1. contact@logiclinic.org
**Usage** : Email de contact général affiché sur la landing page

**Utilisé pour** :
- Recevoir les feedbacks des utilisateurs
- Questions générales sur le logiciel
- Demandes de contact général

**Emplacement dans le code** :
- `src/components/auth/Login.tsx` (ligne ~1759)
  - Affiché dans la section "Contactez-nous"
  - Lien mailto cliquable pour permettre aux visiteurs d'envoyer un email

**Comment modifier** :
```typescript
// Dans Login.tsx, section Contact
<Typography 
  component="a"
  href="mailto:contact@logiclinic.org"
  variant="body2"
>
  contact@logiclinic.org
</Typography>
```

### 2. tech@logiclinic.org
**Usage** : Email technique pour les notifications système et inscriptions

**Utilisé pour** :
- Recevoir les demandes d'inscription au logiciel
- Recevoir les alertes de résolution de problèmes techniques
- Alertes de sécurité (tentatives de déploiement non autorisées)
- Notifications système critiques

**Emplacement dans le code** :

#### a) Demandes d'inscription
Les demandes d'inscription sont créées via l'API dans :
- `server/src/routes/auth.ts` (route `/register-request`)
- `supabase/functions/api/auth.ts` (route `/api/auth/register-request`)

**Note** : L'envoi d'email pour notifier tech@logiclinic.org lors d'une nouvelle demande d'inscription nécessite l'implémentation d'un service d'email (voir section "Implémentation à faire").

#### b) Alertes techniques
Configuré dans :
- Variable d'environnement : `ALERT_EMAIL=tech@logiclinic.org`
- Service : `server/src/services/licenseService.ts` (ligne ~252)

**Comment modifier** :
```typescript
// Dans server/config.env
ALERT_EMAIL=tech@logiclinic.org
TECH_EMAIL=tech@logiclinic.org
```

## Variables d'Environnement

### Fichier : `server/config.env`

```env
# Email pour recevoir les demandes d'inscription et les alertes techniques
TECH_EMAIL=tech@logiclinic.org

# Email pour recevoir les feedbacks et contacts généraux
CONTACT_EMAIL=contact@logiclinic.org

# Email pour les alertes de sécurité et déploiement
ALERT_EMAIL=tech@logiclinic.org
```

## Flux des Emails

### 1. Feedback / Contact Général
```
Utilisateur sur landing page
    ↓
Clique sur contact@logiclinic.org
    ↓
Client email s'ouvre (mailto:)
    ↓
Email envoyé directement à contact@logiclinic.org
```

### 2. Demande d'Inscription
```
Utilisateur remplit formulaire d'inscription
    ↓
Frontend envoie POST /api/auth/register-request
    ↓
Backend crée entrée dans registration_requests
    ↓
[À IMPLÉMENTER] Service email envoie notification
    ↓
tech@logiclinic.org reçoit la notification
    ↓
Admin traite la demande dans l'interface admin
```

### 3. Alertes Techniques
```
Problème technique détecté
    ↓
Service génère une alerte
    ↓
licenseService.sendAlert() appelé
    ↓
Email envoyé à ALERT_EMAIL (tech@logiclinic.org)
```

## Implémentation à Faire

### Service d'Email pour Notifications d'Inscription

Pour que les demandes d'inscription envoient automatiquement un email à `tech@logiclinic.org`, vous devez :

1. **Installer un service d'email** (ex: nodemailer)
```bash
npm install nodemailer @types/nodemailer
```

2. **Créer un service d'email** (`server/src/services/emailService.ts`)
```typescript
import nodemailer from 'nodemailer';

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendRegistrationNotification(data: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    roleSouhaite: string;
  }) {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.TECH_EMAIL,
      subject: 'Nouvelle demande d\'inscription - Logi Clinic',
      html: `
        <h2>Nouvelle demande d'inscription</h2>
        <p><strong>Nom:</strong> ${data.nom}</p>
        <p><strong>Prénom:</strong> ${data.prenom}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Téléphone:</strong> ${data.telephone}</p>
        <p><strong>Rôle souhaité:</strong> ${data.roleSouhaite}</p>
        <p>Veuillez vous connecter à l'interface admin pour traiter cette demande.</p>
      `,
    });
  }
}
```

3. **Ajouter les variables SMTP dans config.env**
```env
# Configuration SMTP pour l'envoi d'emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=noreply@logiclinic.org
```

4. **Utiliser le service dans auth.ts**
```typescript
import { EmailService } from '../services/emailService';

router.post('/register-request', async (req, res) => {
  // ... code existant ...
  
  // Après l'insertion réussie
  if (data) {
    const emailService = new EmailService();
    await emailService.sendRegistrationNotification({
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      roleSouhaite: data.role_souhaite,
    });
  }
  
  // ... reste du code ...
});
```

### Service d'Email pour Alertes Techniques

Pour implémenter l'envoi d'emails pour les alertes techniques (actuellement en TODO) :

1. Dans `server/src/services/licenseService.ts`, ligne 281-283 :
```typescript
// Remplacer le TODO par :
if (alertEmail) {
  const emailService = new EmailService();
  await emailService.sendTechnicalAlert({
    type: alertData.type,
    timestamp: alertData.timestamp,
    details: alertData,
  });
}
```

2. Ajouter la méthode dans EmailService :
```typescript
async sendTechnicalAlert(data: any) {
  await this.transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.ALERT_EMAIL,
    subject: `Alerte Technique - ${data.type}`,
    html: `
      <h2>Alerte Technique Détectée</h2>
      <p><strong>Type:</strong> ${data.type}</p>
      <p><strong>Date:</strong> ${data.timestamp}</p>
      <pre>${JSON.stringify(data.details, null, 2)}</pre>
    `,
  });
}
```

## Résumé

| Email | Usage | Implémentation | Statut |
|-------|-------|----------------|--------|
| contact@logiclinic.org | Contact général, feedbacks | Lien mailto dans UI | ✅ Implémenté |
| tech@logiclinic.org | Notifications d'inscription | Service email à créer | ⚠️ À implémenter |
| tech@logiclinic.org | Alertes techniques | Service email à créer | ⚠️ À implémenter |

## Support

Pour toute question sur la configuration des emails, contactez :
- **Email technique** : tech@logiclinic.org
- **Email général** : contact@logiclinic.org

---

**Dernière mise à jour** : Décembre 2024


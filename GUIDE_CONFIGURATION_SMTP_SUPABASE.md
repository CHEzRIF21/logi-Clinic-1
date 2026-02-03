# Configuration SMTP Supabase – étape par étape

Ce guide permet de remplir tous les champs requis pour activer l’envoi d’emails (réinitialisation de mot de passe, validation de compte, etc.) via un serveur SMTP personnalisé dans Supabase.

---

## 1. Où configurer

1. Ouvrez le **Dashboard Supabase** : https://supabase.com/dashboard  
2. Sélectionnez votre projet (ex. Logiclinic).  
3. Menu gauche : **Authentication** → **Notifications** → **Email**.  
4. Onglet **SMTP Settings**.

---

## 2. Activer le SMTP personnalisé

- **Enable custom SMTP** : laissez le toggle **ON** (activé).  
- Tant que tous les champs obligatoires ne sont pas remplis, le message orange « All fields must be filled » reste affiché. C’est normal ; il disparaît une fois tout complété.

---

## 3. Remplir tous les champs obligatoires

Les champs ci‑dessous correspondent à ce que Supabase attend (dashboard et API). Remplissez‑les un par un.

### 3.1 Sender details (expéditeur)

| Champ dans Supabase | Valeur à mettre | Exemple |
|---------------------|-----------------|--------|
| **Sender email address** | Adresse d’envoi (From) | `noreply@votredomaine.com` |
| **Sender name** (si présent) | Nom affiché comme expéditeur | `Logiclinic` ou `Votre clinique` |

- Utilisez un domaine que vous contrôlez (évitez `@gmail.com` pour la prod).  
- Idéalement une adresse du type `noreply@` ou `auth@` pour les emails d’authentification.

---

### 3.2 Paramètres du serveur SMTP

À récupérer depuis votre fournisseur d’emails (Gmail, SendGrid, Brevo, Resend, etc.) :

| Champ dans Supabase | Description | Exemple |
|---------------------|-------------|--------|
| **Host** | Serveur SMTP | `smtp.gmail.com` ou `smtp.sendgrid.net` |
| **Port** | Port SMTP (souvent 587 ou 465) | `587` (TLS) ou `465` (SSL) |
| **Username** | Identifiant SMTP (souvent l’email ou un identifiant fourni) | Votre email ou `apikey` |
| **Password** | Mot de passe ou clé API SMTP | Mot de passe d’application ou clé API |

- **Port 587** : utilisation courante avec STARTTLS.  
- **Port 465** : SSL/TLS direct.  
- **Port 25** : en général à éviter (blocages fréquents).

---

## 4. Exemples par fournisseur

### Gmail

1. Activer la « validation en 2 étapes » sur le compte Google.  
2. Créer un **mot de passe d’application** :  
   Compte Google → Sécurité → Mots de passe des applications.  
3. Dans Supabase :
   - **Sender email** : votre adresse Gmail (ex. `noreply@votredomaine.com` si vous utilisez Gmail avec ce domaine, sinon `votreemail@gmail.com`).
   - **Host** : `smtp.gmail.com`  
   - **Port** : `587`  
   - **Username** : votre adresse Gmail complète  
   - **Password** : le mot de passe d’application (16 caractères)

### Brevo (ex‑Sendinblue)

- **Host** : `smtp-relay.brevo.com`  
- **Port** : `587`  
- **Username** : votre email de connexion Brevo  
- **Password** : votre mot de passe SMTP (généré dans Brevo, section SMTP)

### SendGrid

- **Host** : `smtp.sendgrid.net`  
- **Port** : `587`  
- **Username** : `apikey` (littéralement)  
- **Password** : votre clé API SendGrid

### Resend

- Voir la doc Resend pour Supabase : [Send with Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp)  
- **Host / Port / Username / Password** : selon les valeurs indiquées dans leur interface.

---

## 5. Enregistrer et tester

1. Remplir **tous** les champs listés (aucun ne doit rester vide si le dashboard le marque comme requis).  
2. Cliquer sur **Save** (ou équivalent).  
3. Le message « All fields must be filled » doit disparaître.  
4. Tester : depuis votre app, utilisez **Mot de passe oublié** avec une adresse email valide et vérifiez la réception et l’absence d’erreur dans les logs Supabase (Authentication → Logs).

---

## 6. Limites et bonnes pratiques

- Après activation, Supabase impose une **limite par défaut** (ex. 30 emails/heure). Vous pouvez l’ajuster dans **Authentication** → **Rate Limits**.  
- En production, configurez **SPF, DKIM et DMARC** pour votre domaine d’envoi (améliore la délivrabilité et limite le spam).  
- Utilisez de préférence un **domaine dédié** pour les emails d’auth (ex. `noreply@auth.votredomaine.com`).

---

## 7. Résumé des champs à remplir

| # | Champ | Obligatoire |
|---|--------|-------------|
| 1 | Sender email address | Oui |
| 2 | Sender name | Si proposé |
| 3 | SMTP Host | Oui |
| 4 | SMTP Port | Oui |
| 5 | SMTP Username | Oui |
| 6 | SMTP Password | Oui |

Une fois ces champs correctement remplis, le SMTP personnalisé est activé et les emails de réinitialisation (et autres emails Auth) sont envoyés via votre serveur SMTP.

---

## 8. Redirection du lien « Réinitialiser le mot de passe »

Pour que le lien dans l’email de réinitialisation ouvre **directement** la page `/reset-password` (et non la page d’accueil) :

1. Dans le Dashboard Supabase : **Authentication** → **URL Configuration**.
2. **Site URL** : l’URL de base de votre app (ex. `https://www.logiclinic.org`).
3. **Redirect URLs** (Additional Redirect URLs) : ajoutez **exactement** l’URL de la page de reset, par exemple :
   - `https://www.logiclinic.org/reset-password`
   - `http://localhost:5173/reset-password` (pour le dev)
4. Pas de slash final, même domaine que votre site.
5. Enregistrez.

Si cette URL n’est pas dans la liste, Supabase redirige vers la **Site URL** (page d’accueil) avec les tokens dans le hash. L’application Logiclinic détecte alors le hash et redirige vers `/reset-password`, mais il est préférable d’ajouter l’URL pour que le lien de l’email pointe directement vers la page de réinitialisation.

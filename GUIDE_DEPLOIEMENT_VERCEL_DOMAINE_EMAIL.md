# 🚀 Guide Complet - Déploiement Vercel avec Domaine Personnalisé et Configuration Email

## 📋 Vue d'ensemble

Ce guide vous explique comment :
1. ✅ Déployer votre application Logi Clinic sur Vercel avec votre domaine personnalisé
2. ✅ Configurer le backend pour qu'il soit accessible via votre domaine
3. ✅ Activer l'envoi d'emails pour les inscriptions utilisateurs
4. ✅ Vérifier que tout fonctionne correctement

---

## 🌐 Étape 1 : Configuration du Domaine Personnalisé sur Vercel

### 1.1 Ajouter votre domaine à Vercel

1. Allez sur **https://vercel.com/dashboard**
2. Sélectionnez votre projet **Logi Clinic**
3. Allez dans **Settings** → **Domains**
4. Cliquez sur **Add Domain**
5. Entrez votre domaine (ex: `logiclinic.org` ou `www.logiclinic.org`)
6. Suivez les instructions pour configurer les enregistrements DNS :
   - **Type A** : Point vers les adresses IP de Vercel
   - **Type CNAME** : Point vers `cname.vercel-dns.com`
   - **Type TXT** : Ajoutez le record de vérification fourni par Vercel

### 1.2 Vérifier la configuration DNS

Vercel vous fournira les enregistrements DNS à ajouter chez votre registrar. Attendez que la propagation DNS soit complète (peut prendre jusqu'à 48h, généralement quelques minutes).

### 1.3 Vérifier le déploiement

Une fois le domaine configuré, votre application sera accessible sur :
- `https://votre-domaine.com` (si configuré)
- `https://www.votre-domaine.com` (si configuré)
- `https://votre-projet.vercel.app` (toujours disponible)

---

## 🔧 Étape 2 : Configuration des Variables d'Environnement sur Vercel

### 2.1 Variables pour le Frontend (Racine du projet)

Allez dans **Settings** → **Environment Variables** de votre projet Vercel et ajoutez :

#### Variables OBLIGATOIRES pour le Frontend

```env
# URL de l'API Backend
# ⚠️ IMPORTANT: Remplacez par l'URL de votre backend déployé
# Option 1: Si backend sur Vercel: https://votre-backend.vercel.app/api
# Option 2: Si backend sur Supabase Edge Functions: https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api
VITE_API_URL=https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api

# Configuration Supabase
VITE_SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8
```

**⚠️ IMPORTANT :**
- Cochez **Production**, **Preview**, et **Development** pour chaque variable
- Cliquez sur **Save** après chaque variable

---

### 2.2 Variables pour le Backend (Dossier server)

Si vous déployez le backend séparément sur Vercel (dossier `server`), créez un **nouveau projet Vercel** pour le backend et ajoutez ces variables :

#### Variables OBLIGATOIRES pour le Backend

```env
# Configuration du serveur
PORT=3000
NODE_ENV=production

# Configuration CORS - ⚠️ IMPORTANT: Ajoutez votre domaine de production
# Format: https://votre-domaine.com,https://www.votre-domaine.com,https://votre-projet.vercel.app
CORS_ORIGIN=https://votre-domaine.com,https://www.votre-domaine.com,https://logiclinic-mwy8.vercel.app

# Configuration Supabase
SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8

# Configuration JWT
JWT_SECRET=logi_clinic_secret_key_2024_secure

# Configuration Base de Données (si vous utilisez Prisma)
# ⚠️ IMPORTANT: Remplacez [VOTRE_MOT_DE_PASSE] par votre mot de passe Supabase
DATABASE_URL=postgresql://postgres.bnfgemmlokvetmohiqch:[VOTRE_MOT_DE_PASSE]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

#### Variables pour l'Envoi d'Emails (OBLIGATOIRES pour activer les emails)

```env
# Configuration des Emails
TECH_EMAIL=tech@logiclinic.org
CONTACT_EMAIL=contact@logiclinic.org
ALERT_EMAIL=tech@logiclinic.org

# Configuration SMTP pour l'envoi d'emails
# ⚠️ IMPORTANT: Configurez ces variables pour activer l'envoi d'emails
SMTP_HOST=smtp.logiclinic.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tech@logiclinic.org
SMTP_PASSWORD=CHEzRIF-ITA_122025
SMTP_FROM=tech@logiclinic.org
```

#### Variables Optionnelles

```env
# Configuration Transcription Vocale
SPEECH_TO_TEXT_API_KEY=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
SPEECH_TO_TEXT_PROVIDER=openai
```

---

## 📧 Étape 3 : Vérification de la Configuration Email

### 3.1 Comment fonctionne l'envoi d'emails

L'envoi d'emails est automatiquement activé lorsque les variables SMTP sont configurées. Le système envoie des emails dans les cas suivants :

1. **Nouvelle demande d'inscription** → Email envoyé à `tech@logiclinic.org`
2. **Validation de compte utilisateur** → Email envoyé à l'utilisateur avec ses identifiants
3. **Alertes techniques** → Email envoyé à `tech@logiclinic.org`

### 3.2 Tester l'envoi d'emails

1. Créez une nouvelle demande d'inscription depuis votre application
2. Vérifiez que l'email arrive bien à `tech@logiclinic.org`
3. Si l'email n'arrive pas, vérifiez :
   - Les variables SMTP sont bien configurées sur Vercel
   - Les logs Vercel pour voir les erreurs éventuelles
   - La configuration SMTP de votre serveur email

### 3.3 Vérifier les logs Vercel

1. Allez dans **Deployments** → Sélectionnez votre dernier déploiement
2. Cliquez sur **Functions** → Sélectionnez votre fonction
3. Vérifiez les logs pour voir si les emails sont envoyés :
   - ✅ `Email de notification d'inscription envoyé à tech@logiclinic.org`
   - ❌ `Erreur lors de l'envoi de l'email` (si problème)

---

## 🔗 Étape 4 : Vérifier que le Backend est relié à votre Domaine

### 4.1 Si vous utilisez Supabase Edge Functions

Si votre `VITE_API_URL` pointe vers Supabase Edge Functions, le backend est déjà déployé et accessible. Vérifiez simplement que :

1. La variable `VITE_API_URL` est bien configurée sur Vercel
2. L'URL pointe vers : `https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api`

### 4.2 Si vous déployez le backend sur Vercel

1. **Déployez le backend séparément** :
   - Créez un nouveau projet Vercel
   - Connectez le dossier `server`
   - Configurez les variables d'environnement (voir section 2.2)
   - Vercel détectera automatiquement `vercel.json` dans le dossier server

2. **Mettez à jour VITE_API_URL** :
   - Allez dans les Settings du projet frontend
   - Mettez à jour `VITE_API_URL` avec l'URL de votre backend Vercel
   - Format : `https://votre-backend.vercel.app/api`

3. **Vérifiez la connexion** :
   - Testez une requête API depuis votre frontend
   - Vérifiez les logs Vercel pour voir si les requêtes arrivent

### 4.3 Test de connexion Backend

Pour vérifier que le backend est bien accessible :

```bash
# Test depuis votre terminal
curl https://votre-backend.vercel.app/api/health

# Ou depuis votre navigateur
https://votre-backend.vercel.app/api/health
```

Vous devriez recevoir une réponse JSON :
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

---

## ✅ Étape 5 : Checklist de Vérification

Avant de considérer le déploiement comme terminé, vérifiez :

### Frontend
- [ ] Le domaine personnalisé est configuré et accessible
- [ ] Les variables `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` sont configurées
- [ ] L'application se charge correctement sur votre domaine
- [ ] Les appels API fonctionnent (pas d'erreurs CORS)

### Backend
- [ ] Le backend est déployé et accessible (si déployé séparément)
- [ ] Les variables d'environnement sont configurées
- [ ] La variable `CORS_ORIGIN` contient votre domaine de production
- [ ] Le endpoint `/api/health` répond correctement

### Emails
- [ ] Les variables SMTP sont configurées sur Vercel
- [ ] Un test d'inscription envoie bien un email à `tech@logiclinic.org`
- [ ] Les logs Vercel ne montrent pas d'erreurs d'envoi d'email

### Tests Fonctionnels
- [ ] Créer une demande d'inscription → Email reçu ✅
- [ ] Se connecter à l'application → Fonctionne ✅
- [ ] Les données se chargent correctement → Fonctionne ✅

---

## 🐛 Résolution de Problèmes

### Problème : CORS Error

**Symptôme** : Erreur `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution** :
1. Vérifiez que `CORS_ORIGIN` contient votre domaine exact (avec `https://`)
2. Redéployez le backend après modification de `CORS_ORIGIN`
3. Vérifiez que le domaine dans `CORS_ORIGIN` correspond exactement à l'URL utilisée

### Problème : Emails non envoyés

**Symptôme** : Les emails ne sont pas reçus

**Solution** :
1. Vérifiez que toutes les variables SMTP sont configurées sur Vercel
2. Vérifiez les logs Vercel pour voir les erreurs
3. Testez la configuration SMTP avec un client email externe
4. Vérifiez que le serveur SMTP accepte les connexions depuis Vercel

### Problème : Backend non accessible

**Symptôme** : Erreur `Failed to fetch` ou `Network error`

**Solution** :
1. Vérifiez que `VITE_API_URL` est correctement configurée
2. Testez l'URL du backend directement dans le navigateur
3. Vérifiez que le backend est bien déployé et actif
4. Vérifiez les logs Vercel du backend pour voir les erreurs

### Problème : Variables d'environnement non prises en compte

**Symptôme** : Les variables ne semblent pas être utilisées

**Solution** :
1. **Redéployez** l'application après avoir ajouté/modifié des variables
2. Vérifiez que les variables sont bien cochées pour l'environnement (Production/Preview/Development)
3. Pour le frontend, les variables doivent commencer par `VITE_` pour être accessibles
4. Vérifiez que vous n'avez pas d'espaces avant/après les valeurs

---

## 📚 Ressources Utiles

- **Documentation Vercel** : https://vercel.com/docs
- **Configuration DNS** : https://vercel.com/docs/concepts/projects/domains
- **Variables d'environnement** : https://vercel.com/docs/concepts/projects/environment-variables
- **Logs Vercel** : Accessibles depuis le dashboard → Deployments → Logs

---

## 🎯 Résumé Rapide

1. **Domaine** : Ajoutez votre domaine dans Settings → Domains
2. **Variables Frontend** : Configurez `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
3. **Variables Backend** : Configurez `CORS_ORIGIN` avec votre domaine, et toutes les variables SMTP
4. **Redéployez** : Après chaque modification de variables, redéployez
5. **Testez** : Vérifiez que tout fonctionne (emails, API, connexions)

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs Vercel
2. Consultez la section "Résolution de Problèmes" ci-dessus
3. Vérifiez que toutes les variables sont correctement configurées

**Email de support technique** : tech@logiclinic.org


# 📋 Résumé - Configuration Vercel et Emails

## ✅ Ce qui a été fait

### 1. Mise à jour des fichiers d'environnement

#### `server/config.env`
- ✅ Configuration SMTP complète pour l'envoi d'emails
- ✅ Variables pour le backend Vercel
- ✅ Configuration CORS pour le domaine personnalisé

#### `server/env.setup`
- ✅ Toutes les variables nécessaires pour Vercel
- ✅ Configuration SMTP pour les emails
- ✅ Configuration CORS avec support du domaine personnalisé

#### `ENV_EXAMPLE.txt`
- ✅ Exemple complet des variables frontend
- ✅ Instructions pour la production et le développement local

### 2. Guide de déploiement créé

**`GUIDE_DEPLOIEMENT_VERCEL_DOMAINE_EMAIL.md`** - Guide complet avec :
- Configuration du domaine personnalisé
- Configuration des variables d'environnement
- Activation de l'envoi d'emails
- Vérification de la connexion backend
- Résolution de problèmes

---

## 🚀 Comment utiliser ces fichiers pour déployer sur Vercel

### Étape 1 : Configurer votre domaine sur Vercel

1. Allez sur **https://vercel.com/dashboard**
2. Sélectionnez votre projet
3. **Settings** → **Domains** → **Add Domain**
4. Suivez les instructions DNS

### Étape 2 : Configurer les variables d'environnement

#### Pour le Frontend (projet principal)

Dans **Settings** → **Environment Variables**, ajoutez :

```env
VITE_API_URL=https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api
VITE_SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8
```

**⚠️ IMPORTANT** : Cochez **Production**, **Preview**, et **Development** pour chaque variable.

#### Pour le Backend (si déployé séparément)

Si vous déployez le dossier `server` sur Vercel, créez un **nouveau projet** et ajoutez :

```env
# Configuration serveur
PORT=3000
NODE_ENV=production
JWT_SECRET=logi_clinic_secret_key_2024_secure

# CORS - ⚠️ REMPLACEZ par votre domaine réel
CORS_ORIGIN=https://votre-domaine.com,https://www.votre-domaine.com,https://logiclinic-mwy8.vercel.app

# Supabase
SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8

# Configuration SMTP pour les emails
TECH_EMAIL=tech@logiclinic.org
CONTACT_EMAIL=contact@logiclinic.org
ALERT_EMAIL=tech@logiclinic.org
SMTP_HOST=smtp.logiclinic.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tech@logiclinic.org
SMTP_PASSWORD=CHEzRIF-ITA_122025
SMTP_FROM=tech@logiclinic.org
```

### Étape 3 : Redéployer

Après avoir ajouté/modifié les variables :
1. Allez dans **Deployments**
2. Cliquez sur les **3 points** du dernier déploiement
3. Sélectionnez **Redeploy**

---

## 📧 Activation de l'envoi d'emails

L'envoi d'emails est **automatiquement activé** lorsque les variables SMTP sont configurées sur Vercel.

### Emails envoyés automatiquement :

1. **Nouvelle demande d'inscription** 
   - → Email envoyé à `tech@logiclinic.org`
   - Contient : nom, prénom, email, téléphone, rôle souhaité

2. **Validation de compte utilisateur**
   - → Email envoyé à l'utilisateur
   - Contient : identifiants de connexion, code clinique, mot de passe temporaire

3. **Alertes techniques**
   - → Email envoyé à `tech@logiclinic.org`
   - Pour les problèmes techniques et de sécurité

### Tester l'envoi d'emails :

1. Créez une nouvelle demande d'inscription depuis votre application
2. Vérifiez que l'email arrive à `tech@logiclinic.org`
3. Consultez les logs Vercel si l'email n'arrive pas

---

## 🔍 Vérifier que le backend est relié à votre domaine

### Option 1 : Backend sur Supabase Edge Functions (actuel)

Si `VITE_API_URL` pointe vers Supabase Edge Functions, c'est déjà configuré :
- ✅ Backend accessible via : `https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api`
- ✅ Pas besoin de déployer le backend séparément

### Option 2 : Backend sur Vercel

Si vous voulez déployer le backend sur Vercel :

1. **Créer un nouveau projet Vercel** pour le dossier `server`
2. **Configurer les variables** (voir section ci-dessus)
3. **Mettre à jour `VITE_API_URL`** dans le projet frontend avec l'URL du backend Vercel
4. **Tester** : `https://votre-backend.vercel.app/api/health`

---

## 📝 Fichiers de référence

- **`GUIDE_DEPLOIEMENT_VERCEL_DOMAINE_EMAIL.md`** : Guide complet et détaillé
- **`server/config.env`** : Variables backend (référence)
- **`server/env.setup`** : Variables backend (référence)
- **`ENV_EXAMPLE.txt`** : Variables frontend (référence)

---

## ⚠️ Points importants

1. **CORS_ORIGIN** : Doit contenir votre domaine exact avec `https://`
2. **Variables SMTP** : Doivent être configurées sur Vercel pour activer les emails
3. **Redéploiement** : Nécessaire après chaque modification de variables
4. **VITE_** : Les variables frontend doivent commencer par `VITE_` pour être accessibles

---

## 🐛 Problèmes courants

### Emails non envoyés
→ Vérifiez que toutes les variables SMTP sont configurées sur Vercel

### Erreur CORS
→ Vérifiez que `CORS_ORIGIN` contient votre domaine exact

### Variables non prises en compte
→ Redéployez l'application après modification des variables

---

## 📞 Support

Pour plus de détails, consultez **`GUIDE_DEPLOIEMENT_VERCEL_DOMAINE_EMAIL.md`**

Email technique : tech@logiclinic.org


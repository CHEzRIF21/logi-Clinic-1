# 🚀 Guide de Déploiement Vercel - Résolution des Problèmes de Connexion

## 🔍 Problème Identifié

Lorsque votre frontend est déployé sur Vercel (https://logiclinic-mwy8.vercel.app/), vous ne pouvez pas ajouter de données à la base de données. Cela est dû à :

1. **Variables d'environnement manquantes** sur Vercel
2. **Configuration Supabase non définie** en production
3. **URL de l'API backend** pointant vers `localhost` (qui n'existe pas en production)

---

## ✅ Solution : Configurer les Variables d'Environnement sur Vercel

### Étape 1 : Accéder aux Paramètres Vercel

1. Allez sur https://vercel.com
2. Connectez-vous à votre compte
3. Sélectionnez votre projet **logiclinic-mwy8**
4. Allez dans **Settings** → **Environment Variables**

### Étape 2 : Ajouter les Variables d'Environnement

Ajoutez les variables suivantes pour **Production**, **Preview**, et **Development** :

#### Variables Supabase (OBLIGATOIRES)

```
VITE_SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
```

```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8
```

#### Variable API Backend (OPTIONNELLE - seulement si vous avez déployé le backend)

Si vous avez déployé votre backend API sur un service comme Railway, Render, ou Heroku, ajoutez :

```
VITE_API_URL=https://votre-backend-url.com/api
```

**⚠️ Important :** Si vous n'avez pas déployé le backend, laissez cette variable vide ou ne l'ajoutez pas. L'application fonctionnera avec Supabase directement pour la plupart des fonctionnalités.

---

## 🔧 Option 1 : Utiliser Supabase Directement (Recommandé)

Votre application peut fonctionner **sans backend API** en utilisant Supabase directement. La plupart des fonctionnalités (patients, consultations, maternité, stock) utilisent déjà Supabase.

### Avantages :
- ✅ Pas besoin de déployer un backend séparé
- ✅ Moins de coûts
- ✅ Plus simple à maintenir
- ✅ Utilise les Row Level Security (RLS) de Supabase pour la sécurité

### Configuration :

1. **Ajoutez uniquement les variables Supabase** sur Vercel (voir Étape 2 ci-dessus)
2. **Ne configurez pas** `VITE_API_URL` ou laissez-la vide
3. **Redéployez** votre application sur Vercel

---

## 🔧 Option 2 : Déployer le Backend API

Si vous avez besoin de fonctionnalités spécifiques qui nécessitent le backend (comme l'authentification personnalisée, la transcription vocale, etc.), vous devez déployer le backend.

### Options de Déploiement Backend :

#### A. Railway (Recommandé - Gratuit pour commencer)

1. Allez sur https://railway.app
2. Créez un nouveau projet
3. Connectez votre repository GitHub
4. Sélectionnez le dossier `server`
5. Configurez les variables d'environnement :
   ```
   DATABASE_URL=votre-url-supabase
   JWT_SECRET=votre-secret-jwt
   CORS_ORIGIN=https://logiclinic-mwy8.vercel.app
   SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
   SUPABASE_ANON_KEY=votre-clé-anon
   ```
6. Railway générera une URL comme `https://votre-projet.up.railway.app`
7. Ajoutez sur Vercel : `VITE_API_URL=https://votre-projet.up.railway.app/api`

#### B. Render (Alternative)

1. Allez sur https://render.com
2. Créez un nouveau **Web Service**
3. Connectez votre repository
4. Configurez :
   - **Build Command** : `cd server && npm install && npm run build`
   - **Start Command** : `cd server && npm start`
   - **Root Directory** : `server`
5. Ajoutez les variables d'environnement (mêmes que Railway)
6. Ajoutez l'URL générée sur Vercel

---

## 📋 Checklist de Vérification

Après avoir configuré les variables d'environnement sur Vercel :

- [ ] Variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` ajoutées
- [ ] Variables configurées pour **Production**, **Preview**, et **Development**
- [ ] Redéploiement effectué (Vercel redéploie automatiquement après modification des variables)
- [ ] Test de l'application sur https://logiclinic-mwy8.vercel.app/

---

## 🧪 Test de Connexion

Après le redéploiement, ouvrez la console du navigateur (F12) sur votre site Vercel et vérifiez :

### ✅ Messages de Succès Attendus :

```
✅ Connexion Supabase réussie!
```

### ❌ Messages d'Erreur à Vérifier :

Si vous voyez :
```
⚠️ L'application fonctionnera en mode limité. Configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
```

**Solution :** Vérifiez que les variables sont bien configurées sur Vercel et que vous avez redéployé.

---

## 🔒 Sécurité - Row Level Security (RLS)

Assurez-vous que vos politiques RLS sont correctement configurées sur Supabase pour permettre les opérations nécessaires :

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet : **bnfgemmlokvetmohiqch**
3. Allez dans **Authentication** → **Policies**
4. Vérifiez que les tables suivantes ont des politiques appropriées :
   - `patients`
   - `consultations`
   - `dossier_obstetrical`
   - `consultation_prenatale`
   - `medicaments`
   - `lots`
   - Etc.

---

## 🆘 Dépannage

### Problème : "Failed to fetch" lors de l'ajout de données

**Causes possibles :**
1. Variables d'environnement non configurées sur Vercel
2. RLS (Row Level Security) bloque les opérations
3. Token d'authentification expiré

**Solutions :**
1. Vérifiez les variables d'environnement sur Vercel
2. Vérifiez les politiques RLS sur Supabase
3. Déconnectez-vous et reconnectez-vous à l'application

### Problème : Les données ne s'affichent pas

**Causes possibles :**
1. Connexion Supabase échouée
2. Erreur dans les requêtes Supabase

**Solutions :**
1. Ouvrez la console du navigateur (F12) et vérifiez les erreurs
2. Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont correctes
3. Testez la connexion Supabase directement depuis la console :

```javascript
// Dans la console du navigateur
const supabaseUrl = 'https://bnfgemmlokvetmohiqch.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
// Testez une requête simple
```

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. Vérifiez les logs Vercel : **Deployments** → Sélectionnez un déploiement → **Logs**
2. Vérifiez les logs Supabase : **Logs** → **API Logs**
3. Vérifiez la console du navigateur pour les erreurs détaillées

---

## ✅ Résumé Rapide

**Pour résoudre votre problème immédiatement :**

1. Allez sur Vercel → Votre projet → **Settings** → **Environment Variables**
2. Ajoutez :
   - `VITE_SUPABASE_URL` = `https://bnfgemmlokvetmohiqch.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Sélectionnez **Production**, **Preview**, et **Development**
4. Sauvegardez (Vercel redéploie automatiquement)
5. Attendez 1-2 minutes et testez votre application

C'est tout ! 🎉




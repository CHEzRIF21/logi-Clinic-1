# 🚀 Guide Complet de Déploiement sur Vercel

## ✅ Checklist Pré-Déploiement

### 1. Variables d'Environnement ✅

Toutes les variables suivantes doivent être configurées dans Vercel :

#### Variables OBLIGATOIRES :

```env
VITE_API_URL=https://votre-backend.vercel.app/api
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-anon-key-ici
```

#### Variables OPTIONNELLES :

```env
VITE_STOCK_SUPABASE_URL=https://votre-projet-stock.supabase.co
VITE_STOCK_SUPABASE_ANON_KEY=votre-anon-key-stock-ici
NODE_ENV=production
```

### 2. Configuration Vercel ✅

Le fichier `vercel.json` est déjà configuré avec :
- ✅ Framework Vite détecté automatiquement
- ✅ Rewrites pour SPA (Single Page Application)
- ✅ Headers de sécurité
- ✅ Cache pour les fichiers statiques

### 3. Fichiers Statiques ✅

Tous les fichiers nécessaires sont présents :
- ✅ `public/manifest.json`
- ✅ `public/favicon.ico`
- ✅ `public/logo192.png`

## 📋 Étapes de Déploiement

### Étape 1 : Préparer le Repository

```bash
# Vérifier que tout est commité
git status

# S'assurer que les fichiers suivants sont présents :
# - vercel.json
# - package.json
# - vite.config.ts
# - public/manifest.json
# - public/favicon.ico
# - public/logo192.png
```

### Étape 2 : Connecter le Projet à Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez votre compte GitHub/GitLab/Bitbucket
3. Cliquez sur **"Add New Project"**
4. Importez votre repository

### Étape 3 : Configurer les Variables d'Environnement

Dans le dashboard Vercel, allez dans **Settings > Environment Variables** et ajoutez :

#### Pour Production :
```
VITE_API_URL = https://votre-backend.vercel.app/api
VITE_SUPABASE_URL = https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY = votre-anon-key-ici
NODE_ENV = production
```

#### Pour Preview (optionnel) :
```
VITE_API_URL = http://localhost:3000/api
VITE_SUPABASE_URL = https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY = votre-anon-key-ici
NODE_ENV = development
```

### Étape 4 : Configuration du Build

Vercel détectera automatiquement :
- ✅ Framework : Vite
- ✅ Build Command : `npm run build`
- ✅ Output Directory : `build`
- ✅ Install Command : `npm install`

**Aucune configuration supplémentaire nécessaire !**

### Étape 5 : Déployer

1. Cliquez sur **"Deploy"**
2. Attendez que le build se termine
3. Votre application sera disponible sur `https://votre-projet.vercel.app`

## 🔧 Configuration Avancée

### Variables d'Environnement par Environnement

Dans Vercel, vous pouvez définir des variables différentes pour :
- **Production** : Variables de production
- **Preview** : Variables de développement/staging
- **Development** : Variables locales

### Domaine Personnalisé

1. Allez dans **Settings > Domains**
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions pour configurer les DNS

### Headers de Sécurité

Les headers suivants sont déjà configurés dans `vercel.json` :
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: DENY`
- ✅ `X-XSS-Protection: 1; mode=block`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`

### Cache des Fichiers Statiques

Les fichiers statiques sont mis en cache pendant 1 an pour améliorer les performances.

## 🐛 Dépannage

### Erreur : "Build failed"

**Causes possibles :**
1. Variables d'environnement manquantes
2. Erreurs TypeScript
3. Dépendances manquantes

**Solution :**
```bash
# Tester le build localement
npm run build

# Vérifier les erreurs TypeScript
npx tsc --noEmit
```

### Erreur : "Failed to fetch" ou erreurs CORS

**Cause :** Le backend n'accepte pas les requêtes depuis Vercel

**Solution :** Ajoutez l'URL Vercel dans `CORS_ORIGIN` du backend :
```env
CORS_ORIGIN=https://votre-projet.vercel.app,https://votre-projet.vercel.app
```

### Erreur : "VITE_API_URL is not defined"

**Cause :** Variable d'environnement non configurée dans Vercel

**Solution :** Ajoutez `VITE_API_URL` dans Settings > Environment Variables

### Erreur : "Manifest fetch failed"

**Cause :** Fichier `manifest.json` manquant ou mal configuré

**Solution :** Vérifiez que `public/manifest.json` existe et est correct

## 📊 Optimisations Appliquées

### Build Optimisé
- ✅ Code splitting automatique
- ✅ Minification avec esbuild
- ✅ Sourcemaps désactivées en production
- ✅ Chunks optimisés par vendor

### Performance
- ✅ Lazy loading des routes
- ✅ Cache des fichiers statiques (1 an)
- ✅ Compression automatique par Vercel

## 🔒 Sécurité

### Variables d'Environnement
- ✅ Toutes les variables sensibles sont dans Vercel (pas dans le code)
- ✅ Les clés Supabase sont publiques (anon key) - c'est normal
- ⚠️ Ne jamais exposer les service role keys

### Headers de Sécurité
- ✅ Tous les headers de sécurité sont configurés
- ✅ Protection contre XSS, clickjacking, etc.

## ✅ Vérification Post-Déploiement

Après le déploiement, vérifiez :

1. **Page d'accueil charge correctement**
   - Ouvrez `https://votre-projet.vercel.app`
   - Vérifiez qu'il n'y a pas d'erreurs dans la console

2. **Connexion Supabase**
   - Ouvrez la console du navigateur (F12)
   - Vérifiez qu'il n'y a pas d'erreurs Supabase
   - Testez la connexion

3. **API Backend**
   - Vérifiez que les appels API fonctionnent
   - Vérifiez qu'il n'y a pas d'erreurs CORS

4. **Fichiers Statiques**
   - Vérifiez que `favicon.ico` charge
   - Vérifiez que `manifest.json` charge

## 📝 Notes Importantes

1. **Backend Séparé** : Ce déploiement est pour le frontend uniquement. Le backend doit être déployé séparément.

2. **Variables d'Environnement** : Toutes les variables `VITE_*` sont exposées au client. Ne mettez jamais de secrets dedans.

3. **Build Time** : Le build prend généralement 2-5 minutes sur Vercel.

4. **Déploiements Automatiques** : Vercel déploie automatiquement à chaque push sur la branche principale.

## 🎉 Prêt pour le Déploiement !

Votre application est maintenant prête à être déployée sur Vercel. Suivez les étapes ci-dessus et votre application sera en ligne en quelques minutes !


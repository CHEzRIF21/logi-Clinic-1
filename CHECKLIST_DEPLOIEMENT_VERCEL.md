# ✅ Checklist de Déploiement Vercel - Logi Clinic

## 📋 Avant le Déploiement

### 1. Code et Configuration ✅

- [x] ✅ Fichier `vercel.json` configuré
- [x] ✅ Fichier `vite.config.ts` optimisé
- [x] ✅ Fichier `package.json` avec scripts de build
- [x] ✅ Fichier `.env.example` créé
- [x] ✅ Fichiers statiques présents (`manifest.json`, `favicon.ico`, `logo192.png`)
- [x] ✅ Build testé localement (`npm run build` fonctionne)

### 2. Variables d'Environnement à Configurer dans Vercel

#### ⚠️ OBLIGATOIRE - À configurer dans Vercel Dashboard :

- [ ] `VITE_API_URL` = URL de votre backend (ex: `https://votre-backend.vercel.app/api`)
- [ ] `VITE_SUPABASE_URL` = URL de votre projet Supabase
- [ ] `VITE_SUPABASE_ANON_KEY` = Clé anonyme Supabase

#### 📝 OPTIONNEL :

- [ ] `VITE_STOCK_SUPABASE_URL` = Si vous utilisez un projet Supabase séparé pour le stock
- [ ] `VITE_STOCK_SUPABASE_ANON_KEY` = Clé anonyme pour le projet stock
- [ ] `NODE_ENV` = `production`

### 3. Backend Configuration

- [ ] Backend déployé et accessible
- [ ] CORS configuré pour accepter les requêtes depuis Vercel
  - Ajoutez votre URL Vercel dans `CORS_ORIGIN` du backend
  - Exemple : `CORS_ORIGIN=https://votre-projet.vercel.app`

### 4. Supabase Configuration

- [ ] Projet Supabase actif
- [ ] Migrations appliquées
- [ ] RLS (Row Level Security) configuré
- [ ] Buckets Storage configurés si nécessaire

## 🚀 Étapes de Déploiement

### Étape 1 : Préparer le Repository

```bash
# Vérifier que tout est commité
git status

# S'assurer que les fichiers suivants sont présents :
# ✅ vercel.json
# ✅ package.json
# ✅ vite.config.ts
# ✅ public/manifest.json
# ✅ public/favicon.ico
# ✅ public/logo192.png
```

### Étape 2 : Connecter à Vercel

1. [ ] Aller sur [vercel.com](https://vercel.com)
2. [ ] Se connecter avec GitHub/GitLab/Bitbucket
3. [ ] Cliquer sur "Add New Project"
4. [ ] Importer le repository

### Étape 3 : Configurer les Variables d'Environnement

Dans Vercel Dashboard > Settings > Environment Variables :

1. [ ] Ajouter `VITE_API_URL` (Production)
2. [ ] Ajouter `VITE_SUPABASE_URL` (Production)
3. [ ] Ajouter `VITE_SUPABASE_ANON_KEY` (Production)
4. [ ] (Optionnel) Ajouter les variables pour Preview/Development

### Étape 4 : Déployer

1. [ ] Cliquer sur "Deploy"
2. [ ] Attendre la fin du build
3. [ ] Vérifier qu'il n'y a pas d'erreurs

## ✅ Vérification Post-Déploiement

### Tests à Effectuer

- [ ] **Page d'accueil charge**
  - Ouvrir `https://votre-projet.vercel.app`
  - Vérifier qu'il n'y a pas d'erreurs dans la console (F12)

- [ ] **Connexion Supabase**
  - Ouvrir la console du navigateur
  - Vérifier qu'il n'y a pas d'erreurs Supabase
  - Message "✅ Connexion Supabase réussie!" devrait apparaître

- [ ] **Fichiers Statiques**
  - Vérifier que `favicon.ico` charge (onglet du navigateur)
  - Vérifier que `manifest.json` est accessible
  - Vérifier que `logo192.png` charge

- [ ] **API Backend**
  - Tester une fonctionnalité qui appelle l'API
  - Vérifier qu'il n'y a pas d'erreurs CORS
  - Vérifier que les données se chargent correctement

- [ ] **Routes de l'Application**
  - Tester la navigation entre les pages
  - Vérifier que toutes les routes fonctionnent
  - Vérifier qu'il n'y a pas d'erreurs 404

## 🐛 Problèmes Courants et Solutions

### ❌ Erreur : "Build failed"

**Vérifications :**
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Build fonctionne localement (`npm run build`)
- [ ] Pas d'erreurs TypeScript (`npx tsc --noEmit`)

### ❌ Erreur : "VITE_API_URL is not defined"

**Solution :**
- [ ] Ajouter `VITE_API_URL` dans Vercel > Settings > Environment Variables
- [ ] Redéployer après avoir ajouté la variable

### ❌ Erreur : "Failed to fetch" ou CORS

**Solution :**
- [ ] Vérifier que le backend est déployé et accessible
- [ ] Ajouter l'URL Vercel dans `CORS_ORIGIN` du backend
- [ ] Redémarrer le backend après modification

### ❌ Erreur : "Manifest fetch failed"

**Solution :**
- [ ] Vérifier que `public/manifest.json` existe
- [ ] Vérifier que le fichier est bien dans le repository
- [ ] Vérifier la configuration dans `vercel.json`

## 📊 Optimisations Appliquées

- ✅ Code splitting automatique
- ✅ Minification avec esbuild
- ✅ Sourcemaps désactivées en production
- ✅ Chunks optimisés par vendor
- ✅ Cache des fichiers statiques (1 an)
- ✅ Headers de sécurité configurés

## 📝 Notes Importantes

1. **Backend Séparé** : Le backend doit être déployé séparément (pas sur Vercel pour ce projet)

2. **Variables d'Environnement** : Toutes les variables `VITE_*` sont exposées au client. Ne jamais mettre de secrets.

3. **Déploiements Automatiques** : Vercel déploie automatiquement à chaque push sur la branche principale.

4. **Build Time** : Le build prend généralement 2-5 minutes.

## 🎉 Prêt !

Une fois toutes les cases cochées, votre application est prête pour la production !

**Guide détaillé :** Voir `GUIDE_DEPLOIEMENT_VERCEL_COMPLET.md`


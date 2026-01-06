# ✅ Checklist de Déploiement Vercel - Logi Clinic

## 📋 Checklist Complète

Utilisez cette checklist pour suivre chaque étape du déploiement.

---

## 🗑️ ÉTAPE 1 : Nettoyer le projet existant

- [ ] Aller sur https://vercel.com/dashboard
- [ ] Sélectionner le projet `logi-clinic-2` (ou projet actuel)
- [ ] Settings → General → Delete Project
- [ ] Confirmer la suppression

**Note :** Cette étape est optionnelle mais recommandée.

---

## 🆕 ÉTAPE 2 : Créer un nouveau projet Vercel

- [ ] Aller sur https://vercel.com/dashboard
- [ ] Cliquer sur "Add New" → "Project"
- [ ] Importer depuis Git OU utiliser Vercel CLI
- [ ] Vérifier la configuration automatique :
  - [ ] Framework : Vite (détecté automatiquement)
  - [ ] Root Directory : `./` (racine)
  - [ ] Build Command : `npm run build` (déjà dans vercel.json)
  - [ ] Output Directory : `build` (déjà dans vercel.json)

**✅ Vérification :** Le fichier `vercel.json` contient déjà toute la configuration.

---

## 🔐 ÉTAPE 3 : Configurer les variables d'environnement

### Variable 1 : VITE_API_URL

- [ ] Aller dans Settings → Environment Variables
- [ ] Cliquer sur "Add New"
- [ ] Nom : `VITE_API_URL`
- [ ] Valeur : `https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api`
- [ ] Cocher ✅ Production
- [ ] Cocher ✅ Preview
- [ ] Cocher ✅ Development
- [ ] Cliquer sur "Save"

### Variable 2 : VITE_SUPABASE_URL

- [ ] Cliquer sur "Add New"
- [ ] Nom : `VITE_SUPABASE_URL`
- [ ] Valeur : `https://bnfgemmlokvetmohiqch.supabase.co`
- [ ] Cocher ✅ Production
- [ ] Cocher ✅ Preview
- [ ] Cocher ✅ Development
- [ ] Cliquer sur "Save"

### Variable 3 : VITE_SUPABASE_ANON_KEY

- [ ] Cliquer sur "Add New"
- [ ] Nom : `VITE_SUPABASE_ANON_KEY`
- [ ] Valeur : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8`
- [ ] Cocher ✅ Production
- [ ] Cocher ✅ Preview
- [ ] Cocher ✅ Development
- [ ] Cliquer sur "Save"

### Vérification finale des variables

- [ ] Vérifier que les 3 variables sont dans la liste
- [ ] Vérifier que chaque variable a les 3 environnements cochés
- [ ] Vérifier qu'il n'y a pas d'espaces avant/après les valeurs

**📝 Référence :** Voir `VERCEL_ENV_VARIABLES_EXACTES.txt` pour les valeurs exactes.

---

## 🌐 ÉTAPE 4 : Configurer le domaine logiclinic.org

### 4.1 Ajouter le domaine sur Vercel

- [ ] Aller dans Settings → Domains
- [ ] Cliquer sur "Add Domain"
- [ ] Entrer : `logiclinic.org`
- [ ] Cliquer sur "Add"

### 4.2 Configurer les enregistrements DNS

- [ ] Aller sur le site de votre registrar (ex: Namecheap, GoDaddy, OVH)
- [ ] Trouver la section DNS Management / Zone DNS
- [ ] Ajouter les enregistrements fournis par Vercel :
  - [ ] Type CNAME : `@` → `cname.vercel-dns.com` (ou A Records si CNAME non supporté)
  - [ ] Optionnel : Type CNAME : `www` → `cname.vercel-dns.com`
- [ ] Sauvegarder les modifications

### 4.3 Vérifier la propagation DNS

- [ ] Attendre 5-30 minutes (peut prendre jusqu'à 48h)
- [ ] Vérifier avec https://dnschecker.org
- [ ] Vérifier que Vercel affiche "Valid Configuration"

---

## 🏗️ ÉTAPE 5 : Vérifier la configuration locale (optionnel mais recommandé)

- [ ] Installer les dépendances : `npm install`
- [ ] Tester le build local : `npm run build`
- [ ] Vérifier qu'il n'y a pas d'erreurs
- [ ] Vérifier que le dossier `build/` est créé

**✅ Si erreurs :** Corriger les erreurs avant de déployer.

---

## 🚀 ÉTAPE 6 : Premier déploiement

### 6.1 Déployer

- [ ] Si connecté à Git : Push sur la branche principale (déploiement automatique)
- [ ] OU : Aller dans Deployments → Redeploy
- [ ] OU : Utiliser Vercel CLI : `vercel --prod`

### 6.2 Vérifier les logs de build

- [ ] Aller dans Deployments → Sélectionner le déploiement
- [ ] Cliquer sur "Build Logs"
- [ ] Vérifier :
  - [ ] ✅ "Installing dependencies" - Succès
  - [ ] ✅ "Running build command" - Succès
  - [ ] ✅ "Build completed successfully"
  - [ ] ❌ Pas d'erreurs TypeScript
  - [ ] ❌ Pas d'erreurs de dépendances

---

## 🧪 ÉTAPE 7 : Tester l'application

### 7.1 Tests de base

- [ ] Ouvrir l'application :
  - [ ] URL Vercel : `https://votre-projet.vercel.app`
  - [ ] OU domaine : `https://logiclinic.org` (après propagation DNS)
- [ ] Vérifier que la page se charge (pas de page blanche)
- [ ] Ouvrir la console du navigateur (F12)
- [ ] Vérifier qu'il n'y a **pas d'erreurs rouges**

### 7.2 Tests fonctionnels

- [ ] Vérifier la connexion Supabase (pas d'erreur dans la console)
- [ ] Tester un appel API (si possible)
- [ ] Vérifier que les données se chargent

### 7.3 Erreurs courantes à vérifier

- [ ] ❌ Pas d'erreur : `VITE_API_URL is not defined`
- [ ] ❌ Pas d'erreur : `Failed to fetch` ou `Network error`
- [ ] ❌ Pas d'erreur : `CORS policy`
- [ ] ❌ Pas d'erreur : `Supabase connection failed`

---

## 🔧 ÉTAPE 8 : Résolution des problèmes (si nécessaire)

### Si page blanche :

- [ ] Vérifier les variables d'environnement sur Vercel
- [ ] Vérifier les logs de build Vercel
- [ ] Vérifier la console du navigateur (F12)
- [ ] Redéployer après correction

### Si erreur de build :

- [ ] Tester le build localement : `npm run build`
- [ ] Corriger les erreurs localement
- [ ] Redéployer

### Si variables non prises en compte :

- [ ] **Redéployer** après avoir ajouté/modifié des variables
- [ ] Vérifier que les variables commencent par `VITE_`
- [ ] Vérifier que les variables sont cochées pour Production/Preview/Development
- [ ] Vérifier qu'il n'y a pas d'espaces avant/après les valeurs

### Si DNS ne se propage pas :

- [ ] Vérifier les enregistrements DNS chez le registrar
- [ ] Attendre la propagation (peut prendre jusqu'à 48h)
- [ ] Vérifier avec https://dnschecker.org

---

## ✅ CHECKLIST FINALE

### Configuration Vercel
- [ ] Projet Vercel créé
- [ ] Variables `VITE_API_URL` configurée (Production, Preview, Development)
- [ ] Variables `VITE_SUPABASE_URL` configurée (Production, Preview, Development)
- [ ] Variables `VITE_SUPABASE_ANON_KEY` configurée (Production, Preview, Development)
- [ ] Domaine `logiclinic.org` ajouté dans Settings → Domains
- [ ] Enregistrements DNS configurés chez le registrar
- [ ] DNS propagé (vérifié avec dnschecker.org)

### Build et Déploiement
- [ ] Build local réussi (`npm run build`) - Optionnel mais recommandé
- [ ] Build Vercel réussi (vérifié dans les logs)
- [ ] Pas d'erreurs dans les logs de build

### Application
- [ ] Application accessible sur `https://logiclinic.org` (ou URL Vercel)
- [ ] Page se charge (pas de page blanche)
- [ ] Pas d'erreurs dans la console du navigateur (F12)
- [ ] Connexion Supabase fonctionne
- [ ] Appels API fonctionnent (si testés)

---

## 📝 NOTES IMPORTANTES

1. **Redéploiement requis** : Après chaque modification de variables d'environnement, il faut redéployer
2. **Variables VITE_** : Seules les variables commençant par `VITE_` sont accessibles dans le frontend
3. **Build local** : Toujours tester le build localement avant de déployer : `npm run build`
4. **Logs** : Consulter les logs Vercel en cas de problème
5. **DNS** : La propagation DNS peut prendre jusqu'à 48h (généralement quelques minutes)

---

## 📚 FICHIERS DE RÉFÉRENCE

- `REINITIALISATION_VERCEL_COMPLETE.md` : Guide complet et détaillé
- `VERCEL_ENV_VARIABLES_EXACTES.txt` : Variables exactes à copier-coller
- `vercel.json` : Configuration Vercel
- `package.json` : Scripts et dépendances
- `vite.config.ts` : Configuration Vite

---

**Date de création :** 2025-01-XX  
**Projet :** Logi Clinic  
**Domaine :** logiclinic.org


# 🔄 Réinitialisation Complète du Déploiement Vercel - Logi Clinic

## 📋 Vue d'ensemble

Ce document contient **TOUTES** les informations exactes nécessaires pour réinitialiser complètement le déploiement Vercel et configurer l'application sur `logiclinic.org`.

---

## 🗑️ ÉTAPE 1 : Nettoyer le projet Vercel existant

### Actions à effectuer manuellement :

1. Aller sur **https://vercel.com/dashboard**
2. Sélectionner le projet **logi-clinic-2** (ou le projet actuel qui échoue)
3. Aller dans **Settings** → **General**
4. Scroller jusqu'en bas
5. Cliquer sur **Delete Project**
6. Confirmer la suppression

**⚠️ Note :** Cette étape est optionnelle mais recommandée pour repartir sur une base propre.

---

## 🆕 ÉTAPE 2 : Créer un nouveau projet Vercel

### 2.1 Créer le projet

1. Aller sur **https://vercel.com/dashboard**
2. Cliquer sur **"Add New"** → **"Project"**
3. **Option A :** Si votre code est sur Git (GitHub/GitLab/Bitbucket)
   - Importer depuis votre repository
   - Sélectionner le repository
   - Vercel détectera automatiquement la configuration
   
4. **Option B :** Si vous n'utilisez pas Git
   - Utiliser Vercel CLI : `vercel` dans le terminal
   - Ou uploader le dossier via l'interface web

### 2.2 Configuration du projet

Vercel devrait détecter automatiquement la configuration depuis `vercel.json`, mais vérifiez :

- **Framework Preset** : `Vite` (détecté automatiquement)
- **Root Directory** : `./` (racine du projet)
- **Build Command** : `npm run build` (déjà dans `vercel.json`)
- **Output Directory** : `build` (déjà dans `vercel.json`)
- **Install Command** : `npm install` (par défaut)

**✅ Vérification :** Le fichier `vercel.json` à la racine contient déjà toute la configuration nécessaire.

---

## 🔐 ÉTAPE 3 : Configurer les variables d'environnement Frontend

### ⚠️ CRITIQUE : Ces variables sont OBLIGATOIRES

Dans le projet Vercel, aller dans **Settings** → **Environment Variables** et ajouter **EXACTEMENT** ces 3 variables :

### Variable 1 : VITE_API_URL

```
Nom : VITE_API_URL
Valeur : https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api
Environnements : ✅ Production, ✅ Preview, ✅ Development
```

**Action :**
1. Cliquer sur **"Add New"**
2. Entrer le nom : `VITE_API_URL`
3. Entrer la valeur : `https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api`
4. Cocher **Production**, **Preview**, et **Development**
5. Cliquer sur **Save**

### Variable 2 : VITE_SUPABASE_URL

```
Nom : VITE_SUPABASE_URL
Valeur : https://bnfgemmlokvetmohiqch.supabase.co
Environnements : ✅ Production, ✅ Preview, ✅ Development
```

**Action :**
1. Cliquer sur **"Add New"**
2. Entrer le nom : `VITE_SUPABASE_URL`
3. Entrer la valeur : `https://bnfgemmlokvetmohiqch.supabase.co`
4. Cocher **Production**, **Preview**, et **Development**
5. Cliquer sur **Save**

### Variable 3 : VITE_SUPABASE_ANON_KEY

```
Nom : VITE_SUPABASE_ANON_KEY
Valeur : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8
Environnements : ✅ Production, ✅ Preview, ✅ Development
```

**Action :**
1. Cliquer sur **"Add New"**
2. Entrer le nom : `VITE_SUPABASE_ANON_KEY`
3. Entrer la valeur : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8`
4. Cocher **Production**, **Preview**, et **Development**
5. Cliquer sur **Save**

### ✅ Vérification des variables

Après avoir ajouté les 3 variables, vous devriez voir dans la liste :

- ✅ `VITE_API_URL` (Production, Preview, Development)
- ✅ `VITE_SUPABASE_URL` (Production, Preview, Development)
- ✅ `VITE_SUPABASE_ANON_KEY` (Production, Preview, Development)

**⚠️ IMPORTANT :**
- Les variables doivent **commencer par `VITE_`** pour être accessibles dans le frontend
- **Cocher les 3 environnements** (Production, Preview, Development) pour chaque variable
- **Pas d'espaces** avant ou après les valeurs
- **Redéployer** après avoir ajouté/modifié des variables

---

## 🌐 ÉTAPE 4 : Configurer le domaine personnalisé logiclinic.org

### 4.1 Ajouter le domaine sur Vercel

1. Dans le projet Vercel, aller dans **Settings** → **Domains**
2. Cliquer sur **"Add Domain"**
3. Entrer : `logiclinic.org`
4. Cliquer sur **"Add"**

### 4.2 Configurer les enregistrements DNS

Vercel affichera les instructions DNS spécifiques. Voici les options courantes :

#### Option A : Configuration avec CNAME (Recommandé pour la plupart des registrars)

```
Type : CNAME
Name : @ (ou laisser vide, ou logiclinic.org selon votre registrar)
Value : cname.vercel-dns.com
TTL : 3600 (ou Auto)
```

#### Option B : Configuration avec A Records (Si CNAME n'est pas supporté)

Vercel fournira 4 adresses IP. Ajouter 4 enregistrements A :

```
Type : A
Name : @ (ou laisser vide)
Value : [IP 1 fournie par Vercel]
TTL : 3600

Type : A
Name : @
Value : [IP 2 fournie par Vercel]
TTL : 3600

Type : A
Name : @
Value : [IP 3 fournie par Vercel]
TTL : 3600

Type : A
Name : @
Value : [IP 4 fournie par Vercel]
TTL : 3600
```

#### Option C : Configuration avec www (Optionnel)

Si vous voulez aussi `www.logiclinic.org` :

```
Type : CNAME
Name : www
Value : cname.vercel-dns.com
TTL : 3600
```

### 4.3 Où configurer les DNS ?

1. Aller sur le site de votre registrar (ex: Namecheap, GoDaddy, OVH, etc.)
2. Trouver la section **DNS Management** ou **Zone DNS**
3. Ajouter les enregistrements fournis par Vercel
4. Sauvegarder les modifications

### 4.4 Vérifier la propagation DNS

**Attendre 5-30 minutes** (peut prendre jusqu'à 48h, généralement quelques minutes).

**Vérification :**

1. **Via Vercel :** Le statut passera à **"Valid Configuration"** une fois la propagation terminée
2. **Via ligne de commande :**
   ```bash
   nslookup logiclinic.org
   ```
3. **Via outil en ligne :** https://dnschecker.org
   - Entrer `logiclinic.org`
   - Vérifier que les enregistrements pointent vers Vercel

---

## 🏗️ ÉTAPE 5 : Vérifier la configuration du build (LOCAL)

### 5.1 Vérifier que le build fonctionne localement

**Avant de déployer, tester le build localement :**

```bash
# Installer les dépendances si nécessaire
npm install

# Tester le build
npm run build
```

**✅ Résultat attendu :**
- Pas d'erreurs TypeScript
- Le dossier `build/` est créé avec les fichiers compilés
- Pas d'erreurs de build

**❌ Si erreurs :**
- Corriger les erreurs TypeScript
- Vérifier que toutes les dépendances sont installées
- Vérifier `package.json` et `tsconfig.json`

### 5.2 Vérifier les fichiers de configuration

**Fichiers à vérifier :**

1. **`vercel.json`** (à la racine)
   - ✅ Build command : `npm run build`
   - ✅ Output directory : `build`
   - ✅ Framework : `vite`

2. **`package.json`** (à la racine)
   - ✅ Script `build` : `tsc && vite build`

3. **`vite.config.ts`** (à la racine)
   - ✅ Output directory : `build`

---

## 🚀 ÉTAPE 6 : Premier déploiement

### 6.1 Déployer le projet

**Option A : Déploiement automatique (si connecté à Git)**
- Push sur votre branche principale déclenchera automatiquement un déploiement
- Vercel détectera les changements et déploiera

**Option B : Déploiement manuel**
1. Dans le dashboard Vercel, aller dans **Deployments**
2. Cliquer sur **"Redeploy"** sur le dernier déploiement
3. Ou utiliser Vercel CLI : `vercel --prod`

### 6.2 Vérifier les logs de build

1. Aller dans **Deployments** → Sélectionner le déploiement en cours
2. Cliquer sur **"Build Logs"** ou **"View Function Logs"**
3. Vérifier :

**✅ Succès attendu :**
```
✓ Installing dependencies
✓ Running build command
✓ Build completed successfully
```

**❌ Erreurs courantes :**
- `VITE_API_URL is not defined` → Variables d'environnement non configurées
- `Module not found` → Dépendances manquantes
- `TypeScript errors` → Erreurs de compilation TypeScript

### 6.3 Vérifier que les variables sont injectées

Dans les logs de build, vous devriez voir (en mode développement) :
```
🔗 API URL configurée: https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api
```

**Note :** En production, ces logs peuvent ne pas apparaître, mais les variables seront utilisées.

---

## 🧪 ÉTAPE 7 : Tester l'application

### 7.1 Tests de base

1. **Ouvrir l'application :**
   - URL Vercel temporaire : `https://votre-projet.vercel.app`
   - Ou domaine personnalisé : `https://logiclinic.org` (après propagation DNS)

2. **Vérifier que la page se charge :**
   - ✅ La page ne doit pas être blanche
   - ✅ L'interface doit s'afficher
   - ✅ Pas d'erreur 404 ou 500

3. **Ouvrir la console du navigateur (F12) :**
   - Onglet **Console**
   - Vérifier qu'il n'y a **pas d'erreurs rouges**

### 7.2 Erreurs courantes à vérifier

**❌ Erreur : `VITE_API_URL is not defined`**
- **Cause :** Variables d'environnement non configurées
- **Solution :** Vérifier que les 3 variables sont bien ajoutées sur Vercel et redéployer

**❌ Erreur : `Failed to fetch` ou `Network error`**
- **Cause :** Problème de connexion à l'API
- **Solution :** Vérifier que `VITE_API_URL` est correcte et que l'API Supabase est accessible

**❌ Erreur : `CORS policy`**
- **Cause :** Problème de configuration CORS (normalement géré par Supabase)
- **Solution :** Vérifier la configuration Supabase

**❌ Erreur : `Supabase connection failed`**
- **Cause :** Variables Supabase incorrectes
- **Solution :** Vérifier `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`

### 7.3 Tests fonctionnels

1. **Tester la connexion Supabase :**
   - Ouvrir la console du navigateur
   - Vérifier qu'il n'y a pas d'erreur de connexion Supabase
   - Un message de succès peut apparaître : `✅ Connexion Supabase réussie!`

2. **Tester un appel API (si possible) :**
   - Essayer de se connecter ou de charger des données
   - Vérifier dans l'onglet **Network** (F12) que les requêtes API fonctionnent

---

## 🔧 ÉTAPE 8 : Résolution des problèmes

### Problème 1 : Page blanche

**Symptômes :**
- La page se charge mais reste blanche
- Pas d'erreur visible dans la console

**Solutions :**

1. **Vérifier les variables d'environnement :**
   - Aller dans Vercel → Settings → Environment Variables
   - Vérifier que les 3 variables sont présentes
   - Vérifier qu'elles sont cochées pour Production

2. **Vérifier les logs de build :**
   - Aller dans Deployments → Build Logs
   - Chercher les erreurs de build

3. **Vérifier la console du navigateur :**
   - Ouvrir F12 → Console
   - Chercher les erreurs JavaScript

4. **Redéployer :**
   - Après avoir corrigé les variables, redéployer

### Problème 2 : Erreur de build

**Symptômes :**
- Le déploiement échoue avec une erreur de build
- Les logs montrent des erreurs TypeScript ou de dépendances

**Solutions :**

1. **Tester le build localement :**
   ```bash
   npm install
   npm run build
   ```
   - Corriger les erreurs localement
   - Puis redéployer

2. **Vérifier les dépendances :**
   - Vérifier que `package.json` contient toutes les dépendances
   - Vérifier `package-lock.json` est à jour

3. **Vérifier TypeScript :**
   - Corriger les erreurs TypeScript
   - Vérifier `tsconfig.json`

### Problème 3 : Variables non prises en compte

**Symptômes :**
- Les variables sont configurées mais l'application ne les utilise pas
- Erreur `VITE_API_URL is not defined` même après configuration

**Solutions :**

1. **Redéployer après modification :**
   - ⚠️ **CRITIQUE :** Vercel ne prend en compte les nouvelles variables qu'après un redéploiement
   - Aller dans Deployments → Redeploy

2. **Vérifier le préfixe `VITE_` :**
   - Les variables frontend doivent commencer par `VITE_`
   - Vérifier qu'il n'y a pas de faute de frappe

3. **Vérifier les environnements :**
   - Cocher Production, Preview, et Development
   - Vérifier que vous testez sur l'environnement correct

4. **Vérifier les espaces :**
   - Pas d'espaces avant ou après les valeurs
   - Copier-coller exactement les valeurs fournies

### Problème 4 : DNS ne se propage pas

**Symptômes :**
- Le domaine est configuré mais ne fonctionne pas
- Vercel affiche "Invalid Configuration"

**Solutions :**

1. **Vérifier les enregistrements DNS :**
   - Aller sur votre registrar
   - Vérifier que les enregistrements sont corrects
   - Vérifier qu'il n'y a pas de conflit (anciens enregistrements)

2. **Attendre la propagation :**
   - Peut prendre jusqu'à 48h (généralement 5-30 minutes)
   - Utiliser https://dnschecker.org pour vérifier

3. **Vérifier avec Vercel :**
   - Vercel affichera "Valid Configuration" une fois que c'est bon

---

## ✅ CHECKLIST FINALE

Avant de considérer le déploiement comme terminé, vérifier :

### Configuration Vercel
- [ ] Projet Vercel créé
- [ ] Variables `VITE_API_URL` configurée (Production, Preview, Development)
- [ ] Variables `VITE_SUPABASE_URL` configurée (Production, Preview, Development)
- [ ] Variables `VITE_SUPABASE_ANON_KEY` configurée (Production, Preview, Development)
- [ ] Domaine `logiclinic.org` ajouté dans Settings → Domains
- [ ] Enregistrements DNS configurés chez le registrar
- [ ] DNS propagé (vérifié avec dnschecker.org)

### Build et Déploiement
- [ ] Build local réussi (`npm run build`)
- [ ] Build Vercel réussi (vérifié dans les logs)
- [ ] Pas d'erreurs dans les logs de build

### Application
- [ ] Application accessible sur `https://logiclinic.org` (ou URL Vercel)
- [ ] Page se charge (pas de page blanche)
- [ ] Pas d'erreurs dans la console du navigateur (F12)
- [ ] Connexion Supabase fonctionne
- [ ] Appels API fonctionnent (si testés)

---

## 📝 RÉSUMÉ DES VARIABLES D'ENVIRONNEMENT

### Variables Frontend (Vercel)

```env
VITE_API_URL=https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api
VITE_SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8
```

**⚠️ IMPORTANT :**
- Ces variables doivent être configurées dans **Settings → Environment Variables** sur Vercel
- Cocher **Production**, **Preview**, et **Development** pour chaque variable
- **Redéployer** après avoir ajouté/modifié des variables

---

## 🔗 LIENS UTILES

- **Dashboard Vercel :** https://vercel.com/dashboard
- **Documentation Vercel :** https://vercel.com/docs
- **Vérification DNS :** https://dnschecker.org
- **Supabase Dashboard :** https://app.supabase.com

---

## 📞 SUPPORT

Si vous rencontrez des problèmes :

1. Vérifier les logs Vercel (Deployments → Build Logs)
2. Vérifier la console du navigateur (F12)
3. Vérifier que toutes les variables sont correctement configurées
4. Consulter la section "Résolution des problèmes" ci-dessus

**Email technique :** tech@logiclinic.org

---

**Version :** 1.0  
**Date :** 2025-01-XX  
**Projet :** Logi Clinic  
**Domaine :** logiclinic.org



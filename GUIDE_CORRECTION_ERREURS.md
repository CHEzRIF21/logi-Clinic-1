# 🔧 Guide de Correction des Erreurs "Failed to fetch"

## 📋 Problèmes Identifiés

1. **Erreur "Failed to fetch" à l'inscription** - Le backend n'est pas accessible
2. **Erreur lors du chargement des patients** - Configuration Supabase manquante ou incorrecte
3. **Backend non connecté à Supabase** - Le backend utilise une base de données locale

## ✅ Solutions Appliquées

### 1. Amélioration de la Gestion d'Erreur

#### Frontend - PatientSearchAdvanced.tsx
- ✅ Ajout d'un état d'erreur pour afficher les messages à l'utilisateur
- ✅ Gestion spécifique de l'erreur "Failed to fetch"
- ✅ Affichage d'un message d'erreur clair dans l'interface

#### Frontend - Login.tsx (Inscription)
- ✅ Gestion améliorée de l'erreur "Failed to fetch"
- ✅ Message d'erreur indiquant l'URL du backend à vérifier
- ✅ Correction du port par défaut (3000 au lieu de 5000)

### 2. Configuration Requise

## 🚀 Configuration du Frontend

### Étape 1: Créer le fichier `.env` à la racine

Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```env
# Configuration API Backend
VITE_API_URL=http://localhost:3000/api

# Configuration Supabase (OBLIGATOIRE)
VITE_SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
VITE_SUPABASE_ANON_KEY=VOTRE_CLE_ANON_ICI
```

**Comment obtenir la clé Supabase :**
1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet : **bnfgemmlokvetmohiqch**
3. Allez dans **Settings** → **API**
4. Copiez la clé **`anon` `public`** (elle commence par `eyJhbGci...`)

### Étape 2: Redémarrer l'application frontend

```bash
npm run dev
```

## 🔧 Configuration du Backend pour Supabase

### Étape 1: Obtenir la DATABASE_URL depuis Supabase

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet : **bnfgemmlokvetmohiqch**
3. Allez dans **Settings** → **Database**
4. Dans la section **Connection string**, sélectionnez l'onglet **"Connection pooling"**
5. Copiez la chaîne de connexion (elle ressemble à) :

```
postgresql://postgres.bnfgemmlokvetmohiqch:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Important :** Remplacez `[PASSWORD]` par votre mot de passe de base de données (visible dans Settings > Database).

### Étape 2: Créer le fichier `.env` dans `server/`

Créez un fichier `.env` dans le dossier `server/` avec le contenu suivant :

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres.bnfgemmlokvetmohiqch:[VOTRE_MOT_DE_PASSE]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=public"
JWT_SECRET="logi_clinic_secret_key_2024_secure"
CORS_ORIGIN="http://localhost:5173"

# Speech to Text Configuration
SPEECH_TO_TEXT_API_KEY="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"
SPEECH_TO_TEXT_PROVIDER="openai"
```

**Remplacez `[VOTRE_MOT_DE_PASSE]` par votre vrai mot de passe !**

### Étape 3: Générer le Client Prisma

```bash
cd server
npm run generate
```

### Étape 4: Démarrer le Backend

```bash
cd server
npm run dev
```

Le backend devrait démarrer sur `http://localhost:3000`

## ✅ Vérifications

### Frontend
1. Ouvrez la console du navigateur (F12)
2. Vérifiez qu'il n'y a pas d'erreur "Configuration Supabase non valide"
3. Vous devriez voir : "✅ Connexion Supabase réussie!"

### Backend
1. Vérifiez que le serveur démarre sans erreur
2. Testez l'endpoint : `http://localhost:3000/health`
3. Vous devriez recevoir : `{"status":"ok","timestamp":"..."}`

### Test de l'Inscription
1. Allez sur la page d'inscription
2. Remplissez le formulaire
3. Si le backend n'est pas démarré, vous verrez un message clair indiquant l'URL à vérifier

### Test du Chargement des Patients
1. Allez sur une page qui charge les patients
2. Si Supabase n'est pas configuré, vous verrez un message d'erreur clair
3. Si tout est configuré, les patients devraient se charger correctement

## 🆘 Dépannage

### Erreur : "Failed to fetch" à l'inscription

**Causes possibles :**
1. Le backend n'est pas démarré
2. Le backend n'écoute pas sur le bon port (vérifiez `VITE_API_URL`)
3. Problème de CORS (vérifiez `CORS_ORIGIN` dans le backend)

**Solutions :**
1. Vérifiez que le backend est démarré : `cd server && npm run dev`
2. Vérifiez que `VITE_API_URL` dans `.env` correspond au port du backend
3. Vérifiez que `CORS_ORIGIN` dans `server/.env` correspond à l'URL du frontend

### Erreur : "Failed to fetch" lors du chargement des patients

**Causes possibles :**
1. Configuration Supabase manquante ou incorrecte
2. Projet Supabase inactif
3. Clé API incorrecte

**Solutions :**
1. Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont définis dans `.env`
2. Vérifiez que le projet Supabase est actif sur https://app.supabase.com
3. Vérifiez que la clé API est la clé `anon` `public` (pas `service_role`)

### Erreur : "Can't reach database server" (Backend)

**Causes possibles :**
1. `DATABASE_URL` incorrecte
2. Mot de passe incorrect
3. Projet Supabase inactif

**Solutions :**
1. Vérifiez que `DATABASE_URL` dans `server/.env` est correcte
2. Vérifiez que le mot de passe est correct
3. Vérifiez que le projet Supabase est actif

## 📝 Notes Importantes

- ⚠️ **Ne commitez JAMAIS** les fichiers `.env` dans Git (ils sont déjà dans `.gitignore`)
- 🔑 **Utilisez toujours la clé `anon` `public`** pour le frontend (jamais `service_role`)
- 🔒 **Pour le backend**, utilisez la connection string avec pooling pour de meilleures performances
- 🌐 **En production**, changez `JWT_SECRET` et toutes les clés API

## 🎯 Prochaines Étapes

1. ✅ Créer le fichier `.env` à la racine avec les variables Supabase
2. ✅ Créer le fichier `server/.env` avec la `DATABASE_URL` Supabase
3. ✅ Démarrer le backend : `cd server && npm run dev`
4. ✅ Démarrer le frontend : `npm run dev`
5. ✅ Tester l'inscription et le chargement des patients



# 🔧 Configuration Complète Logi Clinic - Frontend + Backend + Supabase

## 🚀 Corrections Appliquées

### Realtime Supabase
✅ Les tables suivantes sont maintenant en temps réel (Realtime activé):
- patients, consultations, dossier_obstetrical, rendez_vous, prescriptions
- lab_requests, audit_log, accouchement, nouveau_ne, surveillance_post_partum
- consultation_prenatale, factures, paiements, medicaments, lots, dispensations, alertes_stock

### Routes d'Authentification
✅ Nouvelle route `/api/auth/register-request` créée pour l'inscription
✅ Routes de gestion des demandes d'inscription (approve/reject)
✅ Route de login ajoutée

### Tables Créées
✅ `registration_requests` - Pour les demandes d'inscription
✅ `users` - Pour les utilisateurs validés

---

## ✅ Informations de Connexion Supabase

### Projet Supabase Actif
- **Project ID**: `bnfgemmlokvetmohiqch`
- **URL du projet**: `https://bnfgemmlokvetmohiqch.supabase.co`
- **Statut**: ✅ ACTIVE_HEALTHY
- **Région**: eu-west-1

### Clé API Supabase (anon/public)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8
```

---

## 📱 Configuration Frontend (`.env` à la racine)

Créez un fichier `.env` à la racine du projet:

```env
# Configuration API Backend
VITE_API_URL=http://localhost:3000/api

# Configuration Supabase
VITE_SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8
```

---

## 🖥️ Configuration Backend (`server/.env`)

### Étape 1: Obtenir le mot de passe de la base de données

1. Allez sur https://app.supabase.com
2. Sélectionnez le projet: **bnfgemmlokvetmohiqch**
3. Allez dans **Settings** → **Database**
4. Si vous ne connaissez pas le mot de passe, cliquez sur **"Reset database password"**
5. Copiez le nouveau mot de passe

### Étape 2: Créer le fichier `server/.env`

Copiez `server/env.setup` vers `server/.env` et remplacez `[VOTRE_MOT_DE_PASSE]`:

```env
PORT=3000
NODE_ENV=development

# Configuration Base de Données Supabase
DATABASE_URL="postgresql://postgres.bnfgemmlokvetmohiqch:[VOTRE_MOT_DE_PASSE]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

JWT_SECRET="logi_clinic_secret_key_2024_secure"
CORS_ORIGIN="http://localhost:5173"

# Configuration Supabase (pour le client direct)
SUPABASE_URL="https://bnfgemmlokvetmohiqch.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8"

# Speech to Text Configuration
SPEECH_TO_TEXT_API_KEY="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"
SPEECH_TO_TEXT_PROVIDER="openai"
```

### Étape 3: Générer le client Prisma

```bash
cd server
npm run generate
```

---

## 🚀 Tables Realtime Activées

Les tables suivantes sont maintenant en temps réel:
- ✅ `patients`
- ✅ `consultations`
- ✅ `dossier_obstetrical`
- ✅ `rendez_vous`
- ✅ `prescriptions`
- ✅ `lab_requests`
- ✅ `audit_log`
- ✅ `accouchement`
- ✅ `nouveau_ne`
- ✅ `surveillance_post_partum`
- ✅ `consultation_prenatale`
- ✅ `factures`
- ✅ `paiements`
- ✅ `medicaments`
- ✅ `lots`
- ✅ `dispensations`
- ✅ `alertes_stock`

---

## 📊 Tables Existantes (72+ tables)

Le projet Supabase contient toutes les tables nécessaires:
- Module Patients (patients, patient_files, patient_care_timeline)
- Module Maternité (dossier_obstetrical, consultation_prenatale, accouchement, etc.)
- Module Consultation (consultations, prescriptions, lab_requests, etc.)
- Module Facturation (factures, paiements, lignes_facture, etc.)
- Module Stock (medicaments, lots, dispensations, etc.)
- Module Laboratoire (lab_prescriptions, lab_prelevements, lab_analyses, etc.)
- Module Vaccination (vaccines, vaccine_schedules, patient_vaccinations, etc.)

---

## ✅ Démarrage Rapide

### 1. Frontend

```bash
# À la racine du projet
npm run dev
```

L'application démarrera sur http://localhost:5173

### 2. Backend

```bash
cd server
npm run dev
```

Le serveur démarrera sur http://localhost:3000

### 3. Vérification

- Console navigateur (F12): "✅ Connexion Supabase réussie!"
- Backend: "🚀 Serveur démarré sur le port 3000"
- Test endpoint: http://localhost:3000/health

---

## 🆘 Dépannage

### Erreur "Failed to fetch" au Frontend

1. Vérifiez que le fichier `.env` existe à la racine
2. Vérifiez que les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont correctes
3. Redémarrez l'application frontend

### Erreur "Can't reach database server" au Backend

1. Vérifiez que `DATABASE_URL` dans `server/.env` est correcte
2. Vérifiez que le mot de passe est correct
3. Vérifiez que le projet Supabase est actif (pas en pause)

### Erreur "relation does not exist"

Les tables existent déjà dans Supabase. Si vous avez cette erreur:
1. Vérifiez que vous êtes connecté au bon projet
2. Vérifiez que le schéma est `public`

---

## 📝 Notes Importantes

- ⚠️ **Ne commitez JAMAIS** les fichiers `.env` dans Git
- 🔑 La clé API ci-dessus est la clé `anon` (publique) - sécuritaire pour le frontend
- 🔒 Pour les opérations administratives, utilisez la clé `service_role` (jamais côté client)
- 🌐 En production, mettez à jour `CORS_ORIGIN` avec le domaine de production


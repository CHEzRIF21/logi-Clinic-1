# Configuration des Variables d'Environnement - Backend

## 📋 Variables Requises

Créez un fichier `.env` dans le dossier `server/` avec les variables suivantes :

```env
# SUPABASE - Configuration Principale
SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg3MjUxOSwiZXhwIjoyMDc4NDQ4NTE5fQ.LD1MhumWvGLjxcxpCZESKx8KM9SjXSfEp2t8v239VkU

# SERVEUR
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

## 🔑 Où Trouver les Clés Supabase

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **Settings > API**
4. Copiez :
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## ⚠️ Sécurité

- ❌ **NE JAMAIS** commiter le fichier `.env` dans Git
- ❌ **NE JAMAIS** utiliser `SUPABASE_SERVICE_ROLE_KEY` dans le frontend
- ✅ Utilisez `SUPABASE_ANON_KEY` dans le frontend
- ✅ Utilisez `SUPABASE_SERVICE_ROLE_KEY` uniquement dans le backend

## 📝 Exemple Complet

Voir `ENV_EXAMPLE.txt` à la racine du projet pour un exemple complet.


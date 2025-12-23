# Configuration des Variables d'Environnement

## 📋 Fichier `.env` à créer dans `server/`

Créer un fichier `.env` dans le dossier `server/` avec le contenu suivant :

```env
# Configuration de la base de données (Supabase PostgreSQL)
# Remplacer [PASSWORD] par le mot de passe de votre base Supabase
DATABASE_URL="postgresql://postgres.bnfgemmlokvetmohiqch:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# URL directe (pour les migrations Prisma)
DIRECT_URL="postgresql://postgres.bnfgemmlokvetmohiqch:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# Configuration Supabase
SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Port du serveur
PORT=3001
```

## 🔑 Où trouver les valeurs

### DATABASE_URL et DIRECT_URL

1. Aller sur https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch
2. Menu **Settings** > **Database**
3. Section **Connection string** > **URI**
4. Copier l'URL et remplacer `[YOUR-PASSWORD]` par le mot de passe de la base

### SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY

1. Aller sur https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch
2. Menu **Settings** > **API**
3. Copier les clés :
   - `anon` `public` → `SUPABASE_ANON_KEY`
   - `service_role` `secret` → `SUPABASE_SERVICE_ROLE_KEY`

## ⚠️ Sécurité

- **NE JAMAIS** committer le fichier `.env` dans Git
- Le fichier `.gitignore` doit contenir `.env`
- `SUPABASE_SERVICE_ROLE_KEY` est une clé secrète avec accès admin


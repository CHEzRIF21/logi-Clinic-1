# 🚀 Démarrage Rapide - Prisma avec Supabase

## ⚡ Configuration en 3 Étapes

### Étape 1 : Obtenir la DATABASE_URL depuis Supabase

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet : **bnfgemmlokvetmohiqch**
3. Allez dans **Settings** > **Database**
4. Dans la section **Connection string**, sélectionnez l'onglet **"Connection pooling"**
5. Copiez la chaîne de connexion (elle ressemble à) :

```
postgresql://postgres.bnfgemmlokvetmohiqch:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Important :** Remplacez `[PASSWORD]` par votre mot de passe de base de données (visible dans Settings > Database).

### Étape 2 : Créer le Fichier .env

Dans le dossier `server/`, créez un fichier `.env` avec ce contenu :

```env
DATABASE_URL="postgresql://postgres.bnfgemmlokvetmohiqch:[VOTRE_MOT_DE_PASSE]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=public"

PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGIN=http://localhost:5173

SPEECH_TO_TEXT_API_KEY=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
SPEECH_TO_TEXT_PROVIDER=openai
SPEECH_TO_TEXT_API_URL=
AZURE_SPEECH_REGION=francecentral
```

**Remplacez `[VOTRE_MOT_DE_PASSE]` par votre vrai mot de passe !**

### Étape 3 : Générer le Client Prisma

```bash
cd server
npm run generate
```

C'est tout ! 🎉

## ✅ Vérification

Testez la connexion :

```bash
cd server
npx prisma db pull --print
```

Si vous voyez le schéma de votre base de données, la connexion fonctionne !

## 📚 Documentation Complète

Consultez `server/INTEGRATION_PRISMA_SUPABASE.md` pour plus de détails.






















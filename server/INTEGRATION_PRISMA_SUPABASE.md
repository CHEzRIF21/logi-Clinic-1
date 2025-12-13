# 🔗 Guide d'Intégration Prisma avec Supabase

Ce guide vous explique comment intégrer Prisma à votre base de données Supabase pour le projet Logi Clinic.

## 📋 Prérequis

- ✅ Node.js installé (version 16+)
- ✅ Projet Supabase configuré (ID: `bnfgemmlokvetmohiqch`)
- ✅ Accès au dashboard Supabase
- ✅ Prisma déjà installé dans le projet

## 🔧 Étape 1 : Obtenir la DATABASE_URL depuis Supabase

### 1.1 Accéder au Dashboard Supabase

1. Allez sur https://app.supabase.com
2. Connectez-vous à votre compte
3. Sélectionnez votre projet : **bnfgemmlokvetmohiqch**

### 1.2 Récupérer la Chaîne de Connexion

1. Dans le menu de gauche, cliquez sur **Settings** (⚙️)
2. Cliquez sur **Database** dans le sous-menu
3. Faites défiler jusqu'à la section **Connection string**
4. Vous verrez plusieurs options :

#### Option A : Connection Pooling (Recommandé pour Prisma)

Sélectionnez l'onglet **"Connection pooling"** et copiez la chaîne qui ressemble à :

```
postgresql://postgres.bnfgemmlokvetmohiqch:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Avantages :**
- ✅ Meilleure gestion des connexions
- ✅ Optimisé pour les applications serverless
- ✅ Limite automatique des connexions

#### Option B : Direct Connection (Alternative)

Sélectionnez l'onglet **"URI"** et copiez la chaîne qui ressemble à :

```
postgresql://postgres:[PASSWORD]@db.bnfgemmlokvetmohiqch.supabase.co:5432/postgres
```

**Note :** Ajoutez `?schema=public` à la fin pour spécifier le schéma :
```
postgresql://postgres:[PASSWORD]@db.bnfgemmlokvetmohiqch.supabase.co:5432/postgres?schema=public
```

### 1.3 Récupérer le Mot de Passe

Si vous ne connaissez pas le mot de passe de la base de données :

1. Dans **Settings > Database**
2. Cliquez sur **"Reset database password"** si nécessaire
3. Copiez le nouveau mot de passe (vous ne pourrez plus le voir après)

## 📝 Étape 2 : Configurer le Fichier .env

### 2.1 Créer le Fichier .env

1. Dans le dossier `server/`, créez un fichier `.env` (ou copiez `.env.example`)
2. Ajoutez votre `DATABASE_URL` :

```env
DATABASE_URL="postgresql://postgres.bnfgemmlokvetmohiqch:[VOTRE_MOT_DE_PASSE]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=public"
```

**Important :**
- Remplacez `[VOTRE_MOT_DE_PASSE]` par votre vrai mot de passe
- Gardez les guillemets autour de la chaîne
- Pour une connexion directe, utilisez le format de l'Option B ci-dessus

### 2.2 Vérifier les Autres Variables

Assurez-vous que votre `.env` contient aussi :

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGIN=http://localhost:5173
```

## 🚀 Étape 3 : Générer le Client Prisma

Une fois le `.env` configuré, générez le client Prisma :

```bash
cd server
npm run generate
```

Ou directement :

```bash
cd server
npx prisma generate
```

Cette commande :
- ✅ Lit votre `schema.prisma`
- ✅ Génère les types TypeScript
- ✅ Crée le client Prisma utilisable dans votre code

## 🔍 Étape 4 : Tester la Connexion

### 4.1 Introspection de la Base (Optionnel)

Si votre base Supabase existe déjà avec des tables, vous pouvez synchroniser votre schéma Prisma :

```bash
cd server
npx prisma db pull
```

**Attention :** Cette commande va **écraser** votre `schema.prisma` actuel avec le schéma de la base de données. Faites une sauvegarde avant !

### 4.2 Vérifier la Connexion

Testez la connexion avec :

```bash
cd server
npx prisma db pull --print
```

Cette commande affiche le schéma sans modifier les fichiers, vous permettant de vérifier que la connexion fonctionne.

### 4.3 Tester avec Prisma Studio

Ouvrez Prisma Studio pour visualiser vos données :

```bash
cd server
npm run studio
```

Cela ouvrira une interface web sur `http://localhost:5555` où vous pourrez voir et modifier vos données.

## 📊 Étape 5 : Appliquer les Migrations

### 5.1 Si vous partez d'une Base Vide

Si votre base Supabase est vide et que vous voulez créer les tables depuis votre `schema.prisma` :

```bash
cd server
npm run migrate
```

Ou :

```bash
cd server
npx prisma migrate dev --name init
```

Cette commande :
- ✅ Crée une nouvelle migration basée sur votre `schema.prisma`
- ✅ Applique la migration à votre base Supabase
- ✅ Génère automatiquement le client Prisma

### 5.2 Si vous avez Déjà des Migrations

Si vous avez déjà des migrations dans `server/prisma/migrations/` :

```bash
cd server
npm run migrate:deploy
```

Ou :

```bash
cd server
npx prisma migrate deploy
```

Cette commande applique uniquement les migrations qui n'ont pas encore été exécutées.

## 🧪 Étape 6 : Tester dans le Code

Créez un fichier de test pour vérifier que tout fonctionne :

```typescript
// server/test-prisma.ts
import prisma from './src/prisma';

async function testConnection() {
  try {
    // Tester une requête simple
    const userCount = await prisma.user.count();
    console.log('✅ Connexion Prisma réussie !');
    console.log(`📊 Nombre d'utilisateurs : ${userCount}`);
    
    // Tester une requête avec relations
    const patients = await prisma.patient.findMany({
      take: 5,
      include: {
        assurance: true,
      },
    });
    console.log(`📋 ${patients.length} patient(s) trouvé(s)`);
    
  } catch (error) {
    console.error('❌ Erreur de connexion Prisma :', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

Exécutez le test :

```bash
cd server
npx ts-node test-prisma.ts
```

## 🔐 Points Importants pour Supabase

### Schema Public

Supabase utilise le schéma `public` par défaut. Assurez-vous que votre `DATABASE_URL` inclut `?schema=public` ou `&schema=public`.

### Row Level Security (RLS)

Si vous avez activé RLS sur vos tables Supabase, Prisma utilisera les permissions du rôle défini dans votre `DATABASE_URL`. 

**Pour les migrations :**
- Utilisez le rôle `service_role` (via la clé service_role dans Supabase)
- Ne mettez JAMAIS la clé service_role dans un `.env` qui sera commité dans Git

**Pour l'application :**
- Utilisez le rôle `anon` ou `authenticated` selon vos besoins
- Configurez les politiques RLS dans Supabase Dashboard

### Connection Pooling

Pour Prisma avec Supabase, il est **fortement recommandé** d'utiliser le connection pooling :

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Pourquoi ?**
- Supabase limite le nombre de connexions directes
- Le pooling gère mieux les connexions multiples
- Optimisé pour les applications serverless

## 📋 Checklist d'Intégration

- [ ] Fichier `.env` créé dans `server/`
- [ ] `DATABASE_URL` configuré avec le bon format
- [ ] Mot de passe de la base de données récupéré
- [ ] Client Prisma généré (`npm run generate`)
- [ ] Connexion testée (`npx prisma db pull --print`)
- [ ] Migrations appliquées si nécessaire (`npm run migrate` ou `npm run migrate:deploy`)
- [ ] Test dans le code réussi
- [ ] Prisma Studio fonctionne (`npm run studio`)

## 🆘 Dépannage

### Erreur : "Can't reach database server"

**Solution :**
- Vérifiez que votre `DATABASE_URL` est correcte
- Vérifiez que le mot de passe est correct
- Vérifiez votre connexion Internet
- Vérifiez que le projet Supabase est actif

### Erreur : "Schema 'public' does not exist"

**Solution :**
- Ajoutez `?schema=public` à la fin de votre `DATABASE_URL`
- Ou utilisez `&schema=public` si vous avez déjà d'autres paramètres

### Erreur : "Too many connections"

**Solution :**
- Utilisez le connection pooling au lieu de la connexion directe
- Vérifiez que vous fermez les connexions Prisma (`prisma.$disconnect()`)
- Réduisez le `connection_limit` dans l'URL

### Erreur : "relation does not exist"

**Solution :**
- Vérifiez que les migrations ont été appliquées
- Vérifiez que vous utilisez le bon schéma (`public`)
- Exécutez `npx prisma db pull` pour synchroniser avec la base

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Prisma avec Supabase](https://www.prisma.io/docs/guides/database/using-prisma-with-supabase)

## ✅ Résumé des Commandes

```bash
# 1. Générer le client Prisma
cd server && npm run generate

# 2. Tester la connexion
npx prisma db pull --print

# 3. Appliquer les migrations
npm run migrate          # Développement
npm run migrate:deploy    # Production

# 4. Ouvrir Prisma Studio
npm run studio

# 5. Créer une nouvelle migration
npx prisma migrate dev --name nom_de_la_migration
```

---

**Une fois toutes ces étapes complétées, Prisma sera intégré à votre base Supabase ! 🚀**























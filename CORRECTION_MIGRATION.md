# Correction de l'Erreur de Migration Prisma

## ❌ Problème Identifié

L'erreur `relation "LigneBudgetaire" does not exist` se produisait car dans la migration `002_enrich_schema`, la table `CaisseEntry` essayait de créer une contrainte de clé étrangère vers `LigneBudgetaire` **avant** que cette table ne soit créée.

## ✅ Solution Appliquée

### 1. Correction de l'ordre dans la migration

**Fichier modifié :** `server/prisma/migrations/002_enrich_schema/migration.sql`

**Changement :** Réorganisation de l'ordre de création des tables :
- ✅ Création de `LigneBudgetaire` **EN PREMIER**
- ✅ Puis création de `CaisseEntry` avec sa contrainte FK vers `LigneBudgetaire`

### 2. Réinitialisation et réapplication des migrations

```powershell
cd server
npx prisma migrate reset --force
npx prisma migrate deploy
npx prisma generate
```

## 🔧 Commandes de Vérification

### Vérifier l'état des migrations
```powershell
cd server
npx prisma migrate status
```

### Générer le client Prisma
```powershell
npx prisma generate
```

### Tester la connexion à la base de données
```powershell
cd server
"SELECT COUNT(*) FROM `"User`";" | npx prisma db execute --stdin
```

### Utiliser le script de vérification
```powershell
cd server
.\verify-migration.ps1
```

## 📋 État Actuel

- ✅ Migration `001_init` : Appliquée
- ✅ Migration `002_enrich_schema` : Corrigée et appliquée
- ✅ Migration `003_inventory_security_extensions` : Appliquée
- ✅ Migration `004_add_app_security_fields` : Prête à être appliquée

## 🚀 Prochaines Étapes

1. **Vérifier que toutes les migrations sont appliquées :**
   ```powershell
   cd server
   npx prisma migrate status
   ```

2. **Si la migration `004_add_app_security_fields` n'est pas appliquée :**
   ```powershell
   npx prisma migrate deploy
   ```

3. **Démarrer le serveur :**
   ```powershell
   npm run dev
   ```

4. **Tester l'API sur localhost:3000**

## ⚠️ Notes Importantes

- En **développement**, vous pouvez utiliser `prisma migrate reset` pour réinitialiser complètement la base
- En **production**, utilisez `prisma migrate deploy` qui ne réinitialise pas les données
- Le fichier `.env` doit contenir la bonne `DATABASE_URL` :
  ```
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/logi_clinic?schema=public
  ```

## 🐛 En Cas de Problème

Si vous rencontrez encore des erreurs :

1. **Vérifier que PostgreSQL est démarré :**
   ```powershell
   docker ps
   # ou
   docker-compose ps
   ```

2. **Vérifier la connexion :**
   ```powershell
   psql -h localhost -U postgres -d logi_clinic
   ```

3. **Réinitialiser complètement (⚠️ supprime toutes les données) :**
   ```powershell
   cd server
   npx prisma migrate reset --force
   npx prisma migrate deploy
   ```


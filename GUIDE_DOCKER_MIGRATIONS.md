# 🐳 Guide des Migrations Docker - Logi Clinic

Ce guide explique comment utiliser la configuration Docker pour appliquer automatiquement les migrations.

## 📋 Vue d'ensemble

La configuration Docker a été mise à jour pour :
- ✅ Appliquer automatiquement les migrations Prisma au démarrage
- ✅ Fournir des scripts pour appliquer les migrations Supabase
- ✅ Configurer un environnement Dev Container pour VS Code

## 🚀 Démarrage rapide

### Option 1: Docker Compose (Recommandé)

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs pour vérifier que les migrations sont appliquées
docker-compose logs -f server
```

Les migrations Prisma sont appliquées automatiquement au démarrage du container `server`.

### Option 2: VS Code Dev Containers

1. **Installer l'extension Dev Containers**
   - Ouvrez VS Code
   - Installez "Dev Containers" (ms-vscode-remote.remote-containers)

2. **Ouvrir dans le container**
   - Appuyez sur `F1` ou `Ctrl+Shift+P`
   - Sélectionnez "Dev Containers: Reopen in Container"
   - Attendez la construction et le démarrage

3. **Les migrations sont appliquées automatiquement**

## 🔷 Migrations Supabase

Les migrations Supabase nécessitent une connexion à votre projet Supabase. Deux options :

### Méthode 1: Via le Dashboard (Simple)

1. Allez sur https://supabase.com/dashboard
2. Ouvrez le SQL Editor
3. Copiez-collez le contenu de `supabase_migrations/apply_all_migrations_and_rls.sql`
4. Exécutez la requête

📖 Voir `APPLIQUER_MIGRATIONS.md` pour plus de détails.

### Méthode 2: Via Supabase CLI (Dans le container)

```bash
# Dans le container Dev Container ou via docker-compose exec
docker-compose exec server bash

# Installer Supabase CLI (si nécessaire)
npm install -g supabase

# Se connecter
supabase login

# Appliquer les migrations
cd /workspace
./.devcontainer/apply-supabase-migrations.sh [votre-project-ref]
```

## 📁 Fichiers créés

```
.devcontainer/
├── devcontainer.json              # Configuration Dev Container
├── post-create.sh                 # Script post-création
├── post-start.sh                  # Script post-démarrage
├── apply-supabase-migrations.sh   # Script migrations Supabase
└── README.md                      # Documentation Dev Container

scripts/
└── init-migrations.sh             # Script d'initialisation migrations

docker-entrypoint.sh               # Script d'entrée Docker
GUIDE_DOCKER_MIGRATIONS.md         # Ce fichier
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine (optionnel) :

```env
# Supabase (optionnel, pour migrations automatiques)
SUPABASE_PROJECT_ID=votre-project-ref

# Database (déjà configuré dans docker-compose.yml)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/logi_clinic?schema=public
```

### Ports

- **3000**: API Server
- **5173**: Client Dev Server  
- **5432**: PostgreSQL

## 🔍 Vérification

### Vérifier que les migrations Prisma sont appliquées

```bash
# Dans le container
docker-compose exec server bash
cd /app
npx prisma migrate status
```

### Vérifier que les migrations Supabase sont appliquées

Connectez-vous au dashboard Supabase et vérifiez les tables dans le SQL Editor :

```sql
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

## 🐛 Dépannage

### Les migrations Prisma ne s'appliquent pas

```bash
# Forcer l'application des migrations
docker-compose exec server bash
cd /app
npx prisma migrate deploy
npx prisma generate
```

### Le container ne démarre pas

```bash
# Reconstruire les images
docker-compose build --no-cache

# Redémarrer proprement
docker-compose down -v
docker-compose up -d
```

### Erreur de connexion à PostgreSQL

Vérifiez que le service PostgreSQL est démarré :

```bash
docker-compose ps
docker-compose logs postgres
```

### Les migrations Supabase échouent

1. Vérifiez votre connexion Supabase :
   ```bash
   supabase login
   supabase projects list
   ```

2. Utilisez la méthode Dashboard (plus simple) :
   - Voir `APPLIQUER_MIGRATIONS.md`

## 📚 Documentation complémentaire

- `APPLIQUER_MIGRATIONS.md` - Guide détaillé migrations Supabase
- `INSTRUCTIONS_MIGRATIONS.md` - Instructions générales
- `MIGRATION_GUIDE.md` - Guide des migrations Consultation
- `.devcontainer/README.md` - Documentation Dev Container

## ✅ Checklist de démarrage

- [ ] Docker et Docker Compose installés
- [ ] Services démarrés : `docker-compose up -d`
- [ ] Migrations Prisma appliquées (vérifier les logs)
- [ ] Migrations Supabase appliquées (via dashboard ou CLI)
- [ ] Application accessible sur http://localhost:3000
- [ ] Client accessible sur http://localhost:5173

## 🎯 Prochaines étapes

1. Appliquez les migrations Supabase (voir ci-dessus)
2. Configurez vos variables d'environnement
3. Testez l'application
4. Consultez les autres guides pour les modules spécifiques

---

**Note** : Les migrations Prisma sont appliquées automatiquement. Les migrations Supabase doivent être appliquées manuellement via le dashboard ou Supabase CLI.


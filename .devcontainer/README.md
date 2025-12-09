# Configuration Dev Container - Logi Clinic

Cette configuration permet de développer dans un environnement Docker isolé avec toutes les migrations appliquées automatiquement.

## 🚀 Utilisation

### Option 1: Via VS Code Dev Containers (Recommandé)

1. **Installer l'extension Dev Containers**
   - Ouvrez VS Code
   - Installez l'extension "Dev Containers" (ms-vscode-remote.remote-containers)

2. **Ouvrir le projet dans le container**
   - Appuyez sur `F1` ou `Ctrl+Shift+P`
   - Sélectionnez "Dev Containers: Reopen in Container"
   - Attendez que le container se construise et démarre

3. **Les migrations sont appliquées automatiquement**
   - Les migrations Prisma sont appliquées au démarrage
   - Les migrations Supabase nécessitent une configuration supplémentaire (voir ci-dessous)

### Option 2: Via Docker Compose

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f server

# Appliquer les migrations manuellement
docker-compose exec server bash scripts/init-migrations.sh
```

## 🔷 Migrations Supabase

Les migrations Supabase peuvent être appliquées de deux façons:

### Méthode 1: Via le Dashboard Supabase (Recommandé pour début)

1. Allez sur https://supabase.com/dashboard
2. Ouvrez le SQL Editor
3. Copiez-collez le contenu de `supabase_migrations/apply_all_migrations_and_rls.sql`
4. Exécutez la requête

Voir `APPLIQUER_MIGRATIONS.md` pour plus de détails.

### Méthode 2: Via Supabase CLI (Dans le container)

```bash
# Dans le container Dev Container
# Installer Supabase CLI (si pas déjà installé)
npm install -g supabase

# Se connecter à Supabase
supabase login

# Appliquer les migrations
./.devcontainer/apply-supabase-migrations.sh [votre-project-ref]
```

Ou manuellement:

```bash
# Initialiser Supabase (première fois)
supabase init

# Lier au projet
supabase link --project-ref [votre-project-ref]

# Appliquer les migrations
supabase db push
```

## 📁 Structure des fichiers

```
.devcontainer/
├── devcontainer.json          # Configuration principale
├── post-create.sh             # Script exécuté après création du container
├── post-start.sh              # Script exécuté à chaque démarrage
├── apply-supabase-migrations.sh # Script pour appliquer migrations Supabase
└── README.md                  # Ce fichier
```

## 🔧 Configuration

### Variables d'environnement

Vous pouvez créer un fichier `.env` à la racine du projet:

```env
# Supabase (optionnel)
SUPABASE_PROJECT_ID=votre-project-ref
SUPABASE_ACCESS_TOKEN=votre-token

# Database (déjà configuré dans docker-compose.yml)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/logi_clinic?schema=public
```

### Ports exposés

- **3000**: API Server
- **5173**: Client Dev Server
- **5432**: PostgreSQL

## 🐛 Dépannage

### Les migrations Prisma ne s'appliquent pas

```bash
# Dans le container
cd server
npx prisma migrate deploy
npx prisma generate
```

### Les migrations Supabase ne s'appliquent pas

1. Vérifiez que vous êtes connecté à Supabase CLI:
   ```bash
   supabase login
   ```

2. Vérifiez que le projet est lié:
   ```bash
   supabase projects list
   ```

3. Appliquez manuellement via le dashboard (voir `APPLIQUER_MIGRATIONS.md`)

### Le container ne démarre pas

```bash
# Reconstruire les images
docker-compose build --no-cache

# Redémarrer
docker-compose down
docker-compose up -d
```

## 📚 Documentation

- `APPLIQUER_MIGRATIONS.md` - Guide pour appliquer les migrations Supabase
- `INSTRUCTIONS_MIGRATIONS.md` - Instructions détaillées
- `MIGRATION_GUIDE.md` - Guide général des migrations

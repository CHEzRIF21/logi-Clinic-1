# 🐘 Guide pour Démarrer PostgreSQL

## ❌ Erreur Rencontrée

```
Error: P1001: Can't reach database server at `localhost:5432`
```

Cette erreur signifie que PostgreSQL n'est pas démarré ou n'est pas accessible.

## ✅ Solutions

### Option 1 : Utiliser Docker (Recommandé)

Si vous avez `docker-compose.yml` à la racine du projet :

```powershell
# Depuis la racine du projet
docker-compose up -d postgres
```

Ou pour démarrer tous les services :

```powershell
docker-compose up -d
```

Vérifier que PostgreSQL est démarré :

```powershell
docker ps
```

Vous devriez voir un conteneur PostgreSQL en cours d'exécution.

### Option 2 : Service Windows PostgreSQL

Si PostgreSQL est installé comme service Windows :

```powershell
# Vérifier le statut du service
Get-Service -Name postgresql*

# Démarrer le service (si arrêté)
Start-Service -Name postgresql-x64-*  # Remplacez * par votre version
```

### Option 3 : Démarrer PostgreSQL Manuellement

Si PostgreSQL est installé localement :

```powershell
# Trouver le chemin d'installation
# Généralement : C:\Program Files\PostgreSQL\{version}\bin

# Démarrer PostgreSQL
& "C:\Program Files\PostgreSQL\15\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\15\data"
```

### Option 4 : Utiliser Supabase (Alternative)

Si vous utilisez Supabase au lieu de PostgreSQL local, modifiez `DATABASE_URL` dans `server/.env` :

```env
DATABASE_URL=postgresql://postgres:[VOTRE_MOT_DE_PASSE]@db.[VOTRE_PROJET].supabase.co:5432/postgres
```

## 🔍 Vérification

### 1. Vérifier que PostgreSQL écoute sur le port 5432

```powershell
# Vérifier si le port est utilisé
netstat -an | findstr :5432
```

Vous devriez voir quelque chose comme :
```
TCP    0.0.0.0:5432           0.0.0.0:0              LISTENING
```

### 2. Tester la connexion

```powershell
# Avec psql (si installé)
psql -h localhost -p 5432 -U postgres -d logiclinic

# Ou avec Prisma (syntaxe PowerShell)
cd server
"SELECT version();" | npx prisma db execute --stdin
```

## 📝 Configuration DATABASE_URL

Vérifiez que `server/.env` contient la bonne `DATABASE_URL` :

### Pour PostgreSQL Local (Docker)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/logiclinic?schema=public
```

### Pour PostgreSQL Local (Service Windows)
```env
DATABASE_URL=postgresql://postgres:[VOTRE_MOT_DE_PASSE]@localhost:5432/logiclinic?schema=public
```

### Pour Supabase
```env
DATABASE_URL=postgresql://postgres:[MOT_DE_PASSE]@db.[PROJET].supabase.co:5432/postgres
```

## 🚀 Après le Démarrage

Une fois PostgreSQL démarré, réessayez :

```powershell
cd server
.\verify-migration.ps1
```

## ⚠️ Problèmes Courants

### Port 5432 déjà utilisé

Si le port est déjà utilisé par un autre processus :

```powershell
# Trouver le processus utilisant le port
netstat -ano | findstr :5432

# Arrêter le processus (remplacez PID par le numéro trouvé)
taskkill /PID [PID] /F
```

### Mot de passe incorrect

Vérifiez le mot de passe dans `DATABASE_URL`. Pour Docker, le mot de passe par défaut est souvent `postgres`.

### Base de données n'existe pas

Créez la base de données :

```powershell
# Avec Docker
docker exec -it [CONTAINER_NAME] psql -U postgres -c "CREATE DATABASE logiclinic;"

# Ou avec psql local
psql -h localhost -U postgres -c "CREATE DATABASE logiclinic;"
```

## ✅ Checklist

- [ ] PostgreSQL est démarré (Docker ou Service Windows)
- [ ] Le port 5432 est accessible
- [ ] `DATABASE_URL` dans `server/.env` est correct
- [ ] La base de données `logiclinic` existe
- [ ] Le script `verify-migration.ps1` fonctionne sans erreur de connexion


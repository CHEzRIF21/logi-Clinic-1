# Corrections Effectuées - Sécurisation Anti-Clone

## ✅ Problèmes Résolus

### 1. Installation des dépendances client
- ✅ Installation de `javascript-obfuscator` dans `client/package.json`
- ✅ Installation des dépendances via `npm install` dans le dossier `client/`

### 2. Configuration Base de Données
- ✅ Création du script `server/setup-env.ps1` pour générer le fichier `.env`
- ✅ Configuration de la DATABASE_URL pour PostgreSQL

### 3. Migration Prisma
- ✅ Création de la migration `004_add_app_security_fields` pour ajouter :
  - `appId` (String @unique) - Identifiant public de l'application
  - `appSecret` (String) - Clé secrète de l'application
  - `revoked`, `revokedAt`, `revokedReason` - Gestion de la révocation
  - `clinicId` - Lien vers la clinique associée

## 🔧 Actions à Effectuer

### 1. Créer le fichier .env dans server/

**Option A - Utiliser le script PowerShell :**
```powershell
cd server
.\setup-env.ps1
```

**Option B - Créer manuellement :**
Créez un fichier `server/.env` avec le contenu suivant :

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/logi_clinic?schema=public
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGIN=http://localhost:5173
SPEECH_TO_TEXT_API_KEY=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
SPEECH_TO_TEXT_PROVIDER=openai
```

### 2. Démarrer PostgreSQL

**Option A - Via Docker Compose :**
```powershell
docker-compose up -d postgres
```

**Option B - Si PostgreSQL est installé localement :**
Assurez-vous que PostgreSQL est démarré et accessible sur le port 5432.

### 3. Appliquer les migrations Prisma

```powershell
cd server
npx prisma migrate deploy
```

Ou en mode développement (crée aussi la base si elle n'existe pas) :
```powershell
npx prisma migrate dev
```

### 4. Générer le client Prisma

```powershell
cd server
npx prisma generate
```

### 5. Configurer les variables d'environnement du client

Créez un fichier `client/.env` avec :

```env
VITE_APP_ID=votre-app-id
VITE_APP_SECRET=votre-secret
VITE_LICENSED_DOMAIN=localhost
VITE_ALLOWED_DOMAINS=localhost,127.0.0.1
VITE_API_URL=http://localhost:3000/api
```

**⚠️ Important :** Les valeurs `VITE_APP_ID` et `VITE_APP_SECRET` doivent être générées via le service `licenseService.createLicense()` dans le backend.

## 📝 Notes Importantes

1. **Le fichier `.env` est ignoré par Git** - C'est normal et sécurisé. Ne le commitez jamais.

2. **En développement**, le middleware `appSecurity` est désactivé par défaut. Pour l'activer :
   ```env
   ENFORCE_APP_SECURITY=true
   ```

3. **En production**, le middleware est automatiquement activé si `NODE_ENV=production`.

4. **Pour créer une licence avec credentials**, utilisez le service backend :
   ```typescript
   const license = await licenseService.createLicense({
     domain: 'votre-domaine.com',
     clinicId: 'uuid-de-la-clinique',
     expiresAt: new Date('2025-12-31'),
   });
   // license.appId et license.appSecret seront générés automatiquement
   ```

## 🐛 Résolution des Problèmes

### Erreur : "Can't reach database server"
- Vérifiez que PostgreSQL est démarré : `docker ps` ou vérifiez le service Windows
- Vérifiez la DATABASE_URL dans `.env`
- Testez la connexion : `psql -h localhost -U postgres -d logi_clinic`

### Erreur : "Migration already applied"
- Si la migration existe déjà, utilisez `prisma migrate resolve --applied 004_add_app_security_fields`

### Erreur : "Module not found: javascript-obfuscator"
- Exécutez : `cd client && npm install`


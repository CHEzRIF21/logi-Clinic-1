# Logi Clinic - Module Facturation

Système complet de gestion de facturation pour un centre sanitaire (clinique / dispensaire).

## 🏗️ Architecture

Projet mono-repo avec:
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: React + Vite + Tailwind CSS

## 📋 Prérequis

- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

## 🚀 Installation Rapide

### 1. Cloner le projet

```bash
git clone <repository-url>
cd logi-clinic
```

### 2. Configuration Backend

```bash
cd server
npm install
cp .env.example .env
# Éditer .env avec vos paramètres de base de données
```

### 3. Configuration Base de Données

```bash
# Créer la base de données
createdb logi_clinic

# Exécuter les migrations
npm run migrate

# Seed les données initiales
npm run seed
```

### 4. Configuration Frontend

```bash
cd ../client
npm install
cp .env.example .env
# Éditer .env avec l'URL de l'API
```

## 🏃 Démarrage

### Développement

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Production avec Docker

```bash
docker-compose up -d
```

## 📚 Documentation

### Backend API

- **Base URL**: `http://localhost:3000/api`
- **Documentation**: Voir `server/README.md`

### Frontend

- **URL**: `http://localhost:5173`
- **Documentation**: Voir `client/README.md`

## 🔑 Endpoints Principaux

### Factures
- `GET /api/invoices` - Liste les factures
- `POST /api/invoices` - Crée une facture
- `GET /api/invoices/:id` - Détails d'une facture
- `GET /api/invoices/:id/pdf` - PDF de la facture

### Paiements
- `POST /api/invoices/:id/payments` - Enregistre un paiement
- `GET /api/invoices/:id/payments` - Historique des paiements

### Opérations
- `GET /api/operations` - Liste les opérations
- `POST /api/operations` - Crée une opération

### Produits
- `GET /api/products` - Liste les produits
- `POST /api/products` - Crée un produit

### Statistiques
- `GET /api/statistics/finance` - Statistiques financières
- `GET /api/statistics/dashboard` - Statistiques du tableau de bord

## 🧪 Tests

### Backend
```bash
cd server
npm test
```

### Frontend
```bash
cd client
npm test
```

## 📦 Structure du Projet

```
logi-clinic/
├── server/                 # Backend API
│   ├── src/
│   │   ├── controllers/   # Contrôleurs
│   │   ├── services/      # Services métier
│   │   ├── routes/        # Routes API
│   │   └── middleware/    # Middleware Express
│   ├── prisma/
│   │   ├── schema.prisma  # Schéma Prisma
│   │   └── migrations/   # Migrations SQL
│   └── package.json
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/   # Composants React
│   │   ├── pages/        # Pages
│   │   └── services/    # Services API
│   └── package.json
└── docker-compose.yml     # Configuration Docker
```

## 🔒 Sécurité

⚠️ **Important**: 
- Le middleware d'authentification est un stub pour le développement
- En production, implémenter une authentification JWT complète
- Changer le `JWT_SECRET` en production
- Utiliser HTTPS en production

## 🐛 Dépannage

### Erreur "Could not find the table in schema cache"

Le service `SchemaCacheService` gère automatiquement cette erreur en rafraîchissant le cache Prisma.

### Base de données non accessible

Vérifier:
1. PostgreSQL est démarré
2. Les variables d'environnement dans `.env`
3. La connexion réseau

## 📝 Licence

ISC

## 👥 Support

Pour toute question ou problème, créer une issue sur le repository.

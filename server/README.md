# Logi Clinic - Backend API

Backend API pour le module de facturation du système de gestion de centre sanitaire.

## Stack Technique

- **Node.js** + **Express**
- **Prisma** + **PostgreSQL**
- **TypeScript**
- **Puppeteer** (génération PDF)

## Installation

1. Installer les dépendances:
```bash
npm install
```

2. Configurer les variables d'environnement:
```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

3. Configurer la base de données:
```bash
# Créer la base de données PostgreSQL
createdb logi_clinic

# Exécuter les migrations
npm run migrate

# Seed les données initiales
npm run seed
```

4. Générer le client Prisma:
```bash
npm run generate
```

## Démarrage

### Développement
```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

### Production
```bash
npm run build
npm start
```

## Scripts Disponibles

- `npm run dev` - Démarre le serveur en mode développement avec hot-reload
- `npm run build` - Compile TypeScript vers JavaScript
- `npm start` - Démarre le serveur en production
- `npm run migrate` - Exécute les migrations Prisma
- `npm run seed` - Seed la base de données avec des données de test
- `npm run generate` - Génère le client Prisma
- `npm run studio` - Ouvre Prisma Studio pour visualiser la base de données
- `npm test` - Lance les tests

## API Endpoints

### Factures
- `GET /api/invoices` - Liste les factures
- `POST /api/invoices` - Crée une facture
- `GET /api/invoices/:id` - Récupère une facture
- `GET /api/invoices/:id/pdf` - Génère le PDF de la facture
- `POST /api/invoices/:id/cancel` - Annule une facture

### Paiements
- `POST /api/invoices/:id/payments` - Ajoute un paiement
- `GET /api/invoices/:id/payments` - Liste les paiements d'une facture

### Opérations
- `GET /api/operations` - Liste les opérations
- `POST /api/operations` - Crée une opération
- `GET /api/operations/:id` - Récupère une opération

### Produits
- `GET /api/products` - Liste les produits
- `POST /api/products` - Crée un produit
- `GET /api/products/:id` - Récupère un produit
- `PUT /api/products/:id` - Met à jour un produit
- `DELETE /api/products/:id` - Supprime un produit

### Statistiques
- `GET /api/statistics/finance` - Statistiques financières
- `GET /api/statistics/dashboard` - Statistiques du tableau de bord

## Structure du Projet

```
server/
├── src/
│   ├── controllers/     # Contrôleurs des routes
│   ├── services/        # Logique métier
│   ├── routes/          # Définition des routes
│   ├── middleware/       # Middleware Express
│   ├── utils/           # Utilitaires
│   ├── config.ts        # Configuration
│   └── index.ts         # Point d'entrée
├── prisma/
│   ├── schema.prisma    # Schéma Prisma
│   ├── migrations/      # Migrations SQL
│   └── seed.ts          # Script de seed
└── package.json
```

## Base de Données

Le schéma Prisma définit les modèles suivants:
- User
- Patient
- Product
- Operation / OperationLine
- Invoice / InvoiceLine
- Payment

## Sécurité

⚠️ **Important**: Le middleware d'authentification est actuellement un stub pour le développement. 
En production, implémenter une authentification JWT complète.

## Tests

```bash
npm test
```

## Docker

```bash
docker build -t logi-clinic-server .
docker run -p 3000:3000 logi-clinic-server
```

## Support

Pour toute question ou problème, consulter la documentation ou créer une issue.


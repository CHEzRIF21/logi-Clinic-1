# Guide de Sécurisation du Déploiement - Logi Clinic

## Vue d'ensemble

Ce document décrit le système de protection contre les déploiements non autorisés mis en place pour Logi Clinic. Le système combine plusieurs couches de sécurité pour garantir que seuls les déploiements autorisés peuvent fonctionner.

## Architecture de Sécurité

### Composants Principaux

1. **Système de Licence Centralisé**
   - Validation côté serveur et client
   - Vérification de domaine/hôte
   - Limitation du nombre de déploiements
   - Expiration des licences

2. **Protection du Code Source**
   - Obfuscation JavaScript
   - Minification avancée
   - Watermarking et identification unique

3. **Système d'Alerte**
   - Monitoring des tentatives de déploiement
   - Notifications email/webhook
   - Logging complet

## Installation et Configuration

### 1. Prérequis

- Node.js 18+
- PostgreSQL 15+
- Base de données configurée avec Prisma

### 2. Migration de la Base de Données

Exécutez les migrations Prisma pour créer les tables nécessaires :

```bash
cd server
npm run migrate
```

Cela créera les tables suivantes :
- `License` : Stocke les licences
- `DeploymentAttempt` : Enregistre toutes les tentatives de déploiement

### 3. Configuration des Variables d'Environnement

#### Serveur (`server/.env`)

```env
# Licence
LICENSE_KEY=votre-cle-de-licence
ALLOWED_DOMAINS=example.com,www.example.com
LICENSE_SECRET_KEY=votre-secret-key-change-in-production
LICENSE_CHECK_INTERVAL=3600000

# Alerte
ALERT_EMAIL=votre-email@example.com
ALERT_WEBHOOK_URL=https://votre-webhook-url.com/alerts
LICENSE_SERVER_URL=https://votre-serveur-licence.com

# Admin (pour génération de licences et monitoring)
ADMIN_LICENSE_KEY=votre-cle-admin
ADMIN_MONITORING_KEY=votre-cle-monitoring
```

#### Client (`client/.env`)

```env
VITE_LICENSE_KEY=votre-cle-de-licence
VITE_LICENSE_CHECK_INTERVAL=3600000
VITE_API_URL=http://localhost:3000/api
```

## Génération d'une Licence

### Méthode 1 : Script Interactif

```bash
npm run license:generate
```

Le script vous guidera à travers les étapes :
1. Domaine principal
2. Domaines autorisés (peut inclure des wildcards comme `*.example.com`)
3. Date d'expiration (optionnel)
4. Nombre maximum de déploiements (optionnel)

### Méthode 2 : Ligne de Commande

```bash
node scripts/generate-license.js \
  --domain example.com \
  --allowed-domains example.com,www.example.com,*.example.com \
  --expires 2025-12-31 \
  --max-deployments 5
```

### Exemple de Sortie

```
✅ Licence créée avec succès!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DÉTAILS DE LA LICENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID:              123e4567-e89b-12d3-a456-426614174000
Clé de licence: EXAMPLE-ABC123DEF456-GHI789
Domaine:         example.com
Domaines autorisés: example.com, www.example.com
Expire le:        31/12/2025
Max déploiements: 5
Statut:           ✅ Actif
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Build Sécurisé

### Build Client avec Obfuscation

```bash
cd client
npm run build:secure
```

Ce script :
1. Compile l'application avec Vite
2. Obfusque le code JavaScript avec `javascript-obfuscator`
3. Ajoute un watermarking unique au build

### Build Comportement

- **Développement** : Aucune vérification de licence, code non obfusqué
- **Production** : Vérification stricte de licence, code obfusqué

## Vérification de Licence

### Côté Serveur

Le serveur vérifie automatiquement la licence :
- Au démarrage
- Périodiquement (selon `LICENSE_CHECK_INTERVAL`)
- Sur chaque requête API (via middleware)

### Côté Client

Le client vérifie la licence :
- Au chargement de l'application
- Périodiquement pendant l'utilisation
- Via le composant `LicenseGuard`

## Monitoring et Alertes

### Accès aux Statistiques

```bash
curl -H "X-Admin-Key: votre-cle-monitoring" \
  http://localhost:3000/api/monitoring/stats
```

### Tentatives de Déploiement

```bash
curl -H "X-Admin-Key: votre-cle-monitoring" \
  http://localhost:3000/api/monitoring/deployment-attempts?limit=50
```

### Configuration des Alertes

#### Webhook

Lorsqu'une tentative non autorisée est détectée, une requête POST est envoyée à `ALERT_WEBHOOK_URL` avec :

```json
{
  "type": "UNAUTHORIZED_DEPLOYMENT_ATTEMPT",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "domain": "unauthorized-domain.com",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "licenseKey": "EXAMPLE-ABC123DEF456-GHI789",
  "reason": "Domain unauthorized-domain.com not allowed"
}
```

#### Email

Pour activer les alertes par email, configurez `ALERT_EMAIL` et implémentez un service d'email (nodemailer, SendGrid, etc.).

## Gestion des Licences

### Activer/Désactiver une Licence

```typescript
// Via Prisma Studio
prisma studio

// Ou via script SQL
UPDATE "License" SET active = false WHERE "licenseKey" = 'EXAMPLE-ABC123DEF456-GHI789';
```

### Vérifier le Statut d'une Licence

```bash
curl http://localhost:3000/api/license/status
```

### Créer une Licence via API

```bash
curl -X POST \
  -H "X-Admin-Key: votre-cle-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "maxDeployments": 5
  }' \
  http://localhost:3000/api/license/create
```

## Sécurité Avancée

### Obfuscation JavaScript

Le code est obfusqué avec les options suivantes :
- Control flow flattening
- Dead code injection
- String array encoding (base64)
- Self-defending code
- Disable console output

### Watermarking

Chaque build contient :
- Un identifiant unique de build
- Un timestamp de compilation
- Un identifiant de déploiement (stocké dans localStorage)

### Protection contre le Contournement

1. **Vérification Multi-Points** : La licence est vérifiée au démarrage ET périodiquement
2. **Vérification Serveur** : Même si le client est modifié, le serveur bloque les requêtes
3. **Logging Complet** : Toutes les tentatives sont enregistrées
4. **Alertes en Temps Réel** : Vous êtes notifié immédiatement des tentatives non autorisées

## Dépannage

### Le serveur ne démarre pas

1. Vérifiez que `LICENSE_KEY` est défini dans `.env`
2. Vérifiez que la licence existe dans la base de données
3. Vérifiez que le domaine correspond aux domaines autorisés
4. Consultez les logs pour plus de détails

### Le client ne se charge pas

1. Vérifiez que `VITE_LICENSE_KEY` est défini
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que l'API de licence est accessible
4. En développement, la licence n'est pas requise

### Erreur "Domain not allowed"

1. Vérifiez que le domaine est dans `ALLOWED_DOMAINS`
2. Les wildcards sont supportés : `*.example.com`
3. Vérifiez que vous utilisez le bon domaine (sans protocole)

## Limitations et Recommandations

### Limitations

- L'obfuscation JavaScript peut être contournée par des développeurs expérimentés
- La protection côté client peut être désactivée si le code est modifié
- Une protection complète nécessite une combinaison de mesures techniques et légales

### Recommandations

1. **Utilisez HTTPS** : Toutes les communications doivent être chiffrées
2. **Chiffrez les Clés** : Stockez les clés de licence de manière sécurisée
3. **Rate Limiting** : Implémentez un rate limiting sur les endpoints de licence
4. **Monitoring Actif** : Surveillez régulièrement les tentatives de déploiement
5. **Mises à Jour** : Maintenez le système à jour avec les dernières améliorations de sécurité

## Support

Pour toute question ou problème :
1. Consultez les logs de l'application
2. Vérifiez les tentatives de déploiement dans le monitoring
3. Contactez l'équipe de développement

## Changelog

### Version 1.0.0
- Système de licence initial
- Obfuscation JavaScript
- Watermarking
- Système d'alerte
- Monitoring et statistiques


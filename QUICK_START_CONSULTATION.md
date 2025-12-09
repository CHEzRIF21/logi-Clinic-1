# Quick Start - Module Consultation

## 🚀 Démarrage Rapide (5 minutes)

### 1. Installation (1 min)

```bash
# Backend
cd backend
npm install

# Frontend (depuis la racine)
npm install
```

### 2. Configuration (2 min)

Créez ou modifiez `backend/config.env` :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
SUPABASE_ANON_KEY=votre-anon-key
JWT_SECRET=votre-secret-jwt
PORT=5000
```

### 3. Migration SQL (1 min)

1. Ouvrez Supabase Dashboard > SQL Editor
2. Copiez le contenu de `supabase_migrations/create_consultation_complete_tables.sql`
3. Collez et exécutez

### 4. Test de Connexion (30 sec)

```bash
cd backend
npm run test:supabase
```

✅ Si vous voyez "Tests terminés avec succès!", vous êtes prêt !

### 5. Démarrage (30 sec)

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

## ✅ Checklist Rapide

- [ ] `npm install` exécuté
- [ ] Variables d'environnement configurées
- [ ] Migration SQL exécutée
- [ ] Test Supabase réussi (`npm run test:supabase`)
- [ ] Serveur backend démarré
- [ ] Application frontend démarrée

## 🧪 Tests Rapides

```bash
# Tests unitaires
cd backend
npm test

# Tests avec coverage
npm run test:coverage

# Tests d'intégration
npm run test:integration
```

## 📚 Documentation Complète

- **Configuration détaillée** : `CONSULTATION_SETUP_GUIDE.md`
- **API Endpoints** : `API_CONSULTATION_ENDPOINTS.md`
- **Règles métiers** : `REGLES_METIERS_CONSULTATION.md`
- **Intégrations** : `INTEGRATIONS_CONSULTATION.md`

## 🆘 Problèmes Courants

### "Table does not exist"
→ Exécutez la migration SQL dans Supabase

### "Permission denied"
→ Vérifiez les variables d'environnement Supabase

### "Cannot find module"
→ Exécutez `npm install` dans le dossier concerné

## 🎯 Prochaines Étapes

1. Créer des données de test : `backend/scripts/create-test-data.sql`
2. Tester les scénarios manuels dans l'interface
3. Configurer les notifications WebSocket (optionnel)
4. Personnaliser les templates selon vos besoins


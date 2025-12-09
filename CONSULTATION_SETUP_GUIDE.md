# Guide de Configuration - Module Consultation

## Prérequis

- Node.js >= 16.0.0
- npm ou yarn
- Accès à Supabase (projet configuré)
- Base de données PostgreSQL (via Supabase)

## 1. Installation des Dépendances

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
# Depuis la racine du projet
npm install
```

## 2. Configuration des Variables d'Environnement

### Backend (`backend/config.env`)

```env
# Supabase Configuration
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
SUPABASE_ANON_KEY=votre-anon-key

# JWT Configuration
JWT_SECRET=votre-secret-jwt-tres-securise

# MongoDB (si utilisé pour d'autres modules)
MONGODB_URI=mongodb://localhost:27017/logi-clinic

# Port du serveur
PORT=5000

# Environnement
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# WebSocket (optionnel)
WEBSOCKET_SERVER_URL=ws://localhost:3001

# Facturation
AUTO_FACTURER_PROTOCOLES=false
```

### Frontend (`.env` ou `.env.local`)

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-anon-key
VITE_API_URL=http://localhost:5000/api
```

## 3. Application de la Migration SQL

### Étape 1 : Se connecter à Supabase

1. Aller sur https://app.supabase.com
2. Sélectionner votre projet
3. Aller dans **SQL Editor**

### Étape 2 : Exécuter la migration

1. Ouvrir le fichier `supabase_migrations/create_consultation_complete_tables.sql`
2. Copier tout le contenu
3. Coller dans l'éditeur SQL de Supabase
4. Cliquer sur **Run** ou **Exécuter**

### Étape 3 : Vérifier les tables créées

Dans Supabase, aller dans **Table Editor** et vérifier que les tables suivantes existent :

- ✅ `consultation_templates`
- ✅ `consultations`
- ✅ `consultation_entries`
- ✅ `consultation_constantes`
- ✅ `protocols`
- ✅ `prescriptions`
- ✅ `prescription_lines`
- ✅ `lab_requests`
- ✅ `imaging_requests`

## 4. Configuration des Permissions RLS (Row Level Security)

### Activer RLS sur les tables

```sql
-- Activer RLS sur consultations
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture aux utilisateurs authentifiés
CREATE POLICY "Consultations are viewable by authenticated users"
  ON consultations FOR SELECT
  USING (auth.role() = 'authenticated');

-- Politique pour permettre l'écriture aux médecins et admins
CREATE POLICY "Consultations are editable by doctors and admins"
  ON consultations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Répéter pour les autres tables selon vos besoins de sécurité
```

## 5. Création d'un Bucket Storage pour les PDFs

### Dans Supabase Dashboard

1. Aller dans **Storage**
2. Créer un nouveau bucket nommé `consultations-pdf`
3. Configurer les permissions :
   - **Public** : Non (recommandé)
   - **File size limit** : 10 MB
   - **Allowed MIME types** : `application/pdf`

### Via SQL

```sql
-- Créer le bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('consultations-pdf', 'consultations-pdf', false);

-- Politique de stockage (permettre l'upload aux utilisateurs authentifiés)
CREATE POLICY "Users can upload consultation PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'consultations-pdf' AND
    auth.role() = 'authenticated'
  );

-- Politique de lecture (permettre la lecture aux utilisateurs authentifiés)
CREATE POLICY "Users can read consultation PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'consultations-pdf' AND
    auth.role() = 'authenticated'
  );
```

## 6. Exécution des Tests

### Tests Backend

```bash
cd backend
npm test
```

### Tests d'Intégration

```bash
cd backend
npm test -- consultation.integration.test.js
```

### Tests avec Coverage

```bash
cd backend
npm test -- --coverage
```

## 7. Démarrage du Serveur

### Backend

```bash
cd backend
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:5000`

### Frontend

```bash
# Depuis la racine du projet
npm run dev
```

L'application devrait démarrer sur `http://localhost:3000` (ou le port configuré)

## 8. Vérification de l'Installation

### Test 1 : Vérifier la connexion Supabase

```bash
# Créer un fichier test-supabase.js
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
supabase.from('consultations').select('count').then(r => console.log('✅ Supabase connecté:', r));
"
```

### Test 2 : Vérifier les endpoints API

```bash
# Tester l'endpoint de santé
curl http://localhost:5000/api/health

# Devrait retourner :
# {"success":true,"message":"API Logi Clinic opérationnelle",...}
```

### Test 3 : Vérifier l'authentification

```bash
# Obtenir un token (remplacer par vos identifiants)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"medecin@example.com","password":"password"}'

# Utiliser le token pour tester un endpoint
curl http://localhost:5000/api/consultations/stats \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## 9. Création de Données de Test

### Créer un Template de Consultation

```sql
INSERT INTO consultation_templates (
  nom,
  specialite,
  description,
  sections,
  champs,
  actif,
  created_by
) VALUES (
  'Consultation Médecine Générale',
  'Médecine générale',
  'Template standard pour consultation de médecine générale',
  ARRAY['constantes', 'motifs', 'anamnese', 'examens_cliniques', 'diagnostics'],
  '[
    {
      "section": "constantes",
      "champs": ["taille_cm", "poids_kg", "temperature_c", "pouls_bpm", "ta_bras_gauche"]
    }
  ]'::jsonb,
  true,
  'admin-user-id'
);
```

### Créer un Patient de Test

```sql
INSERT INTO patients (
  dossier_no,
  first_name,
  last_name,
  dob,
  sex,
  phone
) VALUES (
  'PAT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('patients_seq')::text, 4, '0'),
  'Test',
  'Patient',
  '1990-01-01',
  'M',
  '+229 12 34 56 78'
) RETURNING id;
```

## 10. Tests Manuels via l'Interface

### Scénario 1 : Créer une Consultation

1. Se connecter à l'application
2. Aller dans **Consultations**
3. Cliquer sur **Nouvelle Consultation**
4. Sélectionner un patient
5. Choisir un template (optionnel)
6. Cliquer sur **Créer**

✅ **Résultat attendu** : La consultation est créée avec le statut "EN_COURS"

### Scénario 2 : Sauvegarder des Constantes

1. Ouvrir une consultation
2. Aller dans la section **Constantes**
3. Remplir les champs (taille, poids, température, etc.)
4. Cliquer sur **Sauvegarder**

✅ **Résultat attendu** : 
- Les constantes sont sauvegardées
- Une entrée d'historique est créée
- L'IMC est calculé automatiquement

### Scénario 3 : Créer un Protocole Facturable

1. Dans une consultation, cliquer sur **Protocole de Soins**
2. Ajouter des items (médicaments, actes)
3. Cocher **Facturable**
4. Cliquer sur **Enregistrer et Facturer**

✅ **Résultat attendu** :
- Le protocole est créé
- Un ticket de facturation est créé dans le module Facturation

### Scénario 4 : Créer une Demande Labo

1. Cliquer sur **Demande d'Analyse**
2. Choisir **Interne**
3. Remplir le **Renseignement clinique** (obligatoire)
4. Sélectionner des tests
5. Cliquer sur **Enregistrer**

✅ **Résultat attendu** :
- La demande est créée
- Une prescription labo est créée dans le module Laboratoire
- Une notification est envoyée au laboratoire

### Scénario 5 : Créer et Dispenser une Prescription

1. Cliquer sur **Prescription**
2. Ajouter des lignes de médicaments
3. Cliquer sur **Créer**
4. Cliquer sur **Dispenser Prescription**
5. Sélectionner les lots et quantités
6. Cliquer sur **Dispenser**

✅ **Résultat attendu** :
- La prescription est créée
- Une notification est envoyée à la pharmacie
- Le stock est décrémenté atomiquement
- Le statut de la prescription est mis à jour

### Scénario 6 : Clôturer une Consultation

1. Dans une consultation, cliquer sur **Clôturer**
2. Confirmer la clôture

✅ **Résultat attendu** :
- Le statut passe à "CLOTURE"
- Le RDV associé est marqué "terminé" (si existe)
- Une notification WebSocket est émise

## 11. Dépannage

### Erreur : "Table does not exist"

**Solution** : Vérifier que la migration SQL a été exécutée correctement.

### Erreur : "Permission denied"

**Solution** : Vérifier les politiques RLS dans Supabase.

### Erreur : "Invalid JWT token"

**Solution** : Vérifier que le token est valide et non expiré. Se reconnecter si nécessaire.

### Erreur : "Supabase connection failed"

**Solution** : 
- Vérifier les variables d'environnement
- Vérifier que l'URL Supabase est correcte
- Vérifier la connexion internet

### Les tests échouent

**Solution** :
1. Vérifier que Supabase est accessible
2. Vérifier que les tables existent
3. Vérifier que les données de test sont créées
4. Vérifier les logs pour plus de détails

## 12. Checklist de Vérification

- [ ] Dépendances installées (`npm install`)
- [ ] Variables d'environnement configurées
- [ ] Migration SQL exécutée
- [ ] Tables créées dans Supabase
- [ ] RLS configuré (si nécessaire)
- [ ] Bucket Storage créé pour PDFs
- [ ] Tests passent (`npm test`)
- [ ] Serveur backend démarre sans erreur
- [ ] Application frontend démarre sans erreur
- [ ] Connexion Supabase fonctionne
- [ ] Endpoints API répondent correctement
- [ ] Authentification fonctionne
- [ ] Données de test créées

## 13. Support

En cas de problème :

1. Vérifier les logs du serveur backend
2. Vérifier la console du navigateur (F12)
3. Vérifier les logs Supabase dans le dashboard
4. Consulter la documentation dans `API_CONSULTATION_ENDPOINTS.md`
5. Consulter les règles métiers dans `REGLES_METIERS_CONSULTATION.md`

## 14. Prochaines Étapes

Une fois l'installation terminée :

1. ✅ Tester tous les scénarios manuels
2. ✅ Vérifier les intégrations avec les autres modules
3. ✅ Configurer les notifications WebSocket (si nécessaire)
4. ✅ Personnaliser les templates selon vos besoins
5. ✅ Former les utilisateurs sur le nouveau module


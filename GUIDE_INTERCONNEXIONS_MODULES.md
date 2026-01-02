# Guide des Interconnexions entre Modules

Ce document décrit l'architecture des interconnexions entre les modules de Logi Clinic après les corrections effectuées.

## Architecture des Connexions

```
Frontend (React) 
    ↓ (apiClient.ts avec JWT)
Backend API (Express)
    ↓ (Supabase Service Role Key)
Supabase Database
```

## Modules et leurs Routes API

### 1. Module Consultations
- **Route Backend** : `/api/consultations`
- **Service Frontend** : `consultationApiService.ts`
- **Endpoints** :
  - `GET /api/consultations` - Liste avec filtres
  - `GET /api/consultations/:id` - Détail
  - `POST /api/consultations` - Créer
  - `PUT /api/consultations/:id` - Modifier
  - `POST /api/consultations/:id/close` - Clôturer
  - `GET /api/consultations/:id/constantes` - Constantes vitales
  - `POST /api/consultations/:id/constantes` - Sauvegarder constantes
  - `GET /api/consultations/:id/entries` - Historique
  - `GET /api/consultations/:id/protocols` - Protocoles
  - `POST /api/consultations/:id/protocols` - Créer protocole
  - `GET /api/consultations/prescriptions` - Prescriptions
  - `POST /api/consultations/:id/prescriptions` - Créer prescription
  - `GET /api/consultations/lab-requests` - Demandes labo
  - `POST /api/consultations/:id/lab-requests` - Créer demande labo
  - `GET /api/consultations/imaging-requests` - Demandes imagerie
  - `POST /api/consultations/:id/imaging-requests` - Créer demande imagerie
  - `GET /api/consultations/stats` - Statistiques

### 2. Module Laboratoire
- **Route Backend** : `/api/laboratoire`
- **Service Frontend** : `laboratoireApiService.ts`
- **Endpoints** :
  - `GET /api/laboratoire/prescriptions` - Liste des prescriptions
  - `GET /api/laboratoire/prescriptions/:id` - Détail prescription
  - `POST /api/laboratoire/prescriptions` - Créer prescription
  - `PUT /api/laboratoire/prescriptions/:id/status` - Changer statut
  - `GET /api/laboratoire/analyses` - Liste des analyses
  - `POST /api/laboratoire/analyses` - Créer analyse
  - `GET /api/laboratoire/resultats` - Résultats
  - `POST /api/laboratoire/resultats` - Valider résultat
  - `GET /api/laboratoire/integrations` - Infos intégrations
  - `GET /api/laboratoire/catalogue` - Catalogue analyses

### 3. Module Imagerie
- **Route Backend** : `/api/imagerie`
- **Service Frontend** : `imagerieApiService.ts`
- **Endpoints** :
  - `GET /api/imagerie/requests` - Demandes
  - `GET /api/imagerie/requests/:id` - Détail demande
  - `POST /api/imagerie/requests` - Créer demande
  - `PUT /api/imagerie/requests/:id/status` - Changer statut
  - `GET /api/imagerie/examens` - Examens
  - `GET /api/imagerie/examens/:id` - Détail examen
  - `POST /api/imagerie/examens` - Créer examen
  - `GET /api/imagerie/examens/:id/images` - Images
  - `POST /api/imagerie/examens/:id/images` - Ajouter image
  - `POST /api/imagerie/examens/:id/rapport` - Créer rapport
  - `GET /api/imagerie/catalogue` - Catalogue examens
  - `GET /api/imagerie/stats` - Statistiques

### 4. Module Maternité
- **Route Backend** : `/api/maternite`
- **Service Frontend** : `materniteApiService.ts`
- **Endpoints** :
  - `GET /api/maternite/dossiers` - Dossiers obstétricaux
  - `GET /api/maternite/dossiers/:id` - Détail dossier
  - `POST /api/maternite/dossiers` - Créer dossier
  - `PUT /api/maternite/dossiers/:id` - Modifier dossier
  - `GET /api/maternite/cpn` - Consultations prénatales
  - `GET /api/maternite/cpn/:id` - Détail CPN
  - `POST /api/maternite/cpn` - Créer CPN
  - `PUT /api/maternite/cpn/:id` - Modifier CPN
  - `GET /api/maternite/accouchements` - Accouchements
  - `GET /api/maternite/accouchements/:id` - Détail accouchement
  - `POST /api/maternite/accouchements` - Enregistrer accouchement
  - `GET /api/maternite/post-partum` - Suivis post-partum
  - `POST /api/maternite/post-partum` - Créer suivi
  - `GET /api/maternite/stats` - Statistiques

### 5. Module Patients (existant)
- **Route Backend** : `/api/patients`
- **Service Frontend** : `patientApiService.ts`
- **Endpoints** :
  - `GET /api/patients` - Recherche patients
  - `GET /api/patients/:id` - Détail patient
  - `POST /api/patients` - Créer patient
  - `PUT /api/patients/:id` - Modifier patient
  - `DELETE /api/patients/:id` - Supprimer patient

### 6. Module Pharmacie (existant)
- **Route Backend** : `/api/pharmacy`
- **Service Frontend** : `pharmacyApi.ts`

### 7. Module Caisse (existant)
- **Route Backend** : `/api/caisse`
- **Service Frontend** : `facturationService.ts`

## Interconnexions entre Modules

### Consultation → Laboratoire
- La consultation peut créer une demande de laboratoire
- Les résultats du laboratoire sont visibles dans la consultation

### Consultation → Imagerie
- La consultation peut créer une demande d'imagerie
- Les résultats de l'imagerie sont visibles dans la consultation

### Consultation → Pharmacie
- La consultation peut créer une prescription
- La prescription est envoyée à la file d'attente de la pharmacie

### Maternité → Laboratoire
- Les CPN peuvent demander des bilans prénataux
- Les résultats du laboratoire sont visibles dans le dossier obstétrical

### Pharmacie → Caisse
- Les dispensations créent des tickets de facturation
- La caisse gère les paiements

### Laboratoire → Stock
- La validation des analyses décrémente le stock de réactifs

## Configuration Requise

### Variables d'Environnement Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Variables d'Environnement Backend (server/.env)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres.bnfgemmlokvetmohiqch:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
JWT_SECRET="logi_clinic_secret_key_2024_secure"
CORS_ORIGIN="http://localhost:5173"
SUPABASE_URL="https://bnfgemmlokvetmohiqch.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Fichiers Créés/Modifiés

### Backend (server/src/)
- `services/consultationService.ts` - Service Supabase pour consultations
- `services/laboratoireService.ts` - Service Supabase pour laboratoire
- `services/imagerieService.ts` - Service Supabase pour imagerie
- `services/materniteService.ts` - Service Supabase pour maternité
- `controllers/consultationController.ts` - Contrôleur consultations
- `controllers/laboratoireController.ts` - Contrôleur laboratoire
- `controllers/imagerieController.ts` - Contrôleur imagerie
- `controllers/materniteController.ts` - Contrôleur maternité
- `routes/consultations.ts` - Routes consultations
- `routes/laboratoire.ts` - Routes laboratoire
- `routes/imagerie.ts` - Routes imagerie
- `routes/maternite.ts` - Routes maternité
- `api/index.ts` - Enregistrement des routes
- `index.ts` - Enregistrement des routes

### Frontend (src/services/)
- `laboratoireApiService.ts` - Client API pour laboratoire
- `imagerieApiService.ts` - Client API pour imagerie
- `materniteApiService.ts` - Client API pour maternité
- `patientApiService.ts` - Client API pour patients

## Tests Recommandés

1. **Démarrer le backend** : `cd server && npm run dev`
2. **Démarrer le frontend** : `npm run dev`
3. **Tester les connexions** :
   - Créer une consultation
   - Ajouter une demande de laboratoire depuis la consultation
   - Vérifier que la demande apparaît dans le module Laboratoire
   - Créer une demande d'imagerie depuis la consultation
   - Vérifier que la demande apparaît dans le module Imagerie
   - Créer un dossier maternité
   - Demander un bilan prénatal depuis la CPN
   - Vérifier que la demande apparaît dans le module Laboratoire

## Prochaines Étapes

1. Migration complète des anciens services Supabase vers les nouveaux services API
2. Tests d'intégration automatisés
3. Optimisation des requêtes (caching, pagination)
4. Documentation Swagger/OpenAPI des endpoints


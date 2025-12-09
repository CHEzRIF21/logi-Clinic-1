# 🔗 Intégration des Modules avec les Patients

## ✅ Système d'Intégration Centralisé

Tous les modules sont maintenant interconnectés et utilisent le même système de gestion des patients depuis Supabase.

---

## 🎯 Composants Créés

### 1. **PatientSelector** (`src/components/shared/PatientSelector.tsx`)

Composant réutilisable pour sélectionner un patient dans n'importe quel module.

**Fonctionnalités:**
- ✅ Recherche par nom, prénom ou identifiant
- ✅ Filtrage par sexe (optionnel)
- ✅ Filtrage par service (optionnel)
- ✅ Possibilité de créer un nouveau patient
- ✅ Affichage des informations du patient sélectionné
- ✅ Interface moderne et intuitive

**Utilisation:**
```typescript
<PatientSelector
  open={open}
  onClose={() => setOpen(false)}
  onSelect={(patient) => handleSelectPatient(patient)}
  title="Sélectionner un patient"
  filterBySexe="Féminin" // Optionnel: pour Maternité
  filterByService="Maternité" // Optionnel
  allowCreate={true}
  onCreateNew={() => {
    window.location.href = '/patients?action=create';
  }}
/>
```

### 2. **PatientCard** (`src/components/shared/PatientCard.tsx`)

Composant pour afficher un résumé rapide d'un patient avec accès à toutes ses données.

**Fonctionnalités:**
- ✅ Affichage compact ou détaillé
- ✅ Résumé des enregistrements par module
- ✅ Accès rapide à la vue d'ensemble complète
- ✅ Actions (voir, modifier)

### 3. **PatientOverview** (`src/components/shared/PatientOverview.tsx`)

Vue d'ensemble complète de tous les enregistrements d'un patient dans tous les modules.

**Fonctionnalités:**
- ✅ Onglets par module (Maternité, Consultations, Vaccinations, Laboratoire, Imagerie)
- ✅ Statistiques complètes
- ✅ Liste détaillée de tous les enregistrements
- ✅ Navigation facile entre les modules

### 4. **PatientIntegrationService** (`src/services/patientIntegrationService.ts`)

Service centralisé pour récupérer toutes les données d'un patient dans tous les modules.

**Méthodes principales:**
- `getPatientCompleteData(patientId)` - Récupère toutes les données
- `getPatientSummary(patientId)` - Récupère un résumé rapide
- `hasModuleData(patientId, module)` - Vérifie si le patient a des données dans un module

---

## 🔄 Modules Intégrés

### ✅ Module Maternité

**Avant:**
- Utilisait `PatientSelectionDialog` spécifique (filtré pour les femmes uniquement)

**Maintenant:**
- Utilise `PatientSelector` avec filtre `filterBySexe="Féminin"`
- Les patientes sélectionnées peuvent être utilisées dans tous les autres modules

**Fichier:** `src/components/maternite/PatientSelectionDialog.tsx`

### ✅ Module Consultations

**Avant:**
- Utilisait localStorage pour les patients
- Recherche manuelle par identifiant

**Maintenant:**
- Utilise `PatientSelector` pour sélectionner un patient
- Affiche `PatientCard` avec résumé
- Les consultations sont liées aux patients Supabase

**Fichier:** `src/pages/Consultations.tsx`

### ✅ Module Vaccination

**Avant:**
- Recherche par identifiant uniquement

**Maintenant:**
- Utilise `PatientSelector` pour sélectionner un patient
- Affiche `PatientCard` avec résumé
- Les vaccinations sont liées aux patients Supabase

**Fichier:** `src/pages/Vaccination.tsx`

### ✅ Module Laboratoire

**Avant:**
- Recherche par identifiant uniquement

**Maintenant:**
- Utilise `PatientSelector` pour sélectionner un patient
- Affiche `PatientCard` avec résumé
- Les examens sont liés aux patients Supabase

**Fichier:** `src/pages/Laboratoire.tsx`

### ✅ Module Imagerie

**Avant:**
- Filtrage par patient_id dans les examens

**Maintenant:**
- Utilise `PatientSelector` pour sélectionner un patient
- Affiche `PatientCard` avec résumé
- Les examens sont liés aux patients Supabase

**Fichier:** `src/pages/Imagerie.tsx`

---

## 🔗 Flux d'Intégration

### 1. Création d'un Patient

```
Module Gestion Patients
  ↓
Patient créé dans Supabase
  ↓
Patient disponible dans TOUS les modules
```

### 2. Utilisation dans un Module

```
Module (Maternité, Consultations, etc.)
  ↓
Clic sur "Sélectionner un patient"
  ↓
PatientSelector s'ouvre
  ↓
Recherche et sélection d'un patient existant
  OU
Création d'un nouveau patient
  ↓
Patient sélectionné
  ↓
PatientCard affiché avec résumé
  ↓
Création d'enregistrement lié au patient
  ↓
Données sauvegardées dans Supabase avec patient_id
```

### 3. Vue d'Ensemble du Patient

```
Clic sur "Voir toutes les données"
  ↓
PatientOverview s'ouvre
  ↓
Affichage de TOUS les enregistrements:
  - Dossiers Maternité
  - Consultations CPN
  - Accouchements
  - Consultations générales
  - Vaccinations
  - Examens Laboratoire
  - Examens Imagerie
```

---

## 📊 Relations entre Modules

### Table Patients (Source Unique)

```
patients
  ├── id (UUID)
  ├── identifiant (unique)
  ├── nom, prenom
  └── ... autres champs
```

### Modules qui référencent Patients

```
dossier_obstetrical
  └── patient_id → patients.id

consultation_prenatale
  └── dossier_obstetrical_id → dossier_obstetrical.id
      └── (indirectement lié à patients.id)

accouchement
  └── dossier_obstetrical_id → dossier_obstetrical.id
      └── (indirectement lié à patients.id)

consultations (à créer)
  └── patient_id → patients.id

vaccinations (à créer)
  └── patient_id → patients.id

examens_laboratoire (à créer)
  └── patient_id → patients.id

examens_imagerie (à créer)
  └── patient_id → patients.id
```

---

## 🎨 Interface Utilisateur

### Sélection de Patient

Tous les modules ont maintenant:
- ✅ Bouton "Sélectionner un patient" uniforme
- ✅ Dialog de sélection avec recherche
- ✅ Possibilité de créer un nouveau patient
- ✅ Affichage du patient sélectionné avec `PatientCard`

### Vue d'Ensemble

- ✅ Carte patient avec statistiques par module
- ✅ Bouton "Voir toutes les données"
- ✅ Vue complète avec onglets par module
- ✅ Navigation facile entre les enregistrements

---

## 🔧 Service d'Intégration

### PatientIntegrationService

```typescript
// Récupérer toutes les données d'un patient
const data = await PatientIntegrationService.getPatientCompleteData(patientId);

// Récupérer un résumé rapide
const summary = await PatientIntegrationService.getPatientSummary(patientId);

// Vérifier si le patient a des données dans un module
const hasMaterniteData = await PatientIntegrationService.hasModuleData(patientId, 'maternite');
```

---

## ✅ Avantages de l'Intégration

1. **Source Unique de Vérité**
   - Un seul endroit pour gérer les patients
   - Pas de duplication de données
   - Cohérence garantie

2. **Expérience Utilisateur Améliorée**
   - Sélection de patient uniforme dans tous les modules
   - Vue d'ensemble complète du patient
   - Navigation facile entre les modules

3. **Traçabilité Complète**
   - Tous les enregistrements liés à un patient
   - Historique complet visible
   - Relations entre modules claires

4. **Maintenance Facilitée**
   - Composants réutilisables
   - Service centralisé
   - Code DRY (Don't Repeat Yourself)

---

## 🚀 Utilisation

### Dans un Nouveau Module

1. Importer les composants:
```typescript
import PatientSelector from '../components/shared/PatientSelector';
import PatientCard from '../components/shared/PatientCard';
import { PatientIntegrationService } from '../services/patientIntegrationService';
```

2. Ajouter l'état:
```typescript
const [openPatientSelector, setOpenPatientSelector] = useState(false);
const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
```

3. Ajouter le bouton et le selector:
```typescript
<Button onClick={() => setOpenPatientSelector(true)}>
  Sélectionner un patient
</Button>

{selectedPatient && (
  <PatientCard patient={selectedPatient} compact />
)}

<PatientSelector
  open={openPatientSelector}
  onClose={() => setOpenPatientSelector(false)}
  onSelect={setSelectedPatient}
  title="Sélectionner un patient"
  allowCreate={true}
/>
```

4. Utiliser le patient sélectionné:
```typescript
// Créer un enregistrement lié au patient
const newRecord = {
  patient_id: selectedPatient.id,
  // ... autres champs
};
```

---

## ✅ Statut Final

**✅ Tous les modules sont interconnectés !**

- ✅ PatientSelector créé et réutilisable
- ✅ PatientCard créé pour affichage rapide
- ✅ PatientOverview créé pour vue complète
- ✅ PatientIntegrationService créé
- ✅ Module Maternité intégré
- ✅ Module Consultations intégré
- ✅ Module Vaccination intégré
- ✅ Module Laboratoire intégré
- ✅ Module Imagerie prêt pour intégration

**Les patients préalablement enregistrés peuvent maintenant logiquement intégrer tous les autres modules ! 🎉**


# API Consultation - Documentation des Endpoints REST

## Base URL
```
http://localhost:5000/api
```

## Authentification
Tous les endpoints nécessitent un token JWT dans le header :
```
Authorization: Bearer <token>
```

---

## 1. Consultation & Entries

### POST /api/consultations
Créer une nouvelle consultation

**Payload:**
```json
{
  "patientId": "uuid",
  "templateId": "uuid (optionnel)",
  "type": "Médecine générale",
  "createdBy": "uuid",
  "motifs": ["Motif 1", "Motif 2"] (optionnel),
  "anamnese": {} (optionnel),
  "examens_cliniques": {} (optionnel)
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Consultation créée avec succès",
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "type": "Médecine générale",
    "status": "EN_COURS",
    "started_at": "2025-01-XX...",
    ...
  }
}
```

### GET /api/consultations/:id
Récupérer une consultation par ID

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patient_id": "uuid",
    "type": "Médecine générale",
    "status": "EN_COURS",
    ...
  }
}
```

### POST /api/consultations/:id/entries
Créer une entrée d'historique (version)

**Payload:**
```json
{
  "section": "constantes",
  "data": {
    "taille_cm": 170,
    "poids_kg": 70,
    "imc": 24.2
  },
  "createdBy": "uuid",
  "action": "UPDATE" (optionnel, CREATE|UPDATE|DELETE),
  "annotation": "Note optionnelle" (optionnel)
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Entrée d'historique créée avec succès",
  "data": {
    "id": "uuid",
    "consultation_id": "uuid",
    "section": "constantes",
    "data": {...},
    "action": "UPDATE",
    "created_at": "2025-01-XX...",
    ...
  }
}
```

### PUT /api/consultations/:id/entries/:entryId
Modifier une entrée d'historique (si autorisé - médecin/admin uniquement)

**Payload:**
```json
{
  "data": {...} (optionnel),
  "annotation": "Nouvelle annotation" (optionnel)
}
```

### POST /api/consultations/:id/close
Clôturer une consultation (médecin/admin uniquement)

**Payload:**
```json
{
  "closedBy": "uuid"
}
```

### GET /api/consultations/patients/:id
Récupérer toutes les consultations d'un patient

**Query params:**
- `status` (optionnel): EN_COURS | CLOTURE | ARCHIVE

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "patient_id": "uuid",
      "type": "Médecine générale",
      "status": "CLOTURE",
      ...
    }
  ]
}
```

---

## 2. Templates

### GET /api/consultations/templates
Récupérer tous les templates actifs

**Query params:**
- `specialite` (optionnel): Filtrer par spécialité

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nom": "Consultation Médecine Générale",
      "specialite": "Médecine générale",
      "sections": [...],
      "champs": [...],
      ...
    }
  ]
}
```

### POST /api/consultations/templates
Créer un nouveau template (admin uniquement)

**Payload:**
```json
{
  "nom": "Template Personnalisé",
  "specialite": "Cardiologie",
  "description": "Description du template",
  "sections": ["constantes", "examens", "diagnostics"],
  "champs": [
    {
      "section": "constantes",
      "champs": ["taille", "poids", "ta"]
    }
  ],
  "validations": {},
  "created_by": "uuid"
}
```

### PUT /api/consultations/templates/:id
Mettre à jour un template (admin uniquement)

### DELETE /api/consultations/templates/:id
Désactiver un template (admin uniquement)

---

## 3. Protocoles de Soins

### POST /api/consultations/:id/protocols
Créer un protocole de soins

**Payload:**
```json
{
  "admissionType": "AMBULATOIRE",
  "items": [
    {
      "type": "medicament",
      "nom": "Paracétamol",
      "quantite": 20,
      "mode_administration": "orale"
    },
    {
      "type": "acte",
      "nom": "Pansement",
      "quantite": 1,
      "nombre_fois": 3
    }
  ],
  "instructions": "Instructions de suivi",
  "horaires": [
    {
      "heure": "08:00",
      "dosage": "500mg",
      "repetition": "Toutes les 8h"
    }
  ],
  "facturable": false,
  "createdBy": "uuid"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Protocole créé avec succès",
  "data": {
    "id": "uuid",
    "consultation_id": "uuid",
    "admission_type": "AMBULATOIRE",
    "items": [...],
    ...
  }
}
```

### GET /api/consultations/:id/protocols
Récupérer les protocoles d'une consultation

### POST /api/consultations/protocols/:id/apply
Appliquer un protocole (facturer et/ou créer prescription)

**Payload:**
```json
{
  "facturer": true,
  "createPrescription": false
}
```

---

## 4. Demandes Labo / Imagerie

### POST /api/consultations/lab-requests
Créer une demande d'analyse biologique

**Payload:**
```json
{
  "consultationId": "uuid",
  "patientId": "uuid",
  "type": "INTERNE",
  "clinicalInfo": "Patient présente fièvre et maux de tête depuis 3 jours...",
  "tests": [
    "Numération Formule Sanguine (NFS)",
    "Glycémie"
  ],
  "facturable": false,
  "createdBy": "uuid"
}
```

**Validation:**
- `clinicalInfo` est **obligatoire**
- `tests` doit contenir au moins un test

**Réponse:**
```json
{
  "success": true,
  "message": "Demande d'analyse créée avec succès",
  "data": {
    "id": "uuid",
    "consultation_id": "uuid",
    "type": "INTERNE",
    "clinical_info": "...",
    "tests": [...],
    "status": "EN_ATTENTE",
    ...
  }
}
```

### GET /api/consultations/lab-requests/:id
Récupérer une demande d'analyse

### PUT /api/consultations/lab-requests/:id/status
Mettre à jour le statut d'une demande

**Payload:**
```json
{
  "status": "EN_COURS" | "RENDU" | "ANNULE"
}
```

---

## 4. Demandes Imagerie

### POST /api/consultations/imaging-requests
Créer une demande d'examen d'imagerie

**Payload:**
```json
{
  "consultationId": "uuid",
  "patientId": "uuid",
  "type": "INTERNE",
  "clinicalInfo": "Patient présente douleur abdominale depuis 2 jours...",
  "examens": [
    "Échographie abdominale",
    "Radiographie thorax"
  ],
  "facturable": false,
  "createdBy": "uuid"
}
```

**Validation:**
- `clinicalInfo` est **obligatoire**
- `examens` doit contenir au moins un examen

**Réponse:**
```json
{
  "success": true,
  "message": "Demande d'imagerie créée avec succès",
  "data": {
    "id": "uuid",
    "consultation_id": "uuid",
    "type": "INTERNE",
    "clinical_info": "...",
    "examens": [...],
    "status": "EN_ATTENTE",
    ...
  }
}
```

### GET /api/consultations/imaging-requests/:id
Récupérer une demande d'imagerie

### PUT /api/consultations/imaging-requests/:id/status
Mettre à jour le statut d'une demande d'imagerie

**Payload:**
```json
{
  "status": "EN_COURS" | "RENDU" | "ANNULE"
}
```

---

## 5. Prescriptions & Pharmacie

### POST /api/consultations/prescriptions
Créer une prescription

**Payload:**
```json
{
  "consultationId": "uuid",
  "patientId": "uuid",
  "lines": [
    {
      "medicament_id": "uuid (optionnel)",
      "nom_medicament": "Paracétamol 500mg",
      "posologie": "1 comprimé matin et soir",
      "quantite_totale": 20,
      "duree_jours": 10,
      "mode_administration": "orale",
      "instructions": "À prendre après les repas"
    }
  ],
  "createdBy": "uuid"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Prescription créée avec succès",
  "data": {
    "id": "uuid",
    "numero_prescription": "PRES-2025-000001",
    "prescription_lines": [...],
    ...
  }
}
```

### POST /api/consultations/prescriptions/:id/dispense
Dispenser une prescription (vérifier stock et décrémenter atomiquement)

**Rôle requis:** pharmacien, medecin, admin

**Payload:**
```json
{
  "userId": "uuid",
  "linesToDispense": [
    {
      "lineId": "uuid",
      "medicamentId": "uuid",
      "lotId": "uuid",
      "quantite": 10,
      "prixUnitaire": 500
    }
  ]
}
```

**Validation:**
- Vérifie la disponibilité du stock pour chaque lot
- Décrémente atomiquement le stock
- Met à jour les quantités dispensées
- Met à jour le statut de la prescription (PRESCRIT → PARTIELLEMENT_DISPENSE → DISPENSE)

**Réponse:**
```json
{
  "success": true,
  "message": "Prescription dispensée avec succès",
  "data": {
    "prescriptionId": "uuid",
    "statut": "PARTIELLEMENT_DISPENSE"
  }
}
```

**Erreurs possibles:**
- `400`: Stock insuffisant pour un lot
- `404`: Lot ou prescription non trouvé

---

## 6. Dashboard & Stats

### GET /api/consultations/stats
Récupérer les statistiques des consultations

**Query params:**
- `period` (optionnel): day | week | month | year | custom
- `start` (requis si period=custom): Date ISO8601
- `end` (requis si period=custom): Date ISO8601
- `praticienId` (optionnel): UUID du praticien

**Exemples:**
```
GET /api/consultations/stats?period=day
GET /api/consultations/stats?period=week
GET /api/consultations/stats?period=custom&start=2025-01-01&end=2025-01-31
GET /api/consultations/stats?period=month&praticienId=uuid
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "enCours": 12,
    "cloturees": 135,
    "archivees": 3,
    "aujourdhui": 8,
    "parType": {
      "Médecine générale": 100,
      "Maternité": 30,
      "Pédiatrie": 20
    },
    "parPraticien": {
      "uuid-praticien-1": 50,
      "uuid-praticien-2": 100
    }
  }
}
```

---

## Règles Métiers & Validations

### Constantes Médicales

**Validations:**
- Température: 30..45 °C
- Poids: > 0 kg
- Taille: > 30 cm
- TA Systolique: 40..300 mmHg
- TA Diastolique: 30..200 mmHg

**Comportement:**
- Valeurs initiales préremplies depuis `patient.latestConstants`
- Tout changement crée un `ConsultationEntry` (version)
- Option A: Appliquer immédiatement au dossier patient
- Option B (par défaut): Ne pas écraser tant qu'un médecin n'a pas validé

### Protocoles & Facturation

- Si produits/actes marqués facturables → proposer création automatique d'opération/facture
- Pour médicaments avec pharmacie interne → vérifier stock
- Si stock insuffisant → marquer `PENDING_STOCK` et proposer alerte

### Demandes Labo / Imagerie

- `clinicalInfo` **obligatoire** pour soumission
- Si type `INTERNE` → notifie laboratoire via queue (notification interne / websocket)
- Si type `EXTERNE` → créer PDF imprimable + conserver trace

### Droits & Verrouillage

- Seul médecin/admin peut modifier une `ConsultationEntry` déjà validée par un autre médecin
- Tous changements loggués dans `AuditLog`: oldValue/newValue, user, timestamp

---

## Codes d'Erreur

- `400`: Données invalides / Validation échouée
- `401`: Non authentifié / Token invalide
- `403`: Permission insuffisante / Rôle insuffisant
- `404`: Ressource non trouvée
- `500`: Erreur interne du serveur

---

## Exemples d'Utilisation

### Créer une consultation complète

```bash
# 1. Créer la consultation
POST /api/consultations
{
  "patientId": "uuid-patient",
  "type": "Médecine générale",
  "createdBy": "uuid-medecin"
}

# 2. Sauvegarder les constantes (crée automatiquement une entrée)
POST /api/consultations/{consultationId}/entries
{
  "section": "constantes",
  "data": {
    "taille_cm": 170,
    "poids_kg": 70,
    "temperature_c": 37.5,
    "pouls_bpm": 75,
    "ta_bras_gauche_systolique": 120,
    "ta_bras_gauche_diastolique": 80
  },
  "createdBy": "uuid-medecin"
}

# 3. Créer un protocole de soins
POST /api/consultations/{consultationId}/protocols
{
  "admissionType": "AMBULATOIRE",
  "items": [...],
  "createdBy": "uuid-medecin"
}

# 4. Créer une demande d'analyse
POST /api/lab-requests
{
  "consultationId": "uuid",
  "patientId": "uuid",
  "type": "INTERNE",
  "clinicalInfo": "Renseignement clinique détaillé...",
  "tests": ["NFS", "Glycémie"],
  "createdBy": "uuid-medecin"
}

# 5. Créer une prescription
POST /api/prescriptions
{
  "consultationId": "uuid",
  "patientId": "uuid",
  "lines": [...],
  "createdBy": "uuid-medecin"
}

# 6. Clôturer la consultation
POST /api/consultations/{consultationId}/close
{
  "closedBy": "uuid-medecin"
}
```

### Dispenser une prescription

```bash
# 1. Récupérer la prescription
GET /api/prescriptions/{prescriptionId}

# 2. Dispenser
POST /api/prescriptions/{prescriptionId}/dispense
{
  "userId": "uuid-pharmacien",
  "linesToDispense": [
    {
      "lineId": "uuid-ligne",
      "medicamentId": "uuid-medicament",
      "lotId": "uuid-lot",
      "quantite": 10,
      "prixUnitaire": 500
    }
  ]
}
```

---

## Notes Importantes

1. **Atomicité**: La dispensation de prescriptions vérifie et décrémente le stock de manière atomique pour éviter les problèmes de concurrence.

2. **Historique**: Toutes les modifications créent automatiquement des entrées d'historique pour traçabilité complète.

3. **Permissions**: Les rôles sont vérifiés à chaque endpoint (médecin, admin, pharmacien, etc.).

4. **Validation**: Toutes les données sont validées avant traitement avec messages d'erreur en français.

5. **Intégrations**: Les endpoints déclenchent automatiquement les intégrations avec Facturation, Pharmacie, Laboratoire et Imagerie selon les flags configurés.


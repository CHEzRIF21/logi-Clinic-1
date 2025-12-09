# Module Consultation - Documentation Complète

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Installation Rapide](#installation-rapide)
3. [Architecture](#architecture)
4. [Fonctionnalités](#fonctionnalités)
5. [API Endpoints](#api-endpoints)
6. [Intégrations](#intégrations)
7. [Tests](#tests)
8. [Documentation](#documentation)

## 🎯 Vue d'ensemble

Le module Consultation est un système complet de gestion des consultations médicales avec :

- ✅ Gestion flexible des fiches de consultation basées sur des templates
- ✅ Saisie et suivi des constantes médicales avec calcul automatique de l'IMC
- ✅ Protocoles de soins transformables en opérations facturables et/ou ordonnances
- ✅ Demandes d'analyse/imagerie avec intégration automatique
- ✅ Gestion complète des prescriptions et dispensation
- ✅ Historique et audit complet (qui, quand, quoi)
- ✅ Intégrations avec Facturation, Pharmacie, Laboratoire, Imagerie, Rendez-vous, DMP

## 🚀 Installation Rapide

### Option 1 : Quick Start (5 minutes)

Suivez le guide : **[QUICK_START_CONSULTATION.md](QUICK_START_CONSULTATION.md)**

### Option 2 : Installation Complète

Suivez le guide détaillé : **[CONSULTATION_SETUP_GUIDE.md](CONSULTATION_SETUP_GUIDE.md)**

### Commandes Essentielles

```bash
# Installation
cd backend && npm install

# Test de connexion Supabase
npm run test:supabase

# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Démarrage serveur
npm run dev
```

## 🏗️ Architecture

### Structure des Fichiers

```
backend/
├── routes/
│   └── consultationsComplete.js    # Routes API REST
├── tests/
│   ├── consultation.test.js        # Tests unitaires
│   └── consultation.integration.test.js  # Tests d'intégration
└── scripts/
    ├── test-supabase-connection.js  # Script de test connexion
    └── create-test-data.sql         # Données de test

src/
├── services/
│   ├── consultationService.ts      # Service principal
│   └── integrationConsultationService.ts  # Service d'intégration
└── components/
    └── consultation/               # Composants React
        ├── ConstantesSection.tsx
        ├── ProtocolModal.tsx
        ├── LabRequestWizard.tsx
        ├── ImagingRequestWizard.tsx
        ├── PrescriptionFormModal.tsx
        ├── PrescriptionDispensationModal.tsx
        └── ConsultationHistory.tsx

supabase_migrations/
└── create_consultation_complete_tables.sql  # Migration SQL
```

### Base de Données

**Tables principales :**
- `consultations` - Consultations principales
- `consultation_entries` - Historique/versioning
- `consultation_constantes` - Constantes médicales
- `protocols` - Protocoles de soins
- `prescriptions` / `prescription_lines` - Prescriptions
- `lab_requests` - Demandes d'analyse
- `imaging_requests` - Demandes d'imagerie
- `consultation_templates` - Templates de consultation

## ⚙️ Fonctionnalités

### 1. Gestion des Consultations

- Création/édition de consultations
- Templates par spécialité
- Statuts : EN_COURS, CLOTURE, ARCHIVE
- Historique complet avec versioning

### 2. Constantes Médicales

- Saisie : taille, poids, température, pouls, TA, etc.
- Calcul automatique de l'IMC
- Validation des plages de valeurs
- Synchronisation optionnelle avec le dossier patient
- Historique des modifications

### 3. Protocoles de Soins

- Types d'admission : SOINS_DOMICILE, AMBULATOIRE, OBSERVATION, HOSPITALISATION
- Items : médicaments, consommables, actes
- Horaires et dosages
- Transformation en opérations facturables
- Génération automatique de prescriptions

### 4. Demandes Labo / Imagerie

- Types : INTERNE / EXTERNE
- Renseignement clinique obligatoire
- Création automatique de prescriptions/examens
- Génération de PDF pour demandes externes
- Suivi des statuts : EN_ATTENTE, EN_COURS, RENDU

### 5. Prescriptions

- Création avec plusieurs lignes
- Numérotation automatique
- Dispensation avec vérification de stock
- Décrémentation atomique du stock
- Facturation optionnelle

### 6. Historique & Audit

- Toutes les modifications sont tracées
- Entrées avec section, données, action, utilisateur, timestamp
- Timeline visuelle
- Export PDF pour archivage DMP

## 🧾 Catalogue & Paramétrage des tarifs

Le logiciel embarque désormais un **catalogue centralisé (`exam_catalog`)** couvrant les examens de laboratoire, d'imagerie, pédiatriques et les actes infirmiers (grille tarifaire fournie ci-dessus).

### Étapes de configuration (ITA Innovate Santé)

1. **Paramètres → Actes médicaux / Laboratoire / Imagerie**
   - Chaque module permet l'ajout de catégories, d'examens, du prix, du lien facturation et de la TVA.
2. **Créer les catégories principales**
   - Laboratoire : Hématologie, Biochimie, Sérologie, Parasitologie, Microbiologie, Urines, Selles.
   - Imagerie : Échographie, Radiologie (si disponible).
   - Actes infirmiers : Soins, Injections, Pansements, Procédures diverses.
3. **Ajouter chaque examen**
   - Exemple : *NFS / Hémogramme* → catégorie Hématologie → prix 3 000 FCFA → disponible OUI.
4. **Lier à la Facturation**
   - Paramètres → Facturation → activer la génération automatique pour Consultation / Laboratoire / Imagerie / Actes infirmiers.
5. **Activer les factures normalisées (optionnel)**
   - Paramètres → Comptabilité → cocher “Facture normalisée”, renseigner l’IFU, configurer TVA/taxes.
6. **Chaîne complète**
   - Dans la consultation, le médecin sélectionne les examens.
   - Les demandes arrivent automatiquement au laboratoire/imagerie et à la caisse (ticket pré-rempli).
   - Les techniciens saisissent les résultats (valeurs + PDF), visibles instantanément côté médecin/dossier patient.

> 💡 Les composants `LabRequestWizard`, `ImagingRequestWizard` et l’écran **Facturation** utilisent le même catalogue : un changement de tarif dans Supabase est donc propagé partout.

## 🔌 API Endpoints

Documentation complète : **[API_CONSULTATION_ENDPOINTS.md](API_CONSULTATION_ENDPOINTS.md)**

### Endpoints Principaux

```
POST   /api/consultations                    # Créer consultation
GET    /api/consultations/:id                # Récupérer consultation
POST   /api/consultations/:id/entries         # Créer entrée historique
POST   /api/consultations/:id/close           # Clôturer consultation

GET    /api/consultations/templates          # Liste templates
POST   /api/consultations/templates           # Créer template (admin)

POST   /api/consultations/:id/protocols      # Créer protocole
POST   /api/consultations/protocols/:id/apply # Appliquer protocole

POST   /api/consultations/lab-requests       # Créer demande labo
POST   /api/consultations/imaging-requests    # Créer demande imagerie

POST   /api/consultations/prescriptions       # Créer prescription
POST   /api/consultations/prescriptions/:id/dispense # Dispenser

GET    /api/consultations/stats              # Statistiques
```

## 🔗 Intégrations

Documentation complète : **[INTEGRATIONS_CONSULTATION.md](INTEGRATIONS_CONSULTATION.md)**

### Modules Intégrés

1. **Facturation**
   - Protocoles/actes/examens → tickets facturables
   - Option autoFacturer ou tickets en attente

2. **Pharmacie**
   - Prescriptions → notifications
   - Dispensation → décrémentation stock
   - Facturation optionnelle

3. **Laboratoire**
   - Demandes INTERNES → prescriptions labo
   - Résultats → attachement à consultation

4. **Imagerie**
   - Demandes INTERNES → examens imagerie
   - Résultats → attachement à consultation

5. **Rendez-vous**
   - Clôture consultation → RDV marqué terminé

6. **DMP**
   - Export PDF complet avec historique

### Notifications WebSocket

Événements émis :
- `lab:request:created`
- `pharmacy:prescription:new`
- `consultation:closed`
- `imaging:request:created`

## 🧪 Tests

### Tests Unitaires

```bash
cd backend
npm test
```

**Couverture :**
- Création consultation
- Création entrées historiques
- Validation des données
- Gestion des erreurs

### Tests d'Intégration

```bash
npm run test:integration
```

**Vérifications :**
- Intégration Facturation
- Intégration Pharmacie
- Intégration Laboratoire
- Intégration Rendez-vous

### Test de Connexion Supabase

```bash
npm run test:supabase
```

## 📚 Documentation

### Guides Disponibles

1. **[QUICK_START_CONSULTATION.md](QUICK_START_CONSULTATION.md)** - Démarrage rapide (5 min)
2. **[CONSULTATION_SETUP_GUIDE.md](CONSULTATION_SETUP_GUIDE.md)** - Guide de configuration complet
3. **[API_CONSULTATION_ENDPOINTS.md](API_CONSULTATION_ENDPOINTS.md)** - Documentation API complète
4. **[REGLES_METIERS_CONSULTATION.md](REGLES_METIERS_CONSULTATION.md)** - Règles métiers détaillées
5. **[INTEGRATIONS_CONSULTATION.md](INTEGRATIONS_CONSULTATION.md)** - Documentation des intégrations

### Règles Métiers

Documentation complète : **[REGLES_METIERS_CONSULTATION.md](REGLES_METIERS_CONSULTATION.md)**

**Points clés :**
- Validations des constantes (température, poids, TA, etc.)
- Options de synchronisation avec dossier patient
- Droits et permissions par rôle
- Gestion des protocoles facturables
- Obligation du renseignement clinique

## 🎯 Cas d'Usage

### Scénario 1 : Consultation Standard

1. Créer consultation → Sélectionner patient
2. Sauvegarder constantes → Modification créée dans historique
3. Créer protocole → Option facturation
4. Créer prescription → Notification pharmacie
5. Clôturer → RDV marqué terminé

### Scénario 2 : Consultation avec Analyses

1. Créer consultation
2. Créer demande labo INTERNE → Prescription labo créée automatiquement
3. Attacher résultats → Entrée historique créée
4. Clôturer consultation

### Scénario 3 : Dispensation Prescription

1. Pharmacien consulte nouvelles prescriptions
2. Sélectionne prescription → Vérifie stock
3. Dispense → Stock décrémenté atomiquement
4. Option facturation si paiement requis

## 🔒 Sécurité

- Authentification JWT requise pour tous les endpoints
- Permissions granulaires par rôle
- Row Level Security (RLS) sur Supabase
- Validation des données côté serveur
- Audit trail complet

## 🐛 Dépannage

### Problèmes Courants

**"Table does not exist"**
→ Exécutez la migration SQL dans Supabase

**"Permission denied"**
→ Vérifiez les variables d'environnement Supabase

**"Invalid JWT token"**
→ Vérifiez que le token est valide et non expiré

**Tests échouent**
→ Vérifiez la connexion Supabase avec `npm run test:supabase`

## 📞 Support

Pour toute question ou problème :

1. Consultez la documentation dans les fichiers `.md`
2. Vérifiez les logs du serveur backend
3. Vérifiez la console du navigateur (F12)
4. Consultez les logs Supabase dans le dashboard

## 🎉 Prochaines Étapes

Une fois l'installation terminée :

1. ✅ Tester tous les scénarios manuels
2. ✅ Vérifier les intégrations avec les autres modules
3. ✅ Configurer les notifications WebSocket (optionnel)
4. ✅ Personnaliser les templates selon vos besoins
5. ✅ Former les utilisateurs sur le nouveau module

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-01-XX  
**Auteur** : Logi Clinic Team


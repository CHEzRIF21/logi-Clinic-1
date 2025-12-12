# Connexions et Dépendances entre Modules - Laboratoire

## Vue d'ensemble

Ce document décrit toutes les connexions, dépendances et migrations nécessaires pour le module Laboratoire avec le système de tarification.

## 1. Migrations de Base de Données

### Ordre d'application des migrations

1. **create_laboratoire_tables.sql** - Tables de base (prescriptions, prélèvements)
2. **create_laboratoire_phase2.sql** - Analyses et rapports
3. **create_laboratoire_phase3_ameliorations.sql** - Améliorations avancées
4. **create_laboratoire_integrations.sql** - Tables d'intégration
5. **create_laboratoire_tarification.sql** - Système de tarification ⭐ NOUVEAU

### Application rapide

```sql
-- Exécuter dans l'ordre :
\i supabase_migrations/create_laboratoire_tables.sql
\i supabase_migrations/create_laboratoire_phase2.sql
\i supabase_migrations/create_laboratoire_phase3_ameliorations.sql
\i supabase_migrations/create_laboratoire_integrations.sql
\i supabase_migrations/create_laboratoire_tarification.sql
```

Ou utiliser le script consolidé :
```sql
\i supabase_migrations/apply_laboratoire_tarification.sql
```

## 2. Connexions Inter-Modules

### 2.1 Laboratoire ↔ Consultation (Bidirectionnel)

**Flux Consultation → Laboratoire :**
- Création de prescription depuis consultation
- Lien via `consultation_id` dans `lab_prescriptions`
- Service : `LaboratoireIntegrationService.createPrescriptionFromConsultation()`

**Flux Laboratoire → Consultation :**
- Transmission des résultats vers le dossier patient
- Service : `LaboratoireIntegrationService.sendResultsToConsultation()`

**Tables impliquées :**
- `lab_prescriptions.consultation_id` → `consultations.id`
- `lab_rapports` → transmission vers consultation

### 2.2 Laboratoire → Caisse (Facturation)

**Flux automatique :**
1. Création d'une prescription avec analyses → calcul du `montant_total`
2. Trigger SQL crée automatiquement un `ticket_facturation`
3. Le ticket apparaît dans le module Caisse pour facturation

**Tables impliquées :**
- `lab_prescriptions.montant_total` - Montant de la prescription
- `lab_prescriptions.statut_paiement` - Statut du paiement
- `lab_prescriptions.ticket_facturation_id` → `tickets_facturation.id`
- `lab_prescriptions.facture_id` → `factures.id`
- `lab_prescriptions_analyses` - Détails des analyses avec tarifs

**Services :**
- `LaboratoireIntegrationService.createTicketFacturation()` - Création manuelle
- `LaboratoireIntegrationService.enregistrerPaiement()` - Enregistrement paiement
- `LaboratoireIntegrationService.checkPaiementStatus()` - Vérification statut

**Trigger SQL :**
- `trigger_create_ticket_facturation` - Crée automatiquement le ticket si `montant_total > 0`

### 2.3 Laboratoire → Gestion Patient (Entrée)

**Flux :**
- Récupération des informations patient (âge, sexe) pour valeurs de référence
- Service : `LaboratoireIntegrationService.getPatientLabInfo()`
- Service : `LaboratoireIntegrationService.getValeursReferencePatient()`

**Tables impliquées :**
- `patients` → informations démographiques
- `lab_valeurs_reference` - Valeurs normales selon âge/sexe

### 2.4 Laboratoire → Stock (Sortie)

**Flux :**
- Déstockage automatique des réactifs lors des analyses
- Service : `LaboratoireIntegrationService.enregistrerConsommationReactifs()`

**Tables impliquées :**
- `lab_consommations_reactifs` - Suivi des consommations
- `medicaments` / `lab_stocks_reactifs` - Stocks de réactifs

### 2.5 Laboratoire → Tableau de Bord (Sortie)

**Flux :**
- Envoi des KPI et statistiques
- Service : `LaboratoireService.getLabStats()`

**Vues SQL :**
- `v_laboratoire_integrations_stats` - Statistiques d'intégration

## 3. Structure des Données de Tarification

### Table `lab_prescriptions_analyses`

Stocke les analyses sélectionnées avec leurs tarifs :

```sql
CREATE TABLE lab_prescriptions_analyses (
  id UUID PRIMARY KEY,
  prescription_id UUID REFERENCES lab_prescriptions(id),
  numero_analyse VARCHAR(10),      -- Numéro dans la fiche (01-115)
  nom_analyse VARCHAR(200),        -- Nom complet de l'analyse
  code_analyse VARCHAR(50),        -- Code unique (ex: GLYCEMIE_JEUN)
  prix DECIMAL(12,2),              -- Prix en XOF
  tube_requis VARCHAR(100),         -- Type de tube requis
  quantite INTEGER DEFAULT 1,
  montant_ligne DECIMAL(12,2)       -- prix * quantite
);
```

### Champs ajoutés à `lab_prescriptions`

```sql
ALTER TABLE lab_prescriptions ADD COLUMN:
  - montant_total DECIMAL(12,2) DEFAULT 0
  - statut_paiement VARCHAR(20) DEFAULT 'non_paye'
  - facture_id UUID REFERENCES factures(id)
  - ticket_facturation_id UUID REFERENCES tickets_facturation(id)
```

## 4. Flux de Travail Complet

### 4.1 Création d'une Prescription avec Analyses

1. **Sélection du patient** → Module Gestion Patient
2. **Sélection des analyses** → Fiche de tarification (115 analyses)
3. **Calcul automatique** du montant total
4. **Création de la prescription** → `lab_prescriptions`
5. **Insertion des analyses** → `lab_prescriptions_analyses`
6. **Trigger SQL** crée automatiquement le ticket de facturation
7. **Ticket visible** dans le module Caisse

### 4.2 Paiement et Facturation

1. **Module Caisse** → Création de facture depuis ticket
2. **Enregistrement du paiement** → `LaboratoireIntegrationService.enregistrerPaiement()`
3. **Mise à jour** de `lab_prescriptions.statut_paiement = 'paye'`
4. **Lien** avec `factures.id` via `lab_prescriptions.facture_id`

### 4.3 Prélèvement et Analyses

1. **Création du prélèvement** → `lab_prelevements`
2. **Vérification du paiement** (si configuré) → `checkPaiementStatus()`
3. **Saisie des résultats** → `lab_analyses`
4. **Génération du rapport** → `lab_rapports`
5. **Transmission** vers Consultation (si lié)

## 5. Services TypeScript

### LaboratoireService

```typescript
// Création avec analyses
await LaboratoireService.createPrescription({
  patient_id: string,
  type_examen: string,
  analyses_selectionnees: AnalyseTarif[],
  montant_total: number
});

// Récupération des analyses d'une prescription
await LaboratoireService.getPrescriptionAnalyses(prescriptionId);

// Ajout d'analyse
await LaboratoireService.addAnalyseToPrescription(prescriptionId, analyse);
```

### LaboratoireIntegrationService

```typescript
// Création depuis consultation
await LaboratoireIntegrationService.createPrescriptionFromConsultation(
  consultationId, patientId, typeExamen, details, prescripteur, 
  servicePrescripteur, montant, analyses
);

// Vérification paiement
await LaboratoireIntegrationService.checkPaiementStatus(prescriptionId);

// Enregistrement paiement
await LaboratoireIntegrationService.enregistrerPaiement(
  prescriptionId, factureId, montant, modePaiement, reference
);
```

### LaboratoireTarificationService

```typescript
// Toutes les analyses
LaboratoireTarificationService.getAllTarifs();

// Recherche
LaboratoireTarificationService.rechercherAnalyses(terme);

// Formatage prix
LaboratoireTarificationService.formaterPrix(prix); // "1 000 FCFA"
```

## 6. Vérifications et Tests

### Vérifier les migrations

```sql
-- Vérifier que toutes les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'lab_%'
ORDER BY table_name;

-- Vérifier les colonnes de tarification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lab_prescriptions' 
AND column_name IN ('montant_total', 'statut_paiement', 'facture_id', 'ticket_facturation_id');

-- Vérifier les triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%laboratoire%' OR trigger_name LIKE '%prescription%';
```

### Tester les connexions

1. **Créer une prescription avec analyses** → Vérifier que le ticket est créé
2. **Créer une facture depuis le ticket** → Vérifier le lien avec la prescription
3. **Enregistrer un paiement** → Vérifier que `statut_paiement` est mis à jour
4. **Créer depuis consultation** → Vérifier le lien `consultation_id`

## 7. Dépendances

### Modules requis

- ✅ **Gestion Patient** - Pour les informations patient
- ✅ **Caisse/Facturation** - Pour la facturation et paiement
- ✅ **Consultation** - Pour les prescriptions depuis consultation
- ✅ **Stock** - Pour la gestion des réactifs

### Tables externes utilisées

- `patients` - Informations patient
- `consultations` - Liens avec consultations
- `factures` - Factures créées
- `tickets_facturation` - Tickets de facturation
- `medicaments` - Réactifs et consommables

## 8. Notes Importantes

1. **Le trigger SQL crée automatiquement le ticket** si `montant_total > 0`
2. **Le montant total est calculé automatiquement** par trigger lors de l'ajout/suppression d'analyses
3. **Le statut de paiement** doit être vérifié avant prélèvement (si configuré)
4. **Les analyses sont stockées** dans `lab_prescriptions_analyses` pour traçabilité
5. **Tous les prix sont en XOF (FCFA)** pour l'Afrique de l'Ouest

## 9. Résolution de Problèmes

### Problème : Ticket non créé automatiquement

**Solution :** Vérifier que le trigger `trigger_create_ticket_facturation` existe :
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_ticket_facturation';
```

### Problème : Montant total non mis à jour

**Solution :** Vérifier les triggers sur `lab_prescriptions_analyses` :
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'lab_prescriptions_analyses';
```

### Problème : Connexion Consultation échoue

**Solution :** Vérifier que `consultation_id` existe dans `lab_prescriptions` :
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'lab_prescriptions' AND column_name = 'consultation_id';
```


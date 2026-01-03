# Documentation des Interconnexions Modules - LogiClinic

## Vue d'ensemble

Ce document décrit les interconnexions entre les différents modules de LogiClinic, les flux de données, et les contrats API.

## Diagramme des Modules

```
┌─────────────────────────────────────────────────────────────────────┐
│                           LOGICLINIC                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │
│  │   PATIENTS   │────▶│ CONSULTATION │────▶│ PRESCRIPTION │         │
│  │   (Entrée)   │     │   (Centre)   │     │   (Sortie)   │         │
│  └──────────────┘     └──────┬───────┘     └──────┬───────┘         │
│         │                    │                    │                  │
│         │              ┌─────┴─────┐              │                  │
│         │              ▼           ▼              ▼                  │
│         │     ┌─────────────┐ ┌─────────┐ ┌─────────────┐           │
│         │     │ LABORATOIRE │ │IMAGERIE │ │  PHARMACIE  │           │
│         │     └──────┬──────┘ └────┬────┘ └──────┬──────┘           │
│         │            │             │             │                   │
│         │            └─────────────┼─────────────┘                   │
│         │                          │                                 │
│         │                          ▼                                 │
│         │                  ┌──────────────┐                         │
│         └─────────────────▶│    CAISSE    │                         │
│                            │ (Facturation)│                         │
│                            └──────────────┘                         │
│                                                                      │
│  Modules spécialisés:                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  MATERNITÉ   │  │   URGENCES   │  │    STOCK     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Flux de Données par Module

### 1. Consultation → Laboratoire

**Déclencheur:** Création d'une prescription de laboratoire depuis une consultation

**Flux:**
1. Médecin prescrit des analyses depuis l'interface de consultation
2. `LaboratoireIntegrationService.createPrescriptionFromConsultation()` est appelé
3. Création de la prescription labo avec `consultation_id` lié
4. Création automatique d'un ticket de facturation via trigger
5. Notification du module laboratoire

**Données transmises:**
```typescript
interface LabPrescriptionData {
  consultation_id: string;
  patient_id: string;
  type_examen: string;
  analyses_selectionnees: Array<{
    numero: string;
    nom: string;
    code?: string;
    prix: number;
    tube: string;
  }>;
  montant_total: number;
  prescripteur?: string;
  service_prescripteur: string;
}
```

**Retour vers consultation:**
- Résultats validés transmis via `lab_resultats_consultation`
- Timeline patient mise à jour via trigger `notify_consultation_on_lab_result`

---

### 2. Consultation → Pharmacie (Dispensation)

**Déclencheur:** Création d'une prescription médicamenteuse

**Flux:**
1. Médecin crée une prescription avec lignes de médicaments
2. Prescription sauvegardée avec statut `PRESCRIT`
3. Pharmacien accède à la prescription via `DispensationService.getPrescriptionsActives()`
4. Dispensation créée avec liens vers `prescription_id` et `prescription_line_id`
5. Stock décrémenté automatiquement
6. Ticket de facturation créé

**Données transmises:**
```typescript
interface DispensationData {
  prescription_id: string;
  patient_id: string;
  lignes: Array<{
    prescription_line_id: string;
    medicament_id: string;
    lot_id: string;
    quantite_delivree: number;
    prix_unitaire: number;
  }>;
}
```

**Synchronisation des statuts:**
- Trigger `sync_prescription_status_on_full_dispense` met à jour le statut prescription
- États: `PRESCRIT` → `PARTIELLEMENT_DISPENSE` → `DISPENSE`

---

### 3. Laboratoire → Caisse

**Déclencheur:** Prescription labo avec montant > 0

**Flux:**
1. Prescription labo créée avec `montant_total`
2. Ticket de facturation créé automatiquement
3. Module caisse affiche le ticket en attente
4. Paiement enregistré
5. Trigger `unlock_lab_results_on_payment` débloque l'impression

**Table de liaison:**
```sql
tickets_facturation
├── patient_id
├── service_origine = 'laboratoire'
├── reference_origine = lab_prescription.id
├── montant
└── statut = 'en_attente' | 'paye'
```

---

### 4. Pharmacie → Caisse

**Déclencheur:** Dispensation patient avec montant > 0

**Flux:**
1. Dispensation créée avec calcul des montants
2. Si assurance: 2 tickets créés (patient + assurance)
3. Tickets envoyés au module caisse
4. Paiement enregistré

**Gestion Tiers-Payant:**
```typescript
// Calcul des montants
montant_total = somme(lignes.prix_total);
montant_assurance = montant_total * (taux_couverture / 100);
montant_patient = montant_total - montant_assurance;
```

---

### 5. Maternité ↔ Laboratoire

**Déclencheur:** CPN (Consultation Prénatale)

**Flux:**
1. Sage-femme démarre une CPN
2. `LaboratoireIntegrationService.getExamensMaterniteObligatoires(numeroCPN)` récupère les examens requis
3. Prescriptions labo créées automatiquement
4. Résultats pathologiques → notification urgente via `notifySageFemmeResultatUrgent()`

**Examens par CPN:**
| CPN | Examens obligatoires |
|-----|---------------------|
| 1   | Groupe sanguin, Rhésus, NFS, Glycémie, TPHA, HIV |
| 2   | NFS, Glycémie, ECBU |
| 3   | NFS, Glycémie |
| 4   | NFS, Glycémie, TPHA |

---

### 6. Stock ← Laboratoire

**Déclencheur:** Consommation de réactifs

**Flux:**
1. Analyse réalisée
2. `enregistrerConsommationReactifs()` décrémente le stock
3. Si seuil atteint → `createAlerteStockBas()`
4. Si rupture → `commanderReactifs()` vers pharmacie

---

## Triggers de Synchronisation

### Triggers actifs

| Trigger | Table | Action |
|---------|-------|--------|
| `trg_sync_prescriptions_on_consultation_close` | consultations | Valide prescriptions à la clôture |
| `trg_notify_consultation_on_lab_result` | lab_analyses | Notifie lors validation résultat |
| `trg_link_dispensation_to_facturation` | dispensations | Lie dispensation au ticket |
| `trg_unlock_lab_results_on_payment` | lab_prescriptions | Débloque impression après paiement |
| `trg_sync_prescription_status_on_dispense` | dispensation_lignes | Met à jour statut prescription |
| `sync_transferts_workflow_status` | transferts | Synchronise workflow transferts |

---

## Contrats API

### Endpoints d'intégration

#### Consultation → Labo
```
POST /api/consultations/:id/lab-requests
Body: { analyses: [...], priorite: 'normale' | 'urgente' }
Response: { success: true, data: { prescription_id: UUID } }
```

#### Labo → Consultation
```
GET /api/consultations/:id/lab-results
Response: { prescriptions: [...], analyses: [...], rapports: [...] }
```

#### Pharmacie
```
GET /api/dispensation/prescriptions-actives/:patientId
POST /api/dispensation
Body: DispensationFormData
```

---

## Gestion des erreurs

### Codes d'erreur inter-modules

| Code | Description |
|------|-------------|
| INTEG_001 | Module indisponible |
| INTEG_002 | Échec synchronisation |
| INTEG_003 | Échec création ticket |
| BIZ_001 | Consultation déjà clôturée |
| BIZ_002 | Prescription déjà dispensée |
| BIZ_003 | Stock insuffisant |

### Mécanisme de rollback

Les opérations inter-modules utilisent `TransactionManager` pour :
1. Enregistrer chaque action effectuée
2. En cas d'erreur : rollback automatique des actions précédentes
3. Logging avec `traceId` pour traçabilité

---

## Validation des contraintes métier

### Avant prescription
- Consultation ouverte (non clôturée/annulée)
- Patient actif

### Avant résultats labo
- Prescription existe
- Paiement effectué (si configuré)

### Avant dispensation
- Prescription active (non annulée/dispensée)
- Stock disponible
- Lot non expiré

---

## Performance et Cache

### Données mises en cache (TTL)

| Donnée | TTL | Service |
|--------|-----|---------|
| Catalogue analyses | 10 min | CacheService.getCatalogueAnalyses |
| Services facturables | 15 min | CacheService.getServicesFacturables |
| Médicaments | 5 min | CacheService.getMedicaments |
| Motifs consultation | 30 min | CacheService.getMotifsConsultation |

### Invalidation du cache

- Modification d'un catalogue → invalidation automatique
- `CacheService.invalidateClinicCache(clinicId)` pour reset complet

---

## Monitoring

### Métriques clés

- Temps moyen prescription → résultat validé
- Taux de prescriptions dispensées complètement
- Tickets facturation en attente > 24h
- Erreurs d'intégration par module

### Logs structurés

Tous les logs d'intégration incluent:
- `traceId`: identifiant unique de la transaction
- `sourceModule`: module source
- `targetModule`: module cible
- `action`: action effectuée
- `durationMs`: temps d'exécution

---

## Maintenance

### Vérifications régulières

1. **Prescriptions orphelines**: prescriptions sans dispensation > 30 jours
2. **Tickets en attente**: tickets facturation non payés > 7 jours
3. **Résultats non transmis**: résultats validés non envoyés à consultation

### Scripts de maintenance

```sql
-- Prescriptions orphelines
SELECT * FROM prescriptions 
WHERE statut = 'VALIDE' 
AND created_at < NOW() - INTERVAL '30 days';

-- Tickets en attente
SELECT * FROM tickets_facturation 
WHERE statut = 'en_attente' 
AND created_at < NOW() - INTERVAL '7 days';
```

---

*Document généré automatiquement - Dernière mise à jour: 2026-01-03*


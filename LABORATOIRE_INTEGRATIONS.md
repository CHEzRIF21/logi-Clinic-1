# Module Laboratoire - Intégrations avec les Autres Modules

## Vue d'ensemble

Le module Laboratoire est conçu pour fonctionner en interconnexion avec tous les autres modules du système. Cette intégration assure un flux de données fluide et une efficacité maximale.

## 1. Intégration Consultation / Dossier Patient

### Flux de données

#### Entrée : Prescription électronique (Order Entry)
- Lorsqu'un médecin prescrit un examen lors d'une consultation, une prescription de laboratoire est automatiquement créée
- La prescription est liée à la consultation via `consultation_id`
- Les détails de la demande sont préservés

**Code d'exemple :**
```typescript
// Depuis le module Consultation
await LaboratoireIntegrationService.createPrescriptionFromConsultation(
  consultationId,
  patientId,
  'NFS',
  'Numération Formule Sanguine complète',
  'Dr. Nom',
  'Consultation Générale'
);
```

#### Sortie : Résultats dans le dossier patient
- Lorsqu'un rapport est signé et validé, les résultats sont automatiquement ajoutés au dossier patient
- Les résultats apparaissent dans la consultation d'origine
- Le médecin voit les résultats en temps réel dès validation

**Code d'exemple :**
```typescript
// Transmission automatique des résultats
await LaboratoireIntegrationService.sendResultsToPatientDossier(
  rapportId,
  prelevementId
);
```

### Avantages
- ✅ Évite la ressaisie manuelle des demandes
- ✅ Résultats disponibles immédiatement dans le dossier
- ✅ Traçabilité complète prescription → résultats
- ✅ Historique médical complet

## 2. Intégration Facturation / Caisse

### Verrouillage selon paiement

Le module Laboratoire peut bloquer l'affichage des résultats ou le prélèvement tant que la facture n'est pas payée (selon la politique de l'hôpital).

#### Vérification avant prélèvement
```typescript
const status = await LaboratoireIntegrationService.checkPaymentBeforePrelevement(
  prescriptionId,
  patientId
);

if (!status.authorized) {
  // Bloquer le prélèvement ou créer un ticket de facturation
}
```

#### Création automatique de ticket
Lors de la création d'une prescription, un ticket de facturation peut être automatiquement créé :
```typescript
await LaboratoireIntegrationService.createBillingTicketForPrescription(
  prescriptionId,
  patientId,
  5000, // Montant en XOF
  'NFS'
);
```

#### Déverrouillage après paiement
Une fois la facture payée, les résultats sont automatiquement déverrouillés :
```typescript
await LaboratoireIntegrationService.unlockResultsAfterPayment(
  factureId,
  patientId
);
```

### Gestion patient/assurance
- Le système gère automatiquement la part patient et la part assurance
- Les tickets de facturation sont créés avec les bonnes informations de couverture
- Intégration avec le module Caisse pour le suivi des paiements

### Avantages
- ✅ Assure le recouvrement des recettes
- ✅ Gestion automatique patient/assurance
- ✅ Contrôle d'accès aux résultats selon paiement
- ✅ Traçabilité financière complète

## 3. Intégration Hospitalisation

### Notifications pour résultats urgents

Lorsqu'un résultat critique est disponible pour un patient hospitalisé, une notification est automatiquement envoyée au poste infirmier.

#### Notification automatique
```typescript
// Appelé automatiquement lors de la validation d'un résultat pathologique
await LaboratoireIntegrationService.notifyHospitalisationUrgentResult(
  analyseId,
  patientId
);
```

#### Informations incluses dans la notification
- Chambre du patient
- Paramètre analysé
- Valeur pathologique
- Priorité (haute/critique)
- Date et heure

### Table `notifications_hospitalisation`
- Stocke toutes les notifications pour les patients hospitalisés
- Permet le suivi des notifications lues/non lues
- Historique complet des alertes

### Avantages
- ✅ Rapidité de prise en charge pour patients hospitalisés
- ✅ Alertes visibles directement au poste infirmier
- ✅ Réduction des délais de traitement
- ✅ Amélioration de la sécurité des patients

## 4. Intégration Pharmacie / Achats

### Commande de réactifs

Le laboratoire peut commander directement ses réactifs et consommables via le module Pharmacie.

#### Envoi de commande
```typescript
const result = await LaboratoireIntegrationService.sendReactifOrderToPharmacy(
  reactifId,
  100, // Quantité
  'Stock critique - besoin urgent'
);
```

#### Réception de livraison
```typescript
await LaboratoireIntegrationService.receiveReactifDelivery(
  commandeId,
  quantiteLivree,
  'LOT-2025-001',
  '2025-12-31'
);
```

### Table `commandes_achats`
- Suivi des commandes de réactifs
- Statuts : en_attente, approuvée, en_commande, livrée, annulée
- Priorités : basse, normale, haute, urgente
- Intégration avec le module Achats/Pharmacie

### Avantages
- ✅ Centralisation des achats
- ✅ Meilleure gestion budgétaire
- ✅ Traçabilité complète des commandes
- ✅ Prévention des ruptures de stock

## 5. Intégration Statistiques / Reporting

### Reporting automatique

Le module envoie automatiquement des données au module Statistiques pour le pilotage de l'activité.

#### Génération de rapport statistique
```typescript
const report = await LaboratoireIntegrationService.generateStatisticsReport(
  '2025-01-01',
  '2025-01-31'
);

// Données retournées :
// - Nombre d'examens
// - Examens par type
// - Pathologies fréquentes avec taux de positivité
// - Chiffre d'affaires
// - Délais moyens
// - Taux de validation
```

### Détection d'épidémies

Le système peut détecter automatiquement les augmentations subites de cas (ex: Paludisme).

#### Détection automatique
```typescript
const alert = await LaboratoireIntegrationService.detectEpidemicAlert(
  'Paludisme',
  7 // Période en jours
);

if (alert.isEpidemic) {
  // Alerte créée automatiquement dans le système
  // Notification envoyée à la direction
}
```

#### Critères de détection
- Augmentation de plus de 50% sur la période
- Plus de 10 cas détectés
- Comparaison avec période précédente

### Table `alertes_epidemiques`
- Stocke toutes les alertes épidémiques détectées
- Permet le suivi et la résolution
- Historique pour analyse

### Avantages
- ✅ Pilotage de l'activité en temps réel
- ✅ Détection précoce d'épidémies
- ✅ Aide à la décision pour la direction
- ✅ Prévention et planification

## Configuration

### Table `configurations_laboratoire`

Le module peut être configuré via cette table :

- `labo_paiement_obligatoire` : Exige le paiement avant prélèvement (true/false)
- `labo_notification_urgente` : Active les notifications pour résultats urgents (true/false)
- `labo_detection_epidemie` : Active la détection automatique d'épidémies (true/false)
- `labo_seuil_epidemie` : Seuil d'augmentation (%) pour alerte épidémique (nombre)
- `labo_delai_notification` : Délai en minutes avant notification résultat urgent (nombre)

## Interface Utilisateur

### Composant `IntegrationsPanel`

Un panneau d'intégration est disponible dans le module Laboratoire pour :
- Visualiser l'état des intégrations
- Envoyer manuellement les résultats au dossier patient
- Créer des tickets de facturation
- Commander des réactifs
- Générer des rapports statistiques

## Vue d'ensemble des Flux

```
┌─────────────────┐
│  Consultation   │
│   (Médecin)     │
└────────┬────────┘
         │ Order Entry
         ▼
┌─────────────────┐
│  Laboratoire    │
│  (Prescription) │
└────────┬────────┘
         │
         ├──► Facturation (Ticket)
         │
         ├──► Prélèvement
         │
         ├──► Analyse
         │
         └──► Validation
              │
              ├──► Consultation (Résultats)
              │
              ├──► Hospitalisation (Notification si urgent)
              │
              └──► Statistiques (Reporting)
```

## Tables de Base de Données

### Nouvelles tables créées
1. `notifications_hospitalisation` : Notifications pour patients hospitalisés
2. `commandes_achats` : Commandes de réactifs et consommables
3. `alertes_epidemiques` : Alertes de détection d'épidémies
4. `configurations_laboratoire` : Configurations du module

### Colonnes ajoutées
- `lab_prescriptions.consultation_id` : Lien avec la consultation

### Vue créée
- `v_laboratoire_integrations_stats` : Statistiques des intégrations

## Utilisation

### Dans le code

Toutes les intégrations sont disponibles via `LaboratoireIntegrationService` :

```typescript
import { LaboratoireIntegrationService } from '../services/laboratoireIntegrationService';

// Créer prescription depuis consultation
await LaboratoireIntegrationService.createPrescriptionFromConsultation(...);

// Vérifier paiement
await LaboratoireIntegrationService.checkPaymentBeforePrelevement(...);

// Notifier hospitalisation
await LaboratoireIntegrationService.notifyHospitalisationUrgentResult(...);

// Commander réactifs
await LaboratoireIntegrationService.sendReactifOrderToPharmacy(...);

// Générer rapport statistique
await LaboratoireIntegrationService.generateStatisticsReport(...);
```

## Conclusion

Le module Laboratoire est maintenant complètement intégré avec tous les autres modules du système, assurant :
- Un flux de données fluide et automatique
- Une traçabilité complète
- Une efficacité maximale
- Une meilleure prise en charge des patients
- Un pilotage de l'activité facilité


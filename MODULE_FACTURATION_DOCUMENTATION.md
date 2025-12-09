# 📋 MODULE FACTURATION - Documentation Complète

## 🎯 Vue d'Ensemble

Le module Facturation est un système complet de gestion financière pour le centre de santé. Il couvre l'ensemble du cycle financier depuis la création automatique de tickets jusqu'à l'encaissement et la génération de rapports.

## 📦 Structure du Module

### 1. Base de Données (Supabase)

**Fichier**: `supabase_migrations/create_facturation_tables.sql`

**Tables créées**:
- `services_facturables` - Catalogue des services et actes facturables
- `factures` - Table principale des factures
- `lignes_facture` - Lignes détaillées de chaque facture
- `paiements` - Enregistrement des paiements
- `remises_exonerations` - Gestion des remises et exonérations
- `credits_facturation` - Gestion des factures à crédit
- `journal_caisse` - Journal de caisse pour suivi quotidien
- `tickets_facturation` - Tickets générés automatiquement depuis les actes médicaux

**Fonctions SQL automatiques**:
- Génération automatique des numéros de facture
- Calcul automatique des montants totaux
- Mise à jour automatique du statut des factures
- Mise à jour automatique du journal de caisse

### 2. Service TypeScript

**Fichier**: `src/services/facturationService.ts`

**Méthodes principales**:
- `getServicesFacturables()` - Récupérer les services facturables
- `createFacture()` - Créer une nouvelle facture
- `getFactureById()` - Récupérer une facture par ID
- `enregistrerPaiement()` - Enregistrer un paiement
- `appliquerRemise()` - Appliquer une remise ou exonération
- `creerTicketFacturation()` - Créer un ticket depuis un acte médical
- `getJournalCaisse()` - Récupérer le journal de caisse
- `getStatistiquesFacturation()` - Obtenir les statistiques financières

### 3. Composants React

#### `CreationFacture.tsx`
Interface pour créer des factures manuellement avec :
- Sélection du patient
- Ajout de lignes de facture
- Calcul automatique des totaux
- Gestion des remises

#### `GestionPaiements.tsx`
Interface pour gérer les paiements avec :
- Liste des factures en attente
- Enregistrement de paiements (espèces, mobile money, virement, etc.)
- Historique des paiements
- Impression de reçus

#### `JournalCaisse.tsx`
Interface pour le journal de caisse avec :
- Ouverture/fermeture du journal quotidien
- Suivi des recettes par mode de paiement
- Suivi des dépenses
- Calcul automatique des soldes
- Export et impression de rapports

#### `TableauBordFacturation.tsx`
Tableau de bord financier avec :
- Indicateurs clés (total facturé, payé, crédits)
- Répartition par service
- Répartition par mode de paiement
- Statistiques par période

#### `GestionTickets.tsx`
Gestion des tickets en attente de facturation avec :
- Liste des tickets générés automatiquement
- Sélection multiple pour facturation groupée
- Filtrage par patient

### 4. Page Principale

**Fichier**: `src/pages/Facturation.tsx`

Navigation par onglets :
1. **Tableau de Bord** - Vue d'ensemble financière
2. **Tickets en Attente** - Gestion des tickets à facturer
3. **Création Facture** - Création manuelle de factures
4. **Gestion Paiements** - Enregistrement des paiements
5. **Journal de Caisse** - Suivi quotidien
6. **Rapports** - Rapports détaillés

## 🔄 Workflow de Facturation

### 1. Génération Automatique de Tickets

Lorsqu'un acte médical est effectué (consultation, prescription, examen, etc.), un ticket de facturation est automatiquement créé :

```typescript
import { FacturationService } from '../services/facturationService';

// Exemple : Après une consultation
await FacturationService.creerTicketFacturation(
  patientId,
  'consultation',
  consultationId,
  'Consultation Générale',
  2000
);
```

### 2. Facturation des Tickets

Le caissier visualise les tickets en attente et peut :
- Sélectionner un ou plusieurs tickets
- Créer une facture groupée
- Appliquer des remises si nécessaire

### 3. Enregistrement des Paiements

Une fois la facture créée :
- Le caissier enregistre le paiement
- Le système met à jour automatiquement le statut de la facture
- Le journal de caisse est mis à jour automatiquement

### 4. Journal de Caisse

À la fin de la journée :
- Le caissier ferme le journal
- Le système calcule automatiquement les soldes
- Les rapports peuvent être exportés

## 🔌 Intégration avec les Autres Modules

### Intégration avec le Module Consultation

Pour générer automatiquement un ticket après une consultation :

```typescript
// Dans le service de consultation
import { FacturationService } from '../services/facturationService';

async function terminerConsultation(consultationId: string, patientId: string) {
  // ... logique de consultation ...
  
  // Créer le ticket de facturation
  await FacturationService.creerTicketFacturation(
    patientId,
    'consultation',
    consultationId,
    'Consultation Générale',
    2000 // Tarif de la consultation
  );
}
```

### Intégration avec le Module Pharmacie

Pour générer un ticket lors de la délivrance de médicaments :

```typescript
// Dans le service de pharmacie
async function delivrerMedicaments(patientId: string, medicaments: Medicament[]) {
  // ... logique de délivrance ...
  
  const total = medicaments.reduce((sum, med) => sum + med.prix_vente * med.quantite, 0);
  
  await FacturationService.creerTicketFacturation(
    patientId,
    'pharmacie',
    prescriptionId,
    `Délivrance de ${medicaments.length} médicament(s)`,
    total
  );
}
```

### Intégration avec le Module Laboratoire

Pour générer un ticket lors d'une prescription d'examens :

```typescript
// Dans le service de laboratoire
async function prescrireExamens(patientId: string, examens: Examen[]) {
  // ... logique de prescription ...
  
  const total = examens.reduce((sum, exam) => sum + exam.tarif, 0);
  
  await FacturationService.creerTicketFacturation(
    patientId,
    'laboratoire',
    prescriptionId,
    `Prescription de ${examens.length} examen(s)`,
    total
  );
}
```

## 📊 Rapports et Statistiques

### Rapports Disponibles

1. **Rapport Journalier**
   - Recettes par mode de paiement
   - Nombre de factures et paiements
   - Solde d'ouverture et de fermeture

2. **Rapport Mensuel**
   - Total facturé et payé
   - Répartition par service
   - Répartition par mode de paiement
   - Factures par statut

3. **Rapport de Crédits**
   - Liste des factures en crédit
   - Montants en attente
   - Échéances

### Export des Rapports

Les rapports peuvent être exportés en :
- Format texte (.txt)
- Format PDF (à implémenter)
- Format Excel (à implémenter)

## 🔐 Sécurité et Permissions

Le module respecte le système de permissions existant :
- **Caissier** : Peut créer des factures et enregistrer des paiements
- **Comptable** : Peut gérer les crédits et remises
- **Administrateur** : Accès complet au module
- **Responsable financier** : Accès aux rapports et journal de caisse

## 🚀 Installation et Configuration

### 1. Appliquer la Migration Supabase

```sql
-- Exécuter le fichier de migration
-- supabase_migrations/create_facturation_tables.sql
```

### 2. Configurer les Services Facturables

Les services de base sont créés automatiquement, mais vous pouvez en ajouter d'autres :

```typescript
await FacturationService.createServiceFacturable({
  code: 'CONS-URG',
  nom: 'Consultation Urgente',
  type_service: 'consultation',
  tarif_base: 5000,
  description: 'Consultation en urgence'
});
```

### 3. Accéder au Module

Le module est accessible via :
- Menu latéral : **Facturation**
- URL directe : `/facturation`

## 📝 Utilisation Pratique

### Créer une Facture Manuelle

1. Aller dans l'onglet **Création Facture**
2. Sélectionner un patient
3. Cliquer sur **Ajouter une Ligne**
4. Choisir un service facturable ou saisir manuellement
5. Remplir les informations (quantité, prix, remise)
6. Cliquer sur **Enregistrer la Facture**

### Enregistrer un Paiement

1. Aller dans l'onglet **Gestion Paiements**
2. Sélectionner une facture
3. Cliquer sur **Enregistrer un Paiement**
4. Remplir le formulaire (montant, mode de paiement, etc.)
5. Cliquer sur **Enregistrer**

### Gérer le Journal de Caisse

1. Aller dans l'onglet **Journal de Caisse**
2. Sélectionner la date
3. Si le journal n'existe pas, cliquer sur **Ouvrir le journal**
4. Saisir le solde d'ouverture
5. À la fin de la journée, cliquer sur **Fermer le Journal**

## 🎨 Personnalisation

### Ajouter de Nouveaux Services Facturables

```typescript
await FacturationService.createServiceFacturable({
  code: 'NOUVEAU-SERVICE',
  nom: 'Nom du Service',
  type_service: 'autre',
  tarif_base: 1000,
  description: 'Description du service'
});
```

### Modifier les Tarifs

```typescript
await FacturationService.updateServiceFacturable(serviceId, {
  tarif_base: 2500
});
```

## ⚠️ Points d'Attention

1. **Numéros de Facture** : Générés automatiquement, format `FAC-YYYY-NNNNNN`
2. **Calculs Automatiques** : Les montants sont recalculés automatiquement via les triggers SQL
3. **Journal de Caisse** : Un seul journal par jour et par caissier
4. **Tickets** : Les tickets sont automatiquement marqués comme "facturés" lors de la création de la facture
5. **Statuts** : Les statuts des factures sont mis à jour automatiquement selon les paiements

## 🔄 Évolutions Futures

- Génération de factures PDF avec QR code fiscal
- Intégration avec les systèmes de paiement mobile (Orange Money, MTN Mobile Money)
- Export Excel des rapports
- Tableau de bord avec graphiques interactifs
- Notifications pour les factures en crédit
- Gestion des acomptes
- Factures récurrentes pour les abonnements

## 📞 Support

Pour toute question ou problème :
1. Consulter la documentation des services dans `facturationService.ts`
2. Vérifier les logs Supabase pour les erreurs SQL
3. Consulter les composants React pour comprendre l'interface

---

**Module créé le** : 2024-12-20  
**Version** : 1.0.0  
**Statut** : ✅ Fonctionnel


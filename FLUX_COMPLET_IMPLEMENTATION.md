# Implémentation du Flux Complet - Système de Gestion de Stock

## Vue d'ensemble

Le système implémente maintenant le flux complet selon le schéma synthétique demandé :

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        FLUX COMPLET DU SYSTÈME MÉDICAL                         │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌───────────────────┐
                              │    FOURNISSEURS   │
                              │   (Entrées Stock) │
                              └─────────┬─────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MODULE STOCK MÉDICAMENTS                              │
│                        (Responsable Centre / Magasin Gros)                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ✓ Réception Médicaments     → Enregistrement + Stockage Magasin Gros          │
│  ✓ Gestion des Médicaments   → Création, modification (prix, seuils)           │
│  ✓ Inventaire Magasin Gros   → État des stocks central                          │
│  ✓ Alertes Stock             → Péremptions, ruptures, seuils                    │
│  ✓ Traçabilité Lots          → Historique complet                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                      ┌─────────────────┼─────────────────┐
                      │                 │                 │
                      ▼                 ▼                 ▼
              ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
              │  Demande     │  │  Validation  │  │  Transfert   │
              │  Interne     │  │  Responsable │  │  Automatique │
              └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                     │                 │                 │
                     └─────────────────┴─────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MODULE PHARMACIE                                   │
│                          (Pharmacie / Magasin Détail)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ✓ Stock Détail              → Médicaments disponibles pour dispensation       │
│  ✓ Dispensations Patients    → Stock Détail décrémenté                          │
│  ✓ Ajustement (Commandes)    → Demandes vers Magasin Gros                       │
│  ✓ Inventaire Détail         → État des stocks pharmacie                        │
│  ✓ Alertes Stock             → Péremptions, ruptures                            │
│  ✓ Rapports                  → Statistiques et suivi                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                      ┌─────────────────┴─────────────────┐
                      │                                   │
                      ▼                                   ▼
┌─────────────────────────────────────────┐  ┌───────────────────────────────────┐
│         MODULE CONSULTATIONS            │  │           MODULE CAISSE           │
├─────────────────────────────────────────┤  ├───────────────────────────────────┤
│  • Prescriptions médicales              │  │  • Facturation dispensations      │
│  • Ordonnances                          │  │  • Tickets de paiement            │
│  • Suivi traitements                    │  │  • Journal de caisse              │
│  • Historique patients                  │  │  • Rapports financiers            │
└─────────────────────────────────────────┘  └───────────────────────────────────┘
                      │                                   │
                      └─────────────────┬─────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AUTRES MODULES                                     │
├──────────────────┬──────────────────┬──────────────────┬────────────────────────┤
│   MATERNITÉ      │   LABORATOIRE    │    IMAGERIE      │     VACCINATION        │
├──────────────────┼──────────────────┼──────────────────┼────────────────────────┤
│ • Dossiers CPN   │ • Prescriptions  │ • Examens radio  │ • Calendrier vaccinal  │
│ • Accouchements  │ • Analyses       │ • Comptes rendus │ • Administration doses │
│ • Suivi postnatal│ • Résultats      │ • Archivage      │ • Rappels automatiques │
└──────────────────┴──────────────────┴──────────────────┴────────────────────────┘

                              ┌───────────────────┐
                              │     PATIENTS      │
                              │  (Destinataires)  │
                              └───────────────────┘
```

## Architecture des Interconnexions

### Flux Principal Stock

```
Réception médicaments → Magasin Gros (enregistrement + stockage)
Demande interne → Responsable Gros
Validation + transfert → Mise à jour Magasin Gros (-) et Magasin Détail (+)
Dispensation aux patients → Stock Magasin Détail décrémenté
Retours / pertes → Mise à jour stocks avec justification
Rapports & alertes → Suivi conjoint des deux entités
```

### Connexions Inter-Modules

| Module Source | Module Destination | Type de Liaison |
|--------------|-------------------|-----------------|
| Stock Médicaments | Pharmacie | Transfert de lots |
| Pharmacie | Stock Médicaments | Demandes de ravitaillement |
| Consultations | Pharmacie | Prescriptions à dispenser |
| Pharmacie | Caisse | Facturation des dispensations |
| Caisse | Pharmacie | Confirmation de paiement |
| Laboratoire | Pharmacie | Demandes de réactifs |
| Vaccination | Stock Médicaments | Consommation vaccins |

## Architecture Technique

### Services de Données

#### `StockService` (`src/services/stockService.ts`)
Service principal qui implémente toutes les opérations du flux :

- **`receptionMedicament()`** : Réception et enregistrement des médicaments dans le magasin gros
- **`creerDemandeTransfert()`** : Création d'une demande de transfert interne
- **`validerTransfert()`** : Validation du transfert et mise à jour des stocks
- **`dispensationPatient()`** : Dispensation aux patients avec décrémentation du stock
- **`enregistrerPerteRetour()`** : Gestion des retours et pertes avec justification
- **`verifierAlertes()`** : Vérification automatique des alertes de stock

#### `DispensationService` (`src/services/dispensationService.ts`)
Service pour la gestion des dispensations :

- **`creerDispensation()`** : Création d'une nouvelle dispensation
- **`getLotsDisponibles()`** : Récupération des lots disponibles avec prix détail
- **`validerDispensation()`** : Validation et mise à jour des stocks
- **`annulerDispensation()`** : Annulation avec remise en stock

#### `MedicamentService` (`src/services/medicamentService.ts`)
Service pour la gestion du catalogue médicaments :

- **`creerMedicament()`** : Création avec prix (entrée, total, détail)
- **`modifierMedicament()`** : Modification des informations et prix
- **`getMedicaments()`** : Liste des médicaments avec filtres

### Composants Interface

#### `StockMedicaments` (`src/pages/StockMedicaments.tsx`)
Page principale du module Stock avec :
- Navigation scrollable entre sous-modules
- Accès rapide vers Pharmacie, Consultations, Caisse
- Gestion des médicaments avec prix (entrée, total, détail)

#### `Pharmacie` (`src/pages/Pharmacie.tsx`)
Page principale du module Pharmacie avec :
- Navigation scrollable entre sous-modules
- Accès rapide vers Stock, Consultations, Caisse
- Dispensation avec prix unitaire détail

#### `GestionTransferts` (`src/components/stock/GestionTransferts.tsx`)
Interface pour la gestion des ajustements avec :
- Création de demandes de transfert
- Réception des transferts
- Historique des mouvements

### Gestion des Prix

| Champ | Description | Utilisation |
|-------|-------------|-------------|
| `prix_unitaire_entree` | Prix d'achat unitaire | Magasin Gros |
| `prix_total_entree` | Prix total d'achat | Comptabilité |
| `prix_unitaire_detail` | Prix de vente au détail | Pharmacie, Facturation |

**Important** : Seul le `prix_unitaire_detail` est utilisé pour les dispensations et la facturation.

## Navigation et Onglets

Tous les modules utilisent maintenant des onglets scrollables :
- `variant="scrollable"` : Défilement horizontal automatique
- `scrollButtons="auto"` : Boutons de navigation affichés si nécessaire
- `allowScrollButtonsMobile` : Support mobile
- `iconPosition="start"` : Icônes alignées à gauche

## Base de Données

### Tables Principales

- **`medicaments`** : Catalogue des médicaments avec prix multiples
- **`lots`** : Lots de médicaments avec magasin (gros/détail)
- **`mouvements_stock`** : Historique de tous les mouvements
- **`transferts`** : Transferts entre magasins
- **`transferts_lignes`** : Détail des lignes de transfert
- **`dispensations`** : Dispensations aux patients
- **`dispensations_lignes`** : Détail des lignes de dispensation
- **`alertes_stock`** : Alertes automatiques
- **`pertes_retours`** : Enregistrement des pertes et retours

### Colonnes Prix (Table medicaments)

```sql
prix_unitaire_entree DECIMAL(10,2)  -- Prix d'achat unitaire
prix_total_entree DECIMAL(10,2)     -- Prix total d'achat
prix_unitaire_detail DECIMAL(10,2)  -- Prix de vente (pharmacie)
```

## Utilisation

### Test du Flux Complet

1. Aller sur la page Stock Médicaments
2. Cliquer sur l'onglet "Test Flux"
3. Cliquer sur "Lancer le Test Complet"
4. Observer l'exécution étape par étape

### Utilisation Normale

1. **Réception** : Utiliser le dialog "Nouvelle Réception" dans Magasin Gros
2. **Demande** : Créer une demande de transfert depuis le magasin détail
3. **Validation** : Valider la demande depuis l'onglet Ajustement
4. **Dispensation** : Utiliser le module Pharmacie pour dispenser
5. **Retours** : Enregistrer les retours et pertes avec justification

## Sécurité et Traçabilité

- Tous les mouvements sont enregistrés avec utilisateur et timestamp
- Justification obligatoire pour les pertes et retours
- Vérification des disponibilités avant chaque opération
- Alertes automatiques pour les seuils et péremptions
- Historique complet des transferts et mouvements
- Dialogs non fermables par clic extérieur (validation explicite requise)

## Modules et Routes

| Module | Route | Permissions |
|--------|-------|-------------|
| Dashboard | `/` | Tous |
| Consultations | `/consultations` | consultations |
| Pharmacie | `/pharmacie` | pharmacie |
| Stock Médicaments | `/stock-medicaments` | stock |
| Caisse | `/caisse` | caisse |
| Laboratoire | `/laboratoire` | laboratoire |
| Imagerie | `/imagerie` | imagerie |
| Maternité | `/maternite` | maternite |
| Vaccination | `/vaccination` | vaccination |
| Rendez-vous | `/rendez-vous` | rendezvous |
| Patients | `/patients` | patients |

## Support

Pour toute question ou problème :
1. Vérifier les logs de la console
2. Utiliser le composant de test pour diagnostiquer
3. Consulter les tables de base de données
4. Vérifier la cohérence des stocks via les rapports

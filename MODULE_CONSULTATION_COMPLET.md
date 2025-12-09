# Module Consultation Complet - Documentation

## Vue d'ensemble

Le module Consultation complet offre une solution intégrée pour la gestion des consultations médicales avec toutes les fonctionnalités demandées : création/édition de fiches, templates, constantes, protocoles de soins, demandes labo/imagerie, prescriptions, historique et versioning.

## Architecture

### Base de données (Supabase)

Le module utilise les tables suivantes dans Supabase :

1. **consultation_templates** - Templates de fiches par spécialité
2. **consultations** - Table principale des consultations
3. **consultation_entries** - Historique et versioning des modifications
4. **consultation_constantes** - Constantes médicales avec calcul automatique de l'IMC
5. **protocols** - Protocoles de soins (médicaments, consommables, actes)
6. **prescriptions** - Prescriptions médicales
7. **prescription_lines** - Lignes détaillées des prescriptions
8. **lab_requests** - Demandes d'analyses biologiques
9. **imaging_requests** - Demandes d'examens d'imagerie

### Migration SQL

Le fichier `supabase_migrations/create_consultation_complete_tables.sql` contient :
- Définition de toutes les tables
- Indexes pour optimiser les performances
- Triggers pour calcul automatique de l'IMC
- Triggers pour génération automatique des numéros de prescription
- Triggers pour mise à jour automatique des timestamps
- Templates de consultation par défaut (Médecine générale, Maternité, Pédiatrie)

### Service TypeScript

Le fichier `src/services/consultationService.ts` expose la classe `ConsultationService` avec toutes les méthodes nécessaires :

#### Templates
- `getTemplates()` - Récupérer tous les templates actifs
- `getTemplateById()` - Récupérer un template par ID
- `createTemplate()` - Créer un nouveau template
- `updateTemplate()` - Mettre à jour un template
- `deleteTemplate()` - Supprimer un template

#### Consultations
- `createConsultation()` - Créer une nouvelle consultation
- `getConsultationById()` - Récupérer une consultation par ID
- `getConsultationsByPatient()` - Récupérer toutes les consultations d'un patient
- `getConsultationsByStatus()` - Récupérer les consultations par statut
- `updateConsultation()` - Mettre à jour une consultation (avec historique)
- `closeConsultation()` - Clôturer une consultation

#### Constantes
- `saveConstantes()` - Sauvegarder les constantes médicales
- `getConstantes()` - Récupérer les constantes d'une consultation

#### Protocoles
- `createProtocol()` - Créer un protocole de soins
- `getProtocols()` - Récupérer les protocoles d'une consultation
- `updateProtocol()` - Mettre à jour un protocole
- `createBillingOperationFromProtocol()` - Créer une opération facturable depuis un protocole

#### Prescriptions
- `createPrescription()` - Créer une prescription avec ses lignes
- `getPrescriptionById()` - Récupérer une prescription complète
- `getPrescriptions()` - Récupérer toutes les prescriptions d'une consultation

#### Demandes Laboratoire
- `createLabRequest()` - Créer une demande d'analyse
- `getLabRequests()` - Récupérer les demandes d'une consultation
- `updateLabRequest()` - Mettre à jour une demande

#### Demandes Imagerie
- `createImagingRequest()` - Créer une demande d'imagerie
- `getImagingRequests()` - Récupérer les demandes d'une consultation
- `updateImagingRequest()` - Mettre à jour une demande

#### Historique
- `createConsultationEntry()` - Créer une entrée d'historique
- `getConsultationHistory()` - Récupérer l'historique complet d'une consultation

#### Statistiques
- `getConsultationStats()` - Récupérer les statistiques des consultations

### Composants React

#### ConstantesSection
Composant pour la saisie et modification des constantes médicales :
- Champs : taille, poids, IMC (calculé automatiquement), température, pouls, TA bras gauche/droit, hauteur utérine
- Option de synchronisation au dossier patient
- Sauvegarde avec création d'entrée d'historique

#### ProtocolModal
Modal pour créer un protocole de soins :
- Sélection du type d'admission (soins domicile, ambulatoire, observation, hospitalisation)
- Ajout de médicaments, consommables, actes
- Gestion des horaires et instructions
- Option de création d'opération facturable

#### LabRequestWizard
Wizard en 2 étapes pour créer une demande d'analyse :
1. Type (interne/externe) et renseignement clinique obligatoire
2. Sélection des examens (checklist)
- Option de création d'opération facturable

#### ImagingRequestWizard
Wizard similaire pour les demandes d'imagerie :
1. Type (interne/externe) et renseignement clinique obligatoire
2. Sélection des examens d'imagerie
- Option de création d'opération facturable

#### ConsultationHistory
Composant d'affichage de l'historique et versioning :
- Timeline des modifications
- Affichage des données modifiées (JSON formaté)
- Possibilité d'ajouter des annotations
- Filtrage par section et action

### Page Principale

Le fichier `src/pages/ConsultationsComplete.tsx` est la page principale qui intègre tous les composants :

#### Tableau de bord
- Statistiques : Total, En cours, Clôturées, Aujourd'hui
- Filtres : Statut, Date, Recherche
- Liste des consultations avec statut et informations

#### Consultation en cours
- Header patient avec informations du dossier
- Onglets pour différentes sections
- Section Constantes avec formulaire complet
- Actions rapides : Protocole, Laboratoire, Imagerie, Prescription
- Affichage des protocoles, prescriptions, demandes
- Historique complet avec timeline

## Fonctionnalités principales

### 1. Fiche de consultation flexible
- Basée sur des templates par spécialité
- Sections configurables (constantes, anamnèse, examens, diagnostics, traitement)
- Champs personnalisables avec validations

### 2. Constantes médicales
- Saisie complète : taille, poids, IMC (auto), température, pouls, TA, hauteur utérine
- Valeurs préremplies depuis le dossier patient
- Modifiables pendant la consultation
- Synchronisation optionnelle au dossier patient
- Historique de toutes les modifications

### 3. Protocole de soins
- Sélection du type d'admission
- Ajout de médicaments, consommables, actes
- Gestion des horaires et instructions
- Transformation en opérations facturables
- Génération d'ordonnances

### 4. Demandes d'analyse/imagerie
- Wizard en 2 étapes avec validation
- Renseignement clinique obligatoire
- Sélection d'examens (checklist)
- Support interne/externe
- Génération de pièces imprimables/facturables

### 5. Prescriptions
- Création de prescriptions avec lignes détaillées
- Lien vers le module Pharmacie pour dispensation
- Suivi du statut de dispensation
- Génération de documents imprimables

### 6. Historique & Audit
- Chaque modification crée une ConsultationEntry
- Affichage timeline avec détails
- Possibilité d'annoter les modifications
- Traçabilité complète (qui, quand, quoi)

### 7. Intégrations

#### Facturation
- Protocoles transformables en opérations facturables
- Demandes labo/imagerie facturables
- Lien avec le module Facturation/Caisse

#### Pharmacie
- Prescriptions liées au module Pharmacie
- Vérification de stock
- Dispensation atomique

#### Laboratoire
- Demandes d'analyse intégrées avec le module Laboratoire
- Statut de suivi (EN_ATTENTE, EN_COURS, RENDU)

#### Imagerie
- Demandes d'examens intégrées avec le module Imagerie
- Statut de suivi

#### Rendez-vous
- Possibilité de programmer une prochaine consultation
- Intégration avec le module Rendez-vous

#### DMP (Dossier Médical Patient)
- Synchronisation des constantes au dossier patient
- Historique consultable depuis le dossier patient

## Installation

### 1. Appliquer la migration SQL

```bash
# Appliquer la migration dans Supabase
psql -h your-supabase-host -U postgres -d postgres -f supabase_migrations/create_consultation_complete_tables.sql
```

Ou via l'interface Supabase :
1. Aller dans SQL Editor
2. Copier le contenu de `create_consultation_complete_tables.sql`
3. Exécuter la requête

### 2. Installer les dépendances

```bash
npm install date-fns
```

### 3. Utiliser le module

```typescript
import { ConsultationsComplete } from './pages/ConsultationsComplete';

// Dans votre routeur
<Route path="/consultations" element={<ConsultationsComplete />} />
```

## Utilisation

### Créer une consultation

1. Cliquer sur "Nouvelle Consultation"
2. Sélectionner un patient
3. Choisir le type de consultation et optionnellement un template
4. Saisir les motifs
5. Cliquer sur "Créer"

### Saisir les constantes

1. Dans l'onglet "Consultation en cours"
2. Remplir les champs de constantes
3. L'IMC est calculé automatiquement
4. Optionnellement cocher "Synchroniser au dossier patient"
5. Cliquer sur "Sauvegarder"

### Créer un protocole de soins

1. Cliquer sur "Protocole de Soins"
2. Sélectionner le type d'admission
3. Ajouter les médicaments/consommables/actes
4. Définir les horaires si nécessaire
5. Optionnellement cocher "Créer une opération facturable"
6. Sauvegarder

### Créer une demande d'analyse

1. Cliquer sur "Demande Laboratoire"
2. Étape 1 : Choisir interne/externe et saisir le renseignement clinique
3. Étape 2 : Sélectionner les examens souhaités
4. Optionnellement cocher "Créer une opération facturable"
5. Créer la demande

### Consulter l'historique

1. Dans l'onglet "Consultation en cours"
2. Scroller jusqu'à la section "Historique & Versioning"
3. Voir la timeline des modifications
4. Cliquer sur l'icône note pour ajouter une annotation

## Rôles & Permissions

- **Admin** : Accès complet, peut créer/modifier/supprimer templates
- **Médecin** : Peut créer/modifier/clôturer consultations
- **Infirmier** : Peut ajouter constantes et motifs
- **Pharmacien** : Peut dispenser les prescriptions
- **Laborantin** : Peut traiter les demandes d'analyse
- **Caissier** : Peut créer les opérations facturables

## Notes importantes

1. **Historique** : Toutes les modifications créent automatiquement une entrée d'historique
2. **IMC** : Calculé automatiquement lors de la saisie de taille et poids
3. **Synchronisation patient** : Les constantes peuvent être synchronisées au dossier patient selon configuration
4. **Facturation** : Les protocoles et demandes peuvent être transformés en opérations facturables
5. **Templates** : Les templates sont configurables par spécialité avec sections et champs personnalisables

## Prochaines étapes

- [ ] Intégration complète avec le module Facturation
- [ ] Intégration complète avec le module Pharmacie
- [ ] Intégration complète avec le module Laboratoire
- [ ] Intégration complète avec le module Imagerie
- [ ] Génération de documents PDF (fiches de consultation, prescriptions, ordonnances)
- [ ] Notifications pour les demandes en attente
- [ ] Export des données de consultation

## Support

Pour toute question ou problème, consulter la documentation du code ou contacter l'équipe de développement.


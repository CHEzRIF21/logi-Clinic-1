# Modifications du Module Gestion des Patients

## Résumé des modifications

Ce document décrit les modifications apportées au module de gestion des patients pour ajouter :
1. Les sections **Accompagnant** et **Personne à prévenir**
2. Le **téléchargement de fichiers** (carnet médical, documents, etc.)
3. Le **suivi structuré des étapes de prise en charge**

## 1. Modifications de la base de données

### 1.1. Migration : Ajout des colonnes Accompagnant et Personne à prévenir
**Fichier**: `supabase_migrations/add_patient_accompagnant_personne_prevenir.sql`

Ajout de colonnes à la table `patients` :
- **Accompagnant** : nom, prénoms, filiation, téléphone, quartier, profession
- **Personne à prévenir** : option (identique à l'accompagnant/autre), nom, prénoms, filiation, téléphone, quartier, profession

Toutes les colonnes sont **facultatives** (NULL autorisé).

### 1.2. Migration : Table des fichiers joints
**Fichier**: `supabase_migrations/create_patient_files_table.sql`

Création de la table `patient_files` pour stocker les fichiers associés aux patients :
- Informations du fichier (nom, type, taille, chemin)
- Catégorie (carnet_medical, document_identite, prescription, examen, autre)
- Métadonnées (date de téléchargement, utilisateur)

### 1.3. Migration : Table du suivi des étapes
**Fichier**: `supabase_migrations/create_patient_care_timeline_table.sql`

Création de la table `patient_care_timeline` pour suivre les étapes de prise en charge :
- Étape (nom, description)
- Statut (en_attente, en_cours, termine, annule)
- Dates (début, fin, prévue)
- Service et médecin responsable
- Notes

**Trigger automatique** : Création automatique d'une étape "Enregistrement" lors de l'enregistrement d'un nouveau patient.

## 2. Modifications du front-end

### 2.1. Types TypeScript
**Fichier**: `src/services/supabase.ts`

Ajout des interfaces :
- `Patient` : Ajout des champs accompagnant et personne à prévenir
- `PatientFormData` : Ajout des mêmes champs pour le formulaire
- `PatientFile` : Nouvelle interface pour les fichiers
- `PatientCareTimeline` : Nouvelle interface pour le suivi

### 2.2. Formulaire Patient
**Fichier**: `src/components/patients/PatientForm.tsx`

**Nouvelles sections ajoutées** :
1. **Section Accompagnant** (facultative)
   - Nom, Prénoms
   - Filiation (liste déroulante)
   - Téléphone, Quartier, Profession

2. **Section Personne à prévenir** (facultative)
   - Option radio : "Identique à l'accompagnant" ou "Autre"
   - Si "Autre" : mêmes champs que l'accompagnant
   - Copie automatique des données de l'accompagnant si option sélectionnée

3. **Section Téléchargement de fichiers** (facultative)
   - Bouton pour sélectionner des fichiers
   - Liste des fichiers à télécharger
   - Liste des fichiers existants avec possibilité de suppression
   - Affichage des fichiers existants en mode édition

**Fonctionnalités** :
- Tous les champs sont facultatifs (pas de validation obligatoire)
- Copie automatique des données de l'accompagnant vers la personne à prévenir si l'option est sélectionnée
- Téléchargement des fichiers vers Supabase Storage après la création/modification du patient

### 2.3. Dialogue des détails du patient
**Fichier**: `src/components/patients/PatientDetailsDialog.tsx`

**Modifications** :
- Ajout d'un système d'onglets (Informations / Suivi)
- Affichage conditionnel des sections Accompagnant et Personne à prévenir (uniquement si des données existent)
- Affichage de l'option "Identique à l'accompagnant" si sélectionnée
- Intégration du composant `PatientCareTimeline` dans l'onglet "Suivi"

### 2.4. Composant de suivi des étapes
**Fichier**: `src/components/patients/PatientCareTimeline.tsx`

**Nouveau composant** pour afficher le suivi structuré des étapes :
- Timeline visuelle avec statuts colorés
- Affichage des dates (début, fin, prévue)
- Informations sur le service et le médecin responsable
- Notes et descriptions pour chaque étape

## 3. Modifications des services

### 3.1. Service Patient
**Fichier**: `src/services/patientService.ts`

**Nouvelles méthodes** :

#### Gestion des fichiers :
- `getPatientFiles(patientId)` : Récupérer les fichiers d'un patient
- `uploadPatientFile(patientId, file, category, description)` : Télécharger un fichier
- `deletePatientFile(fileId)` : Supprimer un fichier (storage + base de données)

#### Gestion du suivi :
- `getPatientCareTimeline(patientId)` : Récupérer le suivi d'un patient
- `addCareTimelineStep(patientId, stepData)` : Ajouter une étape
- `updateCareTimelineStep(stepId, stepData)` : Mettre à jour une étape
- `deleteCareTimelineStep(stepId)` : Supprimer une étape

## 4. Configuration Supabase Storage

**Important** : Il est nécessaire de créer un bucket Supabase Storage nommé `patient-files` pour stocker les fichiers.

### Étapes de configuration :
1. Aller dans le dashboard Supabase
2. Section Storage
3. Créer un nouveau bucket nommé `patient-files`
4. Configurer les politiques RLS selon vos besoins de sécurité

## 5. Utilisation

### 5.1. Enregistrement d'un nouveau patient
1. Remplir les informations de base (obligatoires)
2. Optionnellement remplir la section Accompagnant
3. Optionnellement remplir la section Personne à prévenir (ou sélectionner "Identique à l'accompagnant")
4. Optionnellement télécharger des fichiers
5. Enregistrer le patient

### 5.2. Visualisation du suivi
1. Ouvrir les détails d'un patient
2. Aller dans l'onglet "Suivi"
3. Visualiser la timeline des étapes de prise en charge

### 5.3. Gestion des fichiers
- Les fichiers peuvent être téléchargés lors de l'enregistrement ou de la modification
- Les fichiers existants sont affichés dans le formulaire d'édition
- Possibilité de supprimer les fichiers existants

## 6. Notes importantes

- **Toutes les nouvelles sections sont facultatives** : L'enregistrement fonctionne même si elles sont vides
- **Pas de validation** : Aucun message d'erreur n'apparaît si les champs sont laissés vides
- **Export/Impression** : Les nouvelles sections doivent être incluses dans les exports PDF si des données existent
- **Trigger automatique** : Une étape "Enregistrement" est créée automatiquement lors de l'enregistrement d'un patient

## 7. Prochaines étapes recommandées

1. Créer le bucket Supabase Storage `patient-files`
2. Tester le téléchargement de fichiers
3. Ajouter la fonctionnalité d'export PDF incluant les nouvelles sections
4. Ajouter la possibilité de créer/modifier manuellement les étapes de suivi depuis l'interface
5. Ajouter des notifications pour les étapes en attente ou prévues


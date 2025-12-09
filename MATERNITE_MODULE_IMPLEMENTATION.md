# Module Maternité - Implémentation

## Résumé

Le module Maternité a été complètement refactorisé selon le cahier des charges pour digitaliser le Dossier Obstétrical. L'implémentation comprend toutes les fonctionnalités requises.

## Fichiers Créés/Modifiés

### 1. Migration Supabase
- **Fichier**: `supabase_migrations/create_dossier_obstetrical_table.sql`
- **Description**: Création de la table `dossier_obstetrical` avec tous les champs requis selon le cahier des charges
- **Tables créées**:
  - `dossier_obstetrical` : Table principale pour les dossiers obstétricaux
  - `grossesses_anterieures` : Table pour l'historique des grossesses antérieures
- **Fonctionnalités**:
  - Calcul automatique de la DPA (Date Probable d'Accouchement) via triggers
  - Détection automatique des facteurs de risque
  - Index pour améliorer les performances

### 2. Service Maternité
- **Fichier**: `src/services/materniteService.ts`
- **Description**: Service complet pour gérer les opérations CRUD sur les dossiers obstétricaux
- **Fonctionnalités**:
  - `getAllDossiers()` : Récupérer tous les dossiers
  - `getDossierById()` : Récupérer un dossier par ID
  - `getDossierByPatientId()` : Récupérer un dossier par patient
  - `createDossier()` : Créer un nouveau dossier
  - `updateDossier()` : Mettre à jour un dossier
  - `deleteDossier()` : Supprimer un dossier
  - `calculateDPA()` : Calculer la DPA automatiquement
  - `calculateAgeGestationnel()` : Calculer l'âge gestationnel
  - `detecterFacteursRisque()` : Détecter les facteurs de risque
  - `getStatistics()` : Récupérer les statistiques

### 3. Composants React

#### PatientSelectionDialog
- **Fichier**: `src/components/maternite/PatientSelectionDialog.tsx`
- **Description**: Dialog pour sélectionner un patient existant depuis le module Gestion des Patients
- **Fonctionnalités**:
  - Recherche de patients par nom, prénom ou identifiant
  - Filtrage automatique pour ne montrer que les femmes
  - Sélection et confirmation

#### DossierMaternite
- **Fichier**: `src/components/maternite/DossierMaternite.tsx`
- **Description**: Composant principal pour créer/modifier/voir un dossier obstétrical
- **Sections implémentées**:
  1. **Informations Patient** (lecture seule, depuis le module Gestion des Patients)
  2. **Informations Conjoint** (Section C)
  3. **Antécédents Obstétricaux** (Section B)
  4. **Grossesses Antérieures** (Section C - Tableau)
  5. **Facteurs de Surveillance** (Section 2.3)
  6. **Examens Complémentaires** (Section 2.4)
  7. **VIH / Syphilis** (Section 2.5)
- **Fonctionnalités**:
  - Calcul automatique de la DPA quand la DDR est saisie
  - Détection automatique des facteurs de risque (âge, taille, etc.)
  - Alertes visuelles pour les facteurs de risque
  - Mode création, édition et visualisation
  - Validation des champs
  - Impression du dossier

### 4. Page Maternité
- **Fichier**: `src/pages/Maternite.tsx`
- **Description**: Page principale du module Maternité
- **Modifications**:
  - Intégration du service MaterniteService
  - Intégration des nouveaux composants
  - Gestion des dossiers obstétricaux
  - Affichage de la liste des dossiers avec filtres et recherches
  - Gestion des dialogs (sélection patient, dossier)

## Fonctionnalités Implémentées

### 1. Création du Dossier Obstétrical
- ✅ Sélection du patient depuis le module Gestion des Patients
- ✅ Informations administratives (depuis le patient)
- ✅ Informations sur la patiente (depuis le patient)
- ✅ Informations sur le conjoint (Section C)
- ✅ Personne à contacter
- ✅ Référence ou non

### 2. Antécédents
- ✅ Transfusions antérieures (oui/non + nombre)
- ✅ Gestité, Parité
- ✅ Nombre d'avortements, enfants vivants, enfants décédés
- ✅ DDR (Date des dernières règles)
- ✅ DPA (Date probable d'accouchement) - calculée automatiquement
- ✅ Tableau des grossesses antérieures (Année, Évolution, Poids, Sexe, État)

### 3. Facteurs de Surveillance
- ✅ Cases à cocher pour tous les facteurs de risque
- ✅ Détection automatique basée sur l'âge du patient
- ✅ Alertes visuelles pour les facteurs de risque détectés

### 4. Examens Complémentaires
- ✅ Tous les examens requis (Groupe sanguin, Rhésus, Test de Coombs, TPHA, VDRL, HIV, ECBU, etc.)
- ✅ Champs numériques pour les valeurs (hémoglobine, hématocrite, plaquettes, etc.)
- ✅ Champ libre pour autres examens

### 5. Section VIH / Syphilis
- ✅ VIH : Oui/Non
- ✅ Mise sous ARV : Oui/Non
- ✅ Syphilis : Oui/Non
- ✅ Mise sous CTM : Oui/Non

### 6. Fonctions Automatiques
- ✅ Calcul automatique de la DPA (DDR + 280 jours)
- ✅ Calcul de l'âge gestationnel
- ✅ Détection automatique des facteurs de risque
- ✅ Alertes sur facteurs de risque

### 7. Interface Utilisateur
- ✅ Formulaire découpé en sections logiques
- ✅ Navigation fluide entre sections (onglets)
- ✅ Validations automatiques
- ✅ Interface en français
- ✅ Design moderne et responsive

## Installation et Configuration

### 1. Appliquer la Migration Supabase

```bash
# Via Supabase CLI
supabase migration up

# Ou via l'interface Supabase
# Exécuter le fichier: supabase_migrations/create_dossier_obstetrical_table.sql
```

### 2. Vérifier les Relations

Assurez-vous que la table `patients` existe et que la clé étrangère `patient_id` référence correctement `patients(id)`.

### 3. Tester l'Application

1. Démarrer l'application
2. Aller dans le module Maternité
3. Cliquer sur "Nouveau Dossier"
4. Sélectionner un patient (femme)
5. Remplir les informations du dossier obstétrical
6. Sauvegarder

## Prochaines Étapes (Optionnel)

### 1. Rapports et Statistiques
- ✅ Fonction `getStatistics()` créée dans le service
- ⏳ Interface utilisateur à créer pour afficher les statistiques
- ⏳ Export des données (DHIS2, Excel, PDF)

### 2. Intégrations
- ⏳ Connexion avec module consultation prénatale (CPN)
- ⏳ Connexion avec module accouchement / salle de travail
- ⏳ Connexion au module de sortie / références

### 3. Permissions & Sécurité
- ⏳ Implémentation des permissions par rôle (infirmière, sage-femme, médecin, administrateur)
- ⏳ Historique des modifications
- ⏳ Chiffrement des données sensibles

### 4. Fonctionnalités Avancées
- ⏳ Mode offline/online avec synchronisation
- ⏳ Sauvegarde automatique régulière
- ⏳ Rappels pour examens complémentaires
- ⏳ Impression du dossier obstétrical complet

## Notes Techniques

### Structure de la Base de Données

```
dossier_obstetrical
├── id (UUID, PK)
├── patient_id (UUID, FK -> patients.id)
├── date_entree (DATE)
├── date_sortie (DATE)
├── numero_dossier (VARCHAR)
├── conjoint_* (informations conjoint)
├── antecedents_* (antécédents obstétricaux)
├── facteurs_* (facteurs de surveillance)
├── examen_* (examens complémentaires)
├── vih, syphilis (VIH/Syphilis)
└── statut, notes

grossesses_anterieures
├── id (UUID, PK)
├── dossier_obstetrical_id (UUID, FK -> dossier_obstetrical.id)
├── annee (INTEGER)
├── evolution (VARCHAR)
├── poids (DECIMAL)
├── sexe (VARCHAR)
└── etat_enfants (VARCHAR)
```

### Calculs Automatiques

1. **DPA (Date Probable d'Accouchement)**
   - Calcul: DDR + 280 jours (40 semaines)
   - Déclencheur: Automatique quand la DDR est modifiée

2. **Âge Gestationnel**
   - Calcul: (Date actuelle - DDR) / 7 jours
   - Affiché en semaines d'aménorrhée (SA)

3. **Facteurs de Risque**
   - Détection automatique basée sur:
     - Âge du patient (< 16 ans ou > 35 ans)
     - Taille (< 1,50 m)
     - Parité (≥ 6)
     - Antécédents (césarienne, mort-né, drépanocytose, HTA, diabète, etc.)

## Support

Pour toute question ou problème, consulter:
- Le cahier des charges original
- La documentation Supabase
- Les commentaires dans le code


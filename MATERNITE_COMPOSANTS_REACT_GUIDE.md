# Guide des Composants React - Module Maternité

## 📋 Vue d'Ensemble

J'ai créé **10 composants React** pour le module Maternité qui couvrent l'ensemble du parcours maternel, de la consultation prénatale jusqu'à la surveillance post-partum.

---

## 🎨 Composants Créés

### 1. Dossier Obstétrical (2 composants)

#### ✅ `DossierMaternite.tsx`
**Objectif**: Créer/modifier/voir un dossier obstétrical

**Fonctionnalités**:
- Affichage des informations patient (lecture seule depuis Gestion des Patients)
- Formulaire pour informations conjoint
- Antécédents obstétricaux (gestité, parité, etc.)
- Grossesses antérieures (tableau dynamique)
- Facteurs de surveillance (11 facteurs avec cases à cocher)
- Examens complémentaires (20+ champs)
- Section VIH/Syphilis
- Calcul automatique de la DPA
- Alertes visuelles pour les facteurs de risque

**Onglets**:
1. Conjoint
2. Antécédents
3. Facteurs de Surveillance
4. Examens
5. VIH/Syphilis

#### ✅ `PatientSelectionDialog.tsx`
**Objectif**: Sélectionner un patient depuis le module Gestion des Patients

**Fonctionnalités**:
- Recherche de patients par nom, prénom ou identifiant
- Filtrage automatique pour ne montrer que les femmes
- Sélection et confirmation

---

### 2. Consultations Prénatales - CPN (4 composants)

#### ✅ `FormulaireCPN.tsx`
**Objectif**: Enregistrer une consultation prénatale complète

**Fonctionnalités**:
- Identification (numéro CPN, date, terme)
- Calcul automatique du trimestre
- Paramètres vitaux (poids, TA, température, HU)
- Examen obstétrical (palpation, présentation, BCF)
- Tests urinaires et rapides (VIH, Syphilis, Glycémie)
- Examens de laboratoire (hémoglobine, groupe sanguin)
- Diagnostic et décision
- Référence si nécessaire
- Calcul automatique du prochain RDV

#### ✅ `TableauCPN.tsx`
**Objectif**: Afficher la liste de toutes les CPN

**Fonctionnalités**:
- Liste chronologique des consultations
- Indicateur de complétion CPN1-4 (protocole OMS)
- Chips pour les tests (VIH, Syphilis)
- Boutons pour voir/éditer chaque CPN
- Dialog intégré pour ajouter/modifier CPN

#### ✅ `GestionVaccination.tsx`
**Objectif**: Gérer les vaccinations VAT (Vaccin Anti-Tétanique)

**Fonctionnalités**:
- Tableau VAT1 à VAT5
- Calcul automatique de la prochaine dose
- Intervalles recommandés (VAT1→VAT2: 4 sem, VAT2→VAT3: 6 mois, etc.)
- Indicateur de progression (X/5 doses)
- Désactivation automatique des doses suivantes si dose précédente non faite
- Alerte si vaccination incomplète

#### ✅ `GestionSoinsPromotionnels.tsx`
**Objectif**: Enregistrer les informations et fournitures données

**Fonctionnalités**:
- Section "Informations données":
  - VIH/PTME
  - Référence CPN
  - Paludisme
  - Nutrition
  - Espacement des naissances
  - (avec date pour chaque)
- Section "Fournitures distribuées":
  - Moustiquaire (date + quantité)
  - Préservatifs (date + quantité)
  - Fer + Acide folique (date + quantité)
  - Déparasitage (date)
  - Autres fournitures

---

### 3. Accouchement et Nouveau-Né (4 composants)

#### ✅ `FormulaireAccouchement.tsx`
**Objectif**: Enregistrer l'accouchement et la délivrance

**Fonctionnalités**:
- **Section Accouchement**:
  - Date/heure, durée du travail
  - Type (Voie basse, Césarienne, Forceps, Ventouse)
  - Présentation (Céphalique, Siège, Transverse)
  - Issue (Vivant, Mort-né, Mort in utero)
  - Nombre d'enfants
  - Complications
  - Hémorragie (Oui/Non + volume)
  - Ocytociques (Oui/Non + heure)

- **Section Délivrance**:
  - Heure de délivrance
  - Durée
  - Perte de sang (mL) avec alerte si > 500 mL
  - État du placenta (complet/incomplet)
  - État du cordon (normal/anomalies)
  - Membranes (complètes/déchirées)
  - Épisiotomie (Oui/Non)
  - Déchirures périnéales (Oui/Non + degré)
  - Réparation périnéale

- **Section Examen du Placenta**:
  - Longueur du cordon
  - Anomalies (culs-de-sac, caillots)
  - Parité

#### ✅ `FormulaireNouveauNe.tsx` ⭐
**Objectif**: Enregistrer l'état du nouveau-né avec calcul automatique du score Apgar

**Fonctionnalités**:
- **Identification**:
  - Sexe, Rang de naissance, Numéro d'ordre (jumeaux)
  
- **Mesures anthropométriques**:
  - Poids (kg) avec alerte si < 2,5 kg
  - Taille (cm)
  - Périmètre crânien (cm)

- **Scores Apgar** (✨ Calcul automatique):
  - Apgar 1 min, 5 min, 10 min
  - Tableau interactif pour saisir les 5 critères (0-2 points chacun):
    1. Respiration
    2. Fréquence cardiaque
    3. Tonus musculaire
    4. Réflexe
    5. Coloration
  - **Calcul automatique du score total (0-10)**
  - **Interprétation automatique**:
    - 7-10: Normal (vert) ✅
    - 4-6: Modéré (orange) ⚠️
    - 0-3: Critique (rouge) 🚨
  - Alerte visuelle si score < 7

- **Signes de danger**:
  - Difficulté à respirer
  - Coloration anormale
  - Convulsions
  - Absence de cri

- **Réanimation néonatale**:
  - Ventilation au masque
  - Oxygène
  - Aspiration
  - Massage cardiaque
  - Autres procédures

#### ✅ `FormulaireSoinsImmediats.tsx`
**Objectif**: Enregistrer les soins immédiats au nouveau-né

**Fonctionnalités**:
- **Soins de base** (avec heure pour chaque):
  - Séchage
  - Réchauffement
  - Contact peau-à-peau (+ durée en minutes)
  - Allaitement précoce

- **Prophylaxie** (avec produit, dose, voie, heure):
  - Prophylaxie oculaire
  - ARV (si mère séropositive)
  - Vitamine K1 (IM/Orale/IV)

- **Identification**:
  - Pesée
  - Chapelet d'identification (+ numéro)

- **Soins du cordon**:
  - Antiseptique utilisé
  - Heure

#### ✅ `FormulaireCarteInfantile.tsx`
**Objectif**: Remplir la carte infantile (carnet de naissance)

**Fonctionnalités**:
- Carte remplie (Oui/Non + date)
- **Vaccinations initiales**:
  - BCG (date + heure)
  - Polio 0 (date + heure)
  - Indicateur de complétion
- **Vitamine A** (administration ultérieure):
  - Administrée (Oui/Non)
  - Âge (6 mois / 1 an / 3 ans)
  - Date
- **Planning Familial**:
  - Discuté (Oui/Non + date)
- **Acceptation des parents**:
  - Acceptation mère
  - Acceptation père

---

### 4. Surveillance Post-Partum (1 composant)

#### ✅ `FormulaireSurveillancePostPartum.tsx` ⭐
**Objectif**: Surveiller la mère toutes les 15 minutes pendant 2 heures

**Fonctionnalités**:
- **Génération automatique** de 8 créneaux d'observation (0, 15, 30, 45, 60, 75, 90, 105, 120 min)
- **Tableau de surveillance** avec:
  - Paramètres vitaux (Température, TA, Pouls, Respiration)
  - Paramètres obstétricaux (Contraction utérine, Saignement, Douleurs)
  - Examens physiques (Périnée, Mictions, Conscience)
- **Détection automatique des risques**:
  - HPP (Hémorragie post-partum) si saignement > 500 mL
  - Tachycardie si pouls > 100
  - Hypertension si TA > 140/90
  - Hyperthermie si température > 38°C
  - Hypothermie si température < 36°C
  - Hypotension si TA systolique < 90
- **Alertes visuelles** en temps réel:
  - Codes couleur selon la sévérité
  - Emojis pour identification rapide (🚨 🔥 ❄️ ⚠️ 💓)
  - Chips avec les alertes détectées
- **Dialog intégré** pour saisir chaque observation
- **Protocole OMS** respecté (surveillance 2 heures)

---

## 🎯 Fonctionnalités Automatiques par Composant

### DossierMaternite
- ✅ Calcul DPA : DDR + 280 jours
- ✅ Détection facteurs de risque (âge, taille, parité, antécédents)
- ✅ Alertes visuelles (chips colorés)

### FormulaireCPN
- ✅ Calcul trimestre : basé sur le terme en SA
- ✅ Calcul prochain RDV : selon protocole OMS
- ✅ Suggestion numéro CPN suivant

### TableauCPN
- ✅ Vérification CPN obligatoires (CPN1-4)
- ✅ Indicateur de complétion

### GestionVaccination
- ✅ Calcul prochaine dose VAT
- ✅ Calcul date recommandée
- ✅ Désactivation automatique des doses non éligibles
- ✅ Indicateur de progression

### FormulaireNouveauNe ⭐
- ✅ **Calcul automatique score Apgar** (somme des 5 critères)
- ✅ **Interprétation automatique** (Normal/Modéré/Critique)
- ✅ **Alertes visuelles** si score < 7
- ✅ **Recommandations** selon le score

### FormulaireSurveillancePostPartum ⭐
- ✅ **Génération automatique** des 8 créneaux d'observation
- ✅ **Détection automatique** de 6 types de risques
- ✅ **Alertes en temps réel** avec codes couleur
- ✅ **Calcul sévérité** (Normal/Modéré/Sévère/Critique)

---

## 📊 Structure de Navigation

### Page Maternite.tsx (7 onglets)

1. **Tableau de Bord** : Vue d'ensemble + statistiques
2. **Dossiers Maternité** : Liste des dossiers obstétricaux
   - Bouton "Nouveau Dossier" → PatientSelectionDialog → DossierMaternite
3. **Consultations CPN** : Gestion des CPN
   - TableauCPN (liste des CPN)
   - GestionVaccination (VAT1-5)
   - GestionSoinsPromotionnels
4. **Accouchements** : Enregistrement accouchements
   - FormulaireAccouchement (accouchement + délivrance + placenta)
   - FormulaireNouveauNe (avec Apgar automatique)
   - FormulaireSoinsImmediats
   - FormulaireCarteInfantile
5. **Suivi Post-Partum** : Surveillance 2 heures
   - FormulaireSurveillancePostPartum (avec détection automatique)
6. **Système Alertes** : Notifications et rappels
7. **Statistiques** : Rapports et indicateurs

---

## 🚀 Utilisation

### Créer un Dossier Obstétrical

```typescript
// 1. Cliquer sur "Nouveau Dossier" (onglet Dossiers Maternité)
// 2. Sélectionner un patient (PatientSelectionDialog)
// 3. Remplir le formulaire (DossierMaternite)
//    - Les informations patient sont pré-remplies
//    - Les facteurs de risque basés sur l'âge sont détectés automatiquement
//    - La DPA est calculée automatiquement quand on saisit la DDR
```

### Enregistrer une CPN

```typescript
// 1. Sélectionner un dossier (onglet Dossiers Maternité)
// 2. Aller dans l'onglet "Consultations CPN"
// 3. Cliquer sur "Nouvelle CPN" dans TableauCPN
// 4. Remplir le formulaire (FormulaireCPN)
//    - Le numéro de CPN est suggéré automatiquement
//    - Le trimestre est calculé automatiquement
//    - Le prochain RDV est calculé automatiquement
```

### Gérer les Vaccinations VAT

```typescript
// 1. Dans l'onglet "Consultations CPN"
// 2. Utiliser le composant GestionVaccination
// 3. Saisir les dates VAT1-VAT5
//    - La prochaine dose est calculée automatiquement
//    - La date recommandée est affichée
//    - Les doses non éligibles sont désactivées
```

### Enregistrer un Accouchement

```typescript
// 1. Sélectionner un dossier
// 2. Aller dans l'onglet "Accouchements"
// 3. Cliquer sur "Enregistrer Accouchement"
// 4. Remplir FormulaireAccouchement (accouchement + délivrance + placenta)
// 5. Remplir FormulaireNouveauNe
//    - Saisir les 5 critères Apgar (0-2 chacun)
//    - Le score total est calculé automatiquement
//    - L'interprétation est affichée automatiquement
//    - Une alerte apparaît si score < 7
```

### Surveiller le Post-Partum

```typescript
// 1. Après avoir enregistré un accouchement
// 2. Aller dans l'onglet "Suivi Post-Partum"
// 3. Le système génère automatiquement 8 créneaux (toutes les 15 min)
// 4. Cliquer sur "Modifier" pour chaque créneau
// 5. Saisir les paramètres vitaux
//    - Les risques sont détectés automatiquement
//    - Les alertes s'affichent en temps réel
//    - Le tableau change de couleur si alerte
```

---

## 💡 Points Forts de l'Interface

### UX/UI Optimisée
- ✅ Design moderne et responsive
- ✅ Navigation par onglets
- ✅ Formulaires structurés et clairs
- ✅ Validation en temps réel
- ✅ Sauvegarde avec feedback utilisateur
- ✅ Alerts et notifications appropriées

### Codes Couleur
- 🟢 **Vert (success)** : Normal, complet, OK
- 🟡 **Orange (warning)** : Attention, modéré, à surveiller
- 🔴 **Rouge (error)** : Critique, urgent, danger
- 🔵 **Bleu (info)** : Information, en cours, programmé

### Alertes Visuelles
- **Chips** : Pour les statuts, tests, alertes
- **Icons** : Pour identification rapide (✅ ⚠️ 🚨)
- **Cards** : Pour regrouper les sections logiques
- **Tables** : Pour les données tabulaires
- **Dialogs** : Pour les formulaires complexes

---

## 📝 Validation des Données

### Contraintes Implémentées

**FormulaireNouveauNe**:
- Chaque critère Apgar : 0-2 points
- Score total : 0-10 points
- Poids : 0.5-6 kg (alerte si < 2.5 kg)

**FormulaireCPN**:
- Terme : 1-42 SA
- Température : 35-42°C
- Poids : 30-150 kg

**FormulaireSurveillancePostPartum**:
- Température : 35-42°C (alerte si < 36 ou > 38)
- TA : 60-200 / 40-120 mmHg (alerte si < 90 ou > 140/90)
- Pouls : 40-180 bpm (alerte si > 100)
- Saignement : alerte si > 500 mL

**FormulaireAccouchement**:
- Degré déchirure : 1-4
- Perte de sang : alerte si > 500 mL

---

## 🔧 Composants Utilitaires

### Services Utilisés
- `materniteService.ts` - Dossier obstétrical
- `cpnService.ts` - Consultations prénatales
- `accouchementService.ts` - Accouchement et nouveau-né
- `postPartumService.ts` - Surveillance post-partum
- `patientService.ts` - Patients

### Imports Communs
```typescript
import { 
  Box, Card, CardContent, Typography, Button,
  Grid, TextField, FormControl, Select, MenuItem,
  Alert, Chip, Checkbox, FormControlLabel,
  CircularProgress, Dialog, DialogContent
} from '@mui/material';

import {
  Save, Cancel, Add, Edit, Delete,
  CheckCircle, Warning, Schedule, Event,
  LocalHospital, ChildCare, PregnantWoman
} from '@mui/icons-material';
```

---

## 📈 Statistiques Affichées

### TableauCPN
- Indicateur CPN1-4 complétées (protocole OMS)
- Nombre total de CPN
- Tests VIH/Syphilis par CPN

### GestionVaccination
- Progression VAT (X/5 doses)
- Prochaine dose recommandée
- Date recommandée

### FormulaireSurveillancePostPartum
- Nombre d'alertes générées
- Types d'alertes
- Sévérité globale

---

## 🎨 Prochaines Améliorations Possibles

### Interface
- [ ] Graphiques pour la surveillance post-partum (courbes de température, TA, etc.)
- [ ] Mode sombre pour salle d'accouchement
- [ ] Version tablette optimisée
- [ ] Impression des formulaires

### Fonctionnalités
- [ ] Notifications/Rappels automatiques
- [ ] Export PDF des rapports
- [ ] Mode offline
- [ ] Synchronisation automatique

### Composants Additionnels
- [ ] DashboardStatistiques.tsx (graphiques et indicateurs)
- [ ] PartogrammeDigital.tsx (suivi du travail)
- [ ] FormulaireDelivrance.tsx (séparé si besoin)
- [ ] GestionDroitsFondamentaux.tsx (10 droits de la mère)
- [ ] GestionPlanAccouchement.tsx
- [ ] FormulaireSensibilisationMere.tsx
- [ ] FormulaireReferenceTransfert.tsx

---

## ✅ Résumé

**10 composants React créés** couvrant:
- ✅ Dossier obstétrical (2)
- ✅ CPN et vaccinations (4)
- ✅ Accouchement et nouveau-né (4)
- ✅ Surveillance post-partum (1)

**Fonctionnalités automatiques**:
- ✅ Calcul DPA
- ✅ Calcul trimestre
- ✅ Calcul prochain RDV
- ✅ Calcul prochaine dose VAT
- ✅ **Calcul score Apgar**
- ✅ **Détection automatique des risques post-partum**
- ✅ Alertes visuelles en temps réel

**Intégration**:
- ✅ Tous les composants intégrés dans `src/pages/Maternite.tsx`
- ✅ Navigation par onglets
- ✅ Gestion des états et dialogs
- ✅ Services connectés à Supabase

Le module Maternité est maintenant **opérationnel** avec une interface utilisateur complète!

---

**Version**: 1.0.0  
**Date**: Décembre 2024  
**Statut**: ✅ Complet et fonctionnel


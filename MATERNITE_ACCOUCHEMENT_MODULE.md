# Module ACCOUCHEMENT et NOUVEAU-NÉ - Documentation Complète

## Vue d'ensemble

Ce module digitalise l'ensemble des informations recueillies à l'accouchement et après la naissance, couvrant 8 sections principales conformément à la fiche papier de suivi maternel.

## Fichiers créés

### 1. Migration Supabase
**Fichier**: `supabase_migrations/create_accouchement_tables.sql`

**8 Tables créées**:
1. `accouchement` - Table principale
2. `delivrance` - Délivrance du placenta et périnée
3. `examen_placenta` - Examen détaillé du placenta
4. `nouveau_ne` - État du nouveau-né avec scores Apgar
5. `soins_immediats` - Soins immédiats au nouveau-né
6. `carte_infantile` - Carnet de naissance et vaccinations
7. `sensibilisation_mere` - Sensibilisation post-accouchement
8. `reference_transfert` - Références et transferts

**Fonctionnalités automatiques**:
- ✅ Calcul automatique du score Apgar (trigger SQL)
- ✅ Mise à jour automatique des timestamps
- ✅ Vue récapitulative `vue_resume_accouchements`

### 2. Service TypeScript
**Fichier**: `src/services/accouchementService.ts`

**Méthodes principales**:
- CRUD complet pour toutes les entités
- Calcul et interprétation du score Apgar
- Statistiques détaillées

## Structure des Données

### 1. ACCOUCHEMENT (Table principale)

```typescript
{
  date_accouchement: timestamp,
  heure_debut_travail: time,
  heure_accouchement: time,
  duree_travail: integer,
  type_accouchement: 'Voie basse' | 'Césarienne' | 'Forceps' | 'Ventouse',
  presentation: 'Céphalique' | 'Siège' | 'Transverse',
  issue_grossesse: 'Vivant' | 'Mort-né' | 'Mort in utero',
  nombre_enfants: integer,
  complications: text,
  hemorragie: boolean,
  volume_hemorragie: decimal
}
```

### 2. DÉLIVRANCE

**Paramètres médicaux**:
- Perte de sang (mL)
- État du placenta (complet/incomplet, anomalies)
- État du cordon (normal/anomalies)
- Examen des membranes (complètes/déchirées)
- Examen du périnée:
  - Épisiotomie (Oui/Non)
  - Déchirures (Oui/Non)
  - Degré de déchirure (1-4)
  - Réparation périnéale

### 3. EXAMEN DU PLACENTA

**Champs**:
- Heure de délivrance
- Longueur du cordon (cm)
- Anomalies (présence, culs-de-sac, caillots)
- Parité
- Photo/scan (optionnel)

### 4. ÉTAT DU NOUVEAU-NÉ

**Identification**:
- Sexe
- Rang de naissance
- Numéro d'ordre (si jumeaux)

**Mesures anthropométriques**:
- Poids (kg)
- Taille (cm)
- Périmètre crânien (cm)

**Scores Apgar** (calculés automatiquement):
- Apgar 1 min
- Apgar 5 min
- Apgar 10 min

**Critères Apgar** (chaque critère 0-2 points):
1. Respiration
2. Fréquence cardiaque
3. Tonus musculaire
4. Réflexe
5. Coloration

**Interprétation automatique**:
- 7-10 : Normal (vert)
- 4-6 : Modéré (orange)
- 0-3 : Critique (rouge)

**Paramètres cliniques**:
- Température
- État clinique normal (Oui/Non)

**Signes de danger**:
- Difficulté à respirer
- Coloration anormale
- Convulsions
- Absence de cri
- Autres signes

**Réanimation néonatale**:
- Ventilation au masque
- Oxygène
- Aspiration
- Massage cardiaque
- Autres procédures

### 5. SOINS IMMÉDIATS AU NOUVEAU-NÉ

**Soins de base** (avec heure):
- Séchage
- Réchauffement
- Contact peau-à-peau (avec durée)
- Allaitement précoce

**Prophylaxie** (avec produit, dose, voie, heure):
- Prophylaxie oculaire
- ARV (si mère séropositive)
- Vitamine K1 (IM/Orale/IV)

**Identification**:
- Pesée
- Chapelet d'identification

**Soins du cordon**:
- Antiseptique utilisé
- Heure

### 6. CARTE INFANTILE (Carnet de naissance)

**Contenu**:
- Carte remplie (Oui/Non)
- Date de remplissage

**Vitamine A**:
- Administrée (Oui/Non)
- Âge (6 mois / 1 an / 3 ans)
- Date

**Planning Familial**:
- Discuté (Oui/Non)
- Date

**Vaccinations initiales**:
- BCG (Date + Heure)
- Polio 0 (Date + Heure)

**Acceptation**:
- Acceptation mère (Oui/Non)
- Acceptation père (Oui/Non)

### 7. SENSIBILISATION DE LA MÈRE

**Thèmes** (Oui/Non + Date + Agent):
- Quantité du sang
- Hémorragie
- Massage utérin
- Traction contrôlée
- Ocytociques dans les 10 minutes
- Assistance (CF/TP)
- Anthelminthique
- Nutrition

**Traçabilité complète**:
- Date et heure de la sensibilisation
- Nom de l'agent de santé

### 8. RÉFÉRENCE/TRANSFERT

**Pour la mère OU le nouveau-né**:
- Référence nécessaire (Oui/Non)
- Motif
- Heure du transfert
- Structure de référence
- Moyen de transfert
- Agent transfert
- Signature numérique
- Statut (En attente / En cours / Arrivé / Refusé)
- Retour d'information

## Fonctionnalités Automatiques

### 1. Calcul automatique du score Apgar

Le système calcule automatiquement le score total à partir des 5 critères:

```sql
Apgar = Respiration + Fréquence cardiaque + Tonus + Réflexe + Coloration
```

**Trigger SQL** : Calcul en temps réel lors de la saisie des critères.

### 2. Interprétation du score

```typescript
// 7-10 : Normal → Vert
// 4-6 : Modéré → Orange
// 0-3 : Critique → Rouge
```

### 3. Alertes automatiques

Le système génère des alertes pour :
- Score Apgar < 7
- Réanimation nécessaire
- Hémorragie (> 500 mL)
- Signes de danger détectés
- Référence/transfert nécessaire

## Statistiques et Rapports

Le module peut générer :

### Indicateurs d'accouchement
- Nombre total d'accouchements
- Répartition par type (voie basse, césarienne, etc.)
- Taux d'épisiotomie
- Taux de déchirures périnéales
- Hémorragies post-partum

### Indicateurs néonataux
- Naissances vivantes / morts-nés
- Score Apgar moyen (1 min, 5 min)
- Taux de réanimation
- Poids moyen à la naissance
- Taux d'administration Vitamine K1

### Indicateurs PEV (Programme Élargi de Vaccination)
- % BCG administré à la naissance
- % Polio 0 administré

### Export DHIS2
Données compatibles pour l'export vers le système national.

## Installation et Configuration

### 1. Appliquer la migration

```sql
-- Exécuter dans Supabase SQL Editor :
-- supabase_migrations/create_accouchement_tables.sql
```

**Vérifications** :
- La table `dossier_obstetrical` doit exister
- Les clés étrangères doivent être correctes

### 2. Tester le service

```typescript
import { AccouchementService } from './services/accouchementService';

// Créer un accouchement
const accouchement = await AccouchementService.createAccouchement({
  dossier_obstetrical_id: 'xxx',
  date_accouchement: '2024-01-15T14:30:00',
  heure_accouchement: '14:30',
  type_accouchement: 'Voie basse',
  issue_grossesse: 'Vivant',
  nombre_enfants: 1,
  nouveau_nes: [{
    sexe: 'Féminin',
    poids: 3.2,
    taille: 50,
    perimetre_cranien: 34,
    apgar_respiration_1min: 2,
    apgar_frequence_cardiaque_1min: 2,
    apgar_tonus_1min: 2,
    apgar_reflexe_1min: 1,
    apgar_coloration_1min: 1,
    // Le score Apgar sera calculé automatiquement : 8/10
  }],
});
```

### 3. Calculer le score Apgar manuellement

```typescript
const score = AccouchementService.calculerApgar(
  2, // Respiration
  2, // Fréquence cardiaque
  2, // Tonus
  1, // Réflexe
  1  // Coloration
);
// Result: 8

const interpretation = AccouchementService.interpreterApgar(score);
// Result: { niveau: 'Normal', interpretation: '...', couleur: 'success' }
```

## Prochaines Étapes

### Composants React à créer

1. **FormulaireAccouchement.tsx**
   - Informations générales (date, heure, type)
   - Complications
   - Anesthésie

2. **FormulaireDelivrance.tsx**
   - Perte de sang
   - État placenta/cordon/membranes
   - Examen du périnée

3. **FormulaireExamenPlacenta.tsx**
   - Mesures
   - Anomalies
   - Photo (optionnel)

4. **FormulaireNouveauNe.tsx**
   - Identification
   - Mesures anthropométriques
   - Scores Apgar (calcul automatique)
   - Signes de danger
   - Réanimation

5. **FormulaireSoinsImmediats.tsx**
   - Checklist des soins
   - Horaires
   - Produits et doses

6. **FormulaireCarteInfantile.tsx**
   - Vaccinations (BCG, Polio 0)
   - Vitamine A
   - PF
   - Acceptation parents

7. **FormulaireSensibilisationMere.tsx**
   - Checklist des thèmes
   - Date + Agent pour chaque thème

8. **FormulaireReferenceTransfert.tsx**
   - Motif
   - Structure
   - Suivi

9. **DashboardAccouchement.tsx**
   - Vue d'ensemble
   - Liste des accouchements
   - Statistiques en temps réel

### Interface utilisateur

**Caractéristiques**:
- Mode sombre optionnel pour salle d'accouchement
- Grandes cases à cocher (facilité d'usage)
- Sauvegarde automatique
- Usage offline possible
- Impression du compte rendu

### Sécurité et permissions

**Accès par rôle**:
- Sage-femme : Création et modification
- Médecin : Toutes opérations + validation
- Superviseur : Lecture + statistiques

**Traçabilité**:
- Horodatage automatique
- Identification de l'agent
- Journalisation des modifications

## Avantages du Module

### Pour le personnel soignant
- ✅ Saisie rapide et structurée
- ✅ Calculs automatiques (Apgar, durées)
- ✅ Alertes en temps réel
- ✅ Réduction des erreurs
- ✅ Traçabilité complète

### Pour la gestion
- ✅ Statistiques instantanées
- ✅ Rapports automatisés
- ✅ Export DHIS2
- ✅ Indicateurs de qualité
- ✅ Conformité aux normes OMS

### Pour la qualité des soins
- ✅ Protocoles standardisés
- ✅ Détection précoce des complications
- ✅ Suivi longitudinal mère-enfant
- ✅ Amélioration continue

## Support Technique

### Relations entre tables

```
accouchement (1)
  ├── delivrance (1)
  ├── examen_placenta (1)
  ├── nouveau_ne (n)
  │    ├── soins_immediats (1)
  │    ├── carte_infantile (1)
  │    └── reference_transfert (n)
  ├── sensibilisation_mere (1)
  └── reference_transfert (n)
```

### Contraintes et validations

- Score Apgar : 0-10 (chaque critère 0-2)
- Poids : > 0 kg
- Degré déchirure : 1-4
- Issue grossesse : Vivant / Mort-né / Mort in utero

### Documentation complémentaire

- Cahier des charges original
- Documentation Supabase
- Protocoles OMS
- Guide utilisateur (à créer)

## Contact et Support

Pour toute question :
- Consulter cette documentation
- Voir les commentaires dans le code
- Tester avec données de démonstration


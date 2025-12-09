# Module SURVEILLANCE POST-PARTUM IMMÉDIATE - Documentation Complète

## 📋 Vue d'Ensemble

Ce module digitalise la surveillance post-partum immédiate pendant les **2 heures** suivant l'accouchement, conformément aux protocoles OMS et aux standards de soins obstétricaux.

## 🎯 Objectifs

- ✅ Surveiller la mère toutes les 15 minutes pendant 2 heures
- ✅ Détecter automatiquement les complications (HPP, infection, hypertension)
- ✅ Enregistrer tous les traitements administrés avec traçabilité complète
- ✅ Donner des conseils éducatifs à la mère
- ✅ Gérer la sortie et le transfert vers le service suivant
- ✅ Générer des alertes automatiques pour les valeurs critiques

## 📊 Fichiers Créés

### 1. Migration Supabase
**Fichier**: `supabase_migrations/create_post_partum_tables.sql`

**5 Tables créées**:
1. `surveillance_post_partum` - Table principale
2. `observation_post_partum` - Observations toutes les 15 minutes
3. `traitement_post_partum` - Traitements administrés
4. `conseils_post_partum` - Conseils et éducation
5. `sortie_salle_naissance` - Sortie et transfert
6. `complication_post_partum` - Complications détectées

**Fonctionnalités automatiques**:
- ✅ Détection automatique des risques (trigger SQL)
- ✅ Génération automatique des créneaux d'observation
- ✅ Calcul automatique des alertes
- ✅ Vue récapitulative `vue_resume_post_partum`

### 2. Service TypeScript
**Fichier**: `src/services/postPartumService.ts`

**Méthodes principales**:
- CRUD complet pour toutes les entités
- Génération automatique des créneaux d'observation
- Détection automatique des risques
- Génération de rapports
- Statistiques

## 🔍 Structure Détaillée

### 1. SURVEILLANCE POST-PARTUM (Table principale)

**Champs**:
- Date de début de surveillance
- Durée (par défaut 120 minutes = 2 heures)
- Statut (en_cours, termine, complication, transfere)
- Agent responsable

**Fonctionnalités**:
- Génération automatique de 8 créneaux d'observation (toutes les 15 minutes)
- Suivi en temps réel
- Alertes visuelles

### 2. OBSERVATIONS (Toutes les 15 minutes)

**Paramètres vitaux** (obligatoires):
- Température (°C)
- Tension artérielle (systolique/diastolique)
- Pouls (battements/min)
- Respiration (cycles/min)

**Paramètres obstétricaux**:
- Contraction utérine (Présente/Absente/Faible/Normale/Forte)
- Saignement (qualité + quantité en mL)
- Douleurs (Absentes/Légères/Modérées/Sévères)
- Œdèmes (Oui/Non)

**Examens physiques complémentaires**:
- État du périnée (Normal/Épisiotomie/Déchirure/Hématome/Infection)
- Plaie périnéale (description)
- Saignement périnéal (Oui/Non)
- État général (Bon/Moyen/Altéré/Critique)
- Mictions (Normales/Difficiles/Absentes/Incontinence)
- Diurèse (mL)
- Conscience (Normale/Confuse/Somnolente/Coma)

**Détection automatique des risques**:
- ✅ Risque HPP (Hémorragie post-partum)
- ✅ Risque rétention placentaire
- ✅ Risque infection
- ✅ Risque hypertension
- ✅ Risque anémie sévère

**Alertes automatiques générées**:
- 🚨 Alerte HPP (si saignement > 500 mL ou abondant)
- 🚨 Alerte tachycardie (si pouls > 100)
- 🚨 Alerte hypotension (si TA systolique < 90)
- 🚨 Alerte hypertension (si TA systolique > 140 ou diastolique > 90)
- 🚨 Alerte hyperthermie (si température > 38°C)
- 🚨 Alerte hypothermie (si température < 36°C)

### 3. TRAITEMENTS ADMINISTRÉS

**Types de traitements**:
- Ocytocine
- Antibiotiques
- Anti-inflammatoires / Antalgiques
- Fer / Acide folique
- Solutions IV
- Misoprostol
- Autres

**Pour chaque traitement** (traçabilité complète):
- Médicament
- Dose
- Voie d'administration (IV/IM/Orale/Rectale)
- Heure d'administration
- Date d'administration
- Posologie
- Durée
- Indication
- Agent d'administration
- Réponse au traitement
- Effets secondaires

### 4. CONSEILS ET ÉDUCATION À LA MÈRE

**Thèmes** (avec date + agent pour chaque):
- ✅ Signes de danger post-partum
- ✅ Nutrition et hydratation
- ✅ Hygiène périnéale
- ✅ Allaitement
- ✅ Planification familiale
- ✅ Retour en consultation post-natale (6e semaine)

**Traçabilité**:
- Date et heure de chaque conseil
- Nom de l'agent qui a donné le conseil
- Notes additionnelles

### 5. SORTIE DE LA SALLE DE NAISSANCE

**Champs**:
- Heure de sortie
- Date de sortie
- État de la mère (Stable/Stable sous surveillance/Instable/Critique)
- État détaillé
- Destination (Maternité/Hospitalisation/Référence/Domicile/Autre)
- Service de destination
- Chambre
- Accompagnant présent (Oui/Non)
- Nom de l'accompagnant
- Transport utilisé
- Dossier transféré (Oui/Non)
- Service receveur
- Agent responsable
- Signature numérique
- Observations

**Fonctionnalités**:
- Transfert numérique du dossier vers le service suivant
- Continuité des soins
- Traçabilité complète

### 6. COMPLICATIONS POST-PARTUM

**Types de complications**:
- Hémorragie post-partum (HPP)
- Rétention placentaire
- Infection
- Hypertension
- Hypotension
- Anémie sévère
- Choc
- Pré-éclampsie post-partum
- Autre

**Pour chaque complication**:
- Description
- Heure de début
- Date de début
- Sévérité (Légère/Modérée/Sévère/Critique)
- Prise en charge
- Traitement appliqué
- Évolution (Résolue/En cours/Aggravée/Référence)
- Heure de résolution
- Agent de détection
- Agent de prise en charge

## 🤖 Fonctionnalités Automatiques

### 1. Génération Automatique des Créneaux d'Observation

Lors de la création d'une surveillance, le système génère automatiquement **8 créneaux d'observation** :
- 0 min
- 15 min
- 30 min
- 45 min
- 60 min
- 75 min
- 90 min
- 105 min
- 120 min

**Fonction SQL**: `generer_prochaines_observations()`

### 2. Détection Automatique des Risques

**Trigger SQL**: `detecter_risques_post_partum_trigger`

Le système détecte automatiquement :

**HPP (Hémorragie post-partum)**:
- Saignement > 500 mL
- Saignement qualifié "Abondant" ou "Très abondant"
- TA systolique < 90 mmHg

**Tachycardie**:
- Pouls > 100 battements/min

**Hypertension**:
- TA systolique > 140 mmHg
- TA diastolique > 90 mmHg

**Hyperthermie**:
- Température > 38°C

**Hypothermie**:
- Température < 36°C

**Rétention placentaire**:
- Saignement abondant + contraction utérine absente/faible

**Anémie sévère**:
- Saignement > 1000 mL

**Altération de conscience**:
- Conscience ≠ "Normale" (suspicion pré-éclampsie/choc)

### 3. Alertes Visuelles

Le système génère des alertes visuelles avec codes couleur :
- 🟢 **Normal** : Pas d'alerte
- 🟡 **Modéré** : Alerte mineure
- 🟠 **Sévère** : Alerte importante
- 🔴 **Critique** : Alerte urgente

### 4. Graphique de Suivi

Les observations peuvent être visualisées sous forme de graphique :
- Température en fonction du temps
- Tension artérielle en fonction du temps
- Pouls en fonction du temps
- Saignement cumulé

## 📈 Statistiques et Rapports

### Indicateurs de Surveillance
- Nombre total de surveillances
- Surveillances terminées
- Surveillances avec complications
- Durée moyenne de surveillance

### Indicateurs d'Alertes
- Nombre d'alertes HPP
- Nombre d'alertes tachycardie
- Nombre d'alertes hypertension
- Nombre d'alertes hyperthermie

### Indicateurs de Complications
- Taux de HPP
- Taux d'infections
- Taux d'hypertension post-partum
- Taux de complications totales

### Indicateurs de Traitements
- Nombre de traitements par type
- Taux d'administration d'ocytocine
- Taux d'administration d'antibiotiques
- Taux d'administration d'antalgiques

### Rapport Post-Partum Complet

Le système peut générer un rapport PDF incluant :
- Résumé de la surveillance
- Toutes les observations (tableau)
- Graphiques des paramètres vitaux
- Liste des traitements administrés
- Complications détectées
- Conseils donnés
- Informations de sortie

## 🔧 Installation et Configuration

### 1. Appliquer la Migration

```sql
-- Exécuter dans Supabase SQL Editor :
-- supabase_migrations/create_post_partum_tables.sql
```

**Vérifications** :
- La table `accouchement` doit exister
- Les clés étrangères doivent être correctes

### 2. Tester le Service

```typescript
import { PostPartumService } from './services/postPartumService';

// Créer une surveillance post-partum
const surveillance = await PostPartumService.createSurveillance({
  accouchement_id: 'xxx',
  duree_surveillance: 120, // 2 heures
  agent_responsable: 'Sage-femme X',
});

// Les créneaux d'observation seront générés automatiquement!

// Enregistrer une observation
const observation = await PostPartumService.saveObservation({
  surveillance_post_partum_id: surveillance.id,
  heure_observation: '14:30',
  minute_observation: 0,
  temperature: 37.2,
  tension_arterielle_systolique: 120,
  tension_arterielle_diastolique: 80,
  pouls: 85,
  respiration: 18,
  contraction_uterine: 'Présente',
  saignement_qualite: 'Normal',
  saignement_quantite: 150,
  // Les risques seront détectés automatiquement!
});

// Détecter les risques manuellement
const detection = PostPartumService.detecterRisques(observation);
// Result: { risques: [], alertes: [], severite: 'normal' }
```

## 🎨 Interface Utilisateur Recommandée

### Formulaire de Surveillance

**Caractéristiques**:
- Mode formulaire rapide
- Grandes cases à cocher
- Saisie tactile optimisée (tablette)
- Sauvegarde automatique toutes les 15 minutes
- Alertes visuelles en temps réel

### Boutons d'Action

- **"Ajouter observation"** : Ouvrir le formulaire d'observation
- **"Administrer traitement"** : Enregistrer un traitement
- **"Alerte"** : Signaler une complication
- **"Conseils"** : Donner des conseils à la mère
- **"Sortie"** : Enregistrer la sortie

### Affichage des Observations

**Tableau chronologique** :
- Colonnes : Heure | Température | TA | Pouls | Respiration | Saignement | Alertes
- Lignes : Une par créneau (0, 15, 30, 45, 60, 75, 90, 105, 120 min)
- Codes couleur selon les alertes

**Graphiques** :
- Température en fonction du temps
- Tension artérielle en fonction du temps
- Pouls en fonction du temps
- Saignement cumulé

## 🔐 Sécurité et Traçabilité

### Permissions par Rôle

**Sage-femme** :
- Créer surveillance
- Enregistrer observations
- Administrer traitements
- Donner conseils
- Enregistrer sortie

**Médecin** :
- Toutes opérations
- Validation des complications
- Modification des observations
- Signature finale

**Superviseur** :
- Lecture seule
- Statistiques
- Export rapports
- Audit

### Traçabilité Complète

Chaque action est tracée avec :
- Date et heure automatique
- Agent de santé identifié
- Modifications historisées
- Signature numérique (sortie)

## 📊 Export et Intégration

### Formats d'Export
- **PDF** : Rapport post-partum complet
- **Excel** : Données brutes pour analyse
- **DHIS2** : Indicateurs nationaux
- **JSON** : Données structurées

### Intégration avec Autres Modules
- Module Accouchement (lien direct)
- Module CPN (retour consultation 6e semaine)
- Module Hospitalisation (transfert)
- Module Référence (si nécessaire)

## 🚨 Protocoles d'Urgence

### En cas d'HPP détectée
1. Alerte visuelle immédiate (rouge)
2. Notification au médecin
3. Enregistrement automatique de la complication
4. Protocole de traitement suggéré
5. Traçabilité complète

### En cas d'Hyperthermie
1. Alerte modérée (orange)
2. Vérification de l'état général
3. Recherche de signes d'infection
4. Traitement antibiotique si nécessaire

### En cas d'Hypertension
1. Alerte modérée (orange)
2. Surveillance renforcée
3. Recherche de signes de pré-éclampsie
4. Traitement antihypertenseur si nécessaire

## 📝 Prochaines Étapes

### Composants React à Créer

1. **FormulaireSurveillancePostPartum.tsx** ⭐
   - Formulaire principal
   - Génération automatique des créneaux
   - Affichage des observations

2. **FormulaireObservation.tsx**
   - Saisie des paramètres vitaux
   - Détection automatique des risques
   - Alertes visuelles

3. **FormulaireTraitement.tsx**
   - Enregistrement des traitements
   - Traçabilité complète

4. **FormulaireConseils.tsx**
   - Checklist des conseils
   - Enregistrement avec date + agent

5. **FormulaireSortie.tsx**
   - Sortie de la salle de naissance
   - Transfert du dossier

6. **GraphiqueSurveillance.tsx**
   - Visualisation des paramètres
   - Graphiques temporels

7. **AlertePostPartum.tsx**
   - Affichage des alertes
   - Notifications

8. **RapportPostPartum.tsx**
   - Génération du rapport PDF
   - Export

## ✨ Points Forts du Module

### Pour le Personnel Soignant
- ✅ Surveillance structurée et standardisée
- ✅ Détection automatique des complications
- ✅ Alertes en temps réel
- ✅ Traçabilité complète
- ✅ Réduction des erreurs

### Pour la Gestion
- ✅ Statistiques instantanées
- ✅ Indicateurs de qualité
- ✅ Conformité aux protocoles OMS
- ✅ Export DHIS2

### Pour la Qualité des Soins
- ✅ Détection précoce des complications
- ✅ Prise en charge rapide
- ✅ Réduction de la morbidité maternelle
- ✅ Amélioration continue

## 📞 Support

Pour toute question :
- Consulter cette documentation
- Voir les commentaires dans le code
- Tester avec données de démonstration

---

**Version**: 1.0.0  
**Date**: Décembre 2024  
**Statut**: Infrastructure complète - Interface utilisateur en cours


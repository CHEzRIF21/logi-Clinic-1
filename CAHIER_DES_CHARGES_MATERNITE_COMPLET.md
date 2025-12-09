# CAHIER DES CHARGES GLOBAL – MODULE MATERNITÉ (Version Finalisée)

## 🎯 Objectif Général

Digitaliser l'ensemble du parcours de la femme enceinte, de la première consultation jusqu'au post-partum, afin d'améliorer :
- La qualité du suivi des patientes
- La traçabilité médicale complète
- L'automatisation des rapports et statistiques
- La réduction des erreurs liées aux fiches papier
- La conformité aux standards OMS

---

## 📋 Architecture Globale du Module

Le module Maternité se compose de **6 grands blocs fonctionnels** interconnectés :

### ✅ 1. DOSSIER OBSTÉTRICAL
**Objectif**: Digitaliser le dossier obstétrical de base

**Fonctionnalités**:
- Sélection patient depuis le module Gestion des Patients
- Informations administratives (département, commune, zone sanitaire)
- Informations sur la patiente (nom, prénom, date naissance, groupe sanguin, etc.)
- Informations sur le conjoint (procureur)
- Antécédents obstétricaux (gestité, parité, transfusions, etc.)
- Grossesses antérieures (tableau)
- Facteurs de surveillance (11 facteurs de risque)
- Examens complémentaires (20+ examens)
- Section VIH/Syphilis

**Calculs automatiques**:
- DPA (Date Probable d'Accouchement) : DDR + 280 jours
- Âge gestationnel : (Date actuelle - DDR) / 7 jours
- Détection automatique des facteurs de risque

**Tables**: 2 tables
- `dossier_obstetrical`
- `grossesses_anterieures`

---

### ✅ 2. CONSULTATIONS PRÉNATALES (CPN)
**Objectif**: Suivi des consultations prénatales et soins promotionnels

**Fonctionnalités**:
- **Droits fondamentaux** : Sensibilisation aux 10 droits de la mère
- **Vaccination maternelle** : VAT1 à VAT5 avec calcul automatique de la prochaine dose
- **Plan d'accouchement** : Préparation et accompagnement
- **Soins promotionnels** :
  - Informations données (VIH/PTME, Paludisme, Nutrition, etc.)
  - Fournitures distribuées (Moustiquaire, Préservatifs, Fer, etc.)
- **Consultations CPN par trimestre** :
  - CPN 1er trimestre (< 13 SA)
  - CPN 2e trimestre (13-28 SA)
  - CPN 3e trimestre (> 28 SA)
  - CPN4+ (selon besoin)
- **Paramètres médicaux** : Tension, poids, température, HU, présentation, BCF
- **Tests** : Urinaires, VIH, Syphilis, Glycémie, Hémoglobine, etc.
- **Traitements** : TPI/SP (doses 1-5), Fer + Acide folique, VAT
- **Conseils à la mère** : Dangers, nutrition, PF, hygiène, allaitement
- **Référence et contre-référence**

**Calculs automatiques**:
- Trimestre basé sur l'âge gestationnel
- Prochain RDV CPN (selon protocole OMS)
- Vérification CPN obligatoires (CPN1-4)

**Tables**: 7 tables
- `droits_fondamentaux`
- `vaccination_maternelle`
- `plan_accouchement`
- `soins_promotionnels`
- `consultation_prenatale`
- `traitement_cpn`
- `conseils_mere`

---

### ✅ 3. SUIVI DU TRAVAIL – PARTOGRAMME
**Objectif**: Suivi du travail d'accouchement

**Fonctionnalités** (à implémenter):
- Dilatation cervicale
- Descente de la présentation
- Contractions utérines (fréquence, durée, intensité)
- Bruit du cœur fœtal (BCF)
- Surveillance maternelle (tension, pouls, température)
- Liquide amniotique
- Médication pendant le travail
- Détection des anomalies du travail

**Calculs automatiques**:
- Progression du travail
- Alertes si stagnation
- Détection de dystocie

**Tables**: À créer
- `partogramme`
- `observation_travail`

---

### ✅ 4. ACCOUCHEMENT (Stade 2)
**Objectif**: Digitaliser l'accouchement et l'état du nouveau-né

**Fonctionnalités**:
- **Accouchement** :
  - Date et heure
  - Type (Voie basse, Césarienne, Forceps, Ventouse)
  - Présentation (Céphalique, Siège, Transverse)
  - Complications
  - Hémorragie
- **Délivrance** :
  - Perte de sang (mL)
  - État du placenta (complet/incomplet, anomalies)
  - État du cordon (normal/anomalies)
  - Examen des membranes
  - Examen du périnée (épisiotomie, déchirures)
- **Examen du placenta** :
  - Longueur du cordon
  - Anomalies (culs-de-sac, caillots)
  - Parité
- **État du nouveau-né** :
  - Mesures (poids, taille, périmètre crânien)
  - **Scores Apgar (calcul automatique)** : 1 min, 5 min, 10 min
  - Critères Apgar détaillés (Respiration, Fréquence cardiaque, Tonus, Réflexe, Coloration)
  - Signes de danger
  - Réanimation néonatale
- **Soins immédiats** :
  - Séchage, réchauffement, peau-à-peau
  - Prophylaxie (oculaire, ARV, Vitamine K1)
  - Soins du cordon
- **Carte infantile** :
  - Vaccinations (BCG, Polio 0)
  - Vitamine A
  - Planning familial
- **Sensibilisation de la mère** (8 thèmes)
- **Référence/Transfert**

**Calculs automatiques**:
- Score Apgar total (somme des 5 critères)
- Interprétation Apgar (Normal/Modéré/Critique)
- Détection automatique des complications

**Tables**: 8 tables
- `accouchement`
- `delivrance`
- `examen_placenta`
- `nouveau_ne`
- `soins_immediats`
- `carte_infantile`
- `sensibilisation_mere`
- `reference_transfert`

---

### ✅ 5. DÉLIVRANCE (Stade 3) + PLACENTA
**Objectif**: Gestion active du 3e stade et examen du placenta

**Fonctionnalités**:
- Gestion active du 3e stade
- État du placenta
- Pertes sanguines
- Examen des membranes
- Examen du périnée

**Intégré dans**: Module Accouchement (bloc 4)

---

### ✅ 6. SURVEILLANCE POST-PARTUM IMMÉDIATE (NOUVEAU)
**Objectif**: Surveillance de la mère pendant les 2 heures suivant l'accouchement

**Fonctionnalités**:

#### 6.1 Surveillance Régulière (Toutes les 15 minutes pendant 2 heures)

**Paramètres vitaux** (8 créneaux automatiques):
- Température (°C)
- Tension artérielle (systolique/diastolique)
- Pouls (battements/min)
- Respiration (cycles/min)
- Contraction utérine
- Saignements (qualité + quantité en mL)
- Douleurs
- Œdèmes

**Fréquence automatique**: Toutes les 15 minutes (0, 15, 30, 45, 60, 75, 90, 105, 120 min)

**Alertes automatiques**:
- 🚨 HPP (si saignement > 500 mL ou abondant)
- 🚨 Tachycardie (si pouls > 100)
- 🚨 Hypotension (si TA systolique < 90)
- 🚨 Hypertension (si TA systolique > 140 ou diastolique > 90)
- 🚨 Hyperthermie (si température > 38°C)
- 🚨 Hypothermie (si température < 36°C)

#### 6.2 Évaluation Clinique Post-Partum

**Examens physiques complémentaires**:
- État du périnée (Normal/Épisiotomie/Déchirure/Hématome/Infection)
- Plaie périnéale (description)
- Saignement périnéal
- Utérus (dur, mou, rétracté)
- Rythme mictionnel
- Diurèse (mL)
- État général (Bon/Moyen/Altéré/Critique)
- Conscience (pour suspicion pré-éclampsie/choc)

**Détection automatique des risques**:
- Risque HPP
- Risque rétention placentaire
- Risque infection
- Risque hypertension
- Risque anémie sévère

#### 6.3 Traitements Administrés

**Types de traitements**:
- Ocytociques
- Antibiotiques
- Anti-inflammatoires / Antalgiques
- Solutions IV
- Fer – Acide folique
- Misoprostol
- Autres traitements d'urgence

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

#### 6.4 Conseils à la Mère

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

#### 6.5 Sortie & Transfert

**Champs**:
- Heure de sortie
- Date de sortie
- État de la mère (Stable/Stable sous surveillance/Instable/Critique)
- État détaillé
- Destination (Maternité/Hospitalisation/Référence/Domicile/Autre)
- Service de destination
- Chambre
- Accompagnant présent
- Nom de l'accompagnant
- Transport utilisé
- Dossier transféré
- Service receveur
- Agent responsable
- Signature numérique
- Observations

**Fonctionnalités**:
- Transfert numérique du dossier vers le service suivant
- Continuité des soins
- Traçabilité complète

#### 6.6 Complications Post-Partum

**Types**:
- Hémorragie post-partum (HPP)
- Rétention placentaire
- Infection
- Hypertension
- Hypotension
- Anémie sévère
- Choc
- Pré-éclampsie post-partum

**Pour chaque complication**:
- Description
- Heure de début
- Sévérité (Légère/Modérée/Sévère/Critique)
- Prise en charge
- Traitement appliqué
- Évolution (Résolue/En cours/Aggravée/Référence)
- Agent de détection
- Agent de prise en charge

**Tables**: 6 tables
- `surveillance_post_partum`
- `observation_post_partum`
- `traitement_post_partum`
- `conseils_post_partum`
- `sortie_salle_naissance`
- `complication_post_partum`

---

## 🔧 Exigences Techniques Globales

### Base de Données

**Total des tables créées**: **23 tables**

| Bloc | Tables | Fonctions SQL | Vues | Triggers |
|------|--------|---------------|------|----------|
| Dossier Obstétrical | 2 | 2 | 0 | 2 |
| CPN | 7 | 1 | 1 | 5 |
| Accouchement | 8 | 2 | 1 | 9 |
| Post-Partum | 6 | 2 | 1 | 5 |
| **TOTAL** | **23** | **7** | **3** | **21** |

### Services TypeScript

**Total des services**: **4 services**

1. `materniteService.ts` - Dossier obstétrical
2. `cpnService.ts` - Consultations prénatales
3. `accouchementService.ts` - Accouchement et nouveau-né
4. `postPartumService.ts` - Surveillance post-partum

### Interface Utilisateur

**Caractéristiques**:
- Mode sombre optionnel (salle d'accouchement)
- Grandes cases à cocher (facilité d'usage)
- Saisie tactile optimisée (tablette)
- Sauvegarde automatique
- Validation en temps réel
- Alertes visuelles claires
- Compatible offline/online

### Sécurité et Permissions

**Rôles**:
- Sage-femme : Création, modification, lecture
- Médecin : Toutes opérations + validation
- Superviseur : Lecture + statistiques + export

**Traçabilité**:
- Horodatage automatique
- Identification de l'agent
- Journalisation des modifications
- Signature numérique

### Export et Intégration

**Formats**:
- PDF (Impression fiches complètes)
- Excel (Statistiques)
- DHIS2 (Indicateurs nationaux)
- JSON (Données brutes)

**Intégrations**:
- Module Laboratoire
- Module Pharmacie
- Module Vaccination
- Module Imagerie
- Système national DHIS2

---

## 📊 Statistiques et Rapports Automatiques

### Indicateurs Globaux

**Dossier Obstétrical**:
- Total dossiers
- Gestité/Parité moyennes
- Facteurs de risque
- VIH/Syphilis positifs

**CPN**:
- Nombre de CPN par trimestre
- Taux de complétion CPN1-4
- Vaccinations VAT complétées
- Références effectuées
- Tests positifs

**Accouchement**:
- Total accouchements (vivants/morts-nés)
- Répartition par type
- Taux d'épisiotomie
- Hémorragies post-partum
- Score Apgar moyen
- Taux de réanimation
- Vaccinations néonatales

**Post-Partum**:
- Surveillances terminées
- Alertes générées (HPP, tachycardie, hypertension, hyperthermie)
- Complications détectées
- Traitements administrés
- Conseils donnés

### Rapports Disponibles

1. **Rapport de grossesse complet** (Dossier + CPN)
2. **Rapport d'accouchement** (Accouchement + Nouveau-né)
3. **Rapport post-partum** (Surveillance 2 heures)
4. **Rapport statistiques mensuel**
5. **Export DHIS2**

---

## 🎯 Résumé Synthétique du Module

| Bloc | Contenu | Tables | Statut |
|------|---------|--------|--------|
| **1. Dossier Obstétrical** | Informations de base, conjoint, antécédents, facteurs de risque, examens | 2 | ✅ Complet |
| **2. CPN** | Droits fondamentaux, vaccination, plan accouchement, soins promotionnels, consultations par trimestre | 7 | ✅ Complet |
| **3. Travail** | Partogramme dynamique | 0 | ⏳ À créer |
| **4. Accouchement** | Stade expulsif, délivrance, placenta, nouveau-né, soins immédiats | 8 | ✅ Complet |
| **5. Délivrance** | Gestion placenta & pertes | Intégré | ✅ Complet |
| **6. Post-Partum** | Surveillance 2h, traitement, conseils, sortie | 6 | ✅ Complet |

**Total**: **23 tables**, **4 services**, **7 fonctions SQL**, **3 vues**, **21 triggers**

---

## 🚀 Installation Complète

### Ordre d'Application des Migrations

```sql
-- 1. Dossier Obstétrical
supabase_migrations/create_dossier_obstetrical_table.sql

-- 2. CPN
supabase_migrations/create_cpn_tables.sql

-- 3. Accouchement
supabase_migrations/create_accouchement_tables.sql

-- 4. Post-Partum
supabase_migrations/create_post_partum_tables.sql
```

### Vérifications Post-Installation

```sql
-- Vérifier toutes les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%obstetrical%' OR table_name LIKE '%cpn%' 
OR table_name LIKE '%accouchement%' OR table_name LIKE '%post_partum%'
ORDER BY table_name;

-- Vérifier les fonctions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%maternite%' OR routine_name LIKE '%cpn%'
OR routine_name LIKE '%accouchement%' OR routine_name LIKE '%post_partum%';

-- Vérifier les vues
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public';
```

---

## ✨ Points Forts du Système Complet

### Pour le Personnel Soignant
- ✅ Parcours complet digitalisé
- ✅ Calculs automatiques (DPA, Apgar, risques)
- ✅ Alertes en temps réel
- ✅ Traçabilité complète
- ✅ Réduction des erreurs
- ✅ Conformité aux protocoles OMS

### Pour la Gestion
- ✅ Statistiques instantanées
- ✅ Rapports automatisés
- ✅ Export DHIS2
- ✅ Indicateurs de qualité
- ✅ Aide à la décision

### Pour la Qualité des Soins
- ✅ Protocoles standardisés
- ✅ Détection précoce des complications
- ✅ Suivi longitudinal mère-enfant
- ✅ Amélioration continue
- ✅ Conformité réglementaire

---

## 📝 Prochaines Étapes

### Phase 1: Interface Utilisateur (Priorité Haute)
- Créer les composants React pour chaque bloc
- Intégrer dans la page Maternité
- Tests utilisateurs

### Phase 2: Partogramme (Priorité Moyenne)
- Créer les tables pour le suivi du travail
- Créer le service partogrammeService.ts
- Créer le composant Partogramme.tsx

### Phase 3: Optimisation (Priorité Basse)
- Mode offline
- Synchronisation
- Tests unitaires
- Formation utilisateurs

---

**Version**: 2.0.0 (Version Finalisée)  
**Date**: Décembre 2024  
**Statut**: Infrastructure complète - Interface utilisateur en cours


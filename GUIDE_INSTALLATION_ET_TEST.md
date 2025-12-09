# 🚀 Guide d'Installation et Test - Module Maternité

## ✅ Objectif

Ce guide vous explique comment:
1. Appliquer toutes les migrations Supabase
2. Générer des données de démonstration
3. Vérifier que tout fonctionne correctement

---

## 📋 Pré-requis

- ✅ Compte Supabase configuré
- ✅ Projet créé sur Supabase
- ✅ Accès au SQL Editor de Supabase
- ✅ Table `patients` déjà créée (module Gestion des Patients)

---

## 🔧 Étape 1: Appliquer les Migrations

### 1.1 Connexion à Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Se connecter à votre compte
3. Sélectionner votre projet
4. Aller dans **SQL Editor** (menu de gauche)

### 1.2 Appliquer les Migrations (dans l'ordre)

#### Migration 1: Dossier Obstétrical ✅

1. Ouvrir le fichier: `supabase_migrations/create_dossier_obstetrical_table.sql`
2. Copier **tout le contenu** du fichier
3. Dans Supabase SQL Editor:
   - Cliquer sur **"New query"**
   - Coller le contenu
   - Cliquer sur **"Run"** (ou Ctrl+Enter)
4. Vérifier le message de succès

**Tables créées**: 2
- `dossier_obstetrical`
- `grossesses_anterieures`

#### Migration 2: CPN (Consultations Prénatales) ✅

1. Ouvrir le fichier: `supabase_migrations/create_cpn_tables.sql`
2. Copier **tout le contenu**
3. Dans Supabase SQL Editor:
   - Nouvelle query
   - Coller
   - Run
4. Vérifier le succès

**Tables créées**: 7
- `droits_fondamentaux`
- `vaccination_maternelle`
- `plan_accouchement`
- `soins_promotionnels`
- `consultation_prenatale`
- `traitement_cpn`
- `conseils_mere`

#### Migration 3: Accouchement et Nouveau-Né ✅

1. Ouvrir: `supabase_migrations/create_accouchement_tables.sql`
2. Copier tout
3. Nouvelle query → Coller → Run
4. Vérifier

**Tables créées**: 8
- `accouchement`
- `delivrance`
- `examen_placenta`
- `nouveau_ne`
- `soins_immediats`
- `carte_infantile`
- `sensibilisation_mere`
- `reference_transfert`

#### Migration 4: Surveillance Post-Partum ✅

1. Ouvrir: `supabase_migrations/create_post_partum_tables.sql`
2. Copier tout
3. Nouvelle query → Coller → Run
4. Vérifier

**Tables créées**: 6
- `surveillance_post_partum`
- `observation_post_partum`
- `traitement_post_partum`
- `conseils_post_partum`
- `sortie_salle_naissance`
- `complication_post_partum`

---

## 🔍 Étape 2: Vérifier les Tables Créées

Exécuter cette requête dans SQL Editor:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND (
  table_name LIKE '%obstetrical%' OR 
  table_name LIKE '%cpn%' OR 
  table_name LIKE '%accouchement%' OR 
  table_name LIKE '%post_partum%' OR
  table_name LIKE '%grossesses%' OR
  table_name LIKE '%vaccination%' OR
  table_name LIKE '%nouveau_ne%' OR
  table_name LIKE '%delivrance%' OR
  table_name LIKE '%placenta%' OR
  table_name LIKE '%surveillance%'
)
ORDER BY table_name;
```

**Résultat attendu**: 23 tables

---

## 📊 Étape 3: Générer les Données de Démonstration

### 3.1 Appliquer le Script de Démonstration

1. Ouvrir: `scripts/generate-demo-data.sql`
2. Copier **tout le contenu**
3. Nouvelle query → Coller → Run

### 3.2 Ce qui est Créé

Le script génère:

#### 3 Patientes de Test
- **Marie KOUASSI** (1ère grossesse, normale)
- **Fatima GBEDJI** (7ème grossesse, facteurs de risque)
- **Aisha SOSSOU** (jeune < 16 ans)

#### 3 Dossiers Obstétricaux
- Dossier 1: Grossesse normale
- Dossier 2: Grossesse à risque (HTA, grande multiparité)
- Dossier 3: Adolescente

#### 6 Consultations CPN
- Dossier 1: 4 CPN complètes (CPN1-4) ✅
- Dossier 2: 2 CPN avec facteurs de risque

#### 1 Accouchement Complet (Dossier 1)
- Accouchement par voie basse
- Délivrance normale
- Nouveau-né avec **Score Apgar automatique** ⭐:
  - Apgar 1 min: **8/10** (Normal)
  - Apgar 5 min: **10/10** (Excellent)
  - Apgar 10 min: **10/10** (Excellent)
- Soins immédiats (Vit K1, BCG, Polio 0)
- Carte infantile remplie

#### 1 Surveillance Post-Partum (2 heures)
- 8 observations toutes les 15 minutes
- Tous paramètres normaux
- Conseils donnés
- Sortie vers service post-partum

---

## ✅ Étape 4: Vérifier les Données

### 4.1 Vérifier le Résumé

Exécuter:

```sql
SELECT 
  'Patients' as table_name,
  COUNT(*) as count,
  'Patientes de test' as description
FROM patients
WHERE nom IN ('KOUASSI', 'GBEDJI', 'SOSSOU')
UNION ALL
SELECT 'Dossiers Obstétricaux', COUNT(*), 'Dossiers de test'
FROM dossier_obstetrical
WHERE numero_dossier LIKE 'MAT-2024-%'
UNION ALL
SELECT 'Consultations CPN', COUNT(*), 'CPN de test'
FROM consultation_prenatale
UNION ALL
SELECT 'Accouchements', COUNT(*), 'Accouchement de test'
FROM accouchement
UNION ALL
SELECT 'Nouveau-nés', COUNT(*), 'Nouveau-né avec Apgar'
FROM nouveau_ne
UNION ALL
SELECT 'Observations Post-Partum', COUNT(*), 'Observations 15 min'
FROM observation_post_partum;
```

**Résultat attendu**:
- Patients: 3
- Dossiers: 3
- CPN: 6
- Accouchements: 1
- Nouveau-nés: 1
- Observations: 8

### 4.2 Vérifier le Score Apgar

```sql
SELECT 
  'Score Apgar du nouveau-né' as titre,
  apgar_score_1min as apgar_1min,
  apgar_score_5min as apgar_5min,
  apgar_score_10min as apgar_10min,
  CASE 
    WHEN apgar_score_5min >= 7 THEN 'Normal (Vert) ✅'
    WHEN apgar_score_5min >= 4 THEN 'Modéré (Orange) ⚠️'
    ELSE 'Critique (Rouge) 🚨'
  END as interpretation
FROM nouveau_ne
LIMIT 1;
```

**Résultat attendu**:
- Apgar 1 min: 8
- Apgar 5 min: 10
- Apgar 10 min: 10
- Interprétation: Normal (Vert) ✅

### 4.3 Vérifier la Surveillance Post-Partum

```sql
SELECT 
  heure_observation,
  temperature,
  tension_arterielle_systolique,
  tension_arterielle_diastolique,
  pouls,
  saignement_quantite,
  -- Vérifier qu'aucune alerte n'est déclenchée
  CASE 
    WHEN alerte_hpp OR alerte_tachycardie OR alerte_hypertension OR 
         alerte_hyperthermie OR alerte_hypothermie OR alerte_hypotension 
    THEN '⚠️ Alerte'
    ELSE '✅ Normal'
  END as statut
FROM observation_post_partum
ORDER BY timestamp_observation;
```

**Résultat attendu**: 8 observations, toutes avec statut "✅ Normal"

---

## 🖥️ Étape 5: Tester l'Interface

### 5.1 Démarrer l'Application

```bash
npm start
```

### 5.2 Navigation

1. Aller dans **"Module Maternité"**
2. Vous devriez voir les 3 dossiers de démonstration

### 5.3 Test 1: Voir un Dossier Obstétrical

1. Onglet **"Dossiers Maternité"**
2. Cliquer sur l'icône 👁️ (Voir) du dossier **MAT-2024-001** (Marie KOUASSI)
3. Vérifier toutes les informations:
   - Informations patient
   - Conjoint
   - Antécédents
   - Facteurs de surveillance (aucun)
   - Examens

### 5.4 Test 2: Voir les CPN

1. Sélectionner le dossier **MAT-2024-001**
2. Aller dans l'onglet **"Consultations CPN"**
3. Vérifier:
   - 4 CPN affichées (CPN1-4)
   - Indicateur **"CPN Obligatoires: ✅ Complètes"**
   - Dates, termes, poids, tension

### 5.5 Test 3: Voir les Vaccinations VAT

1. Dans l'onglet **"Consultations CPN"**
2. Voir le composant **"Vaccination Maternelle"**
3. Vérifier:
   - 5/5 doses complétées ✅
   - Chip vert "5/5 doses complétées"
   - Toutes les dates remplies
   - Message "Vaccination maternelle complète"

### 5.6 Test 4: Voir l'Accouchement ⭐

1. Aller dans l'onglet **"Accouchements"**
2. Si l'accouchement n'apparaît pas directement, vous pouvez:
   - Voir les données dans Supabase
   - Ou créer un nouvel accouchement de test

**Note**: Pour voir l'accouchement de démonstration, vous devrez peut-être créer un composant d'affichage des accouchements existants (actuellement, seul le formulaire de création est visible).

### 5.7 Test 5: Créer un Nouveau Dossier

1. Onglet **"Dossiers Maternité"**
2. Cliquer **"Nouveau Dossier"**
3. Sélectionner une patiente
4. Remplir les informations:
   - Saisir la **DDR** (Date des Dernières Règles)
   - Observer que la **DPA est calculée automatiquement** ✅
5. Cocher des facteurs de surveillance
6. Observer les **alertes automatiques** si facteurs de risque ✅

### 5.8 Test 6: Créer une CPN

1. Sélectionner un dossier
2. Onglet **"Consultations CPN"**
3. Cliquer **"Nouvelle CPN"**
4. Remplir:
   - Date
   - **Terme en SA** → Observe que le **trimestre est calculé automatiquement** ✅
   - Paramètres vitaux
5. Observer que le **prochain RDV est calculé automatiquement** ✅

### 5.9 Test 7: Score Apgar Automatique ⭐

1. Créer un nouvel accouchement (ou modifier celui de démo)
2. Aller dans le formulaire **Nouveau-Né**
3. Saisir les 5 critères Apgar (valeurs 0-2):
   - Respiration: 2
   - Fréquence cardiaque: 2
   - Tonus: 2
   - Réflexe: 1
   - Coloration: 1
4. Observer:
   - **Score Apgar calculé automatiquement**: 8/10 ✅
   - **Interprétation**: "Normal (Vert)" ✅
   - **Chip vert** s'affiche
   - Si score < 7: **Alerte orange/rouge** apparaît

### 5.10 Test 8: Surveillance Post-Partum ⭐

1. Après avoir créé un accouchement
2. Onglet **"Suivi Post-Partum"**
3. Observer:
   - **8 créneaux générés automatiquement** (0, 15, 30, 45, 60, 75, 90, 105 min) ✅
   - Tableau avec tous les créneaux
4. Cliquer sur **"Modifier"** d'un créneau
5. Saisir les paramètres:
   - Température: 38.5°C → **Alerte "Hyperthermie" apparaît immédiatement** 🔥
   - Saignement: 600 mL → **Alerte "HPP" apparaît** 🚨
   - Pouls: 110 → **Alerte "Tachycardie" apparaît** 💓
6. Observer:
   - **Alertes en temps réel dans le dialog**
   - **Codes couleur dans le tableau** (rouge si critique)
   - **Emojis pour identification rapide**

---

## 🎯 Fonctionnalités à Vérifier

### ✅ Calculs Automatiques

| Fonctionnalité | Comment tester | Résultat attendu |
|---|---|---|
| **Calcul DPA** | Saisir DDR dans dossier | DPA = DDR + 280 jours |
| **Calcul Trimestre** | Saisir terme en SA dans CPN | T1/T2/T3 calculé automatiquement |
| **Prochain RDV CPN** | Créer CPN1 | Prochain RDV = Date CPN1 + 4 semaines |
| **Prochaine dose VAT** | Saisir VAT1 | VAT2 suggéré avec date recommandée |
| **Score Apgar** | Saisir 5 critères nouveau-né | Score total calculé (0-10) |
| **Créneaux Post-Partum** | Créer surveillance | 8 créneaux générés toutes les 15 min |

### ✅ Détections Automatiques

| Fonctionnalité | Comment tester | Résultat attendu |
|---|---|---|
| **Facteurs de risque** | Cocher âge < 16 dans dossier | Chip "Facteurs de risque" apparaît |
| **Alerte HPP** | Saisir saignement > 500 mL | Alerte rouge "HPP détectée" |
| **Alerte Tachycardie** | Saisir pouls > 100 | Emoji 💓 + chip orange |
| **Alerte Hyperthermie** | Saisir température > 38°C | Emoji 🔥 + chip rouge |
| **Apgar Critique** | Score Apgar < 4 | Alerte rouge "Critique - Réanimation urgente" |

### ✅ Alertes Visuelles

| Type | Couleur | Icon | Exemple |
|---|---|---|---|
| Normal | Vert 🟢 | ✅ | Apgar ≥ 7 |
| Modéré | Orange 🟡 | ⚠️ | Apgar 4-6 |
| Sévère | Rouge 🔴 | 🚨 | HPP, Apgar < 4 |
| Spécifiques | - | 🔥 ❄️ 💓 | Hyperthermie, Hypothermie, Tachycardie |

---

## 🐛 Résolution de Problèmes

### Problème 1: Erreur "patients table does not exist"

**Solution**: Créer la table `patients` d'abord (module Gestion des Patients)

### Problème 2: Migrations ne s'appliquent pas

**Solution**:
1. Vérifier les erreurs dans la console SQL Editor
2. Appliquer les migrations une par une
3. Vérifier les dépendances (foreign keys)

### Problème 3: Données de démo pas visibles dans l'interface

**Solution**:
1. Vérifier que les migrations sont appliquées
2. Vérifier que les données sont bien dans Supabase (SQL Editor)
3. Rafraîchir la page de l'application
4. Vérifier la console du navigateur pour erreurs

### Problème 4: Calculs automatiques ne fonctionnent pas

**Solution**:
1. Vérifier que les fonctions SQL sont créées
2. Vérifier la console pour erreurs JavaScript
3. Tester manuellement les calculs dans le service

---

## 📊 Statistiques Attendues

Après avoir généré les données de démo, vous devriez avoir:

### Tableau de Bord
- **3 dossiers** obstétricaux
- **6 CPN** enregistrées
- **1 accouchement** avec nouveau-né
- **8 observations** post-partum

### Indicateurs de Qualité
- **Taux CPN1-4**: 1/3 (33%) - Dossier 1 complet
- **Taux vaccination VAT complète**: 1/3 (33%) - Dossier 1
- **Score Apgar moyen**: 9.3/10 (Excellent)
- **Taux de complications post-partum**: 0% (aucune)

---

## ✅ Checklist Finale

Avant de considérer l'installation complète:

- [ ] 23 tables créées dans Supabase
- [ ] 7 fonctions SQL opérationnelles
- [ ] 3 vues créées
- [ ] 3 patientes de test créées
- [ ] 3 dossiers obstétricaux visibles
- [ ] 6 CPN affichées correctement
- [ ] Vaccinations VAT visibles
- [ ] Accouchement avec score Apgar
- [ ] Surveillance post-partum avec 8 observations
- [ ] Calcul DPA fonctionne
- [ ] Calcul Apgar fonctionne
- [ ] Détection HPP fonctionne
- [ ] Alertes visuelles s'affichent
- [ ] Aucune erreur dans la console

---

## 🎉 Succès!

Si tous les tests passent, le module Maternité est **OPÉRATIONNEL** et prêt à l'emploi!

Vous pouvez maintenant:
- Former les utilisateurs
- Créer de vrais dossiers
- Enregistrer de vraies consultations
- Utiliser les fonctionnalités automatiques

---

## 📞 Support

En cas de problème:
1. Consulter les fichiers de documentation (8 fichiers .md)
2. Vérifier les commentaires dans le code SQL
3. Vérifier la console du navigateur
4. Tester les requêtes SQL manuellement dans Supabase

---

**Version**: 1.0.0  
**Date**: Décembre 2024  
**Statut**: Guide complet d'installation et test


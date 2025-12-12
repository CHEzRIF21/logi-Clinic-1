# Guide d'Application des Migrations - Module Laboratoire

## 📋 Vue d'ensemble

Ce guide vous accompagne dans l'application des migrations SQL pour le module Laboratoire amélioré. Toutes les migrations ont été corrigées pour être idempotentes et compatibles avec Supabase.

## 🗂️ Fichiers de Migration

1. **`create_laboratoire_tables.sql`** - Phase 1 (Déjà existante)
2. **`create_laboratoire_phase2.sql`** - Phase 2 (Déjà existante)
3. **`create_laboratoire_phase3_ameliorations.sql`** - Phase 3 (✅ Corrigée)
4. **`create_laboratoire_integrations.sql`** - Intégrations (✅ Corrigée)

## ✅ Corrections Apportées

### Migration Phase 3

#### ✅ Correction 1 : INSERT conditionnel pour valeurs de référence
- **Problème** : `ON CONFLICT DO NOTHING` sur table sans contrainte UNIQUE
- **Solution** : Utilisation de blocs `DO $$ ... END $$` avec vérification `IF NOT EXISTS`

#### ✅ Correction 2 : Contrainte de clé étrangère conditionnelle
- **Problème** : Référence à table `medicaments` qui peut ne pas exister
- **Solution** : Création de la table sans contrainte, puis ajout conditionnel de la contrainte

### Migration Intégrations

#### ✅ Correction 3 : Vue statistiques simplifiée
- **Problème** : JOINs complexes pouvant causer des erreurs
- **Solution** : Utilisation de sous-requêtes indépendantes

## 🚀 Application des Migrations

### Étape 1 : Accéder à Supabase SQL Editor

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête

### Étape 2 : Vérifier l'état actuel

Exécutez cette requête pour vérifier les tables existantes :

```sql
-- Vérifier les tables du laboratoire existantes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'lab_%'
ORDER BY table_name;
```

### Étape 3 : Appliquer la Migration Phase 3

1. **Ouvrez** le fichier `supabase_migrations/create_laboratoire_phase3_ameliorations.sql`
2. **Copiez** tout le contenu
3. **Collez** dans Supabase SQL Editor
4. **Exécutez** la requête (Ctrl+Enter ou bouton Run)

**Vérification après exécution :**
```sql
-- Vérifier les nouvelles colonnes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lab_prelevements' 
AND column_name IN ('statut_echantillon', 'motif_rejet', 'date_rejet', 'agent_rejet');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lab_analyses' 
AND column_name IN ('est_pathologique', 'valeur_min_reference', 'valeur_max_reference', 'evolution');

-- Vérifier les nouvelles tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lab_modeles_examens', 'lab_valeurs_reference', 'lab_stocks_reactifs', 'lab_consommations_reactifs', 'lab_alertes');
```

### Étape 4 : Appliquer la Migration Intégrations

1. **Ouvrez** le fichier `supabase_migrations/create_laboratoire_integrations.sql`
2. **Copiez** tout le contenu
3. **Collez** dans Supabase SQL Editor
4. **Exécutez** la requête

**Vérification après exécution :**
```sql
-- Vérifier les nouvelles tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications_hospitalisation', 'commandes_achats', 'alertes_epidemiques', 'configurations_laboratoire');

-- Vérifier la colonne consultation_id
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'lab_prescriptions' 
AND column_name = 'consultation_id';

-- Tester la vue
SELECT * FROM v_laboratoire_integrations_stats;
```

### Étape 5 : Vérifier les données de référence

```sql
-- Vérifier les valeurs de référence insérées
SELECT parametre, sexe, age_min, age_max, valeur_min, valeur_max, unite, commentaire
FROM lab_valeurs_reference
ORDER BY parametre, sexe, age_min;

-- Vérifier les modèles d'examens
SELECT code_examen, libelle_examen, type_examen, actif
FROM lab_modeles_examens
ORDER BY code_examen;

-- Vérifier les configurations
SELECT cle, valeur, type, description
FROM configurations_laboratoire
ORDER BY cle;
```

## 🧪 Tests Post-Migration

### Test 1 : Créer une prescription
```sql
-- Récupérer un patient existant
SELECT id, identifiant, nom, prenom FROM patients LIMIT 1;

-- Créer une prescription (remplacez le patient_id)
INSERT INTO lab_prescriptions (patient_id, type_examen, origine, statut, prescripteur)
VALUES (
  'VOTRE_PATIENT_ID_ICI',
  'NFS',
  'consultation',
  'prescrit',
  'Dr. Test'
)
RETURNING *;
```

### Test 2 : Créer un prélèvement avec gestion du rejet
```sql
-- Créer un prélèvement (remplacez le prescription_id)
INSERT INTO lab_prelevements (
  prescription_id, 
  code_unique, 
  type_echantillon, 
  statut_echantillon,
  agent_preleveur
)
VALUES (
  'VOTRE_PRESCRIPTION_ID_ICI',
  'PL-TEST-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
  'Sang',
  'conforme',
  'Technicien Test'
)
RETURNING *;

-- Tester le rejet d'échantillon
UPDATE lab_prelevements
SET statut_echantillon = 'rejete',
    motif_rejet = 'Sang hémolysé',
    date_rejet = NOW(),
    agent_rejet = 'Technicien Test'
WHERE code_unique LIKE 'PL-TEST-%'
RETURNING *;
```

### Test 3 : Créer une analyse avec valeurs de référence
```sql
-- Créer une analyse (remplacez le prelevement_id)
INSERT INTO lab_analyses (
  prelevement_id,
  parametre,
  type_resultat,
  valeur_numerique,
  unite,
  valeur_min_reference,
  valeur_max_reference,
  technicien
)
VALUES (
  'VOTRE_PRELEVEMENT_ID_ICI',
  'Hémoglobine',
  'quantitatif',
  14.5,
  'g/dL',
  12.0,
  16.0,
  'Technicien Test'
)
RETURNING parametre, valeur_numerique, est_pathologique;

-- Tester avec valeur pathologique (hors normes)
INSERT INTO lab_analyses (
  prelevement_id,
  parametre,
  type_resultat,
  valeur_numerique,
  unite,
  valeur_min_reference,
  valeur_max_reference
)
VALUES (
  'VOTRE_PRELEVEMENT_ID_ICI',
  'Hémoglobine',
  'quantitatif',
  10.0, -- En dessous de la normale
  'g/dL',
  12.0,
  16.0
)
RETURNING parametre, valeur_numerique, est_pathologique; -- Devrait être true
```

### Test 4 : Vérifier les triggers automatiques
```sql
-- Vérifier qu'une alerte est créée automatiquement pour résultat pathologique
SELECT * FROM lab_alertes 
WHERE type_alerte = 'resultat_critique' 
ORDER BY date_alerte DESC 
LIMIT 5;
```

### Test 5 : Tester les modèles d'examens
```sql
-- Récupérer un modèle d'examen
SELECT code_examen, libelle_examen, parametres::text
FROM lab_modeles_examens
WHERE code_examen = 'NFS';

-- Vérifier la structure JSON des paramètres
SELECT 
  code_examen,
  jsonb_array_elements(parametres) as parametre
FROM lab_modeles_examens
WHERE code_examen = 'NFS';
```

## 🔍 Vérification Complète

### Script de vérification complet

```sql
-- 1. Vérifier toutes les tables
SELECT 
  'Tables créées' as verification,
  COUNT(*) as nombre
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'lab_%'
UNION ALL
SELECT 
  'Tables intégrations',
  COUNT(*)
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications_hospitalisation', 'commandes_achats', 'alertes_epidemiques', 'configurations_laboratoire')
UNION ALL
SELECT 
  'Valeurs de référence',
  COUNT(*)
FROM lab_valeurs_reference
UNION ALL
SELECT 
  'Modèles d'examens',
  COUNT(*)
FROM lab_modeles_examens
UNION ALL
SELECT 
  'Configurations',
  COUNT(*)
FROM configurations_laboratoire
UNION ALL
SELECT 
  'Fonctions créées',
  COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('check_resultat_pathologique', 'create_alerte_resultat_critique', 'update_updated_at_column')
UNION ALL
SELECT 
  'Triggers créés',
  COUNT(*)
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%lab_%';
```

## ⚠️ Résolution de Problèmes

### Erreur : "relation does not exist"
**Cause** : Une table référencée n'existe pas encore.
**Solution** : Vérifiez que les migrations Phase 1 et Phase 2 sont appliquées.

### Erreur : "column already exists"
**Cause** : La colonne existe déjà (migration déjà partiellement appliquée).
**Solution** : Normal, les migrations utilisent `IF NOT EXISTS`. Vous pouvez ignorer cette erreur.

### Erreur : "function already exists"
**Cause** : La fonction existe déjà.
**Solution** : Normal, les fonctions utilisent `CREATE OR REPLACE`. La fonction sera mise à jour.

### Erreur : "constraint already exists"
**Cause** : La contrainte existe déjà.
**Solution** : Les migrations vérifient l'existence. Si l'erreur persiste, vérifiez manuellement :
```sql
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'lab_stocks_reactifs';
```

### Erreur : "syntax error at or near"
**Cause** : Erreur de syntaxe SQL.
**Solution** : Vérifiez que vous avez copié tout le contenu du fichier. Vérifiez les guillemets et les caractères spéciaux.

## 📊 Vérification des Performances

### Vérifier les index créés
```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'lab_%'
ORDER BY tablename, indexname;
```

### Vérifier les triggers
```sql
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table LIKE 'lab_%'
ORDER BY event_object_table, trigger_name;
```

## ✅ Checklist Finale

- [ ] Migration Phase 3 appliquée sans erreur
- [ ] Migration Intégrations appliquée sans erreur
- [ ] Toutes les tables créées (vérification avec SELECT)
- [ ] Toutes les colonnes ajoutées (vérification avec SELECT)
- [ ] Toutes les fonctions créées
- [ ] Tous les triggers créés
- [ ] Données de référence insérées (au moins 10 lignes)
- [ ] Modèles d'examens insérées (au moins 4 modèles)
- [ ] Configurations par défaut insérées (5 configurations)
- [ ] Vue statistiques fonctionnelle
- [ ] Tests post-migration réussis
- [ ] Index créés pour performance
- [ ] Aucune erreur dans les logs Supabase

## 🎯 Prochaines Étapes

Une fois les migrations appliquées :

1. **Tester l'interface** : Ouvrez le module Laboratoire dans l'application
2. **Créer une prescription** : Testez le flux complet
3. **Vérifier les valeurs de référence** : Vérifiez qu'elles s'affichent correctement
4. **Tester le Delta Check** : Créez plusieurs analyses pour le même paramètre
5. **Vérifier les alertes** : Créez un résultat pathologique et vérifiez l'alerte

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Supabase Dashboard → Logs
2. Vérifiez que toutes les migrations précédentes sont appliquées
3. Consultez la documentation Supabase
4. Vérifiez les contraintes et dépendances

## 🎉 Résultat Attendu

Après application réussie des migrations, vous devriez avoir :
- ✅ 13 tables du module Laboratoire
- ✅ 4 tables d'intégration
- ✅ 2 fonctions automatiques
- ✅ 10+ triggers
- ✅ 10+ valeurs de référence
- ✅ 4 modèles d'examens
- ✅ 5 configurations
- ✅ 1 vue statistiques

Le module Laboratoire est maintenant prêt à être utilisé avec toutes ses fonctionnalités avancées !


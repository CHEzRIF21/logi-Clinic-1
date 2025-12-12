# Migrations Laboratoire - Corrections et Guide d'Application

## Vue d'ensemble

Ce document décrit les corrections apportées aux migrations SQL du module Laboratoire pour assurer leur compatibilité avec le backend Supabase.

## Migrations à Appliquer

### Ordre d'application

1. **`create_laboratoire_tables.sql`** (Phase 1 - Déjà existante)
2. **`create_laboratoire_phase2.sql`** (Phase 2 - Déjà existante)
3. **`create_laboratoire_phase3_ameliorations.sql`** (Phase 3 - Corrigée)
4. **`create_laboratoire_integrations.sql`** (Intégrations - Corrigée)

## Corrections Apportées

### 1. Migration Phase 3 (`create_laboratoire_phase3_ameliorations.sql`)

#### Problème 1 : INSERT avec ON CONFLICT sur table sans contrainte unique
**Avant :**
```sql
INSERT INTO lab_valeurs_reference (...) VALUES (...)
ON CONFLICT DO NOTHING;
```

**Après :**
```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM lab_valeurs_reference WHERE ...) THEN
    INSERT INTO lab_valeurs_reference (...) VALUES (...);
  END IF;
END $$;
```

**Raison :** La table `lab_valeurs_reference` n'a pas de contrainte UNIQUE, donc ON CONFLICT ne fonctionne pas.

#### Problème 2 : Contrainte de clé étrangère sur table qui peut ne pas exister
**Avant :**
```sql
CREATE TABLE lab_stocks_reactifs (
  ...
  medicament_id UUID REFERENCES medicaments(id),
  ...
);
```

**Après :**
```sql
CREATE TABLE lab_stocks_reactifs (
  ...
  medicament_id UUID, -- Sans contrainte initiale
  ...
);

-- Ajout conditionnel de la contrainte
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medicaments') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'lab_stocks_reactifs_medicament_id_fkey'
    ) THEN
      ALTER TABLE lab_stocks_reactifs 
      ADD CONSTRAINT lab_stocks_reactifs_medicament_id_fkey 
      FOREIGN KEY (medicament_id) REFERENCES medicaments(id);
    END IF;
  END IF;
END $$;
```

**Raison :** La table `medicaments` peut ne pas exister dans tous les environnements.

### 2. Migration Intégrations (`create_laboratoire_integrations.sql`)

#### Problème : Vue avec JOINs complexes pouvant causer des erreurs
**Avant :**
```sql
CREATE OR REPLACE VIEW v_laboratoire_integrations_stats AS
SELECT 
  COUNT(DISTINCT lp.id) as total_prescriptions,
  COUNT(DISTINCT lp.consultation_id) as prescriptions_avec_consultation,
  ...
FROM lab_prescriptions lp
LEFT JOIN notifications_hospitalisation nh ON nh.patient_id = lp.patient_id
LEFT JOIN commandes_achats ca ON ca.type = 'reactif_laboratoire'
LEFT JOIN alertes_epidemiques ae ON ae.statut IN ('nouvelle', 'en_cours');
```

**Après :**
```sql
CREATE OR REPLACE VIEW v_laboratoire_integrations_stats AS
SELECT 
  (SELECT COUNT(*) FROM lab_prescriptions) as total_prescriptions,
  (SELECT COUNT(*) FROM lab_prescriptions WHERE consultation_id IS NOT NULL) as prescriptions_avec_consultation,
  CASE 
    WHEN (SELECT COUNT(*) FROM lab_prescriptions) > 0 
    THEN (SELECT COUNT(*) FROM lab_prescriptions WHERE consultation_id IS NOT NULL) * 100.0 / (SELECT COUNT(*) FROM lab_prescriptions)
    ELSE 0 
  END as taux_integration_consultation,
  (SELECT COUNT(*) FROM notifications_hospitalisation) as total_notifications_hospitalisation,
  (SELECT COUNT(*) FROM notifications_hospitalisation WHERE statut = 'nouvelle') as notifications_en_attente,
  (SELECT COUNT(*) FROM commandes_achats WHERE type = 'reactif_laboratoire') as total_commandes_reactifs,
  (SELECT COUNT(*) FROM commandes_achats WHERE type = 'reactif_laboratoire' AND statut = 'en_attente') as commandes_en_attente,
  (SELECT COUNT(*) FROM alertes_epidemiques) as total_alertes_epidemiques,
  (SELECT COUNT(*) FROM alertes_epidemiques WHERE statut IN ('nouvelle', 'en_cours')) as alertes_epidemiques_actives;
```

**Raison :** Les JOINs peuvent causer des problèmes si les tables sont vides ou si les relations ne sont pas claires. Les sous-requêtes sont plus robustes.

## Guide d'Application

### Étape 1 : Vérifier les migrations existantes

Dans Supabase SQL Editor, vérifiez que les migrations Phase 1 et Phase 2 sont déjà appliquées :

```sql
-- Vérifier l'existence des tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lab_prescriptions', 'lab_prelevements', 'lab_analyses', 'lab_rapports');
```

### Étape 2 : Appliquer la migration Phase 3

1. Ouvrez Supabase SQL Editor
2. Copiez le contenu de `supabase_migrations/create_laboratoire_phase3_ameliorations.sql`
3. Exécutez le script
4. Vérifiez les erreurs éventuelles

**Vérification :**
```sql
-- Vérifier les nouvelles tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'lab_%';

-- Vérifier les nouvelles colonnes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lab_prelevements' 
AND column_name IN ('statut_echantillon', 'motif_rejet');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lab_analyses' 
AND column_name IN ('est_pathologique', 'valeur_min_reference', 'evolution');
```

### Étape 3 : Appliquer la migration Intégrations

1. Copiez le contenu de `supabase_migrations/create_laboratoire_integrations.sql`
2. Exécutez le script
3. Vérifiez les erreurs éventuelles

**Vérification :**
```sql
-- Vérifier les nouvelles tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications_hospitalisation', 'commandes_achats', 'alertes_epidemiques', 'configurations_laboratoire');

-- Vérifier la vue
SELECT * FROM v_laboratoire_integrations_stats;
```

### Étape 4 : Vérifier les données de référence

```sql
-- Vérifier les valeurs de référence
SELECT * FROM lab_valeurs_reference ORDER BY parametre, sexe, age_min;

-- Vérifier les modèles d'examens
SELECT code_examen, libelle_examen, type_examen FROM lab_modeles_examens WHERE actif = true;
```

### Étape 5 : Vérifier les configurations

```sql
-- Vérifier les configurations
SELECT * FROM configurations_laboratoire;
```

## Résolution de Problèmes

### Erreur : "relation already exists"
**Solution :** Les migrations utilisent `CREATE TABLE IF NOT EXISTS` et `ADD COLUMN IF NOT EXISTS`, donc cette erreur ne devrait pas se produire. Si elle apparaît, vérifiez que vous n'exécutez pas deux fois la même migration.

### Erreur : "column already exists"
**Solution :** Normal, les migrations vérifient l'existence avant d'ajouter. Vous pouvez ignorer cette erreur.

### Erreur : "function already exists"
**Solution :** Les fonctions utilisent `CREATE OR REPLACE FUNCTION`, donc elles seront mises à jour automatiquement.

### Erreur : "constraint already exists"
**Solution :** Les migrations vérifient l'existence des contraintes avant de les créer. Si l'erreur persiste, supprimez manuellement la contrainte et réexécutez.

## Tests Post-Migration

### Test 1 : Créer une prescription
```sql
INSERT INTO lab_prescriptions (patient_id, type_examen, origine, statut)
VALUES (
  (SELECT id FROM patients LIMIT 1),
  'NFS',
  'consultation',
  'prescrit'
);
```

### Test 2 : Créer un prélèvement avec rejet
```sql
INSERT INTO lab_prelevements (prescription_id, code_unique, type_echantillon, statut_echantillon, motif_rejet)
VALUES (
  (SELECT id FROM lab_prescriptions LIMIT 1),
  'PL-TEST-001',
  'Sang',
  'rejete',
  'Sang hémolysé'
);
```

### Test 3 : Créer une analyse avec valeurs de référence
```sql
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
  (SELECT id FROM lab_prelevements LIMIT 1),
  'Hémoglobine',
  'quantitatif',
  14.5,
  'g/dL',
  12.0,
  16.0
);
```

### Test 4 : Vérifier le calcul automatique pathologique
```sql
-- Vérifier qu'une valeur hors normes est marquée pathologique
SELECT parametre, valeur_numerique, valeur_min_reference, valeur_max_reference, est_pathologique
FROM lab_analyses
WHERE valeur_numerique < valeur_min_reference OR valeur_numerique > valeur_max_reference;
```

## Checklist de Vérification

- [ ] Migration Phase 3 appliquée sans erreur
- [ ] Migration Intégrations appliquée sans erreur
- [ ] Toutes les tables créées
- [ ] Toutes les colonnes ajoutées
- [ ] Toutes les fonctions créées
- [ ] Tous les triggers créés
- [ ] Données de référence insérées
- [ ] Modèles d'examens insérées
- [ ] Configurations par défaut insérées
- [ ] Vue statistiques fonctionnelle
- [ ] Tests post-migration réussis

## Notes Importantes

1. **Idempotence** : Toutes les migrations sont idempotentes et peuvent être exécutées plusieurs fois sans problème.

2. **Compatibilité** : Les migrations vérifient l'existence des dépendances avant de créer des contraintes.

3. **Données de référence** : Les valeurs de référence sont insérées avec vérification conditionnelle pour éviter les doublons.

4. **Performance** : Les index sont créés pour améliorer les performances des requêtes.

5. **Sécurité** : Les triggers automatiques assurent la cohérence des données.

## Support

En cas de problème lors de l'application des migrations :
1. Vérifiez les logs d'erreur dans Supabase
2. Vérifiez que les migrations précédentes sont appliquées
3. Vérifiez les dépendances (tables, fonctions)
4. Consultez la documentation Supabase pour les erreurs spécifiques


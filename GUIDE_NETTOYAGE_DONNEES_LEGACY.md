# Guide de Nettoyage des Données Legacy

## 📋 Vue d'Ensemble

Ce guide décrit le processus de nettoyage sécurisé des données legacy créées avant la correction de l'architecture multi-tenant.

## 🎯 Objectifs

1. ✅ Assigner chaque enregistrement à sa clinique correcte
2. ✅ Marquer comme orphelins les enregistrements non assignables
3. ✅ Nettoyer les utilisateurs partagés (sauf SUPER_ADMIN)
4. ✅ Ajouter des contraintes NOT NULL et FK
5. ✅ Garantir l'isolation complète entre cliniques

## 🔒 Règles de Sécurité

- ❌ **NE JAMAIS** supprimer de cliniques
- ❌ **NE JAMAIS** merger de cliniques
- ❌ **NE JAMAIS** dupliquer de données
- ✅ **TOUJOURS** logger tous les changements
- ✅ **TOUJOURS** marquer comme orphelins les données non assignables

## 📊 Stratégie d'Assignment

### 1. Patients
1. Depuis leur créateur (`created_by` → `users.clinic_id`)
2. Depuis leur première consultation (`consultations.clinic_id`)
3. Depuis leur première facture (`factures.clinic_id`)
4. Si aucun critère: **Marquer comme orphelin**

### 2. Factures
1. Depuis leur patient (`patient_id` → `patients.clinic_id`)
2. Si aucun patient: **Marquer comme orpheline**

### 3. Consultations
1. Depuis leur patient (`patient_id` → `patients.clinic_id`)
2. Si aucun patient: **Marquer comme orpheline**

### 4. Paiements
1. Depuis leur facture (`facture_id` → `factures.clinic_id`)
2. Si aucune facture: **Marquer comme orphelin**

### 5. Prescriptions
1. Depuis leur consultation (`consultation_id` → `consultations.clinic_id`)
2. Si aucune consultation: **Marquer comme orpheline**

### 6. Lab Requests & Imaging Requests
1. Depuis leur consultation (`consultation_id` → `consultations.clinic_id`)
2. Si aucune consultation: **Marquer comme orphelin**

### 7. Médicaments
1. Depuis leur créateur (`created_by` → `users.clinic_id`)
2. Si aucun créateur: **Laisser NULL** (peuvent être globaux)

### 8. Utilisateurs
1. Depuis leurs créations (patients créés)
2. Si aucune création: Assigner à la première clinique
3. **Exception**: SUPER_ADMIN peut avoir `clinic_id = NULL`

## 🗂️ Clinique ORPHANED

Une clinique spéciale `ORPHANED` est créée pour les données qu'on ne peut pas assigner sûrement:
- Code: `ORPHANED`
- Nom: `Données Orphelines (Non Assignables)`
- Active: `false`

Ces données peuvent être révisées manuellement plus tard.

## 📝 Table de Log

Tous les changements sont enregistrés dans `data_cleanup_log`:

```sql
SELECT * FROM data_cleanup_log 
ORDER BY created_at DESC;
```

Colonnes:
- `table_name`: Table affectée
- `action`: Type d'action (ASSIGNED_FROM_*, ORPHANED, etc.)
- `record_id`: ID de l'enregistrement (si applicable)
- `old_clinic_id`: Ancien clinic_id
- `new_clinic_id`: Nouveau clinic_id
- `reason`: Raison du changement
- `created_at`: Date/heure du changement

## 🚀 Exécution

### Étape 1: Backup (OBLIGATOIRE)

```sql
-- Créer un backup de toutes les tables critiques
CREATE TABLE patients_backup AS SELECT * FROM patients;
CREATE TABLE factures_backup AS SELECT * FROM factures;
CREATE TABLE consultations_backup AS SELECT * FROM consultations;
CREATE TABLE paiements_backup AS SELECT * FROM paiements;
CREATE TABLE prescriptions_backup AS SELECT * FROM prescriptions;
CREATE TABLE users_backup AS SELECT * FROM users;
```

### Étape 2: Exécuter la Migration

```bash
# Via Supabase CLI
supabase migration up

# Ou via MCP Supabase
# Appliquer le fichier supabase_migrations/59_SAFE_LEGACY_DATA_CLEANUP.sql
```

### Étape 3: Vérification

```sql
-- Vérifier les données orphelines
SELECT 
  'patients' as table_name,
  COUNT(*) as orphan_count
FROM patients p
JOIN clinics c ON p.clinic_id = c.id
WHERE c.code = 'ORPHANED'

UNION ALL

SELECT 
  'factures' as table_name,
  COUNT(*) as orphan_count
FROM factures f
JOIN clinics c ON f.clinic_id = c.id
WHERE c.code = 'ORPHANED'

UNION ALL

SELECT 
  'consultations' as table_name,
  COUNT(*) as orphan_count
FROM consultations c
JOIN clinics cl ON c.clinic_id = cl.id
WHERE cl.code = 'ORPHANED';

-- Vérifier l'isolation par clinique
SELECT 
  c.code as clinic_code,
  COUNT(DISTINCT p.id) as patient_count,
  COUNT(DISTINCT f.id) as invoice_count,
  COUNT(DISTINCT cons.id) as consultation_count
FROM clinics c
LEFT JOIN patients p ON p.clinic_id = c.id
LEFT JOIN factures f ON f.clinic_id = c.id
LEFT JOIN consultations cons ON cons.clinic_id = c.id
WHERE c.code != 'ORPHANED'
GROUP BY c.id, c.code
ORDER BY c.code;
```

## ✅ Vérifications Post-Nettoyage

1. **Isolation par Clinique**
   - Se connecter avec un utilisateur de la clinique A
   - Vérifier qu'il ne voit QUE les données de la clinique A
   - Se connecter avec un utilisateur de la clinique B
   - Vérifier qu'il ne voit QUE les données de la clinique B

2. **Données Orphelines**
   - Vérifier le nombre de données orphelines
   - Réviser manuellement si nécessaire
   - Réassigner si possible

3. **Contraintes**
   - Vérifier que toutes les FK sont en place
   - Vérifier qu'il n'y a plus de `clinic_id` invalides

4. **Utilisateurs**
   - Vérifier que chaque utilisateur (sauf SUPER_ADMIN) a un `clinic_id`
   - Vérifier qu'il n'y a pas d'utilisateurs partagés entre cliniques

## 🔧 Maintenance Future

### Réassigner des Données Orphelines

```sql
-- Exemple: Réassigner un patient orphelin à une clinique
UPDATE patients
SET clinic_id = 'UUID-DE-LA-CLINIQUE'
WHERE id = 'UUID-DU-PATIENT'
  AND clinic_id = (SELECT id FROM clinics WHERE code = 'ORPHANED');
```

### Nettoyer les Données Orphelines (si nécessaire)

```sql
-- ATTENTION: Ne faire cela QUE si vous êtes sûr que les données ne sont plus nécessaires
-- DELETE FROM patients WHERE clinic_id = (SELECT id FROM clinics WHERE code = 'ORPHANED');
```

## 📞 Support

En cas de problème:
1. Consulter la table `data_cleanup_log`
2. Vérifier les backups créés
3. Restaurer depuis les backups si nécessaire

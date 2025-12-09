# Instructions pour appliquer les migrations Supabase

## ⚠️ IMPORTANT : Avant de créer un patient

Les migrations SQL doivent être appliquées dans Supabase pour que le logiciel fonctionne correctement.

## Étapes pour appliquer les migrations

### 1. Ouvrir Supabase Dashboard
- Allez sur https://supabase.com/dashboard
- Sélectionnez votre projet

### 2. Ouvrir l'éditeur SQL
- Cliquez sur "SQL Editor" dans le menu de gauche
- Cliquez sur "New query"

### 3. Appliquer les migrations dans l'ordre suivant :

#### Migration 1 : Ajout des colonnes Accompagnant et Personne à prévenir
Copiez et exécutez le contenu du fichier :
```
supabase_migrations/add_patient_accompagnant_personne_prevenir.sql
```

#### Migration 2 : Création de la table patient_files
Copiez et exécutez le contenu du fichier :
```
supabase_migrations/create_patient_files_table.sql
```

#### Migration 3 : Création de la table patient_care_timeline
Copiez et exécutez le contenu du fichier :
```
supabase_migrations/create_patient_care_timeline_table.sql
```

#### Migration 4 : Création du bucket Storage pour les fichiers
Copiez et exécutez le contenu du fichier :
```
supabase_migrations/create_patient_files_storage_bucket.sql
```

### 4. Vérifier les migrations
Après avoir exécuté les migrations, vérifiez que :
- Les colonnes `accompagnant_*` et `personne_prevenir_*` existent dans la table `patients`
- La table `patient_files` existe
- La table `patient_care_timeline` existe
- Le bucket `patient-files` existe dans Storage

### 5. Configurer les politiques RLS (Row Level Security)
Si nécessaire, configurez les politiques RLS pour permettre l'accès aux données selon vos besoins de sécurité.

## Vérification rapide

Vous pouvez vérifier que les migrations sont appliquées en exécutant cette requête SQL :

```sql
-- Vérifier les colonnes de la table patients
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name LIKE '%accompagnant%' OR column_name LIKE '%personne_prevenir%';

-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('patient_files', 'patient_care_timeline');
```

## En cas d'erreur

Si vous rencontrez une erreur lors de la création d'un patient indiquant que des colonnes n'existent pas, cela signifie que les migrations n'ont pas été appliquées. Suivez les étapes ci-dessus pour les appliquer.


# Correction de la contrainte unique sur la table `lots`

## Problème identifié

L'erreur suivante s'affichait lors de la validation des transferts :

```
Erreur: duplicate key value violates unique constraint "lots_medicament_id_numero_lot_key"
```

### Cause du problème

La contrainte unique sur la table `lots` était définie comme `UNIQUE(medicament_id, numero_lot)` sans inclure le champ `magasin`. Cela empêchait d'avoir le même numéro de lot pour un médicament dans les deux magasins (gros et détail), ce qui est pourtant nécessaire pour le fonctionnement des transferts internes.

## Solution appliquée

### 1. Modification de la contrainte unique (Base de données)

La migration SQL `fix_lots_unique_constraint.sql` a été créée pour :
- Supprimer l'ancienne contrainte `UNIQUE(medicament_id, numero_lot)`
- Ajouter une nouvelle contrainte `UNIQUE(medicament_id, numero_lot, magasin)`
- Créer un index pour optimiser les performances

### 2. Amélioration de la gestion des erreurs (Code TypeScript)

Le service `stockService.ts` a été modifié pour :
- Détecter les erreurs de contrainte unique (code PostgreSQL 23505)
- Réessayer automatiquement de récupérer le lot en cas d'erreur de doublon
- Afficher des messages d'erreur plus clairs pour l'utilisateur

### 3. Correction du thème MUI

Le fichier `healthcareTheme.ts` a été corrigé pour :
- Compléter le tableau `shadows` avec 25 valeurs (indices 0-24)
- Éliminer l'avertissement MUI sur l'élévation 24 des Dialog

## Instructions pour appliquer la migration

### Étape 1 : Exécuter la migration SQL

Connectez-vous à votre base de données Supabase et exécutez le fichier :

```bash
supabase_migrations/fix_lots_unique_constraint.sql
```

Ou via l'interface Supabase :
1. Aller dans "SQL Editor"
2. Copier le contenu du fichier `fix_lots_unique_constraint.sql`
3. Exécuter la requête

### Étape 2 : Redémarrer l'application

Après avoir appliqué la migration, redémarrez l'application :

```bash
npm run dev
```

## Vérification

Pour vérifier que la correction fonctionne :

1. Créez une demande de transfert du Magasin Gros vers le Magasin Détail
2. Validez le transfert
3. Le transfert devrait se valider sans erreur
4. Vérifiez que le lot existe maintenant dans les deux magasins avec le même numéro de lot

## Impact

Cette correction permet maintenant :
- ✅ D'avoir le même numéro de lot dans le Magasin Gros et le Magasin Détail
- ✅ De valider les transferts sans erreur de contrainte
- ✅ De tracer correctement l'origine des lots transférés
- ✅ D'afficher des messages d'erreur plus clairs en cas de problème

## Note importante

Cette modification est **rétrocompatible** et n'affecte pas les données existantes. Les lots déjà présents dans la base de données continueront de fonctionner normalement.

---

**Date de correction :** 17 décembre 2025
**Fichiers modifiés :**
- `supabase_migrations/fix_lots_unique_constraint.sql` (nouveau)
- `src/services/stockService.ts` (modifié)
- `src/theme/healthcareTheme.ts` (modifié)

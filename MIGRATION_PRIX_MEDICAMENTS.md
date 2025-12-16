# Migration : Ajout des colonnes de prix pour les médicaments

## 📋 Résumé

Cette migration ajoute les colonnes nécessaires pour gérer séparément les prix d'achat (entrée) et les prix de vente (détail) des médicaments.

## 🎯 Objectif

Permettre la gestion de trois types de prix pour chaque médicament :
- **Prix Unitaire d'Entrée** : Prix d'achat par unité
- **Prix Total d'Entrée** : Montant total de l'achat
- **Prix Unitaire Détail** : Prix de vente au détail (pharmacie/magasin détail)

## 📝 Fichiers modifiés

### 1. Types TypeScript
- ✅ `src/services/stockSupabase.ts` : Ajout des champs dans `MedicamentSupabase` et `MedicamentFormData`

### 2. Services
- ✅ `src/services/medicamentService.ts` : Support des nouveaux champs (déjà compatible)
- ✅ `src/services/dispensationService.ts` : Utilise maintenant `prix_unitaire_detail` pour la dispensation

### 3. Composants
- ✅ `src/pages/StockMedicaments.tsx` : Envoie les nouveaux champs lors de la création
- ✅ `src/components/pharmacy/NouvelleDispensationWizard.tsx` : Utilise le prix détail

### 4. Migration SQL
- ✅ `supabase_migrations/add_medicament_pricing_columns.sql` : Migration à appliquer

## 🚀 Application de la migration

### Option 1 : Via Supabase Dashboard

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez le contenu de `supabase_migrations/add_medicament_pricing_columns.sql`
4. Exécutez la requête

### Option 2 : Via CLI Supabase

```bash
# Si vous utilisez Supabase CLI
supabase db push

# Ou directement
psql -h [VOTRE_HOST] -U postgres -d postgres -f supabase_migrations/add_medicament_pricing_columns.sql
```

### Option 3 : Via le script PowerShell

```powershell
# Exécutez le script de déploiement
.\deploy-supabase.ps1
```

## 📊 Colonnes ajoutées

| Colonne | Type | Description |
|---------|------|-------------|
| `prix_unitaire_entree` | DECIMAL(10,2) | Prix d'achat par unité |
| `prix_total_entree` | DECIMAL(10,2) | Montant total de l'achat |
| `prix_unitaire_detail` | DECIMAL(10,2) | Prix de vente au détail (pharmacie) |
| `seuil_maximum` | INTEGER | Seuil maximum de stock |
| `dci` | VARCHAR(200) | Dénomination Commune Internationale |
| `observations` | TEXT | Observations générales |

## 🔄 Migration des données existantes

La migration SQL inclut des mises à jour automatiques :
- `prix_unitaire_detail` = `prix_unitaire` (si non défini)
- `prix_unitaire_entree` = 70% de `prix_unitaire` (si non défini)

## ✅ Vérification

Après l'application de la migration, vérifiez que :

1. Les colonnes existent dans la table `medicaments` :
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'medicaments' 
AND column_name IN ('prix_unitaire_entree', 'prix_total_entree', 'prix_unitaire_detail', 'seuil_maximum', 'dci', 'observations');
```

2. Les données existantes ont été migrées :
```sql
SELECT 
  code, 
  nom, 
  prix_unitaire, 
  prix_unitaire_entree, 
  prix_unitaire_detail 
FROM medicaments 
LIMIT 10;
```

## 🎨 Utilisation dans l'interface

### Création d'un médicament
Dans le module **Stock des Médicaments**, lors de la création d'un nouveau médicament :
- Remplir **Prix Unitaire d'Entrée** (achat)
- Remplir **Prix Total d'Entrée** (optionnel)
- Remplir **Prix Unitaire Détail** (vente pharmacie) ⚠️ **OBLIGATOIRE**

### Dispensation
Le système utilise automatiquement le **Prix Unitaire Détail** pour toutes les dispensations en pharmacie/magasin détail.

## ⚠️ Notes importantes

1. **Le Prix Unitaire Détail est le prix utilisé par la pharmacie** pour toutes les dispensations
2. Les prix d'entrée sont modifiables uniquement dans le module **Stock des Médicaments**
3. Le `prix_unitaire` existant reste pour la compatibilité mais le système privilégie `prix_unitaire_detail`

## 🔧 Dépannage

### Erreur : "column does not exist"
- Vérifiez que la migration a bien été appliquée
- Vérifiez que vous êtes connecté à la bonne base de données

### Erreur : "duplicate key value"
- Normal si vous exécutez la migration plusieurs fois
- La migration utilise `IF NOT EXISTS` pour éviter les erreurs

### Les prix ne s'affichent pas
- Vérifiez que les médicaments ont bien les nouveaux champs remplis
- Videz le cache du navigateur
- Redémarrez l'application

## 📞 Support

En cas de problème, vérifiez :
1. Les logs de la console du navigateur
2. Les logs Supabase
3. La structure de la table `medicaments`


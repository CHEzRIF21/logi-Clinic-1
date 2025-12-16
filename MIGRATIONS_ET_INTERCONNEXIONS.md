# Guide des Migrations et Interconnexions

Ce document décrit les migrations Supabase et les interconnexions entre les modules du système.

## 📋 Table des matières

1. [Migrations Supabase](#migrations-supabase)
2. [Interconnexions entre modules](#interconnexions-entre-modules)
3. [Application des migrations](#application-des-migrations)
4. [Vérification du système](#vérification-du-système)

## 🗄️ Migrations Supabase

### Ordre d'application des migrations

Les migrations doivent être appliquées dans cet ordre :

1. **create_stock_tables.sql**
   - Crée les tables de base pour la gestion des stocks
   - Tables: `medicaments`, `lots`, `mouvements_stock`, `transferts`, `transfert_lignes`, `dispensations`, `dispensation_lignes`, `alertes_stock`, `inventaires`, `inventaire_lignes`, `pertes_retours`

2. **add_medicament_pricing_columns.sql**
   - Ajoute les colonnes de prix aux médicaments
   - Colonnes ajoutées: `prix_unitaire_entree`, `prix_total_entree`, `prix_unitaire_detail`, `seuil_maximum`, `dci`, `observations`

3. **enhance_dispensation_tables.sql**
   - Améliore les tables de dispensation pour la traçabilité complète
   - Ajoute des colonnes aux tables `dispensations` et `dispensation_lignes`
   - Crée la table `dispensation_audit`
   - Crée la fonction `generer_numero_dispensation()`

4. **consolidate_stock_dispensation_schema.sql** ⭐ **RECOMMANDÉ**
   - Migration consolidée qui vérifie et crée toutes les colonnes nécessaires
   - S'assure que le schéma est cohérent
   - Crée les fonctions RPC nécessaires (`decrementer_stock_lot`)
   - Crée les index pour améliorer les performances
   - **Cette migration peut être appliquée seule si les autres ont déjà été appliquées**

### Colonnes importantes ajoutées

#### Table `medicaments`
- `prix_unitaire_entree`: Prix d'achat par unité
- `prix_total_entree`: Montant total de l'achat
- `prix_unitaire_detail`: Prix de vente au détail (pharmacie)
- `seuil_maximum`: Seuil maximum de stock
- `dci`: Dénomination Commune Internationale
- `observations`: Observations générales

#### Table `dispensations`
- `prescripteur_id`: ID du prescripteur
- `prescripteur_nom`: Nom du prescripteur
- `service_prescripteur`: Service du prescripteur
- `statut_prise_charge`: Statut de prise en charge du patient
- `patient_nom`: Nom du patient
- `patient_prenoms`: Prénoms du patient
- `service_nom`: Nom du service (pour dispensations service)
- `consultation_id`: ID de la consultation liée

#### Table `dispensation_lignes`
- `quantite_prescite`: Quantité prescrite
- `quantite_delivree`: Quantité réellement délivrée
- `numero_lot`: Numéro de lot pour traçabilité
- `date_expiration`: Date d'expiration du lot
- `statut`: Statut de la ligne (`delivre`, `partiellement_delivre`, `substitution`, `rupture`)
- `medicament_substitue_id`: ID du médicament substitué
- `observations`: Observations sur la ligne
- `prescription_line_id`: ID de la ligne de prescription

## 🔗 Interconnexions entre modules

### Flux de données

```
┌─────────────────┐
│ Stock Médicaments│
│  (Magasin Gros) │
└────────┬────────┘
         │ Transfert
         ▼
┌─────────────────┐
│   Pharmacie     │
│ (Magasin Détail)│
└────────┬────────┘
         │ Dispensation
         ▼
┌─────────────────┐
│   Patients      │
│  / Services     │
└─────────────────┘
```

### Modules interconnectés

1. **Stock Médicaments → Pharmacie**
   - Les transferts du magasin gros vers le magasin détail créent des lots dans le magasin détail
   - Service: `StockService.validerTransfert()`

2. **Pharmacie → Dispensations**
   - Les dispensations décrémentent le stock du magasin détail
   - Service: `DispensationService.creerDispensation()`

3. **Consultations → Prescriptions → Dispensations**
   - Les prescriptions créées lors des consultations peuvent être dispensées
   - Service: `DispensationService.getPrescriptionsActives()`

4. **Dispensations → Facturation**
   - Les dispensations patient créent automatiquement des tickets de facturation
   - Service: `FacturationService.creerTicketFacturation()`

### Services principaux

- **StockService** (`src/services/stockService.ts`)
  - Gestion des réceptions, transferts, inventaires
  - Opérations sur le magasin gros

- **DispensationService** (`src/services/dispensationService.ts`)
  - Création et gestion des dispensations
  - Vérification du stock disponible
  - Intégration avec les prescriptions

- **MedicamentService** (`src/services/medicamentService.ts`)
  - CRUD sur les médicaments
  - Recherche et filtrage

## 🚀 Application des migrations

### Méthode 1: Script PowerShell (Recommandé)

```powershell
.\apply_migrations.ps1
```

Le script guide l'utilisateur à travers l'application des migrations.

### Méthode 2: Supabase Dashboard

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez le contenu de chaque fichier de migration
5. Exécutez le script SQL dans l'ordre indiqué

### Méthode 3: Supabase CLI

```bash
# Pour Supabase local
supabase db reset

# Pour Supabase distant
supabase db push
```

## ✅ Vérification du système

### Vérifier que les tables existent

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'medicaments', 
  'lots', 
  'dispensations', 
  'dispensation_lignes',
  'dispensation_audit'
)
ORDER BY table_name;
```

### Vérifier que les colonnes existent

```sql
-- Vérifier les colonnes de medicaments
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'medicaments' 
AND column_name IN (
  'prix_unitaire_entree',
  'prix_unitaire_detail',
  'dci',
  'seuil_maximum'
);

-- Vérifier les colonnes de dispensation_lignes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dispensation_lignes' 
AND column_name IN (
  'quantite_prescite',
  'quantite_delivree',
  'numero_lot',
  'date_expiration',
  'statut'
);
```

### Vérifier les fonctions

```sql
-- Vérifier la fonction de génération de numéro
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'generer_numero_dispensation',
  'decrementer_stock_lot'
);
```

### Vérifier les triggers

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%dispensation%';
```

## 🔧 Correction des problèmes courants

### Problème: Colonnes manquantes

**Solution**: Exécutez `consolidate_stock_dispensation_schema.sql` qui vérifie et crée toutes les colonnes nécessaires.

### Problème: Erreur "column does not exist"

**Solution**: Vérifiez que toutes les migrations ont été appliquées dans l'ordre.

### Problème: Erreur de contrainte CHECK

**Solution**: La migration consolidée gère automatiquement les contraintes. Si le problème persiste, supprimez et recréez la contrainte.

### Problème: Fonction RPC non trouvée

**Solution**: La fonction `decrementer_stock_lot` est créée dans `consolidate_stock_dispensation_schema.sql`. Si elle n'existe pas, le service utilise une méthode de fallback.

## 📝 Notes importantes

1. **Ordre des migrations**: Toujours appliquer les migrations dans l'ordre indiqué
2. **Migration consolidée**: `consolidate_stock_dispensation_schema.sql` peut être appliquée plusieurs fois sans problème (idempotente)
3. **Données existantes**: Les migrations préservent les données existantes
4. **Valeurs par défaut**: Les migrations définissent des valeurs par défaut pour les nouvelles colonnes

## 🧪 Tests recommandés

Après avoir appliqué les migrations, testez :

1. ✅ Création d'un médicament avec tous les champs de prix
2. ✅ Réception d'un lot dans le magasin gros
3. ✅ Transfert d'un lot vers le magasin détail
4. ✅ Création d'une dispensation avec toutes les informations
5. ✅ Vérification que le stock est décrémenté correctement
6. ✅ Vérification que le prix total est calculé correctement

## 📞 Support

En cas de problème :
1. Vérifiez les logs Supabase
2. Vérifiez que toutes les migrations ont été appliquées
3. Vérifiez que les types TypeScript correspondent aux schémas de base de données
4. Consultez les erreurs dans la console du navigateur


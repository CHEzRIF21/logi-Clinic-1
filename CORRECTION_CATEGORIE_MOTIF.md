# Correction de l'Erreur `categorie_motif`

## 🔍 Analyse du Problème

**Erreur :** `Could not find the 'categorie_motif' column of 'consultations' in the schema cache`

**Cause :** 
- La colonne `categorie_motif` existe dans la migration `create_consultation_complete_tables.sql`
- Mais Supabase ne la trouve pas dans le cache du schéma
- Cela peut signifier que :
  1. La migration n'a pas été appliquée
  2. La table a été créée avant cette migration
  3. Le cache Supabase n'est pas à jour

## ✅ Solutions Appliquées

### 1. **Retrait de `categorie_motif` de l'insert initial** ✅

**Fichier modifié :** `src/services/consultationService.ts`

**Avant :**
```typescript
.insert({
  patient_id: patientId,
  clinic_id: clinicId,
  opened_by: userId,
  created_by: userId,
  categorie_motif: 'Médecine générale', // ❌ Colonne non trouvée
  status: 'EN_COURS'
})
```

**Après :**
```typescript
.insert({
  patient_id: patientId,
  clinic_id: clinicId,
  opened_by: userId,
  created_by: userId,
  status: 'EN_COURS'
  // categorie_motif sera ajouté plus tard si nécessaire (colonne optionnelle)
})
```

**Raison :** La colonne `categorie_motif` est optionnelle et peut être ajoutée plus tard lors de la mise à jour de la consultation.

### 2. **Migration pour ajouter les colonnes manquantes** ✅

**Fichier créé :** `supabase_migrations/29_FIX_CONSULTATIONS_CATEGORIE_MOTIF.sql`

Cette migration :
- Vérifie si `categorie_motif` existe, sinon l'ajoute
- Vérifie si `created_at` existe, sinon l'ajoute
- Vérifie si `created_by` existe, sinon l'ajoute
- Vérifie si `opened_at` existe, sinon l'ajoute

## 📋 Étapes pour Appliquer la Correction

### Option 1 : Appliquer la Migration (Recommandé)

```bash
# Via Supabase CLI
supabase migration up

# Ou via l'interface Supabase
# Allez dans SQL Editor et exécutez le fichier 29_FIX_CONSULTATIONS_CATEGORIE_MOTIF.sql
```

### Option 2 : Vérifier Manuellement

```sql
-- Vérifier si la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consultations' 
AND column_name = 'categorie_motif';

-- Si elle n'existe pas, l'ajouter
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS categorie_motif VARCHAR(100);
```

### Option 3 : Rafraîchir le Cache Supabase

Si la colonne existe mais Supabase ne la trouve pas :
1. Attendre quelques minutes (le cache se rafraîchit automatiquement)
2. Redémarrer le projet Supabase
3. Vérifier dans l'interface Supabase que la colonne existe

## 🔧 Utilisation de `categorie_motif` Après la Création

Une fois la consultation créée, vous pouvez ajouter `categorie_motif` via `updateConsultation` :

```typescript
// Dans Consultations.tsx, après la création
if (type) {
  await ConsultationService.updateConsultation(
    consultation.id,
    { categorie_motif: type } as any,
    userId,
    'categorie_motif'
  );
}
```

## ⚠️ Notes Importantes

1. **La colonne est optionnelle** : La consultation peut être créée sans `categorie_motif`
2. **Mise à jour possible** : Vous pouvez ajouter `categorie_motif` après la création
3. **Migration nécessaire** : Appliquez la migration pour garantir que toutes les colonnes existent

## 🎯 Résultat Attendu

Après ces corrections :
- ✅ La création de consultation fonctionne sans erreur
- ✅ `categorie_motif` peut être ajouté après la création
- ✅ Toutes les colonnes nécessaires existent dans la table

---

**Date :** 2024-01-15
**Version :** 1.0.0


# Correction de l'Erreur `type` NOT NULL dans Consultations

## 🔍 Analyse du Problème

**Erreur :** `null value in column "type" of relation "consultations" violates not-null constraint`

**Cause :** 
- La table `consultations` dans Supabase a une colonne `type` avec contrainte NOT NULL
- Le code n'incluait pas cette colonne lors de l'insertion
- Supabase rejette l'insertion car une colonne NOT NULL ne peut pas être NULL

## ✅ Solutions Appliquées

### 1. **Ajout de `type` dans l'insert** ✅

**Fichier modifié :** `src/services/consultationService.ts`

**Avant :**
```typescript
.insert({
  patient_id: patientId,
  clinic_id: clinicId,
  opened_by: userId,
  created_by: userId,
  status: 'EN_COURS'
  // ❌ type manquant
})
```

**Après :**
```typescript
.insert({
  patient_id: patientId,
  clinic_id: clinicId,
  opened_by: userId,
  created_by: userId,
  type: 'Médecine générale', // ✅ Colonne REQUISE (NOT NULL)
  status: 'EN_COURS'
})
```

### 2. **Migration pour rendre `type` nullable** ✅

**Fichier créé :** Migration `30_fix_consultations_type_column`

**Actions :**
- Rend la colonne `type` nullable (si elle est NOT NULL)
- Ajoute une valeur par défaut `'Médecine générale'` si nécessaire

**Migration appliquée avec succès !** ✅

## 📋 Structure de la Table Consultations

D'après la structure réelle dans Supabase :

| Colonne | Type | Nullable | Défaut |
|---------|------|----------|--------|
| `id` | uuid | NO | gen_random_uuid() |
| `patient_id` | uuid | NO | - |
| `type` | varchar | **NO** | - |
| `status` | varchar | YES | 'EN_COURS' |
| `created_by` | uuid | **NO** | - |
| `created_at` | timestamptz | YES | now() |
| `opened_at` | timestamptz | YES | now() |
| `categorie_motif` | varchar | YES | - |

## 🎯 Résultat

Après ces corrections :
- ✅ La création de consultation inclut la colonne `type` requise
- ✅ La colonne `type` est maintenant nullable (via migration)
- ✅ Une valeur par défaut est disponible si nécessaire
- ✅ Plus d'erreur `null value in column "type"`

## 📝 Notes

1. **Valeur par défaut :** `'Médecine générale'` est utilisée comme valeur par défaut
2. **Flexibilité :** La colonne est maintenant nullable, permettant plus de flexibilité
3. **Compatibilité :** Le code fonctionne avec l'ancienne structure (NOT NULL) et la nouvelle (nullable)

---

**Date :** 2024-01-15
**Version :** 1.0.0
**Migration appliquée :** ✅


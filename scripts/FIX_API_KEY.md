# 🔧 CORRECTION RAPIDE - Clé API Supabase

## ⚡ Solution Rapide en 3 Étapes

### ÉTAPE 1: Obtenir la Vraie Clé API (2 minutes)

1. Aller sur: https://supabase.com/dashboard/project/kfuqghnlrnqaiaiwzziv
2. Menu gauche → **Settings** ⚙️ → **API**
3. Section **"Project API keys"**
4. **Copier la clé `anon` `public`** (commence par `eyJhbGci...`)

### ÉTAPE 2: Mettre à Jour le Code (30 secondes)

1. Ouvrir: `src/services/supabase.ts`
2. Ligne 4, remplacer:
   ```typescript
   const supabaseAnonKey = 'VOTRE_VRAIE_CLE_API_ICI';
   ```
3. Sauvegarder (Ctrl+S)

### ÉTAPE 3: Générer les Données (1 minute)

1. Ouvrir: `scripts/generate-complete-demo-data.sql`
2. Copier tout (Ctrl+A puis Ctrl+C)
3. Dans Supabase → SQL Editor → New Query
4. Coller → RUN ✅

---

## ✅ Résultat Attendu

Après ces 3 étapes:
- ✅ L'erreur "Invalid API key" disparaît
- ✅ Les 3 dossiers s'affichent dans l'application
- ✅ Vous pouvez créer/modifier des dossiers

---

**Temps total: ~4 minutes** ⏱️


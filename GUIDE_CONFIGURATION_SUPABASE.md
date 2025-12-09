# 🔑 Guide de Configuration Supabase - Module Maternité

## ⚠️ Erreur "Invalid API key" - Solution

L'erreur "Invalid API key" signifie que la clé API Supabase dans le code n'est pas valide ou a expiré.

---

## 🔧 ÉTAPE 1: Obtenir la Vraie Clé API Supabase

### 1.1 Accéder à Supabase Dashboard

1. Aller sur: https://supabase.com/dashboard
2. Se connecter à votre compte
3. Sélectionner votre projet: **kfuqghnlrnqaiaiwzziv**

### 1.2 Récupérer la Clé API Anonyme

1. Dans le menu de gauche, cliquer sur **"Settings"** (⚙️)
2. Cliquer sur **"API"** dans le sous-menu
3. Dans la section **"Project API keys"**, vous verrez:
   - **`anon` `public`** - C'est la clé que nous devons utiliser
   - **`service_role` `secret`** - Ne PAS utiliser cette clé (trop permissive)

4. **Copier la clé `anon` `public`** (elle commence par `eyJhbGci...`)

### 1.3 Mettre à Jour le Code

1. Ouvrir le fichier: `src/services/supabase.ts`
2. Remplacer la ligne 4 avec votre vraie clé API:

```typescript
const supabaseAnonKey = 'VOTRE_VRAIE_CLE_API_ICI';
```

3. Sauvegarder le fichier
4. L'application devrait se recharger automatiquement

---

## 📊 ÉTAPE 2: Générer les Données de Démonstration

### 2.1 Appliquer les Migrations (si pas déjà fait)

Dans Supabase SQL Editor, exécuter dans l'ordre:

1. `supabase_migrations/create_dossier_obstetrical_table.sql`
2. `supabase_migrations/create_cpn_tables.sql`
3. `supabase_migrations/create_accouchement_tables.sql`
4. `supabase_migrations/create_post_partum_tables.sql`

### 2.2 Générer les Données Complètes

1. Ouvrir le fichier: **`scripts/generate-complete-demo-data.sql`**
2. Copier **TOUT le contenu** (Ctrl+A puis Ctrl+C)
3. Dans Supabase SQL Editor:
   - New Query
   - Coller (Ctrl+V)
   - Cliquer **RUN** (Ctrl+Enter)
4. Attendre le message de succès ✅

**Ce script crée:**
- ✅ 3 patientes complètes avec toutes les informations
- ✅ 3 dossiers obstétricaux complets
- ✅ 6 consultations CPN (dont 4 CPN complètes)
- ✅ 2 vaccinations VAT (1 complète, 1 en cours)
- ✅ Soins promotionnels

---

## ✅ ÉTAPE 3: Vérifier que Tout Fonctionne

### 3.1 Vérifier les Données dans Supabase

Exécuter dans SQL Editor:

```sql
-- Vérifier les patients
SELECT id, identifiant, nom, prenom, sexe 
FROM patients 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- Vérifier les dossiers
SELECT id, numero_dossier, ddr, dpa, statut
FROM dossier_obstetrical
WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);
```

### 3.2 Tester dans l'Application

1. Rafraîchir la page de l'application (Ctrl+R)
2. Aller dans **"Module Maternité"**
3. Onglet **"Dossiers Maternité"**
4. **Vous devriez voir 3 dossiers:**
   - MAT-2024-001 (Marie KOUASSI)
   - MAT-2024-002 (Fatima GBEDJI)
   - MAT-2024-003 (Aisha SOSSOU)

---

## 🔐 Vérifier les Permissions RLS (Row Level Security)

Si vous avez toujours des erreurs après avoir mis à jour la clé API:

### 3.1 Vérifier RLS sur les Tables

Dans Supabase SQL Editor:

```sql
-- Vérifier si RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('patients', 'dossier_obstetrical', 'consultation_prenatale');
```

### 3.2 Désactiver RLS Temporairement (pour la démo)

Si RLS est activé et bloque l'accès:

```sql
-- Désactiver RLS sur les tables principales (TEMPORAIRE - pour démo uniquement)
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE dossier_obstetrical DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_prenatale DISABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_maternelle DISABLE ROW LEVEL SECURITY;
ALTER TABLE soins_promotionnels DISABLE ROW LEVEL SECURITY;
ALTER TABLE accouchement DISABLE ROW LEVEL SECURITY;
ALTER TABLE nouveau_ne DISABLE ROW LEVEL SECURITY;
ALTER TABLE surveillance_post_partum DISABLE ROW LEVEL SECURITY;
ALTER TABLE observation_post_partum DISABLE ROW LEVEL SECURITY;
```

**⚠️ ATTENTION:** Ne faites cela QUE pour la démonstration. En production, configurez correctement les politiques RLS.

---

## 🎯 Résumé des Actions

| Action | Fichier | Description |
|--------|---------|-------------|
| **1. Obtenir clé API** | Supabase Dashboard → Settings → API | Copier la clé `anon` `public` |
| **2. Mettre à jour clé** | `src/services/supabase.ts` ligne 4 | Remplacer avec la vraie clé |
| **3. Générer données** | `scripts/generate-complete-demo-data.sql` | Exécuter dans Supabase SQL Editor |
| **4. Vérifier** | Application → Module Maternité | Voir les 3 dossiers |

---

## 🆘 Si Ça Ne Fonctionne Toujours Pas

### Vérifier la Console du Navigateur

1. Ouvrir la console (F12)
2. Onglet **"Console"**
3. Chercher les erreurs en rouge
4. Les erreurs vous indiqueront le problème exact

### Erreurs Communes

| Erreur | Solution |
|--------|----------|
| "Invalid API key" | Vérifier que la clé dans `supabase.ts` est correcte |
| "relation does not exist" | Appliquer les migrations SQL |
| "permission denied" | Désactiver RLS temporairement (voir ci-dessus) |
| "network error" | Vérifier la connexion Internet |

---

## 📞 Support

Si vous avez toujours des problèmes:
1. Vérifier que toutes les migrations sont appliquées
2. Vérifier que les données de démo sont créées
3. Vérifier la console du navigateur pour erreurs détaillées
4. Vérifier que la clé API est bien copiée (sans espaces)

---

**Une fois la clé API mise à jour et les données générées, l'application devrait fonctionner parfaitement !** ✅


# 📊 Générer les Données de Démonstration - Module Maternité

## ✅ Clé API Configurée !

La clé API Supabase a été mise à jour dans le code. Maintenant, générons les données de démonstration.

---

## 🚀 ÉTAPES RAPIDES

### ÉTAPE 1: Ouvrir Supabase Dashboard

1. Aller sur: **https://supabase.com/dashboard/project/bngfemmllokvetmohiqch**
2. Cliquer sur **"SQL Editor"** (menu de gauche)

---

### ÉTAPE 2: Appliquer les Migrations (si pas déjà fait)

**⚠️ IMPORTANT:** Les migrations doivent être appliquées AVANT de générer les données.

Dans Supabase SQL Editor, exécuter dans l'ordre:

#### Migration 1: Dossier Obstétrical
1. Ouvrir: `supabase_migrations/create_dossier_obstetrical_table.sql`
2. Copier tout le contenu (Ctrl+A puis Ctrl+C)
3. Dans Supabase: New Query → Coller → RUN ✅

#### Migration 2: CPN
1. Ouvrir: `supabase_migrations/create_cpn_tables.sql`
2. Copier tout → New Query → Coller → RUN ✅

#### Migration 3: Accouchement
1. Ouvrir: `supabase_migrations/create_accouchement_tables.sql`
2. Copier tout → New Query → Coller → RUN ✅

#### Migration 4: Post-Partum
1. Ouvrir: `supabase_migrations/create_post_partum_tables.sql`
2. Copier tout → New Query → Coller → RUN ✅

---

### ÉTAPE 3: Générer les Données de Démonstration

1. Ouvrir le fichier: **`scripts/generate-complete-demo-data.sql`**
2. **Sélectionner TOUT le contenu** (Ctrl+A)
3. **Copier** (Ctrl+C)
4. Dans Supabase SQL Editor:
   - Cliquer sur **"New query"**
   - **Coller** le contenu (Ctrl+V)
   - Cliquer sur **"RUN"** (ou Ctrl+Enter)
5. Attendre le message **"Success"** ✅

---

## 📊 Ce qui sera créé

Le script génère automatiquement:

| Type | Quantité | Détails |
|------|----------|---------|
| **Patientes** | 3 | Marie KOUASSI, Fatima GBEDJI, Aisha SOSSOU |
| **Dossiers Obstétricaux** | 3 | Dont 1 normal, 1 à risque, 1 adolescente |
| **Grossesses Antérieures** | 6 | Pour le dossier 2 (grande multiparité) |
| **Consultations CPN** | 6 | 4 CPN complètes pour dossier 1, 2 CPN pour dossier 2 |
| **Vaccinations VAT** | 2 | 1 complète (5/5), 1 en cours (3/5) |
| **Soins Promotionnels** | 1 | Moustiquaire, Fer, Déparasitage |

---

## ✅ Vérifier que les Données sont Créées

Dans Supabase SQL Editor, exécuter:

```sql
-- Vérifier les patients
SELECT 
  identifiant,
  nom,
  prenom,
  sexe,
  telephone
FROM patients
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
)
ORDER BY nom;

-- Vérifier les dossiers
SELECT 
  numero_dossier,
  ddr,
  dpa,
  gestite,
  parite,
  statut
FROM dossier_obstetrical
WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
)
ORDER BY numero_dossier;

-- Vérifier les CPN
SELECT 
  numero_cpn,
  trimestre,
  date_consultation,
  terme_semaines,
  poids,
  tension_arterielle
FROM consultation_prenatale
ORDER BY dossier_obstetrical_id, numero_cpn;
```

**Résultat attendu:**
- ✅ 3 patients
- ✅ 3 dossiers
- ✅ 6 CPN

---

## 🎯 Tester dans l'Application

1. **Rafraîchir la page** de l'application (Ctrl+R ou F5)
2. Aller dans **"Module Maternité"**
3. Onglet **"Dossiers Maternité"**
4. **Vous devriez voir 3 dossiers:**
   - ✅ **MAT-2024-001** (Marie KOUASSI) - Grossesse normale
   - ✅ **MAT-2024-002** (Fatima GBEDJI) - Avec facteurs de risque ⚠️
   - ✅ **MAT-2024-003** (Aisha SOSSOU) - Jeune < 16 ans ⚠️

---

## 🧪 Tests à Effectuer

### Test 1: Voir un Dossier
1. Cliquer sur l'icône 👁️ du dossier **MAT-2024-001**
2. Vérifier toutes les informations:
   - Informations patient (nom, prénom, téléphone)
   - Conjoint
   - Antécédents (G1P0)
   - DDR: 01/01/2024
   - DPA: 08/10/2024 (calculée automatiquement) ✅

### Test 2: Voir les CPN
1. Sélectionner le dossier **MAT-2024-001**
2. Onglet **"Consultations CPN"**
3. Vérifier:
   - ✅ 4 CPN affichées (CPN1, CPN2, CPN3, CPN4)
   - ✅ Indicateur vert: "CPN Obligatoires: ✅ Complètes"
   - ✅ Dates, termes, poids, tension

### Test 3: Voir les Vaccinations
1. Dans l'onglet **"Consultations CPN"**
2. Composant **"Vaccination Maternelle"**
3. Vérifier:
   - ✅ Chip vert: "5/5 doses complétées"
   - ✅ Toutes les dates VAT1 à VAT5 remplies
   - ✅ Message: "✅ Vaccination maternelle complète"

---

## 🆘 Si les Données ne S'affichent Pas

### Vérification 1: Migrations Appliquées ?
```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
  table_name LIKE '%obstetrical%' OR 
  table_name LIKE '%cpn%' OR 
  table_name LIKE '%accouchement%' OR 
  table_name LIKE '%post_partum%'
);
```
**Résultat attendu:** total_tables = 23

### Vérification 2: Données Créées ?
```sql
SELECT COUNT(*) as patients FROM patients WHERE nom IN ('KOUASSI', 'GBEDJI', 'SOSSOU');
SELECT COUNT(*) as dossiers FROM dossier_obstetrical WHERE numero_dossier LIKE 'MAT-2024-%';
SELECT COUNT(*) as cpn FROM consultation_prenatale;
```
**Résultats attendus:** 3, 3, 6

### Vérification 3: Console du Navigateur
1. Ouvrir la console (F12)
2. Onglet **"Console"**
3. Chercher les erreurs en rouge
4. Si erreur "Invalid API key": Vérifier que la clé est bien mise à jour

---

## ✅ Checklist Finale

- [ ] Clé API mise à jour dans `src/services/supabase.ts` ✅
- [ ] 4 migrations appliquées sur Supabase
- [ ] Script de données de démo exécuté
- [ ] 3 patients créés
- [ ] 3 dossiers créés
- [ ] 6 CPN créées
- [ ] Données visibles dans l'application
- [ ] Aucune erreur dans la console

---

## 🎉 Succès !

Une fois toutes les étapes complétées, vous devriez avoir:
- ✅ Application fonctionnelle
- ✅ 3 dossiers de démonstration
- ✅ Données complètes pour tester toutes les fonctionnalités
- ✅ Calculs automatiques opérationnels (DPA, Apgar, etc.)

**Le module Maternité est maintenant prêt à être utilisé !** 🚀

---

**Pour plus d'aide:** Consulter `GUIDE_CONFIGURATION_SUPABASE.md`


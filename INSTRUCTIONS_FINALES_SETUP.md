# 🚀 Instructions Finales - Configuration Complète du Module Maternité

## ✅ Clé API Configurée !

La clé API Supabase a été mise à jour dans le code avec succès.

---

## 📋 ÉTAPE CRITIQUE : Exécuter le Script SQL Complet

### ⚡ Action Immédiate Requise

**Le script SQL complet est prêt dans:** `scripts/setup-complete-maternite.sql`

**Ce script fait TOUT en une seule fois:**
1. ✅ Crée la table `patients` (si elle n'existe pas)
2. ✅ Crée toutes les tables du module Maternité (23 tables)
3. ✅ Crée toutes les fonctions SQL automatiques
4. ✅ Crée tous les triggers
5. ✅ Génère les données de démonstration complètes

---

## 🔧 Comment Exécuter le Script

### Option 1: Via Supabase Dashboard (RECOMMANDÉ)

1. **Ouvrir Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch
   - Cliquer sur **"SQL Editor"** (menu gauche)

2. **Exécuter le Script:**
   - Ouvrir le fichier: `scripts/setup-complete-maternite.sql`
   - **Sélectionner TOUT le contenu** (Ctrl+A)
   - **Copier** (Ctrl+C)
   - Dans Supabase SQL Editor:
     - Cliquer **"New query"**
     - **Coller** le contenu (Ctrl+V)
     - Cliquer **"RUN"** (ou Ctrl+Enter)
   - Attendre le message **"Success"** ✅

**⏱️ Temps estimé:** 10-15 secondes

### Option 2: Via Terminal (si vous avez Supabase CLI)

```bash
supabase db push --file scripts/setup-complete-maternite.sql
```

---

## ✅ Vérification Après Exécution

### Dans Supabase SQL Editor, exécuter:

```sql
-- Vérifier les tables créées
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
  table_name LIKE '%patient%' OR 
  table_name LIKE '%obstetrical%' OR 
  table_name LIKE '%cpn%' OR 
  table_name LIKE '%accouchement%' OR 
  table_name LIKE '%post_partum%'
);
```

**Résultat attendu:** total_tables ≥ 23

### Vérifier les données de démo:

```sql
-- Vérifier les patients
SELECT identifiant, nom, prenom, sexe 
FROM patients 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);

-- Vérifier les dossiers
SELECT numero_dossier, ddr, dpa, statut
FROM dossier_obstetrical
WHERE numero_dossier LIKE 'MAT-2024-%';

-- Vérifier les CPN
SELECT numero_cpn, trimestre, date_consultation, terme_semaines
FROM consultation_prenatale
ORDER BY dossier_obstetrical_id, numero_cpn;
```

**Résultats attendus:**
- ✅ 3 patients
- ✅ 3 dossiers
- ✅ 6 CPN

---

## 🎯 Tester dans l'Application

### 1. Rafraîchir l'Application

1. Ouvrir: **http://localhost:3000**
2. **Rafraîchir la page** (Ctrl+R ou F5)
3. Aller dans **"Module Maternité"**

### 2. Vérifier les Dossiers

1. Onglet **"Dossiers Maternité"**
2. **Vous devriez voir 3 dossiers:**
   - ✅ **MAT-2024-001** (Marie KOUASSI)
   - ✅ **MAT-2024-002** (Fatima GBEDJI)
   - ✅ **MAT-2024-003** (Aisha SOSSOU)

### 3. Tester les Fonctionnalités

#### Test 1: Voir un Dossier
- Cliquer sur l'icône 👁️ du dossier **MAT-2024-001**
- Vérifier toutes les informations affichées

#### Test 2: Voir les CPN
- Sélectionner le dossier **MAT-2024-001**
- Onglet **"Consultations CPN"**
- Vérifier: **4 CPN complètes** avec indicateur vert ✅

#### Test 3: Voir les Vaccinations
- Dans l'onglet **"Consultations CPN"**
- Composant **"Vaccination Maternelle"**
- Vérifier: **5/5 doses complétées** ✅

---

## 🆘 Si Ça Ne Fonctionne Pas

### Problème 1: Les dossiers ne s'affichent pas

**Solutions:**
1. Vérifier que le script SQL a été exécuté avec succès
2. Ouvrir la console du navigateur (F12) pour voir les erreurs
3. Vérifier que la clé API est correcte dans `src/services/supabase.ts`
4. Rafraîchir la page (Ctrl+R)

### Problème 2: Erreur "relation does not exist"

**Solution:** Le script SQL n'a pas été exécuté. Réexécuter `scripts/setup-complete-maternite.sql`

### Problème 3: Erreur "permission denied"

**Solution:** Désactiver temporairement RLS dans Supabase:

```sql
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE dossier_obstetrical DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_prenatale DISABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_maternelle DISABLE ROW LEVEL SECURITY;
ALTER TABLE accouchement DISABLE ROW LEVEL SECURITY;
ALTER TABLE nouveau_ne DISABLE ROW LEVEL SECURITY;
ALTER TABLE surveillance_post_partum DISABLE ROW LEVEL SECURITY;
ALTER TABLE observation_post_partum DISABLE ROW LEVEL SECURITY;
```

---

## 📊 Ce qui sera Créé

Le script `setup-complete-maternite.sql` crée:

### Tables (23 tables)
- ✅ `patients` (si n'existe pas)
- ✅ `dossier_obstetrical`
- ✅ `grossesses_anterieures`
- ✅ `vaccination_maternelle`
- ✅ `consultation_prenatale`
- ✅ `soins_promotionnels`
- ✅ `accouchement`
- ✅ `delivrance`
- ✅ `examen_placenta`
- ✅ `nouveau_ne` (avec calcul Apgar automatique)
- ✅ `soins_immediats`
- ✅ `carte_infantile`
- ✅ `surveillance_post_partum`
- ✅ `observation_post_partum` (avec détection risques)
- ✅ `traitement_post_partum`
- ✅ `conseils_post_partum`
- ✅ `sortie_salle_naissance`
- ✅ Et plus...

### Fonctions Automatiques
- ✅ `calculate_dpa()` - Calcul DPA automatique
- ✅ `detecter_risques_post_partum()` - Détection risques
- ✅ Triggers pour calculs automatiques

### Données de Démonstration
- ✅ 3 patientes complètes
- ✅ 3 dossiers obstétricaux
- ✅ 6 consultations CPN
- ✅ 2 vaccinations VAT
- ✅ Soins promotionnels

---

## ✅ Checklist Finale

Avant de considérer le système opérationnel:

- [ ] Script `setup-complete-maternite.sql` exécuté avec succès
- [ ] 23+ tables créées dans Supabase
- [ ] 3 patients créés
- [ ] 3 dossiers créés
- [ ] 6 CPN créées
- [ ] Application rafraîchie (Ctrl+R)
- [ ] 3 dossiers visibles dans l'application
- [ ] Aucune erreur dans la console du navigateur
- [ ] Calcul DPA fonctionne (testé en créant un dossier)
- [ ] CPN affichées correctement

---

## 🎉 Résultat Attendu

Après avoir exécuté le script SQL:

✅ **L'application est fonctionnelle**
✅ **Les données de démo sont chargées**
✅ **Toutes les fonctionnalités sont opérationnelles**
✅ **Calculs automatiques fonctionnent**
✅ **Détections automatiques fonctionnent**

---

## 📞 Support

Si vous avez des problèmes:
1. Vérifier la console du navigateur (F12)
2. Vérifier les logs Supabase (Dashboard → Logs)
3. Vérifier que toutes les tables sont créées (requête SQL ci-dessus)
4. Consulter `GUIDE_CONFIGURATION_SUPABASE.md` pour plus de détails

---

**🚀 Une fois le script exécuté, le module Maternité sera 100% opérationnel avec toutes les données de démonstration !**


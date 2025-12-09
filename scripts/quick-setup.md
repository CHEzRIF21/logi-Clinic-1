# 🚀 Configuration Rapide - Module Maternité

## L'application est en cours de démarrage...

Elle sera accessible sur: **http://localhost:3000**

---

## ⚡ Actions Rapides à Faire MAINTENANT

### Étape 1: Ouvrir Supabase (dans un nouvel onglet)

1. Aller sur: https://supabase.com/dashboard/project/kfuqghnlrnqaiaiwzziv
2. Cliquer sur **SQL Editor** (menu de gauche)

---

### Étape 2: Appliquer les 4 Migrations SQL (DANS L'ORDRE)

#### Migration 1️⃣: Dossier Obstétrical

```sql
-- Copier-coller le contenu de: 
-- supabase_migrations/create_dossier_obstetrical_table.sql
```

1. Ouvrir le fichier `supabase_migrations/create_dossier_obstetrical_table.sql`
2. **Copier TOUT le contenu** (Ctrl+A puis Ctrl+C)
3. Dans Supabase SQL Editor:
   - New Query
   - Coller (Ctrl+V)
   - Cliquer **RUN** (ou Ctrl+Enter)
4. Attendre le message "Success" ✅

#### Migration 2️⃣: CPN (Consultations Prénatales)

```sql
-- Copier-coller le contenu de: 
-- supabase_migrations/create_cpn_tables.sql
```

Répéter le processus ci-dessus avec le fichier `create_cpn_tables.sql`

#### Migration 3️⃣: Accouchement

```sql
-- Copier-coller le contenu de: 
-- supabase_migrations/create_accouchement_tables.sql
```

Répéter avec `create_accouchement_tables.sql`

#### Migration 4️⃣: Post-Partum

```sql
-- Copier-coller le contenu de: 
-- supabase_migrations/create_post_partum_tables.sql
```

Répéter avec `create_post_partum_tables.sql`

---

### Étape 3: Générer les Données de Démonstration

```sql
-- Copier-coller le contenu de: 
-- scripts/generate-demo-data.sql
```

1. Ouvrir `scripts/generate-demo-data.sql`
2. **Copier TOUT le contenu**
3. Dans Supabase SQL Editor:
   - New Query
   - Coller
   - Cliquer **RUN**
4. Attendre "Success" ✅

**Ce script crée:**
- ✅ 3 patientes de test
- ✅ 3 dossiers obstétricaux
- ✅ 6 consultations CPN
- ✅ 1 accouchement complet avec Score Apgar
- ✅ 8 observations post-partum (toutes les 15 min)

---

### Étape 4: Vérifier que Tout est OK

Dans Supabase SQL Editor, exécuter:

```sql
-- Vérifier les tables créées
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND (
  table_name LIKE '%obstetrical%' OR 
  table_name LIKE '%cpn%' OR 
  table_name LIKE '%accouchement%' OR 
  table_name LIKE '%post_partum%'
)
ORDER BY table_name;
```

**Résultat attendu**: 23 tables ✅

```sql
-- Vérifier les données de démo
SELECT 
  'Dossiers' as type, COUNT(*) as total FROM dossier_obstetrical
UNION ALL
SELECT 'CPN', COUNT(*) FROM consultation_prenatale
UNION ALL
SELECT 'Accouchements', COUNT(*) FROM accouchement
UNION ALL
SELECT 'Nouveau-nés', COUNT(*) FROM nouveau_ne
UNION ALL
SELECT 'Observations Post-Partum', COUNT(*) FROM observation_post_partum;
```

**Résultat attendu**:
- Dossiers: 3
- CPN: 6
- Accouchements: 1
- Nouveau-nés: 1
- Observations: 8

---

## 🎉 Tester l'Application

### Une fois que l'application est lancée (http://localhost:3000):

#### Test 1: Voir les Dossiers
1. Aller dans **"Module Maternité"**
2. Onglet **"Dossiers Maternité"**
3. Vous devriez voir **3 dossiers**:
   - MAT-2024-001 (Marie KOUASSI)
   - MAT-2024-002 (Fatima GBEDJI) - avec facteurs de risque
   - MAT-2024-003 (Aisha SOSSOU) - jeune < 16 ans

#### Test 2: Voir les CPN
1. Cliquer sur le dossier **MAT-2024-001**
2. Onglet **"Consultations CPN"**
3. Voir:
   - ✅ 4 CPN complètes (CPN1-4)
   - ✅ Indicateur vert "CPN Obligatoires: Complètes"
   - ✅ Vaccination VAT: 5/5 doses

#### Test 3: Tester le Calcul Automatique du Score Apgar
1. Créer un nouveau dossier (ou utiliser un existant)
2. Enregistrer un accouchement
3. Dans le formulaire Nouveau-Né:
   - Saisir les 5 critères Apgar (valeurs 0-2 chacun)
   - **Observer**: Score total calculé automatiquement ✅
   - **Observer**: Interprétation automatique (Normal/Modéré/Critique) ✅

#### Test 4: Tester la Détection Automatique des Risques Post-Partum
1. Aller dans "Suivi Post-Partum"
2. Observer: **8 créneaux générés automatiquement** ✅
3. Cliquer "Modifier" sur un créneau
4. Tester les alertes:
   - Saisir **Température = 38.5°C** → Alerte "Hyperthermie" 🔥
   - Saisir **Saignement = 600 mL** → Alerte "HPP" 🚨
   - Saisir **Pouls = 110** → Alerte "Tachycardie" 💓
5. **Observer**: Alertes en temps réel avec codes couleur ✅

---

## ✅ Checklist Rapide

- [ ] Application démarrée (http://localhost:3000)
- [ ] 4 migrations appliquées sur Supabase
- [ ] Données de démo générées
- [ ] 3 dossiers visibles dans l'application
- [ ] CPN affichées correctement
- [ ] Calcul Apgar fonctionne
- [ ] Détection risques post-partum fonctionne

---

## 🆘 En Cas de Problème

### L'application ne démarre pas
```bash
# Dans le terminal, vérifier les erreurs
# Si nécessaire, réinstaller les dépendances:
npm install
npm start
```

### Les dossiers ne s'affichent pas
1. Vérifier que les migrations sont appliquées (Supabase SQL Editor)
2. Vérifier que les données de démo sont créées (requête SQL ci-dessus)
3. Ouvrir la console du navigateur (F12) et chercher les erreurs
4. Rafraîchir la page (Ctrl+R)

### Erreur de connexion Supabase
- Vérifier que le fichier `src/services/supabase.ts` contient les bonnes URLs
- Vérifier que l'API key est correcte

---

## 📖 Documentation Complète

Pour plus de détails, consulter:
- `GUIDE_INSTALLATION_ET_TEST.md` - Guide complet pas à pas
- `README_MODULE_MATERNITE.md` - Vue d'ensemble du module
- `MATERNITE_COMPOSANTS_REACT_GUIDE.md` - Guide des composants

---

**Bon test ! 🎉**


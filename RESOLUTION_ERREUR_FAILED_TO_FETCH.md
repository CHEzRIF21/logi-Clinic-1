# 🔧 Résolution de l'Erreur "Failed to fetch" - Module Maternité

## ✅ Corrections Appliquées

### 1. **Erreurs de Compilation TypeScript Corrigées** ✅

Les imports manquants `TableContainer` et `TableHead` ont été ajoutés dans `FormulaireNouveauNe.tsx`.

### 2. **Gestion d'Erreur Améliorée** ✅

La méthode `getAllDossiers()` a été améliorée avec des messages d'erreur plus explicites pour identifier rapidement le problème.

---

## 🔍 Pourquoi "Failed to fetch" Apparaît ?

Cette erreur signifie que l'application ne peut pas se connecter à Supabase. Les causes possibles sont :

### Cause 1: Les Tables N'Existent Pas Encore ⚠️

**Symptôme:** Erreur "relation does not exist" ou "PGRST116"

**Solution:**
1. Aller sur: https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch
2. Cliquer sur **"SQL Editor"**
3. Ouvrir le fichier: `scripts/setup-complete-maternite.sql`
4. Copier **TOUT le contenu** (Ctrl+A puis Ctrl+C)
5. Dans Supabase SQL Editor:
   - New Query
   - Coller (Ctrl+V)
   - RUN (Ctrl+Enter)
6. Attendre "Success" ✅

### Cause 2: Clé API Incorrecte ⚠️

**Symptôme:** Erreur "Invalid API key" ou "JWT"

**Solution:**
1. Vérifier que la clé API dans `src/services/supabase.ts` est correcte
2. La clé doit être la clé `anon` `public` (pas la `service_role`)
3. Obtenir la clé depuis: Supabase Dashboard → Settings → API

### Cause 3: Projet Supabase Inactif ⚠️

**Symptôme:** Erreur "Failed to fetch" ou timeout

**Solution:**
1. Vérifier que le projet Supabase est actif
2. Aller sur: https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch
3. Vérifier le statut du projet (doit être "ACTIVE_HEALTHY")

### Cause 4: Problème de Connexion Internet ⚠️

**Symptôme:** Erreur réseau

**Solution:**
1. Vérifier votre connexion Internet
2. Vérifier que Supabase n'est pas bloqué par un firewall
3. Essayer d'accéder à: https://bngfemmllokvetmohiqch.supabase.co

---

## 🚀 Solution Complète en 3 Étapes

### ÉTAPE 1: Vérifier la Configuration Supabase

Vérifier que `src/services/supabase.ts` contient:

```typescript
const supabaseUrl = 'https://bngfemmllokvetmohiqch.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Votre vraie clé
```

### ÉTAPE 2: Exécuter le Script SQL (OBLIGATOIRE)

**C'est la cause principale du problème !**

1. Ouvrir: `scripts/setup-complete-maternite.sql`
2. Copier tout le contenu
3. Dans Supabase SQL Editor → New Query → Coller → RUN
4. Attendre "Success" ✅

**Ce script crée:**
- ✅ Toutes les tables nécessaires (23+ tables)
- ✅ Les fonctions automatiques (DPA, détection risques)
- ✅ Les données de démonstration (3 patients, 3 dossiers, 6 CPN)

### ÉTAPE 3: Vérifier dans l'Application

1. Rafraîchir la page (Ctrl+R)
2. Ouvrir la console du navigateur (F12)
3. Vérifier les messages:
   - ✅ "X dossier(s) chargé(s) avec succès" = Tout fonctionne !
   - ❌ Message d'erreur = Suivre les instructions ci-dessus

---

## 📊 Vérification Rapide

### Dans Supabase SQL Editor, exécuter:

```sql
-- Vérifier que les tables existent
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
  table_name LIKE '%patient%' OR 
  table_name LIKE '%obstetrical%' OR 
  table_name LIKE '%cpn%'
);

-- Vérifier les données
SELECT COUNT(*) as patients FROM patients;
SELECT COUNT(*) as dossiers FROM dossier_obstetrical;
SELECT COUNT(*) as cpn FROM consultation_prenatale;
```

**Résultats attendus:**
- total_tables ≥ 23
- patients = 3
- dossiers = 3
- cpn = 6

---

## 🎯 Messages d'Erreur Améliorés

L'application affiche maintenant des messages d'erreur plus clairs :

| Erreur | Message Affiché | Solution |
|--------|----------------|----------|
| Tables n'existent pas | "Les tables de la base de données n'existent pas encore..." | Exécuter `setup-complete-maternite.sql` |
| Clé API invalide | "Clé API Supabase invalide..." | Vérifier `src/services/supabase.ts` |
| Connexion impossible | "Impossible de se connecter à Supabase..." | Vérifier Internet + URL + Projet actif |
| Aucune donnée | "Aucun dossier trouvé..." | Exécuter le script SQL de données |

---

## ✅ Checklist de Résolution

- [ ] Erreurs TypeScript corrigées (`TableContainer`, `TableHead`)
- [ ] Clé API vérifiée dans `src/services/supabase.ts`
- [ ] Script SQL `setup-complete-maternite.sql` exécuté
- [ ] 23+ tables créées dans Supabase
- [ ] 3 patients créés
- [ ] 3 dossiers créés
- [ ] Application rafraîchie (Ctrl+R)
- [ ] Console du navigateur vérifiée (F12)
- [ ] Dossiers visibles dans l'application

---

## 🆘 Si Ça Ne Fonctionne Toujours Pas

### 1. Vérifier la Console du Navigateur

Ouvrir F12 → Onglet "Console" → Chercher les erreurs en rouge

### 2. Vérifier les Logs Supabase

Dans Supabase Dashboard → Logs → API → Vérifier les erreurs

### 3. Tester la Connexion Directement

Dans la console du navigateur (F12), exécuter:

```javascript
// Tester la connexion Supabase
import { supabase } from './services/supabase';
supabase.from('patients').select('count').then(console.log).catch(console.error);
```

### 4. Vérifier RLS (Row Level Security)

Si RLS est activé et bloque l'accès:

```sql
-- Désactiver RLS temporairement (pour la démo)
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE dossier_obstetrical DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_prenatale DISABLE ROW LEVEL SECURITY;
```

---

## 🎉 Résultat Attendu

Après avoir exécuté le script SQL:

✅ **L'application se connecte à Supabase**
✅ **Les 3 dossiers de démo s'affichent**
✅ **Aucune erreur "Failed to fetch"**
✅ **Toutes les fonctionnalités sont opérationnelles**

---

**Le problème principal est que les tables n'existent pas encore dans Supabase. Exécutez le script SQL et tout fonctionnera !** 🚀


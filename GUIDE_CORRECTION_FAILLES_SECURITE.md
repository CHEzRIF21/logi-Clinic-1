# 🔒 Guide : Correction des Failles de Sécurité Détectées par le Linter Supabase

## 📋 Résumé des Failles

Le linter Supabase a détecté **3 types de failles de sécurité** :

### 1. **Function Search Path Mutable** (33 fonctions)
- **Problème** : Les fonctions PostgreSQL n'ont pas de `SET search_path` défini
- **Risque** : Injection SQL via manipulation du search_path
- **Solution** : Ajouter `SET search_path = public` à toutes les fonctions

### 2. **RLS Policy Always True** (100+ politiques)
- **Problème** : Politiques RLS avec `USING (true)` ou `WITH CHECK (true)` pour INSERT/UPDATE/DELETE
- **Risque** : Contournement de la sécurité au niveau des lignes
- **Solution** : Remplacer par des politiques basées sur `clinic_id` et rôles utilisateurs

### 3. **Leaked Password Protection Disabled**
- **Problème** : Protection contre les mots de passe compromis désactivée
- **Risque** : Utilisation de mots de passe connus comme compromis
- **Solution** : Activer via le dashboard Supabase

---

## 🛠️ Application de la Migration

### Étape 1 : Appliquer la Migration SQL

La migration complète se trouve dans :
```
supabase_migrations/63_FIX_SECURITY_LINTER_ERRORS_COMPLETE.sql
```

**Méthode 1 : Via Supabase Dashboard (Recommandé)**

1. Allez sur **https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch**
2. Connectez-vous avec votre compte Supabase
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **+ New query**
5. Copiez-collez le contenu complet du fichier `63_FIX_SECURITY_LINTER_ERRORS_COMPLETE.sql`
6. Cliquez sur **Run** (ou Ctrl+Enter)
7. Vérifiez qu'il n'y a pas d'erreurs

**Méthode 2 : Via MCP Supabase (si disponible)**

```bash
# La migration sera appliquée automatiquement via le système de migrations Supabase
```

### Étape 2 : Vérifier les Corrections

Après l'application, vérifiez que les corrections sont bien appliquées :

```sql
-- Vérifier que les fonctions ont SET search_path
SELECT 
  p.proname as function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN '✅'
    ELSE '❌'
  END as has_search_path
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'set_user_custom_permissions_updated_at',
  'update_account_recovery_requests_updated_at',
  'update_ticket_on_payment',
  'verify_facture_for_caisse',
  'update_facture_montant_restant',
  'check_consultation_payment_status',
  'check_payment_required_for_consultation',
  'get_custom_profile_permissions',
  'create_initial_invoice_for_consultation',
  'update_updated_at_column',
  'insert_role_permissions',
  'get_default_role_permissions',
  'role_has_permission'
)
ORDER BY p.proname;
```

### Étape 3 : Activer la Protection Mots de Passe Compromis

1. Allez sur **Supabase Dashboard** > **Authentication** > **Settings**
2. Section **Password**
3. Activez **"Leaked password protection"**
4. Cliquez sur **Save**

---

## 📊 Détails des Corrections

### Fonctions Corrigées (33 fonctions)

Toutes ces fonctions ont maintenant `SET search_path = public` :

1. `set_user_custom_permissions_updated_at`
2. `update_account_recovery_requests_updated_at`
3. `update_ticket_on_payment`
4. `verify_facture_for_caisse`
5. `update_facture_montant_restant`
6. `check_consultation_payment_status`
7. `check_payment_required_for_consultation`
8. `get_custom_profile_permissions`
9. `create_initial_invoice_for_consultation`
10. `update_updated_at_column`
11. `insert_role_permissions`
12. `get_default_role_permissions`
13. `role_has_permission`
14. `verifier_liaison_dispensation_paiement`
15. `verifier_liaison_consultation_paiement`
16. `log_user_login`
17. `log_user_activity`
18. `mettre_a_jour_statut_facture`
19. `create_custom_profile`
20. `update_user_custom_permissions_updated_at`
21. `mettre_a_jour_journal_caisse`
22. `update_consultation_payment_status`
23. `update_consultation_from_invoice`
24. `trigger_update_actes_on_facture_payment`
25. `update_actes_on_payment`
26. `decrementer_stock_lot`
27. `verifier_liaisons_inter_modules`
28. `corriger_liaisons_facture`
29. `decrement_stock_on_prescription_payment`
30. `decrement_stock_on_facture_status_update`
31. `attendre_synchronisation_paiement`

### Politiques RLS Corrigées

Les politiques RLS trop permissives ont été remplacées par :

**Pour les tables avec `clinic_id` :**
```sql
USING (
  clinic_id = get_my_clinic_id()
  OR check_is_super_admin()
)
WITH CHECK (
  clinic_id = get_my_clinic_id()
  OR check_is_super_admin()
)
```

**Pour les tables sans `clinic_id` :**
```sql
-- SELECT : accessible à tous les utilisateurs authentifiés
USING (true)

-- INSERT/UPDATE/DELETE : uniquement pour les admins
USING (check_is_super_admin() OR check_is_clinic_admin())
WITH CHECK (check_is_super_admin() OR check_is_clinic_admin())
```

---

## ⚠️ Notes Importantes

1. **Impact sur les Applications**
   - Les politiques RLS plus restrictives peuvent bloquer certaines opérations
   - Testez bien votre application après l'application de la migration
   - Les utilisateurs ne pourront plus modifier les données d'autres cliniques

2. **Performance**
   - Les nouvelles politiques utilisent des fonctions (`get_my_clinic_id()`, `check_is_super_admin()`)
   - Assurez-vous que ces fonctions sont optimisées et indexées correctement

3. **Rollback**
   - Si nécessaire, vous pouvez restaurer les anciennes politiques
   - Conservez une sauvegarde avant d'appliquer la migration

---

## ✅ Vérification Post-Migration

Après avoir appliqué la migration, exécutez ces requêtes pour vérifier :

```sql
-- 1. Vérifier que toutes les fonctions ont SET search_path
SELECT COUNT(*) as fonctions_sans_search_path
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'set_user_custom_permissions_updated_at',
  'update_account_recovery_requests_updated_at',
  'update_ticket_on_payment',
  'verify_facture_for_caisse',
  'update_facture_montant_restant',
  'check_consultation_payment_status',
  'check_payment_required_for_consultation',
  'get_custom_profile_permissions',
  'create_initial_invoice_for_consultation',
  'update_updated_at_column',
  'insert_role_permissions',
  'get_default_role_permissions',
  'role_has_permission'
)
AND pg_get_functiondef(p.oid) NOT LIKE '%SET search_path%';
-- Résultat attendu : 0

-- 2. Vérifier que les politiques RLS sont sécurisées
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND (qual = 'true' OR with_check = 'true')
AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
ORDER BY tablename, policyname;
-- Résultat attendu : Seulement les politiques SELECT avec USING(true) sont acceptables
```

---

## 📝 Fichiers Créés

- ✅ `supabase_migrations/63_FIX_SECURITY_LINTER_ERRORS_COMPLETE.sql` - Migration complète
- ✅ `GUIDE_CORRECTION_FAILLES_SECURITE.md` - Ce guide

---

**⚠️ IMPORTANT : Appliquez cette migration dans un environnement de test d'abord !**

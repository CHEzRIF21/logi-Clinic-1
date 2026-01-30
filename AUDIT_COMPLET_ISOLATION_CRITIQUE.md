# 🔴 AUDIT COMPLET D'ISOLATION MULTI-TENANT - FAILLES CRITIQUES

**Date**: 2026-01-30  
**Agent**: MCP Test Sprite  
**Application**: Logiclinic (SaaS multi-cliniques)  
**Gravité**: 🔴 **CRITIQUE** - Fuites de données entre cliniques confirmées

---

## 📋 EXECUTIVE SUMMARY

**PROBLÈME CONFIRMÉ** : L'image fournie par l'utilisateur montre qu'un utilisateur "ITA Admin" voit **14 demandes d'inscription approuvées** et **1 rejetée** sans aucun indicateur de filtrage par `clinic_id`. Cela confirme une **faille critique d'isolation des données**.

**IMPACT** :
- ⚠️ **Confidentialité** : Les administrateurs d'une clinique peuvent voir les demandes d'inscription d'autres cliniques
- ⚠️ **Conformité** : Violation potentielle de RGPD / HIPAA
- ⚠️ **Sécurité** : Accès non autorisé aux données sensibles

---

## 🔍 1️⃣ INVENTAIRE DES DONNÉES

### Tables avec `clinic_id` (75 tables identifiées)

Toutes les tables métier suivantes possèdent un champ `clinic_id` :

**Utilisateurs & Authentification** :
- `users` ✅
- `registration_requests` ✅ (corrigé migration 65)
- `account_recovery_requests` ⚠️ À vérifier

**Patients & Consultations** :
- `patients` ✅ (corrigé migration 66)
- `consultations` ✅ (corrigé migration 66)
- `prescriptions` ✅ (corrigé migration 66)
- `rendez_vous` ✅ (corrigé récemment)

**Facturation & Paiements** :
- `factures` ✅ (corrigé migration 66)
- `paiements` ✅ (corrigé migration 66)
- `journal_caisse` ✅ (corrigé migration 66)

**Stock & Pharmacie** :
- `medicaments` ✅ (corrigé migration 67)
- `lots` ✅ (corrigé migration 67)
- `transferts` ✅ (corrigé migration 67)

**Laboratoire & Imagerie** :
- `lab_requests` ✅ (corrigé migration 68)
- `imaging_requests` ✅ (corrigé migration 68)

*(Voir liste complète dans section détaillée)*

---

## 🚨 2️⃣ TEST BACKEND (SUPABASE)

### ❌ FAILLE CRITIQUE #1 : RLS Policy `registration_requests_select`

**Localisation** : `public.registration_requests`  
**Politique** : `registration_requests_select`  
**Problème** : `USING (check_is_super_admin() OR ((clinic_id = get_my_clinic_id()) AND check_is_clinic_admin()) OR true)`

**Impact** : Le `OR true` permet à **TOUS les utilisateurs authentifiés** de voir **TOUTES les demandes d'inscription**, indépendamment de leur `clinic_id`.

**Code actuel** :
```sql
CREATE POLICY "registration_requests_select" ON registration_requests
FOR SELECT TO authenticated
USING (
  check_is_super_admin() 
  OR ((clinic_id = get_my_clinic_id()) AND check_is_clinic_admin()) 
  OR true  -- ❌ PERMET TOUT !
);
```

**Correction requise** :
```sql
DROP POLICY IF EXISTS "registration_requests_select" ON registration_requests;
CREATE POLICY "registration_requests_select" ON registration_requests
FOR SELECT TO authenticated
USING (
  clinic_id = public.get_my_clinic_id() 
  OR public.check_is_super_admin()
);
```

---

### ❌ FAILLE CRITIQUE #2 : Backend API `/auth/registration-requests`

**Fichier** : `server/src/routes/auth.ts` (ligne 310)  
**Problème** : Le backend ne filtre PAS par `clinic_id` pour les Super Admins

**Code actuel** :
```typescript
// Filtrer par clinic_id sauf pour SUPER_ADMIN (contexte clinique imposé par middleware)
if (!isSuperAdmin && clinicId) {
  query = query.eq('clinic_id', clinicId);
  console.log('🔒 Filtrage par clinic_id:', clinicId);
}
```

**Impact** : Même si le middleware impose un `clinicId`, le backend ne l'applique pas pour les Super Admins, permettant potentiellement de voir toutes les demandes.

**Correction requise** :
```typescript
// TOUJOURS filtrer par clinic_id (même pour Super Admin)
if (!clinicId) {
  return res.status(400).json({
    success: false,
    message: 'Contexte de clinique manquant',
  });
}
query = query.eq('clinic_id', clinicId); // Toujours appliquer
```

---

### ❌ FAILLE CRITIQUE #3 : Edge Function `/api/auth/registration-requests`

**Fichier** : `supabase/functions/api/auth.ts` (ligne 114)  
**Problème** : **AUCUN filtrage par `clinic_id`**

**Code actuel** :
```typescript
let query = supabase
  .from('registration_requests')
  .select('*')
  .order('created_at', { ascending: false });

if (statut && statut !== '') {
  query = query.eq('statut', statut);
}
// ❌ AUCUN FILTRAGE PAR clinic_id !
```

**Impact** : L'Edge Function retourne **TOUTES les demandes** de toutes les cliniques.

**Correction requise** :
```typescript
// Récupérer clinic_id depuis le JWT
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ success: false, message: 'Non autorisé' }), { status: 401 });
}

// Extraire clinic_id depuis le token (nécessite implémentation)
const clinicId = await getClinicIdFromToken(authHeader);
if (!clinicId) {
  return new Response(JSON.stringify({ success: false, message: 'Contexte clinique manquant' }), { status: 400 });
}

let query = supabase
  .from('registration_requests')
  .select('*')
  .eq('clinic_id', clinicId) // ✅ TOUJOURS filtrer
  .order('created_at', { ascending: false });
```

---

### ❌ FAILLE CRITIQUE #4 : Frontend Direct Queries

**Fichier** : `src/components/admin/StaffManagement.tsx` (ligne 160)  
**Problème** : Requêtes directes à Supabase avec bypass Super Admin

**Code actuel** :
```typescript
// Si pas super admin, filtrer par clinic_id
if (currentUser.role !== 'admin' || !currentUser.clinicCode?.includes('SUPER')) {
  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
}
```

**Impact** : Les Super Admins voient toutes les demandes sans filtrage.

**Correction requise** :
```typescript
// TOUJOURS filtrer par clinic_id
if (!clinicId) {
  console.error('Clinic ID manquant');
  setRegistrationRequests([]);
  return;
}
query = query.eq('clinic_id', clinicId); // Toujours appliquer
```

---

## 🔴 3️⃣ POLITIQUES RLS PERMISSIVES (50+ tables)

### Liste des politiques avec `OR true` (permettent tout)

| Table | Policy | Commande | Gravité |
|-------|--------|----------|---------|
| `registration_requests` | `registration_requests_select` | SELECT | 🔴 **CRITIQUE** |
| `consultations` | `Consultations are viewable by anon users` | SELECT | 🔴 **CRITIQUE** |
| `consultations` | `unified_consultations_access` | ALL | 🔴 **CRITIQUE** |
| `patients` | `unified_patients_access` | ALL | 🔴 **CRITIQUE** |
| `factures` | `unified_factures_access` | ALL | 🔴 **CRITIQUE** |
| `paiements` | `unified_paiements_policy` | ALL | 🔴 **CRITIQUE** |
| `prescriptions` | `unified_prescriptions_access` | ALL | 🔴 **CRITIQUE** |
| `dispensations` | `unified_dispensations_access` | ALL | 🔴 **CRITIQUE** |
| `medicaments` | `unified_medicaments_access` | ALL | 🔴 **CRITIQUE** |
| `lots` | `unified_lots_access` | ALL | 🔴 **CRITIQUE** |
| `transferts` | `unified_transferts_policy` | ALL | 🔴 **CRITIQUE** |
| `lab_requests` | `unified_lab_requests_policy` | ALL | 🔴 **CRITIQUE** |
| `imaging_requests` | `unified_imaging_requests_policy` | ALL | 🔴 **CRITIQUE** |
| `journal_caisse` | `unified_journal_caisse_policy` | ALL | 🔴 **CRITIQUE** |
| `alertes_stock` | `unified_alertes_stock_policy` | ALL | 🔴 **CRITIQUE** |
| `audit_log` | `unified_audit_log_access` | ALL | ⚠️ **MAJEURE** |
| `consultation_constantes` | `unified_consultation_constantes_policy` | ALL | 🔴 **CRITIQUE** |
| `consultation_entries` | `unified_consultation_entries_policy` | ALL | 🔴 **CRITIQUE** |
| `consultation_templates` | `unified_consultation_templates_policy` | ALL | ⚠️ **MAJEURE** |
| `diagnostics` | `unified_diagnostics_policy` | ALL | ⚠️ **MAJEURE** |
| `dispensation_audit` | `unified_dispensation_audit_policy` | ALL | ⚠️ **MAJEURE** |
| `dispensation_lignes` | `unified_dispensation_lignes_policy` | ALL | 🔴 **CRITIQUE** |
| `exam_catalog` | `unified_exam_catalog_policy` | ALL | ⚠️ **MAJEURE** |
| `imaging_requests` | `unified_imaging_requests_policy` | ALL | 🔴 **CRITIQUE** |
| `inventaire_lignes` | `unified_inventaire_lignes_policy` | ALL | 🔴 **CRITIQUE** |
| `inventaires` | `unified_inventaires_policy` | ALL | 🔴 **CRITIQUE** |
| `lignes_facture` | `unified_lignes_facture_policy` | ALL | 🔴 **CRITIQUE** |
| `motifs` | `unified_motifs_policy` | ALL | ⚠️ **MAJEURE** |
| `mouvements_stock` | `unified_mouvements_stock_policy` | ALL | 🔴 **CRITIQUE** |
| `patient_care_timeline` | `unified_patient_care_timeline_policy` | ALL | 🔴 **CRITIQUE** |
| `patient_files` | `unified_patient_files_policy` | ALL | 🔴 **CRITIQUE** |
| `pertes_retours` | `unified_pertes_retours_policy` | ALL | 🔴 **CRITIQUE** |
| `prescription_lines` | `unified_prescription_lines_policy` | ALL | 🔴 **CRITIQUE** |
| `protocols` | `unified_protocols_policy` | ALL | 🔴 **CRITIQUE** |
| `services_facturables` | `unified_services_facturables_policy` | ALL | ⚠️ **MAJEURE** |
| `stock_audit_log` | `unified_stock_audit_log_policy` | ALL | ⚠️ **MAJEURE** |
| `tickets_facturation` | `unified_tickets_facturation_access` | ALL | 🔴 **CRITIQUE** |
| `transfert_lignes` | `unified_transfert_lignes_policy` | ALL | 🔴 **CRITIQUE** |

**Tables avec `qual: "true"` (lecture publique)** :
- `cold_chain_logs` (SELECT)
- `consultation_prenatale` (SELECT)
- `consultation_roles` (SELECT)
- `consultation_steps` (SELECT)
- `default_role_permissions` (SELECT)
- `dossier_obstetrical` (SELECT)
- `imagerie_annotations` (SELECT)
- `imagerie_examens` (SELECT)
- `imagerie_images` (SELECT)
- `imagerie_rapports` (SELECT)
- `lab_alertes` (SELECT)
- `lab_consommations_reactifs` (SELECT)
- `lab_modeles_examens` (SELECT)
- `lab_stocks_reactifs` (SELECT)
- `lab_valeurs_reference` (SELECT)
- `role_definitions` (SELECT)
- `vaccine_batches` (SELECT)
- `vaccine_schedules` (SELECT)
- `vaccines` (SELECT)

---

## 🔴 4️⃣ TEST FRONTEND

### Failles identifiées

1. **`src/components/admin/StaffManagement.tsx`** :
   - Ligne 143-147 : Bypass Super Admin pour `users`
   - Ligne 169-173 : Bypass Super Admin pour `registration_requests`

2. **`src/pages/RegistrationRequests.tsx`** :
   - ✅ Utilise l'API backend (bon)
   - ⚠️ Mais l'API backend a une faille (voir #2)

3. **`src/components/utilisateurs/RegistrationRequestsTab.tsx`** :
   - ✅ Utilise l'API backend (bon)
   - ⚠️ Mais l'API backend a une faille (voir #2)

---

## 🔴 5️⃣ CLASSIFICATION DES FAILLES

### 🔴 CRITIQUE (Impact immédiat sur la confidentialité)

| # | Faille | Origine | Impact |
|---|--------|---------|--------|
| 1 | RLS `registration_requests_select` avec `OR true` | Backend (RLS) | Tous les utilisateurs voient toutes les demandes |
| 2 | Backend API ne filtre pas Super Admin | Backend (API) | Super Admins voient toutes les demandes |
| 3 | Edge Function sans filtrage | Backend (Edge) | Toutes les demandes exposées |
| 4 | Frontend direct queries avec bypass | Frontend | Super Admins voient toutes les demandes |
| 5 | 40+ politiques RLS avec `OR true` | Backend (RLS) | Fuites de données massives |

### ⚠️ MAJEURE (Impact sur l'intégrité des données)

| # | Faille | Origine | Impact |
|---|--------|---------|--------|
| 6 | Tables de référence sans filtrage | Backend (RLS) | Données partagées incorrectement |
| 7 | Tables d'audit sans filtrage | Backend (RLS) | Logs exposés entre cliniques |

### ⚪ MINEURE (Impact limité)

| # | Faille | Origine | Impact |
|---|--------|---------|--------|
| 8 | Tables de configuration sans filtrage | Backend (RLS) | Risque limité si données non sensibles |

---

## ✅ 6️⃣ RECOMMANDATIONS & CORRECTIONS

### Correction immédiate #1 : RLS Policy `registration_requests`

```sql
-- Migration SQL à appliquer
DROP POLICY IF EXISTS "registration_requests_select" ON registration_requests;
CREATE POLICY "registration_requests_select" ON registration_requests
FOR SELECT TO authenticated
USING (
  clinic_id = public.get_my_clinic_id() 
  OR public.check_is_super_admin()
);
```

### Correction immédiate #2 : Backend API

**Fichier** : `server/src/routes/auth.ts`

```typescript
// Ligne 304-313 : REMPLACER
let query = supabase
  .from('registration_requests')
  .select('*')
  .order('created_at', { ascending: false});

// TOUJOURS filtrer par clinic_id
if (!clinicId) {
  return res.status(400).json({
    success: false,
    message: 'Contexte de clinique manquant. Veuillez vous reconnecter.',
  });
}

query = query.eq('clinic_id', clinicId); // Toujours appliquer

if (statut && statut !== '') {
  query = query.eq('statut', statut);
}
```

### Correction immédiate #3 : Edge Function

**Fichier** : `supabase/functions/api/auth.ts`

```typescript
// Ajouter extraction clinic_id depuis JWT
// (Nécessite implémentation de helper)
const clinicId = await extractClinicIdFromJWT(req);
if (!clinicId) {
  return new Response(
    JSON.stringify({ success: false, message: 'Contexte clinique manquant' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

let query = supabase
  .from('registration_requests')
  .select('*')
  .eq('clinic_id', clinicId) // ✅ TOUJOURS filtrer
  .order('created_at', { ascending: false });
```

### Correction immédiate #4 : Frontend StaffManagement

**Fichier** : `src/components/admin/StaffManagement.tsx`

```typescript
// Ligne 160-182 : REMPLACER
const fetchRegistrationRequests = useCallback(async () => {
  try {
    if (!clinicId) {
      console.error('Clinic ID manquant');
      setRegistrationRequests([]);
      return;
    }

    let query = supabase
      .from('registration_requests')
      .select('*')
      .eq('clinic_id', clinicId) // ✅ TOUJOURS filtrer
      .eq('statut', 'pending')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    setRegistrationRequests(data || []);
  } catch (err: any) {
    console.error('Erreur récupération demandes:', err);
  }
}, [clinicId]); // Retirer currentUser de dépendances
```

### Correction massive #5 : Migration SQL pour toutes les politiques RLS

**Fichier** : `supabase_migrations/65_FIX_ALL_PERMISSIVE_RLS_POLICIES.sql`

*(Voir fichier séparé pour migration complète)*

---

## 📊 CHECKLIST DE VALIDATION MULTI-CLINIQUES

### Tests à effectuer

- [ ] **Test 1** : Connexion Clinique A → Vérifier que seules les demandes de Clinique A sont visibles
- [ ] **Test 2** : Connexion Clinique B → Vérifier que seules les demandes de Clinique B sont visibles
- [ ] **Test 3** : Super Admin connecté à Clinique A → Vérifier qu'il voit uniquement les demandes de Clinique A
- [ ] **Test 4** : Vérifier que les statistiques sont isolées par clinique
- [ ] **Test 5** : Vérifier que les RLS policies bloquent les accès cross-clinic
- [ ] **Test 6** : Vérifier que l'Edge Function filtre correctement
- [ ] **Test 7** : Vérifier que le backend API filtre correctement
- [ ] **Test 8** : Vérifier que les requêtes frontend directes filtrent correctement

---

## 🎯 PRIORISATION DES CORRECTIONS

### 🔴 URGENT (À corriger immédiatement)

1. ✅ RLS Policy `registration_requests_select`
2. ✅ Backend API `/auth/registration-requests`
3. ✅ Frontend `StaffManagement.tsx`
4. ✅ Edge Function `/api/auth/registration-requests`

### ⚠️ IMPORTANT (À corriger cette semaine)

5. ✅ Migration SQL pour corriger toutes les politiques RLS permissives (appliquée : 66, 67, 68, 69)
6. Audit et correction des autres endpoints API
7. Tests d'intégration multi-tenant

### 📋 MOYEN (À planifier)

8. Refactoring architecture pour centraliser le filtrage `clinic_id`
9. Implémentation de guards frontend systématiques
10. Documentation des bonnes pratiques multi-tenant

---

## 📝 NOTES FINALES

**Conclusion** : L'application présente des **failles critiques d'isolation multi-tenant** confirmées par l'image fournie. Les corrections doivent être appliquées **immédiatement** pour éviter toute fuite de données entre cliniques.

**Recommandation** : Appliquer toutes les corrections de la section "URGENT" avant toute mise en production.

---

**Rapport généré par MCP Test Sprite**  
**Date**: 2026-01-30

---

## ✅ ÉTAT POST-CORRECTION (RLS permissives)

**Date d'application** : 2026-01-30

### Migrations appliquées

| Fichier | Contenu |
|---------|---------|
| `66_FIX_PERMISSIVE_RLS_PART1_CORE.sql` | patients, consultations, consultation_constantes, consultation_entries, prescriptions, prescription_lines, factures, lignes_facture, paiements, journal_caisse, dispensations, dispensation_lignes, dispensation_audit, tickets_facturation |
| `67_FIX_PERMISSIVE_RLS_PART2_STOCK.sql` | medicaments, lots, inventaires, inventaire_lignes, mouvements_stock, transferts, transfert_lignes, pertes_retours, protocols |
| `68_FIX_PERMISSIVE_RLS_PART3_IMAGING_LAB.sql` | imaging_requests, imagerie_annotations, imagerie_examens, imagerie_images, imagerie_rapports, lab_requests, lab_alertes, lab_consommations_reactifs, lab_modeles_examens, lab_stocks_reactifs, lab_valeurs_reference |
| `69_FIX_PERMISSIVE_RLS_PART4_MISC.sql` | alertes_stock, audit_log, patient_care_timeline, patient_files, stock_audit_log, exam_catalog, motifs, services_facturables, consultation_templates, diagnostics (hybride), consultation_roles, consultation_steps, dossier_obstetrical, consultation_prenatale (via relations) |

### Pattern appliqué

- **Tables métier** : `USING (clinic_id = public.get_my_clinic_id())` et `WITH CHECK (clinic_id = public.get_my_clinic_id())` — aucune exception Super Admin en base.
- **Catalogues partagés** (exam_catalog, motifs, services_facturables, consultation_templates, diagnostics) : lecture `clinic_id = get_my_clinic_id() OR clinic_id IS NULL`, écriture `clinic_id = get_my_clinic_id()`.
- **Tables sans clinic_id** (dossier_obstetrical, consultation_prenatale) : policies via `EXISTS` sur `patients.clinic_id`.

### Vérification post-correction

Requête de contrôle des policies encore permissives (`qual` ou `with_check` contenant `true` ou `OR true`) :

```sql
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public'
  AND (qual::text LIKE '% OR true%' OR qual::text = 'true'
       OR with_check::text LIKE '% OR true%' OR with_check::text = 'true')
ORDER BY tablename, policyname;
```

**Résultat** : seules les tables de **référentiels globaux** conservent une lecture large (modèle hybride) :

- `cold_chain_logs` (cold_chain_logs_read)
- `default_role_permissions` (default_role_permissions_read_all)
- `role_definitions` (role_definitions_read_all)
- `vaccine_batches` (vaccine_batches_read)
- `vaccine_schedules` (vaccine_schedules_read)
- `vaccines` (vaccines_read)

Aucune table métier ou à caractère tenant ne possède plus de policy avec `USING (true)` ou `OR true`.

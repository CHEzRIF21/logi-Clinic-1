# 🔒 AUDIT D'ISOLATION MULTI-TENANT - Logiclinic
**Date**: 29 Janvier 2026  
**Auditeur**: MCP Test Sprite  
**Application**: Logiclinic (SaaS Multi-Cliniques)  
**Stack**: React/Next.js + Supabase (PostgreSQL + RLS)

---

## 📋 EXECUTIVE SUMMARY

**Résultat Global**: ⚠️ **FAILLES CRITIQUES DÉTECTÉES**

L'audit révèle **plusieurs failles d'isolation des données** entre cliniques qui peuvent permettre à une clinique d'accéder aux données d'une autre clinique. Ces failles touchent à la fois le **backend (RLS)** et le **frontend (requêtes non filtrées)**.

**Impact Métier**:
- ⚠️ **Confidentialité**: Violation potentielle de données médicales sensibles
- ⚠️ **Conformité**: Risque de non-conformité RGPD/HIPAA
- ⚠️ **Sécurité**: Accès non autorisé aux données patients

---

## 1️⃣ INVENTAIRE DES DONNÉES

### 1.1 Tables avec `clinic_id` direct ✅
**Total**: 68 tables sur 93

Ces tables sont **correctement isolées** au niveau schéma :
- `patients`, `consultations`, `factures`, `prescriptions`, `dispensations`
- `lots`, `medicaments`, `inventaires`, `transferts`
- `users`, `custom_profiles`, `configurations_facturation`
- Et 55 autres tables...

### 1.2 Tables SANS `clinic_id` direct ⚠️
**Total**: 25 tables

Ces tables nécessitent une isolation via **relations** ou doivent être **partagées globalement** :

#### 🔴 CRITIQUE - Tables métier sans isolation directe :
1. **`rendez_vous`** - ❌ **PAS DE RLS ACTIVE**
   - Impact: Les rendez-vous peuvent être visibles entre cliniques
   - Relation: Via `patient_id` → `patients.clinic_id`

2. **`lab_analyses`** - ❌ **PAS DE RLS ACTIVE**
   - Impact: Analyses de laboratoire visibles entre cliniques
   - Relation: Via `lab_prelevements` → `consultations` → `patients.clinic_id`

3. **`lab_prelevements`** - ❌ **PAS DE RLS ACTIVE**
   - Impact: Prélèvements visibles entre cliniques
   - Relation: Via `consultations` → `patients.clinic_id`

4. **`lab_prescriptions`** - ❌ **PAS DE RLS ACTIVE**
   - Impact: Prescriptions lab visibles entre cliniques
   - Relation: Via `consultations` → `patients.clinic_id`

5. **`lab_rapports`** - ❌ **PAS DE RLS ACTIVE**
   - Impact: Rapports lab visibles entre cliniques
   - Relation: Via `lab_prelevements` → `consultations` → `patients.clinic_id`

#### 🟡 MAJEUR - Tables maternité (isolation via relations) :
6. **`accouchement`** - ✅ RLS via `dossier_obstetrical_id` → `patient_id`
7. **`consultation_prenatale`** - ✅ RLS via `dossier_obstetrical_id` → `patient_id`
8. **`dossier_obstetrical`** - ✅ RLS via `patient_id` → `patients.clinic_id`
9. **`delivrance`** - ✅ RLS via `accouchement_id` → `dossier_obstetrical_id` → `patient_id`
10. **`nouveau_ne`** - ✅ RLS via `accouchement_id` → `dossier_obstetrical_id` → `patient_id`
11. **`carte_infantile`** - ✅ RLS via `nouveau_ne_id` → `accouchement_id` → `patient_id`
12. **`grossesses_anterieures`** - ✅ RLS via `dossier_obstetrical_id` → `patient_id`
13. **`soins_immediats`** - ✅ RLS via `nouveau_ne_id` → `accouchement_id` → `patient_id`
14. **`soins_promotionnels`** - ✅ RLS via `dossier_obstetrical_id` → `patient_id`
15. **`vaccination_maternelle`** - ✅ RLS via `dossier_obstetrical_id` → `patient_id`

#### 🟡 MAJEUR - Tables vaccination (isolation partielle) :
16. **`patient_vaccinations`** - ✅ RLS via `patient_id` → `patients.clinic_id`
17. **`vaccination_reminders`** - ✅ RLS via `patient_id` → `patients.clinic_id`
18. **`vaccines`** - ✅ RLS admin seulement (lecture publique)
19. **`vaccine_batches`** - ✅ RLS admin seulement (lecture publique)
20. **`vaccine_schedules`** - ✅ RLS admin seulement (lecture publique)
21. **`cold_chain_logs`** - ✅ RLS admin seulement (lecture publique)

#### 🟢 MINEUR - Tables système/configuration (partagées intentionnellement) :
22. **`clinics`** - ✅ RLS active (lecture contrôlée)
23. **`default_role_permissions`** - ✅ RLS admin seulement
24. **`role_definitions`** - ✅ RLS admin seulement
25. **`security_questions`** - ✅ RLS lecture publique
26. **`notification_types`** - ✅ RLS lecture publique
27. **`data_cleanup_log`** - ⚠️ Pas de RLS (table système)

---

## 2️⃣ TEST BACKEND (SUPABASE RLS)

### 2.1 Tables SANS politiques RLS ❌

**15 tables critiques sans protection RLS** :

| Table | Impact | Gravité |
|-------|--------|---------|
| `rendez_vous` | Rendez-vous visibles entre cliniques | 🔴 CRITIQUE |
| `lab_analyses` | Analyses lab visibles entre cliniques | 🔴 CRITIQUE |
| `lab_prelevements` | Prélèvements visibles entre cliniques | 🔴 CRITIQUE |
| `lab_prescriptions` | Prescriptions lab visibles entre cliniques | 🔴 CRITIQUE |
| `lab_rapports` | Rapports lab visibles entre cliniques | 🔴 CRITIQUE |
| `lab_prescriptions_analyses` | Lignes prescriptions lab visibles | 🔴 CRITIQUE |
| `clinic_pricing` | Tarifs cliniques visibles | 🟡 MAJEUR |
| `clinic_pricing_history` | Historique tarifs visible | 🟡 MAJEUR |
| `credits_facturation` | Crédits visibles | 🟡 MAJEUR |
| `conseils_post_partum` | Conseils visibles | 🟡 MAJEUR |
| `observation_post_partum` | Observations visibles | 🟡 MAJEUR |
| `patient_deparasitage` | Déparasitage visible | 🟡 MAJEUR |
| `sortie_salle_naissance` | Sorties visibles | 🟡 MAJEUR |
| `surveillance_post_partum` | Surveillance visible | 🟡 MAJEUR |
| `traitement_post_partum` | Traitements visibles | 🟡 MAJEUR |

### 2.2 Politiques RLS permissives détectées ✅

**Aucune politique permissive détectée** (toutes corrigées lors de l'audit précédent).

### 2.3 Fonctions RPC sans vérification `clinic_id`

**Toutes les fonctions RPC ont `SET search_path = public`** ✅

---

## 3️⃣ TEST FRONTEND

### 3.1 Requêtes sans filtrage `clinic_id` ❌

#### 🔴 CRITIQUE - `rendez_vous`

**Fichier**: `src/pages/RendezVous.tsx:157-179`
```typescript
// ❌ PROBLÈME: Pas de filtre clinic_id dans la requête
let query = supabase
  .from('rendez_vous')
  .select(`...`)
  .gte('date_debut', todayRange.start)
  .lte('date_debut', todayRange.end)
  // ⚠️ MANQUE: .eq('clinic_id', clinicId)
```

**Impact**: Un utilisateur de la Clinique A peut voir les rendez-vous de la Clinique B.

**Fichier**: `src/services/rendezVousService.ts:147`
```typescript
// ❌ PROBLÈME: Insertion sans clinic_id forcé
const { data, error } = await supabase
  .from('rendez_vous')
  .insert(payload)  // ⚠️ payload peut ne pas contenir clinic_id
  .select()
  .single();
```

**Impact**: Un utilisateur peut créer un rendez-vous pour une autre clinique.

**Fichier**: `src/hooks/useDashboardData.ts:118-123`
```typescript
// ✅ CORRECT: Filtre clinic_id présent
let rvTodayQuery = supabase
  .from('rendez_vous')
  .select('*')
  .gte('date_debut', today.toISOString())
  .lte('date_debut', todayEnd.toISOString());
if (!superAdmin && clinicId) rvTodayQuery = rvTodayQuery.eq('clinic_id', clinicId);
```

#### 🔴 CRITIQUE - `exam_catalog`

**Fichier**: `src/services/examCatalogService.ts:59-81`
```typescript
// ❌ PROBLÈME: Pas de filtre clinic_id
let query = supabase
  .from('exam_catalog')
  .select('*')
  .order('categorie', { ascending: true })
  // ⚠️ MANQUE: .eq('clinic_id', clinicId)
```

**Impact**: Catalogue d'examens partagé entre toutes les cliniques (peut être intentionnel si c'est un catalogue global).

**Note**: Si `exam_catalog` doit être partagé, la table doit avoir une RLS qui permet la lecture à tous mais l'écriture seulement aux admins.

#### 🟡 MAJEUR - `dispensations`

**Fichier**: `src/hooks/useDispensations.ts:71-108`
```typescript
// ⚠️ PROBLÈME: Pas de filtre clinic_id explicite
let query = supabase
  .from('dispensations')
  .select(`...`)
  .order('date_dispensation', { ascending: false });
// ⚠️ MANQUE: .eq('clinic_id', clinicId)
```

**Impact**: Dépend de la RLS sur `dispensations`. Si RLS est correcte, pas de problème. Sinon, fuite de données.

**Vérification RLS**: ✅ RLS active sur `dispensations` via `dispensations_clinic_access`

#### 🟡 MAJEUR - `consultations`

**Fichier**: `src/services/consultationService.ts` (multiple occurrences)
```typescript
// ⚠️ VÉRIFIER: Toutes les requêtes doivent filtrer par clinic_id
// ou utiliser queryWithClinicFilter()
```

**Vérification RLS**: ✅ RLS active sur `consultations` via `consultations_clinic_access`

#### 🟡 MAJEUR - `patients`

**Fichier**: `src/services/patientService.ts` (multiple occurrences)
```typescript
// ⚠️ VÉRIFIER: Toutes les requêtes doivent filtrer par clinic_id
// ou utiliser queryWithClinicFilter()
```

**Vérification RLS**: ✅ RLS active sur `patients` via `unified_patients_access`

---

## 4️⃣ CLASSIFICATION DES FAILLES

### 🔴 CRITIQUE - Fuite de données garantie

| # | Table/Service | Fichier | Ligne | Description | Impact |
|---|---------------|---------|-------|-------------|--------|
| 1 | `rendez_vous` | `src/pages/RendezVous.tsx` | 157-179 | SELECT sans filtre `clinic_id` | Rendez-vous visibles entre cliniques |
| 2 | `rendez_vous` | `src/services/rendezVousService.ts` | 147 | INSERT sans `clinic_id` forcé | Création de rendez-vous pour autre clinique |
| 3 | `rendez_vous` | Backend | - | **PAS DE RLS** | Accès direct possible via API |
| 4 | `lab_analyses` | Backend | - | **PAS DE RLS** | Analyses visibles entre cliniques |
| 5 | `lab_prelevements` | Backend | - | **PAS DE RLS** | Prélèvements visibles entre cliniques |
| 6 | `lab_prescriptions` | Backend | - | **PAS DE RLS** | Prescriptions lab visibles entre cliniques |
| 7 | `lab_rapports` | Backend | - | **PAS DE RLS** | Rapports lab visibles entre cliniques |

### 🟡 MAJEUR - Fuite de données potentielle

| # | Table/Service | Fichier | Ligne | Description | Impact |
|---|---------------|---------|-------|-------------|--------|
| 8 | `exam_catalog` | `src/services/examCatalogService.ts` | 59-81 | SELECT sans filtre `clinic_id` | Catalogue partagé (peut être intentionnel) |
| 9 | `clinic_pricing` | Backend | - | **PAS DE RLS** | Tarifs visibles entre cliniques |
| 10 | `clinic_pricing_history` | Backend | - | **PAS DE RLS** | Historique tarifs visible |
| 11 | `credits_facturation` | Backend | - | **PAS DE RLS** | Crédits visibles |
| 12 | Tables post-partum (5) | Backend | - | **PAS DE RLS** | Données maternité visibles |

### 🟢 MINEUR - Risque faible

| # | Table/Service | Description | Impact |
|---|---------------|-------------|--------|
| 13 | `data_cleanup_log` | Table système sans RLS | Logs système (non critique) |

---

## 5️⃣ RECOMMANDATIONS

### 5.1 Corrections IMMÉDIATES (Critique)

#### ✅ 1. Ajouter RLS sur `rendez_vous`

```sql
-- Migration Supabase
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rendez_vous_clinic_access" ON rendez_vous;
CREATE POLICY "rendez_vous_clinic_access" ON rendez_vous
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);
```

#### ✅ 2. Corriger `src/pages/RendezVous.tsx`

```typescript
// AVANT (❌)
let query = supabase
  .from('rendez_vous')
  .select(`...`)
  .gte('date_debut', todayRange.start)
  .lte('date_debut', todayRange.end);

// APRÈS (✅)
const clinicId = await getMyClinicId();
const superAdmin = await isSuperAdmin();

let query = supabase
  .from('rendez_vous')
  .select(`...`)
  .gte('date_debut', todayRange.start)
  .lte('date_debut', todayRange.end);

if (!superAdmin && clinicId) {
  query = query.eq('clinic_id', clinicId);
}
```

#### ✅ 3. Corriger `src/services/rendezVousService.ts`

```typescript
// AVANT (❌)
const { data, error } = await supabase
  .from('rendez_vous')
  .insert(payload)
  .select()
  .single();

// APRÈS (✅)
const clinicId = await getMyClinicId();
if (!clinicId) {
  throw new Error('Clinic ID manquant');
}

const payloadWithClinic = {
  ...payload,
  clinic_id: clinicId,  // Forcer clinic_id
};

const { data, error } = await supabase
  .from('rendez_vous')
  .insert(payloadWithClinic)
  .select()
  .single();
```

#### ✅ 4. Ajouter RLS sur tables laboratoire

```sql
-- lab_analyses (via lab_prelevements → consultations → patients)
ALTER TABLE lab_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lab_analyses_clinic_access" ON lab_analyses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lab_prelevements lp
    JOIN consultations c ON c.id = lp.consultation_id
    JOIN patients p ON p.id = c.patient_id
    WHERE lp.id = lab_analyses.prelevement_id
    AND (p.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lab_prelevements lp
    JOIN consultations c ON c.id = lp.consultation_id
    JOIN patients p ON p.id = c.patient_id
    WHERE lp.id = lab_analyses.prelevement_id
    AND (p.clinic_id = public.get_my_clinic_id() OR public.check_is_super_admin())
  )
);

-- Répéter pour lab_prelevements, lab_prescriptions, lab_rapports
```

### 5.2 Corrections URGENTES (Majeur)

#### ✅ 5. Ajouter RLS sur `clinic_pricing`

```sql
ALTER TABLE clinic_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_pricing_clinic_access" ON clinic_pricing
FOR ALL TO authenticated
USING (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
)
WITH CHECK (
  clinic_id = public.get_my_clinic_id()
  OR public.check_is_super_admin()
);
```

#### ✅ 6. Corriger `exam_catalog` (si partagé intentionnellement)

```sql
-- Si exam_catalog doit être partagé (catalogue global)
ALTER TABLE exam_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exam_catalog_read_all" ON exam_catalog
FOR SELECT TO authenticated
USING (true);  -- Lecture pour tous

CREATE POLICY "exam_catalog_write_admin" ON exam_catalog
FOR INSERT, UPDATE, DELETE TO authenticated
USING (
  public.check_is_super_admin() OR public.check_is_clinic_admin()
)
WITH CHECK (
  public.check_is_super_admin() OR public.check_is_clinic_admin()
);
```

### 5.3 Bonnes pratiques Frontend

#### ✅ 7. Utiliser `queryWithClinicFilter()` partout

```typescript
// ✅ BONNE PRATIQUE
import { queryWithClinicFilter } from '../services/clinicService';

const { data, error } = await queryWithClinicFilter<DispensationItem>(
  'dispensations',
  `id, date_dispensation, patient_id, ...`,
  (query) => query.order('date_dispensation', { ascending: false })
);
```

#### ✅ 8. Utiliser `insertWithClinicId()` pour les INSERT

```typescript
// ✅ BONNE PRATIQUE
import { insertWithClinicId } from '../services/clinicService';

const { data, error } = await insertWithClinicId<RendezVousRecord>(
  'rendez_vous',
  {
    patient_id: patientId,
    date_debut: dateDebut,
    // clinic_id sera ajouté automatiquement
  }
);
```

### 5.4 Architecture cible SaaS multi-tenant

#### ✅ 9. Middleware de validation backend

```typescript
// server/src/middleware/clinicContext.ts
export function requireClinicContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as AuthRequest).user;
  
  if (!user) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  
  if (!isSuperAdmin && !user.clinic_id) {
    return res.status(403).json({ error: 'Contexte de clinique manquant' });
  }
  
  (req as ClinicContextRequest).clinicId = user.clinic_id || '';
  (req as ClinicContextRequest).isSuperAdmin = isSuperAdmin;
  
  next();
}
```

#### ✅ 10. Helper de requête backend

```typescript
// server/src/utils/dbHelpers.ts
export function addClinicFilter<T>(
  query: any,
  clinicId: string | null,
  isSuperAdmin: boolean
): any {
  if (!isSuperAdmin && clinicId) {
    return query.eq('clinic_id', clinicId);
  }
  return query;
}
```

---

## 6️⃣ CHECKLIST DE VALIDATION MULTI-CLINIQUES

### ✅ Backend (Supabase RLS)

- [ ] Toutes les tables métier ont des politiques RLS actives
- [ ] Aucune politique RLS avec `USING (true)` ou `WITH CHECK (true)` pour INSERT/UPDATE/DELETE
- [ ] Toutes les fonctions RPC ont `SET search_path = public`
- [ ] Toutes les fonctions `SECURITY DEFINER` ont `SET search_path = public`
- [ ] Les tables sans `clinic_id` direct ont des politiques via relations

### ✅ Frontend (React)

- [ ] Toutes les requêtes `.from()` filtrent par `clinic_id` (sauf Super Admin)
- [ ] Toutes les insertions incluent `clinic_id` automatiquement
- [ ] Utilisation de `queryWithClinicFilter()` pour les SELECT
- [ ] Utilisation de `insertWithClinicId()` pour les INSERT
- [ ] Vérification `clinic_id` avant chaque requête critique

### ✅ Backend API (Express)

- [ ] Middleware `requireClinicContext()` sur toutes les routes sensibles
- [ ] Validation `clinic_id` dans tous les controllers
- [ ] Filtrage automatique par `clinic_id` dans les requêtes DB
- [ ] Logs d'audit pour les accès inter-cliniques

### ✅ Tests

- [ ] Test: Utilisateur Clinique A ne voit pas les données Clinique B
- [ ] Test: Super Admin voit toutes les données
- [ ] Test: INSERT sans `clinic_id` est rejeté
- [ ] Test: UPDATE/DELETE d'une autre clinique est rejeté
- [ ] Test: RLS bloque les requêtes directes SQL

---

## 7️⃣ PLAN D'ACTION PRIORISÉ

### Phase 1 - CRITIQUE (À faire IMMÉDIATEMENT)

1. ✅ Ajouter RLS sur `rendez_vous`
2. ✅ Corriger `src/pages/RendezVous.tsx` (ajouter filtre `clinic_id`)
3. ✅ Corriger `src/services/rendezVousService.ts` (forcer `clinic_id` à l'insertion)
4. ✅ Ajouter RLS sur `lab_analyses`, `lab_prelevements`, `lab_prescriptions`, `lab_rapports`

**Délai**: 24 heures

### Phase 2 - URGENT (Cette semaine)

5. ✅ Ajouter RLS sur `clinic_pricing`, `clinic_pricing_history`, `credits_facturation`
6. ✅ Ajouter RLS sur tables post-partum (5 tables)
7. ✅ Corriger `exam_catalog` (définir si partagé ou isolé)
8. ✅ Refactoriser toutes les requêtes frontend pour utiliser `queryWithClinicFilter()`

**Délai**: 7 jours

### Phase 3 - IMPORTANT (Ce mois)

9. ✅ Ajouter tests d'isolation multi-tenant
10. ✅ Implémenter logging d'audit pour accès inter-cliniques
11. ✅ Documenter les règles d'isolation par table
12. ✅ Créer un guide de développement multi-tenant

**Délai**: 30 jours

---

## 8️⃣ CONCLUSION

L'audit révèle **7 failles critiques** et **12 failles majeures** d'isolation des données entre cliniques. Les principales causes sont :

1. **Absence de RLS** sur 15 tables critiques
2. **Requêtes frontend sans filtre `clinic_id`**
3. **Insertions sans `clinic_id` forcé**

**Recommandation**: Appliquer immédiatement les corrections de la **Phase 1** pour éviter toute fuite de données médicales sensibles.

---

**Rapport généré par**: MCP Test Sprite  
**Date**: 29 Janvier 2026  
**Version**: 1.0

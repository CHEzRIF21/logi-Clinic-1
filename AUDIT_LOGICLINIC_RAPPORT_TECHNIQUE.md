# Rapport d'audit technique — LogiClinic

**Date :** 10 février 2026  
**Objectif :** Identifier les migrations backend manquantes, incohérences frontend/backend et proposer des corrections pour un fonctionnement complet.

---

## 1. Migrations critiques manquantes

### 1.1 Table `lab_requests` inexistante

**Impact :** Dashboard et `ConsultationService.getLabRequests()` échouent.

| Fichier | Usage |
|---------|-------|
| `useDashboardData.ts` | `.from('lab_requests').select('id').eq('status','EN_ATTENTE')` |
| `consultationService.ts` | `.from('lab_requests').select('*').eq('consultation_id', consultationId)` |

**Cause :** Le schéma utilise `lab_prescriptions` (module laboratoire). La table `lab_requests` n’est jamais créée.

**Migration recommandée :**

```sql
-- Option A: Créer lab_requests (legacy) OU
-- Option B: Corriger le frontend pour utiliser lab_prescriptions

-- Si Option A (migration backend):
CREATE TABLE IF NOT EXISTS lab_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'EN_ATTENTE' CHECK (status IN ('EN_ATTENTE', 'PRELEVE', 'TERMINE', 'ANNULE')),
  type_examen TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lab_requests_consultation ON lab_requests(consultation_id);
CREATE INDEX IF NOT EXISTS idx_lab_requests_clinic ON lab_requests(clinic_id);
```

**Priorité :** Critique — le dashboard peut lever des erreurs pour les rôles `laborantin`.

---

### 1.2 Table `alertes_maternite` inexistante

**Impact :** Page Maternité — alerte "Table alertes_maternite non disponible".

| Fichier | Usage |
|---------|-------|
| `Maternite.tsx` | `.from('alertes_maternite').select('*')` |

**Migration recommandée :**

```sql
CREATE TABLE IF NOT EXISTS alertes_maternite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  dossier_obstetrical_id UUID REFERENCES dossier_obstetrical(id) ON DELETE CASCADE,
  type_alerte VARCHAR(100) NOT NULL,
  message TEXT,
  severite VARCHAR(20) DEFAULT 'info' CHECK (severite IN ('info', 'warning', 'urgence')),
  date_alerte TIMESTAMPTZ DEFAULT NOW(),
  lue BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alertes_maternite_clinic ON alertes_maternite(clinic_id);
CREATE INDEX IF NOT EXISTS idx_alertes_maternite_dossier ON alertes_maternite(dossier_obstetrical_id);
```

**Priorité :** Important — les alertes maternité ne s’affichent pas.

---

### 1.3 Colonne `consultation_id` sur `consultation_constantes`

**Impact :** `ConsultationService.getConstantes()` utilise `.eq('consultation_id', consultationId)` alors que la table initiale a `consult_id`.

**État :** Migration 56 ajoute une contrainte UNIQUE sur `consultation_id` sans ajouter la colonne → risque d’échec.

**Migration recommandée :**

```sql
ALTER TABLE public.consultation_constantes
  ADD COLUMN IF NOT EXISTS consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE;
-- Synchroniser les données existantes
UPDATE public.consultation_constantes SET consultation_id = consult_id WHERE consultation_id IS NULL;
-- Puis appliquer la contrainte UNIQUE si nécessaire
```

**Priorité :** Critique — les constantes de consultation peuvent ne pas être chargées.

---

## 2. Migrations importantes

### 2.1 RPC `get_my_clinic_id` manquant

**Impact :** `clinicService.ts` appelle `supabase.rpc('get_my_clinic_id')` — la fonction existe en PostgreSQL mais peut ne pas être exposée en RPC.

**Vérification :** S’assurer que `get_my_clinic_id()` est bien exposée dans l’API Supabase (via `CREATE` ou `GRANT`).

---

### 2.2 Tables `notification_types`, `notification_recipients`, `notification_rules`

**Impact :** `notificationService.ts` utilise ces tables. Vérifier leur existence et leur schéma.

---

### 2.3 Colonne `consultation_id` sur `prescription_lines`

**Impact :** `prescription_lines` se joint via `prescription_id` → `prescriptions` → `consultation_id`. Pas de colonne directe — comportement cohérent avec le schéma actuel.

---

## 3. Optimisations recommandées

### 3.1 Index

```sql
CREATE INDEX IF NOT EXISTS idx_consultations_started_at ON consultations(started_at);
CREATE INDEX IF NOT EXISTS idx_consultations_status_clinic ON consultations(status, clinic_id);
CREATE INDEX IF NOT EXISTS idx_factures_consultation_id ON factures(consultation_id) WHERE consultation_id IS NOT NULL;
```

### 3.2 Cohérence `lab_requests` vs `lab_prescriptions`

**Recommandation :** Migrer le frontend vers `lab_prescriptions` :

- `useDashboardData.ts` : remplacer `lab_requests` par `lab_prescriptions` avec un mapping `statut` ↔ `status`.
- `consultationService.getLabRequests()` : utiliser `lab_prescriptions` + `consultation_id` (déjà présent via `create_laboratoire_connexions_modules`).

---

## 4. Tables et relations

### 4.1 Schéma des tables principales

| Table | clinic_id | Statut |
|-------|-----------|--------|
| patients | Oui | OK |
| consultations | Oui | OK |
| factures | Oui | OK |
| paiements | Oui | OK |
| prescriptions | Oui | OK |
| consultation_constantes | Oui | Vérifier `consultation_id` |
| consultation_steps | Non (via consult_id) | OK |
| dossier_obstetrical | Non (via patient_id) | OK |
| lab_prescriptions | Oui (via migration) | OK |
| imagerie_examens | Non (patient_id) | OK, `consultation_id` optionnel |
| patient_files | Oui | OK |

### 4.2 Relations principales

| Relation | Statut |
|----------|--------|
| factures.consultation_id → consultations | OK (migration 95) |
| prescriptions.consultation_id → consultations | OK |
| lab_prescriptions.consultation_id → consultations | OK (create_laboratoire_connexions) |
| HistoriquePaiements : factures ↔ consultations(statut_paiement) | OK (migration 94) |

---

## 5. RLS et sécurité multi-tenant

### 5.1 État actuel

- RLS activé sur les tables principales.
- Policies `super_admin` et `clinic_access` (ou équivalent) en place.
- Migration 100 : policies nurse/ide/midwife.

### 5.2 Points d’attention

1. **JWT** : Les custom claims `role` et `clinic_id` doivent être injectés au login (via `validate_clinic_login`, `authenticate_user_by_email` ou trigger).
2. **Tables sans `clinic_id`** : `dossier_obstetrical`, `consultation_prenatale`, `accouchement`, etc. — isolation via `patient_id` → `patients.clinic_id`.
3. **Requêtes sans filtre `clinic_id`** : `ConsultationService.getConsultationById()` et `getAllConsultations()` filtrent par `clinic_id` côté frontend après `getMyClinicId()` — comportement acceptable car RLS filtre côté DB.

---

## 6. Workflow consultation

### 6.1 Flux actuel

1. Création consultation : `consultations` avec `status: 'EN_COURS'`.
2. Étapes : `consultation_steps` (consult_id, step_number, data).
3. Bouton "Sauvegarder" : `ConsultationService.saveWorkflowStep()` → upsert `consultation_steps`.
4. Reprise : chargement des steps depuis `consultation_steps`.

### 6.2 Colonnes utilisées

| Colonne | Table | Statut |
|---------|-------|--------|
| started_at | consultations | OK (migration 98) |
| statut_paiement | consultations | OK (migration 94) |
| numero_prescription | prescriptions | OK (migration 99) |

### 6.3 Améliorations proposées

1. **Sauvegarde automatique** : Débounce (ex. 30 s) sur les changements de step pour appeler `saveWorkflowStep`.
2. **`current_step`** : Colonne optionnelle sur `consultations` pour reprendre au bon step sans scanner tous les steps.
3. **Blocage de clôture** : Vérifier que les étapes obligatoires (constantes, diagnostic, prescription si nécessaire) sont renseignées avant `status = 'CLOTURE'`.
4. **Journal d’audit** : `audit_log` déjà utilisé par `consultationIntegrationService` — continuer à logger les actions sensibles.

---

## 7. Bugs frontend liés aux migrations

| Bug | Fichier | Cause |
|-----|---------|-------|
| Erreur chargement lab dashboard | useDashboardData.ts | Table `lab_requests` absente |
| Alertes maternité non disponibles | Maternite.tsx | Table `alertes_maternite` absente |
| Constantes consultation non chargées | consultationService.ts | `consultation_id` vs `consult_id` sur `consultation_constantes` |

---

## 8. Risques de sécurité

1. **RLS** : Vérifier que toutes les tables contenant des données sensibles ont RLS activé et des policies cohérentes.
2. **`clinic_id` dans le JWT** : Nécessaire pour les policies nurse/ide/midwife (migration 100).
3. **Requêtes sans filtre** : Les requêtes qui ne filtrent pas par `clinic_id` s’appuient sur RLS — vérifier que les policies couvrent bien tous les cas.

---

## 9. Plan d’action priorisé

### Phase 1 — Critique (cette semaine)

1. **Appliqué** : Migration `101_FIX_CRITICAL_MISSING_SCHEMA.sql` créée (consultation_constantes.consultation_id + alertes_maternite).
2. Migrer le frontend pour utiliser `lab_prescriptions` au lieu de `lab_requests` dans `useDashboardData` et `consultationService.getLabRequests()`.

### Phase 2 — Important

3. Créer la migration `102_CREATE_ALERTES_MATERNITE.sql`.
4. Corriger le fallback dans `Maternite.tsx` pour afficher un message plus explicite si la table n’existe pas.

### Phase 3 — Optimisation

5. Créer `lab_requests` si un besoin legacy persiste, ou supprimer toute référence à cette table.
6. Ajouter les index recommandés.
7. Implémenter la sauvegarde automatique du workflow consultation.

---

## 10. Fichier de migration consolidé (critique)

Un fichier `101_FIX_CRITICAL_MISSING_SCHEMA.sql` peut regrouper :

- `consultation_constantes.consultation_id`
- Table `alertes_maternite`
- Vérifications d’existence avant création

---

*Rapport généré par audit automatisé LogiClinic — 10/02/2026*

# Rapport – Isolation stricte `clinic_id` et validation staff

**Date**: 2026-01-29  
**Contexte**: Plan d’isolement strict + workflow staff en 2 étapes (Logiclinic).

---

## 1. Modifications effectuées

### 1.1 Contexte clinique strict (Node + Edge)

- **`server/src/middleware/clinicContext.ts`**
  - `clinic_id` obligatoire pour **tous** les utilisateurs (y compris SUPER_ADMIN).
  - Plus d’exception pour SUPER_ADMIN : refus 403 si `!user.clinic_id`.

- **`server/src/middleware/auth.ts`**
  - `clinic_id` pris **uniquement** depuis le profil (DB / JWT metadata).
  - Suppression du fallback `x-clinic-id` (même en dev).

- **`supabase/functions/_shared/auth.ts`**
  - `requireClinicContext()` exige un `clinic_id` pour tous.
  - `getEffectiveClinicId()` retourne **uniquement** `user.clinic_id` (plus de lecture du header `x-clinic-id`).
  - Blocage des comptes **PENDING** (en attente d’activation) en plus de SUSPENDED/REJECTED.

- **`supabase/functions/api/auth.ts`** et **`supabase/functions/api/auth_standalone.ts`**
  - GET/POST registration-requests et approve/reject utilisent **uniquement** `user.clinic_id`.
  - Plus d’usage de `x-clinic-id` ; si `!user.clinic_id` → 400.
  - Approbation : création du user avec `actif: false`, `status: 'PENDING'`.

### 1.2 Workflow staff en 2 étapes

- **Backend Node `server/src/routes/auth.ts`**
  - Approbation crée l’utilisateur avec `actif: false`, `status: 'PENDING'`.
  - Nouvel endpoint **`POST /auth/users/:id/activate`** (authenticateToken + requireClinicContext) :
    - Vérifie que l’utilisateur cible appartient à la clinique du demandeur.
    - Vérifie que le statut est PENDING et `actif` false.
    - Met à jour `actif: true`, `status: 'ACTIVE'`.

- **Middleware d’authentification (Node + Edge)**
  - Refus d’accès si `status === 'PENDING'` (en plus de SUSPENDED/REJECTED).
  - Un membre non activé ne peut pas consommer l’API.

### 1.3 Suppression de `x-clinic-id` côté frontend

- **`src/pages/RegistrationRequests.tsx`** : envoi de `x-clinic-id` supprimé sur approve/reject.
- **`src/components/utilisateurs/RegistrationRequestsTab.tsx`** : idem.
- **`src/hooks/useDashboardData.ts`** : suppression de `headers['x-clinic-id']` pour l’appel `statistics/dashboard`.
- **`src/services/apiClient.ts`** : suppression de l’ajout de `x-clinic-id` dans `apiRequest` et `apiUpload`.
- **`src/services/userPermissionsService.ts`** : suppression de `x-clinic-id` sur l’appel reset-password.

### 1.4 Vérification RLS (MCP Supabase)

- Requête exécutée sur `pg_policies` (qual/with_check contenant `true` ou `OR true`).
- **Résultat** : seules des tables de **référence** ont des policies permissives (cold_chain_logs, default_role_permissions, role_definitions, vaccine_batches, vaccine_schedules, vaccines).
- Aucune table **tenant** (patients, consultations, registration_requests, alertes_stock, etc.) n’a de policy permissive ; aucune migration corrective RLS ajoutée.

---

## 2. Fichiers modifiés (résumé)

| Fichier | Changement principal |
|--------|------------------------|
| `server/src/middleware/clinicContext.ts` | clinic_id obligatoire pour tous |
| `server/src/middleware/auth.ts` | Pas de x-clinic-id ; blocage PENDING |
| `server/src/routes/auth.ts` | actif=false + PENDING à l’approbation ; POST /users/:id/activate |
| `supabase/functions/_shared/auth.ts` | requireClinicContext strict ; getEffectiveClinicId sans header ; blocage PENDING |
| `supabase/functions/api/auth.ts` | clinic_id uniquement depuis user ; approve crée user inactif |
| `supabase/functions/api/auth_standalone.ts` | Aligné sur auth.ts (clinic_id + user inactif + PENDING bloqué) |
| `src/pages/RegistrationRequests.tsx` | Suppression x-clinic-id |
| `src/components/utilisateurs/RegistrationRequestsTab.tsx` | Suppression x-clinic-id |
| `src/hooks/useDashboardData.ts` | Suppression x-clinic-id |
| `src/services/apiClient.ts` | Suppression x-clinic-id |
| `src/services/userPermissionsService.ts` | Suppression x-clinic-id |

---

## 3. Checklist de validation multi-cliniques

À exécuter manuellement ou via vos tests :

- [ ] **Contexte clinique** : Connexion avec un compte sans `clinic_id` → 403 (contexte clinique manquant).
- [ ] **Registration requests** : Utilisateur clinique A ne voit que les demandes de la clinique A (API + RLS).
- [ ] **Approbation** : Après approbation, le user créé a `actif=false`, `status=PENDING` ; il ne peut pas se connecter / appeler l’API.
- [ ] **Activation** : Appel `POST /auth/users/:id/activate` par un admin de la même clinique → user passe ACTIVE + actif=true ; il peut se connecter.
- [ ] **Pas de x-clinic-id** : Les appels frontend (registration-requests, dashboard stats, apiClient, reset-password) n’envoient plus `x-clinic-id` ; le backend détermine le contexte depuis le token/profil.
- [ ] **RLS** : Aucune policy permissive sur les tables tenant (vérification faite via `pg_policies`).

---

## 4. Tests multi-cliniques suggérés (TestSprite / manuels)

1. **Deux cliniques A et B** : deux comptes (admin ou staff) liés chacun à une clinique.
2. **Listes** : pour chaque compte, vérifier que patients, consultations, registration_requests, alertes_stock, etc. ne contiennent que les lignes de sa clinique.
3. **Activation** : créer une demande d’inscription pour la clinique A, l’approuver, vérifier que le user est PENDING/inactif ; appeler `POST /auth/users/:id/activate` avec le token admin clinique A ; vérifier que le user peut ensuite se connecter.
4. **Isolation** : avec le token clinique A, tenter d’activer un user de la clinique B → 403.

---

*Rapport généré dans le cadre du plan d’isolement strict `clinic_id` et de la validation staff.*

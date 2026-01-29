# Audit des accès DB – scope clinic_id

Ce document liste les accès aux tables sensibles (registration_requests, imagerie_*, imaging_requests, alertes_stock, transferts, journal_caisse, factures, paiements) et indique si un filtre `clinic_id` est appliqué.

## Légende

- ✅ Filtre `clinic_id` appliqué (ou table globale autorisée)
- ❌ Pas de filtre `clinic_id` – fuite possible
- ⚠️ Filtre conditionnel (ex: seulement si non SUPER_ADMIN) – à durcir si besoin

---

## Backend (server)

### registration_requests

| Fichier | Méthode / route | Filtre clinic_id |
|---------|------------------|------------------|
| `server/src/routes/auth.ts` | GET /registration-requests | ⚠️ Filtre seulement si `clinicId && userRole !== 'SUPER_ADMIN'` – si admin sans clinic_id voit tout |
| `server/src/routes/auth.ts` | POST (création demande) | ✅ `clinic_id` fourni par code clinique |
| `server/src/routes/auth.ts` | POST approve/reject | À vérifier – lecture par id puis update |

**Action:** Imposer `requireClinicContext` sur GET /registration-requests et refuser si pas de clinic_id (sauf SUPER_ADMIN). Vérifier approve/reject avec scope clinique.

### imaging_requests / imagerie_*

| Fichier | Méthode | Filtre clinic_id |
|---------|---------|------------------|
| `server/src/services/imagerieService.ts` | getDemandes(filters) | ✅ Si `filters.clinic_id` fourni |
| `server/src/services/imagerieService.ts` | getDemandeById(id) | ❌ Aucun – retourne toute demande par id |
| `server/src/services/imagerieService.ts` | updateDemandeStatus(id) | ❌ Aucun – met à jour par id sans vérifier clinique |
| `server/src/services/imagerieService.ts` | getExamens(filters) | ❌ `filters.clinic_id` jamais appliqué dans la requête |
| `server/src/services/imagerieService.ts` | getExamenById(id) | ❌ Aucun |

**Action:** Sur tous les “par ID”: ajouter `.eq('clinic_id', clinicId)` (ou jointure parent). Dans getExamens, appliquer `filters.clinic_id` (ex. via jointure imaging_requests.clinic_id).

### factures / paiements (backend)

| Fichier | Méthode | Filtre clinic_id |
|---------|---------|------------------|
| `server/src/controllers/paymentController.ts` | Récupération facture | À vérifier – utilise Supabase .from('factures') |

**Action:** S’assurer que tous les accès factures/paiements côté backend passent par un service qui filtre par clinicId (ex. InvoiceService/PaymentService Prisma avec where clinicId).

---

## Frontend (src)

### factures / paiements / journal_caisse

| Fichier | Méthode / usage | Filtre clinic_id |
|---------|-----------------|------------------|
| `src/services/facturationService.ts` | getFactures(filters) | ✅ Utilise getMyClinicId() et .eq('clinic_id', currentClinicId) |
| `src/services/facturationService.ts` | getFactureById(id) | ❌ Aucun – lecture directe par id |
| `src/services/facturationService.ts` | getFacturesByPatient(patientId) | ❌ Aucun |
| `src/services/facturationService.ts` | createFacture / insert factures | À vérifier – factureData doit contenir clinic_id |
| `src/services/facturationService.ts` | getPaiementsByFacture / .from('paiements') | ❌ Plusieurs requêtes paiements sans clinic_id |
| `src/services/facturationService.ts` | journal_caisse (liste/insert) | ❌ À vérifier – ajouter clinic_id |
| `src/services/consultationBillingService.ts` | .from('factures'), .from('imaging_requests') | ❌ Pas de filtre clinic_id systématique |
| `src/services/complementaryInvoiceService.ts` | .from('factures') | ❌ Pas de filtre clinic_id |
| `src/components/caisse/*` | PaiementsEnAttente, HistoriquePaiements | Dépend des services – remonter clinic_id |

**Action:** Pour toute lecture: utiliser clinicId (getMyClinicId) et .eq('clinic_id', clinicId). Pour toute écriture: injecter clinic_id. getFactureById / getFacturesByPatient doivent être scopés par clinique.

### transferts / alertes_stock

| Fichier | Méthode / usage | Filtre clinic_id |
|---------|-----------------|------------------|
| `src/services/stockService.ts` | Tous les .from('transferts') | ❌ Aucun clinic_id (insert ni select) |
| `src/services/stockService.ts` | .from('alertes_stock') | ❌ Aucun clinic_id |
| `src/services/stockService.ts` | .from('lots'), .from('mouvements_stock') | À scoper par clinique si les tables ont clinic_id |
| `src/services/notificationService.ts` | transferts, alertes_stock | ❌ À vérifier – ajouter clinic_id |
| `src/hooks/useDashboardData.ts` | alertes_stock, lots | ❌ À scoper par clinic_id |

**Action:** Ajouter clinic_id à tous les insert (transferts, alertes_stock, etc.). Filtrer toutes les lectures par clinic_id (ex. depuis getMyClinicId ou contexte).

### registration_requests (frontend)

| Fichier | Méthode | Filtre clinic_id |
|---------|---------|------------------|
| `src/services/userPermissionsService.ts` | getPendingRegistrationRequestsCount, getRegistrationRequestsStats | ✅ .eq('clinic_id', clinicId) |

---

## Synthèse des actions

1. **Backend**
   - Auth: appliquer `requireClinicContext` sur GET /registration-requests (et refuser si pas clinic_id sauf SUPER_ADMIN). Vérifier approve/reject avec scope clinique.
   - Imagerie: pour getDemandeById, getExamenById, updateDemandeStatus – ajouter contrôle possession par clinic_id. Corriger getExamens pour appliquer filters.clinic_id.
   - Paiements/Factures: s’assurer que tous les accès sont filtrés par clinicId.

2. **Frontend**
   - Facturation: getFactureById, getFacturesByPatient, toutes les requêtes paiements et journal_caisse – filtrer par clinic_id et injecter clinic_id à l’écriture.
   - Stock: transferts et alertes_stock – filtrer toutes les lectures par clinic_id et injecter clinic_id à toutes les écritures.
   - Consultation/billing/complementary: appliquer clinic_id sur factures et imaging_requests.

3. **RLS / contraintes**
   - Vérifier que les tables concernées ont RLS activé et policies basées sur get_my_clinic_id() / auth, et clinic_id NOT NULL + FK où applicable.

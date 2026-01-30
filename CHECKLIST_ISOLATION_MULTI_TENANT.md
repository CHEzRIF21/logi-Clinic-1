# Checklist isolation multi-tenant

Utilisez cette checklist pour valider manuellement l’isolation des données entre cliniques.

## Prérequis

- Au moins 2 cliniques créées (ex. A et B).
- 2 utilisateurs (non SUPER_ADMIN), un par clinique, avec des tokens distincts.

---

## 1. Données liste : B ne voit pas les données de A

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1.1 | Connexion avec utilisateur **Clinique A**. Créer 1 patient, 1 facture, 1 transfert (si module stock). | Création OK. |
| 1.2 | Connexion avec utilisateur **Clinique B**. Ouvrir la liste des patients. | Aucun patient de la clinique A visible. |
| 1.3 | Même compte B : liste des factures. | Aucune facture de la clinique A visible. |
| 1.4 | Même compte B : liste des transferts (stock). | Aucun transfert de la clinique A visible. |
| 1.5 | Même compte B : demandes d’imagerie. | Aucune demande d’imagerie de la clinique A visible. |
| 1.6 | Même compte B : demandes d’inscription (admin). | Uniquement les demandes pour la clinique B (si filtre par clinique). |

---

## 2. Accès par ID : 404/403 pour une ressource d’une autre clinique

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 2.1 | Avec **Clinique B**, appeler `GET /api/patients/:id` avec l’ID d’un patient de la clinique A. | 404 ou 403. |
| 2.2 | Avec **Clinique B**, appeler `GET /api/invoices/:id` avec l’ID d’une facture de la clinique A. | 404 ou 403. |
| 2.3 | Avec **Clinique B**, appeler `GET /api/imagerie/requests/:id` avec l’ID d’une demande d’imagerie de la clinique A. | 404 ou 403. |
| 2.4 | Avec **Clinique B**, appeler `GET /api/auth/registration-requests` puis tenter d’approuver/rejeter une demande de la clinique A (si applicable). | 403 pour approve/reject. |

---

## 3. SUPER_ADMIN

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 3.1 | Connexion **SUPER_ADMIN**. Liste des patients (toutes cliniques). | Voit les patients de A et B. |
| 3.2 | SUPER_ADMIN : accès à `GET /api/patients/:id` pour un patient de A puis de B. | 200 pour les deux. |

---

## 4. Dashboard et Caisse

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 4.1 | **Clinique B** sans aucune donnée (patients, factures, transferts). Ouvrir le tableau de bord. | Chiffres à 0 (pas de données de A). |
| 4.2 | **Clinique B** : ouvrir la caisse / journal de caisse. | Aucune facture ni paiement de la clinique A. |

---

## 5. Écriture

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 5.1 | **Clinique B** : créer un patient, une facture, un transfert. | Création OK avec `clinic_id` = B. |
| 5.2 | Vérifier en base (ou via API avec token B) que les enregistrements ont bien `clinic_id` = B. | `clinic_id` cohérent avec la clinique du token. |

---

## 6. Switch de compte (même navigateur)

Scénario : déconnexion puis connexion à une autre clinique **sans fermer le navigateur**. Vérifier que le cache frontend du `clinicId` est bien invalidé et que toutes les données affichées correspondent à la nouvelle clinique.

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 6.1 | Se connecter à une clinique A, puis se déconnecter. Se connecter à la **clinique ITA** (ou une autre clinique B) dans le même navigateur. | `getMyClinicId()` retourne le `clinicId` de la clinique ITA (cache invalidé au login). |
| 6.2 | **Clinique ITA** : ouvrir le tableau de bord. Vérifier **Demandes d'inscription**. | Uniquement les demandes pour la clinique ITA. |
| 6.3 | **Clinique ITA** : vérifier **Transferts en attente**, **Alertes actives**, **Imagerie**. | Uniquement les données de la clinique ITA. |
| 6.4 | **Clinique ITA** : vérifier le **Tableau de bord financier** (stats jour / mois / année, factures en attente, créances). | Chiffres et listes uniquement pour la clinique ITA (API `/api/statistics/dashboard` filtrée par `clinicId`). |

**Points techniques** : le frontend appelle `clearClinicCache()` au login et au logout (`App.tsx`) pour éviter d’afficher les données de l’ancienne clinique. En production, le backend ne doit pas utiliser le header `x-clinic-id` pour déterminer la clinique (uniquement `users.clinic_id` / `user_metadata.clinic_id`).

---

## Résumé

- [ ] 1. Listes : B ne voit aucune donnée de A.
- [ ] 2. Accès par ID : 404/403 pour une ressource d’une autre clinique.
- [ ] 3. SUPER_ADMIN voit toutes les cliniques.
- [ ] 4. Dashboard / caisse vides pour B quand B n’a pas de données.
- [ ] 5. Créations bien associées à la clinique du token.
- [ ] 6. Switch de compte : après logout puis login sur une autre clinique (même navigateur), toutes les cartes du dashboard affichent uniquement les données de la clinique connectée.

Si un point échoue, vérifier : middleware `requireClinicContext`, filtres `clinic_id` dans les services backend et frontend, et policies RLS (get_my_clinic_id / check_is_super_admin).

# 🧪 TESTS D'ISOLATION MULTI-TENANT

**Date** : 2026-01-30  
**Objectif** : Valider l'isolation stricte des données entre cliniques après les corrections d'audit

---

## 📋 PRÉREQUIS

- ✅ Migrations 71, 72, 73 appliquées
- ✅ Modifications backend/frontend appliquées
- ✅ Environnement de test disponible
- ✅ Accès à la base de données pour vérifications

---

## 🎯 SCÉNARIOS DE TEST

### Test 1 : Isolation Clinique A vs Clinique B

**Objectif** : Vérifier qu'un utilisateur de la Clinique A ne peut pas accéder aux données de la Clinique B.

**Préparation** :
```sql
-- Créer Clinique A
INSERT INTO clinics (id, name, code, active) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Clinique A', 'CLINIC-A', true);

-- Créer Clinique B
INSERT INTO clinics (id, name, code, active) 
VALUES ('22222222-2222-2222-2222-222222222222', 'Clinique B', 'CLINIC-B', true);

-- Créer Utilisateur A (Clinique A)
-- (via Supabase Auth + table users)
-- auth_user_id: 'aaa-aaa-aaa-aaa'
-- clinic_id: '11111111-1111-1111-1111-111111111111'

-- Créer Utilisateur B (Clinique B)
-- (via Supabase Auth + table users)
-- auth_user_id: 'bbb-bbb-bbb-bbb'
-- clinic_id: '22222222-2222-2222-2222-222222222222'

-- Créer Patient A (Clinique A)
INSERT INTO patients (id, nom, prenom, clinic_id)
VALUES ('pa-pa-pa-pa', 'Patient', 'A', '11111111-1111-1111-1111-111111111111');

-- Créer Patient B (Clinique B)
INSERT INTO patients (id, nom, prenom, clinic_id)
VALUES ('pb-pb-pb-pb', 'Patient', 'B', '22222222-2222-2222-2222-222222222222');
```

**Test** :
1. Se connecter avec Utilisateur A
2. Tenter de lire les patients via API : `GET /api/patients`
3. Vérifier que seul Patient A est retourné (pas Patient B)
4. Tenter de lire Patient B directement : `GET /api/patients/pb-pb-pb-pb`
5. Vérifier que la réponse est 404 ou 403

**Résultat attendu** :
- ✅ Utilisateur A voit uniquement Patient A
- ✅ Utilisateur A ne peut pas accéder à Patient B (404 ou 403)

**Vérification SQL** :
```sql
-- Simuler la requête RLS pour Utilisateur A
SET ROLE authenticated;
SET request.jwt.claim.sub = 'aaa-aaa-aaa-aaa';

-- Tenter de lire tous les patients
SELECT * FROM patients;
-- Doit retourner uniquement les patients avec clinic_id = '11111111-1111-1111-1111-111111111111'

-- Tenter de lire Patient B
SELECT * FROM patients WHERE id = 'pb-pb-pb-pb';
-- Doit retourner 0 lignes
```

---

### Test 2 : Utilisateur PENDING Ne Peut Pas Se Connecter

**Objectif** : Vérifier qu'un utilisateur avec `status='PENDING'` et `actif=false` ne peut pas se connecter.

**Préparation** :
```sql
-- Créer Utilisateur PENDING
-- (via Supabase Auth + table users)
-- auth_user_id: 'pending-pending-pending'
-- clinic_id: '11111111-1111-1111-1111-111111111111'
-- status: 'PENDING'
-- actif: false
```

**Test** :
1. Tenter de se connecter avec les identifiants de l'Utilisateur PENDING
2. Vérifier que la connexion est refusée
3. Vérifier le message d'erreur : "Compte inactif, en attente d'activation ou suspendu"

**Résultat attendu** :
- ✅ Connexion refusée (401 ou 403)
- ✅ Message d'erreur approprié

**Vérification SQL** :
```sql
-- Vérifier que get_my_clinic_id() retourne NULL pour utilisateur PENDING
SET ROLE authenticated;
SET request.jwt.claim.sub = 'pending-pending-pending';

SELECT get_my_clinic_id();
-- Doit retourner NULL
```

---

### Test 3 : Utilisateur Sans clinic_id Est Bloqué

**Objectif** : Vérifier qu'un utilisateur sans `clinic_id` est bloqué par le middleware `requireClinicContext`.

**Préparation** :
```sql
-- Créer Utilisateur sans clinic_id (exceptionnel, pour test uniquement)
-- (via Supabase Auth + table users)
-- auth_user_id: 'no-clinic-no-clinic'
-- clinic_id: NULL
-- status: 'ACTIVE'
-- actif: true
```

**Test** :
1. Se connecter avec l'Utilisateur sans clinic_id
2. Tenter d'accéder à une route protégée : `GET /api/patients`
3. Vérifier que la réponse est 403
4. Vérifier le message : "Contexte de clinique manquant"

**Résultat attendu** :
- ✅ Accès refusé (403)
- ✅ Message d'erreur : "Contexte de clinique manquant"

**Vérification SQL** :
```sql
-- Vérifier que get_my_clinic_id() retourne NULL
SET ROLE authenticated;
SET request.jwt.claim.sub = 'no-clinic-no-clinic';

SELECT get_my_clinic_id();
-- Doit retourner NULL
```

---

### Test 4 : Reset Password Fonctionne Correctement

**Objectif** : Vérifier que le reset password fonctionne avec session recovery obligatoire.

**Préparation** :
- Utilisateur existant avec email valide

**Test** :
1. Demander un reset password : `POST /api/auth/reset-password` (ou via ForgotPasswordDialog)
2. Vérifier qu'un email est envoyé
3. Cliquer sur le lien dans l'email
4. Vérifier que la page `/reset-password` détecte `PASSWORD_RECOVERY`
5. Changer le mot de passe
6. Vérifier que la session est fermée après succès
7. Vérifier que la redirection vers `/login` fonctionne

**Résultat attendu** :
- ✅ Email envoyé
- ✅ Page `/reset-password` détecte la session recovery
- ✅ Mot de passe changé avec succès
- ✅ Session fermée après succès
- ✅ Redirection vers `/login`

**Vérification** :
- Vérifier dans les logs que `onAuthStateChange` détecte `PASSWORD_RECOVERY`
- Vérifier que `signOut()` est appelé après `updateUser()`

---

### Test 5 : Admin de Clinique Ne Peut Pas Voir Autres Cliniques

**Objectif** : Vérifier qu'un admin de clinique ne peut voir que les utilisateurs de sa clinique.

**Préparation** :
```sql
-- Créer Admin Clinique A
-- auth_user_id: 'admin-a-admin-a'
-- clinic_id: '11111111-1111-1111-1111-111111111111'
-- role: 'CLINIC_ADMIN'
-- status: 'ACTIVE'
-- actif: true

-- Créer Utilisateur Clinique A
-- auth_user_id: 'user-a-user-a'
-- clinic_id: '11111111-1111-1111-1111-111111111111'
-- role: 'STAFF'
-- status: 'ACTIVE'
-- actif: true

-- Créer Utilisateur Clinique B
-- auth_user_id: 'user-b-user-b'
-- clinic_id: '22222222-2222-2222-2222-222222222222'
-- role: 'STAFF'
-- status: 'ACTIVE'
-- actif: true
```

**Test** :
1. Se connecter avec Admin Clinique A
2. Tenter de lire les utilisateurs : `GET /api/auth/users` (ou équivalent)
3. Vérifier que seul Utilisateur Clinique A est retourné (pas Utilisateur Clinique B)
4. Tenter de lire Utilisateur Clinique B directement
5. Vérifier que la réponse est 404 ou 403

**Résultat attendu** :
- ✅ Admin Clinique A voit uniquement Utilisateur Clinique A
- ✅ Admin Clinique A ne peut pas accéder à Utilisateur Clinique B (404 ou 403)

**Vérification SQL** :
```sql
-- Simuler la requête RLS pour Admin Clinique A
SET ROLE authenticated;
SET request.jwt.claim.sub = 'admin-a-admin-a';

-- Tenter de lire tous les utilisateurs
SELECT * FROM users;
-- Doit retourner uniquement les utilisateurs avec clinic_id = '11111111-1111-1111-1111-111111111111'

-- Tenter de lire Utilisateur Clinique B
SELECT * FROM users WHERE id = 'user-b-user-b';
-- Doit retourner 0 lignes
```

---

### Test 6 : Utilisateur Inactif Ne Peut Pas Accéder aux Données

**Objectif** : Vérifier qu'un utilisateur avec `actif=false` ne peut pas accéder aux données via RLS.

**Préparation** :
```sql
-- Créer Utilisateur Inactif
-- auth_user_id: 'inactive-inactive'
-- clinic_id: '11111111-1111-1111-1111-111111111111'
-- status: 'ACTIVE'
-- actif: false
```

**Test** :
1. Se connecter avec Utilisateur Inactif (si possible)
2. Tenter d'accéder aux données : `GET /api/patients`
3. Vérifier que la réponse est vide ou 403

**Résultat attendu** :
- ✅ `get_my_clinic_id()` retourne NULL pour utilisateur inactif
- ✅ Les policies RLS bloquent l'accès (retournent 0 lignes)

**Vérification SQL** :
```sql
-- Vérifier que get_my_clinic_id() retourne NULL
SET ROLE authenticated;
SET request.jwt.claim.sub = 'inactive-inactive';

SELECT get_my_clinic_id();
-- Doit retourner NULL

-- Tenter de lire les patients
SELECT * FROM patients;
-- Doit retourner 0 lignes (car get_my_clinic_id() retourne NULL)
```

---

## 📊 RÉSULTATS ATTENDUS

### Tableau Récapitulatif

| Test | Utilisateur | Action | Résultat Attendu | Statut |
|------|------------|--------|------------------|--------|
| 1 | Utilisateur A (Clinique A) | Lire patients | Seulement patients Clinique A | ⬜ |
| 1 | Utilisateur A (Clinique A) | Lire Patient B | 404 ou 403 | ⬜ |
| 2 | Utilisateur PENDING | Se connecter | Connexion refusée | ⬜ |
| 3 | Utilisateur sans clinic_id | Accéder route protégée | 403 | ⬜ |
| 4 | Utilisateur quelconque | Reset password | Succès avec session recovery | ⬜ |
| 5 | Admin Clinique A | Lire utilisateurs | Seulement utilisateurs Clinique A | ⬜ |
| 5 | Admin Clinique A | Lire Utilisateur Clinique B | 404 ou 403 | ⬜ |
| 6 | Utilisateur Inactif | Accéder données | 0 lignes ou 403 | ⬜ |

---

## 🔍 VÉRIFICATIONS SUPPLÉMENTAIRES

### Vérification 1 : Policies RLS Actives

```sql
-- Vérifier que RLS est activé sur les tables critiques
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'patients', 'consultations', 'registration_requests')
ORDER BY tablename;

-- Doit retourner rowsecurity = true pour toutes les tables
```

### Vérification 2 : Fonctions Helper

```sql
-- Vérifier que get_my_clinic_id() existe et est correcte
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_my_clinic_id' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Vérifier que la fonction vérifie actif=true et status
```

### Vérification 3 : Policies Users

```sql
-- Vérifier que les policies users existent
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

-- Doit retourner au moins 4 policies
```

---

## 📝 NOTES

- Tous les tests doivent être exécutés dans un environnement de test
- Ne pas exécuter ces tests en production
- Documenter les résultats de chaque test
- Signaler tout échec de test immédiatement

---

**Fin du guide de test**

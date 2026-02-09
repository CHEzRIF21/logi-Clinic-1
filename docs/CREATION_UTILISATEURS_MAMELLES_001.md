# Création des utilisateurs MAMELLES-001 (Les Mamelles de Savè)

LogiClinic utilise **Supabase Auth** et la table **`public.users`** (profil métier lié à `auth.users` via `auth_user_id`). L’isolation multi-tenant est assurée par **clinic_id** et les politiques RLS.

## Clinique cible

- **Nom :** Les Mamelles de Savè (en base : Clinique Mamelles)
- **Code :** MAMELLES-001

## Permissions par rôle (important)

Les permissions dans LogiClinic viennent de **`default_role_permissions`** et **`role_definitions`**. Le champ **`users.role`** doit contenir un **role_code** reconnu par la base (et non un libellé métier libre). Sinon, `get_user_permissions` ne trouve aucune permission par défaut et tous les staff ont le même accès.

Le script mappe automatiquement les rôles métier vers les role_code LogiClinic :

| Rôle métier (liste) | role_code en base | Permissions (ex.) |
|---------------------|-------------------|-------------------|
| imaging_tech | **imagerie** | Module Imagerie (demandes, examens, rapports) |
| lab_tech | **technicien_labo** | Module Laboratoire (demandes, résultats, validation) |
| midwife | **sage_femme** | Patients (lecture), Consultations, Maternité, Labo, Imagerie |
| nurse | **infirmier** | Patients (lecture), Consultations, Labo, Imagerie |
| pharmacist | **pharmacien** | Pharmacie, Stock médicaments |
| finance | **caissier** | Caisse (tableau de bord, tickets, factures, paiements, journal) |

## Liste des utilisateurs à créer

| # | Nom complet | Email | Rôle métier | role_code en base | Fonction |
|---|-------------|--------|-------------|-------------------|----------|
| 1 | Richy MITOKPE | richylheureux@gmail.com | imaging_tech | imagerie | Technicien imagerie |
| 2 | TOSSOU Francine | tossoufrancine1@gmail.com | imaging_tech | imagerie | Technicienne imagerie |
| 3 | SAKA Cristelle | christellesaka59@gmail.com | lab_tech | technicien_labo | Technicienne laboratoire |
| 4 | GUIDIGAN Gloria | gloriaguidigan@gmail.com | lab_tech | technicien_labo | Technicienne laboratoire |
| 5 | CHABI Isabelle | isabchabi@gmail.com | midwife | sage_femme | Sage-femme |
| 6 | MITOBABA Chabelle | chabellemitobaba@gmail.com | midwife | sage_femme | Sage-femme |
| 7 | MITOBABA Expera | *(même email que n°6)* | — | — | — |
| 8 | BALLOGOUN Tawakalitou | ballogoun.tawakalitou@mamelles.local | nurse | infirmier | Infirmier(ère) |
| 9 | BOKO Josué | bokojosue0@gmail.com | nurse | infirmier | Infirmier(ère) |
| 10 | Azongbo Bernadette | azongbob@gmail.com | nurse | infirmier | Infirmier(ère) |
| 11 | Adda Gislaine | addagislaine@gmail.com | nurse | infirmier | Infirmier(ère) |
| 12 | BACHABI Ganiratou | bachabi.ganiratou@mamelles.local | pharmacist | pharmacien | Pharmacien(ne) |
| 13 | ADETOUNDE Gildas | adeyemi.gildas@mamelles.local | finance | caissier | Finances |

**Note :** Les utilisateurs 6 et 7 (MITOBABA Chabelle et Expera) ont le même email. Supabase Auth n’accepte qu’un seul compte par email. Le script crée **un seul compte** pour Chabelle. Pour un compte séparé pour Expera, il faut utiliser un **email dédié** puis relancer le script (ou créer l’utilisateur manuellement).

## Exécution du script

**Prérequis :** dans `server/.env` :

- `SUPABASE_URL` = URL du projet Supabase  
- `SUPABASE_SERVICE_ROLE_KEY` = clé **service_role** (Dashboard > Settings > API)

**Commande :**

```bash
cd "c:\Users\Mustafa\Desktop\logi Clinic 1"
node server/scripts/create-users-mamelles-001.js
```

Le script :

1. Crée chaque utilisateur dans **Supabase Auth** (email/password, email confirmé).
2. Récupère l’ID `auth.users.id` pour chaque utilisateur.
3. Insère ou met à jour l’enregistrement dans **`public.users`** avec :
   - `auth_user_id`
   - `full_name`
   - **`role`** = role_code LogiClinic (imagerie, technicien_labo, sage_femme, infirmier, pharmacien, caissier) pour que les permissions par rôle s’appliquent
   - `fonction`
   - `clinic_id` = clinique dont le code est MAMELLES-001
   - `actif = true`, `status = 'ACTIVE'`

**Utilisateurs déjà créés avec les anciens rôles (nurse, midwife, etc.) :** relancer le script met à jour le `role` avec le bon role_code. Sinon, exécuter la migration SQL `86_FIX_MAMELLES_001_ROLE_CODES.sql` pour corriger les rôles en base.

## Sécurité et RLS

- Chaque utilisateur ne voit **que** les données dont le `clinic_id` correspond à MAMELLES-001 (`get_my_clinic_id()`).
- Aucun accès inter-clinique.
- Le super admin conserve un accès global (politique `users_super_admin_all`).
- Aucun mot de passe temporaire : les mots de passe fournis sont utilisés tels quels.
- Les politiques RLS existantes ne sont pas modifiées.

## Fichier du script

- **Script :** `server/scripts/create-users-mamelles-001.js`

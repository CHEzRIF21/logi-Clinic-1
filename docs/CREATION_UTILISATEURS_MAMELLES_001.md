# Création des utilisateurs MAMELLES-001 (Les Mamelles de Savè)

LogiClinic utilise **Supabase Auth** et la table **`public.users`** (profil métier lié à `auth.users` via `auth_user_id`). L’isolation multi-tenant est assurée par **clinic_id** et les politiques RLS.

## Clinique cible

- **Nom :** Les Mamelles de Savè (en base : Clinique Mamelles)
- **Code :** MAMELLES-001

## Liste des utilisateurs à créer

| # | Nom complet | Email | Rôle LogiClinic | Fonction |
|---|-------------|--------|-----------------|----------|
| 1 | Richy MITOKPE | richylheureux@gmail.com | imaging_tech | Technicien imagerie |
| 2 | TOSSOU Francine | tossoufrancine1@gmail.com | imaging_tech | Technicienne imagerie |
| 3 | SAKA Cristelle | christellesaka59@gmail.com | lab_tech | Technicienne laboratoire |
| 4 | GUIDIGAN Gloria | gloriaguidigan@gmail.com | lab_tech | Technicienne laboratoire |
| 5 | CHABI Isabelle | isabchabi@gmail.com | midwife | Sage-femme |
| 6 | MITOBABA Chabelle | chabellemitobaba@gmail.com | midwife | Sage-femme |
| 7 | MITOBABA Expera | *(même email que n°6)* | midwife | Sage-femme |
| 8 | BALLOGOUN Tawakalitou | ballogoun.tawakalitou@mamelles.local | nurse | Infirmier(ère) |
| 9 | BOKO Josué | bokojosue0@gmail.com | nurse | Infirmier(ère) |
| 10 | Azongbo Bernadette | azongbob@gmail.com | nurse | Infirmier(ère) |
| 11 | Adda Gislaine | addagislaine@gmail.com | nurse | Infirmier(ère) |
| 12 | BACHABI Ganiratou | bachabi.ganiratou@mamelles.local | pharmacist | Pharmacien(ne) |
| 13 | ADETOUNDE Gildas | adeyemi.gildas@mamelles.local | finance | Finances |

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
   - `role`
   - `fonction`
   - `clinic_id` = clinique dont le code est MAMELLES-001
   - `actif = true`, `status = 'ACTIVE'`

## Sécurité et RLS

- Chaque utilisateur ne voit **que** les données dont le `clinic_id` correspond à MAMELLES-001 (`get_my_clinic_id()`).
- Aucun accès inter-clinique.
- Le super admin conserve un accès global (politique `users_super_admin_all`).
- Aucun mot de passe temporaire : les mots de passe fournis sont utilisés tels quels.
- Les politiques RLS existantes ne sont pas modifiées.

## Fichier du script

- **Script :** `server/scripts/create-users-mamelles-001.js`

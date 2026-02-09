# Création utilisateur CAMPUS-001 : ALI WAGANA Islamiath

LogiClinic utilise **Supabase Auth** pour l’authentification et la table **`public.users`** (profil métier lié à `auth.users` via `auth_user_id`). L’isolation multi-tenant est assurée par **clinic_id** et les politiques RLS.

## Données utilisateur

| Champ | Valeur |
|-------|--------|
| Nom complet | ALI WAGANA Islamiath |
| Email | islamiathaliwag@gmail.com |
| Mot de passe | IslaWagana#26 |
| Rôle LogiClinic | staff_nurse |
| Fonction métier | Infirmière |
| Code clinique | CAMPUS-001 |

---

## Méthode recommandée : script Node (Auth + public.users)

1. **Prérequis**  
   Dans `server/.env` :
   - `SUPABASE_URL` = URL du projet Supabase  
   - `SUPABASE_SERVICE_ROLE_KEY` = clé **service_role** (Dashboard > Settings > API)

2. **Exécution**
   ```bash
   cd "c:\Users\Mustafa\Desktop\logi Clinic 1"
   node server/scripts/create-user-campus001-ali-wagana.js
   ```

3. **Effet du script**
   - Création de l’utilisateur dans **Supabase Auth** (email/password, email confirmé).
   - Insertion ou mise à jour dans **`public.users`** avec `auth_user_id`, `full_name`, `role = 'staff_nurse'`, `fonction = 'Infirmière'`, `clinic_id` = clinique dont le code est `CAMPUS-001`.

---

## Méthode alternative : Auth manuel + migration SQL

Si vous créez l’utilisateur Auth à la main (Dashboard > Authentication > Users) :

1. Créer l’utilisateur avec l’email `islamiathaliwag@gmail.com` et le mot de passe souhaité, puis confirmer l’email.
2. Appliquer la migration qui remplit `public.users` :
   - Fichier : `supabase_migrations/85_CREATE_USER_CAMPUS001_ALI_WAGANA.sql`
   - Via le Dashboard Supabase (SQL Editor) ou la CLI selon votre processus de déploiement.

---

## Isolation multi-tenant et RLS

- **staff_nurse** avec `clinic_id` = CAMPUS-001 :
  - `get_my_clinic_id()` renvoie l’ID de CAMPUS-001.
  - Politique **users_staff_read_colleagues** : lecture des lignes `users` où `clinic_id = get_my_clinic_id()`.
  - Politiques sur les tables métier (patients, consultations, etc.) : accès uniquement aux lignes où `clinic_id = get_my_clinic_id()`.

- **SUPER_ADMIN** :
  - Politique **users_super_admin_all** : lecture et gestion de tous les utilisateurs, toutes cliniques.

Aucune donnée d’une autre clinique n’est visible pour cet utilisateur ; l’isolation par `clinic_id` est respectée.

---

## Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `server/scripts/create-user-campus001-ali-wagana.js` | Création Auth + enregistrement dans `public.users` |
| `supabase_migrations/85_CREATE_USER_CAMPUS001_ALI_WAGANA.sql` | Insertion/mise à jour `public.users` si l’utilisateur Auth existe déjà |
| Politiques RLS (ex. `82_FIXED_RLS.sql`) | Déjà en place : isolation par clinique + accès super admin |

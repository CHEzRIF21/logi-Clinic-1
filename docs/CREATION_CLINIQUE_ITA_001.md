# Création clinique ITA-001 et utilisateurs

LogiClinic utilise **Supabase Auth** et la table **`public.users`** (profil métier lié à `auth.users` via `auth_user_id`). L’isolation multi-tenant est assurée par **clinic_id** et les politiques RLS.

## Clinique

- **Nom :** ITA  
- **Code :** ITA-001  

## Utilisateurs créés

| Nom complet   | Email                     | Rôle LogiClinic | Permissions attendues |
|---------------|---------------------------|-----------------|------------------------|
| BABONI Chérif | cbabonimamadou@gmail.com  | **admin**       | Gestion des membres, accès à tous les modules de la clinique ITA |
| Ricardo       | argh2014@gmail.com        | **medecin**     | Dossiers patients, consultations, prescriptions (pas de gestion utilisateurs) |

## Exécution du script

**Prérequis :** dans `server/.env` :

- `SUPABASE_URL` = URL du projet Supabase  
- `SUPABASE_SERVICE_ROLE_KEY` = clé **service_role** (Dashboard > Settings > API)

**Commande :**

```bash
cd "c:\Users\Mustafa\Desktop\logi Clinic 1"
node server/scripts/create-clinic-ita-001-and-users.js
```

Le script :

1. Crée ou met à jour la clinique **ITA-001** dans `clinics`.
2. Crée chaque utilisateur dans **Supabase Auth** (email/password, email confirmé).
3. Insère ou met à jour les enregistrements dans **`public.users`** avec `auth_user_id`, `full_name`, `role`, `fonction`, `clinic_id` = ITA-001.

## Sécurité et RLS

- Chaque utilisateur ne voit **que** les données dont le `clinic_id` correspond à ITA-001 (`get_my_clinic_id()`).
- Aucun accès aux autres cliniques.
- L’admin de la clinique peut gérer les utilisateurs de sa clinique (politiques `users_clinic_admin_*`).
- Le super admin conserve un accès global (politique `users_super_admin_all`).

## Fichier du script

- **Script :** `server/scripts/create-clinic-ita-001-and-users.js`

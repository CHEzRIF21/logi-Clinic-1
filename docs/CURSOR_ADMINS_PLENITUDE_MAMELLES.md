# Intégration PLENITUDE-001 et MAMELLES-001 (Cursor / Backend)

Même logique SaaS que CAMPUS-001 : création idempotente, multi-tenant safe, RLS respectée.

## 1. Ordre d’exécution

1. **Migration SQL** (Supabase)  
   Appliquer : `supabase_migrations/84_CREATE_PLENITUDE_AND_MAMELLES_CLINICS.sql`  
   → Crée ou met à jour les cliniques PLENITUDE-001 et MAMELLES-001.

2. **Script Node.js** (service role)  
   Exécuter : `node server/scripts/seed-plenitude-mamelles-admins.js`  
   → Crée les utilisateurs Auth (`createUser`, pas de changement de mot de passe forcé) et les lignes dans `public.users` (auth_user_id, clinic_id, role CLINIC_ADMIN).

## 2. Format de données (pour Cursor / Backend)

Fichier de référence : `server/scripts/data/clinics-plenitude-mamelles.json`

```json
{
  "clinics": [
    {
      "name": "Clinique Plénitude",
      "clinic_code": "PLENITUDE-001",
      "admins": [
        { "email": "laplenitude.hc@yahoo.com", "password": "TempPlenitude2026!", "role": "admin" },
        { "email": "hakpovi95@yahoo.fr", "password": "TempHakpovi2026!", "role": "admin" }
      ]
    },
    {
      "name": "Clinique Mamelles",
      "clinic_code": "MAMELLES-001",
      "admins": [
        { "email": "dieudange@gmail.com", "password": "DDMamelles2026!", "role": "admin" }
      ]
    }
  ]
}
```

- Clair, idempotent, multi-tenant safe.
- Les deux admins de PLENITUDE-001 partagent le même `clinic_id`.

## 3. Contraintes techniques

- Utiliser `supabase.auth.admin.createUser` (service role).
- Ne pas forcer le changement de mot de passe (email_confirm: true, status ACTIVE dans `users`).
- Créer la clinique si elle n’existe pas (migration 84), récupérer `clinic_id`.
- Insérer chaque admin dans `public.users` avec : `auth_user_id` = Auth user id, `clinic_id`, `role` = `CLINIC_ADMIN`.
- Ne pas dupliquer si l’email existe déjà dans Auth (idempotent).
- Respect strict des RLS multi-tenant (isolation par `clinic_id`).
- Exécution réservée au super_admin / service role.

## 4. Livrable

- **Migration** : `84_CREATE_PLENITUDE_AND_MAMELLES_CLINICS.sql`
- **Script** : `server/scripts/seed-plenitude-mamelles-admins.js`
- **Données** : `server/scripts/data/clinics-plenitude-mamelles.json`
- Résumé final : le script affiche les cliniques et admins créés ou déjà existants.

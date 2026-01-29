# 🔐 Guide : Mise à jour du mot de passe Super Admin

## Problème

L'utilisateur `arafathimorou@gmail.com` existe dans Supabase Auth, mais le mot de passe ne correspond pas au mot de passe configuré dans la table `users`.

## Solution

Il y a plusieurs façons de mettre à jour le mot de passe dans Supabase Auth :

### Option 1 : Via le Dashboard Supabase (Recommandé)

1. Allez sur **https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch**
2. Connectez-vous avec votre compte Supabase
3. Allez dans **Authentication** > **Users**
4. Recherchez l'utilisateur avec l'email `arafathimorou@gmail.com`
5. Cliquez sur l'utilisateur pour ouvrir les détails
6. Cliquez sur **Reset Password** ou **Update Password**
7. Entrez le nouveau mot de passe : `SuperAdmin2026!@#`
8. Confirmez la modification

### Option 2 : Via l'API REST Supabase

Vous pouvez utiliser curl ou Postman pour appeler l'API Supabase Admin :

```bash
curl -X PUT 'https://bnfgemmlokvetmohiqch.supabase.co/auth/v1/admin/users/aae77bb9-a10a-4783-8042-90664f3b9557' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "SuperAdmin2026!@#"
  }'
```

**⚠️ Remplacez `YOUR_SERVICE_ROLE_KEY` par votre clé service role Supabase.**

### Option 3 : Via le script Node.js

1. Assurez-vous que `SUPABASE_SERVICE_ROLE_KEY` est configuré dans votre `.env`
2. Exécutez le script :

```bash
cd server
npx ts-node scripts/update-super-admin-password.ts
```

### Option 4 : Via Edge Function Supabase

1. Déployez l'Edge Function `update-super-admin-password` :

```bash
supabase functions deploy update-super-admin-password
```

2. Appelez la fonction :

```bash
curl -X POST 'https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/update-super-admin-password' \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Identifiants de connexion

Une fois le mot de passe mis à jour, utilisez ces identifiants :

- **Email:** `arafathimorou@gmail.com`
- **Mot de passe:** `SuperAdmin2026!@#`
- **Code clinique:** N'importe quel code (le Super Admin a accès à toutes les cliniques)

## Vérification

Après avoir mis à jour le mot de passe, testez la connexion :

1. Allez sur la page de connexion
2. Entrez le code clinique (ex: `CAMPUS-001`)
3. Entrez l'email : `arafathimorou@gmail.com`
4. Entrez le mot de passe : `SuperAdmin2026!@#`
5. Cliquez sur "Se connecter"

La connexion devrait maintenant fonctionner ! ✅

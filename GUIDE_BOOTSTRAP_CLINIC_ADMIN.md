# 🚀 Guide : Déployer et Utiliser bootstrap-clinic-admin-auth

Ce guide vous explique comment déployer la fonction Edge Function `bootstrap-clinic-admin-auth` et l'utiliser pour créer/lier l'utilisateur `bagarayannick1@gmail.com` à la clinique `CAMPUS-001`.

---

## 📋 Prérequis

1. **Supabase CLI installé** :
   ```powershell
   npm install -g supabase
   ```

2. **Token d'accès Supabase** (pour déployer) :
   - Allez sur : https://supabase.com/dashboard/account/tokens
   - Créez un nouveau token si nécessaire

3. **Compte SUPER_ADMIN actif** :
   - L'utilisateur `babocher21@gmail.com` doit être SUPER_ADMIN et ACTIVE
   - Vous aurez besoin de son token d'authentification pour appeler la fonction

4. **Utilisateur dans public.users** :
   - L'utilisateur `bagarayannick1@gmail.com` doit exister dans `public.users` avec `clinic_id` = ID de CAMPUS-001
   - Si l'utilisateur n'existe pas, exécutez d'abord les migrations SQL

---

## ✅ ÉTAPE 1 : Vérifier que l'utilisateur existe dans public.users

Avant de déployer, vérifiez que l'utilisateur existe dans la base de données.

### Option A : Via Supabase Dashboard (SQL Editor)

1. Allez sur : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/editor
2. Exécutez cette requête :

```sql
SELECT 
  u.id,
  u.email,
  u.nom,
  u.prenom,
  u.role,
  u.status,
  u.clinic_id,
  u.auth_user_id,
  c.code as clinic_code,
  c.name as clinic_name
FROM users u
LEFT JOIN clinics c ON u.clinic_id = c.id
WHERE u.email = 'bagarayannick1@gmail.com';
```

**Résultat attendu :**
- ✅ 1 ligne avec `email = 'bagarayannick1@gmail.com'`
- ✅ `clinic_code = 'CAMPUS-001'`
- ✅ `role = 'CLINIC_ADMIN'` (ou NULL)
- ⚠️ `auth_user_id` peut être NULL (c'est ce qu'on va créer/lier)

### Option B : Si l'utilisateur n'existe pas

Si l'utilisateur n'existe pas, exécutez cette requête SQL :

```sql
DO $$
DECLARE
  v_clinic_id UUID;
  v_super_admin_id UUID;
BEGIN
  -- Récupérer l'ID de la clinique CAMPUS-001
  SELECT id INTO v_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CAMPUS-001 non trouvée';
  END IF;
  
  -- Récupérer l'ID du super-admin
  SELECT id INTO v_super_admin_id FROM users WHERE email = 'babocher21@gmail.com' LIMIT 1;
  
  -- Créer l'utilisateur admin clinique
  INSERT INTO users (
    email,
    nom,
    prenom,
    role,
    clinic_id,
    status,
    actif,
    created_by,
    created_at,
    updated_at
  )
  VALUES (
    'bagarayannick1@gmail.com',
    'BAGARA',
    'Sabi Yannick',
    'CLINIC_ADMIN',
    v_clinic_id,
    'PENDING',
    true,
    v_super_admin_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    clinic_id = EXCLUDED.clinic_id,
    role = 'CLINIC_ADMIN',
    status = 'PENDING',
    updated_at = NOW();
    
  RAISE NOTICE '✅ Utilisateur créé/mis à jour: bagarayannick1@gmail.com';
END $$;
```

---

## 🚀 ÉTAPE 2 : Déployer la fonction Edge Function

### 2.1. Obtenir votre token Supabase

1. Allez sur : https://supabase.com/dashboard/account/tokens
2. Cliquez sur **"Generate new token"**
3. Donnez un nom : "Logi Clinic Deployment"
4. **Copiez le token** (vous ne pourrez plus le voir après)

### 2.2. Lier le projet (si pas déjà fait)

Ouvrez PowerShell dans le dossier du projet :

```powershell
cd "c:\Users\Mustafa\Desktop\logi Clinic 1"

# Définir le token (remplacez YOUR_TOKEN par votre token)
$env:SUPABASE_ACCESS_TOKEN='sbp_5da8e97668cd218ba3095c6f1321603303f5aee3'

# Lier le projet
npx supabase link --project-ref bnfgemmlokvetmohiqch
```

### 2.3. Déployer la fonction

```powershell
npx supabase functions deploy bootstrap-clinic-admin-auth
```

**Résultat attendu :**
```
✅ Function bootstrap-clinic-admin-auth deployed successfully
✅ URL: https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/bootstrap-clinic-admin-auth
```

### 2.4. Vérifier les secrets Supabase

La fonction utilise automatiquement les variables d'environnement Supabase. Vérifiez qu'elles sont configurées :

1. Allez sur : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/settings/functions
2. Section **"Secrets"**
3. Vérifiez que ces secrets existent :
   - `SUPABASE_URL` = `https://bnfgemmlokvetmohiqch.supabase.co`
   - `SUPABASE_ANON_KEY` = (votre clé anon)
   - `SUPABASE_SERVICE_ROLE_KEY` = (votre clé service_role)

> **Note :** `SUPABASE_SERVICE_ROLE_KEY` est automatiquement disponible dans les Edge Functions, pas besoin de le configurer manuellement.

---

## 🔑 ÉTAPE 3 : Obtenir le token SUPER_ADMIN

Pour appeler la fonction, vous avez besoin du token d'authentification d'un utilisateur SUPER_ADMIN.

### Option A : Via l'application frontend

1. Connectez-vous à l'application avec `babocher21@gmail.com` (SUPER_ADMIN)
2. Ouvrez la console du navigateur (F12)
3. Dans l'onglet **Application** → **Local Storage**, cherchez le token Supabase
4. Ou utilisez cette commande dans la console :

```javascript
// Dans la console du navigateur (après connexion)
const supabase = window.supabase; // ou votre instance Supabase
const { data: { session } } = await supabase.auth.getSession();
console.log('Access Token:', session?.access_token);
```

### Option B : Via Supabase Dashboard (Auth)

1. Allez sur : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/auth/users
2. Trouvez l'utilisateur `babocher21@gmail.com`
3. Cliquez sur **"Generate recovery link"** ou utilisez l'API pour obtenir un token

### Option C : Via API (curl/PowerShell)

```powershell
# Se connecter en tant que SUPER_ADMIN
$body = @{
    email = "babocher21@gmail.com"
    password = "BABOni21"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://bnfgemmlokvetmohiqch.supabase.co/auth/v1/token?grant_type=password" `
    -Method Post `
    -Headers @{
        "Content-Type" = "application/json"
        "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8"
    } `
    -Body $body

$accessToken = $response.access_token
Write-Host "Access Token: $accessToken"
```

---

## 📞 ÉTAPE 4 : Appeler la fonction

### 4.1. Préparer les données

- **clinicCode** : `CAMPUS-001`
- **adminEmail** : `bagarayannick1@gmail.com`
- **adminPassword** : `TempClinic2024!`
- **Authorization** : `Bearer <SUPER_ADMIN_ACCESS_TOKEN>`

### 4.2. Appel via PowerShell

```powershell
# Remplacez YOUR_SUPER_ADMIN_TOKEN par le token obtenu à l'étape 3
$superAdminToken = "YOUR_SUPER_ADMIN_TOKEN"

$body = @{
    clinicCode = "CAMPUS-001"
    adminEmail = "bagarayannick1@gmail.com"
    adminPassword = "TempClinic2024!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/bootstrap-clinic-admin-auth" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer $superAdminToken"
        "Content-Type" = "application/json"
        "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8"
    } `
    -Body $body

# Afficher le résultat
$response | ConvertTo-Json -Depth 10
```

### 4.3. Appel via curl

```bash
curl -X POST "https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/bootstrap-clinic-admin-auth" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8" \
  -d '{
    "clinicCode": "CAMPUS-001",
    "adminEmail": "bagarayannick1@gmail.com",
    "adminPassword": "TempClinic2024!"
  }'
```

### 4.4. Appel via JavaScript/TypeScript

```typescript
const supabaseUrl = 'https://bnfgemmlokvetmohiqch.supabase.co';
const superAdminToken = 'YOUR_SUPER_ADMIN_TOKEN';

const response = await fetch(`${supabaseUrl}/functions/v1/bootstrap-clinic-admin-auth`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${superAdminToken}`,
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8'
  },
  body: JSON.stringify({
    clinicCode: 'CAMPUS-001',
    adminEmail: 'bagarayannick1@gmail.com',
    adminPassword: 'TempClinic2024!'
  })
});

const result = await response.json();
console.log(result);
```

---

## ✅ Résultat attendu

### Succès (200 OK)

```json
{
  "success": true,
  "message": "Clinic admin Auth user created and linked successfully.",
  "clinic": {
    "id": "uuid-de-la-clinique",
    "code": "CAMPUS-001",
    "name": "Clinique du Campus"
  },
  "user": {
    "id": "uuid-de-l-utilisateur",
    "email": "bagarayannick1@gmail.com",
    "auth_user_id": "uuid-auth-user"
  }
}
```

### Si l'utilisateur Auth existe déjà (409 Conflict)

```json
{
  "success": false,
  "error": "Failed to create Auth user (user may already exist).",
  "details": "...",
  "recoveryLink": "https://...",
  "next": "If the Auth user already exists, reset password via recovery link..."
}
```

Dans ce cas, utilisez le `recoveryLink` pour réinitialiser le mot de passe, puis vérifiez que `auth_user_id` est bien lié dans `public.users`.

### Si l'utilisateur est déjà lié (200 OK avec message)

```json
{
  "success": true,
  "message": "User already linked to Supabase Auth. Use recovery link if password needs reset.",
  "clinic": {...},
  "user": {...},
  "recoveryLink": "https://..."
}
```

---

## 🔍 ÉTAPE 5 : Vérifier le résultat

### Vérifier dans Supabase Dashboard

1. **Auth Users** : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/auth/users
   - Vérifiez que `bagarayannick1@gmail.com` existe
   - Vérifiez que l'email est confirmé

2. **Database** : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/editor
   - Exécutez cette requête :

```sql
SELECT 
  u.id,
  u.email,
  u.nom,
  u.prenom,
  u.role,
  u.status,
  u.auth_user_id,
  c.code as clinic_code,
  c.name as clinic_name
FROM users u
LEFT JOIN clinics c ON u.clinic_id = c.id
WHERE u.email = 'bagarayannick1@gmail.com';
```

**Résultat attendu :**
- ✅ `auth_user_id` n'est plus NULL
- ✅ `role = 'CLINIC_ADMIN'`
- ✅ `clinic_code = 'CAMPUS-001'`

### Tester la connexion

1. Allez sur votre application de connexion
2. Connectez-vous avec :
   - **Email** : `bagarayannick1@gmail.com`
   - **Mot de passe** : `TempClinic2024!`
   - **Code clinique** : `CAMPUS-001`

---

## 🐛 Dépannage

### Erreur : "Admin row not found in public.users for this clinic"

**Cause :** L'utilisateur n'existe pas dans `public.users` ou n'est pas lié à la bonne clinique.

**Solution :** Exécutez l'étape 1 (créer l'utilisateur dans `public.users`).

### Erreur : "Only SUPER_ADMIN can bootstrap auth users"

**Cause :** Le token utilisé n'est pas celui d'un SUPER_ADMIN.

**Solution :** Vérifiez que vous utilisez le token de `babocher21@gmail.com` et que cet utilisateur a le rôle `SUPER_ADMIN` et le statut `ACTIVE`.

### Erreur : "Clinic CAMPUS-001 not found"

**Cause :** La clinique n'existe pas ou n'est pas active.

**Solution :** Vérifiez que la clinique existe :

```sql
SELECT id, code, name, active FROM clinics WHERE code = 'CAMPUS-001';
```

### Erreur : "Failed to create Auth user (user may already exist)"

**Cause :** L'utilisateur existe déjà dans Supabase Auth.

**Solution :** Utilisez le `recoveryLink` retourné pour réinitialiser le mot de passe, puis vérifiez que `auth_user_id` est bien lié dans `public.users`.

---

## 📝 Résumé des commandes

```powershell
# 1. Déployer la fonction
$env:SUPABASE_ACCESS_TOKEN='YOUR_TOKEN'
npx supabase link --project-ref bnfgemmlokvetmohiqch
npx supabase functions deploy bootstrap-clinic-admin-auth

# 2. Appeler la fonction
$superAdminToken = "YOUR_SUPER_ADMIN_TOKEN"
$body = @{
    clinicCode = "CAMPUS-001"
    adminEmail = "bagarayannick1@gmail.com"
    adminPassword = "TempClinic2024!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/bootstrap-clinic-admin-auth" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer $superAdminToken"
        "Content-Type" = "application/json"
        "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8"
    } `
    -Body $body
```

---

## ✅ Checklist finale

- [ ] Utilisateur `bagarayannick1@gmail.com` existe dans `public.users` avec `clinic_id` = CAMPUS-001
- [ ] Fonction `bootstrap-clinic-admin-auth` déployée
- [ ] Token SUPER_ADMIN obtenu
- [ ] Fonction appelée avec succès
- [ ] `auth_user_id` lié dans `public.users`
- [ ] Connexion testée avec succès

---

**🎉 Félicitations !** L'utilisateur `bagarayannick1@gmail.com` est maintenant créé/linké à Supabase Auth et peut se connecter avec le mot de passe `TempClinic2024!`.


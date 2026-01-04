# 🔄 Guide : Réinitialisation Admin CAMPUS-001

Ce guide explique comment réinitialiser complètement l'admin de la clinique CAMPUS-001 pour permettre une nouvelle première connexion avec un code temporaire.

---

## 📋 Situation

L'admin de CAMPUS-001 (`bagarayannick1@gmail.com`) a changé son mot de passe et l'a oublié. Il faut réinitialiser le système pour qu'il puisse utiliser à nouveau un code temporaire pour la première connexion.

---

## ✅ ÉTAPES DÉJÀ EFFECTUÉES

Les opérations suivantes ont été effectuées automatiquement :

1. ✅ **Migration SQL appliquée** : `reset_campus001_admin_password`
   - Statut réinitialisé à `PENDING`
   - `first_login_at` réinitialisé à `NULL`
   - `auth_user_id` réinitialisé à `NULL`
   - `last_login` réinitialisé à `NULL`

2. ✅ **Utilisateur Auth supprimé** : L'ancien utilisateur Auth a été supprimé pour permettre une réinitialisation complète

---

## 🚀 ÉTAPE FINALE : Créer le Nouveau Mot de Passe Temporaire

Pour finaliser la réinitialisation, vous devez appeler la fonction Edge Function `bootstrap-clinic-admin-auth` qui va :
- Créer un nouvel utilisateur Auth avec un mot de passe temporaire
- Lier l'utilisateur Auth à `public.users`
- Configurer le statut `PENDING` pour forcer le changement de mot de passe

### Option 1 : Utiliser le Script PowerShell (Recommandé)

```powershell
# Exécuter le script de réinitialisation
.\reset_campus001_admin.ps1
```

Le script va :
1. Vous demander les identifiants du SUPER_ADMIN
2. Obtenir un token d'authentification
3. Appeler automatiquement `bootstrap-clinic-admin-auth` avec un nouveau mot de passe temporaire : `TempCampus2025!`

### Option 2 : Appel Manuel via PowerShell

```powershell
# 1. Obtenir le token SUPER_ADMIN
$body = @{
    email = "babocher21@gmail.com"
    password = "VOTRE_MOT_DE_PASSE_SUPER_ADMIN"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://bnfgemmlokvetmohiqch.supabase.co/auth/v1/token?grant_type=password" `
    -Method Post `
    -Headers @{
        "Content-Type" = "application/json"
        "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8"
    } `
    -Body $body

$superAdminToken = $response.access_token

# 2. Appeler bootstrap-clinic-admin-auth
$body = @{
    clinicCode = "CAMPUS-001"
    adminEmail = "bagarayannick1@gmail.com"
    adminPassword = "TempCampus2025!"
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

### Option 3 : Via cURL (Linux/Mac)

```bash
# 1. Obtenir le token SUPER_ADMIN
TOKEN_RESPONSE=$(curl -X POST "https://bnfgemmlokvetmohiqch.supabase.co/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8" \
  -d '{
    "email": "babocher21@gmail.com",
    "password": "VOTRE_MOT_DE_PASSE_SUPER_ADMIN"
  }')

SUPER_ADMIN_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

# 2. Appeler bootstrap-clinic-admin-auth
curl -X POST "https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/bootstrap-clinic-admin-auth" \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8" \
  -d '{
    "clinicCode": "CAMPUS-001",
    "adminEmail": "bagarayannick1@gmail.com",
    "adminPassword": "TempCampus2025!"
  }'
```

---

## ✅ Vérification

Après avoir exécuté l'étape finale, vérifiez que tout est correct :

```sql
SELECT 
  u.email,
  u.status,
  u.auth_user_id,
  u.first_login_at,
  c.code as clinic_code
FROM users u
LEFT JOIN clinics c ON u.clinic_id = c.id
WHERE c.code = 'CAMPUS-001' 
  AND u.role = 'CLINIC_ADMIN' 
  AND u.email = 'bagarayannick1@gmail.com';
```

**Résultat attendu :**
- ✅ `status = 'PENDING'`
- ✅ `auth_user_id` n'est plus `NULL` (doit contenir un UUID)
- ✅ `first_login_at = NULL`

---

## 🔐 Informations de Connexion

Une fois la réinitialisation terminée, l'admin peut se connecter avec :

| Champ | Valeur |
|-------|--------|
| **Code clinique** | `CAMPUS-001` |
| **Email** | `bagarayannick1@gmail.com` |
| **Mot de passe temporaire** | `TempCampus2025!` |

---

## 📋 Première Connexion

Lors de la première connexion :

1. ✅ L'admin entre le code clinique : `CAMPUS-001`
2. ✅ L'admin entre son email : `bagarayannick1@gmail.com`
3. ✅ L'admin entre le mot de passe temporaire : `TempCampus2025!`
4. ✅ Le système détecte que `status = 'PENDING'`
5. ✅ Un dialogue s'affiche automatiquement pour changer le mot de passe
6. ✅ L'admin définit un nouveau mot de passe sécurisé
7. ✅ Le statut passe à `ACTIVE` et l'admin accède au Dashboard

---

## 🐛 Dépannage

### Erreur : "User already exists in Auth"

**Solution :**
L'utilisateur Auth existe encore. Exécutez cette requête SQL pour le supprimer :

```sql
DELETE FROM auth.users
WHERE email = 'bagarayannick1@gmail.com';
```

Puis réessayez l'appel à `bootstrap-clinic-admin-auth`.

### Erreur : "Clinic CAMPUS-001 not found"

**Solution :**
Vérifiez que la clinique existe :

```sql
SELECT * FROM clinics WHERE code = 'CAMPUS-001';
```

Si elle n'existe pas, appliquez la migration `28_CREATE_CLINIC001_AND_CAMPUS001_ONLY.sql`.

### Erreur : "Admin row not found"

**Solution :**
Vérifiez que l'utilisateur admin existe :

```sql
SELECT * FROM users 
WHERE email = 'bagarayannick1@gmail.com' 
  AND role = 'CLINIC_ADMIN';
```

### Le dialogue de changement de mot de passe ne s'affiche pas

**Solution :**
1. Vérifiez que `status = 'PENDING'` dans la table `users`
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que `auth_user_id` est bien défini

---

## 📝 Résumé

**Ce qui a été fait :**
- ✅ Migration SQL appliquée pour réinitialiser l'état de l'admin
- ✅ Ancien utilisateur Auth supprimé
- ✅ Script PowerShell créé pour automatiser la finalisation

**Ce qui reste à faire :**
- ⏳ Exécuter le script `reset_campus001_admin.ps1` ou appeler manuellement `bootstrap-clinic-admin-auth`
- ⏳ L'admin peut ensuite se connecter avec le nouveau mot de passe temporaire

---

**🎉 Une fois la réinitialisation terminée, l'admin pourra se connecter avec le code temporaire et changer son mot de passe !**


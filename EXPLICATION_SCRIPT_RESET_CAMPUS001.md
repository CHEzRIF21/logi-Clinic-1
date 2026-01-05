# 📖 Explication Détaillée du Script `reset_campus001_admin.ps1`

Ce document explique en détail le fonctionnement du script PowerShell et comment récupérer le mot de passe et le token du SUPER_ADMIN.

---

## 📋 Vue d'Ensemble du Script

Le script `reset_campus001_admin.ps1` effectue **2 étapes principales** :

1. **ÉTAPE 1** : Obtenir un token d'authentification SUPER_ADMIN
2. **ÉTAPE 2** : Appeler la fonction Edge Function pour créer/réinitialiser l'utilisateur Auth de l'admin CAMPUS-001

---

## 🔍 EXPLICATION DÉTAILLÉE LIGNE PAR LIGNE

### **Lignes 8-18 : Configuration Initiale**

```powershell
Write-Host ""
Write-Host "🔄 RÉINITIALISATION ADMIN CAMPUS-001" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$supabaseUrl = "https://bnfgemmlokvetmohiqch.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
$clinicCode = "CAMPUS-001"
$adminEmail = "bagarayannick1@gmail.com"
$tempPassword = "TempCampus2025!"
```

**Explication :**
- Affiche un en-tête coloré dans la console
- Définit les variables de configuration :
  - `$supabaseUrl` : URL de votre projet Supabase
  - `$supabaseAnonKey` : Clé publique (anon) de Supabase (sécurisée, peut être partagée)
  - `$clinicCode` : Code de la clinique à réinitialiser
  - `$adminEmail` : Email de l'admin à réinitialiser
  - `$tempPassword` : Nouveau mot de passe temporaire qui sera assigné

---

### **Lignes 20-58 : ÉTAPE 1 - Obtenir le Token SUPER_ADMIN**

```powershell
# ============================================
# ÉTAPE 1 : Obtenir le Token SUPER_ADMIN
# ============================================

Write-Host "📋 ÉTAPE 1 : Obtenir le Token SUPER_ADMIN" -ForegroundColor Yellow
Write-Host ""

$superAdminEmail = Read-Host "Entrez l'email du SUPER_ADMIN (babocher21@gmail.com)"
$superAdminPassword = Read-Host "Entrez le mot de passe du SUPER_ADMIN" -AsSecureString
```

**Explication :**
- `Read-Host` : Demande à l'utilisateur de saisir l'email du SUPER_ADMIN
- `-AsSecureString` : Masque le mot de passe lors de la saisie (sécurité)

```powershell
$superAdminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($superAdminPassword)
)
```

**Explication :**
- Convertit le `SecureString` (mot de passe masqué) en texte brut pour l'envoyer à l'API
- C'est nécessaire car l'API Supabase attend le mot de passe en texte clair dans le JSON

```powershell
try {

    $loginBody = @{
        email = $superAdminEmail
        password = $superAdminPasswordPlain
    
    

    $loginResponse = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=password" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "apikey" = $supabaseAnonKey
        } `
        -Body $loginBody

    $superAdminToken = $loginResponse.access_token
    Write-Host "✅ Token SUPER_ADMIN obtenu avec succès" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Erreur lors de la connexion : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
```

**Explication :**
- **`$loginBody`** : Crée un objet JSON avec email et mot de passe
- **`Invoke-RestMethod`** : Envoie une requête HTTP POST à l'API Supabase Auth
  - **URL** : `https://bnfgemmlokvetmohiqch.supabase.co/auth/v1/token?grant_type=password`
  - **Méthode** : POST
  - **Headers** : 
    - `Content-Type: application/json` (indique qu'on envoie du JSON)
    - `apikey` : Clé publique Supabase (requise pour toutes les requêtes)
  - **Body** : JSON avec email et mot de passe
- **`$loginResponse.access_token`** : Extrait le token JWT de la réponse
- **`try/catch`** : Gère les erreurs (mauvais mot de passe, email incorrect, etc.)

**Résultat attendu :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": { ... }
}
```

---

### **Lignes 60-111 : ÉTAPE 2 - Appeler bootstrap-clinic-admin-auth**

```powershell
# ============================================
# ÉTAPE 2 : Appeler bootstrap-clinic-admin-auth
# ============================================

Write-Host "📋 ÉTAPE 2 : Créer/Réinitialiser l'utilisateur Auth" -ForegroundColor Yellow
Write-Host ""

Write-Host "Configuration :" -ForegroundColor Gray
Write-Host "  - Code clinique : $clinicCode" -ForegroundColor Gray
Write-Host "  - Email admin : $adminEmail" -ForegroundColor Gray
Write-Host "  - Mot de passe temporaire : $tempPassword" -ForegroundColor Gray
Write-Host ""

try {
    $body = @{
        clinicCode = $clinicCode
        adminEmail = $adminEmail
        adminPassword = $tempPassword
    } | ConvertTo-Json

    Write-Host "Appel de bootstrap-clinic-admin-auth..." -ForegroundColor Gray

    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/bootstrap-clinic-admin-auth" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $superAdminToken"
            "Content-Type" = "application/json"
            "apikey" = $supabaseAnonKey
        } `
        -Body $body
```

**Explication :**
- **`$body`** : Crée un objet JSON avec les paramètres nécessaires :
  - `clinicCode` : Code de la clinique (CAMPUS-001)
  - `adminEmail` : Email de l'admin à réinitialiser
  - `adminPassword` : Nouveau mot de passe temporaire
- **`Invoke-RestMethod`** : Appelle la fonction Edge Function Supabase
  - **URL** : `https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/bootstrap-clinic-admin-auth`
  - **Méthode** : POST
  - **Headers** :
    - `Authorization: Bearer $superAdminToken` : **CRUCIAL** - Authentifie la requête avec le token SUPER_ADMIN
    - `Content-Type: application/json`
    - `apikey` : Clé publique Supabase
  - **Body** : JSON avec les paramètres

**Ce que fait la fonction Edge Function :**
1. Vérifie que le token est valide et appartient à un SUPER_ADMIN
2. Vérifie que la clinique CAMPUS-001 existe
3. Vérifie que l'utilisateur admin existe dans `public.users`
4. Crée un nouvel utilisateur dans Supabase Auth (ou réinitialise le mot de passe si existe déjà)
5. Lie `auth_user_id` dans `public.users` à l'utilisateur Auth créé
6. Retourne un message de succès

```powershell
    Write-Host ""
    Write-Host "✅ Réinitialisation réussie !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Résultat :" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    Write-Host ""

    # Afficher les informations de connexion
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "📋 INFORMATIONS DE CONNEXION" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Code clinique : $clinicCode" -ForegroundColor White
    Write-Host "Email : $adminEmail" -ForegroundColor White
    Write-Host "Mot de passe temporaire : $tempPassword" -ForegroundColor White
```

**Explication :**
- Affiche le résultat de l'opération
- Affiche les informations de connexion pour l'admin

---

## 🔑 COMMENT RÉCUPÉRER LE MOT DE PASSE DU SUPER_ADMIN

Le mot de passe du SUPER_ADMIN (`babocher21@gmail.com`) a été défini lors de la création du compte dans Supabase Auth. 

**⚠️ Mots de passe possibles (selon les fichiers du projet) :**
- `BABOni21` (mentionné dans `COMMANDES_BOOTSTRAP_ADMIN.txt`)
- `SuperAdmin2024!` (mentionné dans plusieurs migrations)

**Note :** Le mot de passe peut avoir été changé depuis. Si aucun de ces mots de passe ne fonctionne, utilisez les méthodes ci-dessous pour le réinitialiser.

Voici plusieurs méthodes pour le récupérer ou le réinitialiser :

### **Méthode 1 : Via Supabase Dashboard (Recommandé)**

1. Allez sur : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/auth/users
2. Recherchez l'utilisateur `babocher21@gmail.com`
3. Cliquez sur l'utilisateur
4. Dans la section **"Password"**, vous pouvez :
   - **Voir le hash du mot de passe** (mais pas le mot de passe en clair)
   - **Réinitialiser le mot de passe** en cliquant sur "Reset Password"
   - Cela enverra un email de réinitialisation à `babocher21@gmail.com`

### **Méthode 2 : Réinitialiser le Mot de Passe via Email**

1. Allez sur : https://bnfgemmlokvetmohiqch.supabase.co/auth/v1/recover
2. Entrez l'email : `babocher21@gmail.com`
3. Cliquez sur "Send recovery email"
4. Vérifiez l'email de `babocher21@gmail.com` pour le lien de réinitialisation
5. Cliquez sur le lien et définissez un nouveau mot de passe

### **Méthode 3 : Réinitialiser via Supabase Dashboard (Admin)**

1. Allez sur : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/auth/users
2. Recherchez `babocher21@gmail.com`
3. Cliquez sur les **3 points** (menu) → **"Reset Password"**
4. Un lien de réinitialisation sera généré et envoyé par email

### **Méthode 4 : Si vous avez accès à l'application frontend**

Si vous pouvez vous connecter à l'application avec le SUPER_ADMIN, vous pouvez :
1. Vous connecter avec `babocher21@gmail.com` et votre mot de passe actuel
2. Aller dans les paramètres du profil
3. Changer le mot de passe depuis l'interface

### **Méthode 5 : Via SQL (si vous avez accès à la base de données)**

⚠️ **ATTENTION** : Cette méthode nécessite des privilèges admin et ne fonctionne que si vous avez accès direct à la base de données.

```sql
-- Vérifier si l'utilisateur existe dans Auth
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'babocher21@gmail.com';
```

**Note importante :** Supabase stocke les mots de passe sous forme de hash (bcrypt), il est **impossible** de récupérer le mot de passe en clair. Vous devez le réinitialiser.

---

## 🎫 COMMENT RÉCUPÉRER LE TOKEN SUPER_ADMIN

Le token SUPER_ADMIN est un **JWT (JSON Web Token)** qui expire après un certain temps (généralement 1 heure). Voici comment l'obtenir :

### **Méthode 1 : Via le Script PowerShell (Automatique)**

Le script `reset_campus001_admin.ps1` obtient automatiquement le token en vous demandant le mot de passe :

```powershell
.\reset_campus001_admin.ps1
```

Le script va :
1. Vous demander l'email et le mot de passe du SUPER_ADMIN
2. Appeler l'API Supabase Auth pour obtenir le token
3. Utiliser ce token automatiquement pour l'étape 2

### **Méthode 2 : Via PowerShell Manuel**

```powershell
# Configuration
$supabaseUrl = "https://bnfgemmlokvetmohiqch.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8"

# Se connecter
$body = @{
    email = "babocher21@gmail.com"
    password = "VOTRE_MOT_DE_PASSE_SUPER_ADMIN"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=password" `
    -Method Post `
    -Headers @{
        "Content-Type" = "application/json"
        "apikey" = $supabaseAnonKey
    } `
    -Body $body

# Afficher le token
$superAdminToken = $response.access_token
Write-Host "Token SUPER_ADMIN : $superAdminToken" -ForegroundColor Green
```

### **Méthode 3 : Via l'Application Frontend (Console du Navigateur)**

1. Connectez-vous à l'application avec `babocher21@gmail.com`
2. Ouvrez la console du navigateur (F12)
3. Exécutez cette commande :

```javascript
// Si vous utilisez Supabase Client
const { data: { session } } = await supabase.auth.getSession();
console.log('Access Token:', session?.access_token);

// Ou via localStorage
const supabaseSession = JSON.parse(localStorage.getItem('sb-bnfgemmlokvetmohiqch-auth-token'));
console.log('Access Token:', supabaseSession?.access_token);
```

### **Méthode 4 : Via l'API REST (cURL)**

```bash
curl -X POST "https://bnfgemmlokvetmohiqch.supabase.co/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8" \
  -d '{
    "email": "babocher21@gmail.com",
    "password": "VOTRE_MOT_DE_PASSE_SUPER_ADMIN"
  }'
```

**Réponse :**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": { ... }
}
```

### **Méthode 5 : Via Supabase Dashboard (Auth)**

1. Allez sur : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/auth/users
2. Recherchez `babocher21@gmail.com`
3. Cliquez sur l'utilisateur
4. Dans la section **"Tokens"**, vous pouvez générer un token de test (mais ce n'est pas un token de session valide)

---

## ⚠️ IMPORTANT : Sécurité des Tokens

1. **Les tokens expirent** : Généralement après 1 heure
2. **Ne partagez jamais** votre token avec d'autres personnes
3. **Ne commitez jamais** le token dans Git
4. **Utilisez des variables d'environnement** pour stocker les tokens en production

---

## 📝 Résumé

### Pour obtenir le mot de passe :
- ✅ **Réinitialiser via Supabase Dashboard** (recommandé)
- ✅ **Réinitialiser via email de récupération**
- ❌ **Impossible de récupérer le mot de passe en clair** (il est hashé)

### Pour obtenir le token :
- ✅ **Via le script PowerShell** (automatique)
- ✅ **Via PowerShell manuel** (avec email + mot de passe)
- ✅ **Via la console du navigateur** (si connecté à l'app)
- ✅ **Via l'API REST** (curl/PowerShell)

---

**🎉 Maintenant vous comprenez comment fonctionne le script et comment récupérer les identifiants nécessaires !**


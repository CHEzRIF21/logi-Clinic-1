# 🚀 Guide Étape par Étape : Réinitialisation Admin CAMPUS-001

Ce guide vous accompagne pas à pas pour réinitialiser l'admin CAMPUS-001.

---

## ✅ VÉRIFICATION PRÉALABLE

Avant de commencer, vérifions que tout est en place :

### État Actuel (Vérifié ✅)

- ✅ **Clinique CAMPUS-001** : Existe et est active
- ✅ **Admin dans public.users** : Existe avec `status = 'PENDING'` et `auth_user_id = NULL`
- ✅ **Fonction Edge Function** : `bootstrap-clinic-admin-auth` est déployée et active
- ✅ **Migration SQL** : `reset_campus001_admin_password` a été appliquée

---

## 📋 ÉTAPE 1 : Vérifier que le Script est à Jour

### 1.1. Ouvrir le Script

```powershell
# Ouvrir le script dans votre éditeur
code reset_campus001_admin.ps1
# ou
notepad reset_campus001_admin.ps1
```

### 1.2. Vérifier les Lignes Critiques

Assurez-vous que le script contient bien :

**Ligne 82-89** : Doit avoir `-ErrorAction Stop`
```powershell
$response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/bootstrap-clinic-admin-auth" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer $superAdminToken"
        "Content-Type" = "application/json"
        "apikey" = $supabaseAnonKey
    } `
    -Body $body `
    -ErrorAction Stop
```

**Ligne 113** : Doit commencer par `catch [Microsoft.PowerShell.Commands.HttpResponseException]`
```powershell
} catch [Microsoft.PowerShell.Commands.HttpResponseException] {
    # Gestion spécifique des erreurs HTTP
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorContent = $_.ErrorDetails.Message
    # ...
}
```

**❌ NE DOIT PAS CONTENIR** : `GetResponseStream()` nulle part dans le script

---

## 📋 ÉTAPE 2 : Nettoyer le Cache PowerShell (Important !)

Si vous avez déjà exécuté le script, PowerShell peut avoir mis en cache l'ancienne version.

### 2.1. Fermer Toutes les Fenêtres PowerShell

Fermez **toutes** les fenêtres PowerShell ouvertes.

### 2.2. Ouvrir une Nouvelle Fenêtre PowerShell

```powershell
# Ouvrir PowerShell en tant qu'administrateur (recommandé)
# Clic droit sur PowerShell → "Exécuter en tant qu'administrateur"
```

### 2.3. Vérifier la Version PowerShell

```powershell
$PSVersionTable.PSVersion
```

**Version recommandée** : PowerShell 7.0 ou supérieur

---

## 📋 ÉTAPE 3 : Naviguer vers le Dossier du Projet

```powershell
# Aller dans le dossier du projet
cd "C:\Users\Mustafa\Desktop\logi Clinic 1"

# Vérifier que le script existe
Test-Path reset_campus001_admin.ps1
# Doit retourner : True
```

---

## 📋 ÉTAPE 4 : Exécuter le Script

### 4.1. Lancer le Script

```powershell
.\reset_campus001_admin.ps1
```

### 4.2. Saisir les Identifiants SUPER_ADMIN

Le script va vous demander :

```
Entrez l'email du SUPER_ADMIN (babocher21@gmail.com): 
```
**Réponse** : `babocher21@gmail.com` (ou appuyez sur Entrée pour utiliser la valeur par défaut)

```
Entrez le mot de passe du SUPER_ADMIN: 
```
**Réponse** : Entrez votre mot de passe (il sera masqué pour la sécurité)

**Mots de passe possibles à essayer :**
- `BABOni21`
- `SuperAdmin2024!`

---

## 📋 ÉTAPE 5 : Analyser les Résultats

### ✅ Cas 1 : Succès

Si vous voyez :

```
✅ Token SUPER_ADMIN obtenu avec succès

📋 ÉTAPE 2 : Créer/Réinitialiser l'utilisateur Auth
...
✅ Réinitialisation réussie !

Résultat:
{
  "success": true,
  "message": "Clinic admin Auth user created and linked successfully.",
  "clinic": {
    "id": "...",
    "code": "CAMPUS-001",
    "name": "Clinique du Campus"
  },
  "user": {
    "id": "...",
    "email": "bagarayannick1@gmail.com",
    "auth_user_id": "..."
  }
}

📋 INFORMATIONS DE CONNEXION
====================================
Code clinique : CAMPUS-001
Email : bagarayannick1@gmail.com
Mot de passe temporaire : TempCampus2025!
```

**🎉 C'est réussi !** Passez à l'**ÉTAPE 6**.

---

### ❌ Cas 2 : Erreur HTTP 401 (Non authentifié)

```
❌ Erreur HTTP 401 lors de l'appel à bootstrap-clinic-admin-auth
Erreur: Unauthorized
```

**Solutions :**

1. **Vérifier le mot de passe SUPER_ADMIN**
   - Le mot de passe que vous avez entré est incorrect
   - Réessayez avec un autre mot de passe possible

2. **Réinitialiser le mot de passe SUPER_ADMIN**
   - Allez sur : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/auth/users
   - Trouvez `babocher21@gmail.com`
   - Cliquez sur "Reset Password"
   - Vérifiez l'email pour le lien de réinitialisation

---

### ❌ Cas 3 : Erreur HTTP 403 (Non autorisé)

```
❌ Erreur HTTP 403 lors de l'appel à bootstrap-clinic-admin-auth
Erreur: Only SUPER_ADMIN can bootstrap auth users
```

**Solutions :**

1. **Vérifier que l'utilisateur est bien SUPER_ADMIN**
   ```sql
   SELECT email, role, status 
   FROM users 
   WHERE email = 'babocher21@gmail.com';
   ```
   - `role` doit être `SUPER_ADMIN`
   - `status` doit être `ACTIVE`

2. **Vérifier que auth_user_id est lié**
   ```sql
   SELECT email, auth_user_id, role, status 
   FROM users 
   WHERE email = 'babocher21@gmail.com';
   ```
   - `auth_user_id` ne doit pas être `NULL`

---

### ❌ Cas 4 : Erreur HTTP 404 (Non trouvé)

```
❌ Erreur HTTP 404 lors de l'appel à bootstrap-clinic-admin-auth
Erreur: Clinic CAMPUS-001 not found
```

**Solutions :**

1. **Vérifier que la clinique existe**
   ```sql
   SELECT * FROM clinics WHERE code = 'CAMPUS-001';
   ```
   - Si aucun résultat, la clinique n'existe pas
   - Appliquez la migration `28_CREATE_CLINIC001_AND_CAMPUS001_ONLY.sql`

2. **Vérifier que la clinique est active**
   ```sql
   SELECT code, name, active FROM clinics WHERE code = 'CAMPUS-001';
   ```
   - `active` doit être `true`

---

### ❌ Cas 5 : Erreur HTTP 500 (Erreur serveur)

```
❌ Erreur HTTP 500 lors de l'appel à bootstrap-clinic-admin-auth
Erreur: Internal server error
```

**Solutions :**

1. **Vérifier les logs de la fonction Edge Function**
   - Allez sur : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/functions
   - Cliquez sur `bootstrap-clinic-admin-auth`
   - Vérifiez les logs pour voir l'erreur exacte

2. **Vérifier que l'utilisateur admin existe**
   ```sql
   SELECT * FROM users 
   WHERE email = 'bagarayannick1@gmail.com' 
     AND clinic_id = (SELECT id FROM clinics WHERE code = 'CAMPUS-001');
   ```

---

### ❌ Cas 6 : Erreur "Method invocation failed"

Si vous voyez encore :

```
Method invocation failed because [System.Net.Http.HttpResponseMessage] does not contain a method named 'GetResponseStream'.
```

**Cela signifie que :**
- Le script n'a pas été sauvegardé correctement
- Ou une ancienne version est en cache

**Solutions :**

1. **Vérifier que le script est bien sauvegardé**
   ```powershell
   # Vérifier le contenu du script
   Get-Content reset_campus001_admin.ps1 | Select-String "GetResponseStream"
   # Ne doit retourner AUCUN résultat
   ```

2. **Supprimer le cache PowerShell**
   ```powershell
   # Vider le cache des modules
   Remove-Module * -Force -ErrorAction SilentlyContinue
   ```

3. **Relancer PowerShell**
   - Fermez complètement PowerShell
   - Rouvrez une nouvelle fenêtre
   - Réessayez

---

## 📋 ÉTAPE 6 : Vérifier la Réinitialisation

Une fois le script exécuté avec succès, vérifiez que tout est correct :

### 6.1. Vérifier dans Supabase

Exécutez cette requête SQL dans Supabase Dashboard :

```sql
SELECT 
  u.email,
  u.status,
  u.auth_user_id,
  u.first_login_at,
  c.code as clinic_code,
  c.active as clinic_active
FROM users u
LEFT JOIN clinics c ON u.clinic_id = c.id
WHERE c.code = 'CAMPUS-001' 
  AND u.role = 'CLINIC_ADMIN' 
  AND u.email = 'bagarayannick1@gmail.com';
```

**Résultat attendu :**
- ✅ `status = 'PENDING'`
- ✅ `auth_user_id n'est plus NULL` (doit contenir un UUID)
- ✅ `first_login_at = NULL`
- ✅ `clinic_code = 'CAMPUS-001'`
- ✅ `clinic_active = true`

### 6.2. Vérifier dans Supabase Auth

Allez sur : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/auth/users

Recherchez `bagarayannick1@gmail.com`. L'utilisateur doit exister.

---

## 📋 ÉTAPE 7 : Tester la Connexion

### 7.1. Se Connecter à l'Application

1. Ouvrez votre application : `http://localhost:3005/login` (ou votre URL)
2. Entrez :
   - **Code clinique** : `CAMPUS-001`
   - **Email** : `bagarayannick1@gmail.com`
   - **Mot de passe** : `TempCampus2025!`

### 7.2. Vérifier le Dialogue de Changement de Mot de Passe

Si tout est correct :
- ✅ La connexion réussit
- ✅ Un dialogue s'affiche automatiquement pour changer le mot de passe
- ✅ L'admin peut définir un nouveau mot de passe

---

## 🐛 DÉPANNAGE AVANCÉ

### Problème : Le script ne se met pas à jour

**Solution :**
```powershell
# Forcer le rechargement du script
. .\reset_campus001_admin.ps1
```

### Problème : Erreur de syntaxe PowerShell

**Solution :**
```powershell
# Vérifier la syntaxe
$errors = $null
$null = [System.Management.Automation.PSParser]::Tokenize((Get-Content reset_campus001_admin.ps1 -Raw), [ref]$errors)
$errors
```

### Problème : Token SUPER_ADMIN expiré

**Solution :**
- Les tokens expirent après 1 heure
- Relancez le script pour obtenir un nouveau token

---

## 📝 Checklist Finale

- [ ] Script `reset_campus001_admin.ps1` est à jour (pas de `GetResponseStream()`)
- [ ] PowerShell a été redémarré (cache nettoyé)
- [ ] Identifiants SUPER_ADMIN sont corrects
- [ ] Fonction Edge Function est déployée
- [ ] Clinique CAMPUS-001 existe et est active
- [ ] Admin existe dans `public.users` avec `status = 'PENDING'`
- [ ] Script exécuté avec succès
- [ ] `auth_user_id` est maintenant lié (pas NULL)
- [ ] Test de connexion réussi avec le mot de passe temporaire

---

**🎉 Une fois toutes ces étapes complétées, l'admin CAMPUS-001 pourra se connecter avec le code temporaire !**


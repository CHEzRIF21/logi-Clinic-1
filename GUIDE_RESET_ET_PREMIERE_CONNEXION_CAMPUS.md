# 🚀 Guide : Réinitialisation Complète et Première Connexion CAMPUS-001

Ce guide vous explique comment réinitialiser complètement la base de données et configurer CAMPUS-001 pour une première connexion.

---

## 📋 Objectif

1. ✅ Réinitialiser toutes les données à zéro (base vierge)
2. ✅ Recréer la clinique CAMPUS-001 avec son admin
3. ✅ Configurer pour une première connexion (statut PENDING)
4. ✅ Se connecter et changer le mot de passe

---

## ⚠️ AVANT DE COMMENCER

**ATTENTION : Cette opération va supprimer TOUTES les données !**

- ✅ Toutes les données métier seront supprimées (patients, consultations, etc.)
- ✅ Toutes les cliniques seront supprimées (sauf structure)
- ✅ Tous les utilisateurs seront supprimés (sauf SUPER_ADMIN)
- ✅ Seule CAMPUS-001 sera recréée avec son admin

**Assurez-vous d'avoir fait une sauvegarde si nécessaire !**

---

## 🔧 ÉTAPE 1 : Appliquer la Migration de Réinitialisation

### Option A : Via Supabase Dashboard (Recommandé)

1. Allez sur : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/editor
2. Ouvrez le fichier `supabase_migrations/32_RESET_COMPLETE_ET_CREER_CAMPUS.sql`
3. Copiez tout le contenu
4. Collez dans le SQL Editor de Supabase
5. Cliquez sur **"Run"** ou appuyez sur `Ctrl+Enter`

**Résultat attendu :**
```
✅ Toutes les données métier supprimées
✅ Utilisateurs supprimés (sauf SUPER_ADMIN)
✅ Cliniques supprimées
✅ CAMPUS-001 créée avec son admin
✅ Mot de passe temporaire: TempCampus2025!
```

### Option B : Via Supabase CLI

```powershell
# Naviguer vers le dossier du projet
cd "c:\Users\Mustafa\Desktop\logi Clinic 1"

# Appliquer la migration
npx supabase db push
```

---

## ✅ ÉTAPE 2 : Vérifier la Création de CAMPUS-001

Exécutez cette requête dans le SQL Editor :

```sql
SELECT 
  c.id as clinic_id,
  c.code,
  c.name,
  c.active,
  u.id as admin_id,
  u.email as admin_email,
  u.nom,
  u.prenom,
  u.role,
  u.status,
  u.clinic_id as user_clinic_id
FROM clinics c
LEFT JOIN users u ON u.clinic_id = c.id AND u.role = 'CLINIC_ADMIN'
WHERE c.code = 'CAMPUS-001';
```

**Résultat attendu :**
- ✅ 1 clinique avec `code = 'CAMPUS-001'`
- ✅ 1 admin avec `email = 'bagarayannick1@gmail.com'`
- ✅ `status = 'PENDING'`
- ✅ `clinic_id` de l'admin correspond à l'ID de la clinique

---

## 🔑 ÉTAPE 3 : Créer/Lier l'Utilisateur Auth

Maintenant, il faut créer l'utilisateur dans Supabase Auth et lier `auth_user_id`.

### 3.1. Obtenir le Token SUPER_ADMIN

**Option A : Via l'application frontend**

1. Connectez-vous à l'application avec `babocher21@gmail.com` (SUPER_ADMIN)
2. Ouvrez la console du navigateur (F12)
3. Exécutez :
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Access Token:', session?.access_token);
```

**Option B : Via API (PowerShell)**

```powershell
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

$accessToken = $response.access_token
Write-Host "Access Token: $accessToken"
```

### 3.2. Appeler bootstrap-clinic-admin-auth

```powershell
# Remplacez YOUR_SUPER_ADMIN_TOKEN par le token obtenu
$superAdminToken = "YOUR_SUPER_ADMIN_TOKEN"

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

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Clinic admin Auth user created and linked successfully.",
  "clinic": {
    "id": "uuid",
    "code": "CAMPUS-001",
    "name": "Clinique du Campus"
  },
  "user": {
    "id": "uuid",
    "email": "bagarayannick1@gmail.com",
    "auth_user_id": "uuid-auth-user"
  }
}
```

### 3.3. Vérifier le Lien Auth

```sql
SELECT 
  u.id,
  u.email,
  u.auth_user_id,
  u.status,
  c.code as clinic_code
FROM users u
LEFT JOIN clinics c ON u.clinic_id = c.id
WHERE u.email = 'bagarayannick1@gmail.com';
```

**Résultat attendu :**
- ✅ `auth_user_id` n'est plus NULL
- ✅ `status = 'PENDING'`
- ✅ `clinic_code = 'CAMPUS-001'`

---

## 🔐 ÉTAPE 4 : Première Connexion

### 4.1. Se Connecter avec les Identifiants Temporaires

1. Allez sur votre page de connexion
2. Entrez :
   - **Code clinique** : `CAMPUS-001`
   - **Email** : `bagarayannick1@gmail.com`
   - **Mot de passe** : `TempCampus2025!`

### 4.2. Le Dialogue de Changement de Mot de Passe

**Ce qui va se passer :**

1. ✅ Le système valide vos identifiants
2. ✅ Il détecte que `status = 'PENDING'`
3. ✅ Il bloque l'accès au Dashboard
4. ✅ Il affiche automatiquement le dialogue **"Changer votre mot de passe"**

**Le dialogue est obligatoire et ne peut pas être fermé !**

### 4.3. Choisir un Nouveau Mot de Passe

**Exigences :**
- Minimum 8 caractères
- Au moins une majuscule
- Au moins une minuscule
- Au moins un chiffre

**Exemple de mot de passe valide :**
- `Campus2025!`
- `Yannick123!`
- `BAGARA2025!`

### 4.4. Après le Changement de Mot de Passe

**Ce qui se passe automatiquement :**

1. ✅ Le mot de passe est mis à jour dans Supabase Auth
2. ✅ Le statut passe de `PENDING` à `ACTIVE`
3. ✅ Le dialogue se ferme
4. ✅ Vous accédez au Dashboard de CAMPUS-001

**Vérification :**
```sql
SELECT 
  email,
  status,
  first_login_at,
  last_login
FROM users
WHERE email = 'bagarayannick1@gmail.com';
```

**Résultat attendu :**
- ✅ `status = 'ACTIVE'`
- ✅ `first_login_at` est défini
- ✅ `last_login` est défini

---

## ✅ ÉTAPE 5 : Vérification Finale

### 5.1. Vérifier l'État de la Base de Données

```sql
-- Vérifier les cliniques
SELECT code, name, active FROM clinics;

-- Vérifier les utilisateurs
SELECT 
  email,
  role,
  status,
  clinic_id
FROM users
ORDER BY role, email;

-- Vérifier les données métier (devrait être 0)
SELECT 
  (SELECT COUNT(*) FROM patients) as patients,
  (SELECT COUNT(*) FROM consultations) as consultations,
  (SELECT COUNT(*) FROM prescriptions) as prescriptions;
```

**Résultat attendu :**
- ✅ 1 clinique : CAMPUS-001
- ✅ 1 SUPER_ADMIN : babocher21@gmail.com
- ✅ 1 CLINIC_ADMIN : bagarayannick1@gmail.com (status ACTIVE)
- ✅ 0 patients, 0 consultations, 0 prescriptions

### 5.2. Tester l'Isolation des Données

```sql
-- Vérifier que l'admin ne voit que sa clinique
SELECT 
  c.code,
  c.name,
  COUNT(u.id) as users_count
FROM clinics c
LEFT JOIN users u ON u.clinic_id = c.id
GROUP BY c.id, c.code, c.name;
```

**Résultat attendu :**
- ✅ Seule CAMPUS-001 est visible
- ✅ 1 utilisateur (l'admin)

---

## 🎯 Résumé des Identifiants

### Après Réinitialisation

| Élément | Valeur |
|---------|--------|
| **Code clinique** | `CAMPUS-001` |
| **Email admin** | `bagarayannick1@gmail.com` |
| **Mot de passe temporaire** | `TempCampus2025!` |
| **Statut initial** | `PENDING` |
| **Statut après changement** | `ACTIVE` |

### Après Première Connexion

| Élément | Valeur |
|---------|--------|
| **Email admin** | `bagarayannick1@gmail.com` |
| **Mot de passe** | (celui que vous avez choisi) |
| **Statut** | `ACTIVE` |
| **Accès** | Dashboard CAMPUS-001 |

---

## 🐛 Dépannage

### Erreur : "Clinique CAMPUS-001 non trouvée"

**Solution :**
1. Vérifiez que la migration a été exécutée avec succès
2. Exécutez : `SELECT * FROM clinics WHERE code = 'CAMPUS-001';`

### Erreur : "Utilisateur non trouvé"

**Solution :**
1. Vérifiez que l'utilisateur existe : `SELECT * FROM users WHERE email = 'bagarayannick1@gmail.com';`
2. Vérifiez que `clinic_id` est bien défini

### Erreur : "auth_user_id est NULL"

**Solution :**
1. Vérifiez que `bootstrap-clinic-admin-auth` a été appelé avec succès
2. Vérifiez que le token SUPER_ADMIN est valide
3. Réessayez l'appel à `bootstrap-clinic-admin-auth`

### Le dialogue de changement de mot de passe ne s'affiche pas

**Solution :**
1. Vérifiez que `status = 'PENDING'` dans la table `users`
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que `validate_clinic_login` retourne bien `requires_password_change: true`

### Erreur lors du changement de mot de passe

**Solution :**
1. Vérifiez que le mot de passe respecte les exigences (8 caractères, majuscule, minuscule, chiffre)
2. Vérifiez que `auth_user_id` est bien défini
3. Vérifiez les logs dans la console du navigateur

---

## 📝 Checklist Finale

- [ ] Migration `32_RESET_COMPLETE_ET_CREER_CAMPUS.sql` appliquée
- [ ] Clinique CAMPUS-001 créée
- [ ] Admin créé avec `status = 'PENDING'`
- [ ] `bootstrap-clinic-admin-auth` appelé avec succès
- [ ] `auth_user_id` lié dans `users`
- [ ] Connexion réussie avec identifiants temporaires
- [ ] Dialogue de changement de mot de passe affiché
- [ ] Mot de passe changé avec succès
- [ ] Statut passé à `ACTIVE`
- [ ] Accès au Dashboard fonctionnel
- [ ] Base de données vierge (0 patients, 0 consultations)

---

## 🎉 Félicitations !

Votre clinique CAMPUS-001 est maintenant configurée et prête à être utilisée !

**Prochaines étapes :**
1. Commencer à ajouter des patients
2. Créer des consultations
3. Utiliser les différents modules (Pharmacie, Laboratoire, etc.)

**Tout est prêt pour une utilisation en production !** 🚀



# 🔗 Guide Simple : Lier les Admins à Supabase Auth

## 📋 Ce que vous devez faire

La migration a créé les admins dans la base de données, mais ils ne peuvent pas encore se connecter car ils ne sont pas dans Supabase Auth. Vous devez les lier.

---

## 🎯 Méthode 1 : Via Supabase Dashboard (Le Plus Simple)

### Étape 1 : Ouvrir Supabase Dashboard
1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet

### Étape 2 : Aller dans l'éditeur SQL
1. Dans le menu de gauche, cliquez sur **"SQL Editor"**
2. Cliquez sur **"New query"**

### Étape 3 : Exécuter la fonction pour chaque admin

Copiez-collez et exécutez ces requêtes **une par une** :

#### Pour l'Admin 1 de la Clinique 1 (Chantal BOKO) :
```sql
-- Créer l'utilisateur dans Supabase Auth et le lier
SELECT * FROM bootstrap_clinic_admin_auth(
  'CLIN-PLENITUDE-001',           -- Code clinique
  'laplenitude.hc@yahoo.com',     -- Email admin
  'Admin1234!'                    -- Mot de passe
);
```

#### Pour l'Admin 2 de la Clinique 1 (Hilaire AKPOVI) :
```sql
SELECT * FROM bootstrap_clinic_admin_auth(
  'CLIN-PLENITUDE-001',           -- Code clinique
  'hakpovi95@yahoo.fr',           -- Email admin
  'Admin1234!'                    -- Mot de passe
);
```

#### Pour l'Admin de la Clinique 2 (Ange Kevin Dieudonne MINHOU) :
```sql
SELECT * FROM bootstrap_clinic_admin_auth(
  'MAMELLES-001',                 -- Code clinique
  'dieudange@gmail.com',          -- Email admin
  'Admin1234!'                    -- Mot de passe
);
```

**Note** : Si la fonction `bootstrap_clinic_admin_auth` n'existe pas en SQL, utilisez la méthode 2 (Edge Function).

---

## 🎯 Méthode 2 : Via Edge Function (Recommandée)

### Étape 1 : Obtenir votre token d'accès

1. Dans Supabase Dashboard, allez dans **"Settings"** → **"API"**
2. Copiez votre **"service_role key"** (⚠️ Ne la partagez jamais publiquement !)

### Étape 2 : Utiliser Postman ou un outil similaire

#### Option A : Avec Postman (Interface graphique)

1. **Installez Postman** si vous ne l'avez pas : [https://www.postman.com/downloads/](https://www.postman.com/downloads/)

2. **Créez une nouvelle requête** :
   - Méthode : **POST**
   - URL : `https://[VOTRE_PROJECT_ID].supabase.co/functions/v1/bootstrap-clinic-admin-auth`
     - Remplacez `[VOTRE_PROJECT_ID]` par l'ID de votre projet Supabase
     - Exemple : `https://abcdefghijklmnop.supabase.co/functions/v1/bootstrap-clinic-admin-auth`

3. **Ajoutez les Headers** :
   - `Authorization` : `Bearer [VOTRE_SERVICE_ROLE_KEY]`
   - `Content-Type` : `application/json`

4. **Ajoutez le Body** (format JSON) :

   Pour l'Admin 1 (Chantal BOKO) :
   ```json
   {
     "clinicCode": "CLIN-PLENITUDE-001",
     "adminEmail": "laplenitude.hc@yahoo.com",
     "adminPassword": "Admin1234!"
   }
   ```

   Pour l'Admin 2 (Hilaire AKPOVI) :
   ```json
   {
     "clinicCode": "CLIN-PLENITUDE-001",
     "adminEmail": "hakpovi95@yahoo.fr",
     "adminPassword": "Admin1234!"
   }
   ```

   Pour l'Admin de la Clinique 2 (Ange Kevin Dieudonne MINHOU) :
   ```json
   {
     "clinicCode": "MAMELLES-001",
     "adminEmail": "dieudange@gmail.com",
     "adminPassword": "Admin1234!"
   }
   ```

5. **Cliquez sur "Send"**

#### Option B : Avec curl (Ligne de commande)

Ouvrez votre terminal (PowerShell sur Windows, Terminal sur Mac/Linux) et exécutez :

**Pour l'Admin 1 (Chantal BOKO) :**
```bash
curl -X POST https://[VOTRE_PROJECT_ID].supabase.co/functions/v1/bootstrap-clinic-admin-auth \
  -H "Authorization: Bearer [VOTRE_SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d "{\"clinicCode\":\"CLIN-PLENITUDE-001\",\"adminEmail\":\"laplenitude.hc@yahoo.com\",\"adminPassword\":\"Admin1234!\"}"
```

**Pour l'Admin 2 (Hilaire AKPOVI) :**
```bash
curl -X POST https://[VOTRE_PROJECT_ID].supabase.co/functions/v1/bootstrap-clinic-admin-auth \
  -H "Authorization: Bearer [VOTRE_SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d "{\"clinicCode\":\"CLIN-PLENITUDE-001\",\"adminEmail\":\"hakpovi95@yahoo.fr\",\"adminPassword\":\"Admin1234!\"}"
```

**Pour l'Admin de la Clinique 2 (Ange Kevin Dieudonne MINHOU) :**
```bash
curl -X POST https://[VOTRE_PROJECT_ID].supabase.co/functions/v1/bootstrap-clinic-admin-auth \
  -H "Authorization: Bearer [VOTRE_SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json" \
  -d "{\"clinicCode\":\"MAMELLES-001\",\"adminEmail\":\"dieudange@gmail.com\",\"adminPassword\":\"Admin1234!\"}"
```

**⚠️ Remplacez :**
- `[VOTRE_PROJECT_ID]` par l'ID de votre projet Supabase
- `[VOTRE_SERVICE_ROLE_KEY]` par votre service_role key

---

## ✅ Comment savoir si ça a fonctionné ?

### Réponse de succès :
```json
{
  "success": true,
  "message": "Clinic admin Auth user created and linked successfully.",
  "clinic": {
    "id": "...",
    "code": "CLIN-PLENITUDE-001",
    "name": "Clinique Santé PLENITUDE"
  },
  "user": {
    "id": "...",
    "email": "laplenitude.hc@yahoo.com",
    "auth_user_id": "..."
  }
}
```

### Vérification dans Supabase Dashboard :
1. Allez dans **"Authentication"** → **"Users"**
2. Recherchez les emails des admins
3. Si vous les voyez, c'est bon ! ✅

---

## 🔍 Où trouver les informations nécessaires ?

### 1. Votre Project ID
- Dans Supabase Dashboard → **"Settings"** → **"API"**
- C'est dans l'URL de votre projet : `https://[PROJECT_ID].supabase.co`

### 2. Votre Service Role Key
- Dans Supabase Dashboard → **"Settings"** → **"API"**
- Section **"Project API keys"**
- Copiez la **"service_role"** key (⚠️ Secret !)

---

## 📝 Résumé des Informations des Admins

### Clinique 1 : CLIN-PLENITUDE-001

| Admin | Email | Mot de passe |
|-------|-------|--------------|
| Chantal BOKO | laplenitude.hc@yahoo.com | Admin1234! |
| Hilaire AKPOVI | hakpovi95@yahoo.fr | Admin1234! |

### Clinique 2 : MAMELLES-001

| Admin | Email | Mot de passe |
|-------|-------|--------------|
| Ange Kevin Dieudonne MINHOU | dieudange@gmail.com | Admin1234! |

---

## ⚠️ Problèmes courants

### Erreur : "Unauthorized"
- Vérifiez que vous utilisez la **service_role key** (pas l'anon key)
- Vérifiez que le header Authorization est bien formaté : `Bearer [KEY]`

### Erreur : "User already exists"
- L'utilisateur existe déjà dans Supabase Auth
- C'est OK, la fonction devrait quand même le lier
- Vérifiez dans "Authentication" → "Users"

### Erreur : "Clinic not found"
- Vérifiez que la migration a bien été exécutée
- Vérifiez que le code clinique est correct (respectez la casse)

---

## 🎉 Après avoir lié les admins

Une fois tous les admins liés, ils pourront :
1. Se connecter avec leur **code clinique**, **email** et **mot de passe**
2. Le système les forcera à changer leur mot de passe à la première connexion
3. Leur statut passera de `PENDING` à `ACTIVE`

---

**Besoin d'aide ?** Vérifiez d'abord que la migration a bien créé les admins dans la table `users`, puis suivez ce guide étape par étape.

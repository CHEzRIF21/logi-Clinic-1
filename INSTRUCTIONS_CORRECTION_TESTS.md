# 🔧 Instructions de Correction - Tests Backend et Configuration

## ✅ Corrections Effectuées

### 1. Tests Corrigés (10 fichiers)
Les tests suivants ont été corrigés automatiquement :
- ✅ TC001_verify_complete_maternity_module_workflow.py
- ✅ TC002_validate_automatic_medical_calculations.py
- ✅ TC003_test_real_time_alerts_postpartum_complications.py
- ✅ TC004_check_role_based_access_control_and_journalization.py
- ✅ TC005_test_responsive_ui_and_real_time_validation.py
- ✅ TC006_verify_integration_with_other_clinic_modules.py
- ✅ TC007_validate_data_migration_and_demo_data_presence.py
- ✅ TC008_test_report_generation_and_export_functions.py
- ✅ TC009_check_security_and_data_privacy_compliance.py
- ✅ TC010_validate_documentation_completeness_and_usability.py

**Corrections appliquées :**
- ✅ Endpoint d'authentification : `/auth/login` → `/api/auth/login`
- ✅ Mot de passe super-admin : `superadminpassword` → `SuperAdmin2024!`
- ✅ Mot de passe admin clinique : `clinicadminpassword` → `TempClinic2024!`
- ✅ Format de réponse token : `access_token` → `token`

### 2. Script SQL de Correction Créé
Un script SQL a été créé pour corriger la base de données :
- 📄 `supabase_migrations/05_FIX_USERS_AND_CLINIC_CAMPUS.sql`

---

## 🚀 Étapes à Suivre

### ÉTAPE 1 : Exécuter le Script SQL dans Supabase

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://app.supabase.com
   - Sélectionner le projet : `bnfgemmlokvetmohiqch`

2. **Ouvrir SQL Editor**
   - Cliquer sur "SQL Editor" dans le menu de gauche

3. **Exécuter le Script**
   - Ouvrir le fichier : `supabase_migrations/05_FIX_USERS_AND_CLINIC_CAMPUS.sql`
   - Copier tout le contenu
   - Coller dans l'éditeur SQL de Supabase
   - Cliquer sur "Run" ou appuyer sur `Ctrl+Enter`

4. **Vérifier les Résultats**
   - Le script devrait afficher :
     - ✅ Clinique CAMPUS-001 créée/vérifiée
     - ✅ Super-Admin créé/mis à jour
     - ✅ Admin clinique créé/mis à jour
     - ✅ Vérification finale avec les liens

### ÉTAPE 2 : Vérifier la Configuration du Serveur

1. **Vérifier le fichier `.env`**
   - Le fichier `server/.env` doit contenir :
     ```env
     SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
     SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

2. **Vérifier que le serveur est démarré**
   ```bash
   cd server
   npm run dev
   ```

### ÉTAPE 3 : Tester l'Authentification Manuellement

Testez l'authentification avec curl ou Postman :

**Super-Admin :**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"babocher21@gmail.com","password":"SuperAdmin2024!"}'
```

**Admin Clinique :**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bagarayannick1@gmail.com","password":"TempClinic2024!"}'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "user": {
    "id": "...",
    "email": "...",
    "role": "..."
  },
  "token": "..."
}
```

### ÉTAPE 4 : Relancer les Tests TestSprite

Une fois que tout est configuré :

1. **Vérifier que le serveur est en cours d'exécution**
   ```bash
   # Dans un terminal
   cd server
   npm run dev
   ```

2. **Relancer les tests TestSprite**
   ```bash
   # Dans un autre terminal
   cd "C:\Users\Mustafa\Desktop\logi Clinic 1"
   node "C:\Users\Mustafa\AppData\Local\npm-cache\_npx\8ddf6bea01b2519d\node_modules\@testsprite\testsprite-mcp\dist\index.js" generateCodeAndExecute
   ```

---

## 📋 Informations de Connexion

### Super-Admin
- **Email** : `babocher21@gmail.com`
- **Mot de passe** : `SuperAdmin2024!`
- **Rôle** : `SUPER_ADMIN`
- **Status** : `ACTIVE`

### Admin Clinique (CAMPUS-001)
- **Email** : `bagarayannick1@gmail.com`
- **Mot de passe** : `TempClinic2024!`
- **Rôle** : `CLINIC_ADMIN`
- **Status** : `PENDING` (doit changer le mot de passe au premier login)
- **Clinique** : `CAMPUS-001`

---

## 🔍 Vérifications Post-Correction

### Vérifier la Clinique
```sql
SELECT * FROM clinics WHERE code = 'CAMPUS-001';
```

### Vérifier les Utilisateurs
```sql
SELECT 
  email, 
  nom, 
  prenom, 
  role, 
  status, 
  actif,
  clinic_id
FROM users 
WHERE email IN ('babocher21@gmail.com', 'bagarayannick1@gmail.com');
```

### Vérifier les Liens
```sql
SELECT 
  c.code as clinic_code,
  u.email,
  u.role,
  CASE 
    WHEN u.clinic_id = c.id THEN '✅ Lié'
    ELSE '❌ Non lié'
  END as link_status
FROM clinics c
LEFT JOIN users u ON u.clinic_id = c.id
WHERE c.code = 'CAMPUS-001';
```

---

## ⚠️ Notes Importantes

1. **Mots de passe temporaires** : Changez les mots de passe en production !
2. **RLS (Row Level Security)** : Le script SQL doit être exécuté avec les permissions appropriées
3. **Hash de mot de passe** : Le système utilise SHA256 avec le salt `logi_clinic_salt`
4. **Endpoint API** : Tous les endpoints commencent par `/api/`

---

## 🆘 En Cas de Problème

### Erreur "Row Level Security policy"
- Le script SQL doit être exécuté dans Supabase SQL Editor (qui a les permissions nécessaires)
- Vérifiez que vous êtes connecté avec un compte ayant les droits d'administration

### Erreur "User not found"
- Vérifiez que le script SQL a bien été exécuté
- Vérifiez que les utilisateurs existent dans la table `users`

### Erreur "Clinic not found"
- Vérifiez que la clinique CAMPUS-001 existe dans la table `clinics`
- Exécutez le script SQL de correction

### Erreur d'authentification (401)
- Vérifiez que le `password_hash` dans la base correspond au hash généré
- Le hash est : `SHA256(password + 'logi_clinic_salt')`

---

## ✅ Checklist Finale

- [ ] Script SQL exécuté dans Supabase
- [ ] Clinique CAMPUS-001 créée/vérifiée
- [ ] Super-Admin créé avec le bon password_hash
- [ ] Admin clinique créé et lié à CAMPUS-001
- [ ] Serveur backend démarré sur le port 3000
- [ ] Test d'authentification manuel réussi
- [ ] Tests TestSprite corrigés (10 fichiers)
- [ ] Prêt à relancer les tests

---

**Date de création** : 2025-12-23  
**Dernière mise à jour** : 2025-12-23


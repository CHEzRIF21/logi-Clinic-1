# 📋 INFORMATIONS DE PREMIÈRE CONNEXION - CAMPUS-001

## ✅ ÉTAT ACTUEL

- **Clinique créée** : ✅ Oui (CAMPUS-001)
- **Admin créé** : ✅ Oui (Sabi Yannick BAGARA)
- **Base de données** : ✅ Vierge et prête
- **Compte Auth** : ⚠️ À créer via le script PowerShell

---

## 🔐 IDENTIFIANTS DE PREMIÈRE CONNEXION

### Admin de la Clinique du Campus

```
Code clinique : CAMPUS-001
Email : bagarayannick1@gmail.com
Mot de passe temporaire : TempCampus2025!
```

**⚠️ IMPORTANT** :
- L'admin devra changer son mot de passe à la première connexion
- Le statut est actuellement `PENDING`
- Le dialogue de changement de mot de passe s'affichera automatiquement

---

## 📝 ÉTAPES POUR CRÉER L'ADMIN

### Option 1 : Via le script PowerShell (Recommandé)

1. Ouvrir PowerShell en tant qu'administrateur
2. Naviguer vers le dossier du projet :
   ```powershell
   cd "C:\Users\Mustafa\Desktop\logi Clinic 1"
   ```
3. Exécuter le script :
   ```powershell
   .\reset_campus001_admin.ps1
   ```
4. Entrer les identifiants du SUPER_ADMIN :
   - Email : `babocher21@gmail.com`
   - Mot de passe : (celui que vous avez défini)

### Option 2 : Via Supabase Dashboard

1. Aller dans **Supabase Dashboard** > **Authentication** > **Users**
2. Cliquer sur **Add User** > **Create new user**
3. Remplir :
   - Email : `bagarayannick1@gmail.com`
   - Password : `TempCampus2025!`
   - Auto Confirm User : ✅ Activé
4. Dans **Supabase Dashboard** > **SQL Editor**, exécuter :
   ```sql
   UPDATE users 
   SET auth_user_id = '<UUID_DU_COMPTE_AUTH_CREE>'
   WHERE email = 'bagarayannick1@gmail.com'
     AND clinic_id = (SELECT id FROM clinics WHERE code = 'CAMPUS-001');
   ```

---

## 🔄 WORKFLOW D'INSCRIPTION DES MEMBRES DU STAFF

### 1. Inscription d'un nouveau membre

Un membre du staff peut s'inscrire en :
1. Accédant à la page d'inscription
2. Remplissant le formulaire avec :
   - Code clinique : `CAMPUS-001`
   - Ses informations personnelles
   - Le rôle souhaité
3. La demande est créée dans `registration_requests` avec `statut = 'pending'`

### 2. Validation par l'admin

L'admin de la clinique peut valider les demandes en :
1. Se connectant à son compte admin
2. Allant dans **Gestion du Staff** > **Demandes**
3. Cliquant sur **Approuver** pour chaque demande
4. Le système crée automatiquement :
   - Le compte Supabase Auth
   - L'utilisateur dans la table `users`
   - Un lien de réinitialisation de mot de passe

### 3. Première connexion du membre

Le membre validé peut :
1. Recevoir un email avec le lien de réinitialisation (si configuré)
2. Se connecter avec son email et le mot de passe temporaire
3. Changer son mot de passe à la première connexion
4. Accéder à l'application avec son rôle assigné

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Système d'approbation corrigé

Le système d'approbation dans `server/src/routes/auth.ts` a été corrigé pour :
- ✅ Créer automatiquement le compte Supabase Auth
- ✅ Générer un mot de passe temporaire sécurisé
- ✅ Lier le compte Auth à l'utilisateur dans `public.users`
- ✅ Générer un lien de réinitialisation de mot de passe
- ✅ Gérer les erreurs avec rollback si nécessaire

### 2. Base de données préparée

- ✅ La clinique CAMPUS-001 est active
- ✅ L'admin est en statut `PENDING` (prêt pour première connexion)
- ✅ Aucune donnée existante (base vierge)
- ✅ Les RLS policies sont configurées

---

## 🆘 EN CAS DE PROBLÈME

### L'admin ne peut pas se connecter

1. Vérifier que le compte Auth existe dans **Supabase Dashboard** > **Authentication** > **Users**
2. Vérifier que `auth_user_id` dans `users` correspond à l'UUID dans `auth.users`
3. Vérifier que le statut est `PENDING` (pas `ACTIVE`)

### Les membres ne peuvent pas s'inscrire

1. Vérifier que le code clinique `CAMPUS-001` est correct
2. Vérifier que la clinique est active (`active = true`)
3. Vérifier les RLS policies sur `registration_requests`

### L'admin ne peut pas valider les demandes

1. Vérifier que l'admin est bien `CLINIC_ADMIN` ou `SUPER_ADMIN`
2. Vérifier que le statut de l'admin est `ACTIVE` (après première connexion)
3. Vérifier que les routes backend sont accessibles

---

## 📞 SUPPORT

Pour toute question ou problème, vérifier :
1. Les logs Supabase dans **Dashboard** > **Logs**
2. Les logs du serveur backend
3. Les erreurs dans la console du navigateur

---

**Date de création** : $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Dernière mise à jour** : $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")


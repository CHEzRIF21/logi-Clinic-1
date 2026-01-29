# 🔐 IDENTIFIANTS DE CONNEXION - SUPER ADMIN

## 👤 Utilisateur Super Administrateur

**Date de configuration:** 29 janvier 2026

---

## 📋 INFORMATIONS DE CONNEXION

### Email
```
arafathimorou@gmail.com
```

### Mot de passe
```
SuperAdmin2026!@#
```

---

## 📊 INFORMATIONS UTILISATEUR

| Champ | Valeur |
|-------|--------|
| **ID Utilisateur** | `e5d1b516-b493-46fb-ab88-4e969d8b6020` |
| **Auth User ID** | `aae77bb9-a10a-4783-8042-90664f3b9557` |
| **Email** | `arafathimorou@gmail.com` |
| **Nom** | Arafat |
| **Prénom** | Morou |
| **Rôle** | `SUPER_ADMIN` |
| **Statut** | `ACTIVE` |
| **Actif** | `true` |
| **Clinic ID** | `NULL` (accès à toutes les cliniques) |

---

## 🎯 PRIVILÈGES DU SUPER ADMIN

Le Super Admin a les privilèges suivants :

✅ **Accès à toutes les cliniques**
- Peut voir et gérer toutes les cliniques du système
- N'a pas besoin de code clinique pour se connecter
- Peut créer de nouvelles cliniques

✅ **Accès à tous les modules**
- Dashboard complet
- Gestion des patients (toutes les cliniques)
- Consultations (toutes les cliniques)
- Pharmacie
- Laboratoire
- Imagerie
- Caisse
- Utilisateurs et permissions
- Tous les autres modules du système

✅ **Permissions administratives**
- Créer et gérer des cliniques
- Créer et gérer des utilisateurs
- Modifier les permissions
- Accéder à tous les rapports et statistiques
- Gérer la configuration système

---

## ⚠️ PROBLÈME DE CONNEXION ET SOLUTION

### 🔴 Problème détecté

L'utilisateur existe dans Supabase Auth, mais le mot de passe dans Supabase Auth ne correspond pas au mot de passe configuré. Cela cause l'erreur : `❌ Supabase Auth: Identifiants invalides (400)`

### ✅ Solution : Mettre à jour le mot de passe dans Supabase Auth

**Option 1 : Via le Dashboard Supabase (Recommandé)**

1. Allez sur **https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch**
2. Connectez-vous avec votre compte Supabase
3. Allez dans **Authentication** > **Users**
4. Recherchez l'utilisateur avec l'email `arafathimorou@gmail.com`
5. Cliquez sur l'utilisateur pour ouvrir les détails
6. Cliquez sur **Reset Password** ou **Update Password**
7. Entrez le nouveau mot de passe : `SuperAdmin2026!@#`
8. Confirmez la modification

**Option 2 : Via l'API REST**

```bash
curl -X PUT 'https://bnfgemmlokvetmohiqch.supabase.co/auth/v1/admin/users/aae77bb9-a10a-4783-8042-90664f3b9557' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"password": "SuperAdmin2026!@#"}'
```

**⚠️ Remplacez `YOUR_SERVICE_ROLE_KEY` par votre clé service role Supabase.**

Voir le guide complet : `GUIDE_MISE_A_JOUR_MOT_DE_PASSE_SUPER_ADMIN.md`

---

## ⚠️ NOTES IMPORTANTES

1. **Sécurité du mot de passe**
   - Le mot de passe fourni est un mot de passe temporaire
   - **Il est fortement recommandé de changer le mot de passe après la première connexion**
   - Utilisez un mot de passe fort et unique

2. **Connexion**
   - Le Super Admin peut se connecter avec n'importe quel code clinique (ex: `CAMPUS-001`)
   - Le système reconnaîtra automatiquement le Super Admin et lui donnera accès à toutes les cliniques

3. **Accès global**
   - Le Super Admin a accès à **TOUTES** les cliniques
   - Il peut voir et modifier toutes les données du système
   - Utilisez ces privilèges avec précaution

4. **Gestion des utilisateurs**
   - Le Super Admin peut créer d'autres Super Admins si nécessaire
   - Il peut créer des admins de clinique
   - Il peut gérer tous les utilisateurs du système

---

## 🔧 VÉRIFICATION DE LA CONFIGURATION

La configuration a été vérifiée et confirmée :

✅ Rôle `SUPER_ADMIN` créé dans `role_definitions` avec `is_admin = true`
✅ Utilisateur créé avec le rôle `SUPER_ADMIN`
✅ `clinic_id` est `NULL` (accès à toutes les cliniques)
✅ Statut `ACTIVE` et `actif = true`
✅ `auth_user_id` correctement lié : `aae77bb9-a10a-4783-8042-90664f3b9557`
✅ Utilisateur existe dans Supabase Auth (auth.users)

⚠️ **ACTION REQUISE** : Mettre à jour le mot de passe dans Supabase Auth (voir section "Problème de connexion" ci-dessus)

---

## 📝 MIGRATION APPLIQUÉE

La migration `56_CREATE_SUPER_ADMIN_ARAFATHIMOROU.sql` a été appliquée avec succès.

---

**⚠️ CONSERVEZ CE DOCUMENT EN LIEU SÛR ET NE PARTAGEZ PAS LES IDENTIFIANTS !**

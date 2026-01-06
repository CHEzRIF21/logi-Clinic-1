# 🔐 INFORMATIONS DE CONNEXION - CAMPUS-001 (FINAL)

## ✅ ADMIN CRÉÉ ET CONFIGURÉ

L'admin de la clinique CAMPUS-001 a été créé et lié correctement à Supabase Auth.

---

## 🔑 IDENTIFIANTS DE CONNEXION

```
Code clinique : CAMPUS-001
Email : bagarayannick1@gmail.com
Mot de passe : YANcampus2
```

**⚠️ IMPORTANT** :
- Le compte Auth a été créé manuellement dans Supabase Dashboard
- Le compte est maintenant lié à la table `users` via `auth_user_id`
- Le statut est `PENDING` (l'admin devra changer son mot de passe à la première connexion)
- Le dialogue de changement de mot de passe s'affichera automatiquement

---

## ✅ ÉTAT ACTUEL

- ✅ **Clinique** : CAMPUS-001 (Clinique du Campus) - Active
- ✅ **Admin** : BAGARA Sabi Yannick
- ✅ **Compte Auth** : Créé et lié (UUID: `52e7ce29-cfbf-46e1-b3f6-a56815051635`)
- ✅ **Lien auth_user_id** : ✅ Configuré
- ✅ **Base de données** : Vierge et prête

---

## 🔄 PREMIÈRE CONNEXION

### Étapes :

1. **Accéder à la page de connexion**
   - Entrer le code clinique : `CAMPUS-001`
   - Cliquer sur "Vérifier"

2. **Se connecter**
   - Email : `bagarayannick1@gmail.com`
   - Mot de passe : `YANcampus2`

3. **Changer le mot de passe**
   - Un dialogue s'affichera automatiquement
   - Entrer un nouveau mot de passe sécurisé
   - Le statut passera à `ACTIVE` après le changement

---

## 🆘 EN CAS DE PROBLÈME

### Erreur 400 lors de la connexion

Si vous obtenez une erreur 400, vérifiez :

1. **Le mot de passe est correct** : `YANcampus2`
2. **Le compte Auth existe** : Vérifier dans Supabase Dashboard > Authentication > Users
3. **Le lien auth_user_id est correct** : Vérifier que `auth_user_id` dans `users` correspond à l'UUID dans `auth.users`

### Vérification SQL

```sql
-- Vérifier le lien
SELECT 
  u.id,
  u.email,
  u.auth_user_id,
  au.id as auth_id,
  au.email as auth_email
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.email = 'bagarayannick1@gmail.com';
```

### Réinitialiser le mot de passe

Si le mot de passe ne fonctionne pas :

1. Aller dans **Supabase Dashboard** > **Authentication** > **Users**
2. Trouver l'utilisateur `bagarayannick1@gmail.com`
3. Cliquer sur **Reset Password**
4. Un email sera envoyé avec un lien de réinitialisation

---

## 📋 INFORMATIONS TECHNIQUES

- **User ID (public.users)** : `890abc63-5cb6-4add-8ccf-a7e9f9cc36e8`
- **Auth User ID (auth.users)** : `52e7ce29-cfbf-46e1-b3f6-a56815051635`
- **Clinic ID** : `32ea9319-496f-475f-859d-6e678435bf18`
- **Rôle** : `CLINIC_ADMIN`
- **Statut** : `PENDING`

---

## ✅ VÉRIFICATIONS EFFECTUÉES

- ✅ Compte Auth créé dans Supabase
- ✅ Lien `auth_user_id` configuré dans `users`
- ✅ Clinique active et configurée
- ✅ Base de données vierge et prête
- ✅ RLS policies configurées

---

**Date de création** : 2026-01-05
**Dernière mise à jour** : 2026-01-05
**Statut** : ✅ Prêt pour première connexion



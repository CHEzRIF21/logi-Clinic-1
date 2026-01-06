# 🚀 GUIDE DE CONNEXION - CAMPUS-001

## ✅ CONFIGURATION COMPLÈTE

L'admin de la clinique CAMPUS-001 est maintenant **entièrement configuré et prêt pour la connexion**.

---

## 🔑 IDENTIFIANTS DE CONNEXION

```
┌─────────────────────────────────────────┐
│  Code clinique : CAMPUS-001             │
│  Email : bagarayannick1@gmail.com       │
│  Mot de passe : YANcampus2              │
└─────────────────────────────────────────┘
```

---

## 📋 ÉTAPES DE CONNEXION

### 1. Accéder à la page de connexion

1. Ouvrir l'application dans votre navigateur
2. Sur la page de connexion, vous verrez un champ pour le **Code clinique**

### 2. Entrer le code clinique

- Entrer : `CAMPUS-001`
- Cliquer sur **"Vérifier"** ou **"Continuer"**

### 3. Se connecter

- **Email** : `bagarayannick1@gmail.com`
- **Mot de passe** : `YANcampus2`
- Cliquer sur **"Se connecter"**

### 4. Changer le mot de passe (Première connexion)

- Un dialogue s'affichera automatiquement pour changer le mot de passe
- Entrer un **nouveau mot de passe sécurisé**
- Confirmer le nouveau mot de passe
- Après le changement, le statut passera à `ACTIVE`

---

## ✅ VÉRIFICATIONS EFFECTUÉES

- ✅ Compte Auth créé dans Supabase (`52e7ce29-cfbf-46e1-b3f6-a56815051635`)
- ✅ Lien `auth_user_id` configuré dans la table `users`
- ✅ Clinique CAMPUS-001 active et configurée
- ✅ Admin en statut `PENDING` (prêt pour première connexion)
- ✅ Base de données vierge et prête

---

## 🔍 INFORMATIONS TECHNIQUES

| Élément | Valeur |
|---------|--------|
| **User ID** | `890abc63-5cb6-4add-8ccf-a7e9f9cc36e8` |
| **Auth User ID** | `52e7ce29-cfbf-46e1-b3f6-a56815051635` |
| **Clinic ID** | `32ea9319-496f-475f-859d-6e678435bf18` |
| **Clinic Code** | `CAMPUS-001` |
| **Clinic Name** | `Clinique du Campus` |
| **Rôle** | `CLINIC_ADMIN` |
| **Statut** | `PENDING` |

---

## 🆘 RÉSOLUTION DE PROBLÈMES

### Erreur 400 lors de la connexion

**Cause possible** : Le mot de passe ne correspond pas

**Solution** :
1. Vérifier que le mot de passe est exactement : `YANcampus2` (sensible à la casse)
2. Si le problème persiste, réinitialiser le mot de passe via Supabase Dashboard :
   - Aller dans **Authentication** > **Users**
   - Trouver `bagarayannick1@gmail.com`
   - Cliquer sur **Reset Password**

### "Supabase Auth échoué, recherche dans la table users"

**Cause** : Le compte Auth n'est pas trouvé ou le mot de passe est incorrect

**Solution** :
1. Vérifier que le compte Auth existe dans Supabase Dashboard
2. Vérifier que `auth_user_id` est correctement lié (déjà fait ✅)
3. Réessayer avec le mot de passe : `YANcampus2`

### Le dialogue de changement de mot de passe ne s'affiche pas

**Cause** : Le statut n'est pas `PENDING`

**Solution** :
```sql
-- Vérifier le statut
SELECT status FROM users WHERE email = 'bagarayannick1@gmail.com';

-- Si nécessaire, remettre en PENDING
UPDATE users 
SET status = 'PENDING', first_login_at = NULL
WHERE email = 'bagarayannick1@gmail.com';
```

---

## 📝 NOTES IMPORTANTES

1. **Première connexion** : Le mot de passe doit être changé
2. **Statut PENDING** : Normal pour la première connexion
3. **Base vierge** : Aucune donnée existante, c'est normal
4. **Validation des membres** : L'admin peut maintenant valider les demandes d'inscription

---

## ✅ TOUT EST PRÊT !

L'admin peut maintenant se connecter avec les identifiants fournis. Après la première connexion et le changement de mot de passe, le statut passera à `ACTIVE` et l'admin pourra commencer à utiliser l'application.

---

**Date** : 2026-01-05
**Statut** : ✅ Configuration complète et fonctionnelle



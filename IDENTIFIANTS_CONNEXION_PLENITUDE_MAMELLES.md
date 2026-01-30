# 🔐 IDENTIFIANTS DE CONNEXION - PLENITUDE-001 ET MAMELLES-001

> **📋 Document de référence pour les identifiants de connexion après réinitialisation**

## ✅ MIGRATION ET RÉINITIALISATION TERMINÉES

Les opérations suivantes ont été effectuées :
- ✅ Code clinique changé : `CLIN-PLENITUDE-001` → `PLENITUDE-001`
- ✅ Réinitialisation des accès pour PLENITUDE-001 (2 admins)
- ✅ Réinitialisation des accès pour MAMELLES-001 (1 admin)
- ✅ Mots de passe temporaires générés et configurés dans Supabase Auth

---

## 🏥 CLINIQUE PLENITUDE-001

### Informations de la clinique

| Information | Valeur |
|-------------|--------|
| **Code Clinique** | `PLENITUDE-001` |
| **Nom** | Clinique Santé PLENITUDE |
| **Adresse** | LOKOSSA |
| **Téléphone** | +229 0164436342 |
| **Email** | laplenitude.hc@yahoo.com |
| **Statut** | ✅ Active |

---

### 👤 ADMIN 1 - Informations de Connexion

| Champ | Valeur |
|-------|--------|
| **Code Clinique** | `PLENITUDE-001` |
| **Email (Nom d'utilisateur)** | `laplenitude.hc@yahoo.com` |
| **Mot de passe temporaire** | `TempPlenitude2026!` |
| **Nom** | BOKO |
| **Prénom** | Chantal |
| **Rôle** | `CLINIC_ADMIN` |
| **Status** | `PENDING` (doit changer le mot de passe au premier login) |

⚠️ **IMPORTANT** : Le mot de passe est temporaire et ne peut être utilisé qu'une seule fois. L'admin devra le changer lors de la première connexion.

---

### 👤 ADMIN 2 - Informations de Connexion

| Champ | Valeur |
|-------|--------|
| **Code Clinique** | `PLENITUDE-001` |
| **Email (Nom d'utilisateur)** | `hakpovi95@yahoo.fr` |
| **Mot de passe temporaire** | `TempHakpovi2026!` |
| **Nom** | AKPOVI |
| **Prénom** | Hilaire |
| **Rôle** | `CLINIC_ADMIN` |
| **Status** | `PENDING` (doit changer le mot de passe au premier login) |

⚠️ **IMPORTANT** : Le mot de passe est temporaire et ne peut être utilisé qu'une seule fois. L'admin devra le changer lors de la première connexion.

---

## 🏥 CLINIQUE MAMELLES-001

### Informations de la clinique

| Information | Valeur |
|-------------|--------|
| **Code Clinique** | `MAMELLES-001` |
| **Nom** | Clinique Santé LES MAMELLES |
| **Adresse** | Save |
| **Téléphone** | +229 0166997940 |
| **Email** | dieudange@gmail.com |
| **Statut** | ✅ Active |

---

### 👤 ADMIN - Informations de Connexion

| Champ | Valeur |
|-------|--------|
| **Code Clinique** | `MAMELLES-001` |
| **Email (Nom d'utilisateur)** | `dieudange@gmail.com` |
| **Mot de passe temporaire** | `TempMamelles2026!` |
| **Nom** | MINHOU |
| **Prénom** | Ange Kevin Dieudonne |
| **Rôle** | `CLINIC_ADMIN` |
| **Status** | `PENDING` (doit changer le mot de passe au premier login) |

⚠️ **IMPORTANT** : Le mot de passe est temporaire et ne peut être utilisé qu'une seule fois. L'admin devra le changer lors de la première connexion.

---

## 📋 ÉTAPES DE CONNEXION

### 1. Accéder à la page de connexion

1. Ouvrir l'application dans votre navigateur
2. Sur la page de connexion, vous verrez un champ pour le **Code clinique**

### 2. Entrer le code clinique

- Pour PLENITUDE-001 : Entrer `PLENITUDE-001`
- Pour MAMELLES-001 : Entrer `MAMELLES-001`
- Cliquer sur **"Vérifier"** ou **"Continuer"**

### 3. Se connecter

- **Email** : Utiliser l'email correspondant à votre compte (voir tableau ci-dessus)
- **Mot de passe** : Utiliser le mot de passe temporaire correspondant (voir tableau ci-dessus)
- Cliquer sur **"Se connecter"**

### 4. Changer le mot de passe (Première connexion)

- Un dialogue s'affichera automatiquement pour changer le mot de passe
- Entrer un **nouveau mot de passe sécurisé** (minimum 8 caractères, majuscule, minuscule, chiffre)
- Confirmer le nouveau mot de passe
- Après le changement, le statut passera à `ACTIVE`

---

## ⚠️ RÈGLES IMPORTANTES

1. **Mots de passe temporaires** :
   - Ne peuvent être utilisés qu'**une seule fois**
   - Une fois changé, seul le nouveau mot de passe donne accès à l'espace de travail
   - Le nouveau mot de passe est enregistré dans Supabase Auth

2. **Première connexion** :
   - Le changement de mot de passe est **obligatoire**
   - Le dialogue ne peut pas être fermé sans changer le mot de passe
   - Le statut passe automatiquement de `PENDING` à `ACTIVE` après le changement

3. **Sécurité** :
   - Transmettez les identifiants via un canal sécurisé
   - Ne partagez pas les mots de passe temporaires publiquement
   - Les admins doivent choisir un mot de passe fort lors du changement

---

## 🐛 DÉPANNAGE

### Erreur : "Clinique non trouvée"

**Solution :**
1. Vérifiez que vous utilisez le bon code :
   - `PLENITUDE-001` (et non `CLIN-PLENITUDE-001`)
   - `MAMELLES-001`
2. Vérifiez que la migration `70_CHANGE_PLENITUDE_CODE_AND_RESET_ACCESS.sql` a été appliquée

### Erreur : "Email ou mot de passe incorrect"

**Solution :**
1. Vérifiez que vous utilisez le bon email (voir tableau ci-dessus)
2. Vérifiez que vous utilisez le bon mot de passe temporaire (sensible à la casse)
3. Vérifiez que le script `reset_plenitude_mamelles_access.ps1` a été exécuté avec succès

### Le dialogue de changement de mot de passe ne s'affiche pas

**Solution :**
1. Vérifiez que `status = 'PENDING'` dans la table `users`
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que `auth_user_id` est bien défini

### Erreur lors du changement de mot de passe

**Solution :**
1. Vérifiez que le mot de passe respecte les exigences :
   - Minimum 8 caractères
   - Au moins une majuscule
   - Au moins une minuscule
   - Au moins un chiffre
2. Vérifiez que `auth_user_id` est bien défini
3. Vérifiez les logs dans la console du navigateur

---

## 📝 RÉSUMÉ DES IDENTIFIANTS

### PLENITUDE-001

| Admin | Email | Mot de passe temporaire |
|-------|-------|-------------------------|
| Admin 1 | `laplenitude.hc@yahoo.com` | `TempPlenitude2026!` |
| Admin 2 | `hakpovi95@yahoo.fr` | `TempHakpovi2026!` |

### MAMELLES-001

| Admin | Email | Mot de passe temporaire |
|-------|-------|-------------------------|
| Admin | `dieudange@gmail.com` | `TempMamelles2026!` |

---

## ✅ CHECKLIST

- [ ] Migration `70_CHANGE_PLENITUDE_CODE_AND_RESET_ACCESS.sql` appliquée
- [ ] Script `reset_plenitude_mamelles_access.ps1` exécuté avec succès
- [ ] Code clinique changé : `PLENITUDE-001` confirmé
- [ ] Admins PLENITUDE-001 réinitialisés (2 admins)
- [ ] Admin MAMELLES-001 réinitialisé (1 admin)
- [ ] `auth_user_id` lié dans `users` pour tous les admins
- [ ] Identifiants transmis aux admins via un canal sécurisé
- [ ] Admins informés qu'ils devront changer leur mot de passe à la première connexion

---

**Date** : 2026-01-30  
**Statut** : ✅ Configuration complète et fonctionnelle

---

**🎉 Les admins peuvent maintenant se connecter avec les identifiants fournis et changer leur mot de passe lors de la première connexion !**

# 🔐 INFORMATIONS DE CONNEXION - Clinique du Campus

> **📋 Document de référence pour les identifiants de connexion**

## ✅ MIGRATION TERMINÉE AVEC SUCCÈS

La migration du système hiérarchique a été appliquée avec succès dans Supabase.

---

## 🏥 CLINIQUE DU CAMPUS

| Information | Valeur |
|-------------|--------|
| **Code Clinique** | `CAMPUS-001` |
| **Nom** | Clinique du Campus |
| **Adresse** | Quartier Arafat; rue opposée universite ESAE |
| **Téléphone** | +229 90904344 |
| **Email** | cliniquemedicalecampus@gmail.com |
| **Statut** | ✅ Active |
| **Données** | Aucune donnée pour le moment (comme prévu) |

---

## 👤 ADMIN CLINIQUE - Informations de Connexion

### 🔑 Identifiants de connexion

| Champ | Valeur |
|-------|--------|
| **Code Clinique** | `CAMPUS-001` |
| **Email (Nom d'utilisateur)** | `bagarayannick1@gmail.com` |
| **Mot de passe temporaire** | `TempClinic2024!` |
| **Nom** | BAGARA |
| **Prénom** | Sabi Yannick |
| **Rôle** | `CLINIC_ADMIN` |
| **Status** | `PENDING` (doit changer le mot de passe au premier login) |

⚠️ **IMPORTANT** : Le mot de passe est temporaire. L'admin devra le changer lors de la première connexion.

---

## 👑 SUPER-ADMIN - Informations de Connexion

### 🔑 Identifiants

| Champ | Valeur |
|-------|--------|
| **Email** | `babocher21@gmail.com` |
| **Nom** | BABONI M. |
| **Prénom** | Cherif |
| **Rôle** | `SUPER_ADMIN` |
| **Status** | `ACTIVE` |
| **Accès** | Toutes les cliniques |

### 🔐 Mot de passe

Le mot de passe a été défini lors de la création dans Supabase Auth Dashboard.

---

## 📋 PROCHAINES ÉTAPES

### ÉTAPE 1 : Vérifier que les utilisateurs sont créés dans la table `users`

Exécuter cette requête dans Supabase SQL Editor pour vérifier :

```sql
SELECT 
  u.email,
  u.nom,
  u.prenom,
  u.role,
  u.status,
  c.code as clinic_code,
  c.name as clinic_name
FROM users u
LEFT JOIN clinics c ON u.clinic_id = c.id
WHERE u.role IN ('SUPER_ADMIN', 'CLINIC_ADMIN')
ORDER BY u.role;
```

**Résultat attendu :**
- 1 ligne pour le SUPER_ADMIN (babocher21@gmail.com)
- 1 ligne pour le CLINIC_ADMIN (bagarayannick1@gmail.com) avec clinic_code = 'CAMPUS-001'

---

### ÉTAPE 2 : Si les utilisateurs ne sont pas dans la table `users`

Si la requête ci-dessus ne retourne pas les utilisateurs, exécuter le script :

```
supabase_migrations/INSERTION_UTILISATEURS.sql
```

⚠️ **N'oublie pas** de remplacer les UUID dans le script par les vrais UUID copiés depuis Supabase Auth Dashboard.

---

### ÉTAPE 3 : Tester la connexion de l'Admin Clinique

1. **Ouvrir l'application** (ou l'interface de connexion)
2. **Se connecter avec** :
   - Email : `bagarayannick1@gmail.com`
   - Mot de passe : `TempClinic2024!`
3. **Changer le mot de passe** lors de la première connexion
4. **Vérifier** que l'admin voit uniquement les données de la Clinique du Campus

---

### ÉTAPE 4 : Tester la connexion du Super-Admin

1. **Se connecter avec** :
   - Email : `babocher21@gmail.com`
   - Mot de passe : (celui défini dans Supabase Auth)
2. **Vérifier** que le Super-Admin voit toutes les cliniques

---

## 🎯 FONCTIONNALITÉS DISPONIBLES

### Pour le Super-Admin (babocher21@gmail.com)

- ✅ Voir toutes les cliniques
- ✅ Créer de nouvelles cliniques
- ✅ Créer des admins pour chaque clinique
- ✅ Voir tous les utilisateurs
- ✅ Gérer les utilisateurs de toutes les cliniques

### Pour l'Admin Clinique (bagarayannick1@gmail.com)

- ✅ Voir uniquement la Clinique du Campus (CAMPUS-001)
- ✅ Gérer les utilisateurs de SA clinique uniquement
- ✅ Valider les demandes d'inscription pour SA clinique
- ✅ Créer des comptes pour les membres de SA clinique

---

## 📊 ÉTAT ACTUEL DE LA CLINIQUE DU CAMPUS

| Élément | État |
|---------|------|
| **Clinique créée** | ✅ Oui |
| **Admin créé** | ✅ Oui (Sabi Yannick BAGARA) |
| **Patients** | ❌ Aucun (comme prévu) |
| **Utilisateurs** | ✅ 1 (l'admin) |
| **Données** | ❌ Aucune (comme prévu) |

---

## 🔄 WORKFLOW DE VALIDATION DES MEMBRES

Quand un nouveau membre veut s'inscrire à la Clinique du Campus :

1. **Le membre** remplit le formulaire d'inscription avec le code `CAMPUS-001`
2. **La demande** est créée dans `registration_requests` avec `statut = 'pending'`
3. **L'Admin Clinique** (Sabi Yannick) voit la demande dans son dashboard
4. **L'Admin valide ou refuse** :
   - **Valider** → Crée le compte Auth + met à jour `users` avec `status = 'PENDING'`
   - **Refuser** → Met `statut = 'rejected'`
5. **Le membre** reçoit un email avec un lien pour définir son mot de passe
6. **Le membre** définit son mot de passe → `status` passe à `'ACTIVE'`

---

## 📝 NOTES IMPORTANTES

1. **Mot de passe temporaire** : L'admin clinique doit changer son mot de passe au premier login
2. **Status PENDING** : L'admin clinique a le status `PENDING` jusqu'à ce qu'il change son mot de passe
3. **Aucune donnée** : La clinique est vide pour le moment, c'est normal
4. **RLS activé** : Les politiques de sécurité sont en place pour isoler les données par clinique

---

## 🆘 EN CAS DE PROBLÈME

### L'admin ne peut pas se connecter

1. Vérifier que l'utilisateur existe dans **Supabase Auth** > **Users**
2. Vérifier que l'utilisateur existe dans la table `users` (requête SQL ci-dessus)
3. Vérifier que `auth_user_id` dans `users` correspond à l'UUID dans `auth.users`

### L'admin ne voit pas sa clinique

1. Vérifier que `clinic_id` dans `users` correspond à l'`id` de la clinique CAMPUS-001
2. Vérifier que les politiques RLS sont bien créées (voir dans Supabase Dashboard > Authentication > Policies)

### Erreur de permissions

1. Vérifier que le rôle est bien `CLINIC_ADMIN` dans la table `users`
2. Vérifier que le status est `ACTIVE` ou `PENDING`

---

## 📞 SUPPORT

Pour toute question ou problème :
- Vérifier les logs dans **Supabase Dashboard** > **Database** > **Logs**
- Vérifier les politiques RLS dans **Authentication** > **Policies**
- Vérifier les utilisateurs dans **Authentication** > **Users**

---

**✅ La migration est terminée et la Clinique du Campus est prête à être utilisée !**


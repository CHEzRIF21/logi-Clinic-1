# 🔐 Informations de Connexion - Clinique CAMPUS-001

## 📋 Informations de Connexion

### Admin de la Clinique CAMPUS-001

| Champ | Valeur |
|-------|--------|
| **Code clinique** | `CAMPUS-001` |
| **Email** | `bagarayannick1@gmail.com` |
| **Mot de passe initial** | `TempClinic2024!` |
| **Rôle** | `CLINIC_ADMIN` |
| **Statut** | `PENDING` (changement de mot de passe requis) |

---

## ⚠️ Important : Première Connexion

Lors de la **première connexion**, vous devrez :

1. Entrer le code clinique : `CAMPUS-001`
2. Entrer votre email : `bagarayannick1@gmail.com`
3. Entrer votre mot de passe initial : `TempClinic2024!`
4. **Changer votre mot de passe** (un dialogue s'affichera automatiquement)
5. Définir un nouveau mot de passe sécurisé

---

## 🔧 Correction de la Configuration

Si vous rencontrez l'erreur **"Code clinique CAMPUS-001 introuvable"**, exécutez le script SQL suivant dans Supabase :

**Fichier** : `supabase_migrations/18_FIX_CAMPUS001_CONNECTION.sql`

Ce script :
- ✅ Crée/vérifie la clinique CAMPUS-001
- ✅ Crée/vérifie l'utilisateur admin
- ✅ Configure correctement les relations
- ✅ Nettoie les codes temporaires obsolètes

---

## 📊 Vérification de la Configuration

Pour vérifier que tout est correctement configuré, exécutez cette requête SQL :

```sql
SELECT 
  c.code as code_clinique,
  c.name as nom_clinique,
  c.active as active,
  u.email as email_admin,
  u.role as role_admin,
  u.status as statut_admin,
  u.actif as admin_actif
FROM clinics c
LEFT JOIN users u ON u.clinic_id = c.id AND u.role = 'CLINIC_ADMIN'
WHERE c.code = 'CAMPUS-001';
```

**Résultat attendu** :
- `code_clinique` : `CAMPUS-001`
- `active` : `true`
- `email_admin` : `bagarayannick1@gmail.com`
- `role_admin` : `CLINIC_ADMIN`
- `statut_admin` : `PENDING` ou `ACTIVE`
- `admin_actif` : `true`

---

## 🚀 Étapes de Connexion

1. **Ouvrir** : `http://localhost:3005/login` (ou votre URL de production)

2. **Saisir les informations** :
   - Code clinique : `CAMPUS-001`
   - Nom d'utilisateur : `bagarayannick1@gmail.com`
   - Mot de passe : `TempClinic2024!`

3. **Cliquer sur** "Se connecter"

4. **Si première connexion** :
   - Un dialogue de changement de mot de passe s'affichera
   - Définir un nouveau mot de passe sécurisé
   - Confirmer le nouveau mot de passe

5. **Vous serez connecté** et redirigé vers le tableau de bord

---

## 🔒 Sécurité

- ⚠️ **Ne partagez jamais** ces informations de connexion
- ⚠️ **Changez le mot de passe** dès la première connexion
- ⚠️ **Utilisez un mot de passe fort** (minimum 8 caractères, majuscules, minuscules, chiffres, caractères spéciaux)

---

## 📞 Support

En cas de problème de connexion :

1. Vérifiez que la clinique existe dans Supabase
2. Vérifiez que l'utilisateur existe et est lié à la clinique
3. Exécutez le script de correction : `18_FIX_CAMPUS001_CONNECTION.sql`
4. Contactez le support technique si le problème persiste

---

## 📝 Notes Techniques

- Le code clinique `CAMPUS-001` est **permanent** et ne peut pas être modifié
- Le statut `PENDING` force le changement de mot de passe à la première connexion
- Le mot de passe est hashé avec SHA256 + salt (`logi_clinic_salt`)
- L'authentification peut se faire via Supabase Auth ou via la table `users` directement






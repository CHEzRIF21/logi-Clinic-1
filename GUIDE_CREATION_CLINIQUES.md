# 🏥 Guide Complet : Création de 2 Cliniques avec Admins

## 📋 Vue d'ensemble

Ce guide vous explique comment créer **2 cliniques différentes** dans Logi Clinic, chacune avec **au moins 1 administrateur** à la création.

## ✅ Prérequis

1. **Accès SUPER_ADMIN** : Vous devez être connecté en tant que SUPER_ADMIN
2. **Base de données Supabase** : Accès à la base de données
3. **Informations nécessaires** pour chaque clinique :
   - Nom de la clinique
   - Adresse (optionnel)
   - Téléphone (optionnel)
   - Email de la clinique (optionnel)
   - **Email de l'admin** (obligatoire)
   - **Nom de l'admin** (obligatoire)
   - **Prénom de l'admin** (obligatoire)

---

## 🎯 Méthode 1 : Migration SQL (Recommandée)

### Avantages
- ✅ Simple et direct
- ✅ Création atomique (tout ou rien)
- ✅ Traçable dans l'historique des migrations
- ✅ Pas besoin d'interface UI

### Étapes

#### 1. Préparer les données des 2 cliniques

Remplissez les informations suivantes pour chaque clinique :

**Clinique 1 :**
- Code : `CLIN-2026-001` (ou personnalisé)
- Nom : `[Nom de la clinique 1]`
- Adresse : `[Adresse]`
- Téléphone : `[Téléphone]`
- Email clinique : `[Email]`
- **Admin Email** : `[admin1@example.com]`
- **Admin Nom** : `[Nom]`
- **Admin Prénom** : `[Prénom]`

**Clinique 2 :**
- Code : `CLIN-2026-002` (ou personnalisé)
- Nom : `[Nom de la clinique 2]`
- Adresse : `[Adresse]`
- Téléphone : `[Téléphone]`
- Email clinique : `[Email]`
- **Admin Email** : `[admin2@example.com]`
- **Admin Nom** : `[Nom]`
- **Admin Prénom** : `[Prénom]`

#### 2. Créer la migration SQL

Une migration SQL a été créée dans `supabase_migrations/48_CREATE_TWO_CLINICS_WITH_ADMINS.sql`

#### 3. Appliquer la migration

**Option A : Via MCP Supabase (Recommandé)**
```bash
# La migration sera appliquée automatiquement via MCP
```

**Option B : Via Supabase CLI**
```bash
supabase migration up
```

**Option C : Via Supabase Dashboard**
1. Allez dans votre projet Supabase
2. Section "SQL Editor"
3. Copiez-collez le contenu de la migration
4. Exécutez la requête

#### 4. Vérifier la création

Après l'exécution, vérifiez que :
- ✅ Les 2 cliniques sont créées dans la table `clinics`
- ✅ Les 2 admins sont créés dans la table `users` avec le rôle `CLINIC_ADMIN`
- ✅ Chaque admin est lié à sa clinique (`clinic_id`)

#### 5. Lier les admins à Supabase Auth (Important !)

Les admins créés via SQL n'ont pas encore de compte Supabase Auth. Vous devez les lier :

**Option A : Via Edge Function `bootstrap-clinic-admin-auth`**

Pour chaque admin, faites un appel HTTP :

```bash
curl -X POST https://[VOTRE_PROJECT].supabase.co/functions/v1/bootstrap-clinic-admin-auth \
  -H "Authorization: Bearer [VOTRE_ACCESS_TOKEN_SUPER_ADMIN]" \
  -H "Content-Type: application/json" \
  -d '{
    "clinicCode": "CLIN-2026-001",
    "adminEmail": "admin1@example.com",
    "adminPassword": "MotDePasseSecurise123!"
  }'
```

Répétez pour la deuxième clinique.

**Option B : Via l'interface (si disponible)**

Si une interface de gestion existe, utilisez-la pour lier les comptes.

---

## 🎯 Méthode 2 : Edge Function `create-clinic`

### Avantages
- ✅ Création automatique du compte Supabase Auth
- ✅ Génération automatique d'un code temporaire
- ✅ Plus flexible (code temporaire avec expiration)

### Étapes

#### 1. Obtenir votre token d'accès SUPER_ADMIN

Connectez-vous en tant que SUPER_ADMIN et récupérez votre token JWT.

#### 2. Créer la première clinique

```bash
curl -X POST https://[VOTRE_PROJECT].supabase.co/functions/v1/create-clinic \
  -H "Authorization: Bearer [VOTRE_ACCESS_TOKEN_SUPER_ADMIN]" \
  -H "Content-Type: application/json" \
  -d '{
    "clinicName": "Nom de la Clinique 1",
    "adminEmail": "admin1@example.com",
    "adminName": "Nom",
    "adminPrenom": "Prénom",
    "address": "Adresse de la clinique",
    "phone": "+229 00000000",
    "clinicEmail": "contact@clinique1.com",
    "validityHours": 72
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "clinic": {
    "id": "...",
    "code": "XXX-TEMP-XXXX-XXXX",
    "name": "Nom de la Clinique 1",
    "isTemporaryCode": true,
    "requiresCodeChange": true
  },
  "admin": {
    "id": "...",
    "email": "admin1@example.com",
    "name": "Prénom Nom",
    "status": "PENDING"
  },
  "credentials": {
    "clinicCode": "XXX-TEMP-XXXX-XXXX",
    "email": "admin1@example.com",
    "tempPassword": "TempXXXXXX!",
    "resetLink": "..."
  }
}
```

#### 3. Créer la deuxième clinique

Répétez l'étape 2 avec les données de la deuxième clinique.

#### 4. Transmettre les identifiants aux admins

⚠️ **Important** : Transmettez les identifiants (code clinique temporaire, email, mot de passe temporaire) aux admins via un **canal sécurisé**.

#### 5. Les admins doivent se connecter et définir un code permanent

Lors de la première connexion, les admins devront :
1. Se connecter avec le code temporaire
2. Changer leur mot de passe
3. Définir un code clinique permanent

---

## 🎯 Méthode 3 : Interface UI (À créer)

Si vous préférez une interface graphique, je peux créer un composant React pour gérer la création de cliniques.

### Fonctionnalités proposées :
- Formulaire de création de clinique
- Gestion des admins
- Liste des cliniques existantes
- Édition des cliniques

**Souhaitez-vous que je crée cette interface ?**

---

## 📝 Checklist de Vérification

Après la création des cliniques, vérifiez :

### ✅ Base de données
- [ ] Les 2 cliniques existent dans `clinics` avec `active = true`
- [ ] Les 2 admins existent dans `users` avec `role = 'CLINIC_ADMIN'`
- [ ] Chaque admin a un `clinic_id` correspondant à sa clinique
- [ ] Les admins ont un `auth_user_id` (lié à Supabase Auth)

### ✅ Authentification
- [ ] Les admins peuvent se connecter avec :
  - Code clinique
  - Email
  - Mot de passe
- [ ] Le `clinic_id` est correctement stocké dans la session

### ✅ Isolation des données
- [ ] Les données de la clinique 1 ne sont pas visibles depuis la clinique 2
- [ ] Les RLS policies fonctionnent correctement

---

## 🔒 Sécurité

### ⚠️ Points importants

1. **Transmission sécurisée des identifiants**
   - Utilisez un canal sécurisé (email chiffré, SMS, etc.)
   - Ne partagez jamais les identifiants en clair dans des messages non sécurisés

2. **Première connexion**
   - Les admins doivent changer leur mot de passe à la première connexion
   - Si un code temporaire est utilisé, ils doivent le remplacer par un code permanent

3. **Permissions**
   - Seul un SUPER_ADMIN peut créer des cliniques
   - Vérifiez toujours les permissions avant d'exécuter les migrations

---

## 🆘 Dépannage

### Problème : L'admin ne peut pas se connecter

**Solutions :**
1. Vérifiez que `auth_user_id` est bien lié dans la table `users`
2. Utilisez la fonction `bootstrap-clinic-admin-auth` pour lier le compte
3. Vérifiez que le compte Supabase Auth existe

### Problème : Les données ne sont pas isolées

**Solutions :**
1. Vérifiez que toutes les tables ont `clinic_id`
2. Vérifiez que les RLS policies sont actives
3. Vérifiez que `get_current_user_clinic_id()` fonctionne correctement

### Problème : Erreur lors de la création

**Solutions :**
1. Vérifiez que vous êtes connecté en tant que SUPER_ADMIN
2. Vérifiez que le code clinique est unique
3. Vérifiez que l'email de l'admin est unique
4. Consultez les logs Supabase pour plus de détails

---

## 📞 Support

Si vous rencontrez des problèmes, consultez :
- Les logs Supabase (`mcp_supabase_get_logs`)
- Les advisors de sécurité (`mcp_supabase_get_advisors`)
- La documentation de l'architecture multi-tenant

---

## 🎉 Prochaines étapes

Une fois les cliniques créées :

1. **Configurer les tarifs** : Chaque clinique peut avoir ses propres tarifs
2. **Créer d'autres utilisateurs** : Les admins peuvent créer des utilisateurs pour leur clinique
3. **Configurer les services** : Activer/désactiver les modules selon les besoins
4. **Formation des admins** : Former les admins sur l'utilisation du système

---

**Date de création** : 24 janvier 2026  
**Version** : 1.0

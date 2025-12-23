# 🚀 GUIDE D'IMPLÉMENTATION : Système Hiérarchique Super-Admin

## 📋 INFORMATIONS DU PROJET

| Élément | Valeur |
|---------|--------|
| **Supabase URL** | https://bnfgemmlokvetmohiqch.supabase.co |
| **Project ID** | bnfgemmlokvetmohiqch |
| **Dashboard** | https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch |

---

## 🔧 MÉTHODE 1 : MIGRATION VIA PRISMA (Backend)

### Prérequis

1. Créer le fichier `.env` dans `server/` (voir `server/env.setup.md`)
2. Configurer `DATABASE_URL` avec les identifiants Supabase

### Commandes à exécuter

```powershell
# Depuis la racine du projet
cd server

# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations (production)
npx prisma migrate deploy

# OU forcer le schéma (si migrate échoue)
npx prisma db push
```

### Script automatique

```powershell
.\apply-hierarchical-migration.ps1
```

---

## 👥 COMPTES À CRÉER

### 🔐 Super-Admin (Accès Global)
| Champ | Valeur |
|-------|--------|
| Email | `babocher21@gmail.com` |
| Nom | BABONI M. |
| Prénom | Cherif |
| Rôle | `SUPER_ADMIN` |

### 🏥 Clinique du Campus
| Champ | Valeur |
|-------|--------|
| Code | `CAMPUS-001` |
| Nom | Clinique du Campus |
| Adresse | Quartier Arafat; rue opposée universite ESAE |
| Téléphone | +229 90904344 |
| Email | cliniquemedicalecampus@gmail.com |

### 👤 Admin Clinique du Campus
| Champ | Valeur |
|-------|--------|
| Email | `bagarayannick1@gmail.com` |
| Nom | BAGARA |
| Prénom | Sabi Yannick |
| Rôle | `CLINIC_ADMIN` |
| Clinique | CAMPUS-001 |

---

## 🗄️ MÉTHODE 2 : MIGRATION VIA SQL (Supabase Dashboard)

Si la méthode Prisma ne fonctionne pas, appliquer les migrations SQL directement dans Supabase.

---

## 📝 ÉTAPES D'IMPLÉMENTATION (SQL)

### ÉTAPE 1 : Ouvrir le Dashboard Supabase

1. Aller sur : **https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch**
2. Se connecter avec votre compte Supabase
3. Aller dans **SQL Editor** (menu de gauche)

---

### ÉTAPE 2 : Exécuter la Migration - Structure des Tables

1. Dans **SQL Editor**, cliquer sur **+ New query**
2. Copier-coller le contenu du fichier :
   ```
   supabase_migrations/001_hierarchical_admin_system_complete.sql
   ```
3. Cliquer sur **Run** (ou Ctrl+Enter)
4. Vérifier le message : `✅ PARTIE 1 TERMINÉE : Structure des tables créée`

---

### ÉTAPE 3 : Créer la Clinique du Campus

1. Dans **SQL Editor**, exécuter cette requête :

c

### ÉTAPE 4 : Créer le Super-Admin dans Supabase Auth

1. Aller dans **Authentication** > **Users** (menu de gauche)
2. Cliquer sur **Add user** > **Create new user**
3. Remplir :
   - **Email** : `babocher21@gmail.com`
   - **Password** : (choisir un mot de passe sécurisé, min 8 caractères)
   - ✅ Cocher **Auto Confirm User**
4. Cliquer sur **Create user**
5. **⚠️ IMPORTANT** : Copier l'**UUID** de l'utilisateur créé (colonne "User UID")

---

### ÉTAPE 5 : Créer l'Admin Clinique dans Supabase Auth

1. Toujours dans **Authentication** > **Users**
2. Cliquer sur **Add user** > **Create new user**
3. Remplir :
   - **Email** : `bagarayannick1@gmail.com`
   - **Password** : `TempClinic2024!` (mot de passe temporaire)
   - ✅ Cocher **Auto Confirm User**
4. Cliquer sur **Create user**
5. **⚠️ IMPORTANT** : Copier l'**UUID** de l'utilisateur créé

---

### ÉTAPE 6 : Insérer les Utilisateurs dans la Table `users`

1. Retourner dans **SQL Editor**
2. Exécuter cette requête **en remplaçant les UUID** :

```sql
-- ⚠️ REMPLACER LES UUID PAR LES VRAIS UUID COPIÉS

DO $$
DECLARE
  -- ⬇️ REMPLACER CES UUID ⬇️
  super_admin_auth_id UUID := 'COLLER_UUID_SUPER_ADMIN_ICI';
  clinic_admin_auth_id UUID := 'COLLER_UUID_CLINIC_ADMIN_ICI';
  -- ⬆️ REMPLACER CES UUID ⬆️
  
  campus_clinic_id UUID;
BEGIN
  
  -- Récupérer l'ID de la clinique Campus
  SELECT id INTO campus_clinic_id FROM clinics WHERE code = 'CAMPUS-001';
  
  IF campus_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Clinique CAMPUS-001 non trouvée. Exécuter d''abord l''étape 3.';
  END IF;
  
  -- Insérer le Super-Admin
  INSERT INTO users (
    auth_user_id,
    nom,
    prenom,
    email,
    role,
    clinic_id,
    status,
    actif
  )
  VALUES (
    super_admin_auth_id,
    'BABONI M.',
    'Cherif',
    'babocher21@gmail.com',
    'SUPER_ADMIN',
    NULL,  -- SUPER_ADMIN n'est pas lié à une clinique spécifique
    'ACTIVE',
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    role = 'SUPER_ADMIN',
    status = 'ACTIVE';
  
  RAISE NOTICE '✅ Super-Admin créé : babocher21@gmail.com';
  
  -- Insérer l'Admin de Clinique
  INSERT INTO users (
    auth_user_id,
    nom,
    prenom,
    email,
    role,
    clinic_id,
    status,
    actif,
    created_by
  )
  VALUES (
    clinic_admin_auth_id,
    'BAGARA',
    'Sabi Yannick',
    'bagarayannick1@gmail.com',
    'CLINIC_ADMIN',
    campus_clinic_id,
    'PENDING',  -- Doit changer son mot de passe au premier login
    true,
    super_admin_auth_id
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    role = 'CLINIC_ADMIN',
    clinic_id = campus_clinic_id,
    status = 'PENDING';
  
  RAISE NOTICE '✅ Admin Clinique créé : bagarayannick1@gmail.com';
  
  -- Mettre à jour created_by_super_admin de la clinique
  UPDATE clinics
  SET created_by_super_admin = super_admin_auth_id
  WHERE code = 'CAMPUS-001';
  
  RAISE NOTICE '✅ Clinique CAMPUS-001 mise à jour';
  
END $$;

-- Vérification
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

---

### ÉTAPE 7 : Configurer les Politiques RLS

1. Dans **SQL Editor**, exécuter le contenu du fichier :
   ```
   supabase_migrations/002_hierarchical_admin_data_and_rls.sql
   ```
2. Vérifier le message : `✅ PARTIE 2 TERMINÉE : Données et RLS configurés`

---

### ÉTAPE 8 : Vérification Finale

Exécuter ces requêtes pour vérifier que tout est en place :

```sql
-- 1. Vérifier les cliniques
SELECT * FROM clinics;

-- 2. Vérifier les utilisateurs
SELECT 
  id,
  email,
  nom,
  prenom,
  role,
  status,
  clinic_id,
  auth_user_id
FROM users
WHERE role IN ('SUPER_ADMIN', 'CLINIC_ADMIN');

-- 3. Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('clinics', 'users', 'registration_requests')
ORDER BY tablename, policyname;

-- 4. Vérifier les fonctions
SELECT routine_name 
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'is_super_admin',
  'is_clinic_admin',
  'get_user_clinic_id',
  'get_user_role',
  'generate_clinic_code'
);
```

---

## ✅ RÉSULTAT ATTENDU

Après ces étapes, vous aurez :

| Élément | État |
|---------|------|
| Table `clinics` | ✅ Créée avec RLS |
| Table `users` | ✅ Modifiée avec rôles hiérarchiques |
| Table `registration_requests` | ✅ Créée avec RLS |
| Clinique du Campus | ✅ Code: CAMPUS-001 |
| Super-Admin (Cherif BABONI M.) | ✅ Rôle: SUPER_ADMIN, Status: ACTIVE |
| Admin Clinique (Sabi Yannick BAGARA) | ✅ Rôle: CLINIC_ADMIN, Status: PENDING |
| Politiques RLS | ✅ Configurées pour les 3 niveaux |
| Fonctions utilitaires | ✅ Créées |

---

## 📱 CONNEXION DES UTILISATEURS

### Super-Admin (Cherif BABONI M.)
```
Email: babocher21@gmail.com
Password: (celui que vous avez défini)
Droits: Accès complet à toutes les cliniques
```

### Admin Clinique (Sabi Yannick BAGARA)
```
Email: bagarayannick1@gmail.com
Password: TempClinic2024! (temporaire, à changer au premier login)
Droits: Gestion de la Clinique du Campus uniquement
```

---

## 🔄 WORKFLOW DE VALIDATION DES MEMBRES

### Quand un nouveau membre veut s'inscrire :

1. **Le membre** remplit le formulaire d'inscription avec le code clinique `CAMPUS-001`
2. **La demande** est créée dans `registration_requests` avec `statut = 'pending'`
3. **L'Admin Clinique** (Sabi Yannick) voit la demande dans son dashboard
4. **L'Admin valide ou refuse** :
   - **Valider** → Crée le compte Auth + met à jour `users` avec `status = 'PENDING'`
   - **Refuser** → Met `statut = 'rejected'`
5. **Le membre** reçoit un email avec un lien pour définir son mot de passe
6. **Le membre** définit son mot de passe → `status` passe à `'ACTIVE'`

---

## 🆘 DÉPANNAGE

### Erreur : "Clinique CAMPUS-001 non trouvée"
→ Exécuter d'abord l'**Étape 3** pour créer la clinique

### Erreur : "duplicate key value violates unique constraint"
→ L'utilisateur existe déjà. La clause `ON CONFLICT` devrait gérer ce cas.

### Erreur : "User not found" lors de la connexion
→ Vérifier que l'utilisateur existe dans `auth.users` ET dans la table `users`

### Les utilisateurs ne voient pas les données
→ Vérifier que les politiques RLS sont bien appliquées :
```sql
SELECT * FROM pg_policies WHERE tablename = 'clinics';
```

---

## 📁 FICHIERS CRÉÉS

```
supabase_migrations/
├── 001_hierarchical_admin_system_complete.sql  # Structure des tables
├── 002_hierarchical_admin_data_and_rls.sql     # Données + RLS
└── 003_insert_super_admin_and_clinic_admin.sql # Script d'insertion (template)

supabase/functions/
├── create-clinic/index.ts   # Création automatique de clinique
└── approve-user/index.ts    # Validation des membres
```

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ **Tester la connexion** des deux utilisateurs
2. ⬜ **Créer l'interface Super-Admin** pour créer des cliniques
3. ⬜ **Créer l'interface Admin Clinique** pour valider les membres
4. ⬜ **Déployer les Edge Functions** pour l'automatisation
5. ⬜ **Configurer le service d'email** pour les notifications

---

## 📞 SUPPORT

En cas de problème, vérifier :
1. Les logs dans **Supabase Dashboard** > **Database** > **Logs**
2. Les politiques RLS dans **Authentication** > **Policies**
3. Les utilisateurs dans **Authentication** > **Users**


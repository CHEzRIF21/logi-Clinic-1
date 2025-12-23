# 📁 Migrations - Système Hiérarchique Super-Admin

## 📋 Fichiers à utiliser (dans l'ordre)

### 1️⃣ `00_MIGRATION_HIERARCHIQUE_COMPLETE.sql`
**✅ FICHIER PRINCIPAL - À EXÉCUTER EN PREMIER**

Migration complète du système hiérarchique :
- Création des tables (`clinics`, `users`, `registration_requests`)
- Ajout des colonnes nécessaires
- Création des fonctions utilitaires
- Configuration des politiques RLS
- Création de la Clinique du Campus (CAMPUS-001)

**Comment utiliser :**
1. Ouvrir Supabase Dashboard > SQL Editor
2. Copier-coller le contenu complet
3. Exécuter (Run)

---

### 2️⃣ `01_INSERTION_UTILISATEURS.sql`
**✅ À EXÉCUTER APRÈS LA MIGRATION**

Insère les utilisateurs Super-Admin et Admin Clinique dans la table `users`.

**⚠️ IMPORTANT :**
- Créer d'abord les utilisateurs dans **Supabase Auth Dashboard** > **Authentication** > **Users**
- Copier les UUID générés
- Remplacer les UUID dans le script (lignes 18-19)
- Exécuter le script

**Utilisateurs à créer :**
- Super-Admin : `babocher21@gmail.com`
- Admin Clinique : `bagarayannick1@gmail.com`

---

### 3️⃣ `02_VERIFICATION_SETUP.sql`
**✅ OPTIONNEL - Pour vérifier que tout est en place**

Script de vérification qui affiche :
- État de la clinique CAMPUS-001
- Liste des utilisateurs créés
- Vérification des colonnes
- Vérification des politiques RLS
- Vérification des fonctions
- Compteurs de données

**Comment utiliser :**
- Exécuter dans Supabase SQL Editor pour un rapport complet

---

## 🗑️ Fichiers supprimés (redondants)

Les fichiers suivants ont été supprimés car remplacés par `00_MIGRATION_HIERARCHIQUE_COMPLETE.sql` :
- ❌ `001_hierarchical_admin_system_complete.sql`
- ❌ `002_hierarchical_admin_data_and_rls.sql`
- ❌ `003_insert_super_admin_and_clinic_admin.sql`
- ❌ `create_hierarchical_admin_system.sql`
- ❌ `MIGRATION_COMPLETE_HIERARCHIQUE.sql`

---

## 📚 Documentation

- **`ANALYSE_MODELE_HIERARCHIQUE_SUPER_ADMIN.md`** : Analyse technique complète
- **`GUIDE_IMPLEMENTATION_MODELE_HIERARCHIQUE.md`** : Guide pas-à-pas d'implémentation
- **`INFORMATIONS_CONNEXION_CLINIQUE_CAMPUS.md`** : Identifiants et informations de connexion
- **`IDENTIFIANTS_ADMIN_CLINIQUE_CAMPUS.txt`** : Identifiants au format texte simple

---

## 🚀 Edge Functions (Automatisation)

Les Edge Functions pour automatiser la création de cliniques sont dans :
- `supabase/functions/create-clinic/index.ts` : Création automatique de clinique + admin
- `supabase/functions/approve-user/index.ts` : Validation des membres par l'admin

---

## ✅ Checklist d'implémentation

- [x] Migration principale exécutée
- [ ] Utilisateurs créés dans Supabase Auth
- [ ] Script d'insertion exécuté avec les bons UUID
- [ ] Vérification avec `02_VERIFICATION_SETUP.sql`
- [ ] Test de connexion Super-Admin
- [ ] Test de connexion Admin Clinique
- [ ] Edge Functions déployées (optionnel)

---

## 📞 Support

En cas de problème, vérifier :
1. Les logs dans Supabase Dashboard > Database > Logs
2. Les politiques RLS dans Authentication > Policies
3. Les utilisateurs dans Authentication > Users


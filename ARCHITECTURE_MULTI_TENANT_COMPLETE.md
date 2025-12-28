# 🏥 Architecture Multi-Tenant Complète - LogiClinic.org

## 📋 Vue d'ensemble

Cette documentation décrit l'implémentation complète du système LogiClinic.org selon les spécifications d'architecture multi-tenant sécurisée.

## ✅ Principes Fondamentaux

### 🔑 Principe #1 : Isolation Stricte des Données

**Aucune donnée ne doit exister sans être liée à une clinique.**

➡️ Toute donnée métier doit contenir `clinic_id` NOT NULL

Sans cela :
- ❌ Fuite de données
- ❌ Problème juridique
- ❌ Logiciel invendable

### 🏗️ Principe #2 : Création Automatique

Quand le Super Admin crée une clinique, le système fait **automatiquement** :
1. Générer un ID clinique unique
2. Générer un code clinique (format: `CLIN-YYYY-XXX`)
3. Créer la clinique
4. Créer automatiquement l'Admin de la clinique
5. Associer l'admin à la clinique
6. Définir son rôle : `CLINIC_ADMIN`

👉 **Aucune action manuelle supplémentaire**

### 🔐 Principe #3 : Connexion Multi-Clinic

**Données de connexion obligatoires :**
- Code clinique
- Nom d'utilisateur (email)
- Mot de passe

**À la connexion :**
1. Vérification du code clinique
2. Vérification de l'utilisateur
3. Récupération de `id_clinique`
4. Stockage dans la session / token

```javascript
session.id_clinique = user.id_clinique
```

👉 Toute l'application repose sur cette valeur

## 📊 Structure de la Base de Données

### Tables Principales

#### 1. `clinics` - Cliniques
```sql
CREATE TABLE clinics (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,  -- Format: CLIN-YYYY-XXX
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  active BOOLEAN DEFAULT true,
  is_demo BOOLEAN DEFAULT false,
  created_by_super_admin UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `users` - Utilisateurs
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  auth_user_id UUID UNIQUE,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT,
  nom VARCHAR(255),
  prenom VARCHAR(255),
  role VARCHAR(50) DEFAULT 'STAFF',
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, ACTIVE, SUSPENDED
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  actif BOOLEAN DEFAULT true,
  first_login_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. Tables Métier (toutes avec `clinic_id`)

Toutes les tables métier doivent avoir `clinic_id` :

- `patients` ✅
- `consultations` ✅
- `prescriptions` ✅
- `medicaments` ✅
- `lots` ✅
- `mouvements_stock` ✅
- `transferts` ✅
- `dispensations` ✅
- `alertes_stock` ✅
- `inventaires` ✅
- `consultation_templates` ✅
- `lab_requests` ✅
- `imaging_requests` ✅
- Et toutes les autres tables métier...

## 🔧 Fonctions Principales

### 1. Création Automatique de Clinique

```sql
super_admin_create_clinic(
  p_clinic_name TEXT,
  p_clinic_address TEXT DEFAULT NULL,
  p_clinic_phone TEXT DEFAULT NULL,
  p_clinic_email TEXT DEFAULT NULL,
  p_admin_email TEXT,
  p_admin_nom TEXT DEFAULT 'Admin',
  p_admin_prenom TEXT DEFAULT 'Clinique',
  p_admin_telephone TEXT DEFAULT NULL,
  p_is_demo BOOLEAN DEFAULT false
)
RETURNS JSONB
```

**Ce que fait cette fonction :**
1. Génère un code clinique unique (`CLIN-2025-001`, `CLIN-2025-002`, etc.)
2. Crée la clinique
3. Génère un mot de passe temporaire sécurisé
4. Crée l'admin avec `status = 'PENDING'`
5. Retourne les informations (code clinique, mot de passe temporaire)

**Exemple d'utilisation :**
```sql
-- Syntaxe avec noms de paramètres (recommandé - plus clair et évite les erreurs)
SELECT super_admin_create_clinic(
  p_clinic_name := 'Clinique Saint-Joseph',
  p_admin_email := 'admin@saintjoseph.bj',
  p_clinic_address := '123 Rue de la Santé, Cotonou',
  p_clinic_phone := '+229 21 12 34 56',
  p_clinic_email := 'contact@saintjoseph.bj',
  p_admin_nom := 'Koffi',
  p_admin_prenom := 'Jean',
  p_admin_telephone := '+229 97 12 34 56',
  p_is_demo := false
);

-- OU syntaxe positionnelle (ordre requis)
SELECT super_admin_create_clinic(
  'Clinique Saint-Joseph',     -- p_clinic_name (requis)
  'admin@saintjoseph.bj',       -- p_admin_email (requis)
  '123 Rue de la Santé, Cotonou', -- p_clinic_address (optionnel)
  '+229 21 12 34 56',           -- p_clinic_phone (optionnel)
  'contact@saintjoseph.bj',    -- p_clinic_email (optionnel)
  'Koffi',                      -- p_admin_nom (optionnel, défaut: 'Admin')
  'Jean',                       -- p_admin_prenom (optionnel, défaut: 'Clinique')
  '+229 97 12 34 56',           -- p_admin_telephone (optionnel)
  false                         -- p_is_demo (optionnel, défaut: false)
);
```

### 2. Validation de Connexion Multi-Clinic

```sql
validate_clinic_login(
  p_clinic_code TEXT,
  p_email TEXT,
  p_password TEXT
)
RETURNS JSONB
```

**Ce que fait cette fonction :**
1. Valide le code clinique
2. Vérifie l'utilisateur dans cette clinique
3. Vérifie le mot de passe
4. Met à jour `last_login`
5. Retourne les informations utilisateur

**Réponse en cas de succès :**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@clinique.bj",
    "nom": "Koffi",
    "prenom": "Jean",
    "role": "CLINIC_ADMIN",
    "status": "PENDING",
    "clinic_id": "uuid",
    "clinic_code": "CLIN-2025-001",
    "requires_password_change": true
  }
}
```

### 3. Fonctions Helper

#### `get_current_user_clinic_id()`
Retourne l'ID de la clinique de l'utilisateur connecté.

#### `check_is_super_admin()`
Vérifie si l'utilisateur est Super Admin.

#### `check_is_clinic_admin()`
Vérifie si l'utilisateur est Admin de sa clinique.

#### `get_clinic_id_by_code(p_clinic_code TEXT)`
Récupère l'ID d'une clinique depuis son code.

## 🛡️ Row Level Security (RLS)

### Politique Générale

Toutes les tables métier ont une politique RLS similaire :

```sql
CREATE POLICY "clinic_isolation_<table_name>" ON <table_name>
FOR ALL TO authenticated
USING (
  clinic_id = get_current_user_clinic_id()
  OR check_is_super_admin()
)
WITH CHECK (
  clinic_id = get_current_user_clinic_id()
  OR check_is_super_admin()
);
```

**Résultat :**
- ✅ Les utilisateurs ne voent que les données de leur clinique
- ✅ Le Super Admin voit tout
- ✅ Même en cas de bug frontend, les données sont protégées

## 🔄 Workflow Complet

### 1. Création d'une Clinique (Super Admin)

```
Super Admin
    ↓
Appelle super_admin_create_clinic()
    ↓
Système génère code (CLIN-2025-001)
    ↓
Crée la clinique
    ↓
Crée l'admin (status: PENDING)
    ↓
Retourne code + mot de passe temporaire
    ↓
Super Admin communique ces infos à l'admin
```

### 2. Première Connexion (Admin Clinique)

```
Admin entre:
  - Code clinique: CLIN-2025-001
  - Email: admin@clinique.bj
  - Mot de passe temporaire
    ↓
Système valide via validate_clinic_login()
    ↓
Détecte status = 'PENDING'
    ↓
Affiche dialogue changement de mot de passe
    ↓
Admin définit nouveau mot de passe
    ↓
Status → 'ACTIVE'
    ↓
Admin connecté
```

### 3. Inscription d'un Agent (Staff)

```
Agent accède à /signup
    ↓
Entre code clinique
    ↓
Système valide le code
    ↓
Agent remplit formulaire
    ↓
Demande créée (status: 'pending')
    ↓
Admin de la clinique voit la demande
    ↓
Admin approuve ou rejette
    ↓
Si approuvé → Agent peut se connecter
```

## 🧪 Tests Obligatoires

### Test Fonctionnel

1. Créer Clinique A
2. Ajouter un patient dans Clinique A
3. Créer Clinique B
4. Se connecter à Clinique B
5. ✅ **Aucune donnée de Clinique A visible**

### Test de Sécurité

1. Essayer d'accéder à une donnée d'une autre clinique
2. ✅ **Résultat attendu : Accès refusé / introuvable**

### Test de Création Automatique

1. Super Admin crée une clinique
2. ✅ **Vérifier :**
   - Clinique créée avec code unique
   - Admin créé automatiquement
   - Admin lié à la clinique
   - Status = 'PENDING'

## 📁 Fichiers de Migration

### Migration 24 : Architecture Multi-Tenant Complète

**Fichier :** `supabase_migrations/24_COMPLETE_MULTI_TENANT_ARCHITECTURE.sql`

**Contenu :**
1. Création des tables de base (`clinics`, `users`)
2. Ajout de `clinic_id` à toutes les tables métier
3. Assignation des données existantes à CLINIC001
4. Fonction `super_admin_create_clinic()`
5. Fonction `validate_clinic_login()`
6. Fonction `get_clinic_id_by_code()`
7. Renforcement des politiques RLS

## 🚀 Application de la Migration

### Via Supabase MCP

```bash
# La migration sera appliquée automatiquement via MCP Supabase
```

### Via SQL Editor Supabase

1. Ouvrir le SQL Editor dans Supabase
2. Copier le contenu de `24_COMPLETE_MULTI_TENANT_ARCHITECTURE.sql`
3. Exécuter le script
4. Vérifier les messages de succès

## ✅ Checklist de Vérification

- [ ] Toutes les tables métier ont `clinic_id`
- [ ] RLS activé sur toutes les tables
- [ ] Fonction `super_admin_create_clinic()` fonctionne
- [ ] Fonction `validate_clinic_login()` fonctionne
- [ ] Test d'isolation des données réussi
- [ ] Test de création automatique réussi
- [ ] Frontend utilise le code clinique pour la connexion

## 🎯 Prochaines Étapes

1. ✅ Migration 24 appliquée
2. ⏳ Tests avec TestSprite
3. ⏳ Vérification frontend (connexion multi-clinic)
4. ⏳ Tests d'isolation des données
5. ⏳ Documentation utilisateur

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs Supabase
2. Vérifier les politiques RLS
3. Vérifier que `clinic_id` est présent partout
4. Consulter les messages d'erreur SQL

---

**Version :** 1.0  
**Date :** 2025-01-XX  
**Auteur :** Équipe LogiClinic.org


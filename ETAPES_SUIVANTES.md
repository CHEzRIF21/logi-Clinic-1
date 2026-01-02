# Étapes Suivantes - Guide Complet

Ce guide vous accompagne dans l'application de la migration consolidée et la vérification du système.

## 📋 Checklist Complète

### Étape 1: Préparation ✅

- [x] Migration consolidée créée (`28_CREATE_CLINIC001_AND_CAMPUS001_ONLY.sql`)
- [x] Scripts de vérification créés
- [x] Guide de test créé
- [x] Documentation nettoyée

### Étape 2: Application de la Migration

1. **Sauvegarder la base de données**
   ```powershell
   # Via Supabase Dashboard → Settings → Database → Backups
   # Ou via psql:
   pg_dump -h [host] -U [user] -d [database] > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
   ```

2. **Appliquer la migration consolidée**
   
   **Option A: Via Supabase Dashboard (Recommandé)**
   - Ouvrir https://supabase.com/dashboard
   - Sélectionner votre projet
   - Aller dans SQL Editor
   - Ouvrir `supabase_migrations/28_CREATE_CLINIC001_AND_CAMPUS001_ONLY.sql`
   - Copier tout le contenu
   - Coller dans le SQL Editor
   - Cliquer sur Run (ou F5)
   
   **Option B: Via Script PowerShell**
   ```powershell
   .\apply_migration_consolidated.ps1
   ```
   
   **Option C: Via psql**
   ```powershell
   .\apply_migration_consolidated.ps1 -DatabaseUrl "postgresql://user:pass@host:port/db" -UsePsql
   ```

3. **Vérifier les résultats**
   - La migration doit s'exécuter sans erreur
   - Vérifier les messages de confirmation dans les logs

### Étape 3: Vérification des Cliniques

1. **Exécuter le script de vérification**
   ```powershell
   .\verify_clinics.ps1
   ```
   
   Ou manuellement dans Supabase Dashboard → SQL Editor:
   ```sql
   SELECT code, name, active, is_demo, 
          (SELECT COUNT(*) FROM users WHERE clinic_id = clinics.id) as nb_utilisateurs
   FROM clinics
   WHERE code IN ('CLINIC001', 'CAMPUS-001');
   ```

2. **Vérifier les résultats attendus**
   - ✅ CLINIC001: active=true, is_demo=true, nb_utilisateurs=4
   - ✅ CAMPUS-001: active=true, is_demo=false, nb_utilisateurs=1
   - ✅ Aucune autre clinique

### Étape 4: Test des Connexions

Suivre le guide complet: **`GUIDE_TEST_CONNEXIONS.md`**

**Tests à effectuer:**
- [ ] Connexion CLINIC001 avec admin
- [ ] Connexion CLINIC001 avec medecin
- [ ] Connexion CLINIC001 avec infirmier
- [ ] Connexion CLINIC001 avec receptionniste
- [ ] Connexion CAMPUS-001 (avec changement de mot de passe)
- [ ] Vérification de l'isolation des données

### Étape 5: Nettoyage des Migrations Redondantes (Optionnel)

**⚠️ ATTENTION: Ne faites cette étape QUE si tout fonctionne correctement!**

1. **Lire le document**: `MIGRATIONS_REDONDANTES.md`
2. **Vérifier la checklist** dans ce document
3. **Supprimer les migrations redondantes** si vous êtes sûr

## 🎯 Résultats Attendus

### Après Application de la Migration

✅ **CLINIC001 (Démo)**
- Code: `CLINIC001`
- Nom: `Clinique Démo`
- Active: `true`
- Is Demo: `true`
- Utilisateurs: 4 (admin, medecin, infirmier, receptionniste)
- Tous les utilisateurs ont status: `ACTIVE`

✅ **CAMPUS-001**
- Code: `CAMPUS-001`
- Nom: `Clinique du Campus`
- Active: `true`
- Is Demo: `false`
- Utilisateurs: 1 (bagarayannick1@gmail.com)
- Utilisateur a status: `PENDING` (jusqu'au changement de mot de passe)

✅ **Autres Cliniques**
- Aucune autre clinique ne doit exister

### Après Tests de Connexion

✅ **CLINIC001**
- Toutes les connexions réussissent
- Les données de démo sont visibles
- Chaque rôle a accès aux modules appropriés

✅ **CAMPUS-001**
- Connexion réussie après changement de mot de passe
- La clinique est vide (pas de données de démo)
- L'isolation des données fonctionne

## 📞 En Cas de Problème

### Problème: Migration échoue

1. Vérifier les logs d'erreur dans Supabase
2. Vérifier que le Super Admin existe
3. Vérifier que les tables nécessaires existent
4. Consulter `NETTOYAGE_COMPLET_RESUME.md`

### Problème: Cliniques non créées

1. Vérifier les logs de la migration
2. Exécuter `.\verify_clinics.ps1`
3. Vérifier manuellement dans Supabase Dashboard

### Problème: Connexion échoue

1. Vérifier que les utilisateurs existent
2. Vérifier les hash de mots de passe
3. Vérifier les politiques RLS
4. Consulter `GUIDE_TEST_CONNEXIONS.md`

## 📚 Documents de Référence

- **`NETTOYAGE_COMPLET_RESUME.md`** - Résumé complet du nettoyage
- **`GUIDE_TEST_CONNEXIONS.md`** - Guide de test des connexions
- **`MIGRATIONS_REDONDANTES.md`** - Liste des migrations à supprimer
- **`apply_migration_consolidated.ps1`** - Script d'application
- **`verify_clinics.ps1`** - Script de vérification

## ✅ Validation Finale

Une fois toutes les étapes terminées, vous devriez avoir:

- ✅ 2 cliniques seulement (CLINIC001 et CAMPUS-001)
- ✅ 5 utilisateurs au total (4 pour CLINIC001, 1 pour CAMPUS-001)
- ✅ Toutes les connexions fonctionnent
- ✅ Isolation des données fonctionnelle
- ✅ Code nettoyé et organisé

## 🎉 Félicitations!

Votre système est maintenant propre et configuré avec uniquement les deux cliniques nécessaires!




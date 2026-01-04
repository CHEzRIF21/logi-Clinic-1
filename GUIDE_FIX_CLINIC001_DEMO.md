# Guide de Correction : Problème de Connexion CLINIC001 (Démo)

## 🔍 Problème Identifié

L'erreur **"Code clinique 'CLINIC001' introuvable"** apparaît car :

1. ❌ La clinique **CLINIC001** n'existe pas dans la table `clinics` de Supabase
2. ❌ Les utilisateurs démo (admin, medecin, etc.) n'existent pas dans la table `users`
3. ❌ Le système cherche d'abord dans Supabase, et si la clinique n'existe pas, il affiche l'erreur

## ✅ Solution

Exécuter le script SQL qui crée :
- ✅ La clinique **CLINIC001** dans la table `clinics`
- ✅ Tous les utilisateurs démo dans la table `users` :
  - `admin` (CLINIC_ADMIN)
  - `medecin` (MEDECIN)
  - `infirmier` (INFIRMIER)
  - `receptionniste` (RECEPTIONNISTE)

## 🔧 Étapes de Correction

### 1. Exécuter le Script SQL

Ouvrez le **Tableau de bord Supabase** > **SQL Editor** et exécutez :

```sql
-- Fichier: supabase_migrations/14_CREATE_OR_VERIFY_CLINIC001_DEMO.sql
```

Ce script :
- ✅ Crée la clinique CLINIC001 si elle n'existe pas
- ✅ Crée tous les utilisateurs démo
- ✅ Configure la clinique comme permanente (non temporaire)
- ✅ Vérifie que tout est correctement configuré

### 2. Vérification

Après l'exécution, vous devriez voir :
```
✅ CLINIC001 (DÉMO) CONFIGURÉE AVEC SUCCÈS
Comptes démo disponibles:
  - admin / admin123 (CLINIC_ADMIN)
  - medecin / medecin123 (MEDECIN)
  - infirmier / infirmier123 (INFIRMIER)
  - receptionniste / receptionniste123 (RECEPTIONNISTE)
```

### 3. Test de Connexion

1. Allez sur `http://localhost:3005/login`
2. Connectez-vous avec :
   - **Code clinique** : `CLINIC001`
   - **Nom d'utilisateur** : `admin`
   - **Mot de passe** : `admin123`
3. ✅ La connexion devrait maintenant fonctionner

## 📋 Comportement Attendu

### Pour les Comptes Démo

Les comptes démo fonctionnent différemment des comptes réels :

1. **Pas d'authentification Supabase Auth** : Les comptes démo n'ont pas d'`auth_user_id`
2. **Authentification via table users** : Le système cherche dans la table `users` par email et clinic_id
3. **Mot de passe** : Pour l'instant, le système accepte si l'utilisateur existe (vérification côté serveur recommandée)

### Comptes Démo Disponibles

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `admin` | `admin123` | CLINIC_ADMIN |
| `medecin` | `medecin123` | MEDECIN |
| `infirmier` | `infirmier123` | INFIRMIER |
| `receptionniste` | `receptionniste123` | RECEPTIONNISTE |

## ⚠️ Notes Importantes

- **CLINIC001 est une clinique démo** : Elle est configurée comme permanente et ne nécessite pas de changement de code
- **Les comptes démo sont locaux** : Ils n'utilisent pas Supabase Auth, seulement la table `users`
- **Sécurité** : En production, il est recommandé d'ajouter une vérification de mot de passe côté serveur pour les comptes démo

## 🔐 Politiques RLS

Les politiques RLS doivent permettre :
- ✅ La lecture publique des cliniques actives (`clinics_public_read`)
- ✅ La lecture des utilisateurs de CLINIC001 pour l'authentification

Si vous rencontrez des erreurs de permissions après avoir créé CLINIC001, vérifiez les politiques RLS dans `supabase_migrations/11_FINAL_RLS_RECURSION_FIX.sql`.

## 🐛 Dépannage

### Erreur : "Code clinique introuvable" après exécution du script

1. Vérifiez que le script s'est exécuté sans erreur
2. Exécutez cette requête pour vérifier :
```sql
SELECT code, name, active FROM clinics WHERE code = 'CLINIC001';
```
3. Si la clinique n'existe toujours pas, réexécutez le script

### Erreur : "Email ou mot de passe incorrect"

1. Vérifiez que les utilisateurs existent :
```sql
SELECT email, role, clinic_id FROM users 
WHERE clinic_id = (SELECT id FROM clinics WHERE code = 'CLINIC001');
```
2. Vérifiez que vous utilisez le bon email (sans @ pour les comptes démo)

### Erreur de permissions RLS

1. Vérifiez que les politiques RLS sont actives :
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'clinics' AND policyname = 'clinics_public_read';
```
2. Si la politique n'existe pas, exécutez `supabase_migrations/09_FIX_RLS_CLINICS_PUBLIC_READ.sql`






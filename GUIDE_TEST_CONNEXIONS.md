# Guide de Test des Connexions

Ce guide vous permet de tester les connexions pour les deux cliniques configurées.

## 🔐 Comptes Disponibles

### CLINIC001 - Clinique Démo

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `admin` | `admin123` | CLINIC_ADMIN |
| `medecin` | `medecin123` | MEDECIN |
| `infirmier` | `infirmier123` | INFIRMIER |
| `receptionniste` | `receptionniste123` | RECEPTIONNISTE |

### CAMPUS-001 - Clinique du Campus

| Code clinique | Email | Mot de passe | Rôle |
|---------------|-------|--------------|-----|
| `CAMPUS-001` | `bagarayannick1@gmail.com` | `TempClinic2024!` | CLINIC_ADMIN |

**⚠️ Note**: Pour CAMPUS-001, le changement de mot de passe sera requis à la première connexion.

## 📋 Étapes de Test

### Test 1: Connexion CLINIC001 (Démo)

1. **Ouvrir l'application**
   - Accéder à l'URL de l'application (ex: `http://localhost:5173`)

2. **Saisir les informations**
   - Code clinique: `CLINIC001`
   - Email: `admin`
   - Mot de passe: `admin123`

3. **Vérifier la connexion**
   - ✅ La connexion doit réussir
   - ✅ Le tableau de bord doit s'afficher
   - ✅ Les données de démo doivent être visibles

4. **Tester les autres rôles**
   - Répéter avec `medecin`, `infirmier`, `receptionniste`
   - Vérifier que chaque rôle a accès aux modules appropriés

### Test 2: Connexion CAMPUS-001

1. **Ouvrir l'application**

2. **Saisir les informations**
   - Code clinique: `CAMPUS-001`
   - Email: `bagarayannick1@gmail.com`
   - Mot de passe: `TempClinic2024!`

3. **Changement de mot de passe (première connexion)**
   - ⚠️ Un formulaire de changement de mot de passe doit s'afficher
   - Saisir un nouveau mot de passe
   - Confirmer le nouveau mot de passe
   - ✅ Le changement doit réussir

4. **Vérifier la connexion**
   - ✅ La connexion doit réussir après le changement de mot de passe
   - ✅ Le tableau de bord doit s'afficher
   - ✅ La clinique doit être vide (pas de données de démo)

### Test 3: Isolation des Données

1. **Se connecter avec CLINIC001**
   - Vérifier que les données de démo sont visibles
   - Créer une nouvelle donnée (ex: un patient)

2. **Se connecter avec CAMPUS-001**
   - ✅ Les données de CLINIC001 ne doivent PAS être visibles
   - ✅ La clinique doit être vide
   - Créer une nouvelle donnée (ex: un patient)

3. **Revenir à CLINIC001**
   - ✅ Les données créées dans CAMPUS-001 ne doivent PAS être visibles
   - ✅ Seules les données de CLINIC001 doivent être visibles

## 🔍 Vérifications Supplémentaires

### Vérification dans Supabase

Exécutez le script de vérification:
```powershell
.\verify_clinics.ps1
```

Ou manuellement dans Supabase Dashboard → SQL Editor:

```sql
-- Vérifier les cliniques
SELECT code, name, active, is_demo, 
       (SELECT COUNT(*) FROM users WHERE clinic_id = clinics.id) as nb_utilisateurs
FROM clinics
WHERE code IN ('CLINIC001', 'CAMPUS-001');

-- Vérifier les utilisateurs CLINIC001
SELECT email, nom, prenom, role, status, actif
FROM users u
JOIN clinics c ON u.clinic_id = c.id
WHERE c.code = 'CLINIC001';

-- Vérifier les utilisateurs CAMPUS-001
SELECT email, nom, prenom, role, status, actif
FROM users u
JOIN clinics c ON u.clinic_id = c.id
WHERE c.code = 'CAMPUS-001';

-- Vérifier qu'il n'y a pas d'autres cliniques
SELECT COUNT(*) as autres_cliniques
FROM clinics
WHERE code NOT IN ('CLINIC001', 'CAMPUS-001');
```

### Résultats Attendus

#### CLINIC001
- ✅ `active`: `true`
- ✅ `is_demo`: `true`
- ✅ `nb_utilisateurs`: `4`
- ✅ Utilisateurs: admin, medecin, infirmier, receptionniste
- ✅ Tous les utilisateurs ont `status`: `ACTIVE`

#### CAMPUS-001
- ✅ `active`: `true`
- ✅ `is_demo`: `false`
- ✅ `nb_utilisateurs`: `1`
- ✅ Utilisateur: bagarayannick1@gmail.com (CLINIC_ADMIN)
- ✅ Utilisateur a `status`: `PENDING` (jusqu'au changement de mot de passe)

#### Autres Cliniques
- ✅ `autres_cliniques`: `0`

## ❌ Problèmes Courants

### Erreur: "Code clinique introuvable"
- **Cause**: La migration n'a pas été appliquée
- **Solution**: Exécuter `.\apply_migration_consolidated.ps1`

### Erreur: "Mot de passe incorrect"
- **Cause**: Le mot de passe a été changé ou le hash est incorrect
- **Solution**: Vérifier dans Supabase que le `password_hash` est correct

### Erreur: "Changement de mot de passe requis"
- **Cause**: Normal pour CAMPUS-001 à la première connexion
- **Solution**: Suivre le processus de changement de mot de passe

### Les données de CLINIC001 sont visibles dans CAMPUS-001
- **Cause**: Problème d'isolation des données (RLS)
- **Solution**: Vérifier les politiques RLS dans Supabase

## ✅ Checklist de Validation

- [ ] CLINIC001 existe et est active
- [ ] CAMPUS-001 existe et est active
- [ ] 4 utilisateurs démo créés pour CLINIC001
- [ ] 1 utilisateur admin créé pour CAMPUS-001
- [ ] Connexion réussie avec tous les comptes CLINIC001
- [ ] Connexion réussie avec CAMPUS-001 (après changement de mot de passe)
- [ ] Isolation des données fonctionne (pas de données partagées)
- [ ] Aucune autre clinique n'existe dans la base de données

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs de l'application
2. Vérifiez les logs Supabase
3. Exécutez `.\verify_clinics.ps1` pour diagnostiquer
4. Consultez `NETTOYAGE_COMPLET_RESUME.md` pour plus d'informations






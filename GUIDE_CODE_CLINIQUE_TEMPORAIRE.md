# Guide Complet : Système de Code Clinique Temporaire

## Vue d'ensemble

Ce système permet au Super-Admin de créer une nouvelle clinique avec un code temporaire sécurisé. L'administrateur de la clinique utilise ce code pour sa première connexion, puis définit un code permanent.

## Flux de travail

```
┌──────────────────────────────────────────────────────────────────┐
│                    CRÉATION DE CLINIQUE                          │
├──────────────────────────────────────────────────────────────────┤
│  Super-Admin                                                      │
│  ├─► Créer clinique avec nom, admin email, etc.                  │
│  ├─► Système génère code temporaire unique                        │
│  └─► Transmettre identifiants via canal sécurisé                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    PREMIÈRE CONNEXION                             │
├──────────────────────────────────────────────────────────────────┤
│  Admin Clinique                                                   │
│  ├─► Entrer code temporaire + email + mot de passe temporaire    │
│  ├─► Système valide et détecte code temporaire                   │
│  └─► Dialogue s'affiche pour définir code permanent              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    CONVERSION DU CODE                             │
├──────────────────────────────────────────────────────────────────┤
│  Admin Clinique                                                   │
│  ├─► Définir nouveau code clinique permanent                      │
│  ├─► Optionnel: changer mot de passe                             │
│  └─► Confirmer la conversion                                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    ACCÈS NORMAL                                   │
├──────────────────────────────────────────────────────────────────┤
│  Tous les utilisateurs                                            │
│  └─► Se connectent avec le code permanent                        │
└──────────────────────────────────────────────────────────────────┘
```

## Configuration Initiale

### 1. Appliquer la migration SQL

Exécutez le script SQL dans Supabase SQL Editor :

```sql
-- Fichier: supabase_migrations/06_TEMPORARY_CLINIC_CODES.sql
```

Ce script crée :
- La table `clinic_temporary_codes`
- Les colonnes nécessaires dans `users` et `clinics`
- Les fonctions SQL de validation et conversion
- Les politiques RLS de sécurité

### 2. Configuration pour CAMPUS-001

Les données suivantes sont déjà configurées :

| Paramètre | Valeur |
|-----------|--------|
| Code clinique | `CAMPUS-001` (temporaire) |
| Nom d'utilisateur | `bagarayannick1@gmail.com` |
| Mot de passe | `TempClinic2024!` |
| Validité | 72 heures après application de la migration |

## Comment le Super-Admin crée une nouvelle clinique

### Méthode 1 : Via l'interface (recommandé)

1. Se connecter en tant que Super-Admin
2. Aller dans **Paramètres** > **Gestion des cliniques**
3. Cliquer sur **Créer une clinique**
4. Remplir le formulaire :
   - Nom de la clinique
   - Email de l'administrateur
   - Nom et prénom de l'administrateur
   - Adresse, téléphone (optionnels)
5. Cliquer sur **Créer**
6. Le système affiche les identifiants à transmettre :
   - Code clinique temporaire
   - Email
   - Mot de passe temporaire

### Méthode 2 : Via l'API Edge Function

```bash
curl -X POST 'https://[PROJECT_URL]/functions/v1/create-clinic' \
  -H 'Authorization: Bearer [SUPER_ADMIN_TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{
    "clinicName": "Clinique Exemple",
    "adminEmail": "admin@exemple.com",
    "adminName": "NOM",
    "adminPrenom": "Prénom",
    "address": "123 Rue Exemple",
    "phone": "+229 00000000",
    "validityHours": 72
  }'
```

Réponse :
```json
{
  "success": true,
  "clinic": {
    "id": "uuid...",
    "code": "CLI-TEMP-ABCD1234-5678",
    "name": "Clinique Exemple"
  },
  "temporaryCode": {
    "code": "CLI-TEMP-ABCD1234-5678",
    "expiresAt": "2024-12-26T15:00:00Z",
    "validityHours": 72
  },
  "credentials": {
    "clinicCode": "CLI-TEMP-ABCD1234-5678",
    "email": "admin@exemple.com",
    "tempPassword": "(Envoyé par email)"
  }
}
```

### Méthode 3 : Via SQL Direct

```sql
SELECT * FROM create_clinic_with_temporary_code(
  p_clinic_name := 'Clinique Exemple',
  p_admin_email := 'admin@exemple.com',
  p_admin_nom := 'NOM',
  p_admin_prenom := 'Prénom',
  p_address := '123 Rue Exemple',
  p_phone := '+229 00000000',
  p_clinic_email := 'contact@exemple.com',
  p_super_admin_id := 'uuid-du-super-admin',
  p_temp_password := 'MotDePasseTemp123!',
  p_validity_hours := 72
);
```

## Comment tester la fonctionnalité

### Test 1 : Connexion avec code temporaire

1. Ouvrir l'application LogiClinic
2. Dans le formulaire de connexion, entrer :
   - **Code clinique** : `CAMPUS-001`
   - **Email** : `bagarayannick1@gmail.com`
   - **Mot de passe** : `TempClinic2024!`
3. Cliquer sur **Se connecter**
4. Le système détecte le code temporaire
5. Un dialogue s'affiche pour définir le code permanent

### Test 2 : Conversion du code

1. Dans le dialogue de conversion :
   - **Étape 1** : Entrer le nouveau code permanent (ex: `CAMPUS-MEDICAL`)
   - **Étape 2** : Optionnel - nouveau mot de passe
   - **Étape 3** : Confirmer
2. Le code est converti
3. Connexion automatique avec le nouveau code

### Test 3 : Vérification après conversion

```sql
-- Vérifier que le code a été converti
SELECT 
  c.code as clinic_code,
  c.name,
  c.is_temporary_code,
  c.requires_code_change,
  ctc.temporary_code,
  ctc.permanent_code,
  ctc.is_converted,
  ctc.converted_at
FROM clinics c
LEFT JOIN clinic_temporary_codes ctc ON ctc.clinic_id = c.id
WHERE c.code = 'CAMPUS-MEDICAL';
```

## Sécurité

### Transmission des identifiants

⚠️ **IMPORTANT** : Les identifiants temporaires doivent être transmis par un canal sécurisé :

1. **Email chiffré** (PGP/S-MIME)
2. **Portail sécurisé** avec authentification
3. **En personne** ou par appel téléphonique vérifié
4. **Application de messagerie chiffrée** (Signal, WhatsApp)

### Expiration du code temporaire

- Par défaut : **72 heures**
- Après expiration, le Super-Admin doit régénérer un nouveau code
- Les tentatives de connexion avec un code expiré sont refusées

### Protection contre les abus

- Le code temporaire ne peut être utilisé qu'une fois pour se connecter
- Après conversion, le code temporaire est définitivement invalidé
- Les logs d'audit tracent toutes les opérations

## Dépannage

### Le code temporaire a expiré

```sql
-- Générer un nouveau code temporaire pour une clinique existante
DO $$
DECLARE
  v_new_code TEXT;
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics WHERE name = 'Nom de la clinique';
  
  v_new_code := generate_secure_temporary_code('NOM');
  
  -- Supprimer l'ancien code
  DELETE FROM clinic_temporary_codes WHERE clinic_id = v_clinic_id;
  
  -- Mettre à jour la clinique
  UPDATE clinics 
  SET code = v_new_code, is_temporary_code = true, requires_code_change = true
  WHERE id = v_clinic_id;
  
  -- Créer le nouveau code temporaire
  INSERT INTO clinic_temporary_codes (clinic_id, temporary_code, expires_at)
  VALUES (v_clinic_id, v_new_code, NOW() + INTERVAL '72 hours');
  
  RAISE NOTICE 'Nouveau code: %', v_new_code;
END $$;
```

### L'utilisateur ne voit pas le dialogue de conversion

Vérifiez que :
1. La clinique a `is_temporary_code = true`
2. L'utilisateur a `status = 'PENDING'`
3. Il existe une entrée dans `clinic_temporary_codes` non convertie

```sql
SELECT 
  u.email,
  u.status,
  c.code,
  c.is_temporary_code,
  c.requires_code_change,
  ctc.is_converted
FROM users u
JOIN clinics c ON c.id = u.clinic_id
LEFT JOIN clinic_temporary_codes ctc ON ctc.clinic_id = c.id
WHERE u.email = 'email@exemple.com';
```

### Réinitialiser le statut temporaire

```sql
UPDATE clinics 
SET is_temporary_code = true, requires_code_change = true
WHERE code = 'CODE-CLINIQUE';

UPDATE users 
SET status = 'PENDING', temp_code_used = false
WHERE email = 'admin@clinique.com';

UPDATE clinic_temporary_codes 
SET is_used = false, is_converted = false, converted_at = NULL
WHERE temporary_code = 'CODE-CLINIQUE';
```

## Architecture technique

### Tables impliquées

| Table | Description |
|-------|-------------|
| `clinics` | Informations de la clinique avec flags temporaires |
| `clinic_temporary_codes` | Historique et gestion des codes temporaires |
| `users` | Utilisateurs avec indicateur d'utilisation du code temp |

### Fonctions SQL

| Fonction | Description |
|----------|-------------|
| `generate_secure_temporary_code(name)` | Génère un code temporaire unique |
| `validate_temporary_code(code, email)` | Valide un code temporaire |
| `mark_temporary_code_used(code, user_id)` | Marque le code comme utilisé |
| `convert_temporary_to_permanent_code(...)` | Convertit en code permanent |
| `create_clinic_with_temporary_code(...)` | Crée une clinique avec code temp |

### Edge Functions

| Fonction | Endpoint | Description |
|----------|----------|-------------|
| `create-clinic` | POST `/functions/v1/create-clinic` | Crée une clinique avec code temporaire |
| `convert-clinic-code` | POST `/functions/v1/convert-clinic-code` | Convertit le code temporaire |

## Résumé pour le Super-Admin

1. **Créer la clinique** via l'interface ou l'API
2. **Noter les identifiants** générés (code temp, email, mot de passe)
3. **Transmettre sécuritairement** les identifiants à l'admin clinique
4. **L'admin se connecte** et définit le code permanent
5. **Vérifier** que la conversion a réussi
6. **Communiquer** le nouveau code aux autres utilisateurs de la clinique

---

**Date de création** : Décembre 2024  
**Version** : 1.0  
**Auteur** : Système LogiClinic


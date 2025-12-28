# 🚀 Guide Rapide : Création d'une Clinique

## ✅ Syntaxe Correcte

### Méthode 1 : Avec noms de paramètres (RECOMMANDÉ)

Cette méthode est plus claire et évite les erreurs d'ordre :

```sql
SELECT super_admin_create_clinic(
  p_clinic_name := 'Clinique Test LogiClinic',
  p_admin_email := 'admin@test.bj',
  p_clinic_address := '123 Rue Test, Cotonou, Bénin',
  p_clinic_phone := '+229 21 12 34 56',
  p_clinic_email := 'contact@test.bj',
  p_admin_nom := 'Koffi',
  p_admin_prenom := 'Jean',
  p_admin_telephone := '+229 97 12 34 56',
  p_is_demo := false
);
```

### Méthode 2 : Syntaxe positionnelle

⚠️ **Attention à l'ordre des paramètres !**

```sql
SELECT super_admin_create_clinic(
  'Clinique Test LogiClinic',  -- 1. p_clinic_name (REQUIS)
  'admin@test.bj',              -- 2. p_admin_email (REQUIS)
  '123 Rue Test, Cotonou',      -- 3. p_clinic_address (optionnel)
  '+229 21 12 34 56',           -- 4. p_clinic_phone (optionnel)
  'contact@test.bj',            -- 5. p_clinic_email (optionnel)
  'Koffi',                      -- 6. p_admin_nom (optionnel)
  'Jean',                       -- 7. p_admin_prenom (optionnel)
  '+229 97 12 34 56',           -- 8. p_admin_telephone (optionnel)
  false                         -- 9. p_is_demo (optionnel)
);
```

### Méthode 3 : Minimum requis

Pour créer une clinique avec seulement les paramètres obligatoires :

```sql
SELECT super_admin_create_clinic(
  p_clinic_name := 'Clinique Test',
  p_admin_email := 'admin@test.bj'
);
```

Les valeurs par défaut seront utilisées :
- `p_admin_nom` = 'Admin'
- `p_admin_prenom` = 'Clinique'
- `p_is_demo` = false
- Autres champs = NULL

## 📋 Ordre des Paramètres

1. **p_clinic_name** (TEXT, **REQUIS**) - Nom de la clinique
2. **p_admin_email** (TEXT, **REQUIS**) - Email de l'admin
3. p_clinic_address (TEXT, optionnel) - Adresse de la clinique
4. p_clinic_phone (TEXT, optionnel) - Téléphone de la clinique
5. p_clinic_email (TEXT, optionnel) - Email de la clinique
6. p_admin_nom (TEXT, optionnel, défaut: 'Admin') - Nom de l'admin
7. p_admin_prenom (TEXT, optionnel, défaut: 'Clinique') - Prénom de l'admin
8. p_admin_telephone (TEXT, optionnel) - Téléphone de l'admin
9. p_is_demo (BOOLEAN, optionnel, défaut: false) - Est-ce une clinique démo ?

## ✅ Résultat Attendu

```json
{
  "success": true,
  "clinic": {
    "id": "uuid-de-la-clinique",
    "code": "CLIN-2025-001",
    "name": "Clinique Test LogiClinic",
    "active": true
  },
  "admin": {
    "id": "uuid-de-l-admin",
    "email": "admin@test.bj",
    "nom": "Koffi",
    "prenom": "Jean",
    "role": "CLINIC_ADMIN",
    "status": "PENDING"
  },
  "temp_password": "TempXXXXXX!",
  "message": "Clinique créée avec succès. L'admin doit se connecter avec le code clinique et changer son mot de passe."
}
```

## 🔑 Informations Importantes

- **Code clinique** : Généré automatiquement (format: `CLIN-YYYY-XXX`)
- **Mot de passe temporaire** : Généré automatiquement et retourné dans le résultat
- **Status admin** : `PENDING` (devra changer son mot de passe à la première connexion)
- **Première connexion** : L'admin devra utiliser le code clinique + email + mot de passe temporaire

## ⚠️ Erreurs Courantes

### Erreur : "syntax error at or near 'admin'"

**Cause :** Ordre incorrect des paramètres ou guillemets manquants

**Solution :** Utiliser la syntaxe avec noms de paramètres (Méthode 1)

### Erreur : "Seul un Super Admin peut créer une clinique"

**Cause :** L'utilisateur connecté n'est pas Super Admin

**Solution :** 
- Vérifier que vous êtes connecté en tant que Super Admin
- Ou créer un Super Admin d'abord

---

**Date :** 2025-01-XX  
**Version :** 1.0


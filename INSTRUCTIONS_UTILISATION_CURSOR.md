# Instructions : Utiliser Cursor pour Gérer le Backend LogiClinic

## 🎯 Objectif

Ce guide vous montre comment utiliser efficacement Cursor pour déboguer, corriger et améliorer votre backend LogiClinic avec Supabase.

---

## 📚 Guide Complet

Consultez le fichier **`GUIDE_DEBUGGING_CURSOR_BACKEND.md`** pour la méthodologie complète.

---

## 🚀 Démarrage Rapide

### 1. Préparer Cursor

✅ **Ouvrez tout le projet backend dans Cursor :**
- `server/` (backend Node.js/Express)
- `supabase/` (migrations et Edge Functions)
- `.env` ou `config.env` (variables d'environnement)

### 2. Identifier un Problème

❌ **Ne commencez JAMAIS par :** "Corrige mon code"

✅ **Commencez par décrire le bug fonctionnel :**
> "Quand je crée une clinique, l'admin n'est pas associé à la clinique et ne peut pas se connecter avec le code clinique."

### 3. Utiliser Cursor

1. **Ouvrez le fichier concerné** (ex : `createClinic.ts`)
2. **Sélectionnez la fonction**
3. **Appuyez sur `Cmd + K` / `Ctrl + K`**
4. **Écrivez :**
   ```
   Analyse cette fonction et dis-moi pourquoi la clinique n'est pas liée à l'administrateur.
   ```

---

## 🔧 Corrections Appliquées

### ✅ Login Backend avec Clinic Code

**Fichier :** `server/src/routes/auth.ts`

Le login vérifie maintenant **obligatoirement** le `clinic_code` :

```typescript
// Avant : ❌ Pas de vérification du clinic_code
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single();

// Après : ✅ Vérification clinic_code + email + password
const { data: loginResult } = await supabase.rpc('validate_clinic_login', {
  p_clinic_code: clinicCodeUpper,
  p_email: emailLower,
  p_password: password,
});
```

### ✅ Configuration Supabase Centralisée

**Fichier :** `server/src/config/supabase.ts`

- Validation automatique des variables d'environnement
- Support pour client standard et admin
- Messages d'erreur clairs

### ✅ Système de Logs Intelligents

**Fichier :** `server/src/utils/logger.ts`

Logs structurés pour faciliter le débogage :

```typescript
import { logger } from '../utils/logger';

logger.clinicCreateStart({ name: 'Clinique Test', code: 'TEST-001' });
logger.loginAttempt({ clinicCode: 'TEST-001', email: 'admin@test.com' });
logger.loginSuccess({ userId: '...', email: '...', role: '...', clinicCode: '...' });
```

---

## 📋 Checklist de Vérification

### Variables d'Environnement

Vérifiez que vous avez dans `server/.env` ou `server/config.env` :

```env
SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key  # Optionnel mais recommandé
```

### Tests à Effectuer

1. **Test de connexion :**
   ```bash
   POST /api/auth/login
   {
     "clinicCode": "CLINIC-001",
     "email": "admin@example.com",
     "password": "password123"
   }
   ```

2. **Vérification des logs :**
   - Les logs doivent apparaître avec le format structuré
   - Vérifier que les catégories sont correctes

---

## 💡 Commandes Cursor Utiles

### Pour Analyser
```
Analyse cette fonction et explique ce qu'elle fait.
```

### Pour Corriger
```
Corrige uniquement [problème spécifique] sans changer le reste.
```

### Pour Refactoriser
```
Refactorise cette fonction en utilisant une transaction.
Si [condition] échoue, [action] doit être annulée.
```

### Pour Ajouter des Logs
```
Ajoute des logs clairs pour suivre [étapes spécifiques].
```

---

## 📚 Documentation

- **Guide complet :** `GUIDE_DEBUGGING_CURSOR_BACKEND.md`
- **Résumé des corrections :** `CORRECTIONS_SUPABASE_CURSOR_RESUME.md`
- **Configuration :** `server/ENV_SETUP.md`

---

## ⚠️ Points d'Attention

1. **Sécurité :**
   - Ne jamais utiliser `SUPABASE_SERVICE_ROLE_KEY` dans le frontend
   - Toujours valider `clinic_code` dans les requêtes

2. **Performance :**
   - Utiliser les fonctions RPC pour les opérations complexes
   - Éviter les requêtes multiples quand une seule suffit

3. **Débogage :**
   - Utiliser les logs structurés pour identifier les problèmes
   - Tester étape par étape avec Cursor

---

## 🎯 Résultat

✅ **Backend sécurisé** avec vérification obligatoire du `clinic_code`
✅ **Logs structurés** pour faciliter le débogage
✅ **Configuration centralisée** et validée
✅ **Guide complet** pour utiliser Cursor efficacement

---

**Date :** 2024-01-15
**Version :** 1.0.0


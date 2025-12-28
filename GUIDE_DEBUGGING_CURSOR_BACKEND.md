# Guide Complet : Utiliser Cursor pour Gérer et Corriger le Backend LogiClinic

## 📋 Table des Matières
1. [Préparation de Cursor](#1-préparation-de-cursor)
2. [Identification des Problèmes](#2-identification-des-problèmes)
3. [Méthode de Correction Étape par Étape](#3-méthode-de-correction-étape-par-étape)
4. [Correction des Transactions](#4-correction-des-transactions)
5. [Système de Logs Intelligents](#5-système-de-logs-intelligents)
6. [Vérification de l'Authentification](#6-vérification-de-lauthentification)
7. [Cas Concrets LogiClinic](#7-cas-concrets-logiclinic)

---

## 1️⃣ Préparation de Cursor

### ✅ Ouvrir le Bon Contexte

**Avant de corriger quoi que ce soit, Cursor doit comprendre ton projet.**

1. **Ouvre tout le projet backend** (pas seulement un fichier)
   - `server/` (backend Node.js/Express)
   - `src/services/` (services frontend)
   - `supabase/` (migrations et Edge Functions)
   - `.env` ou `config.env` (variables d'environnement)

2. **Vérifie que tu as :**
   ```
   server/
     ├── src/
     │   ├── routes/        # Routes API
     │   ├── services/       # Services métier
     │   ├── controllers/    # Contrôleurs
     │   └── supabaseClient.ts
     ├── config.env         # Variables d'environnement
     └── package.json
   
   supabase/
     ├── migrations/        # Migrations SQL
     └── functions/         # Edge Functions
   ```

3. **Cursor lit l'architecture complète** pour proposer des corrections cohérentes.

---

## 2️⃣ Identification des Problèmes

### ❌ Ne Commence JAMAIS par "Corrige mon code"

### ✅ Commence par Décrire le Bug Fonctionnel

**Exemple (inspiré de LogiClinic) :**
> "Quand je crée une clinique, l'admin n'est pas associé à la clinique et ne peut pas se connecter avec le code clinique."

### 🔍 Processus d'Identification

1. **Ouvre le fichier concerné** (ex : `createClinic.ts`)
2. **Sélectionne la fonction**
3. **Appuie sur `Cmd + K` / `Ctrl + K`**
4. **Écris :**
   ```
   Analyse cette fonction et dis-moi pourquoi la clinique n'est pas liée à l'administrateur.
   ```

---

## 3️⃣ Méthode de Correction Étape par Étape

### ❌ Mauvaise Approche
- "Refais tout le backend"
- "Optimise tout"

### ✅ Bonne Approche (Celle à Utiliser)

Cursor fonctionne mieux par **micro-tâches** :

### Étape 1 – Analyse
```
Analyse ce code.
Explique ce qu'il fait exactement.
Liste les erreurs potentielles.
```

### Étape 2 – Hypothèse
```
Pourquoi l'admin n'est pas associé à la clinique ?
Est-ce un problème de transaction, de clé étrangère ou de logique ?
```

### Étape 3 – Correction Ciblée
```
Corrige uniquement la logique d'association clinique → admin
sans changer le reste.
```

---

## 4️⃣ Correction des Transactions

### 🎯 Cas Concret : Création de Clinique

**Sélectionne le code de création et demande :**

```
Refactorise cette fonction en utilisant une transaction.
Si la création de l'admin échoue, la clinique doit être annulée.
```

**Cursor va souvent te proposer :**
- `transaction()`
- `try / catch`
- `rollback automatique`

### ⚠️ Accepte Seulement si tu Comprends

Si tu ne comprends pas, demande :
```
Explique chaque ligne du code que tu proposes.
```

---

## 5️⃣ Système de Logs Intelligents

### 🔍 Demande à Cursor

```
Ajoute des logs backend clairs pour suivre :
1) création clinique
2) génération code
3) création admin
4) association clinique-admin
```

### 📊 Exemple de Logs Structurés

```typescript
// Dans createClinic.ts
console.log('[CLINIC_CREATE] Début création clinique:', { name, code });
console.log('[CLINIC_CREATE] Clinique créée:', { clinicId, code });
console.log('[ADMIN_CREATE] Création admin:', { email, clinicId });
console.log('[ADMIN_CREATE] Admin créé:', { userId, clinicId });
console.log('[ASSOCIATION] Liaison admin-clinique:', { userId, clinicId });
```

**Tu verras exactement où ça casse.**

---

## 6️⃣ Vérification de l'Authentification

### 🔐 Dans LogiClinic, la Connexion Dépend de :

- `clinic_code`
- `username` (email)
- `password`

### ⚠️ Erreur Fréquente

**Beaucoup de bugs viennent d'un `findUser(username)` au lieu de `findUser(username, clinic_code)`.**

### ✅ Demande à Cursor

```
Vérifie la fonction de login.
Assure-toi que l'utilisateur est recherché
avec le clinic_code + username.
```

### 📝 Exemple de Correction

**❌ Avant (INCORRECT) :**
```typescript
const user = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single();
```

**✅ Après (CORRECT) :**
```typescript
// 1. Récupérer la clinique par code
const { data: clinic } = await supabase
  .from('clinics')
  .select('id')
  .eq('code', clinicCode)
  .single();

// 2. Rechercher l'utilisateur avec clinic_id
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .eq('clinic_id', clinic.id)  // ← IMPORTANT !
  .single();
```

---

## 7️⃣ Cas Concrets LogiClinic

### 🏗️ Structure Backend Recommandée

Cursor t'aidera mieux si ta logique est claire :

```sql
-- Table clinics
CREATE TABLE clinics (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,  -- CLIN-2024-001
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true
);

-- Table users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  role TEXT NOT NULL,
  clinic_id UUID REFERENCES clinics(id),  -- ← FK importante
  password_hash TEXT,
  actif BOOLEAN DEFAULT true
);
```

### ⚠️ Erreur Fréquente (que Cursor Détecte Souvent)

**Création de la clinique ✅**
**Création de l'admin ✅**
**MAIS :**
- `clinic_id` non passé à l'admin
- **OU** transaction non atomique

### 🔧 Correction avec Transaction

```typescript
// Exemple avec Supabase Edge Function
async function createClinicWithAdmin(data) {
  const { clinicName, adminEmail, adminPassword } = data;
  
  // Démarrer une transaction (via RPC SQL)
  const { data: result, error } = await supabase.rpc(
    'create_clinic_with_admin',
    {
      p_clinic_name: clinicName,
      p_admin_email: adminEmail,
      p_admin_password: adminPassword
    }
  );
  
  if (error) {
    // La transaction a échoué, tout est rollback
    throw new Error(`Échec création: ${error.message}`);
  }
  
  return result;
}
```

---

## 🎯 Checklist de Débogage avec Cursor

### Avant de Commencer
- [ ] J'ai ouvert tout le projet backend dans Cursor
- [ ] J'ai vérifié les variables d'environnement (.env)
- [ ] J'ai identifié le problème fonctionnel (pas juste "ça marche pas")

### Pendant la Correction
- [ ] J'ai demandé à Cursor d'analyser AVANT de corriger
- [ ] J'ai compris chaque ligne de code proposée
- [ ] J'ai testé la correction étape par étape

### Après la Correction
- [ ] J'ai vérifié que la transaction est atomique
- [ ] J'ai ajouté des logs pour le débogage futur
- [ ] J'ai testé le cas d'erreur (rollback)

---

## 📚 Commandes Cursor Utiles

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
```

### Pour Ajouter des Logs
```
Ajoute des logs clairs pour suivre [étapes spécifiques].
```

### Pour Vérifier
```
Vérifie que [condition spécifique] est respectée.
```

---

## 🚀 Prochaines Étapes

1. **Applique ce guide** à tes problèmes actuels
2. **Utilise Cursor étape par étape** (pas tout d'un coup)
3. **Teste après chaque correction**
4. **Documente les corrections** pour référence future

---

**💡 Astuce :** Sauvegarde ce guide et référence-le chaque fois que tu débogues avec Cursor !


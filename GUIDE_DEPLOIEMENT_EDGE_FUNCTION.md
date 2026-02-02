# Guide de Déploiement de l'Edge Function API

## ✅ Actions déjà effectuées

### 1. Nettoyage des demandes orphelines
- **6 demandes** avec `clinic_id: null` ont été supprimées
- Ces demandes ne pouvaient pas être affichées car elles n'étaient associées à aucune clinique

### 2. Ajout des colonnes manquantes
- Colonne `auth_user_id` (UUID) ajoutée à `registration_requests`
- Colonne `clinic_code` (VARCHAR) ajoutée à `registration_requests`
- Index créé sur `auth_user_id` pour les performances

### 3. Corrections du code
- Routes d'approbation/rejet corrigées dans `supabase/functions/api/auth.ts`
- Support des deux formats de routes (nouveau et ancien)
- Logging détaillé ajouté pour le debugging

## 🚀 Déploiement de l'Edge Function

### ⚠️ IMPORTANT : Installation Supabase CLI

**`npm install -g supabase` ne fonctionne plus sur Windows !**

Utilise une de ces alternatives :

### Option 1 : Via npx (RECOMMANDÉ - Pas d'installation nécessaire)

```bash
cd "c:\Users\Mustafa\Desktop\logi Clinic 1"

# D'abord, authentifie-toi avec ton access token Supabase
$env:SUPABASE_ACCESS_TOKEN="ton-access-token-ici"
npx supabase login --token $env:SUPABASE_ACCESS_TOKEN

# Ensuite, déploie la fonction
npx supabase functions deploy api --project-ref bnfgemmlokvetmohiqch
```

**Pour obtenir ton access token :**
1. Va sur https://supabase.com/dashboard/account/tokens
2. Crée un nouveau token ou copie un existant
3. Remplace `ton-access-token-ici` par ce token

### Option 2 : Installer via Scoop (Installation permanente)

Si tu veux installer Supabase CLI de façon permanente :

```powershell
# 1. Installer Scoop (si pas déjà installé)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
iwr -useb get.scoop.sh | iex

# 2. Installer Supabase CLI via Scoop
scoop install supabase

# 3. Authentifier
supabase login --token ton-access-token

# 4. Déployer
cd "c:\Users\Mustafa\Desktop\logi Clinic 1"
supabase functions deploy api --project-ref bnfgemmlokvetmohiqch
```

### Option 3 : Installer comme dépendance du projet

```bash
cd "c:\Users\Mustafa\Desktop\logi Clinic 1"
npm install supabase --save-dev
npx supabase login --token ton-access-token
npx supabase functions deploy api --project-ref bnfgemmlokvetmohiqch
```

### Option 3 : Via Supabase Dashboard

1. Va sur https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch
2. Clique sur **Edge Functions** dans le menu de gauche
3. Clique sur **Deploy** ou **Update** pour la fonction `api`
4. Upload les fichiers depuis `supabase/functions/api/`

### Option 4 : Via l'interface web Supabase

1. Va sur https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/functions
2. Sélectionne la fonction `api`
3. Copie-colle le contenu de `supabase/functions/api/index.ts` dans l'éditeur
4. Pour chaque fichier importé (`auth.ts`, `patients.ts`, etc.), crée un fichier séparé avec son contenu
5. Clique sur **Deploy**

## 📋 Fichiers à déployer

L'Edge Function `api` nécessite ces fichiers :

```
supabase/functions/api/
├── index.ts          (point d'entrée principal)
├── auth.ts           (handler authentification - MODIFIÉ)
├── patients.ts       (handler patients)
├── invoices.ts       (handler factures)
├── pharmacy.ts       (handler pharmacie)
├── operations.ts     (handler opérations)
├── statistics.ts     (handler statistiques)
├── products.ts       (handler produits)
└── caisse.ts         (handler caisse)

supabase/functions/_shared/
├── cors.ts           (utilitaires CORS)
└── supabase.ts       (client Supabase)
```

## ✅ Vérification après déploiement

1. **Tester l'inscription** :
   - Va sur la page d'inscription
   - Inscris un nouveau membre avec un code clinique valide (ex: "ITA")
   - Vérifie dans la console du navigateur les logs :
     - `📝 Inscription - Code clinique saisi: ...`
     - `🏥 Clinique trouvée: ...`
     - `✅ clinic_id pour la demande: ...`

2. **Vérifier les demandes** :
   - Connecte-toi en tant qu'admin de la clinique (ex: "ITA Admin")
   - Va sur "Demandes d'inscription"
   - La nouvelle demande devrait apparaître avec le bon `clinic_id`

3. **Vérifier les logs Supabase** :
   - Va sur https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/logs/edge-functions
   - Sélectionne la fonction `api`
   - Tu devrais voir les logs détaillés lors des inscriptions

## 🔍 En cas de problème

Si les demandes ne s'affichent toujours pas :

1. **Vérifie les logs Edge Function** dans le dashboard Supabase
2. **Vérifie que le code clinique** saisi correspond bien à une clinique active
3. **Vérifie que l'admin** a bien un `clinic_id` dans la table `users`
4. **Vérifie dans la base** que la demande a bien été créée avec un `clinic_id` :
   ```sql
   SELECT id, email, clinic_id, clinic_code, statut 
   FROM registration_requests 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

## 📝 Notes importantes

- Les colonnes `auth_user_id` et `clinic_code` sont maintenant présentes dans la table
- Les nouvelles inscriptions devraient automatiquement avoir le `clinic_id` correct
- Le logging détaillé permettra de débugger facilement les problèmes futurs

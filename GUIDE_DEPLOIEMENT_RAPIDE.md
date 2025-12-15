# 🚀 Guide de Déploiement Rapide - Supabase Edge Functions

## ⚡ Déploiement en 3 étapes

### Étape 1 : Obtenir votre token Supabase

1. Allez sur : https://supabase.com/dashboard/account/tokens
2. Cliquez sur **"Generate new token"**
3. Donnez-lui un nom (ex: "Logi Clinic Deployment")
4. **Copiez le token** (vous ne pourrez plus le voir après)

### Étape 2 : Lier votre projet

Ouvrez PowerShell dans le dossier du projet et exécutez :

```powershell
# Définir le token (remplacez YOUR_TOKEN par votre token)
$env:SUPABASE_ACCESS_TOKEN='YOUR_TOKEN'

# Lier le projet
npx supabase link --project-ref bnfgemmlokvetmohiqch
```

### Étape 3 : Déployer les fonctions

```powershell
npx supabase functions deploy api
```

## ✅ Vérification

Une fois déployé, testez votre API :

```powershell
# Test health check
curl https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api/health
```

## 🔑 Configuration des Secrets

**Important** : Configurez les secrets sur Supabase Dashboard :

1. Allez sur : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/settings/functions
2. Section **"Secrets"**
3. Ajoutez :

| Secret | Valeur |
|--------|--------|
| `SUPABASE_URL` | `https://bnfgemmlokvetmohiqch.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8` |

## 🌐 Configuration Frontend Vercel

Dans **Vercel Dashboard** → **Votre projet** → **Settings** → **Environment Variables**, ajoutez :

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api` |
| `VITE_SUPABASE_URL` | `https://bnfgemmlokvetmohiqch.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8` |

## 📝 Script Automatique

Vous pouvez aussi utiliser le script PowerShell :

```powershell
.\deploy-supabase.ps1
```

## ⚠️ Notes Importantes

1. **Toutes les requêtes** nécessitent le header :
   ```
   Authorization: Bearer YOUR_ANON_KEY
   ```

2. **Routes implémentées** :
   - ✅ `/api/auth/*` (login, register, etc.)
   - ✅ `/api/patients/*`
   - ✅ `/api/invoices/*`
   - ✅ `/api/pharmacy/*`
   - ⚠️ Autres routes retournent 501 (à implémenter)

3. **Mise à jour** : Après modification, redéployez avec :
   ```powershell
   npx supabase functions deploy api
   ```

## 🆘 Dépannage

### Erreur : "Function not found"
- Vérifiez que la fonction est déployée : `npx supabase functions list`
- Vérifiez l'URL : doit être `/functions/v1/api`

### Erreur : "Unauthorized"
- Ajoutez le header `Authorization: Bearer YOUR_ANON_KEY`
- Vérifiez que les secrets sont configurés

### Erreur : "Database error"
- Vérifiez que les tables existent dans Supabase
- Vérifiez les permissions RLS

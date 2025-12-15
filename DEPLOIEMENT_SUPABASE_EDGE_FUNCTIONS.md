# 🚀 Guide de Déploiement - Supabase Edge Functions

Ce guide vous explique comment déployer votre backend en tant que Supabase Edge Functions.

## 📋 Prérequis

1. **Supabase CLI installé** :
```powershell
npm install -g supabase
```

2. **Authentification Supabase** :
```powershell
supabase login
```

## 🔧 Configuration

### 1. Lier votre projet Supabase

```powershell
cd "c:\Users\Mustafa\Desktop\logi Clinic 1"
supabase link --project-ref bnfgemmlokvetmohiqch
```

### 2. Déployer les Edge Functions

```powershell
supabase functions deploy api
```

## 🔑 Configuration des Variables d'Environnement

### Sur Supabase Dashboard

1. Allez sur https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch
2. **Settings** → **Edge Functions** → **Secrets**
3. Ajoutez ces secrets :

| Secret | Valeur |
|--------|--------|
| `SUPABASE_URL` | `https://bnfgemmlokvetmohiqch.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8` |

### Via CLI (Alternative)

```powershell
supabase secrets set SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8
```

## 🌐 URL de votre API

Une fois déployé, votre API sera accessible à :

```
https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api
```

## ⚙️ Configuration Frontend sur Vercel

Dans le **Dashboard Vercel** de votre projet frontend, ajoutez ces variables d'environnement :

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api` |
| `VITE_SUPABASE_URL` | `https://bnfgemmlokvetmohiqch.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8` |

## ✅ Vérification

### Tester l'API

```powershell
# Test health check
curl https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api/health

# Test avec authentification
curl -X POST https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## 📝 Notes Importantes

1. **Toutes les requêtes** vers les Edge Functions nécessitent un header `Authorization: Bearer YOUR_ANON_KEY`
2. Les **routes principales** (auth, patients, invoices) sont implémentées
3. Les **autres routes** retournent 501 (Not Implemented) - vous pouvez les implémenter progressivement
4. Les Edge Functions utilisent **Deno**, pas Node.js

## 🔄 Mise à jour des Functions

Pour mettre à jour après modification :

```powershell
supabase functions deploy api
```

## 🐛 Dépannage

### Erreur : "Function not found"
- Vérifiez que la fonction est bien déployée : `supabase functions list`
- Vérifiez que vous utilisez la bonne URL : `/functions/v1/api`

### Erreur : "Unauthorized"
- Vérifiez que le header `Authorization: Bearer YOUR_ANON_KEY` est présent
- Vérifiez que `SUPABASE_ANON_KEY` est bien configuré dans les secrets

### Erreur : "Database error"
- Vérifiez que les tables existent dans Supabase
- Vérifiez les permissions RLS (Row Level Security) sur les tables

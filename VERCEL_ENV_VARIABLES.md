# 🔑 Variables d'Environnement pour Vercel

## 📋 Configuration sur Vercel Dashboard

Allez sur : **https://vercel.com/dashboard** → **Votre projet** → **Settings** → **Environment Variables**

## ✅ Variables OBLIGATOIRES à ajouter

### 1. VITE_API_URL
**Valeur :**
```
https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api
```

**Description :** URL de votre API backend (Supabase Edge Functions)

**Environnements :** ✅ Production, ✅ Preview, ✅ Development

---

### 2. VITE_SUPABASE_URL
**Valeur :**
```
https://bnfgemmlokvetmohiqch.supabase.co
```

**Description :** URL de votre projet Supabase

**Environnements :** ✅ Production, ✅ Preview, ✅ Development

---

### 3. VITE_SUPABASE_ANON_KEY
**Valeur :**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8
```

**Description :** Clé anonyme (publishable) de votre projet Supabase

**Environnements :** ✅ Production, ✅ Preview, ✅ Development

---

## 📝 Instructions étape par étape

1. **Connectez-vous à Vercel** : https://vercel.com/dashboard

2. **Sélectionnez votre projet** : `logi-clinic-1` (ou le nom de votre projet)

3. **Allez dans Settings** → **Environment Variables**

4. **Pour chaque variable** :
   - Cliquez sur **"Add New"**
   - Entrez le **Key** (nom de la variable)
   - Entrez la **Value** (valeur ci-dessus)
   - **Cochez** : Production, Preview, Development
   - Cliquez sur **"Save"**

5. **Redéployez votre projet** :
   - Allez dans l'onglet **"Deployments"**
   - Cliquez sur les **3 points** du dernier déploiement
   - Sélectionnez **"Redeploy"**

## ⚠️ Important

- **Ne mettez PAS d'espaces** avant ou après les valeurs
- **Copiez-collez exactement** les valeurs ci-dessus
- **Cochez les 3 environnements** (Production, Preview, Development)
- **Redéployez** après avoir ajouté les variables

## ✅ Vérification

Après le redéploiement, vérifiez que :
- ✅ L'application se charge sans erreur
- ✅ Pas d'erreur dans la console : "VITE_API_URL n'est pas configuré"
- ✅ Connexion Supabase réussie (message dans la console)
- ✅ Les fonctionnalités de l'application fonctionnent

## 🔍 Où obtenir les clés Supabase

Si vous devez régénérer vos clés :
1. Allez sur : https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/settings/api
2. **Project URL** → Copiez pour `VITE_SUPABASE_URL`
3. **anon public** key → Copiez pour `VITE_SUPABASE_ANON_KEY`

## 🆘 Dépannage

### Erreur : "VITE_API_URL n'est pas configuré"
- Vérifiez que la variable est bien ajoutée sur Vercel
- Vérifiez que vous avez redéployé après avoir ajouté la variable
- Vérifiez que les 3 environnements sont cochés

### Erreur : "Configuration Supabase non valide"
- Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont correctement configurées
- Vérifiez qu'il n'y a pas d'espaces dans les valeurs
- Vérifiez que vous utilisez la clé "anon public" et non "service_role"

### L'application ne se connecte pas à l'API
- Vérifiez que `VITE_API_URL` pointe vers : `https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api`
- Vérifiez que les Edge Functions Supabase sont bien déployées
- Testez l'API directement : `curl https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api/health`







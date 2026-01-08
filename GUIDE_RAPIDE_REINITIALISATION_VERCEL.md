# 🚀 Guide Rapide - Réinitialisation Vercel

## ⚡ Actions rapides (5 minutes)

### 1. Créer le projet Vercel
- Aller sur https://vercel.com/dashboard
- "Add New" → "Project"
- Importer depuis Git ou utiliser Vercel CLI

### 2. Configurer les 3 variables (CRITIQUE)

**Settings → Environment Variables → Add New**

Copier-coller ces 3 variables (voir `VERCEL_ENV_VARIABLES_EXACTES.txt` pour les valeurs exactes) :

```
VITE_API_URL = https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api
VITE_SUPABASE_URL = https://bnfgemmlokvetmohiqch.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8
```

**⚠️ Pour chaque variable :**
- Cocher ✅ Production
- Cocher ✅ Preview
- Cocher ✅ Development
- Cliquer sur Save

### 3. Ajouter le domaine
- Settings → Domains → Add Domain
- Entrer : `logiclinic.org`
- Configurer les DNS selon les instructions Vercel

### 4. Déployer
- Deployments → Redeploy
- OU : Push sur Git (si connecté)

### 5. Vérifier
- Ouvrir `https://logiclinic.org`
- Vérifier que la page se charge
- Ouvrir F12 → Console → Vérifier qu'il n'y a pas d'erreurs

---

## ⚠️ Points critiques

1. **Redéployer** après avoir ajouté les variables d'environnement
2. Les variables doivent commencer par `VITE_`
3. Cocher les 3 environnements pour chaque variable
4. Attendre la propagation DNS (5-30 min)

---

## 📚 Documentation complète

- **Guide détaillé :** `REINITIALISATION_VERCEL_COMPLETE.md`
- **Variables exactes :** `VERCEL_ENV_VARIABLES_EXACTES.txt`
- **Checklist :** `CHECKLIST_DEPLOIEMENT_VERCEL_FINAL.md`
- **Résumé :** `RESUME_REINITIALISATION_VERCEL.md`

---

**Domaine :** logiclinic.org  
**Projet :** Logi Clinic







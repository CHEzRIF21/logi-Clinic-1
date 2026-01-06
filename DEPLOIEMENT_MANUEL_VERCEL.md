# 🚀 Guide de Déploiement Manuel sur Vercel

## Problème Identifié

Vos modifications locales (comme le champ "Code Clinique") ne sont pas visibles sur votre domaine `logiclinic.org` car :

1. **Le projet n'est pas connecté à Git** : Vercel se base généralement sur Git pour détecter les changements
2. **Le déploiement n'a pas été déclenché** : Les modifications locales nécessitent un déploiement manuel
3. **Cache possible** : Vercel ou le navigateur peut avoir mis en cache l'ancienne version

## Solutions

### Solution 1 : Déploiement via Vercel CLI (Recommandé)

1. **Installer Vercel CLI** (si pas déjà fait) :
   ```powershell
   npm install -g vercel
   ```

2. **Lier le projet** (si pas déjà fait) :
   ```powershell
   vercel link
   ```
   - Suivez les instructions pour sélectionner votre projet existant

3. **Déployer en production** :
   ```powershell
   vercel --prod
   ```

4. **Ou utiliser le script automatique** :
   ```powershell
   .\deploy-vercel.ps1
   ```

### Solution 2 : Déploiement via Dashboard Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet `logi-clinic-1`
4. Allez dans l'onglet **"Deployments"**
5. Cliquez sur **"Redeploy"** sur le dernier déploiement
6. Ou créez un nouveau déploiement en uploadant le dossier `build/`

### Solution 3 : Connecter à Git (Solution Long Terme)

Pour que Vercel déploie automatiquement à chaque changement :

1. **Initialiser Git** (si pas déjà fait) :
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Créer un repository sur GitHub/GitLab/Bitbucket**

3. **Connecter le repository** :
   ```powershell
   git remote add origin <URL_DU_REPOSITORY>
   git push -u origin main
   ```

4. **Dans Vercel Dashboard** :
   - Allez dans **Settings > Git**
   - Connectez votre repository
   - Vercel déploiera automatiquement à chaque push

## Vérification Post-Déploiement

Après le déploiement, vérifiez :

1. **Ouvrez** `https://logiclinic.org`
2. **Videz le cache** du navigateur : `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
3. **Vérifiez** que le champ "Code Clinique" est visible sur la page d'inscription
4. **Ouvrez la console** (F12) et vérifiez qu'il n'y a pas d'erreurs

## Si le Problème Persiste

### Vider le Cache Vercel

1. Dans Vercel Dashboard, allez dans **Settings > General**
2. Cliquez sur **"Clear Build Cache"**
3. Redéployez le projet

### Vérifier les Variables d'Environnement

Assurez-vous que toutes les variables d'environnement sont configurées dans Vercel :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (si nécessaire)

### Vérifier le Build Local

Testez le build localement pour vous assurer qu'il fonctionne :
```powershell
npm run build
npm run preview
```

Ouvrez `http://localhost:4173` et vérifiez que le champ "Code Clinique" est présent.

## Notes Importantes

- ⚠️ Le dossier `build/` est dans `.gitignore`, donc il n'est pas versionné
- ✅ Vercel reconstruit toujours le projet depuis le code source
- ✅ Assurez-vous que tous vos changements sont dans les fichiers source (pas seulement dans `build/`)
- ✅ Le champ "Code Clinique" est bien présent dans `src/components/auth/Login.tsx` (ligne 1963-2018)


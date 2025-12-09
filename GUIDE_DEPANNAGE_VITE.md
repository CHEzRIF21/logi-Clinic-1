# Guide de Dépannage - Vite - Page Blanche

## 🔍 Problème : L'application ne s'affiche pas après compilation avec Vite

Si vous voyez une page blanche sur `localhost:3001`, suivez ces étapes de dépannage :

## ✅ Solutions Étape par Étape

### 1. Vérifier que le serveur Vite est démarré

Le serveur de développement Vite doit être en cours d'exécution. Pour le démarrer :

```bash
npm run dev
```

ou

```bash
npm start
```

**Vérification :** Vous devriez voir dans le terminal :
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3001/
  ➜  Network: use --host to expose
```

### 2. Vérifier la Console du Navigateur (F12)

Ouvrez les outils de développement (F12) et vérifiez l'onglet **Console** pour les erreurs :

#### Erreurs courantes :

**❌ "Failed to fetch" ou erreurs réseau**
- Vérifiez que le serveur Vite est bien démarré
- Vérifiez que vous accédez au bon port (3001)

**❌ "Cannot find module" ou erreurs d'import**
- Arrêtez le serveur (Ctrl+C)
- Supprimez `node_modules` et `package-lock.json`
- Réinstallez : `npm install`
- Redémarrez : `npm run dev`

**❌ Erreurs TypeScript**
- Vérifiez les erreurs de compilation : `npm run build`
- Corrigez les erreurs TypeScript avant de démarrer le serveur

### 3. Vérifier le Fichier index.html

Le fichier `index.html` doit être à la **racine du projet** (pas dans `public/`).

Vérifiez que le fichier `index.html` à la racine contient :

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    ...
  </head>
  <body>
    <noscript>Vous devez activer JavaScript pour utiliser cette application.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
```

**Important :** La ligne `<script type="module" src="/src/index.tsx"></script>` est essentielle !

### 4. Vérifier la Configuration Vite

Le fichier `vite.config.ts` doit être correctement configuré :

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true,
    host: true,
  },
  // ...
});
```

### 5. Vérifier les Variables d'Environnement

Créez un fichier `.env` à la racine avec :

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-ici
```

**Important :** Après avoir modifié `.env`, **redémarrez le serveur Vite**.

### 6. Nettoyer le Cache et Redémarrer

Si rien ne fonctionne, essayez de nettoyer complètement :

```bash
# Arrêter le serveur (Ctrl+C)

# Supprimer les caches
rm -rf node_modules/.vite
rm -rf build
rm -rf dist

# Sur Windows PowerShell :
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# Réinstaller les dépendances
npm install

# Redémarrer
npm run dev
```

### 7. Vérifier les Erreurs de Compilation TypeScript

Compilez le projet pour voir les erreurs :

```bash
npm run build
```

Si vous voyez des erreurs TypeScript, corrigez-les avant de démarrer le serveur de développement.

### 8. Vérifier que le Port 3001 n'est pas Occupé

Si le port 3001 est occupé par un autre processus :

**Windows PowerShell :**
```powershell
# Trouver le processus utilisant le port 3001
netstat -ano | findstr :3001

# Tuer le processus (remplacez PID par l'ID du processus)
taskkill /PID <PID> /F
```

**Alternative :** Changez le port dans `vite.config.ts` :

```typescript
server: {
  port: 3002, // ou un autre port disponible
  // ...
}
```

## 🎯 Checklist Rapide

- [ ] Le serveur Vite est démarré (`npm run dev`)
- [ ] Aucune erreur dans la console du navigateur (F12)
- [ ] Le fichier `index.html` est à la racine avec le script correct
- [ ] Le fichier `.env` existe et contient les variables nécessaires
- [ ] Le port 3001 n'est pas occupé par un autre processus
- [ ] Les dépendances sont installées (`npm install`)
- [ ] Aucune erreur TypeScript (`npm run build`)

## 🆘 Si Rien ne Fonctionne

1. **Ouvrez la console du navigateur (F12)** et copiez toutes les erreurs
2. **Vérifiez les logs du terminal** où le serveur Vite est démarré
3. **Vérifiez que React est bien installé** : `npm list react react-dom`
4. **Essayez un autre navigateur** (Chrome, Firefox, Edge)
5. **Désactivez les extensions du navigateur** qui pourraient interférer

## 📝 Notes Importantes

- **Vite utilise ESM (ES Modules)** : Assurez-vous que tous les imports utilisent la syntaxe correcte
- **Le hot-reload** : Les modifications sont appliquées automatiquement, pas besoin de recompiler
- **Le build de production** : Utilisez `npm run build` pour créer une version optimisée

## 🔗 Ressources

- Documentation Vite : https://vitejs.dev/
- Documentation React : https://react.dev/
- Guide de migration Vite : `MIGRATION_VITE.md`


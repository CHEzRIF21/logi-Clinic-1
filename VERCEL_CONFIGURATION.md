# Configuration Vercel - Résolution des avertissements

## Avertissement des submodules Git

Pour résoudre l'avertissement "Failed to fetch one or more git submodules" dans Vercel :

1. Allez dans le dashboard Vercel de votre projet
2. Naviguez vers **Settings** > **Environment Variables**
3. Ajoutez la variable d'environnement suivante :
   - **Name**: `GIT_SUBMODULE_UPDATE`
   - **Value**: `false`
   - **Environment**: Tous les environnements (Production, Preview, Development)

Cette configuration empêchera Vercel d'essayer de récupérer des submodules Git qui n'existent pas.

## Corrections appliquées

### 1. Packages dépréciés résolus
- ✅ Suppression de `react-query` (non utilisé, causait `inflight` et `glob` dépréciés)
- ✅ Mise à jour de `@mui/x-date-pickers` de v6 vers v7 (résout `@mui/base` déprécié)

### 2. Configuration Vite
- ✅ Augmentation de `chunkSizeWarningLimit` de 1000 à 2000 KB dans `vite.config.ts`

### 3. Prochaines étapes
Après avoir ajouté la variable d'environnement `GIT_SUBMODULE_UPDATE=false` dans Vercel, tous les avertissements devraient être résolus.


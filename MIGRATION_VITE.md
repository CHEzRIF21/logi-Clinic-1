# Migration de Create React App vers Vite

## ✅ Migration terminée

Votre projet a été migré avec succès de Create React App (CRA) vers Vite pour un chargement plus fluide et rapide.

## 🔄 Changements effectués

### 1. Configuration Vite
- ✅ Création de `vite.config.ts` avec support React, TypeScript, Tailwind CSS
- ✅ Configuration des alias de chemins (`@/*` vers `src/*`)
- ✅ Optimisation du build avec code splitting
- ✅ Configuration du serveur de développement (port 3000)

### 2. Package.json
- ✅ Remplacement de `react-scripts` par `vite` et `@vitejs/plugin-react`
- ✅ Mise à jour des scripts :
  - `npm start` → `npm run dev` (ou `npm start` qui pointe vers Vite)
  - `npm run build` → Build optimisé avec Vite
  - `npm run preview` → Prévisualisation du build de production

### 3. Variables d'environnement
- ✅ Migration de `process.env.REACT_APP_*` vers `import.meta.env.VITE_*`
- ✅ Support de compatibilité pour les deux formats (transition en douceur)
- ✅ Mise à jour de `vite-env.d.ts` avec toutes les variables d'environnement

### 4. Fichiers HTML
- ✅ Mise à jour de `public/index.html` :
  - Remplacement de `%PUBLIC_URL%` par des chemins relatifs
  - Ajout du script d'entrée Vite (`<script type="module" src="/src/index.tsx"></script>`)

### 5. TypeScript
- ✅ Mise à jour de `tsconfig.json` pour Vite
- ✅ Création de `tsconfig.node.json` pour la configuration Vite

## 📝 Variables d'environnement

### Anciennes variables (CRA)
```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SUPABASE_URL=https://...
REACT_APP_SUPABASE_ANON_KEY=...
```

### Nouvelles variables (Vite)
```
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

**Note importante** : Le code supporte les deux formats pour une transition en douceur, mais il est recommandé d'utiliser le préfixe `VITE_` pour les nouvelles variables.

## 🚀 Commandes disponibles

```bash
# Développement (démarrage rapide avec Vite)
npm run dev
# ou
npm start

# Build de production
npm run build

# Prévisualiser le build de production
npm run preview
```

## ⚡ Avantages de Vite

1. **Démarrage ultra-rapide** : Le serveur de développement démarre instantanément
2. **Hot Module Replacement (HMR)** : Mise à jour instantanée des modules modifiés
3. **Build optimisé** : Utilisation de Rollup pour des bundles plus petits et plus rapides
4. **Support natif TypeScript** : Pas besoin de configuration supplémentaire
5. **Code splitting automatique** : Optimisation des chunks pour un chargement plus rapide

## 🔧 Fichiers modifiés

### Configuration
- `vite.config.ts` (nouveau)
- `tsconfig.json` (mis à jour)
- `tsconfig.node.json` (nouveau)
- `package.json` (mis à jour)
- `public/index.html` (mis à jour)
- `src/vite-env.d.ts` (mis à jour)

### Services (variables d'environnement)
- `src/services/supabase.ts`
- `src/services/stockSupabase.ts`
- `src/services/apiClient.ts`
- `src/services/consultationService.ts`
- `src/services/deparasitageService.ts`
- `src/services/diagnosticService.ts`
- `src/services/anamneseTemplateService.ts`
- `src/services/pricingClientService.ts`
- `src/services/pharmacyApi.ts`

### Composants
- `src/components/auth/Login.tsx`
- `src/components/pricing/ClinicPricingManager.tsx`
- `src/components/pricing/DefaultPricingConfig.tsx`
- `src/components/pricing/PricingHistoryView.tsx`

### Hooks
- `src/hooks/useSpeechRecognitionAPI.ts`

### Pages
- `src/pages/RegistrationRequests.tsx`

## 📦 Installation des dépendances

Après la migration, installez les nouvelles dépendances :

```bash
npm install
```

## 🐛 Dépannage

### Erreur "Cannot find module 'vite'"
```bash
npm install
```

### Variables d'environnement non détectées
- Assurez-vous que vos variables commencent par `VITE_`
- Redémarrez le serveur de développement après modification du `.env`

### Erreurs TypeScript
- Vérifiez que `tsconfig.json` et `tsconfig.node.json` sont correctement configurés
- Exécutez `npm run build` pour vérifier les erreurs de compilation

## 📚 Documentation

- [Documentation Vite](https://vitejs.dev/)
- [Plugin React pour Vite](https://github.com/vitejs/vite-plugin-react)

## ✨ Prochaines étapes

1. Mettre à jour votre fichier `.env` avec les variables `VITE_*`
2. Tester l'application en développement : `npm run dev`
3. Tester le build de production : `npm run build && npm run preview`
4. Supprimer les anciennes variables `REACT_APP_*` une fois que tout fonctionne

---

**Migration effectuée le** : $(date)
**Version Vite** : 5.0.0
**Version React** : 18.2.0


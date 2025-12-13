# Correction des erreurs 401 sur Vercel

## Problèmes identifiés et corrigés

### 1. Fichiers statiques manquants ✅

**Problème :** Les fichiers `manifest.json` et `favicon.ico` étaient référencés dans `index.html` mais n'existaient pas dans le dossier `public`.

**Solution :**
- ✅ Créé `public/manifest.json` avec la configuration appropriée
- ✅ Créé `public/favicon.ico` depuis `logo192.png`
- ✅ Copié `logo192.png` dans le dossier `public`

### 2. Configuration Vercel - Rewrites ✅

**Problème :** La configuration `rewrites` redirigeait TOUS les fichiers (y compris les fichiers statiques) vers `/index.html`, causant des erreurs 401.

**Solution :** Modifié la regex pour exclure les fichiers statiques des rewrites :
```json
"rewrites": [
  {
    "source": "/((?!.*\\.(json|ico|png|jpg|jpeg|gif|svg|js|css|woff|woff2|ttf|eot|map)).*)",
    "destination": "/index.html"
  }
]
```

Cette configuration permet :
- Les fichiers statiques (`.json`, `.ico`, `.png`, `.js`, `.css`, etc.) sont servis directement
- Seules les routes de l'application sont redirigées vers `/index.html`

### 3. Configuration Vercel - Headers ✅

**Problème :** Les headers de sécurité étaient appliqués à tous les fichiers, y compris les fichiers statiques.

**Solution :** Séparé les headers en deux groupes :
1. Headers de sécurité pour les pages HTML uniquement
2. Headers de cache pour les fichiers statiques

```json
"headers": [
  {
    "source": "/((?!.*\\.(json|ico|png|jpg|jpeg|gif|svg|js|css|woff|woff2|ttf|eot|map)).*)",
    "headers": [
      {
        "key": "X-Content-Type-Options",
        "value": "nosniff"
      },
      {
        "key": "X-Frame-Options",
        "value": "DENY"
      },
      {
        "key": "X-XSS-Protection",
        "value": "1; mode=block"
      },
      {
        "key": "Referrer-Policy",
        "value": "strict-origin-when-cross-origin"
      }
    ]
  },
  {
    "source": "/(manifest\\.json|favicon\\.ico|logo192\\.png|.*\\.(json|ico|png|jpg|jpeg|gif|svg|js|css|woff|woff2|ttf|eot|map))",
    "headers": [
      {
        "key": "Cache-Control",
        "value": "public, max-age=31536000, immutable"
      }
    ]
  }
]
```

## Fichiers créés/modifiés

1. ✅ `public/manifest.json` - Créé
2. ✅ `public/favicon.ico` - Créé
3. ✅ `public/logo192.png` - Copié depuis la racine
4. ✅ `vercel.json` - Modifié (rewrites et headers)

## Résultat attendu

Après ces corrections, les erreurs suivantes devraient être résolues :
- ✅ `Failed to load resource: the server responded with a status of 401` pour `manifest.json`
- ✅ `Failed to load resource: net::ERR_CONNECTION_REFUSED` pour `favicon.ico`
- ✅ `Manifest fetch failed, code 401`

## Prochaines étapes

1. Commitez les changements :
   ```bash
   git add public/manifest.json public/favicon.ico public/logo192.png vercel.json
   git commit -m "Fix: Correction des erreurs 401 pour les fichiers statiques sur Vercel"
   ```

2. Déployez sur Vercel :
   - Les fichiers seront automatiquement déployés
   - Vercel servira correctement les fichiers statiques

3. Vérifiez dans la console du navigateur :
   - Plus d'erreurs 401 pour `manifest.json`
   - Plus d'erreurs pour `favicon.ico`
   - Les fichiers statiques se chargent correctement

## Notes supplémentaires

- Le fichier `favicon.ico` est actuellement une copie de `logo192.png`. Pour un favicon optimal, vous pouvez créer un vrai fichier `.ico` de 32x32 pixels.
- Les fichiers statiques sont maintenant mis en cache pendant 1 an (31536000 secondes) pour améliorer les performances.


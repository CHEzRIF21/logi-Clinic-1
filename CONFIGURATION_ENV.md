# Configuration des Variables d'Environnement

## ⚠️ Important

Ce projet nécessite un fichier `.env` à la racine avec les variables d'environnement suivantes.

## 📋 Variables Requises

### 1. VITE_API_URL (OBLIGATOIRE)
URL de l'API backend. Par défaut, le serveur backend tourne sur le port 3000.

```env
VITE_API_URL=http://localhost:3000/api
```

**Note:** Si votre serveur backend tourne sur un autre port, ajustez l'URL en conséquence.

### 2. VITE_SUPABASE_URL (OBLIGATOIRE)
URL de votre projet Supabase.

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
```

### 3. VITE_SUPABASE_ANON_KEY (OBLIGATOIRE)
Clé anonyme (publishable) de votre projet Supabase.

```env
VITE_SUPABASE_ANON_KEY=votre-anon-key-ici
```

### 4. Variables Optionnelles pour le Stock

Si vous utilisez un projet Supabase séparé pour le module Stock, définissez :

```env
VITE_STOCK_SUPABASE_URL=https://votre-projet-stock.supabase.co
VITE_STOCK_SUPABASE_ANON_KEY=votre-anon-key-stock-ici
```

**Note:** Si ces variables ne sont pas définies, le module Stock utilisera `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.

## 🚀 Configuration Rapide

1. Copiez le fichier `.env.example` vers `.env` :
   ```bash
   cp .env.example .env
   ```

2. Éditez le fichier `.env` et remplissez les valeurs :
   - Obtenez vos clés Supabase depuis https://app.supabase.com
   - Vérifiez que votre serveur backend est accessible à l'URL configurée

3. Redémarrez l'application :
   ```bash
   npm start
   ```

## 🔍 Vérification

Après configuration, vérifiez dans la console du navigateur :
- ✅ Pas d'erreur concernant `VITE_API_URL` undefined
- ✅ Connexion Supabase réussie (message "✅ Connexion Supabase réussie!")
- ⚠️ Si vous voyez un avertissement "Multiple GoTrueClient instances", c'est normal si vous utilisez deux projets Supabase différents (principal + stock)

## 📝 Notes

- Le fichier `.env` est ignoré par Git pour des raisons de sécurité
- Ne partagez jamais vos clés Supabase publiquement
- Pour la production, configurez ces variables sur votre plateforme de déploiement (Vercel, Netlify, etc.)


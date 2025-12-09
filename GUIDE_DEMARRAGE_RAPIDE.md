# Guide de Démarrage Rapide - Logi Clinic

## 🚀 Démarrage en 3 Étapes

### Étape 1: Configuration des Variables d'Environnement

Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```env
# API Backend (obligatoire)
VITE_API_URL=http://localhost:3000/api

# Supabase (obligatoire)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-anon-key-ici

# Supabase Stock (optionnel - utilise les valeurs ci-dessus si non défini)
VITE_STOCK_SUPABASE_URL=
VITE_STOCK_SUPABASE_ANON_KEY=
```

**Où obtenir les clés Supabase ?**
1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez l'**URL** et la **anon/public key**

### Étape 2: Installation des Dépendances

```bash
npm install
```

### Étape 3: Démarrage de l'Application

```bash
npm start
```

L'application devrait démarrer sur http://localhost:3000

---

## ✅ Vérifications

### Console du Navigateur

Après le démarrage, vérifiez dans la console (F12) :

- ✅ **Pas d'erreur** `VITE_API_URL` undefined
- ✅ **Message** "✅ Connexion Supabase réussie!"
- ⚠️ **Warning GoTrueClient** : Normal si vous utilisez deux projets Supabase différents

### Erreurs Courantes

#### ❌ "VITE_API_URL is not defined"
**Solution:** Vérifiez que le fichier `.env` existe et contient `VITE_API_URL=http://localhost:3000/api`

#### ❌ "Configuration Supabase manquante"
**Solution:** Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont définis dans `.env`

#### ❌ "Failed to fetch" ou erreurs réseau
**Solution:** Vérifiez que le serveur backend est démarré et accessible sur le port 3000

---

## 📚 Documentation Complète

- **Configuration détaillée:** Voir `CONFIGURATION_ENV.md`
- **Résumé des corrections:** Voir `RESUME_CORRECTIONS_TESTS.md`
- **Rapport de tests:** Voir `testsprite_tests/testsprite-mcp-test-report.md`

---

## 🔧 Dépannage

### L'application ne se charge pas

1. Vérifiez que le fichier `.env` existe à la racine
2. Vérifiez que toutes les variables sont définies
3. Redémarrez l'application après modification de `.env`
4. Videz le cache du navigateur (Ctrl+Shift+R)

### Erreurs MUI dans la console

Les erreurs MUI StepConnector ont été corrigées. Si vous voyez encore des warnings :
- Videz le cache et redémarrez
- Vérifiez que vous avez la dernière version du code

### Tests TestSprite échouent

1. Vérifiez que l'application se charge correctement dans le navigateur
2. Vérifiez que toutes les variables d'environnement sont configurées
3. Vérifiez que le serveur backend est accessible
4. Consultez le rapport de test pour les détails

---

## 📞 Support

Pour plus d'aide, consultez :
- La documentation dans le dossier `docs/`
- Les fichiers README dans chaque module
- Le rapport de test TestSprite pour les problèmes spécifiques

---

**Dernière mise à jour:** 2025-12-08


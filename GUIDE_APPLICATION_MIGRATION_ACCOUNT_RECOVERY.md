# 🔧 Guide d'Application de la Migration Account Recovery

## ✅ Corrections Appliquées

### 1. Erreur Critique Corrigée
- **Problème** : `handleConfirmDelete is not defined` empêchait le chargement du site
- **Solution** : Ajout des fonctions `handleDeleteClick` et `handleConfirmDelete` dans `GestionUtilisateurs.tsx`
- **Statut** : ✅ Corrigé

### 2. Gestion de la Table Manquante
- **Problème** : Table `account_recovery_requests` n'existe pas dans Supabase
- **Solution** : 
  - Code adapté pour gérer gracieusement l'absence de la table
  - Migration créée : `supabase_migrations/40_CREATE_ACCOUNT_RECOVERY_REQUESTS.sql`
- **Statut** : ✅ Migration créée, code adapté

## 📋 Application de la Migration

### Option 1 : Via Supabase Dashboard (Recommandé)

1. **Accéder à Supabase Dashboard**
   - Allez sur https://app.supabase.com
   - Sélectionnez votre projet : **bnfgemmlokvetmohiqch**

2. **Ouvrir le SQL Editor**
   - Cliquez sur **SQL Editor** dans le menu de gauche
   - Cliquez sur **New Query**

3. **Copier et Exécuter la Migration**
   - Ouvrez le fichier : `supabase_migrations/40_CREATE_ACCOUNT_RECOVERY_REQUESTS.sql`
   - Copiez tout le contenu (Ctrl+A puis Ctrl+C)
   - Collez dans le SQL Editor (Ctrl+V)
   - Cliquez sur **RUN** (ou Ctrl+Enter)
   - Attendez le message de succès ✅

### Option 2 : Via Supabase CLI

```bash
# Si vous avez Supabase CLI installé
supabase db push
```

## 🔍 Vérification

Après avoir appliqué la migration, vérifiez que :

1. **Le site charge correctement**
   - Ouvrez `http://localhost:3001`
   - Vérifiez qu'il n'y a plus d'erreur dans la console

2. **La table existe**
   - Dans Supabase Dashboard → Table Editor
   - Vérifiez que `account_recovery_requests` apparaît dans la liste

3. **Les fonctionnalités fonctionnent**
   - Testez la suppression d'un utilisateur (avec confirmation)
   - Testez la gestion des permissions
   - Vérifiez que les notifications s'affichent correctement

## 🐛 Si le Site Ne Charge Toujours Pas

1. **Videz le cache du navigateur**
   - Ctrl+Shift+Delete → Cochez "Images et fichiers en cache"
   - Cliquez sur "Effacer"

2. **Redémarrez le serveur de développement**
   ```bash
   # Arrêtez le serveur (Ctrl+C)
   # Puis relancez
   npm run dev
   ```

3. **Vérifiez la console du navigateur**
   - Ouvrez F12 → Console
   - Notez les nouvelles erreurs s'il y en a

## 📝 Notes

- La migration est **idempotente** (peut être exécutée plusieurs fois sans problème)
- Les RLS policies sont configurées pour la sécurité multi-tenant
- La table sera automatiquement créée avec les bonnes permissions

# Guide d'Application des Migrations - Module Consultation

Ce guide vous explique comment appliquer les migrations SQL nécessaires pour le module Consultation.

## 📋 Prérequis

- Accès à votre projet Supabase
- Accès au SQL Editor dans Supabase Dashboard

## 🚀 Étapes d'Application

### Option 1 : Via Supabase Dashboard (Recommandé)

1. **Connectez-vous à Supabase Dashboard**
   - Allez sur https://app.supabase.com
   - Sélectionnez votre projet

2. **Ouvrez le SQL Editor**
   - Cliquez sur "SQL Editor" dans le menu latéral gauche

3. **Appliquez les migrations dans l'ordre :**

   **Étape 1 : Corrections des tables**
   - Ouvrez le fichier `supabase_migrations/fix_consultation_tables.sql`
   - Copiez tout le contenu
   - Collez-le dans le SQL Editor
   - Cliquez sur "Run" ou appuyez sur `Ctrl+Enter`
   - Vérifiez qu'il n'y a pas d'erreurs

   **Étape 2 : Templates spécialisés**
   - Ouvrez le fichier `supabase_migrations/create_specialized_consultation_templates.sql`
   - Copiez tout le contenu
   - Collez-le dans le SQL Editor
   - Cliquez sur "Run" ou appuyez sur `Ctrl+Enter`
   - Vérifiez qu'il n'y a pas d'erreurs

### Option 2 : Via Supabase CLI

Si vous utilisez Supabase CLI localement :

```bash
# Assurez-vous d'être connecté à votre projet
supabase db push

# Ou appliquez les migrations manuellement
supabase migration up
```

## ✅ Vérification

Après avoir appliqué les migrations, vérifiez que :

1. **Table `rendez_vous`** contient les colonnes :
   - `consultation_id` (UUID, nullable)
   - `praticien_name` (VARCHAR, nullable)

2. **Table `consultation_roles`** existe avec les colonnes :
   - `id`, `role_code`, `role_label`, `description`, `permissions`

3. **Table `factures`** contient la colonne :
   - `consultation_id` (UUID, nullable)

4. **Table `consultation_templates`** contient au moins 7 templates :
   - Fiche Standard (Médecine générale)
   - Fiche Gynéco (Gynécologie)
   - Fiche CPN (Gynécologie)
   - Fiche Ophtalmo (Ophtalmologie)
   - Fiche Uro (Urologie)
   - Fiche JD (Dermatologie)
   - Fiche Pédiatrie (Pédiatrie)

### Requête de vérification

Exécutez cette requête dans le SQL Editor pour vérifier :

```sql
-- Vérifier les templates créés
SELECT nom, specialite, actif 
FROM consultation_templates 
ORDER BY specialite, nom;

-- Vérifier la structure de rendez_vous
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'rendez_vous'
ORDER BY ordinal_position;

-- Vérifier consultation_roles
SELECT COUNT(*) as nombre_roles
FROM consultation_roles;
```

## 🔧 Résolution de Problèmes

### Erreur : "relation already exists"
- C'est normal si les tables existent déjà
- Les migrations utilisent `CREATE TABLE IF NOT EXISTS` et `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Vous pouvez ignorer ces erreurs

### Erreur : "column already exists"
- C'est normal si les colonnes existent déjà
- Les migrations utilisent `ADD COLUMN IF NOT EXISTS`
- Vous pouvez ignorer ces erreurs

### Erreur : "permission denied"
- Vérifiez que vous êtes connecté avec un compte ayant les droits d'administration
- Vérifiez les RLS (Row Level Security) policies si nécessaire

## 📝 Notes Importantes

- **Sauvegarde** : Faites une sauvegarde de votre base de données avant d'appliquer les migrations
- **Ordre** : Respectez l'ordre d'application des migrations
- **Tests** : Testez le module après chaque migration pour vérifier que tout fonctionne

## 🎯 Prochaines Étapes

Après avoir appliqué les migrations :

1. ✅ Vérifiez que l'application compile sans erreurs
2. ✅ Testez la création d'une consultation via `/consultation-module`
3. ✅ Vérifiez que les templates s'affichent correctement
4. ✅ Testez le workflow complet de consultation

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Supabase Dashboard > Logs
2. Vérifiez la console du navigateur pour les erreurs frontend
3. Consultez la documentation Supabase : https://supabase.com/docs


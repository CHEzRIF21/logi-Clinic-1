# Guide : Application de la Migration 52

## 🔴 Problème Actuel

L'erreur `new row for relation "paiements" violates check constraint "paiements_mode_paiement_check"` se produit parce que la contrainte CHECK dans la table `paiements` ne contient pas la valeur `'mtn_mobile_money'`.

## ✅ Solution : Migration 52

**Fichier** : `supabase_migrations/52_FIX_PAIEMENTS_MODE_PAIEMENT_CHECK_CONSTRAINT.sql`

### Comment l'appliquer

1. **Ouvrir Supabase Dashboard****
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Ouvrir SQL Editor**
   - Cliquer sur "SQL Editor" dans le menu de gauche
   - Cliquer sur "New query"

3. **Copier-coller le contenu de la migration**
   - Ouvrir le fichier `supabase_migrations/52_FIX_PAIEMENTS_MODE_PAIEMENT_CHECK_CONSTRAINT.sql`
   - Copier tout le contenu
   - Coller dans l'éditeur SQL

4. **Exécuter la migration**
   - Cliquer sur "Run" ou appuyer sur `Ctrl+Enter`
   - Vérifier les messages de confirmation :
     - `✅ Ancienne contrainte paiements_mode_paiement_check supprimée (si elle existait)`
     - `✅ Contrainte paiements_mode_paiement_check créée avec succès (inclut mtn_mobile_money)`

5. **Vérifier que la contrainte est correcte**
   ```sql
   SELECT constraint_name, check_clause
   FROM information_schema.check_constraints
   WHERE constraint_name = 'paiements_mode_paiement_check';
   ```
   
   Le résultat doit contenir `mtn_mobile_money` dans la clause CHECK.

## 🧪 Test Après Application

1. Rafraîchir l'application (F5)
2. Essayer d'enregistrer un paiement avec "MTN Mobile Money"
3. Le paiement devrait maintenant fonctionner sans erreur

## ⚠️ Important

- Cette migration est **sûre** : elle ne modifie pas les données existantes
- Elle ne fait que mettre à jour la contrainte CHECK pour inclure toutes les valeurs de mode de paiement
- Vous pouvez l'appliquer sans risque sur une base de données en production

---

**Une fois la migration appliquée, l'erreur devrait disparaître !** ✅

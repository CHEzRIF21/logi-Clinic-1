# Ordre d'Application des Migrations

## ⚠️ IMPORTANT : Ordre d'Application

Les migrations doivent être appliquées dans l'ordre suivant pour éviter les erreurs de dépendances :

### 1. Migration 49 (OBLIGATOIRE EN PREMIER)
**Fichier** : `supabase_migrations/49_UPDATE_TICKETS_AND_OPERATIONS_ON_PAYMENT.sql`

**Pourquoi en premier** :
- Crée la fonction `update_actes_on_payment()`
- Crée la fonction `trigger_update_actes_on_facture_payment()`
- Ajoute le statut `'payee'` aux tickets_facturation

**Comment appliquer** :
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier-coller le contenu du fichier
3. Exécuter la requête
4. Vérifier les messages de confirmation

---

### 2. Migration 50 (PEUT ÊTRE APPLIQUÉE INDÉPENDAMMENT)
**Fichier** : `supabase_migrations/50_FIX_INTER_MODULE_LINKS_AND_TRIGGERS.sql`

**Ce qu'elle fait** :
- ✅ **Crée toutes les fonctions nécessaires** (même si elles existent déjà, elles seront remplacées)
- ✅ Crée/vérifie tous les triggers
- ✅ Crée les fonctions de diagnostic :
  - `verifier_liaisons_inter_modules(facture_id)`
  - `corriger_liaisons_facture(facture_id)`

**Note** : Cette migration est maintenant **autonome** - elle crée toutes les fonctions nécessaires même si elles n'existent pas encore.

**Comment appliquer** :
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier-coller le contenu du fichier
3. Exécuter la requête
4. Vérifier les messages de confirmation

---

### 3. Migration 51 (CRUCIALE POUR LE STOCK)
**Fichier** : `supabase_migrations/51_FIX_AUTOMATIC_PAYMENT_ACTIONS_AND_SYNC.sql`

**Ce qu'elle fait** :
- ✅ Crée la fonction `decrementer_stock_lot()` si elle n'existe pas
- ✅ Crée les triggers de décrémentation de stock :
  - `trigger_decrement_stock_on_payment` (sur `paiements`)
  - `trigger_decrement_stock_on_facture_status` (sur `factures`)
- ✅ Crée la fonction `attendre_synchronisation_paiement()`

**⚠️ IMPORTANT** : Cette migration est **cruciale** pour que le stock soit décrémenté automatiquement après paiement !

**Comment appliquer** :
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier-coller le contenu du fichier
3. Exécuter la requête
4. Vérifier les messages de confirmation

---

## 🔄 Ordre Recommandé

```
1. Migration 49 → Appliquer d'abord
2. Migration 50 → Peut être appliquée indépendamment (crée toutes les fonctions)
3. Migration 51 → Appliquer en dernier (dépend de la fonction decrementer_stock_lot)
```

**OU** (si vous voulez tout faire en une fois) :

```
1. Migration 50 → Crée toutes les fonctions de base
2. Migration 49 → Ajoute les fonctions spécifiques aux actes
3. Migration 51 → Ajoute les fonctions de décrémentation de stock
```

---

## ✅ Vérification Après Application

### Vérifier que toutes les fonctions existent

```sql
SELECT proname, pronargs
FROM pg_proc
WHERE proname IN (
  'mettre_a_jour_statut_facture',
  'mettre_a_jour_journal_caisse',
  'update_consultation_payment_status',
  'update_consultation_from_invoice',
  'update_actes_on_payment',
  'trigger_update_actes_on_facture_payment',
  'decrement_stock_on_prescription_payment',
  'decrement_stock_on_facture_status_update',
  'decrementer_stock_lot',
  'attendre_synchronisation_paiement',
  'verifier_liaisons_inter_modules',
  'corriger_liaisons_facture'
)
ORDER BY proname;
```

**Résultat attendu** : 12 fonctions listées

### Vérifier que tous les triggers existent

```sql
SELECT tgname, tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname IN (
  'trigger_mettre_a_jour_statut_facture',
  'trigger_mettre_a_jour_journal_caisse',
  'trigger_update_consultation_payment_status',
  'trigger_update_consultation_from_invoice',
  'trigger_update_actes_on_facture_payment',
  'trigger_decrement_stock_on_payment',
  'trigger_decrement_stock_on_facture_status'
)
ORDER BY tgname;
```

**Résultat attendu** : 7 triggers listés

---

## 🛠️ Si Vous Avez des Erreurs

### Erreur : "function does not exist"

**Solution** :
1. Vérifier que la migration qui crée cette fonction a été appliquée
2. Si la fonction devrait exister mais n'existe pas, appliquer la migration 50 qui crée toutes les fonctions de base

### Erreur : "relation does not exist"

**Solution** :
1. Vérifier que les tables existent (factures, paiements, consultations, etc.)
2. Appliquer les migrations de base d'abord (create_facturation_tables.sql, etc.)

### Erreur : "constraint already exists"

**Solution** :
- C'est normal, les migrations utilisent `CREATE OR REPLACE` ou `DROP ... IF EXISTS`
- L'erreur peut être ignorée si la contrainte existe déjà

---

## 📝 Notes Importantes

1. **Les migrations 50 et 51 sont maintenant autonomes** : Elles créent toutes les fonctions nécessaires même si elles n'existent pas encore.

2. **L'ordre d'application n'est plus critique** : Vous pouvez appliquer les migrations dans n'importe quel ordre, mais l'ordre recommandé reste :
   - Migration 49
   - Migration 50
   - Migration 51

3. **Les fonctions sont idempotentes** : Vous pouvez réappliquer les migrations sans problème, elles utiliseront `CREATE OR REPLACE`.

---

**Une fois toutes les migrations appliquées, testez un paiement complet pour vérifier que tout fonctionne automatiquement !** ✅

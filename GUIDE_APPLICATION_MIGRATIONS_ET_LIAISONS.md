# Guide : Application des Migrations et Vérification des Liaisons Inter-Modules

## 📋 Migrations à Appliquer

### Migration 49 : Mise à jour des actes après paiement
**Fichier** : `supabase_migrations/49_UPDATE_TICKETS_AND_OPERATIONS_ON_PAYMENT.sql`

**Ce qu'elle fait** :
- Ajoute le statut `'payee'` aux `tickets_facturation`
- Ajoute la colonne `date_paiement` à `tickets_facturation`
- Crée la fonction `update_actes_on_payment()` pour mettre à jour automatiquement les tickets et opérations
- Crée le trigger `trigger_update_actes_on_facture_payment` qui s'exécute quand une facture est payée

**Comment l'appliquer** :
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier-coller le contenu du fichier
3. Exécuter la requête
4. Vérifier les messages de confirmation

---

### Migration 50 : Fix des liaisons inter-modules
**Fichier** : `supabase_migrations/50_FIX_INTER_MODULE_LINKS_AND_TRIGGERS.sql`

**Ce qu'elle fait** :
- Vérifie et crée tous les triggers nécessaires
- Vérifie que la fonction `update_actes_on_payment` existe
- Vérifie la structure de `tickets_facturation`
- Crée des fonctions de vérification et correction :
  - `verifier_liaisons_inter_modules(facture_id)` : Vérifie les liaisons d'une facture
  - `corriger_liaisons_facture(facture_id)` : Corrige automatiquement les liaisons

**Comment l'appliquer** :
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier-coller le contenu du fichier
3. Exécuter la requête
4. Vérifier les messages de confirmation

---

### Migration 51 : Fix des actions automatiques après paiement
**Fichier** : `supabase_migrations/51_FIX_AUTOMATIC_PAYMENT_ACTIONS_AND_SYNC.sql`

**Ce qu'elle fait** :
- Crée les triggers de décrémentation de stock manquants :
  - `trigger_decrement_stock_on_payment` (sur `paiements`)
  - `trigger_decrement_stock_on_facture_status` (sur `factures`)
- Crée les fonctions de décrémentation de stock :
  - `decrement_stock_on_prescription_payment()` : Décrémente le stock après paiement
  - `decrement_stock_on_facture_status_update()` : Décrémente le stock après mise à jour de facture
- Crée une fonction de synchronisation :
  - `attendre_synchronisation_paiement(facture_id)` : Attend et vérifie que tout est synchronisé

**Comment l'appliquer** :
1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier-coller le contenu du fichier
3. Exécuter la requête
4. Vérifier les messages de confirmation

**⚠️ IMPORTANT** : Cette migration est cruciale pour que le stock soit décrémenté automatiquement après paiement !

---

## 🔗 Liaisons Inter-Modules

### Flux Complet : Consultation → Prescription → Facture → Paiement → Stock

```
1. Consultation créée
   ↓
2. Prescription créée (statut: 'PRESCRIT')
   ↓
3. Consultation clôturée → Prescription validée (statut: 'VALIDE')
   ↓
4. Facture créée automatiquement (statut: 'en_attente')
   ↓
5. Paiement enregistré dans "Paiements en Attente"
   ↓
6. TRIGGERS SQL AUTOMATIQUES :
   ├─ trigger_mettre_a_jour_statut_facture
   │  → Met à jour statut facture (en_attente → partiellement_payee → payee)
   ├─ trigger_mettre_a_jour_journal_caisse
   │  → Met à jour le journal de caisse
   ├─ trigger_update_consultation_payment_status
   │  → Met à jour statut_paiement de la consultation
   ├─ trigger_update_consultation_from_invoice
   │  → Met à jour consultation si facture payée
   ├─ trigger_update_actes_on_facture_payment (Migration 49)
   │  → Met à jour tickets_facturation (statut → 'payee')
   ├─ trigger_decrement_stock_on_payment (Migration 51)
   │  → Décrémente le stock automatiquement après paiement
   └─ trigger_decrement_stock_on_facture_status (Migration 51)
      → Décrémente le stock automatiquement après mise à jour facture
   ↓
7. Facture payée → Disparaît de "Paiements en Attente"
   ↓
8. Facture payée → Apparaît dans "Historique de Paiement"
```

---

## ✅ Vérification des Liaisons

### 1. Vérifier une facture spécifique

```sql
-- Vérifier les liaisons d'une facture
SELECT * FROM verifier_liaisons_inter_modules('facture_id_ici');
```

**Résultat attendu** :
- `facture_statut` = `'payee'`
- `consultation_statut_paiement` = `'paye'` (si consultation liée)
- `tickets_payes_count` = nombre de tickets payés
- `montant_restant` = 0

### 2. Corriger une facture si nécessaire

```sql
-- Corriger automatiquement les liaisons d'une facture
SELECT * FROM corriger_liaisons_facture('facture_id_ici');
```

### 3. Vérifier tous les triggers

```sql
-- Lister tous les triggers importants
SELECT tgname, tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname IN (
  'trigger_mettre_a_jour_statut_facture',
  'trigger_mettre_a_jour_journal_caisse',
  'trigger_update_consultation_payment_status',
  'trigger_update_consultation_from_invoice',
  'trigger_update_actes_on_facture_payment'
);
```

---

## 🔍 Points de Vérification

### ✅ Factures
- [ ] Les factures payées ont `statut = 'payee'` et `montant_restant <= 0`
- [ ] Les factures partiellement payées ont `statut = 'partiellement_payee'`
- [ ] Les factures en attente ont `statut = 'en_attente'`

### ✅ Tickets de Facturation
- [ ] Les tickets liés à une facture payée ont `statut = 'payee'`
- [ ] Les tickets ont une `date_paiement` si la facture est payée
- [ ] La colonne `updated_at` est mise à jour automatiquement

### ✅ Consultations
- [ ] Les consultations liées à une facture payée ont `statut_paiement = 'paye'`
- [ ] Les consultations liées à une facture partielle ont `statut_paiement = 'en_attente'`

### ✅ Journal de Caisse
- [ ] Le journal est mis à jour automatiquement après chaque paiement
- [ ] Les recettes sont classées par mode de paiement
- [ ] Le solde de fermeture est calculé automatiquement

### ✅ Stock
- [ ] Le stock est décrémenté automatiquement après paiement d'une facture liée à une prescription
- [ ] Les mouvements de stock sont enregistrés avec le motif approprié
- [ ] La stratégie FIFO est respectée (date d'expiration)

---

## 🛠️ Dépannage

### Problème : Les factures payées n'apparaissent pas dans "Historique de Paiement"

**Solution** :
1. Vérifier que la facture a bien `statut = 'payee'` et `montant_restant <= 0`
2. Vérifier que la requête dans `HistoriquePaiements.tsx` filtre correctement
3. Vérifier que le `clinic_id` est correct

### Problème : Les tickets ne sont pas mis à jour après paiement

**Solution** :
1. Vérifier que la migration 49 a été appliquée
2. Vérifier que la fonction `update_actes_on_payment` existe :
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'update_actes_on_payment';
   ```
3. Vérifier que le trigger `trigger_update_actes_on_facture_payment` existe
4. Appeler manuellement la fonction :
   ```sql
   SELECT * FROM update_actes_on_payment('facture_id_ici');
   ```

### Problème : Le journal de caisse n'est pas mis à jour

**Solution** :
1. Vérifier que le trigger `trigger_mettre_a_jour_journal_caisse` existe
2. Vérifier que le `caissier_id` est présent dans le paiement
3. Vérifier que le `mode_paiement` n'est pas `'prise_en_charge'`

### Problème : Le stock n'est pas décrémenté

**Solution** :
1. Vérifier que la facture est liée à une consultation
2. Vérifier que la consultation a des prescriptions avec `statut = 'VALIDE'`
3. Vérifier que les triggers de décrémentation existent
4. Vérifier qu'il y a du stock disponible dans le magasin `'detail'`

---

## 📝 Commandes SQL Utiles

### Vérifier l'état d'une facture
```sql
SELECT 
  f.id,
  f.numero_facture,
  f.statut,
  f.montant_total,
  f.montant_paye,
  f.montant_restant,
  f.consultation_id,
  c.statut_paiement as consultation_statut_paiement,
  (SELECT COUNT(*) FROM tickets_facturation WHERE facture_id = f.id) as nb_tickets,
  (SELECT COUNT(*) FROM tickets_facturation WHERE facture_id = f.id AND statut = 'payee') as nb_tickets_payes,
  (SELECT COUNT(*) FROM paiements WHERE facture_id = f.id) as nb_paiements
FROM factures f
LEFT JOIN consultations c ON f.consultation_id = c.id
WHERE f.id = 'facture_id_ici';
```

### Lister les factures avec problèmes de liaison
```sql
SELECT 
  f.id,
  f.numero_facture,
  f.statut,
  f.montant_restant,
  (SELECT COUNT(*) FROM tickets_facturation WHERE facture_id = f.id AND statut != 'payee') as tickets_non_payes
FROM factures f
WHERE f.statut = 'payee' 
  AND f.montant_restant <= 0
  AND EXISTS (
    SELECT 1 FROM tickets_facturation 
    WHERE facture_id = f.id 
    AND statut IN ('en_attente', 'facture')
  );
```

### Corriger toutes les factures payées avec tickets non mis à jour
```sql
-- Corriger toutes les factures payées
DO $$
DECLARE
  v_facture RECORD;
BEGIN
  FOR v_facture IN 
    SELECT id FROM factures 
    WHERE statut = 'payee' 
      AND montant_restant <= 0
  LOOP
    PERFORM corriger_liaisons_facture(v_facture.id);
  END LOOP;
END $$;
```

---

## ✅ Checklist d'Application

- [ ] Migration 49 appliquée
- [ ] Migration 50 appliquée
- [ ] Migration 51 appliquée (⚠️ CRUCIALE pour la décrémentation automatique du stock)
- [ ] Tous les triggers vérifiés (7 triggers au total)
- [ ] Fonction `update_actes_on_payment` existe
- [ ] Fonction `decrement_stock_on_prescription_payment` existe
- [ ] Fonction `decrement_stock_on_facture_status_update` existe
- [ ] Fonction `attendre_synchronisation_paiement` existe
- [ ] Fonction `verifier_liaisons_inter_modules` existe
- [ ] Fonction `corriger_liaisons_facture` existe
- [ ] Test d'un paiement complet effectué
- [ ] Vérification que la facture disparaît de "Paiements en Attente"
- [ ] Vérification que la facture apparaît dans "Historique de Paiement"
- [ ] Vérification que les tickets sont mis à jour
- [ ] Vérification que le journal de caisse est mis à jour
- [ ] Vérification que le stock est décrémenté automatiquement (si prescription liée)

---

**Une fois toutes les migrations appliquées, le système devrait fonctionner de manière automatique !** ✅

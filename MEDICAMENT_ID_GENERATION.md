# Génération Automatique d'Identifiants de Médicaments

## Vue d'ensemble

Cette fonctionnalité implémente la génération automatique d'identifiants uniques pour les médicaments au format `MED000`, `MED001`, `MED002`, etc. Le nom du médicament doit être saisi manuellement, tandis que l'identifiant est généré et affiché automatiquement.

## Fonctionnalités

### ✅ Génération Automatique d'ID
- Format : `MED000`, `MED001`, `MED002`, etc.
- Génération séquentielle automatique
- Évite les doublons
- Support des codes personnalisés

### ✅ Interface Utilisateur
- Formulaire de création de médicaments intuitif
- Affichage de l'ID généré en temps réel
- Possibilité de générer un nouvel ID
- Validation des données en temps réel

### ✅ Support Multi-Base de Données
- **MongoDB** : Modèle avec middleware pre-save
- **Supabase** : Service avec génération automatique
- Cohérence entre les deux systèmes

## Structure des Fichiers

```
src/
├── utils/
│   ├── medicamentIdGenerator.ts          # Générateur d'ID principal
│   ├── testMedicamentIdGenerator.ts      # Tests du générateur
│   └── testSupabaseMedicamentId.ts       # Tests Supabase
├── components/stock/
│   ├── MedicamentForm.tsx                # Formulaire de création
│   └── MedicamentManagement.tsx          # Gestion des médicaments
├── services/
│   └── medicamentService.ts              # Service Supabase modifié
└── pages/
    └── StockMedicaments.tsx              # Page principale modifiée

backend/
├── models/
│   └── Medicament.js                     # Modèle MongoDB modifié
├── routes/
│   └── medicaments.js                    # Routes modifiées
└── test-medicament-id.js                 # Tests MongoDB
```

## Utilisation

### 1. Création d'un Nouveau Médicament

1. Accédez à la page **Gestion des Stocks** → **Gestion Médicaments**
2. Cliquez sur **"Nouveau Médicament"**
3. L'ID est généré automatiquement (ex: `MED000`)
4. Saisissez le nom du médicament et les autres informations
5. Cliquez sur **"Créer"**

### 2. Interface du Formulaire

```
┌─────────────────────────────────────────────────────────┐
│ Identifiant du médicament                               │
│ [MED000] [Générer un nouvel ID]                        │
│ L'identifiant est généré automatiquement au format     │
│ MED000, MED001, etc.                                   │
├─────────────────────────────────────────────────────────┤
│ Nom du médicament *                                     │
│ [Saisissez le nom commercial du médicament]            │
│                                                         │
│ Forme pharmaceutique *    │ Dosage *                   │
│ [Comprimé ▼]             │ [500mg]                     │
│                                                         │
│ Unité *                   │ Fournisseur *              │
│ [Boîte ▼]                │ [Nom du fournisseur]        │
└─────────────────────────────────────────────────────────┘
```

### 3. API Backend

#### MongoDB
```javascript
// Création automatique d'ID
const medicament = new Medicament({
  nom: 'Paracétamol 500mg',
  // code sera généré automatiquement
  // ... autres champs
});
await medicament.save();
console.log(medicament.code); // MED000
```

#### Supabase
```typescript
// Création avec génération automatique
const medicamentData = {
  nom: 'Paracétamol 500mg',
  code: '', // Vide pour génération automatique
  // ... autres champs
};
const medicament = await MedicamentService.createMedicament(medicamentData);
console.log(medicament.code); // MED000
```

## Configuration

### Variables d'Environnement

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/logi-clinic

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Prérequis

- Node.js 16+
- MongoDB 4.4+ ou Supabase
- React 18+
- TypeScript 4.5+

## Tests

### Exécution des Tests

```bash
# Test global
node test-medicament-id-generation.js

# Test MongoDB uniquement
node backend/test-medicament-id.js

# Test Supabase uniquement
npx ts-node src/utils/testSupabaseMedicamentId.ts

# Test du générateur uniquement
npx ts-node src/utils/testMedicamentIdGenerator.ts
```

### Résultats Attendus

```
=== Test Global de Génération d'ID de Médicaments ===

1. Test du générateur d'ID...
   ✓ ID généré avec liste vide: MED000
   ✓ ID généré avec IDs existants: MED002
   ✓ Validation de format: true
   ✓ Générateur d'ID fonctionne correctement

2. Test MongoDB...
   ✓ Test MongoDB réussi

3. Test Supabase...
   ✓ Test Supabase réussi

🎉 La génération automatique d'ID de médicaments est opérationnelle !
```

## Dépannage

### Problèmes Courants

1. **ID non généré**
   - Vérifiez la connexion à la base de données
   - Vérifiez les permissions d'écriture

2. **Doublons d'ID**
   - Vérifiez l'unicité de l'index `code`
   - Nettoyez la base de données si nécessaire

3. **Erreur de validation**
   - Vérifiez que tous les champs obligatoires sont remplis
   - Vérifiez le format des données

### Logs de Débogage

```javascript
// Activer les logs détaillés
console.log('Génération d\'ID:', MedicamentIdGenerator.generateId(existingCodes));
console.log('Codes existants:', existingCodes);
```

## Maintenance

### Nettoyage des IDs Orphelins

```javascript
// Script de nettoyage (MongoDB)
db.medicaments.deleteMany({
  code: { $regex: /^MED\d{3}$/ },
  nom: { $exists: false }
});
```

### Réinitialisation de la Séquence

```javascript
// Réinitialiser la séquence (MongoDB)
db.medicaments.updateMany(
  { code: { $regex: /^MED\d{3}$/ } },
  { $unset: { code: 1 } }
);
```

## Évolutions Futures

- [ ] Support de préfixes personnalisés (ex: `ANTI000`, `VIT000`)
- [ ] Génération d'ID par catégorie
- [ ] Historique des modifications d'ID
- [ ] Import en masse avec génération automatique
- [ ] API REST pour la génération d'ID

## Support

Pour toute question ou problème :
1. Vérifiez les logs de la console
2. Exécutez les tests de validation
3. Consultez la documentation de la base de données
4. Contactez l'équipe de développement

---

**Version**: 1.0.0  
**Date**: 2024-12-20  
**Auteur**: Équipe Logi Clinic

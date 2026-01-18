# Importation des Médicaments dans LogiClinic

## Vue d'ensemble

Cette fonctionnalité permet d'importer automatiquement une liste complète de médicaments dans la base de données LogiClinic. Les médicaments sont automatiquement :

- ✅ Triés par ordre alphabétique
- ✅ Dédupliqués (aucun doublon)
- ✅ Attribués d'un code unique (MED000, MED001, MED002, etc.)
- ✅ Catégorisés automatiquement
- ✅ Classifiés selon leur nécessité de prescription

## Comment utiliser

### 1. Accéder à la fonctionnalité

1. Connectez-vous à LogiClinic
2. Allez dans **Stock** → **Gestion des Stocks de Médicaments**
3. Dans l'onglet **Tableau de Bord**, cliquez sur le bouton **"Importer Médicaments"**

### 2. Lancer l'importation

1. Une boîte de dialogue s'ouvre avec les informations sur l'importation
2. Cliquez sur **"Importer les Médicaments"**
3. Attendez la fin du processus (barre de progression)
4. Un résumé s'affiche avec le nombre de médicaments importés

### 3. Vérifier les résultats

Après l'importation, vous pouvez :
- Voir tous les médicaments dans la liste (triés alphabétiquement)
- Rechercher un médicament par nom ou code
- Utiliser les médicaments dans les formulaires (ils apparaîtront automatiquement triés)

## Liste des médicaments

La liste complète contient plus de **700 médicaments** extraits des images fournies, incluant :

- Médicaments pharmaceutiques (comprimés, gélules, sirops, injections, etc.)
- Matériel médical (sondes, cathéters, seringues, etc.)
- Tests de laboratoire (cassettes, réactifs, etc.)
- Consommables médicaux

## Structure des codes

Les codes sont générés automatiquement au format :
- `MED000` - Premier médicament
- `MED001` - Deuxième médicament
- `MED002` - Troisième médicament
- etc.

## Catégorisation automatique

Les médicaments sont automatiquement catégorisés selon leur nom :

- **Antibiotiques** : Amoxicilline, Céftriaxone, Ciprofloxacine, etc.
- **Antalgiques** : Paracétamol, Tramadol, Morphine, etc.
- **Anti-inflammatoires** : Ibuprofène, Diclofénac, etc.
- **Vitamines** : Vitamine C, Calcium, Fer, etc.
- **Anesthésiques** : Kétamine, Propofol, Lidocaine, etc.
- **Cardiovasculaires** : Nifédipine, Hydrochlorothiazide, etc.
- **Antidiabétiques** : Insuline, Metformine, etc.
- **Anticancéreux** : Vincristine, Docétaxel, Tamoxifène, etc.
- **Matériel médical** : Sondes, Cathéters, Seringues, etc.
- **Tests de laboratoire** : Tests rapides, Réactifs, etc.
- **Autres** : Pour les médicaments qui ne correspondent à aucune catégorie

## Prescription requise

Certains médicaments sont automatiquement marqués comme nécessitant une prescription :

- Antibiotiques
- Médicaments contrôlés (Morphine, Tramadol, Diazépam, etc.)
- Anticancéreux
- Anesthésiques

## Fichiers concernés

- `src/data/listeMedicamentsComplet.ts` - Liste complète des médicaments
- `src/scripts/importMedicaments.ts` - Script d'importation
- `src/components/stock/ImportMedicamentsDialog.tsx` - Interface d'importation
- `src/pages/StockMedicaments.tsx` - Page principale avec le bouton d'importation
- `src/services/medicamentService.ts` - Service de gestion des médicaments (tri alphabétique)

## Notes importantes

1. **Pas de doublons** : Le système vérifie automatiquement les doublons avant l'importation
2. **Codes uniques** : Chaque médicament reçoit un code unique, même s'il existe déjà
3. **Tri alphabétique** : Tous les médicaments sont automatiquement triés par nom
4. **Sécurité** : Les médicaments existants ne sont pas modifiés, seuls les nouveaux sont ajoutés
5. **Disponibilité globale** : Les médicaments importés sont disponibles pour **toutes les cliniques** (clinic_id = NULL). Ils apparaîtront automatiquement dans toutes les listes déroulantes de médicaments, quelle que soit la clinique connectée

## Support

Si vous rencontrez des problèmes lors de l'importation :

1. Vérifiez votre connexion Internet
2. Vérifiez que vous avez les permissions nécessaires
3. Consultez la console du navigateur pour les erreurs détaillées
4. Contactez l'administrateur système

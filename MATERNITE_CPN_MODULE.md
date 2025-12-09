# Module CPN (Consultation Prénatale) - Cahier des Charges

## Fichiers créés

### 1. Migration Supabase
- **Fichier**: `supabase_migrations/create_cpn_tables.sql`
- **Tables créées**:
  - `droits_fondamentaux` : Sensibilisation aux 10 droits de la mère
  - `vaccination_maternelle` : Suivi VAT1 à VAT5
  - `plan_accouchement` : Plan et préparation à l'accouchement
  - `soins_promotionnels` : Informations et fournitures distribuées
  - `consultation_prenatale` : Table principale des CPN
  - `traitement_cpn` : Traitements prescrits (TPI/SP, Fer, etc.)
  - `conseils_mere` : Conseils et informations données

### 2. Service CPN
- **Fichier**: `src/services/cpnService.ts`
- **Méthodes implémentées**:
  - Gestion des droits fondamentaux
  - Gestion de la vaccination maternelle
  - Gestion du plan d'accouchement
  - Gestion des soins promotionnels
  - CRUD complet pour les CPN
  - Calculs automatiques (trimestre, prochain RDV)
  - Vérification des CPN obligatoires
  - Statistiques

## Structure des Consultations Prénatales (CPN)

### CPN par Trimestre
- **CPN 1er trimestre** (< 13 SA) : CPN1
- **CPN 2e trimestre** (13-28 SA) : CPN2
- **CPN 3e trimestre** (> 28 SA) : CPN3, CPN4+

### Paramètres à saisir pour chaque CPN
1. **Identification**
   - Date de consultation
   - Numéro CPN
   - Terme en semaines

2. **Paramètres vitaux**
   - Poids, Taille utérine
   - Position fœtale, Mouvements fœtaux
   - Bruit du cœur fœtal
   - Œdèmes, État général
   - Tension artérielle, Température

3. **Examen obstétrical**
   - Palpation
   - Présentation (Céphalique, Siège, Transverse)
   - Hauteur Utérine (HU)

4. **Tests**
   - Tests urinaires : Albumine, Nitrite
   - Tests rapides : VIH, Syphilis, Glycémie
   - Examens labo : Hémoglobine, Groupe sanguin

5. **Signes de danger**
   - Effets secondaires
   - Signes de danger détectés

6. **Référence**
   - Référence nécessaire (Oui/Non)
   - Centre de référence
   - Motif
   - Suivi retour

7. **Diagnostic et décision**
   - Diagnostic
   - Décision thérapeutique
   - Prochain rendez-vous

## Traitements et Prévention

### 1. Prévention du Paludisme (TPI/SP)
- Dose 1, 2, 3
- Dates d'administration

### 2. Fer + Acide Folique
- Posologie
- Durée du traitement

### 3. Vaccination (VAT)
- VAT1 à VAT5
- Dates
- Calcul automatique de la prochaine dose

### 4. Autres médicaments
- Selon diagnostic

## Conseils à la Mère

Cases à cocher pour :
- Connaître les types de dangers
- Conseils nutritionnels
- Information sur PF (planification familiale)
- Hygiène et prévention
- Allaitement
- Préparation au travail d'accouchement

## Fonctionnalités Automatiques

1. **Calcul du trimestre** : Basé sur le terme en semaines
2. **Calcul du prochain RDV** :
   - CPN1 → CPN2 : +4 semaines
   - CPN2 → CPN3 : +4 semaines
   - CPN3 → CPN4 : +2 semaines
   - CPN4+ : +1 semaine

3. **Vérification des CPN obligatoires** : Alertes si CPN1-4 non complètes

4. **Alertes automatiques** :
   - CPN manquée
   - Tests positifs (VIH, Syphilis)
   - Signes de danger détectés
   - Référence nécessaire

## Statistiques et Rapports

Le système peut générer :
- Nombre de CPN par mois/trimestre
- Taux de complétion des CPN obligatoires
- Vaccinations complétées (VAT1-5)
- Références effectuées
- Tests positifs (VIH, Syphilis)
- Suivi des signes de danger
- Distribution des fournitures (moustiquaires, préservatifs, etc.)

## Prochaines Étapes d'Implémentation

### Composants React à créer :

1. **GestionDroitsFondamentaux.tsx**
   - Checklist des 10 droits avec dates
   - Validation et sauvegarde

2. **GestionVaccination.tsx**
   - Formulaire VAT1-VAT5
   - Calcul automatique prochaine dose
   - Historique vaccinal

3. **GestionPlanAccouchement.tsx**
   - Formulaire de préparation
   - Accompagnant, transport, communication
   - Évaluation des risques

4. **GestionSoinsPromotionnels.tsx**
   - Informations données (VIH/PTME, Paludisme, etc.)
   - Fournitures distribuées (dates + quantités)

5. **FormulaireCPN.tsx**
   - Formulaire complet de consultation
   - Organisation par trimestre
   - Paramètres vitaux, examens, tests
   - Diagnostic et décision

6. **GestionTraitements.tsx**
   - TPI/SP (doses 1-3)
   - Fer + Acide folique
   - Autres médicaments

7. **ConseilsMere.tsx**
   - Checklist des conseils
   - Zone de notes

8. **ReferenceContreReference.tsx**
   - Formulaire de référence
   - Suivi du retour

9. **TableauCPN.tsx**
   - Liste de toutes les CPN
   - Visualisation par trimestre
   - Statuts (terminée, manquée, programmée)

10. **DashboardCPN.tsx**
    - Résumé des CPN
    - Indicateurs clés
    - Prochains RDV
    - Alertes

## Installation

### 1. Appliquer la migration
```sql
-- Exécuter : supabase_migrations/create_cpn_tables.sql
```

### 2. Vérifier les relations
- La table `dossier_obstetrical` doit exister
- Les clés étrangères doivent être correctement configurées

### 3. Tester le service
```typescript
import { CPNService } from './services/cpnService';

// Créer une CPN
const cpn = await CPNService.createCPN({
  dossier_obstetrical_id: 'xxx',
  numero_cpn: 1,
  date_consultation: '2024-01-15',
  terme_semaines: 12,
  // ...
});
```

## Notes Techniques

### Relations entre tables
```
dossier_obstetrical (1)
  ├── droits_fondamentaux (1)
  ├── vaccination_maternelle (1)
  ├── plan_accouchement (1)
  ├── soins_promotionnels (1)
  └── consultation_prenatale (n)
       ├── traitement_cpn (n)
       └── conseils_mere (1)
```

### Validation des données
- **CPN1 obligatoire** au 1er trimestre (< 13 SA)
- **CPN2 obligatoire** au 2e trimestre (13-28 SA)
- **CPN3 obligatoire** au 3e trimestre (> 28 SA)
- **CPN4 obligatoire** avant l'accouchement
- **Minimum 4 CPN** pour une grossesse complète

### Calculs automatiques
- **Trimestre** : Calculé à partir du terme en semaines
- **Prochain RDV** : Calculé selon le numéro de CPN
- **Prochaine dose VAT** : Calculée selon le calendrier vaccinal

## Support et Documentation

Pour plus d'informations :
- Consulter le cahier des charges complet
- Voir les commentaires dans le code
- Tester avec des données de démonstration


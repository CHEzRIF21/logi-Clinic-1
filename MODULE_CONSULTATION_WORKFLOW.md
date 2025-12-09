# Module Consultation - Workflow Guidé Implémenté

## ✅ Résumé de l'implémentation

Le workflow guidé de consultation selon les 12 étapes du cahier des charges a été implémenté.

## 📋 Structure du Workflow

### Composant Principal
- **`ConsultationWorkflow.tsx`** : Composant principal qui orchestre les 12 étapes avec un stepper vertical

### Les 12 Étapes Implémentées

#### Étape 1 — Accueil / Identification du Patient ✅
- **Composant**: `ConsultationWorkflowStep1.tsx`
- **Fonctionnalités**:
  - Affichage des informations patient (nom, prénom, identifiant, âge, sexe)
  - Contact (téléphone, adresse)
  - Alertes visuelles pour allergies, maladies chroniques, antécédents
  - Calcul automatique de l'âge

#### Étape 2 — Démarrage d'une Nouvelle Consultation ✅
- **Composant**: `ConsultationWorkflowStep2.tsx`
- **Fonctionnalités**:
  - Choix de la fiche/spécialité (Médecine générale, Gynéco, CPN, Pédiatrie, etc.)
  - Sélection du template de consultation
  - Affichage de l'heure d'ouverture de la consultation
  - Traçabilité : "consultation ouverte à HH:MM"

#### Étape 3 — Motif de Consultation (OBLIGATOIRE) ✅
- **Composant**: `ConsultationWorkflowStep3.tsx`
- **Fonctionnalités**:
  - Champ obligatoire : Motif principal
  - Symptômes associés
  - Durée / début des symptômes
  - Ajout en tags avec suppression individuelle
  - Validation avant progression

#### Étape 4 — Antécédents Médicaux (Mise à jour rapide) ✅
- **Composant**: `ConsultationWorkflowStep4.tsx`
- **Fonctionnalités**:
  - Affichage des antécédents médicaux, chirurgicaux, gynéco-obstétricaux
  - Allergies (avec alerte visuelle)
  - Traitements habituels
  - Possibilité d'ajouter/modifier directement
  - Synchronisation avec le dossier patient

#### Étape 5 — Anamnèse Complète ✅
- **Composant**: `ConsultationWorkflowStep5.tsx`
- **Fonctionnalités**:
  - Historique du motif
  - Signes associés
  - Signes négatifs
  - Traitements antérieurs
  - Évolution
  - Éditeur de texte riche

#### Étape 6 — Examen Clinique ✅
- **Composant**: `ConsultationWorkflowStep6.tsx`
- **Fonctionnalités**:
  - **6.1 Signes vitaux** : Intégration avec `ConstantesSection`
    - Température, Tension artérielle, Poids, Taille
    - IMC (calcul automatique)
    - Saturation O₂, FC, FR
  - **6.2 Examen physique par appareil** :
    - Respiratoire, Digestif, Cardio-vasculaire
    - Système nerveux, Appareil locomoteur
    - Examen général
    - Examen gynéco (si fiche gynéco)

#### Étape 7 — Hypothèses Diagnostiques ✅
- **Composant**: `ConsultationWorkflowStep7.tsx`
- **Fonctionnalités**:
  - Diagnostic(s) probable(s)
  - Diagnostics différentiels
  - Codification CIM-10 (paramétrable)
  - Examens complémentaires à demander

#### Étape 8 — Prescriptions ✅
- **Composant**: `ConsultationWorkflowStep8.tsx`
- **Fonctionnalités**:
  - **8.1 Médicaments** :
    - Recherche médicament (lié au stock réel)
    - Alertes : rupture de stock, allergie, incompatibilité
    - Posologie : dose + fréquence + durée
    - Quantité totale calculée automatiquement
    - Envoi automatique à la Pharmacie + Facturation
  - **8.2 Examens (Labo / Imagerie)** :
    - Liste paramétrable des examens
    - Prix visible
    - Archivage automatique
    - Envoi au Labo / Imagerie
  - **8.3 Hospitalisation** :
    - Type de prise en charge
    - Durée souhaitée
    - Chambre / lit
    - Actes infirmiers associés

#### Étape 9 — Plan de Traitement ✅
- **Composant**: `ConsultationWorkflowStep9.tsx`
- **Fonctionnalités**:
  - Conseils
  - Mesures hygiéno-diététiques
  - Suivi particulier
  - Restrictions éventuelles

#### Étape 10 — Rendez-vous de Suivi ✅
- **Composant**: `ConsultationWorkflowStep10.tsx`
- **Fonctionnalités**:
  - Proposition automatique de date selon :
    - Type de pathologie
    - Disponibilité médecin
    - Disponibilité service
  - Création du RDV
  - Message patient (SMS/WhatsApp si autorisé)

#### Étape 11 — Facturation Automatique ✅
- **Composant**: `ConsultationWorkflowStep11.tsx`
- **Fonctionnalités**:
  - À la validation de la consultation :
    - Acte "Consultation"
    - Médicaments prescrits
    - Examens demandés
    - Actes infirmiers
  - Transmission automatique au module Caisse
  - Vérification de la prise en charge (assurance)

#### Étape 12 — Clôture de la Consultation ✅
- **Composant**: `ConsultationWorkflowStep12.tsx`
- **Fonctionnalités**:
  - Données obligatoires :
    - Diagnostic final
    - Justification du traitement
    - Signature numérique
    - Heure de fin
  - Le dossier est ensuite archivé

## 🎯 Fonctionnalités Clés

### Validation des Étapes
- Les étapes obligatoires (1, 2, 3, 12) sont validées avant progression
- Indicateurs visuels pour les étapes complètes/incomplètes
- Blocage de progression si étape obligatoire non complétée

### Navigation
- Navigation libre entre les étapes complétées
- Stepper vertical avec icônes
- Indicateurs de progression visuels

### Intégration
- Intégration avec les modules existants :
  - ConstantesSection pour les signes vitaux
  - PrescriptionFormModal pour les prescriptions
  - LabRequestWizard pour les examens labo
  - ImagingRequestWizard pour les examens imagerie
  - ProtocolModal pour l'hospitalisation

## 📝 Utilisation

Le workflow est automatiquement activé dans `ConsultationsComplete.tsx` pour les consultations en cours.

Pour désactiver le mode workflow et utiliser le mode classique, modifier la variable `useWorkflowMode` dans `ConsultationsComplete.tsx`.

## 🔄 Prochaines Étapes

1. ✅ Workflow guidé implémenté
2. ⏳ Système de prescriptions avec alertes complètes (en cours)
3. ⏳ Facturation automatique complète
4. ⏳ Rendez-vous automatique avec proposition intelligente
5. ⏳ Historique patient avec PDF

## 📁 Fichiers Créés

```
src/components/consultation/
├── ConsultationWorkflow.tsx (composant principal)
└── workflow/
    ├── ConsultationWorkflowStep1.tsx
    ├── ConsultationWorkflowStep2.tsx
    ├── ConsultationWorkflowStep3.tsx
    ├── ConsultationWorkflowStep4.tsx
    ├── ConsultationWorkflowStep5.tsx
    ├── ConsultationWorkflowStep6.tsx
    ├── ConsultationWorkflowStep7.tsx
    ├── ConsultationWorkflowStep8.tsx
    ├── ConsultationWorkflowStep9.tsx
    ├── ConsultationWorkflowStep10.tsx
    ├── ConsultationWorkflowStep11.tsx
    └── ConsultationWorkflowStep12.tsx
```


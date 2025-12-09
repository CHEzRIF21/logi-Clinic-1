# Module Consultation - Documentation Complète

## 📋 Vue d'ensemble

Le module Consultation est un système complet de gestion des consultations médicales avec workflow guidé en 9 étapes, supportant plusieurs spécialités et fiches personnalisables.

## 🎯 Fonctionnalités Principales

### 1. Sélection et Identification du Patient
- ✅ Recherche avancée (nom, prénom, dossier, téléphone)
- ✅ Filtres par service et statut
- ✅ Affichage des informations principales du patient
- ✅ Vérification de l'exactitude du profil

### 2. Démarrage de la Consultation
- ✅ Choix du type de fiche par spécialité
- ✅ Support des fiches personnalisées
- ✅ Templates pré-configurés pour chaque spécialité

### 3. Gestion des Antécédents
- ✅ Antécédents médicaux
- ✅ Allergies
- ✅ Maladies chroniques
- ✅ Médicaments réguliers
- ✅ Alertes si données manquantes

### 4. Saisie des Motifs
- ✅ Ajout structuré en tags
- ✅ Archivage automatique daté
- ✅ Suppression individuelle

### 5. Anamnèse Détaillée
- ✅ Dictée vocale (Web Speech API)
- ✅ Signes positifs/négatifs structurés
- ✅ Traitements antérieurs
- ✅ Bilans réalisés
- ✅ Évolution de la pathologie

### 6. Examen Clinique
- ✅ Constantes vitales structurées
- ✅ Examen physique selon la fiche choisie
- ✅ Actes médicaux/paramédicaux

### 7. Diagnostics
- ✅ Hypothèses diagnostiques multiples
- ✅ Codification CIM-10
- ✅ Synthèse de consultation

### 8. Prescriptions
- ✅ Prescription de médicaments
- ✅ Alertes allergies/incompatibilités
- ✅ Alertes stock
- ✅ Intégration avec le module Pharmacie

### 9. Clôture et Historique
- ✅ Archivage automatique
- ✅ Historique complet accessible
- ✅ Consultation des antécédents
- ✅ Export PDF

## 🏥 Fiches Spécialisées Disponibles

| Spécialité | Nom de la Fiche | Description |
|------------|----------------|-------------|
| Médecine générale | Fiche Standard | Consultations courantes adultes/enfants |
| Gynécologie | Fiche Gynéco | Consultations femmes, suivi gynécologique |
| Gynécologie | Fiche CPN | Suivi prénatal |
| Ophtalmologie | Fiche Ophtalmo | Examens et suivis oculaires |
| Urologie | Fiche Uro | Plaintes urinaires et génito-urinaires |
| Dermatologie | Fiche JD | Problèmes cutanés, suivi dermatologique |
| Pédiatrie | Fiche Pédiatrie | Consultations nourrissons, enfants |

## 🚀 Accès au Module

### Via le Menu
- Cliquez sur **"Nouvelle Consultation"** dans le menu latéral

### Via l'URL
- Accédez directement à `/consultation-module`

## 📁 Structure des Fichiers

```
src/
├── components/
│   └── consultation/
│       ├── PatientSearchAdvanced.tsx      # Recherche patient avancée
│       ├── ConsultationStartDialog.tsx    # Démarrage consultation
│       ├── AntecedentsManager.tsx         # Gestion antécédents
│       ├── AnamneseEditor.tsx             # Éditeur anamnèse avec dictée
│       ├── ConsultationWorkflow.tsx       # Workflow guidé 12 étapes
│       └── ... (autres composants existants)
├── pages/
│   └── ConsultationModule.tsx            # Page principale du module
└── services/
    ├── consultationApiService.ts          # API consultations
    ├── consultationBillingService.ts      # Facturation automatique
    ├── rendezVousService.ts               # Rendez-vous automatiques
    └── patientHistoryService.ts           # Historique patient

supabase_migrations/
├── fix_consultation_tables.sql            # Corrections tables
├── create_specialized_consultation_templates.sql  # Templates spécialisés
└── apply_consultation_migrations.sql     # Script d'application
```

## 🔧 Configuration et Installation

### 1. Appliquer les Migrations SQL

Suivez le guide dans `MIGRATION_GUIDE.md` pour appliquer les migrations dans Supabase.

### 2. Vérifier les Routes

Les routes sont déjà configurées dans `App.tsx` :
- `/consultations` - Page consultations existante
- `/consultation-module` - Nouveau module guidé

### 3. Vérifier les Services

Assurez-vous que les services suivants sont configurés :
- `consultationApiService` - API Supabase
- `patientService` - Gestion patients
- `facturationService` - Facturation

## 📝 Workflow Utilisateur

1. **Sélection Patient** → Recherche et sélection
2. **Démarrage** → Choix du type de fiche
3. **Antécédents** → Vérification/complétion
4. **Motifs** → Ajout des motifs de consultation
5. **Anamnèse** → Description détaillée (avec dictée vocale)
6. **Examen Clinique** → Constantes et examen physique
7. **Diagnostics** → Hypothèses diagnostiques avec CIM-10
8. **Prescriptions** → Médicaments avec alertes
9. **Clôture** → Archivage et facturation automatique

## 🎨 Personnalisation

### Ajouter une Nouvelle Fiche

1. Connectez-vous à Supabase Dashboard
2. Allez dans SQL Editor
3. Exécutez :

```sql
INSERT INTO consultation_templates (nom, specialite, description, sections, champs, actif)
VALUES (
  'Nom de votre fiche',
  'Votre spécialité',
  'Description de la fiche',
  '["constantes", "anamnese", "examens_cliniques", "diagnostics", "prescriptions"]'::jsonb,
  '[
    {"section": "examens_cliniques", "key": "votre_champ", "type": "textarea", "label": "Votre Label", "required": false}
  ]'::jsonb,
  true
);
```

### Modifier une Fiche Existante

1. Allez dans Paramètres → Module Consultation → A. Fiches de Consultation
2. Modifiez les champs selon vos besoins
3. Les modifications sont immédiatement disponibles

## 🔒 Sécurité et Confidentialité

- ✅ Traçabilité complète des accès
- ✅ Historisation des modifications
- ✅ Gestion des droits d'accès par rôle
- ✅ Sauvegardes automatiques
- ✅ Conformité RGPD (données patient)

## 🔗 Intégrations

Le module s'intègre avec :
- ✅ **Module Pharmacie** - Prescriptions et alertes stock
- ✅ **Module Laboratoire** - Demandes d'examens
- ✅ **Module Imagerie** - Demandes d'imagerie
- ✅ **Module Facturation** - Facturation automatique
- ✅ **Module Rendez-vous** - Rendez-vous de suivi automatiques
- ✅ **Module Patients** - Historique et antécédents

## 📊 Rapports et Statistiques

- Historique complet des consultations par patient
- Export PDF des consultations
- Statistiques par spécialité
- Suivi des motifs les plus fréquents

## 🐛 Dépannage

### La dictée vocale ne fonctionne pas
- Vérifiez que vous utilisez Chrome ou Edge (support Web Speech API)
- Autorisez l'accès au microphone dans les paramètres du navigateur

### Les templates ne s'affichent pas
- Vérifiez que les migrations SQL ont été appliquées
- Vérifiez que `consultation_templates` contient des données

### Erreur lors de la sauvegarde
- Vérifiez la connexion à Supabase
- Vérifiez les RLS policies
- Consultez la console du navigateur pour les détails

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs dans Supabase Dashboard
2. Vérifiez la console du navigateur
3. Consultez la documentation Supabase

## 🎯 Prochaines Améliorations

- [ ] Export Excel des consultations
- [ ] Intégration avec DMP (Dossier Médical Partagé)
- [ ] Notifications push pour les rendez-vous
- [ ] Mode hors ligne avec synchronisation
- [ ] Intégration avec systèmes externes (HL7, FHIR)


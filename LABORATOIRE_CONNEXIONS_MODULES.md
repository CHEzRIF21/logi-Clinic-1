# 🔗 Connexions Inter-Modules du Laboratoire

## Vue d'ensemble

Le module Laboratoire est le "cœur diagnostique" du centre de santé. Il est interconnecté avec plusieurs autres modules pour assurer un flux de travail fluide et efficace.

## Tableau des Connexions

| Module Connecté | Sens du Flux | Détail de la Connexion |
|-----------------|--------------|------------------------|
| **Gestion Patient** | Entrée ➡️ | Récupération de l'âge et du sexe pour les valeurs normales automatiques |
| **Consultation** | Bidirectionnel ↔️ | Prescription électronique + Résultats dans le dossier patient |
| **Maternité** | Bidirectionnel ↔️ | Bilans prénataux + Résultats urgents sages-femmes |
| **Caisse** | Entrée ➡️ | Verrouillage si facture non payée |
| **Stock Médicaments** | Sortie ⬅️ | Déstockage automatique des réactifs |
| **Imagerie** | Aucun lien | Consultation croisée dans le dossier global uniquement |
| **Tableau de Bord** | Sortie ⬅️ | KPI : Temps d'attente, Examens/jour, Taux positivité |
| **Bilan Financier** | Sortie ⬅️ | CA généré vs Coût des réactifs |

---

## 1. Gestion Patient → Laboratoire (Entrée)

### Description
Le Labo récupère l'âge et le sexe du patient pour déterminer automatiquement les valeurs normales.

### Importance
Les valeurs de référence varient selon :
- Le sexe (ex: hémoglobine différente homme/femme)
- L'âge (ex: valeurs différentes pour nourrisson/enfant/adulte)
- La condition (ex: femme enceinte)

### Implémentation
```typescript
// Service: LaboratoireIntegrationService.ts
static async getValeursReferencePatient(patientId: string, parametre: string)
```

### Fonction SQL
```sql
CREATE OR REPLACE FUNCTION get_valeurs_reference_patient(
  p_patient_id UUID,
  p_parametre VARCHAR
)
-- Retourne les valeurs de référence adaptées au patient
```

---

## 2. Consultation ↔ Laboratoire (Bidirectionnel)

### Flux Entrant (Consultation → Labo)
- Le médecin envoie une **prescription électronique** (Order Entry)
- La prescription est reçue dans la file d'attente du laboratoire

### Flux Sortant (Labo → Consultation)
- Une fois validé, le **résultat s'affiche directement** dans le dossier de consultation
- Notification automatique au médecin prescripteur

### Implémentation
```typescript
// Créer une prescription depuis une consultation
static async createPrescriptionFromConsultation(
  consultationId: string,
  patientId: string,
  typeExamen: string
)

// Envoyer les résultats au dossier
static async sendResultsToConsultation(rapportId: string, prelevementId: string)

// Récupérer les résultats pour une consultation
static async getResultsForConsultation(consultationId: string)
```

### Tables impliquées
- `lab_prescriptions.consultation_id` → lien avec la consultation
- `lab_resultats_consultation` → table de liaison pour les résultats transmis

---

## 3. Maternité ↔ Laboratoire (Bidirectionnel)

### Bilans Prénataux Obligatoires

| CPN | Examens Obligatoires |
|-----|---------------------|
| CPN 1 | Groupe sanguin, NFS, VIH, Syphilis, Toxoplasmose, Rubéole, ECBU |
| CPN 2 | Glycémie à jeun |
| CPN 3 | Protéinurie, RAI |

### Résultats Urgents
Les résultats pathologiques sont **immédiatement notifiés** aux sages-femmes via :
- Notification dans le système
- Priorité "critique" pour les résultats urgents

### Implémentation
```typescript
// Récupérer les examens obligatoires pour une CPN
static async getExamensMaterniteObligatoires(numeroCPN: number)

// Créer les prescriptions maternité
static async createPrescriptionsMaternite(patientId, numeroCPN, cpnId, sageFemme)

// Notifier les sages-femmes
static async notifySageFemmeResultatUrgent(analyseId, patientId, grossesseId)
```

### Tables impliquées
- `lab_examens_maternite` → catalogue des examens prénataux
- `lab_notifications_maternite` → notifications pour sages-femmes

---

## 4. Caisse → Laboratoire (Entrée)

### Règle de Gestion
**"Si facture non payée → Interdiction de valider les résultats ou d'imprimer le bulletin"**

### Statuts de Paiement
| Statut | Peut Prélever | Peut Valider | Peut Imprimer |
|--------|---------------|--------------|---------------|
| `non_facture` | ✅ | ❌ | ❌ |
| `en_attente` | ✅ | ✅ | ❌ |
| `paye` | ✅ | ✅ | ✅ |
| `exonere` | ✅ | ✅ | ✅ |

### Configuration
Le verrouillage peut être désactivé via la configuration :
```sql
INSERT INTO configurations_laboratoire (cle, valeur)
VALUES ('labo_paiement_obligatoire', 'false');
```

### Implémentation
```typescript
// Vérifier le statut de paiement
static async checkPaiementStatus(prescriptionId: string)

// Enregistrer un paiement
static async enregistrerPaiement(prescriptionId, factureId, montant, mode)

// Créer un ticket de facturation
static async createTicketFacturation(prescriptionId, patientId, typeExamen, montant)
```

### Tables impliquées
- `lab_prescriptions.statut_paiement`
- `lab_prescriptions.facture_id`
- `lab_verrouillage_resultats`

---

## 5. Laboratoire → Stock Médicaments (Sortie)

### Principe
À chaque **validation d'examen**, le module Labo envoie une instruction au Stock pour **décrémenter la quantité de réactif** correspondante.

### Correspondance Examen → Réactifs
| Examen | Réactifs Utilisés |
|--------|------------------|
| NFS | Tube EDTA, Colorant Giemsa |
| Glycémie | Tube sec, Réactif glucose |
| VIH | Kit VIH RDT |
| Paludisme | Kit Palu RDT |
| Groupe sanguin | Anti-A, Anti-B, Anti-D |

### Déstockage Automatique
Le trigger `trigger_destockage_reactifs_analyse` décrémente automatiquement le stock lors de la validation d'une analyse.

### Implémentation
```typescript
// Enregistrer la consommation de réactifs
static async enregistrerConsommationReactifs(analyseId, consommations)

// Récupérer les réactifs nécessaires pour un examen
static async getReactifsNecessaires(codeExamen)

// Commander des réactifs
static async commanderReactifs(reactifId, quantite, raison, priorite)
```

### Tables impliquées
- `lab_examen_reactifs` → correspondance examen/réactifs
- `lab_consommation_analyse` → historique des consommations
- `lab_stocks_reactifs` → stock des réactifs

---

## 6. Laboratoire → Tableau de Bord (Sortie)

### KPI Envoyés
| Indicateur | Description |
|------------|-------------|
| **Temps d'attente moyen** | Délai entre prélèvement et validation |
| **Nombre d'examens/jour** | Volume d'activité quotidienne |
| **Taux de positivité** | % de résultats positifs (VIH, Paludisme, etc.) |
| **Analyses terminées** | Nombre d'analyses validées |
| **Résultats pathologiques** | Nombre de résultats hors normes |

### Détection d'Épidémies
Le système surveille automatiquement les augmentations anormales de cas positifs :
- Seuil d'alerte : +50% sur 7 jours
- Minimum 10 cas pour déclencher l'alerte

### Implémentation
```typescript
// Récupérer les KPI
static async getLabKPI()

// Détecter une épidémie
static async detecterEpidemie(parametre, periodeJours, seuilAugmentation)
```

### Vue SQL
```sql
CREATE OR REPLACE VIEW v_laboratoire_kpi AS
-- Agrège tous les indicateurs clés du laboratoire
```

---

## 7. Laboratoire → Bilan Financier (Sortie)

### Données Envoyées
| Donnée | Description |
|--------|-------------|
| **Chiffre d'affaires** | Total des prescriptions payées |
| **Coût des réactifs** | Consommation valorisée |
| **Marge brute** | CA - Coûts |
| **Top examens** | Examens les plus rentables |

### Implémentation
```typescript
// Récupérer le bilan financier
static async getBilanFinancier(dateDebut?, dateFin?)
```

### Vue SQL
```sql
CREATE OR REPLACE VIEW v_laboratoire_bilan_financier AS
-- Calcule le bilan financier mensuel
```

---

## Fichiers Créés/Modifiés

### Migrations SQL
1. `supabase_migrations/create_laboratoire_connexions_modules.sql`
   - Vue `v_patient_labo_info`
   - Fonction `get_valeurs_reference_patient`
   - Table `lab_resultats_consultation`
   - Table `lab_examens_maternite`
   - Table `lab_notifications_maternite`
   - Colonnes de paiement dans `lab_prescriptions`
   - Table `lab_verrouillage_resultats`
   - Table `lab_consommation_analyse`
   - Table `lab_examen_reactifs`
   - Trigger `trigger_destockage_reactifs_analyse`
   - Vue `v_laboratoire_kpi`
   - Vue `v_laboratoire_bilan_financier`

### Services TypeScript
1. `src/services/laboratoireIntegrationService.ts`
   - `getPatientLabInfo()`
   - `getValeursReferencePatient()`
   - `createPrescriptionFromConsultation()`
   - `sendResultsToConsultation()`
   - `getResultsForConsultation()`
   - `getExamensMaterniteObligatoires()`
   - `createPrescriptionsMaternite()`
   - `notifySageFemmeResultatUrgent()`
   - `checkPaiementStatus()`
   - `enregistrerPaiement()`
   - `createTicketFacturation()`
   - `enregistrerConsommationReactifs()`
   - `getReactifsNecessaires()`
   - `commanderReactifs()`
   - `getLabKPI()`
   - `detecterEpidemie()`
   - `getBilanFinancier()`
   - `getSyntheseIntegrations()`

### Composants React
1. `src/components/laboratoire/IntegrationsPanelModern.tsx`
   - Tableau des connexions inter-modules
   - Cartes visuelles par module
   - Dialog KPI
   - Dialog Bilan Financier
   - Synthèse des intégrations

---

## Application des Migrations

```bash
# Via Supabase CLI
supabase db execute --file supabase_migrations/create_laboratoire_connexions_modules.sql

# Ou via le Dashboard Supabase
# 1. Aller dans SQL Editor
# 2. Copier/coller le contenu du fichier
# 3. Exécuter
```

---

## Prochaines Évolutions Possibles

1. **Intégration HL7/FHIR** : Standard d'interopérabilité santé
2. **Connexion automates** : Interface avec les appareils de laboratoire
3. **Télétransmission** : Envoi des résultats aux assurances
4. **Portail patient** : Accès aux résultats en ligne
5. **Alertes SMS** : Notification des résultats urgents par SMS


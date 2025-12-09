# Règles Métiers - Module Consultation

## 1. Données Patient et Constantes

### 1.1 Valeurs Initiales

- Les valeurs initiales des constantes sont stockées dans `patient.latestConstants` (ou équivalent)
- À l'ouverture d'une consultation, ces valeurs sont **préremplies automatiquement** dans le formulaire de constantes
- L'utilisateur peut modifier ces valeurs pendant la consultation

### 1.2 Édition Pendant Consultation

- **Tout changement** de constante crée automatiquement un `ConsultationEntry` (version)
- Chaque modification est tracée avec :
  - Section: "constantes"
  - Données modifiées (JSON)
  - Utilisateur qui a modifié
  - Timestamp

### 1.3 Options de Synchronisation

#### Option A : Application Immédiate (Configurable)
- Si activée : Les modifications sont **immédiatement appliquées** au dossier patient
- Utile si un infirmier corrige une erreur évidente
- Configuration : `autoApplyConstants: true`

#### Option B : Validation Médecin (Par Défaut - Recommandé)
- Les modifications **ne sont pas écrasées** dans le dossier patient tant qu'un médecin n'a pas validé
- Bouton "Appliquer au dossier patient" disponible pour le médecin
- Configuration : `autoApplyConstants: false` (par défaut)

### 1.4 Validations

Les constantes doivent respecter les plages suivantes :

| Constante | Plage Valide | Message d'Erreur |
|-----------|--------------|------------------|
| Température | 30..45 °C | "La température doit être entre 30 et 45 °C" |
| Poids | > 0 kg | "Le poids doit être supérieur à 0 kg" |
| Taille | > 30 cm | "La taille doit être supérieure à 30 cm" |
| TA Systolique | 40..300 mmHg | "La tension systolique doit être entre 40 et 300 mmHg" |
| TA Diastolique | 30..200 mmHg | "La tension diastolique doit être entre 30 et 200 mmHg" |

**IMC** : Calculé automatiquement lors de la saisie de taille et poids
- Formule: `IMC = poids (kg) / (taille (m))²`
- Arrondi à 1 décimale

---

## 2. Protocoles & Facturation

### 2.1 Création de Protocole

Un protocole contient :
- **Type d'admission** : SOINS_DOMICILE | AMBULATOIRE | OBSERVATION | HOSPITALISATION
- **Items** : Médicaments, Consommables, Actes
- **Horaires** : Protocole à suivre avec heures, dosages, répétitions
- **Instructions** : Instructions de suivi

### 2.2 Facturation Automatique

- Si produits/actes marqués **facturables** → proposer création automatique d'opération/facture
- Flag `facturable: true` dans le protocole
- Action proposée : "Enregistrer et Facturer"

### 2.3 Vérification Stock (Médicaments)

Pour médicaments avec **pharmacie interne** sélectionnée :
1. Vérifier la disponibilité du stock (magasin détail)
2. Si stock insuffisant :
   - Marquer le protocole avec `PENDING_STOCK`
   - Proposer une alerte au responsable pharmacie
   - Afficher un message : "Stock insuffisant pour [médicament]. Alerte envoyée."

### 2.4 Influence du Type d'Admission

- **SOINS_DOMICILE** : Coût unitaire standard
- **AMBULATOIRE** : Coût unitaire standard
- **OBSERVATION** : Coût unitaire × 1.5 (surveillance)
- **HOSPITALISATION** : Coût unitaire × 2 + frais de chambre

---

## 3. Demandes Labo / Imagerie

### 3.1 Renseignement Clinique Obligatoire

- Le champ `clinicalInfo` est **obligatoire** pour toute soumission
- Validation côté serveur : retourne erreur 400 si vide
- Message : "Le renseignement clinique est obligatoire pour toute demande d'analyse"

### 3.2 Type INTERNE

- Si `type = 'INTERNE'` :
  - Créer automatiquement une prescription labo dans le module Laboratoire
  - Notifier le laboratoire via queue (notification interne / websocket)
  - Statut initial : `EN_ATTENTE`

### 3.3 Type EXTERNE

- Si `type = 'EXTERNE'` :
  - Créer un PDF imprimable avec :
    - Informations patient
    - Renseignement clinique
    - Liste des examens demandés
    - Date et signature du prescripteur
  - Conserver une trace dans la base de données
  - Statut initial : `EN_ATTENTE`

---

## 4. Droits & Verrouillage

### 4.1 Modification d'Entrées Validées

- Seul **médecin/admin** peut modifier une `ConsultationEntry` déjà validée par un autre médecin
- Vérification :
  ```javascript
  if (entry.created_by !== currentUser.id && currentUser.role !== 'admin') {
    // Refuser la modification
  }
  ```

### 4.2 Audit Log

Tous les changements sont loggués dans `AuditLog` avec :
- `oldValue` : Valeur avant modification (JSON)
- `newValue` : Valeur après modification (JSON)
- `user` : ID de l'utilisateur qui a fait la modification
- `timestamp` : Date et heure de la modification
- `entity` : "CONSULTATION" | "CONSULTATION_ENTRY" | "PROTOCOL" | etc.
- `action` : "CREATE" | "UPDATE" | "DELETE"

### 4.3 Rôles & Permissions

| Rôle | Permissions |
|------|-------------|
| **Admin** | Accès complet, peut créer/modifier/supprimer templates |
| **Médecin** | Peut créer/modifier/clôturer consultations, modifier toutes les entrées |
| **Infirmier** | Peut ajouter constantes et motifs, modifier ses propres entrées |
| **Pharmacien** | Peut dispenser les prescriptions |
| **Laborantin** | Peut traiter les demandes d'analyse |
| **Caissier** | Peut créer les opérations facturables |

---

## 5. UX / Comportement UI

### 5.1 Modal Constantes

**Layout :**
- Champs groupés en **2 colonnes**
- Bouton "Calculer IMC" → calcule instantané (automatique lors de la saisie)

**Sauvegarde :**
- Crée une entrée versionnée
- Met à jour l'UI immédiatement
- Affiche un toast :
  - Si `syncToPatient = false` : "Constantes enregistrées — non appliquées au dossier patient"
  - Si `syncToPatient = true` : "Constantes enregistrées et appliquées au dossier patient"

### 5.2 Modal Protocole de Soins

**Sections :**

1. **Admission** (radio buttons)
   - SOINS_DOMICILE
   - AMBULATOIRE
   - OBSERVATION
   - HOSPITALISATION

2. **Médicaments**
   - Select produit (autocomplete)
   - Quantité totale
   - Mode d'administration
   - Pharmacie (Interne/Externe)

3. **Consommables**
   - Select consommable
   - Quantité

4. **Actes**
   - Select acte
   - Nombre de fois

5. **Protocole à suivre**
   - Saisir horaires (format HH:mm)
   - Dosage
   - Bouton "+ Ajouter" → construit la schedule

**Actions de sauvegarde :**
- "Enregistrer" : Sauvegarde uniquement
- "Enregistrer et Facturer" : Sauvegarde + crée opérations facturables
- "Enregistrer et Générer Ordonnance" : Sauvegarde + crée prescription

**Validation :**
- Quantité > 0 pour chaque item
- Au moins un item requis

### 5.3 Modal Demande d'Analyse

**Étape 1 : Type et contexte clinique**
- Choisir type (interne/externe)
- Saisie renseignement clinique (required, multiline, min 50 caractères)
- Validation : Bloque le passage à l'étape 2 si vide

**Étape 2 : Sélection des examens**
- Checklist d'examens disponibles
- Affichage du nombre d'examens sélectionnés
- Validation : Au moins un examen requis

**Actions :**
- "Enregistrer" : Crée la demande
- "Enregistrer et Imprimer" : Crée + génère PDF
- "Enregistrer et Envoyer au labo" : Crée + notifie (si interne)

### 5.4 Timeline & Historique

**Affichage :**
- Chaque entrée affichée avec :
  - Icône selon le type (constante / anamnèse / protocole / prescription / lab)
  - Date et heure
  - Utilisateur qui a fait la modification
  - Données modifiées (format JSON lisible)

**Actions disponibles :**
- **Modifier** (si autorisé) : Ouvre le formulaire d'édition
- **Supprimer** (si autorisé) : Supprime l'entrée (créer une entrée DELETE)
- **Imprimer** : Génère un PDF de l'entrée
- **Annoter** : Ajoute une annotation à l'entrée

**Filtrage :**
- Par section (constantes, anamnèse, etc.)
- Par action (CREATE, UPDATE, DELETE)
- Par date
- Par utilisateur

---

## 6. Intégrations Automatiques

### 6.1 Facturation

- Protocoles facturables → Création automatique de tickets de facturation
- Demandes labo/imagerie facturables → Création de tickets
- Les tickets apparaissent dans le module Facturation pour création de facture

### 6.2 Pharmacie

- Prescriptions → Liées au module Pharmacie
- Dispensation vérifie le stock automatiquement
- Décrémentation atomique du stock (FEFO)

### 6.3 Laboratoire

- Demandes INTERNES → Création automatique de prescriptions labo
- Les prescriptions apparaissent dans le module Laboratoire

### 6.4 Imagerie

- Demandes → Création automatique d'examens d'imagerie
- Les examens apparaissent dans le module Imagerie

### 6.5 Rendez-vous

- Possibilité de programmer une prochaine consultation
- Intégration avec le module Rendez-vous

---

## 7. Messages d'Erreur (FR)

| Code | Message |
|------|---------|
| 400 | "Données invalides" |
| 401 | "Token d'accès requis" / "Token invalide" / "Token expiré" |
| 403 | "Permission insuffisante" / "Rôle insuffisant" |
| 404 | "Consultation non trouvée" / "Patient non trouvé" / "Template non trouvé" |
| 500 | "Erreur interne du serveur" |

---

## 8. Configuration

### Variables d'environnement recommandées

```env
# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...

# Configuration Consultation
AUTO_APPLY_CONSTANTS=false  # Par défaut : validation médecin requise
DEFAULT_CONSULTATION_DURATION=30  # minutes
ENABLE_LAB_NOTIFICATIONS=true
ENABLE_IMAGING_NOTIFICATIONS=true
```

---

## 9. Exemples de Flux Complets

### Flux 1 : Consultation Standard

1. Créer consultation → `POST /api/consultations`
2. Sauvegarder constantes → `POST /api/consultations/:id/entries` (section: constantes)
3. Créer protocole → `POST /api/consultations/:id/protocols`
4. Créer prescription → `POST /api/consultations/prescriptions`
5. Clôturer → `POST /api/consultations/:id/close`

### Flux 2 : Consultation avec Analyses

1. Créer consultation
2. Créer demande labo → `POST /api/consultations/lab-requests`
   - Automatiquement : Crée prescription labo dans module Laboratoire
3. Clôturer consultation

### Flux 3 : Dispensation Prescription

1. Récupérer prescription → `GET /api/consultations/prescriptions/:id`
2. Dispenser → `POST /api/consultations/prescriptions/:id/dispense`
   - Vérifie stock
   - Décrémente atomiquement
   - Met à jour statut prescription

---

## 10. Notes Techniques

- **Atomicité** : La dispensation utilise des transactions pour garantir la cohérence
- **Performance** : Index sur `patient_id`, `consultation_id`, `created_at` pour optimiser les requêtes
- **Sécurité** : Toutes les routes nécessitent authentification JWT
- **Validation** : Express-validator pour validation côté serveur
- **Messages** : Tous les messages d'erreur en français


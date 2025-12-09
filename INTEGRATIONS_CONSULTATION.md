# Intégrations Module Consultation

## Vue d'ensemble

Le module Consultation s'intègre avec plusieurs autres modules du système pour assurer un flux de travail complet et cohérent.

## 1. Intégration Facturation

### Flux

1. **Protocole/Acte/Examen → Ligne facturable**
   - Lorsqu'un protocole contient des items marqués `facturable: true`
   - Lorsqu'une demande labo/imagerie est marquée `facturable: true`
   - Création automatique d'un ticket de facturation via `FacturationService.creerTicketFacturation()`

2. **Options de facturation**
   - **AutoFacturer** : Crée directement une facture (si configuré)
   - **Tickets en attente** : Ajoute le ticket à la liste des tickets en attente du module Facturation

### Code

```typescript
// Dans consultationService.ts
await IntegrationConsultationService.createOperationFromConsultation({
  consultationId,
  patientId,
  libelle: 'Acte médical',
  qty: 1,
  price: 5000,
  type: 'acte',
}, autoFacturer);
```

## 2. Intégration Pharmacie

### Flux

1. **Prescription → Notification**
   - Lorsqu'une prescription est créée, une notification est envoyée au module Pharmacie
   - WebSocket event : `pharmacy:prescription:new`

2. **Dispensation**
   - Le pharmacien consulte les prescriptions disponibles
   - Dispensation via `StockService.dispensationPatient()`
   - Décrémentation atomique du stock (FEFO)
   - Si paiement requis → création automatique d'une ligne facturable

### Code

```typescript
// Notification lors de la création
await IntegrationConsultationService.notifyPharmacyNewPrescription(prescriptionId, patientId);

// Dispensation avec facturation
await IntegrationConsultationService.dispensePrescriptionWithBilling(
  prescriptionId,
  linesToDispense,
  userId,
  requirePayment
);
```

## 3. Intégration Laboratoire

### Flux

1. **Demande Labo INTERNE → Prescription Labo**
   - Création automatique d'une prescription dans le module Laboratoire
   - WebSocket event : `lab:request:created`
   - Notification interne au laboratoire

2. **Demande Labo EXTERNE**
   - Génération d'un PDF imprimable
   - Conservation de la trace dans la base de données

3. **Résultats → Consultation**
   - Les résultats (PDF/JSON) sont attachés à la consultation dans l'historique
   - Création d'une entrée `ConsultationEntry` avec `section: 'lab_results'`

### Code

```typescript
// Notification lors de la création
await IntegrationConsultationService.notifyLabRequestCreated(labRequestId, consultationId, patientId);

// Attacher un résultat
await IntegrationConsultationService.attachResultToConsultation(consultationId, 'lab', {
  requestId: labRequestId,
  pdfUrl: 'https://...',
  resultJson: {...},
  dateResultat: new Date().toISOString(),
  createdBy: userId,
});
```

## 4. Intégration Imagerie

### Flux

1. **Demande Imagerie INTERNE → Examen Imagerie**
   - Création automatique d'un examen dans le module Imagerie
   - WebSocket event : `imaging:request:created`
   - Notification interne au service d'imagerie

2. **Demande Imagerie EXTERNE**
   - Génération d'un PDF imprimable
   - Conservation de la trace dans la base de données

3. **Résultats → Consultation**
   - Les résultats (PDF/JSON) sont attachés à la consultation dans l'historique
   - Création d'une entrée `ConsultationEntry` avec `section: 'imaging_results'`

### Code

```typescript
// Notification lors de la création
await IntegrationConsultationService.notifyImagingRequestCreated(imagingRequestId, consultationId, patientId);

// Attacher un résultat
await IntegrationConsultationService.attachResultToConsultation(consultationId, 'imaging', {
  requestId: imagingRequestId,
  pdfUrl: 'https://...',
  resultJson: {...},
  dateResultat: new Date().toISOString(),
  createdBy: userId,
});
```

## 5. Intégration Rendez-vous

### Flux

1. **Consultation liée à un RDV**
   - Lors de la clôture d'une consultation, le système cherche le RDV correspondant
   - Matching par `patient_id` et `date_debut` (±30 minutes)
   - Marquage automatique du RDV comme `terminé`

### Code

```typescript
// Lors de la clôture de consultation
await IntegrationConsultationService.markAppointmentCompleted(consultationId);
```

## 6. Intégration DMP / Archivage

### Flux

1. **Export PDF**
   - Génération d'un PDF complet de la consultation avec historique
   - Upload vers Supabase Storage
   - Attachement au dossier patient dans le DMP

### Code

```typescript
const { pdfUrl } = await IntegrationConsultationService.exportConsultationToPDF(consultationId);
```

## 7. Notifications WebSocket

### Événements

| Événement | Description | Données |
|-----------|-------------|---------|
| `lab:request:created` | Nouvelle demande labo créée | `{ labRequestId, consultationId, patientId, type }` |
| `pharmacy:prescription:new` | Nouvelle prescription créée | `{ prescriptionId, patientId }` |
| `consultation:closed` | Consultation clôturée | `{ consultationId, closedBy }` |
| `imaging:request:created` | Nouvelle demande imagerie créée | `{ imagingRequestId, consultationId, patientId, type }` |

### Implémentation

Utilise Supabase Realtime pour les notifications en temps réel :

```typescript
const channel = supabase.channel('consultation-events');
await channel.send({
  type: 'broadcast',
  event: eventType,
  payload: data,
});
```

## 8. Tests d'Intégration

### Tests Automatisés

Les tests vérifient que :

1. ✅ Création consultation → consultation existe & lien patient
2. ✅ Création entrée → entrée créée avec section + data
3. ✅ Protocole facturable → opération créée dans facturation
4. ✅ Demande labo sans clinicalInfo → 400 avec message FR
5. ✅ Prescription → notification pharmacie créée
6. ✅ Clôture consultation → RDV marqué terminé

### Exécution des tests

```bash
cd backend
npm test
```

## 9. Diagramme de Flux

```
Consultation Créée
    ↓
Protocole Facturable? → Oui → Créer Ticket Facturation
    ↓ Non
Prescription Créée → Notifier Pharmacie
    ↓
Demande Labo INTERNE → Créer Prescription Labo → Notifier Labo
    ↓
Demande Imagerie INTERNE → Créer Examen Imagerie → Notifier Imagerie
    ↓
Consultation Clôturée → Marquer RDV Terminé → Émettre Event WebSocket
    ↓
Export PDF → Attacher au DMP
```

## 10. Configuration

### Variables d'environnement

```env
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...

# WebSocket (optionnel)
WEBSOCKET_SERVER_URL=ws://localhost:3001

# Facturation
AUTO_FACTURER_PROTOCOLES=false
```

## 11. Notes Techniques

- **Atomicité** : Les opérations critiques (dispensation, facturation) utilisent des transactions
- **Idempotence** : Les notifications peuvent être réémises sans effet de bord
- **Performance** : Les intégrations sont asynchrones pour ne pas bloquer l'UI
- **Erreurs** : Les erreurs d'intégration sont loggées mais n'empêchent pas la création de la consultation


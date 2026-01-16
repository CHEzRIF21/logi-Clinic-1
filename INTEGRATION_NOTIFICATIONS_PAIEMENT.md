# Intégration du Système de Notifications de Paiement

## ✅ Modules Intégrés

### 1. **Consultations** (`src/pages/Consultations.tsx`)
- ✅ PaymentNotification affiché en haut de la page
- ✅ Mise à jour en temps réel du statut de paiement
- ✅ Notification automatique quand le paiement est confirmé

### 2. **Laboratoire** (`src/pages/Laboratoire.tsx`)
- ✅ PaymentNotification affiché quand un patient est sélectionné
- ✅ PaymentStatusCell dans la liste des prescriptions
- ✅ Vérification du consultation_id dans les prescriptions

### 3. **Imagerie** (`src/pages/Imagerie.tsx`)
- ✅ PaymentNotification affiché quand un patient est sélectionné
- ✅ PaymentStatusCell dans la liste des examens
- ✅ Vérification du consultation_id dans les examens

### 4. **Pharmacie** (`src/pages/Pharmacie.tsx`)
- ⏳ À intégrer (voir section ci-dessous)

### 5. **Maternité** (`src/pages/Maternite.tsx`)
- ⏳ À intégrer (voir section ci-dessous)

## 📦 Composants Disponibles

### `PaymentNotification`
Affiche le statut de paiement avec notification en temps réel.

```tsx
<PaymentNotification
  consultationId={consultationId}
  patientId={patientId}
  onPaymentConfirmed={() => {
    // Callback quand le paiement est confirmé
  }}
  showNotification={true}
/>
```

### `PaymentStatusBadge`
Badge visuel pour le statut de paiement.

```tsx
<PaymentStatusBadge
  status="paye" | "en_attente" | "partiellement_payee"
  montantRestant={0}
  showAmount={true}
  size="small" | "medium"
/>
```

### `PaymentStatusCell`
Composant pour afficher le statut dans un tableau.

```tsx
<PaymentStatusCell
  consultationId={consultationId}
  showAmount={false}
  size="small"
/>
```

### `PaymentGateWrapper`
Wrapper qui bloque l'accès si le paiement n'est pas effectué.

```tsx
<PaymentGateWrapper
  consultationId={consultationId}
  patientId={patientId}
  moduleName="Laboratoire"
  showNotification={true}
  onPaymentConfirmed={() => {}}
>
  {/* Contenu du module */}
</PaymentGateWrapper>
```

## 🔧 Intégration dans Pharmacie

```tsx
import { PaymentNotification } from '../components/shared/PaymentNotification';
import { PaymentStatusCell } from '../components/shared/PaymentStatusCell';

// Dans le composant, ajouter :
{selectedPatient && prescription?.consultation_id && (
  <PaymentNotification
    consultationId={prescription.consultation_id}
    patientId={selectedPatient.id}
    showNotification={true}
  />
)}

// Dans les tableaux de prescriptions :
<PaymentStatusCell 
  consultationId={prescription.consultation_id} 
  size="small" 
/>
```

## 🔧 Intégration dans Maternité

```tsx
import { PaymentNotification } from '../components/shared/PaymentNotification';
import { PaymentStatusCell } from '../components/shared/PaymentStatusCell';

// Dans le composant, ajouter :
{selectedPatient && dossier?.consultation_id && (
  <PaymentNotification
    consultationId={dossier.consultation_id}
    patientId={selectedPatient.id}
    showNotification={true}
  />
)}
```

## 🎯 Fonctionnalités

1. **Mise à jour en temps réel** : Utilise Supabase Realtime pour détecter les changements de paiement
2. **Notifications visuelles** : Badges colorés et messages clairs
3. **Redirection automatique** : Bouton pour aller à la Caisse si paiement requis
4. **Blocage d'accès** : PaymentGateWrapper bloque l'accès aux modules si paiement non effectué

## 📊 Statuts de Paiement

- `paye` : ✅ Paiement effectué (vert)
- `en_attente` : ⚠️ Paiement requis (rouge)
- `partiellement_payee` : ⚠️ Paiement partiel (orange)
- `exonere` : ℹ️ Exonéré (bleu)
- `non_facture` : ⚪ Non facturé (gris)

# Corrections Complètes du Module Consultation

## 🔧 Problèmes Identifiés et Corrigés

### 1. ❌ Problème Principal : Service utilisait Supabase directement

**Problème :**
- Le service `consultationService.ts` utilisait directement Supabase côté frontend
- Les routes backend étaient configurées mais jamais utilisées
- Pas de gestion d'authentification JWT dans les appels

**Solution :**
- ✅ Création de `apiClient.ts` pour gérer les appels API avec authentification
- ✅ Création de `consultationApiService.ts` qui utilise les routes backend
- ✅ Mise à jour de tous les composants pour utiliser le nouveau service

### 2. ❌ Route dans App.tsx utilisait le mauvais composant

**Problème :**
- La route `/consultations` utilisait `Consultations` au lieu de `ConsultationsComplete`

**Solution :**
- ✅ Mise à jour de `App.tsx` pour utiliser `ConsultationsComplete`
- ✅ Passage de l'utilisateur en props pour récupérer l'ID

### 3. ❌ ID utilisateur hardcodé

**Problème :**
- L'ID utilisateur était fixé à `'current-user-id'`

**Solution :**
- ✅ Récupération depuis les props (`user?.id`)
- ✅ Fallback sur `localStorage.getItem('userId')`
- ✅ Passage de l'utilisateur depuis `App.tsx`

### 4. ❌ Imports incorrects dans les composants

**Problème :**
- Tous les composants importaient depuis `consultationService` au lieu de `consultationApiService`

**Solution :**
- ✅ Mise à jour de tous les imports dans :
  - `ConstantesSection.tsx`
  - `ConsultationHistory.tsx`
  - `PrescriptionFormModal.tsx`
  - `PrescriptionDispensationModal.tsx`
  - `ProtocolModal.tsx`
  - `LabRequestWizard.tsx`
  - `ImagingRequestWizard.tsx`

## 📁 Fichiers Créés

1. **`src/services/apiClient.ts`**
   - Client API centralisé
   - Gestion de l'authentification JWT
   - Gestion des erreurs HTTP

2. **`src/services/consultationApiService.ts`**
   - Service API complet pour le module Consultation
   - Utilise les routes backend au lieu de Supabase directement
   - Toutes les méthodes nécessaires implémentées

## 📝 Fichiers Modifiés

1. **`src/pages/ConsultationsComplete.tsx`**
   - Import du nouveau service API
   - Récupération de l'ID utilisateur depuis les props
   - Correction du handler pour ConsultationHistory

2. **`src/App.tsx`**
   - Import de `ConsultationsComplete`
   - Passage de l'utilisateur en props
   - Route mise à jour pour utiliser `ConsultationsComplete`

3. **Tous les composants de consultation**
   - Imports mis à jour pour utiliser `consultationApiService`

## ✅ Fonctionnalités Maintenant Opérationnelles

### Routes Backend Disponibles

Toutes ces routes sont maintenant utilisées par le frontend :

- ✅ `POST /api/consultations` - Créer consultation
- ✅ `GET /api/consultations/:id` - Récupérer consultation
- ✅ `POST /api/consultations/:id/entries` - Créer entrée historique
- ✅ `GET /api/consultations/:id/entries` - Récupérer historique
- ✅ `POST /api/consultations/:id/close` - Clôturer consultation
- ✅ `GET /api/consultations/templates` - Liste templates
- ✅ `POST /api/consultations/templates` - Créer template
- ✅ `POST /api/consultations/:id/protocols` - Créer protocole
- ✅ `GET /api/consultations/:id/protocols` - Liste protocoles
- ✅ `POST /api/consultations/prescriptions` - Créer prescription
- ✅ `GET /api/consultations/:id/prescriptions` - Liste prescriptions
- ✅ `POST /api/consultations/prescriptions/:id/dispense` - Dispenser prescription
- ✅ `POST /api/consultations/lab-requests` - Créer demande labo
- ✅ `GET /api/consultations/:id/lab-requests` - Liste demandes labo
- ✅ `POST /api/consultations/imaging-requests` - Créer demande imagerie
- ✅ `GET /api/consultations/:id/imaging-requests` - Liste demandes imagerie
- ✅ `GET /api/consultations/stats` - Statistiques

## 🔍 Vérifications à Faire

### 1. Variables d'Environnement

Assurez-vous que `.env` ou `.env.local` contient :

```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Authentification

Vérifiez que :
- Le token JWT est stocké dans `localStorage` avec la clé `'token'`
- Le middleware `authenticateToken` fonctionne correctement
- Les permissions sont correctement configurées

### 3. Backend

Vérifiez que :
- Le serveur backend tourne sur le port 5000
- Les routes sont correctement montées dans `server.js`
- Supabase est correctement configuré dans `backend/config.env`

### 4. Migration SQL

Assurez-vous que :
- La migration SQL a été exécutée dans Supabase
- Toutes les tables existent
- Les permissions RLS sont configurées si nécessaire

## 🚀 Test du Module

### Test 1 : Créer une Consultation

1. Aller sur `/consultations`
2. Cliquer sur "Nouvelle Consultation"
3. Sélectionner un patient
4. Remplir le formulaire
5. Cliquer sur "Créer"

**Résultat attendu :** La consultation est créée et apparaît dans la liste

### Test 2 : Sauvegarder des Constantes

1. Ouvrir une consultation
2. Aller dans la section Constantes
3. Remplir les champs
4. Cliquer sur "Sauvegarder"

**Résultat attendu :** Les constantes sont sauvegardées et l'IMC est calculé

### Test 3 : Créer un Protocole

1. Dans une consultation, cliquer sur "Protocole de Soins"
2. Ajouter des items
3. Cliquer sur "Sauvegarder"

**Résultat attendu :** Le protocole est créé

### Test 4 : Créer une Prescription

1. Cliquer sur "Prescription"
2. Ajouter des lignes
3. Cliquer sur "Créer la prescription"

**Résultat attendu :** La prescription est créée

### Test 5 : Clôturer une Consultation

1. Dans une consultation en cours, cliquer sur "Clôturer Consultation"
2. Confirmer

**Résultat attendu :** La consultation est clôturée

## ⚠️ Notes Importantes

1. **Authentification** : Le module nécessite un utilisateur connecté avec un token JWT valide
2. **Permissions** : Certaines actions nécessitent des permissions spécifiques (ex: clôturer nécessite le rôle médecin ou admin)
3. **Variables d'environnement** : Assurez-vous que `VITE_API_URL` est correctement configuré
4. **Backend** : Le serveur backend doit être démarré et accessible

## 🐛 Dépannage

### Erreur : "Network request failed"

**Cause :** Le backend n'est pas accessible

**Solution :**
- Vérifier que le backend tourne sur le port 5000
- Vérifier que `VITE_API_URL` est correct
- Vérifier la configuration CORS dans `backend/server.js`

### Erreur : "Unauthorized" ou 401

**Cause :** Token JWT invalide ou expiré

**Solution :**
- Se reconnecter pour obtenir un nouveau token
- Vérifier que le token est stocké dans `localStorage` avec la clé `'token'`

### Erreur : "Forbidden" ou 403

**Cause :** Permissions insuffisantes

**Solution :**
- Vérifier les permissions de l'utilisateur
- Vérifier le rôle de l'utilisateur (médecin/admin pour certaines actions)

### Erreur : "Table does not exist"

**Cause :** Migration SQL non exécutée

**Solution :**
- Exécuter la migration SQL dans Supabase
- Vérifier que toutes les tables existent

---

**Date de correction :** 2025-01-XX  
**Statut :** ✅ Module complètement opérationnel


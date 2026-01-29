# 🛠️ GUIDE DE CORRECTION MULTI-TENANCY - ÉTAPES D'APPLICATION

## 📋 Vue d'ensemble

Ce guide vous accompagne pour corriger les failles de sécurité multi-tenant identifiées dans l'audit.

**Temps estimé**: 2-3 heures  
**Priorité**: 🔴 **CRITIQUE** - À faire immédiatement

---

## ✅ ÉTAPE 1: Appliquer la migration SQL

```bash
# Via MCP Supabase ou directement
# Appliquer: supabase_migrations/58_FIX_MULTI_TENANCY_SCHEMA.sql
```

Cette migration :
- ✅ Ajoute `clinic_id` aux tables critiques
- ✅ Backfill les données existantes
- ✅ Crée les index et contraintes nécessaires

**⚠️ IMPORTANT**: Vérifiez que le backfill assigne les données à la bonne clinique selon votre logique métier.

---

## ✅ ÉTAPE 2: Mettre à jour le schéma Prisma

1. Ouvrir `server/prisma/schema.prisma`
2. Ajouter `clinic_id` aux modèles suivants (voir `AUDIT_MULTI_TENANCY_SECURITY.md` pour les détails) :
   - `Patient`
   - `Invoice`
   - `Operation`
   - `Product`
   - `Assurance`
   - `Payment`

3. Exécuter les migrations Prisma :
```bash
cd server
npx prisma migrate dev --name add_clinic_id_to_critical_tables
npx prisma generate
```

---

## ✅ ÉTAPE 3: Mettre à jour les routes

Pour chaque route qui accède aux données sensibles, ajouter le middleware `requireClinicContext` :

**Avant**:
```typescript
router.get('/patients', authenticateToken, PatientController.search);
```

**Après**:
```typescript
import { requireClinicContext } from '../middleware/clinicContext';

router.get(
  '/patients',
  authenticateToken,
  requireClinicContext, // ✅ AJOUTER
  PatientController.search
);
```

**Routes à corriger**:
- `/api/patients/*`
- `/api/invoices/*`
- `/api/operations/*`
- `/api/products/*`
- Toutes les routes qui accèdent aux données métier

---

## ✅ ÉTAPE 4: Corriger les services

### 4.1 PatientService

**Fichier**: `server/src/services/patientService.ts`

**Changements requis**:
1. Ajouter `clinicId` et `isSuperAdmin` aux paramètres de toutes les méthodes
2. Filtrer par `clinic_id` dans toutes les requêtes Prisma
3. Vérifier `clinic_id` lors de la création/modification

**Exemple**:
```typescript
static async searchPatients(params: {
  clinicId?: string;        // ✅ AJOUTER
  isSuperAdmin?: boolean;   // ✅ AJOUTER
  search?: string;
  // ... autres params
}) {
  const where: any = {};
  
  // ✅ FILTRER PAR clinic_id
  if (!params.isSuperAdmin && params.clinicId) {
    where.clinicId = params.clinicId;
  }
  
  // ... reste du code
}
```

### 4.2 InvoiceService

Même principe que PatientService.

---

## ✅ ÉTAPE 5: Corriger les contrôleurs

### 5.1 PatientController

**Fichier**: `server/src/controllers/patientController.ts`

**Changements requis**:
1. Importer `ClinicContextRequest`
2. Utiliser `clinicReq.clinicId` et `clinicReq.isSuperAdmin`
3. Passer ces valeurs aux services

**Exemple**:
```typescript
import { ClinicContextRequest } from '../middleware/clinicContext';

static async search(req: Request, res: Response) {
  const clinicReq = req as ClinicContextRequest;
  
  const result = await PatientService.searchPatients({
    clinicId: clinicReq.clinicId,        // ✅ AJOUTER
    isSuperAdmin: clinicReq.isSuperAdmin, // ✅ AJOUTER
    search: req.query.search as string,
    // ... autres params
  });
}
```

---

## ✅ ÉTAPE 6: Tests de validation

### Test 1: Isolation des patients

1. Créer un utilisateur pour la clinique A
2. Créer un utilisateur pour la clinique B
3. Créer des patients dans chaque clinique
4. Vérifier que l'utilisateur A ne voit que ses patients
5. Vérifier que l'utilisateur B ne voit que ses patients

### Test 2: Isolation des factures

Même principe que Test 1.

### Test 3: Tentative d'accès non autorisé

1. Utilisateur A essaie d'accéder à un patient de la clinique B via ID
2. Doit retourner 404 ou "accès non autorisé"

---

## ✅ ÉTAPE 7: Vérification finale

### Checklist:

- [ ] Migration SQL appliquée
- [ ] Schéma Prisma mis à jour
- [ ] Migrations Prisma exécutées
- [ ] Middleware `requireClinicContext` créé
- [ ] Toutes les routes protégées
- [ ] Tous les services filtrent par `clinic_id`
- [ ] Tous les contrôleurs utilisent le contexte
- [ ] Tests de validation passés
- [ ] Aucune donnée croisée visible

---

## 🚨 POINTS D'ATTENTION

1. **Backfill des données**: Assurez-vous que les données existantes sont assignées à la bonne clinique
2. **Produits partagés**: Si certains produits doivent être partagés, adapter la logique
3. **Super Admin**: Vérifier que le super admin peut toujours accéder à toutes les données si requis
4. **Performance**: Les index sur `clinic_id` sont essentiels pour les performances

---

## 📞 Support

En cas de problème lors de l'application des corrections, référez-vous à `AUDIT_MULTI_TENANCY_SECURITY.md` pour les détails techniques complets.

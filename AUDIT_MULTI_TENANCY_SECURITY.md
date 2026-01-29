# 🔒 AUDIT DE SÉCURITÉ MULTI-TENANT - RAPPORT COMPLET

**Date**: 2026-01-29  
**Sévérité**: 🔴 **CRITIQUE** - Violation de confidentialité médicale  
**Statut**: ⚠️ **NON CONFORME** - Données partagées entre cliniques

---

## 📋 EXECUTIVE SUMMARY

**Problème identifié**: Les données médicales (patients, consultations, factures) d'une clinique sont visibles dans les autres cliniques nouvellement créées. Cela constitue une **violation majeure de confidentialité médicale**.

**Cause racine**: 
1. Le schéma Prisma n'inclut pas `clinic_id` dans plusieurs modèles critiques
2. Les services backend utilisant Prisma ne filtrent pas par `clinic_id`
3. Les contrôleurs ne valident pas le contexte de clinique avant les requêtes
4. Désynchronisation entre schéma Prisma et tables Supabase

---

## 🔍 ANALYSE DÉTAILLÉE DES FAILLES

### 1. SCHÉMA PRISMA - MODÈLES MANQUANT `clinic_id`

#### ❌ Modèles CRITIQUES sans `clinic_id`:

```prisma
model Patient {
  id          String     @id @default(uuid())
  // ❌ PAS DE clinic_id
  firstName   String
  lastName    String
  // ...
}

model Invoice {
  id            String   @id @default(uuid())
  // ❌ PAS DE clinic_id
  patient       Patient  @relation(fields: [patientId], references: [id])
  patientId     String
  // ...
}

model Operation {
  id        String   @id @default(uuid())
  // ❌ PAS DE clinic_id
  patient   Patient  @relation(fields: [patientId], references: [id])
  patientId String
  // ...
}

model Product {
  id              String   @id @default(uuid())
  // ❌ PAS DE clinic_id
  code            String?  @unique
  label           String
  // ...
}

model Assurance {
  id           String   @id @default(uuid())
  // ❌ PAS DE clinic_id
  organisme    String
  numeroPolice String   @unique
  // ...
}

model Payment {
  id        String   @id @default(uuid())
  // ❌ PAS DE clinic_id
  invoice   Invoice  @relation(fields: [invoiceId], references: [id])
  invoiceId String
  // ...
}
```

**Impact**: Ces modèles permettent l'accès croisé aux données entre cliniques.

---

### 2. SERVICES BACKEND - ABSENCE DE FILTRAGE PAR `clinic_id`

#### ❌ `PatientService.searchPatients()` - LIGNE 153-212

```typescript
static async searchPatients(params: {...}) {
  const where: any = {};
  // ❌ AUCUN FILTRE PAR clinic_id
  
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where, // ❌ Retourne TOUS les patients de toutes les cliniques
      // ...
    }),
  ]);
}
```

**Impact**: Un utilisateur de la clinique B peut voir tous les patients de la clinique A.

#### ❌ `InvoiceService.listInvoices()` - LIGNE 320-387

```typescript
static async listInvoices(filters: {...}) {
  const where: any = {};
  // ❌ AUCUN FILTRE PAR clinic_id
  
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where, // ❌ Retourne TOUTES les factures de toutes les cliniques
      // ...
    }),
  ]);
}
```

**Impact**: Les factures de toutes les cliniques sont visibles.

#### ❌ `PatientService.getPatientById()` - LIGNE 84-147

```typescript
static async getPatientById(id: string, filters?: {...}) {
  const patient = await prisma.patient.findUnique({
    where: { id }, // ❌ Pas de vérification clinic_id
    // ...
  });
}
```

**Impact**: Un utilisateur peut accéder à n'importe quel patient en connaissant son ID.

---

### 3. CONTRÔLEURS - ABSENCE DE VALIDATION DU CONTEXTE CLINIQUE

#### ❌ `PatientController.search()` - LIGNE 9-39

```typescript
static async search(req: Request, res: Response) {
  // ❌ Ne récupère PAS clinic_id depuis req.user
  // ❌ Ne valide PAS le contexte de clinique
  
  const result = await PatientService.searchPatients({
    // ❌ Pas de clinic_id passé au service
  });
}
```

#### ❌ `InvoiceController.list()` - LIGNE 11-44

```typescript
static async list(req: Request, res: Response) {
  // ❌ Ne récupère PAS clinic_id depuis req.user
  // ❌ Ne valide PAS le contexte de clinique
  
  const result = await InvoiceService.listInvoices(filters);
  // ❌ Pas de clinic_id dans les filtres
}
```

---

### 4. MIDDLEWARE D'AUTHENTIFICATION - INCOMPLET

#### ⚠️ `authenticateToken()` - LIGNE 28-127

**Problème**: Le middleware récupère bien `clinic_id` mais :
- Ne force pas sa présence pour les utilisateurs non-super-admin
- Permet le fallback via headers (`x-clinic-id`) qui peut être manipulé
- Ne valide pas que l'utilisateur appartient bien à la clinique

```typescript
const clinicId = userProfile.clinic_id || 
                 authUser.user_metadata?.clinic_id || 
                 req.headers['x-clinic-id'] as string; // ❌ DANGEREUX
```

---

### 5. DÉSYNCHRONISATION PRISMA/SUPABASE

**Problème**: 
- Les migrations Supabase ajoutent `clinic_id` aux tables (`15_COMPLETE_MULTI_TENANCY_SETUP.sql`)
- Le schéma Prisma ne reflète pas ces changements
- Les requêtes Prisma ne peuvent pas utiliser `clinic_id` car il n'existe pas dans le modèle

---

## 🛠️ CORRECTIONS REQUISES

### PHASE 1: CORRECTION DU SCHÉMA PRISMA

#### 1.1 Ajouter `clinic_id` aux modèles critiques

```prisma
model Patient {
  id          String     @id @default(uuid())
  clinic      Clinic?    @relation(fields: [clinicId], references: [id])
  clinicId    String?    // ✅ AJOUTER
  firstName   String
  lastName    String
  // ...
  
  @@index([clinicId])
}

model Invoice {
  id            String   @id @default(uuid())
  clinic        Clinic?  @relation(fields: [clinicId], references: [id])
  clinicId      String?  // ✅ AJOUTER
  patient       Patient  @relation(fields: [patientId], references: [id])
  patientId     String
  // ...
  
  @@index([clinicId])
}

model Operation {
  id        String   @id @default(uuid())
  clinic    Clinic?  @relation(fields: [clinicId], references: [id])
  clinicId  String?  // ✅ AJOUTER
  patient   Patient  @relation(fields: [patientId], references: [id])
  patientId String
  // ...
  
  @@index([clinicId])
}

model Product {
  id              String   @id @default(uuid())
  clinic          Clinic?  @relation(fields: [clinicId], references: [id])
  clinicId        String?  // ✅ AJOUTER
  code            String?
  label           String
  // ...
  
  @@index([clinicId])
  @@unique([code, clinicId]) // ✅ Modifier l'unique constraint
}

model Assurance {
  id           String   @id @default(uuid())
  clinic       Clinic?  @relation(fields: [clinicId], references: [id])
  clinicId     String?  // ✅ AJOUTER
  organisme    String
  numeroPolice String
  // ...
  
  @@index([clinicId])
  @@unique([numeroPolice, clinicId]) // ✅ Modifier l'unique constraint
}

model Payment {
  id        String   @id @default(uuid())
  clinic    Clinic?  @relation(fields: [clinicId], references: [id])
  clinicId  String?  // ✅ AJOUTER
  invoice   Invoice  @relation(fields: [invoiceId], references: [id])
  invoiceId String
  // ...
  
  @@index([clinicId])
}
```

---

### PHASE 2: CORRECTION DES SERVICES BACKEND

#### 2.1 Créer un middleware de contexte clinique

```typescript
// server/src/middleware/clinicContext.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export interface ClinicContextRequest extends AuthRequest {
  clinicId: string;
  isSuperAdmin: boolean;
}

export function requireClinicContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authReq = req as AuthRequest;
  const user = authReq.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
      code: 'AUTHENTICATION_REQUIRED',
    });
  }

  // Super admin peut accéder à toutes les cliniques
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  
  if (!isSuperAdmin && !user.clinic_id) {
    return res.status(403).json({
      success: false,
      message: 'Contexte de clinique manquant',
      code: 'CLINIC_CONTEXT_REQUIRED',
    });
  }

  // Ajouter le contexte au request
  (req as ClinicContextRequest).clinicId = user.clinic_id || '';
  (req as ClinicContextRequest).isSuperAdmin = isSuperAdmin;

  next();
}
```

#### 2.2 Corriger `PatientService`

```typescript
// server/src/services/patientService.ts

export class PatientService {
  /**
   * Recherche intelligente de patients - AVEC FILTRE clinic_id
   */
  static async searchPatients(params: {
    clinicId?: string; // ✅ AJOUTER
    isSuperAdmin?: boolean; // ✅ AJOUTER
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      // ✅ FILTRER PAR clinic_id SAUF si super admin
      if (!params.isSuperAdmin && params.clinicId) {
        where.clinicId = params.clinicId;
      }

      if (params.search) {
        const searchLower = params.search.toLowerCase();
        where.OR = [
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { phones: { has: params.search } },
          { ifu: { contains: params.search, mode: 'insensitive' } },
        ];
      }

      // ... reste du code
    });
  }

  /**
   * Récupère un patient par ID - AVEC VÉRIFICATION clinic_id
   */
  static async getPatientById(
    id: string,
    options?: {
      clinicId?: string; // ✅ AJOUTER
      isSuperAdmin?: boolean; // ✅ AJOUTER
      startDate?: Date;
      endDate?: Date;
      status?: string;
    }
  ) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const where: any = { id };

      // ✅ VÉRIFIER clinic_id SAUF si super admin
      if (!options?.isSuperAdmin && options?.clinicId) {
        where.clinicId = options.clinicId;
      }

      const patient = await prisma.patient.findFirst({
        where, // ✅ Utiliser findFirst avec where au lieu de findUnique
        // ...
      });

      if (!patient) {
        throw new Error('Patient non trouvé ou accès non autorisé');
      }

      return patient;
    });
  }

  /**
   * Crée un patient - AVEC clinic_id
   */
  static async createPatient(input: CreatePatientInput & {
    clinicId?: string; // ✅ AJOUTER
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const age = differenceInYears(new Date(), input.dob);

      const patient = await prisma.patient.create({
        data: {
          ...input,
          clinicId: input.clinicId, // ✅ AJOUTER
          age,
          phones: input.phones || [],
        },
        // ...
      });

      return patient;
    });
  }
}
```

#### 2.3 Corriger `InvoiceService`

```typescript
// server/src/services/invoiceService.ts

export class InvoiceService {
  /**
   * Liste les factures - AVEC FILTRE clinic_id
   */
  static async listInvoices(filters: {
    clinicId?: string; // ✅ AJOUTER
    isSuperAdmin?: boolean; // ✅ AJOUTER
    startDate?: Date;
    endDate?: Date;
    status?: string;
    patientId?: string;
    page?: number;
    limit?: number;
  }) {
    return await SchemaCacheService.executeWithRetry(async () => {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      // ✅ FILTRER PAR clinic_id SAUF si super admin
      if (!filters.isSuperAdmin && filters.clinicId) {
        where.clinicId = filters.clinicId;
      }

      // ... reste des filtres

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where, // ✅ Contient maintenant clinic_id
          // ...
        }),
        prisma.invoice.count({ where }),
      ]);

      return { invoices, pagination: {...} };
    });
  }

  /**
   * Crée une facture - AVEC clinic_id depuis le patient
   */
  static async createInvoice(input: CreateInvoiceInput) {
    return await SchemaCacheService.executeWithRetry(async () => {
      return await prisma.$transaction(async (tx) => {
        // Vérifier que le patient existe ET récupérer son clinic_id
        const patient = await tx.patient.findUnique({
          where: { id: input.patientId },
          select: { id: true, clinicId: true }, // ✅ Récupérer clinic_id
        });

        if (!patient) {
          throw new Error('Patient non trouvé');
        }

        // ✅ Vérifier que le clinic_id du patient correspond
        if (input.clinicId && patient.clinicId !== input.clinicId) {
          throw new Error('Le patient n\'appartient pas à cette clinique');
        }

        // Créer la facture avec clinic_id
        const invoice = await tx.invoice.create({
          data: {
            number: invoiceNumber,
            patientId: input.patientId,
            clinicId: patient.clinicId, // ✅ AJOUTER
            // ... reste
          },
        });

        return invoice;
      });
    });
  }
}
```

---

### PHASE 3: CORRECTION DES CONTRÔLEURS

#### 3.1 Corriger `PatientController`

```typescript
// server/src/controllers/patientController.ts
import { ClinicContextRequest } from '../middleware/clinicContext';

export class PatientController {
  static async search(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      
      // ✅ Utiliser le contexte de clinique
      const result = await PatientService.searchPatients({
        clinicId: clinicReq.clinicId,
        isSuperAdmin: clinicReq.isSuperAdmin,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      });

      res.json({
        success: true,
        data: result.patients,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche des patients',
        error: error.message,
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      const { id } = req.params;

      const patient = await PatientService.getPatientById(id, {
        clinicId: clinicReq.clinicId,
        isSuperAdmin: clinicReq.isSuperAdmin,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        status: req.query.status as string,
      });

      res.json({
        success: true,
        data: patient,
      });
    } catch (error: any) {
      // ...
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      
      // ✅ Ajouter clinic_id depuis le contexte
      const patient = await PatientService.createPatient({
        ...req.body,
        clinicId: clinicReq.clinicId,
      });

      res.status(201).json({
        success: true,
        message: 'Patient créé avec succès',
        data: patient,
      });
    } catch (error: any) {
      // ...
    }
  }
}
```

#### 3.2 Corriger `InvoiceController`

```typescript
// server/src/controllers/invoiceController.ts
import { ClinicContextRequest } from '../middleware/clinicContext';

export class InvoiceController {
  static async list(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      
      const filters: any = {
        clinicId: clinicReq.clinicId, // ✅ AJOUTER
        isSuperAdmin: clinicReq.isSuperAdmin, // ✅ AJOUTER
      };
      
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.status) filters.status = req.query.status;
      if (req.query.patientId) filters.patientId = req.query.patientId as string;
      if (req.query.page) filters.page = parseInt(req.query.page as string);
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);

      const result = await InvoiceService.listInvoices(filters);

      res.json({
        success: true,
        data: result.invoices,
        pagination: result.pagination,
      });
    } catch (error: any) {
      // ...
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const clinicReq = req as ClinicContextRequest;
      
      const invoice = await InvoiceService.createInvoice({
        ...req.body,
        clinicId: clinicReq.clinicId, // ✅ AJOUTER
        createdBy: clinicReq.user?.id,
      });

      res.status(201).json({
        success: true,
        message: 'Facture créée avec succès',
        data: invoice,
      });
    } catch (error: any) {
      // ...
    }
  }
}
```

---

### PHASE 4: MISE À JOUR DES ROUTES

```typescript
// server/src/routes/patients.ts
import { Router } from 'express';
import PatientController from '../controllers/patientController';
import { authenticateToken } from '../middleware/auth';
import { requireClinicContext } from '../middleware/clinicContext';

const router = Router();

// ✅ Appliquer les middlewares dans le bon ordre
router.get(
  '/',
  authenticateToken,
  requireClinicContext, // ✅ AJOUTER
  PatientController.search
);

router.get(
  '/:id',
  authenticateToken,
  requireClinicContext, // ✅ AJOUTER
  PatientController.getById
);

router.post(
  '/',
  authenticateToken,
  requireClinicContext, // ✅ AJOUTER
  PatientController.create
);

// ... autres routes

export default router;
```

---

### PHASE 5: MIGRATION DE BASE DE DONNÉES

#### 5.1 Migration pour ajouter `clinic_id` aux tables existantes

```sql
-- supabase_migrations/58_FIX_MULTI_TENANCY_SCHEMA.sql

-- Ajouter clinic_id aux tables si elles n'existent pas déjà
DO $$
BEGIN
  -- Patients
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE patients ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
    
    -- Backfill: Assigner les patients existants à la première clinique (à adapter selon votre logique)
    UPDATE patients SET clinic_id = (SELECT id FROM clinics LIMIT 1) WHERE clinic_id IS NULL;
    
    -- Rendre NOT NULL après backfill
    ALTER TABLE patients ALTER COLUMN clinic_id SET NOT NULL;
  END IF;

  -- Factures (invoices)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'factures' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE factures ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    CREATE INDEX idx_factures_clinic_id ON factures(clinic_id);
    
    -- Backfill: Depuis les patients
    UPDATE factures f
    SET clinic_id = p.clinic_id
    FROM patients p
    WHERE f.patient_id = p.id AND f.clinic_id IS NULL;
    
    ALTER TABLE factures ALTER COLUMN clinic_id SET NOT NULL;
  END IF;

  -- Operations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'operations' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE operations ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    CREATE INDEX idx_operations_clinic_id ON operations(clinic_id);
    
    -- Backfill: Depuis les patients
    UPDATE operations o
    SET clinic_id = p.clinic_id
    FROM patients p
    WHERE o.patient_id = p.id AND o.clinic_id IS NULL;
    
    ALTER TABLE operations ALTER COLUMN clinic_id SET NOT NULL;
  END IF;

  -- Products (si multi-tenant)
  -- Note: Les produits peuvent être partagés ou spécifiques selon votre logique métier
  -- Ici, on les rend multi-tenant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE products ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    CREATE INDEX idx_products_clinic_id ON products(clinic_id);
    
    -- Backfill: Assigner à la première clinique (à adapter)
    UPDATE products SET clinic_id = (SELECT id FROM clinics LIMIT 1) WHERE clinic_id IS NULL;
    
    ALTER TABLE products ALTER COLUMN clinic_id SET NOT NULL;
    
    -- Modifier l'unique constraint sur code
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_code_key;
    CREATE UNIQUE INDEX products_code_clinic_id_unique ON products(code, clinic_id) WHERE code IS NOT NULL;
  END IF;

  -- Assurances
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assurances' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE assurances ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    CREATE INDEX idx_assurances_clinic_id ON assurances(clinic_id);
    
    -- Backfill: Depuis les patients
    UPDATE assurances a
    SET clinic_id = (
      SELECT DISTINCT p.clinic_id 
      FROM patients p 
      WHERE p.assurance_id = a.id 
      LIMIT 1
    )
    WHERE clinic_id IS NULL;
    
    ALTER TABLE assurances ALTER COLUMN clinic_id SET NOT NULL;
    
    -- Modifier l'unique constraint
    ALTER TABLE assurances DROP CONSTRAINT IF EXISTS assurances_numero_police_key;
    CREATE UNIQUE INDEX assurances_numero_police_clinic_id_unique ON assurances(numero_police, clinic_id);
  END IF;

  -- Payments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'paiements' AND column_name = 'clinic_id'
  ) THEN
    ALTER TABLE paiements ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    CREATE INDEX idx_paiements_clinic_id ON paiements(clinic_id);
    
    -- Backfill: Depuis les factures
    UPDATE paiements p
    SET clinic_id = f.clinic_id
    FROM factures f
    WHERE p.facture_id = f.id AND p.clinic_id IS NULL;
    
    ALTER TABLE paiements ALTER COLUMN clinic_id SET NOT NULL;
  END IF;
END $$;
```

---

## ✅ CHECKLIST DE VALIDATION

### Tests à effectuer après corrections:

- [ ] Un utilisateur de la clinique A ne peut pas voir les patients de la clinique B
- [ ] Un utilisateur de la clinique A ne peut pas voir les factures de la clinique B
- [ ] Un utilisateur de la clinique A ne peut pas créer un patient pour la clinique B
- [ ] Un utilisateur de la clinique A ne peut pas modifier un patient de la clinique B
- [ ] Un super admin peut voir toutes les données (si requis)
- [ ] Les requêtes Prisma incluent toujours `clinic_id` dans le WHERE
- [ ] Les contrôleurs valident toujours le contexte de clinique
- [ ] Les migrations de base de données sont appliquées
- [ ] Le schéma Prisma est synchronisé avec Supabase

---

## 🚨 RECOMMANDATIONS DE SÉCURITÉ

1. **Row Level Security (RLS)**: Activer RLS sur Supabase pour une sécurité supplémentaire
2. **Audit Logging**: Logger tous les accès aux données sensibles
3. **Tests d'intégration**: Créer des tests automatisés pour valider l'isolation
4. **Code Review**: Toute nouvelle requête doit inclure le filtre `clinic_id`
5. **Documentation**: Documenter la règle: "Toujours filtrer par clinic_id sauf super admin"

---

## 📝 NOTES IMPORTANTES

- ⚠️ **Backfill des données**: La migration inclut un backfill qui assigne les données existantes à la première clinique. **À adapter selon votre logique métier**.
- ⚠️ **Produits partagés**: Si certains produits doivent être partagés entre cliniques, adapter la logique en conséquence.
- ⚠️ **Migration Prisma**: Après modification du schéma, exécuter `npx prisma migrate dev` et `npx prisma generate`.

---

**Priorité**: 🔴 **URGENTE** - À corriger immédiatement avant toute mise en production.

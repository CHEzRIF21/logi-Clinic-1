# 📋 Règles de Développement - Logi Clinic

Ce document définit les règles et conventions à suivre pour continuer l'implémentation du code backend et frontend de Logi Clinic. Ces règles garantissent la cohérence, la sécurité et la maintenabilité du code.

---

## 🏗️ ARCHITECTURE GÉNÉRALE

### 1. Architecture Multi-Tenant (Multi-Clinique)

**RÈGLE FONDAMENTALE #1 : Isolation Stricte des Données**

- ✅ **TOUTES** les tables métier DOIVENT avoir une colonne `clinic_id UUID NOT NULL`
- ✅ **AUCUNE** donnée métier ne peut exister sans être liée à une clinique
- ✅ Le `clinic_id` est **OBLIGATOIRE** pour toutes les opérations CRUD
- ❌ **JAMAIS** créer une table métier sans `clinic_id`

**Tables concernées :**
- `patients`, `consultations`, `prescriptions`, `medicaments`, `lots`
- `mouvements_stock`, `transferts`, `dispensations`, `alertes_stock`
- `inventaires`, `consultation_templates`, `lab_requests`, `imaging_requests`
- `factures`, `paiements`, `operations`, `vaccinations`, `cpn`, `accouchements`
- **Toutes les autres tables métier**

### 2. Structure du Projet

```
logi-clinic/
├── src/                    # Frontend React + TypeScript
│   ├── components/         # Composants React organisés par module
│   ├── pages/             # Pages principales
│   ├── services/          # Services API et logique métier
│   ├── hooks/             # Custom React hooks
│   ├── types/             # Types TypeScript
│   ├── utils/             # Utilitaires
│   └── theme/             # Configuration thème
├── server/                 # Backend Node.js + Express
│   ├── src/
│   │   ├── controllers/    # Contrôleurs (logique requête/réponse)
│   │   ├── services/      # Services métier (logique business)
│   │   ├── routes/        # Définition des routes
│   │   ├── middleware/    # Middlewares Express
│   │   └── utils/         # Utilitaires backend
│   └── prisma/            # Schéma Prisma (si utilisé)
└── supabase/              # Migrations Supabase SQL
    └── migrations/         # Fichiers de migration SQL
```

---

## 🔐 SÉCURITÉ ET AUTHENTIFICATION

### 3. Authentification Multi-Clinic

**RÈGLE :** Toute connexion nécessite 3 informations :
1. **Code clinique** (format: `CLIN-YYYY-XXX`)
2. **Email** (nom d'utilisateur)
3. **Mot de passe**

**Implémentation Frontend :**
```typescript
// src/components/auth/Login.tsx
// Le formulaire DOIT demander : clinicCode, email, password
```

**Implémentation Backend :**
```typescript
// server/src/routes/auth.ts
// Utiliser validate_clinic_login(clinicCode, email, password)
// Retourner clinic_id dans le token JWT
```

### 4. Stockage du Contexte Clinique

**Frontend :**
- Stocker `clinic_id` dans `localStorage` après connexion
- Inclure `clinic_id` dans les headers API : `x-clinic-id`
- Utiliser `getMyClinicId()` depuis `clinicService.ts` pour récupérer le clinic_id

**Backend :**
- Extraire `clinic_id` depuis :
  1. JWT token (`user_metadata.clinic_id`)
  2. Header `x-clinic-id` (fallback)
- Toujours vérifier `clinic_id` dans les middlewares

### 5. Row Level Security (RLS) - Supabase

**RÈGLE :** Toutes les tables métier DOIVENT avoir des politiques RLS activées :

```sql
-- Exemple de politique RLS
CREATE POLICY "clinic_isolation_<table_name>" ON <table_name>
FOR ALL TO authenticated
USING (
  clinic_id = get_current_user_clinic_id()
  OR check_is_super_admin()
)
WITH CHECK (
  clinic_id = get_current_user_clinic_id()
  OR check_is_super_admin()
);
```

**Fonctions SQL requises :**
- `get_current_user_clinic_id()` : Retourne le clinic_id depuis le JWT
- `check_is_super_admin()` : Vérifie si l'utilisateur est SUPER_ADMIN
- `get_clinic_id_by_code(p_clinic_code TEXT)` : Récupère l'ID depuis le code

---

## 🎨 FRONTEND - RÈGLES DE DÉVELOPPEMENT

### 6. Structure des Composants

**Organisation par module :**
```
src/components/
├── auth/              # Authentification
├── consultation/      # Module consultations
├── patients/          # Module patients
├── pharmacie/         # Module pharmacie
├── maternite/         # Module maternité
├── laboratoire/       # Module laboratoire
├── ui/                # Composants UI réutilisables (shadcn/ui)
└── shared/            # Composants partagés
```

**Convention de nommage :**
- Composants : `PascalCase.tsx` (ex: `PatientForm.tsx`)
- Hooks : `use` + `PascalCase.ts` (ex: `usePatients.ts`)
- Services : `camelCase` + `Service.ts` (ex: `patientService.ts`)
- Types : `PascalCase.ts` (ex: `auth.ts`, `facturation.ts`)

### 7. Services Frontend

**Pattern à suivre :**

```typescript
// src/services/patientService.ts
import { supabase } from './supabase';
import { getMyClinicId, isSuperAdmin } from './clinicService';

export class PatientService {
  // TOUJOURS filtrer par clinic_id sauf si SUPER_ADMIN
  static async getAllPatients(): Promise<Patient[]> {
    const clinicId = await getMyClinicId();
    const superAdmin = await isSuperAdmin();
    
    let query = supabase.from('patients').select('*');
    
    // Filtrer par clinic_id si pas super admin
    if (!superAdmin && clinicId) {
      query = query.eq('clinic_id', clinicId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erreur:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // TOUJOURS inclure clinic_id lors de la création
  static async createPatient(data: PatientFormData): Promise<Patient> {
    const clinicId = await getMyClinicId();
    
    if (!clinicId) {
      throw new Error('Clinic ID manquant');
    }
    
    const { data: patient, error } = await supabase
      .from('patients')
      .insert({
        ...data,
        clinic_id: clinicId, // OBLIGATOIRE
      })
      .select()
      .single();
    
    if (error) throw error;
    return patient;
  }
}
```

**Règles pour les services :**
- ✅ Toujours utiliser `getMyClinicId()` pour récupérer le clinic_id
- ✅ Filtrer par `clinic_id` dans les requêtes SELECT (sauf SUPER_ADMIN)
- ✅ Inclure `clinic_id` dans les INSERT/UPDATE
- ✅ Gérer les erreurs avec try/catch et console.error
- ✅ Retourner des types TypeScript définis

### 8. Routes et Protection

**Pattern de route protégée :**

```typescript
// src/App.tsx
<Route
  path="/patients"
  element={
    <ProtectedModuleRoute user={user} requiredModule="patients">
      <Layout user={user} onLogout={handleLogout}>
        <GestionPatients />
      </Layout>
    </ProtectedModuleRoute>
  }
/>
```

**Types de protection :**
- `ProtectedRoute` : Vérifie uniquement l'authentification
- `ProtectedModuleRoute` : Vérifie l'authentification + accès au module

**Modules disponibles :**
- `consultations`, `patients`, `pharmacie`, `maternite`
- `laboratoire`, `imagerie`, `vaccination`, `caisse`
- `rendezvous`, `stock`, `parametres`

### 9. Gestion des Permissions

**Utiliser les utilitaires de permissions :**

```typescript
// src/utils/permissions.ts
import { hasModuleAccess, canManageUsers } from './utils/permissions';

// Vérifier l'accès à un module
if (!hasModuleAccess(user, 'pharmacie')) {
  return <Navigate to="/" replace />;
}

// Vérifier si l'utilisateur peut gérer les utilisateurs
if (canManageUsers(user)) {
  // Afficher le bouton de gestion
}
```

**Rôles disponibles :**
- `SUPER_ADMIN` : Accès total à toutes les cliniques
- `CLINIC_ADMIN` : Admin de sa clinique
- `MEDECIN`, `INFIRMIER`, `PHARMACIEN`, `LABORANTIN`, `CAISSIER`, `RECEPTIONNISTE`, `STAFF`

### 10. API Client Frontend

**Utiliser `apiClient.ts` pour toutes les requêtes API :**

```typescript
// src/services/apiClient.ts
import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

// GET
const patients = await apiGet<Patient[]>('/api/patients');

// POST
const newPatient = await apiPost<Patient>('/api/patients', patientData);

// PUT
const updated = await apiPut<Patient>(`/api/patients/${id}`, updateData);

// DELETE
await apiDelete(`/api/patients/${id}`);
```

**Le client API gère automatiquement :**
- Ajout du token JWT dans les headers
- Ajout du `clinic_id` dans le header `x-clinic-id`
- Gestion des erreurs HTTP (401, 403, 404, 500)
- Retry automatique en cas d'erreur réseau

---

## ⚙️ BACKEND - RÈGLES DE DÉVELOPPEMENT

### 11. Structure Backend (MVC Pattern)

**Architecture :**
```
server/src/
├── controllers/     # Gèrent les requêtes HTTP (req, res)
├── services/        # Logique métier (appels DB, validations)
├── routes/          # Définition des routes Express
├── middleware/      # Middlewares (auth, validation, errors)
└── utils/           # Utilitaires
```

**Séparation des responsabilités :**
- **Controller** : Reçoit la requête, appelle le service, retourne la réponse
- **Service** : Contient la logique métier, accès à la base de données
- **Route** : Définit les endpoints et applique les middlewares

### 12. Contrôleurs

**Pattern à suivre :**

```typescript
// server/src/controllers/patientController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import PatientService from '../services/patientService';

export class PatientController {
  static async search(req: AuthRequest, res: Response) {
    try {
      const { search, page, limit } = req.query;
      const clinicId = req.user?.clinic_id; // Récupérer depuis le middleware
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Clinic ID manquant',
        });
      }
      
      const result = await PatientService.searchPatients({
        search: search as string,
        clinicId, // TOUJOURS passer clinic_id
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json({
        success: true,
        data: result.patients,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche',
        error: error.message,
      });
    }
  }
  
  static async create(req: AuthRequest, res: Response) {
    try {
      const clinicId = req.user?.clinic_id;
      
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: 'Clinic ID manquant',
        });
      }
      
      // Validation des données
      const { firstName, lastName, sex, dob } = req.body;
      if (!firstName || !lastName || !sex || !dob) {
        return res.status(400).json({
          success: false,
          message: 'Champs requis manquants',
        });
      }
      
      const patient = await PatientService.createPatient({
        ...req.body,
        clinicId, // TOUJOURS inclure clinic_id
      });
      
      res.status(201).json({
        success: true,
        data: patient,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de la création',
      });
    }
  }
}
```

**Règles pour les contrôleurs :**
- ✅ Utiliser `AuthRequest` au lieu de `Request` pour avoir accès à `req.user`
- ✅ TOUJOURS vérifier `req.user?.clinic_id` avant les opérations
- ✅ Retourner des réponses JSON avec `{ success: boolean, data?: any, message?: string }`
- ✅ Gérer les erreurs avec try/catch et retourner des codes HTTP appropriés
- ✅ Valider les données d'entrée avant d'appeler le service

### 13. Services Backend

**Pattern à suivre :**

```typescript
// server/src/services/patientService.ts
import { PrismaClient } from '@prisma/client';
// OU import { supabase } from '../supabaseClient';

export class PatientService {
  // TOUJOURS accepter clinicId en paramètre
  static async searchPatients(params: {
    search?: string;
    clinicId: string; // OBLIGATOIRE
    page?: number;
    limit?: number;
  }) {
    const { search, clinicId, page = 1, limit = 20 } = params;
    
    // Validation
    if (!clinicId) {
      throw new Error('Clinic ID est requis');
    }
    
    // Construire la requête avec filtrage par clinic_id
    let query = {
      where: {
        clinic_id: clinicId, // TOUJOURS filtrer par clinic_id
        // ... autres filtres
      },
      skip: (page - 1) * limit,
      take: limit,
    };
    
    // Exécuter la requête (Prisma ou Supabase)
    const patients = await prisma.patient.findMany(query);
    const total = await prisma.patient.count({ where: query.where });
    
    return {
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  
  static async createPatient(data: {
    firstName: string;
    lastName: string;
    clinicId: string; // OBLIGATOIRE
    // ... autres champs
  }) {
    // Validation
    if (!data.clinicId) {
      throw new Error('Clinic ID est requis');
    }
    
    // Créer avec clinic_id
    const patient = await prisma.patient.create({
      data: {
        ...data,
        clinic_id: data.clinicId, // Mapping clinicId -> clinic_id
      },
    });
    
    return patient;
  }
}
```

**Règles pour les services :**
- ✅ TOUJOURS accepter `clinicId` comme paramètre obligatoire
- ✅ TOUJOURS filtrer par `clinic_id` dans les requêtes SELECT
- ✅ TOUJOURS inclure `clinic_id` dans les INSERT/UPDATE
- ✅ Valider les données avant les opérations DB
- ✅ Gérer les erreurs et les propager avec des messages clairs
- ✅ Utiliser des transactions pour les opérations complexes

### 14. Routes

**Pattern à suivre :**

```typescript
// server/src/routes/patients.ts
import { Router } from 'express';
import PatientController from '../controllers/patientController';
import { authenticateToken, requireClinicContext } from '../middleware/auth';

const router = Router();

// Appliquer l'authentification sur toutes les routes
router.use(authenticateToken);
router.use(requireClinicContext); // Vérifier que clinic_id est présent

// Définir les routes
router.get('/', PatientController.search);
router.get('/:id', PatientController.getById);
router.post('/', PatientController.create);
router.put('/:id', PatientController.update);
router.delete('/:id', PatientController.delete);

export default router;
```

**Règles pour les routes :**
- ✅ TOUJOURS appliquer `authenticateToken` sur les routes protégées
- ✅ Appliquer `requireClinicContext` pour les routes nécessitant un clinic_id
- ✅ Utiliser `checkPermission(permission)` pour les routes sensibles
- ✅ Organiser les routes par ressource (patients, consultations, etc.)

### 15. Middlewares

**Middlewares disponibles :**

```typescript
// server/src/middleware/auth.ts

// 1. authenticateToken : Vérifie le JWT et extrait user + clinic_id
router.use(authenticateToken);

// 2. requireClinicContext : Vérifie que clinic_id est présent
router.use(requireClinicContext);

// 3. checkPermission : Vérifie une permission spécifique
router.post('/', checkPermission('create_patients'), Controller.create);

// 4. optionalAuth : Authentification optionnelle
router.use(optionalAuth);
```

**Ordre d'application :**
1. `authenticateToken` (toujours en premier)
2. `requireClinicContext` (si nécessaire)
3. `checkPermission` (si nécessaire)
4. Contrôleur

---

## 🗄️ ACCÈS AUX DONNÉES

### 16. Supabase (Frontend)

**Utiliser le client Supabase configuré :**

```typescript
// src/services/supabase.ts
import { supabase } from './supabase';

// RLS est géré automatiquement par Supabase
// Les politiques RLS filtrent automatiquement par clinic_id
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .eq('clinic_id', clinicId); // Toujours inclure pour clarté
```

**Règles :**
- ✅ Utiliser le client Supabase depuis `src/services/supabase.ts`
- ✅ Toujours inclure `clinic_id` dans les requêtes (même si RLS le gère)
- ✅ Gérer les erreurs avec try/catch
- ✅ Utiliser les types TypeScript définis dans `supabase.ts`

### 17. Prisma / Supabase (Backend)

**Si Prisma est utilisé :**

```typescript
// server/src/prisma.ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

// TOUJOURS filtrer par clinic_id
const patients = await prisma.patient.findMany({
  where: {
    clinic_id: clinicId, // OBLIGATOIRE
  },
});
```

**Si Supabase est utilisé :**

```typescript
// server/src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(url, key);

// Utiliser le service key pour bypass RLS si nécessaire
// Mais TOUJOURS filtrer manuellement par clinic_id
```

---

## 🎯 GESTION DES ERREURS

### 18. Frontend

**Pattern d'erreur :**

```typescript
try {
  const data = await PatientService.getAllPatients();
  // Traiter les données
} catch (error: any) {
  console.error('Erreur:', error);
  enqueueSnackbar(
    error.message || 'Une erreur est survenue',
    { variant: 'error' }
  );
}
```

**Utiliser notistack pour les notifications :**
```typescript
import { useSnackbar } from 'notistack';

const { enqueueSnackbar } = useSnackbar();
enqueueSnackbar('Opération réussie', { variant: 'success' });
enqueueSnackbar('Erreur', { variant: 'error' });
```

### 19. Backend

**Pattern de réponse d'erreur :**

```typescript
// Succès
res.json({
  success: true,
  data: result,
});

// Erreur client (400, 404)
res.status(400).json({
  success: false,
  message: 'Message d\'erreur clair',
  code: 'ERROR_CODE', // Optionnel
});

// Erreur serveur (500)
res.status(500).json({
  success: false,
  message: 'Erreur serveur',
  error: error.message, // En développement uniquement
});
```

**Codes HTTP à utiliser :**
- `200` : Succès
- `201` : Créé avec succès
- `400` : Requête invalide (validation échouée)
- `401` : Non authentifié
- `403` : Non autorisé (permissions insuffisantes)
- `404` : Ressource non trouvée
- `409` : Conflit (doublon, etc.)
- `500` : Erreur serveur

---

## 📝 CONVENTIONS DE CODE

### 20. TypeScript

**Règles :**
- ✅ Utiliser TypeScript strict (déjà configuré)
- ✅ Définir des interfaces/types pour toutes les données
- ✅ Éviter `any`, utiliser `unknown` si nécessaire
- ✅ Utiliser les types depuis `src/types/` pour le frontend

**Exemple :**
```typescript
// src/types/auth.ts
export interface User {
  id: string;
  email: string;
  role: string;
  clinic_id?: string;
  permissions?: ModulePermission[];
}
```

### 21. Nommage

**Variables et fonctions :**
- `camelCase` : `getPatientById`, `clinicId`
- `PascalCase` : Classes, composants, types
- `UPPER_SNAKE_CASE` : Constantes

**Fichiers :**
- Composants : `PascalCase.tsx` (ex: `PatientForm.tsx`)
- Services : `camelCase.ts` (ex: `patientService.ts`)
- Types : `camelCase.ts` (ex: `auth.ts`)
- Utilitaires : `camelCase.ts` (ex: `permissions.ts`)

### 22. Commentaires

**Documenter :**
- Les fonctions complexes
- Les règles métier importantes
- Les raisons des décisions techniques
- Les TODOs et FIXMEs

**Format JSDoc :**
```typescript
/**
 * Récupère tous les patients de la clinique
 * Filtre automatiquement par clinic_id (sauf SUPER_ADMIN)
 * 
 * @returns Promise<Patient[]> Liste des patients
 * @throws Error si clinic_id manquant ou erreur DB
 */
static async getAllPatients(): Promise<Patient[]> {
  // ...
}
```

---

## 🔄 WORKFLOWS IMPORTANTS

### 23. Création d'une Clinique (Super Admin)

**Workflow :**
1. Super Admin appelle `super_admin_create_clinic()`
2. Système génère un code unique (`CLIN-2025-001`)
3. Système crée la clinique
4. Système crée l'admin avec `status = 'PENDING'`
5. Système retourne code + mot de passe temporaire

**NE JAMAIS créer une clinique manuellement sans passer par cette fonction.**

### 24. Connexion Utilisateur

**Workflow :**
1. Utilisateur entre : code clinique + email + mot de passe
2. Frontend appelle `/api/auth/login` avec ces 3 informations
3. Backend valide via `validate_clinic_login()`
4. Backend retourne JWT avec `clinic_id` dans `user_metadata`
5. Frontend stocke token + `clinic_id` dans localStorage
6. Frontend inclut `clinic_id` dans tous les headers API

### 25. Création d'une Ressource (ex: Patient)

**Workflow :**
1. Frontend récupère `clinic_id` via `getMyClinicId()`
2. Frontend envoie les données + `clinic_id` au backend
3. Backend vérifie `req.user.clinic_id`
4. Backend crée la ressource avec `clinic_id`
5. Backend retourne la ressource créée

**NE JAMAIS créer une ressource sans `clinic_id`.**

---

## ✅ CHECKLIST AVANT COMMIT

Avant de commiter du code, vérifier :

- [ ] Toutes les tables métier ont `clinic_id`
- [ ] Toutes les requêtes filtrent par `clinic_id` (sauf SUPER_ADMIN)
- [ ] Toutes les créations incluent `clinic_id`
- [ ] Les middlewares d'authentification sont appliqués
- [ ] Les erreurs sont gérées correctement
- [ ] Les types TypeScript sont définis
- [ ] Le code suit les conventions de nommage
- [ ] Les tests passent (si disponibles)
- [ ] Pas de `console.log` en production (utiliser `console.error` si nécessaire)

---

## 🚫 INTERDICTIONS STRICTES

**NE JAMAIS :**
- ❌ Créer une table métier sans `clinic_id`
- ❌ Créer une ressource sans `clinic_id`
- ❌ Accéder aux données d'une autre clinique
- ❌ Bypasser les politiques RLS sans raison valide
- ❌ Hardcoder des IDs de clinique
- ❌ Exposer des secrets dans le code (utiliser `.env`)
- ❌ Commiter des fichiers `.env` ou contenant des secrets
- ❌ Utiliser `any` sans raison valide
- ❌ Ignorer les erreurs (toujours les gérer)

---

## 📚 RESSOURCES

**Documentation importante :**
- `ARCHITECTURE_MULTI_TENANT_COMPLETE.md` : Architecture complète
- `GUIDE_MULTI_TENANCY.md` : Guide multi-tenancy
- `supabase_migrations/` : Migrations SQL de référence

**Fichiers de référence :**
- `src/services/patientService.ts` : Exemple de service frontend
- `server/src/controllers/patientController.ts` : Exemple de contrôleur
- `server/src/middleware/auth.ts` : Middlewares d'authentification
- `src/components/auth/ProtectedRoute.tsx` : Protection des routes

---

## 🎯 RÈGLES PRIORITAIRES (À RETENIR)

1. **TOUJOURS inclure `clinic_id`** dans toutes les opérations métier
2. **TOUJOURS filtrer par `clinic_id`** dans les requêtes (sauf SUPER_ADMIN)
3. **TOUJOURS vérifier l'authentification** avant les opérations sensibles
4. **TOUJOURS gérer les erreurs** avec try/catch et messages clairs
5. **TOUJOURS utiliser les types TypeScript** pour la sécurité des types
6. **TOUJOURS suivre les conventions de nommage** pour la cohérence
7. **JAMAIS créer de données sans `clinic_id`**
8. **JAMAIS accéder aux données d'une autre clinique**

---

**Version :** 1.0  
**Date :** 2025-01-XX  
**Projet :** Logi Clinic  
**Usage :** Règles pour Cursor AI et développement continu





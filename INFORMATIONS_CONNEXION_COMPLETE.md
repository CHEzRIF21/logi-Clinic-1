# 🔐 Informations de Connexion Complètes

## 📍 Configuration de l'Application

### Port et URL
- **Port par défaut :** `3001`
- **URL locale :** `http://localhost:3001`
- **URL alternative :** `http://localhost:3002` (si 3001 est occupé)

### Configuration Supabase
- **URL Supabase :** `https://bnfgemmlokvetmohiqch.supabase.co`
- **Clé Anon :** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8`

## 🔑 Comptes de Test Disponibles

### CLINIC001 - Clinique Démo (Recommandé)

**Compte Administrateur :**
- **Code clinique :** `CLINIC001`
- **Email :** `admin`
- **Mot de passe :** `admin123`
- **Rôle :** CLINIC_ADMIN
- **Accès :** Tous les modules

**Compte Médecin :**
- **Code clinique :** `CLINIC001`
- **Email :** `medecin`
- **Mot de passe :** `medecin123`
- **Rôle :** MEDECIN
- **Accès :** Consultations, Patients, Laboratoire, Imagerie

**Compte Infirmier :**
- **Code clinique :** `CLINIC001`
- **Email :** `infirmier`
- **Mot de passe :** `infirmier123`
- **Rôle :** INFIRMIER
- **Accès :** Consultations (lecture), Patients, Vaccination

**Compte Réceptionniste :**
- **Code clinique :** `CLINIC001`
- **Email :** `receptionniste`
- **Mot de passe :** `receptionniste123`
- **Rôle :** RECEPTIONNISTE
- **Accès :** Patients, Rendez-vous, Caisse

### CAMPUS-001 - Clinique du Campus

**Compte Administrateur :**
- **Code clinique :** `CAMPUS-001`
- **Email :** `bagarayannick1@gmail.com`
- **Mot de passe :** `TempClinic2024!`
- **Rôle :** CLINIC_ADMIN
- **⚠️ Note :** Changement de mot de passe requis à la première connexion

## 🧪 Test avec TestSprite

### Étape 1 : Démarrer l'Application

```bash
cd "C:\Users\Mustafa\Desktop\logi Clinic 1"
npm run dev
```

Vérifier que le serveur démarre sur le port 3001 :
- Ouvrir `http://localhost:3001`
- La page de connexion doit s'afficher

### Étape 2 : Initialiser TestSprite

Le fichier `code_summary.json` a été généré dans `testsprite_tests/tmp/`.

TestSprite est maintenant prêt à tester :
- ✅ Page de connexion (`/login`)
- ✅ Formulaire de connexion
- ✅ Validation des champs
- ✅ Processus de connexion
- ✅ Redirection après connexion

### Étape 3 : Tests Automatisés

TestSprite va automatiquement :
1. Tester l'affichage de la page de connexion
2. Vérifier la présence des champs (Code clinique, Email, Mot de passe)
3. Tester la validation du formulaire
4. Tester la connexion avec les comptes de test
5. Vérifier la redirection vers le dashboard
6. Tester l'accès au module Consultation

## ✅ Vérification du Module Consultation

### Checklist de Vérification

#### 1. Affichage dans le Menu
- [ ] Le menu "Consultations" est visible dans la barre latérale
- [ ] L'icône MedicalServices est affichée
- [ ] Le menu est accessible avec les permissions appropriées

#### 2. Route et Navigation
- [ ] La route `/consultations` fonctionne
- [ ] La page s'affiche correctement après connexion
- [ ] La navigation depuis le menu fonctionne

#### 3. Page Consultation
- [ ] Les statistiques s'affichent (Total, Terminées, En cours, Annulées)
- [ ] Le bouton "Nouvelle Consultation" est visible et fonctionnel
- [ ] La liste des consultations s'affiche (si des consultations existent)
- [ ] Les filtres par onglets fonctionnent (Toutes, En cours, Terminées, Annulées)
- [ ] La recherche fonctionne

#### 4. Création de Consultation
- [ ] Le bouton "Nouvelle Consultation" ouvre le sélecteur de patient
- [ ] La sélection de patient fonctionne
- [ ] Le dialog de démarrage s'affiche
- [ ] Le workflow à 11 étapes s'affiche après création
- [ ] Toutes les étapes sont accessibles

#### 5. Workflow des 11 Étapes
- [ ] Étape 1 : Motif de Consultation
- [ ] Étape 2 : Anamnèse
- [ ] Étape 3 : Traitement en Cours
- [ ] Étape 4 : Antécédents
- [ ] Étape 5 : Prévention (Vaccination & Déparasitage)
- [ ] Étape 6 : Allergies
- [ ] Étape 7 : Bilans Antérieurs
- [ ] Étape 8 : Examen Physique
- [ ] Étape 9 : Diagnostic
- [ ] Étape 10 : Ordonnance
- [ ] Étape 11 : Clôture

#### 6. Sauvegarde et Persistance
- [ ] Les données sont sauvegardées à chaque étape
- [ ] La reprise d'une consultation en cours fonctionne
- [ ] La clôture de consultation fonctionne
- [ ] Les intégrations (Laboratoire, Pharmacie, etc.) fonctionnent

## 🔧 Résolution des Problèmes

### Problème : "Code clinique introuvable"

**Solution :**
1. Vérifier que le code est en majuscules : `CLINIC001`
2. Vérifier dans Supabase que la clinique existe :
   ```sql
   SELECT code, name, active FROM clinics WHERE code = 'CLINIC001';
   ```
3. Si la clinique n'existe pas, exécuter les migrations :
   ```powershell
   .\apply_migration_consolidated.ps1
   ```

### Problème : "Email ou mot de passe incorrect"

**Solution :**
1. Vérifier l'utilisateur dans Supabase :
   ```sql
   SELECT u.email, u.role, u.actif, c.code as clinic_code
   FROM users u
   JOIN clinics c ON u.clinic_id = c.id
   WHERE u.email = 'admin' AND c.code = 'CLINIC001';
   ```
2. Vérifier que `actif = true`
3. Réinitialiser le mot de passe si nécessaire

### Problème : Le module Consultation ne s'affiche pas

**Solution :**
1. Vérifier les permissions de l'utilisateur
2. Vérifier que le module est dans le menu (`src/components/layout/ModernLayout.tsx`)
3. Vérifier que la route est configurée (`src/App.tsx`)
4. Vérifier que l'utilisateur a accès au module `consultations`

### Problème : Erreur de connexion Supabase

**Solution :**
1. Vérifier les variables d'environnement dans `.env.local` :
   ```
   VITE_SUPABASE_URL=https://bnfgemmlokvetmohiqch.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
2. Redémarrer le serveur après modification des variables
3. Vérifier la connexion Supabase dans le dashboard

## 📊 Commandes de Vérification

### Vérifier les Cliniques

```sql
-- Dans Supabase Dashboard → SQL Editor
SELECT code, name, active, is_demo, 
       (SELECT COUNT(*) FROM users WHERE clinic_id = clinics.id) as nb_utilisateurs
FROM clinics
WHERE code IN ('CLINIC001', 'CAMPUS-001');
```

### Vérifier les Utilisateurs

```sql
-- Utilisateurs CLINIC001
SELECT u.email, u.nom, u.prenom, u.role, u.status, u.actif
FROM users u
JOIN clinics c ON u.clinic_id = c.id
WHERE c.code = 'CLINIC001';
```

### Vérifier les Consultations

```sql
-- Consultations récentes
SELECT c.id, c.patient_id, c.status, c.created_at,
       p.nom, p.prenom
FROM consultations c
LEFT JOIN patients p ON c.patient_id = p.id
ORDER BY c.created_at DESC
LIMIT 10;
```

## 🎯 Prochaines Étapes

1. **Tester la connexion :**
   - Utiliser `CLINIC001` / `admin` / `admin123`
   - Vérifier l'accès au module Consultation

2. **Tester le workflow :**
   - Créer une nouvelle consultation
   - Parcourir les 11 étapes
   - Vérifier la sauvegarde

3. **Tester les intégrations :**
   - Créer une prescription de laboratoire
   - Vérifier la création de facture
   - Tester la clôture avec rendez-vous

4. **Rapporter les problèmes :**
   - Documenter tous les bugs
   - Noter les erreurs dans la console
   - Créer des tickets pour chaque problème

---

**Dernière mise à jour :** 2025-01-27
**Version :** 1.0.0


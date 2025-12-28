# 📘 Guide Complet - Connexion et Améliorations

## 🔐 Informations de Connexion

### Comptes de Test Disponibles

#### CLINIC001 - Clinique Démo (Recommandé pour les tests)

| Champ | Valeur |
|-------|--------|
| **Code clinique** | `CLINIC001` |
| **Email** | `admin` |
| **Mot de passe** | `admin123` |
| **Rôle** | CLINIC_ADMIN |

**Autres comptes CLINIC001 :**
- `medecin` / `medecin123` (Rôle: MEDECIN)
- `infirmier` / `infirmier123` (Rôle: INFIRMIER)
- `receptionniste` / `receptionniste123` (Rôle: RECEPTIONNISTE)

#### CAMPUS-001 - Clinique du Campus

| Champ | Valeur |
|-------|--------|
| **Code clinique** | `CAMPUS-001` |
| **Email** | `bagarayannick1@gmail.com` |
| **Mot de passe** | `TempClinic2024!` |
| **Rôle** | CLINIC_ADMIN |
| **⚠️ Note** | Changement de mot de passe requis à la première connexion |

### Configuration Supabase

**URL Supabase :** `https://bnfgemmlokvetmohiqch.supabase.co`

**Clé Anon :** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8`

### Port de l'Application

- **Port par défaut :** `3001`
- **URL locale :** `http://localhost:3001`
- **URL alternative :** `http://localhost:3002` (si 3001 est occupé)

## ✅ Vérification du Module Consultation

### 1. Vérification de l'Affichage

Le module Consultation doit apparaître dans le menu de navigation avec :
- ✅ Icône : MedicalServices
- ✅ Texte : "Consultations"
- ✅ Route : `/consultations`
- ✅ Module requis : `consultations`

### 2. Vérification de la Route

Dans `src/App.tsx`, la route doit être configurée ainsi :

```typescript
<Route
  path="/consultations"
  element={
    <ProtectedModuleRoute user={user} requiredModule="consultations">
      <Layout user={user} onLogout={handleLogout}>
        <Consultations />
      </Layout>
    </ProtectedModuleRoute>
  }
/>
```

### 3. Vérification du Menu

Dans `src/components/layout/ModernLayout.tsx`, l'entrée doit être :

```typescript
{ text: 'Consultations', icon: <MedicalServices />, path: '/consultations', badge: null, module: 'consultations' }
```

### 4. Test de Fonctionnement

1. **Démarrer l'application :**
   ```bash
   npm run dev
   ```

2. **Se connecter avec un compte :**
   - Code clinique : `CLINIC001`
   - Email : `admin`
   - Mot de passe : `admin123`

3. **Vérifier l'accès au module :**
   - ✅ Le menu "Consultations" doit être visible
   - ✅ Cliquer sur "Consultations" doit afficher la page
   - ✅ La page doit afficher :
     - Statistiques (Total, Terminées, En cours, Annulées)
     - Bouton "Nouvelle Consultation"
     - Liste des consultations (si disponibles)
     - Filtres par onglets

4. **Tester la création d'une consultation :**
   - ✅ Cliquer sur "Nouvelle Consultation"
   - ✅ Sélectionner un patient
   - ✅ Choisir un template (optionnel)
   - ✅ Le workflow à 11 étapes doit s'afficher

## 🧪 Test avec TestSprite

### Initialisation

1. **Démarrer le serveur de développement :**
   ```bash
   npm run dev
   ```

2. **Vérifier que le serveur tourne sur le port 3001 :**
   - Ouvrir `http://localhost:3001`
   - La page de connexion doit s'afficher

3. **Bootstrap TestSprite :**
   - Le résumé du code a été généré dans `code_summary.json`
   - TestSprite est prêt à tester la page de connexion

### Tests Automatisés

TestSprite va tester :
- ✅ Affichage de la page de connexion
- ✅ Présence des champs (Code clinique, Email, Mot de passe)
- ✅ Validation du formulaire
- ✅ Connexion avec les comptes de test
- ✅ Redirection après connexion

## 🔧 Résolution des Problèmes de Connexion

### Problème 1 : "Code clinique introuvable"

**Causes possibles :**
- La migration n'a pas été appliquée
- Le code clinique est incorrect
- La clinique n'est pas active

**Solutions :**
1. Vérifier dans Supabase que la clinique existe :
   ```sql
   SELECT code, name, active FROM clinics WHERE code = 'CLINIC001';
   ```

2. Si la clinique n'existe pas, exécuter la migration :
   ```powershell
   .\apply_migration_consolidated.ps1
   ```

3. Vérifier que le code est en majuscules : `CLINIC001`

### Problème 2 : "Email ou mot de passe incorrect"

**Causes possibles :**
- Le mot de passe est incorrect
- L'utilisateur n'existe pas dans cette clinique
- Le hash du mot de passe est incorrect

**Solutions :**
1. Vérifier l'utilisateur dans Supabase :
   ```sql
   SELECT u.email, u.role, u.actif, c.code as clinic_code
   FROM users u
   JOIN clinics c ON u.clinic_id = c.id
   WHERE u.email = 'admin' AND c.code = 'CLINIC001';
   ```

2. Vérifier que l'utilisateur est actif : `actif = true`

3. Réinitialiser le mot de passe si nécessaire :
   ```sql
   -- Hash de "admin123" (SHA256)
   UPDATE users 
   SET password_hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
   WHERE email = 'admin' AND clinic_id = (SELECT id FROM clinics WHERE code = 'CLINIC001');
   ```

### Problème 3 : "Module non accessible"

**Causes possibles :**
- L'utilisateur n'a pas les permissions pour le module `consultations`
- Le module n'est pas activé pour la clinique

**Solutions :**
1. Vérifier les permissions de l'utilisateur :
   ```sql
   SELECT role, permissions FROM users WHERE email = 'admin';
   ```

2. Vérifier que le rôle a accès au module :
   - `CLINIC_ADMIN` : Accès à tous les modules
   - `MEDECIN` : Accès au module consultations
   - `INFIRMIER` : Accès limité

### Problème 4 : Le module Consultation ne s'affiche pas

**Causes possibles :**
- Le module n'est pas dans le menu
- La route n'est pas configurée
- L'utilisateur n'a pas les permissions

**Solutions :**
1. Vérifier `src/components/layout/ModernLayout.tsx` :
   - L'entrée "Consultations" doit être présente
   - Le module doit être `'consultations'`

2. Vérifier `src/App.tsx` :
   - La route `/consultations` doit être configurée
   - Le composant `Consultations` doit être importé

3. Vérifier les permissions :
   - L'utilisateur doit avoir accès au module `consultations`

## 📋 Guide des Prochaines Étapes d'Amélioration

### Phase 1 : Stabilisation et Tests (Priorité Haute)

#### 1.1 Tests de Connexion
- [ ] Tester tous les comptes de connexion
- [ ] Vérifier l'isolation des données entre cliniques
- [ ] Tester les différents rôles et leurs permissions
- [ ] Valider le workflow de changement de mot de passe

#### 1.2 Tests du Module Consultation
- [ ] Tester la création d'une nouvelle consultation
- [ ] Vérifier que toutes les 11 étapes fonctionnent
- [ ] Tester la sauvegarde à chaque étape
- [ ] Vérifier la reprise d'une consultation en cours
- [ ] Tester la clôture d'une consultation

#### 1.3 Tests d'Intégration
- [ ] Vérifier les liens avec le module Laboratoire
- [ ] Tester la création de prescriptions
- [ ] Vérifier l'intégration avec la Pharmacie
- [ ] Tester la facturation automatique

### Phase 2 : Amélioration de l'UX (Priorité Moyenne)

#### 2.1 Interface Utilisateur
- [ ] Améliorer les messages d'erreur
- [ ] Ajouter des indicateurs de chargement
- [ ] Optimiser la navigation entre les étapes
- [ ] Ajouter des raccourcis clavier

#### 2.2 Performance
- [ ] Optimiser le chargement des consultations
- [ ] Implémenter la pagination pour les listes
- [ ] Ajouter la mise en cache des données
- [ ] Optimiser les requêtes Supabase

#### 2.3 Accessibilité
- [ ] Ajouter les labels ARIA
- [ ] Améliorer le contraste des couleurs
- [ ] Tester avec les lecteurs d'écran
- [ ] Ajouter le support du clavier

### Phase 3 : Fonctionnalités Avancées (Priorité Basse)

#### 3.1 Rapports et Statistiques
- [ ] Créer des rapports de consultations
- [ ] Ajouter des graphiques de tendances
- [ ] Exporter les données en PDF/Excel
- [ ] Créer un tableau de bord analytique

#### 3.2 Notifications
- [ ] Notifications en temps réel
- [ ] Alertes pour les consultations urgentes
- [ ] Rappels pour les rendez-vous
- [ ] Notifications par email/SMS

#### 3.3 Intégrations Externes
- [ ] Intégration avec les systèmes de laboratoire externes
- [ ] Connexion avec les pharmacies externes
- [ ] Synchronisation avec les systèmes de paiement
- [ ] Export vers les systèmes de santé nationaux

### Phase 4 : Sécurité et Conformité (Priorité Critique)

#### 4.1 Sécurité
- [ ] Audit de sécurité complet
- [ ] Implémenter le chiffrement des données sensibles
- [ ] Ajouter la journalisation des actions critiques
- [ ] Mettre en place la gestion des sessions

#### 4.2 Conformité
- [ ] Conformité RGPD
- [ ] Conformité aux normes médicales locales
- [ ] Audit de traçabilité
- [ ] Documentation des procédures

### Phase 5 : Documentation et Formation (Priorité Moyenne)

#### 5.1 Documentation Technique
- [ ] Documenter l'architecture
- [ ] Créer des guides d'installation
- [ ] Documenter les APIs
- [ ] Créer des diagrammes de flux

#### 5.2 Documentation Utilisateur
- [ ] Guide d'utilisation pour chaque module
- [ ] Vidéos de formation
- [ ] FAQ
- [ ] Guide de dépannage

## 🎯 Checklist de Vérification Immédiate

### Avant de Commencer les Tests

- [ ] Le serveur de développement est démarré (`npm run dev`)
- [ ] Le port 3001 est accessible
- [ ] Les variables d'environnement Supabase sont configurées
- [ ] Les migrations Supabase sont appliquées
- [ ] Les comptes de test existent dans la base de données

### Vérification du Module Consultation

- [ ] Le module apparaît dans le menu
- [ ] La route `/consultations` fonctionne
- [ ] La page s'affiche correctement
- [ ] Les statistiques sont calculées
- [ ] Le bouton "Nouvelle Consultation" fonctionne
- [ ] La sélection de patient fonctionne
- [ ] Le workflow à 11 étapes s'affiche
- [ ] La sauvegarde fonctionne à chaque étape

### Vérification des Intégrations

- [ ] Le module Laboratoire est accessible depuis Consultation
- [ ] Les prescriptions sont créées correctement
- [ ] La facturation automatique fonctionne
- [ ] Les rendez-vous sont créés à la clôture

## 📞 Support et Dépannage

### Commandes Utiles

```bash
# Démarrer le serveur
npm run dev

# Vérifier les variables d'environnement
cat .env.local

# Vérifier les migrations Supabase
# (via Supabase Dashboard → SQL Editor)
```

### Logs à Vérifier

1. **Console du navigateur (F12) :**
   - Erreurs JavaScript
   - Requêtes Supabase
   - Messages de débogage

2. **Logs Supabase :**
   - Supabase Dashboard → Logs
   - Vérifier les erreurs de requêtes
   - Vérifier les politiques RLS

3. **Logs de l'application :**
   - Terminal où `npm run dev` est exécuté
   - Erreurs de compilation
   - Erreurs de serveur

### Ressources

- **Documentation Supabase :** https://supabase.com/docs
- **Documentation React :** https://react.dev
- **Documentation Material-UI :** https://mui.com

## 🚀 Prochaines Actions Immédiates

1. **Tester la connexion :**
   - Utiliser le compte `admin` / `admin123` avec `CLINIC001`
   - Vérifier que le module Consultation est accessible

2. **Tester le workflow :**
   - Créer une nouvelle consultation
   - Parcourir les 11 étapes
   - Vérifier que la sauvegarde fonctionne

3. **Tester les intégrations :**
   - Créer une prescription de laboratoire
   - Vérifier la création de facture
   - Tester la clôture avec rendez-vous

4. **Rapporter les problèmes :**
   - Noter tous les bugs rencontrés
   - Documenter les erreurs
   - Créer des tickets pour chaque problème

---

**Dernière mise à jour :** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Version :** 1.0.0


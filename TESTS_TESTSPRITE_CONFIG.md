# 🧪 Configuration TestSprite - LogiClinic.org

## 📋 Vue d'ensemble

Ce document décrit la configuration TestSprite pour tester :
1. La landing page (page de connexion)
2. Le modèle de connexion multi-clinic

## 🔧 Configuration

### Port du serveur
- **Port par défaut :** 3001
- **Port alternatif :** 3002 (si 3001 est occupé)
- **Vérification :** Vérifier dans la console lors du démarrage (`npm run dev`)

### Type de test
- **Type :** `frontend`
- **Pathname :** `/login` (page de connexion)

## 🎯 Tests à effectuer

### Test 1 : Landing Page (Page de connexion)

**Objectif :** Vérifier que la page de connexion s'affiche correctement avec le formulaire multi-clinic.

**Éléments à vérifier :**
- ✅ Le formulaire de connexion est visible
- ✅ Le champ "Code clinique" est présent
- ✅ Le champ "Nom d'utilisateur" (email) est présent
- ✅ Le champ "Mot de passe" est présent
- ✅ Le bouton "Se connecter" est présent
- ✅ La validation du code clinique fonctionne en temps réel

### Test 2 : Connexion Multi-Clinic

**Objectif :** Vérifier que la connexion avec code clinique fonctionne correctement.

**Scénarios de test :**

#### Scénario 2.1 : Connexion réussie
1. Entrer un code clinique valide (ex: `CLINIC001`)
2. Entrer un email valide
3. Entrer le mot de passe correct
4. ✅ Vérifier que la connexion réussit
5. ✅ Vérifier que l'utilisateur est redirigé vers le dashboard

#### Scénario 2.2 : Code clinique invalide
1. Entrer un code clinique invalide (ex: `INVALID-CODE`)
2. Entrer un email
3. Entrer un mot de passe
4. ✅ Vérifier qu'un message d'erreur s'affiche : "Code clinique invalide"

#### Scénario 2.3 : Utilisateur inexistant dans la clinique
1. Entrer un code clinique valide (ex: `CLINIC001`)
2. Entrer un email qui n'existe pas dans cette clinique
3. Entrer un mot de passe
4. ✅ Vérifier qu'un message d'erreur s'affiche : "Utilisateur non trouvé"

#### Scénario 2.4 : Mot de passe incorrect
1. Entrer un code clinique valide
2. Entrer un email valide
3. Entrer un mot de passe incorrect
4. ✅ Vérifier qu'un message d'erreur s'affiche : "Mot de passe incorrect"

### Test 3 : Isolation des données

**Objectif :** Vérifier que les données sont bien isolées par clinique.

**Scénario :**
1. Se connecter avec Clinique A
2. Ajouter un patient dans Clinique A
3. Se déconnecter
4. Se connecter avec Clinique B
5. ✅ Vérifier que le patient de Clinique A n'est pas visible

## 🚀 Commandes TestSprite

### Initialisation TestSprite

```bash
# Démarrer le serveur de développement d'abord
npm run dev

# Dans un autre terminal, initialiser TestSprite
# (La commande sera générée automatiquement par TestSprite MCP)
```

### Paramètres de configuration

- **projectPath :** Chemin absolu du projet
- **localPort :** 3001 (ou 3002 si 3001 est occupé)
- **type :** `frontend`
- **testScope :** `codebase` (pour tester tout le codebase)
- **pathname :** `/login` (pour la page de connexion)

## 📝 Données de test

### Clinique de test (CLINIC001 - Démo)

- **Code :** `CLINIC001`
- **Nom :** `Clinique Démo`
- **Admin :**
  - Email : `admin` (ou selon votre configuration)
  - Mot de passe : `admin123` (ou selon votre configuration)

### Nouvelle clinique (à créer via fonction)

Pour créer une nouvelle clinique de test :

```sql
SELECT super_admin_create_clinic(
  'Clinique Test',
  'admin@test.bj',
  '123 Rue Test, Cotonou',
  '+229 21 12 34 56',
  'contact@test.bj',
  'Admin',
  'Test',
  '+229 97 12 34 56',
  false
);
```

Cette fonction retournera :
- Le code clinique généré (ex: `CLIN-2025-001`)
- Le mot de passe temporaire pour l'admin

## ✅ Checklist de vérification

- [ ] Le serveur de développement est démarré
- [ ] Le port est correct (3001 ou 3002)
- [ ] La page `/login` est accessible
- [ ] Le formulaire de connexion s'affiche
- [ ] La validation du code clinique fonctionne
- [ ] La connexion avec code clinique fonctionne
- [ ] Les erreurs sont affichées correctement
- [ ] L'isolation des données fonctionne

## 🔍 Dépannage

### Le serveur ne démarre pas
- Vérifier que le port 3001 (ou 3002) n'est pas occupé
- Vérifier les dépendances : `npm install`
- Vérifier les variables d'environnement

### La page de connexion ne s'affiche pas
- Vérifier que le serveur est bien démarré
- Vérifier l'URL : `http://localhost:3001/login` (ou 3002)
- Vérifier la console du navigateur pour les erreurs

### La connexion échoue
- Vérifier que la clinique existe dans Supabase
- Vérifier que l'utilisateur existe et est lié à la clinique
- Vérifier que le mot de passe est correct
- Vérifier les logs Supabase pour les erreurs SQL

---

**Date de création :** 2025-01-XX  
**Version :** 1.0


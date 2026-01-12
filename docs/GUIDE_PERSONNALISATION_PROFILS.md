# Guide de Personnalisation des Profils Utilisateurs

## 📋 Vue d'ensemble

Le système de profils personnalisés permet de créer des profils réutilisables avec des permissions spécifiques pour votre clinique. Ces profils peuvent ensuite être assignés aux utilisateurs pour leur donner des accès personnalisés.

## 🎯 Concepts clés

### Profils vs Rôles

- **Rôles** : Définis au niveau système (médecin, infirmier, pharmacien, etc.) avec des permissions par défaut
- **Profils personnalisés** : Créés par l'administrateur de la clinique avec des permissions spécifiques

### Avantages des profils personnalisés

1. **Réutilisables** : Un profil peut être assigné à plusieurs utilisateurs
2. **Personnalisables** : Permissions granulaires par module et sous-module
3. **Isolés par clinique** : Chaque clinique a ses propres profils
4. **Faciles à gérer** : Modification d'un profil = mise à jour pour tous les utilisateurs qui l'utilisent

## 🚀 Comment créer un profil personnalisé

### Étape 1 : Accéder à la gestion des profils

1. Aller dans **Utilisateurs et Permissions**
2. Cliquer sur l'onglet **"Profils"** dans `GestionUtilisateurs`
3. Cliquer sur **"Nouveau Profil"**

### Étape 2 : Remplir les informations de base

- **Nom du profil** : Nom descriptif (ex: "Pharmacien Senior", "Médecin Urgences")
- **Rôle de base** : Sélectionner un rôle existant comme point de départ
- **Statut** : Actif/Inactif

### Étape 3 : Configurer les permissions

Après la création du profil :

1. Cliquer sur l'icône **🔒 Sécurité** à côté du profil
2. Dans le dialogue de permissions, vous pouvez :
   - **Activer/Désactiver** des modules entiers
   - **Configurer les actions** par module (lecture, écriture, suppression, admin)
   - **Personnaliser les sous-modules** avec des permissions spécifiques

### Exemple : Créer un profil "Pharmacien Senior"

1. **Créer le profil** :
   - Nom : "Pharmacien Senior"
   - Rôle de base : "Pharmacien"
   - Actif : Oui

2. **Configurer les permissions** :
   - Module **Pharmacie** : Toutes les actions (read, write, delete, admin)
   - Module **Stock** : read, write (pas de delete ni admin)
   - Module **Patients** : read uniquement
   - Module **Consultations** : Aucun accès

## 📝 Structure des permissions

### Niveaux de permissions

1. **Module** : Permissions au niveau du module entier
   - Exemple : Accès complet au module "Pharmacie"

2. **Sous-module** : Permissions spécifiques à un sous-module
   - Exemple : Accès uniquement à "Gestion des médicaments" dans le module Pharmacie

### Types d'actions

- **read** : Lecture seule
- **write** : Création et modification
- **delete** : Suppression
- **admin** : Administration complète du module

## 🔧 Gestion des profils

### Modifier un profil existant

1. Cliquer sur l'icône **✏️ Modifier** à côté du profil
2. Modifier les informations de base
3. Cliquer sur **"Modifier"**

Pour modifier les permissions :
1. Cliquer sur l'icône **🔒 Sécurité**
2. Ajuster les permissions
3. Cliquer sur **"Enregistrer"**

### Supprimer un profil

1. Cliquer sur l'icône **🗑️ Supprimer**
2. Confirmer la suppression

⚠️ **Attention** : La suppression d'un profil n'affecte pas les utilisateurs existants, mais ils perdront les permissions spécifiques du profil.

### Activer/Désactiver un profil

Dans le dialogue de modification, cocher/décocher **"Profil actif"**.

Les profils inactifs ne peuvent pas être assignés à de nouveaux utilisateurs.

## 🎨 Exemples de profils personnalisés

### Profil "Médecin Urgences"

- **Rôle de base** : Médecin
- **Permissions** :
  - Module Consultations : read, write, delete
  - Module Patients : read, write
  - Module Urgences : read, write, admin
  - Module Prescriptions : read, write
  - Autres modules : read uniquement

### Profil "Caissier Junior"

- **Rôle de base** : Caissier
- **Permissions** :
  - Module Caisse : read, write (pas de delete ni admin)
  - Module Facturation : read uniquement
  - Module Rapports : Aucun accès
  - Autres modules : Aucun accès

### Profil "Administrateur Pharmacie"

- **Rôle de base** : Pharmacien
- **Permissions** :
  - Module Pharmacie : Toutes les actions (read, write, delete, admin)
  - Module Stock : Toutes les actions
  - Module Utilisateurs : read uniquement (pour voir les autres pharmaciens)
  - Autres modules : read uniquement

## 🔐 Bonnes pratiques

### 1. Principe du moindre privilège

Donnez uniquement les permissions nécessaires pour le travail de l'utilisateur.

### 2. Nommage clair

Utilisez des noms descriptifs qui indiquent clairement le niveau d'accès :
- ✅ "Pharmacien Senior"
- ✅ "Caissier Junior"
- ❌ "Profil 1"
- ❌ "Test"

### 3. Documentation

Ajoutez une description dans le profil pour expliquer son usage.

### 4. Révision régulière

Révisez régulièrement les profils pour :
- Supprimer les profils non utilisés
- Ajuster les permissions selon les besoins
- Vérifier que les profils correspondent toujours aux besoins

## 🛠️ Dépannage

### Le profil n'apparaît pas dans la liste

- Vérifier que le profil est **actif**
- Vérifier que vous êtes connecté à la bonne **clinique**
- Rafraîchir la page

### Les permissions ne s'appliquent pas

- Vérifier que le profil est bien **assigné** à l'utilisateur
- Vérifier que le profil est **actif**
- Vérifier que les permissions sont correctement **sauvegardées**

### Erreur lors de la création

- Vérifier que le **nom du profil** est unique dans votre clinique
- Vérifier que le **rôle de base** existe
- Vérifier que vous avez les **permissions d'administrateur**

## 📚 Ressources supplémentaires

- [Architecture Multi-Tenant](./ARCHITECTURE_MULTI_TENANT_COMPLETE.md)
- [Guide des Permissions](./GUIDE_PERMISSIONS.md)
- [Configuration du Profil Utilisateur](./CONFIGURATION_PROFIL_UTILISATEUR.md)

## 💡 Astuces

1. **Créer des profils par équipe** : Si plusieurs utilisateurs ont les mêmes besoins, créez un profil partagé
2. **Utiliser les rôles de base** : Commencez toujours par un rôle de base proche de ce que vous voulez, puis personnalisez
3. **Tester avant de déployer** : Créez un profil de test, assignez-le à un utilisateur test, vérifiez les permissions
4. **Documenter les exceptions** : Si un profil a des permissions inhabituelles, documentez pourquoi dans la description

---

**Version** : 1.0  
**Date** : 2025-01-12  
**Auteur** : Logi Clinic Team

# Guide Administrateur - Gestion de la Récupération de Compte

## Vue d'ensemble

Le système de récupération de compte permet aux utilisateurs de demander la récupération de leurs identifiants de connexion (nom d'utilisateur, code clinique, mot de passe) lorsqu'ils les ont oubliés. En tant qu'administrateur, vous êtes responsable de vérifier l'identité des demandeurs et d'approuver ou rejeter leurs demandes.

## Accès à l'interface

1. Connectez-vous en tant qu'administrateur
2. Dans le menu latéral, cliquez sur **"Gestion Récupération"**
3. Vous accédez à la page de gestion des demandes de récupération

## Interface de gestion

### Tableau de bord

La page affiche :
- **Statistiques** : Nombre total de demandes, demandes en attente, traitées aujourd'hui, complétées
- **Tableau des demandes** : Liste de toutes les demandes avec leurs informations principales
- **Filtres** : Permet de filtrer par statut et code clinique

### Colonnes du tableau

- **Date** : Date et heure de création de la demande
- **Email** : Adresse email du demandeur
- **Nom** : Nom et prénom du demandeur
- **Code clinique** : Code de la clinique (peut être vide)
- **Données demandées** : Liste des données que l'utilisateur souhaite récupérer
- **Statut** : État actuel de la demande
- **Actions** : Bouton pour voir les détails

## Processus de traitement

### 1. Consultation d'une demande

Cliquez sur l'icône 👁️ (œil) dans la colonne "Actions" pour voir les détails complets d'une demande.

### 2. Vérification de l'identité

Dans la modal de détails, vous pouvez voir :
- **Informations utilisateur** : Nom, prénom, email, téléphone, code clinique
- **Questions de sécurité** : Les 3 questions sélectionnées par l'utilisateur (les réponses sont hashées et ne sont pas visibles)
- **Données demandées** : Ce que l'utilisateur souhaite récupérer
- **Historique** : Toutes les actions effectuées sur cette demande

**Étapes de vérification :**

1. **Vérification croisée des données** :
   - Comparez le nom, prénom et email avec les données dans la base de données de la clinique
   - Vérifiez que le téléphone correspond
   - Si un code clinique est fourni, vérifiez qu'il correspond

2. **Vérification des réponses aux questions** :
   - Contactez l'utilisateur par téléphone ou email pour vérifier les réponses
   - Comparez les réponses avec celles stockées (hashées) dans le système
   - Si les réponses ne correspondent pas, rejetez la demande

3. **Vérification supplémentaire** (si nécessaire) :
   - Demandez des informations supplémentaires pour confirmer l'identité
   - Vérifiez avec l'admin de la clinique si l'utilisateur est bien un employé

### 3. Décision : Approuver ou Rejeter

#### Approuver une demande

1. Cliquez sur le bouton **"Approuver"** (vert)
2. Le système va :
   - Rechercher l'utilisateur dans la base de données
   - Générer les données demandées :
     - **Nom d'utilisateur** : Récupéré depuis la base
     - **Code clinique** : Récupéré depuis la base ou celui fourni
     - **Mot de passe** : Un nouveau mot de passe temporaire est généré et le mot de passe de l'utilisateur est mis à jour
   - Envoyer un email à l'utilisateur avec les données récupérées
   - Mettre à jour le statut de la demande à "Complétée"

**Important** : Si un nouveau mot de passe est généré, l'utilisateur devra le changer lors de sa prochaine connexion.

#### Rejeter une demande

1. Cliquez sur le bouton **"Rejeter"** (rouge)
2. Une fenêtre s'ouvre pour saisir la raison du rejet
3. Saisissez une raison claire et précise
4. Cliquez sur **"Confirmer le rejet"**
5. La demande est marquée comme "Rejetée" et l'utilisateur est informé

**Raisons courantes de rejet :**
- Réponses aux questions de sécurité incorrectes
- Informations ne correspondant pas aux données de la base
- Suspicion de fraude ou d'usurpation d'identité
- Utilisateur non trouvé dans la base de données

## Statuts des demandes

- **En attente (pending)** : Demande créée, en attente de traitement
- **Vérifiée (verified)** : Réponses aux questions vérifiées avec succès
- **Approuvée (approved)** : Demande approuvée, données préparées
- **Complétée (completed)** : Données envoyées par email à l'utilisateur
- **Rejetée (rejected)** : Demande rejetée avec raison

## Notes administrateur

Vous pouvez ajouter des notes privées sur chaque demande pour :
- Documenter le processus de vérification
- Noter des informations importantes
- Garder une trace des actions effectuées

Ces notes ne sont visibles que par les administrateurs et ne sont pas envoyées à l'utilisateur.

## Sécurité

### Mesures de sécurité implémentées

1. **Rate limiting** : Maximum 3 demandes par email par jour
2. **Hash des réponses** : Les réponses aux questions de sécurité sont hashées avec bcrypt
3. **Expiration automatique** : Les demandes expirent après 7 jours
4. **Logs d'audit** : Toutes les actions sont enregistrées avec horodatage et auteur
5. **Validation stricte** : Toutes les données sont validées avant traitement

### Bonnes pratiques

- **Ne jamais partager les identifiants par téléphone** : Utilisez uniquement l'email
- **Vérifier toujours l'identité** : Ne pas approuver sans vérification
- **Documenter les décisions** : Utilisez les notes admin pour expliquer vos décisions
- **Surveiller les patterns suspects** : Plusieurs demandes depuis le même email/IP peuvent indiquer une tentative de fraude

## Dépannage

### L'utilisateur ne reçoit pas l'email

1. Vérifiez que l'email a bien été envoyé (statut "Complétée")
2. Vérifiez que l'adresse email est correcte
3. Vérifiez les logs du serveur pour les erreurs d'envoi
4. Contactez le support technique si nécessaire

### Erreur lors de la recherche de l'utilisateur

1. Vérifiez que le code clinique est correct
2. Vérifiez que l'utilisateur existe dans la base de données
3. Vérifiez que les informations (nom, prénom, email) correspondent exactement

### Demande expirée

Les demandes expirent automatiquement après 7 jours. L'utilisateur devra créer une nouvelle demande.

## Support

Pour toute question ou problème, contactez :
- **Email** : support@logi-clinic.com
- **Téléphone** : +229 0169274680

---

**Dernière mise à jour** : 2024


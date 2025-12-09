# Plan d’exécution – Header “centre de commande”

## 1. Accès rapide à la recherche

### 1.1 Constat actuel
- `ModernLayout` expose déjà les états `searchDialogOpen`, `selectedPatient` et un déclencheur clavier `Ctrl/Cmd + K` qui ouvre `PatientSearchAdvanced`. La boîte se limite toutefois aux patients (aucune autocomplétion ni navigation vers d’autres modules) (`src/components/layout/ModernLayout.tsx`).
- `PatientSearchAdvanced` exploite `PatientService.getAllPatients` et applique les filtres côté client, ce qui charge tout le dataset avant filtrage (`src/components/consultation/PatientSearchAdvanced.tsx`).

### 1.2 Flux de données cible
| Domaine | Source existante | Besoin | Implémentation proposée |
| --- | --- | --- | --- |
| Patients | `PatientService.searchPatients`, `getPatientById` | Rechercher par nom, dossier, téléphone | Ajouter une route `/patients/search?q=` dans l’API + pagination, fallback Supabase |
| Consultations | `ConsultationApiService.getConsultationsByPatient` et `getConsultationsByStatus` | Lister les actes récents ou ouverts | Endpoint combiné `/consultations/search?q=`, reliant patient + praticien |
| Agenda / RDV | `RendezVousService` (Supabase) & API backend | Trouver les rendez-vous programmés par patient/service | Ajouter filtre `patientIdentifiant` + date |
| Examens (labo/imagerie) | `laboratoireService`, `imagerieService` | Requêtes en attente | Étendre services avec méthode `searchPendingRequests(query)` |

### 1.3 Spécifications UI/UX
1. Barre de recherche multi-sections :
   - Tags (Patients / Consultations / RDV / Examens) ou raccourcis clavier (`P`, `C`, `R`, `E`).
   - Résultats paginés (max 5 par section) + CTA “Voir tout”.
2. Suggestions instantanées :
   - Précharger les 3 derniers patients consultés (localStorage `recentPatients`).
   - Afficher l’état (En cours, Clôturé, Urgent) avec badges MUI.
3. Actions rapides :
   - `Entrée` ouvre la fiche liée; `Ctrl+Entrée` ouvre dans un nouvel onglet (router `navigate` + `window.open`).
   - Bouton “Créer patient” visible pour utilisateurs autorisés (`hasModuleAccess(user, 'patients')`).
4. Techniques :
   - Hook `useGlobalSearch` encapsulant debounce, agrégation des résultats, erreurs.
   - Cache SWR (clé `global-search::${query}`) pour éviter les allers-retours.
   - Indicateurs de chargement par section + message vide contextualisé.

## 2. Notifications actionnables

### 2.1 Typologie & sources
- Consultations : webhooks backend sur création/fermeture (`/consultations` routes server) → canal `consultation`.
- Laboratoire : `laboratoireService` (résultats prêts) + `LabRequestWizard` → canal `laboratoire`.
- Imagerie : `ImagingRequestWizard` → canal `imagerie`.
- Stock/pharmacie : `stockService`, `pharmacyApi` (lots critiques) → canal `stock`.
- Facturation & rendez-vous : `facturationService`, `RendezVousService.notifyPatient`.
> Recommandation : centraliser via un endpoint `/notifications` avec SSE/WebSocket pour mise à jour temps réel.

### 2.2 Flux fonctionnel
1. Stockage :
   - Redux/Context `useNotificationsStore` avec liste normalisée `{entities, ids}`.
   - Persistance locale (IndexedDB) pour disposer des 50 dernières entrées hors ligne.
2. Lecture :
   - Bouton “Tout marquer lu” -> mutation PUT `/notifications/mark-read`.
   - Actions unitaires → marquer lu + naviguer selon `notification.payload.route`.
3. Regroupement :
   - Sections par type avec badges colorés (consultation=primary, labo=success, stock=warning, facturation=info).
   - Tri par priorité > date; limiter aux 10 plus récentes par type.
4. Actions rapides :
   - Consultations : boutons `Ouvrir`, `Planifier suivi`, `Appeler patient`.
   - Labo/Imagerie : `Afficher résultat`, `Imprimer PDF`.
   - Stock : `Créer bon de commande`, `Voir stock`.
5. Page détaillée :
   - CTA “Voir tout” vers `/notifications-center` (table + filtres + recherche).

## 3. Paramètres rapides & navigation

### 3.1 Inventaire des toggles
| Toggle | Description | Persistance |
| --- | --- | --- |
| `compactDrawer` | Largeur réduite / icônes seules | `userPreferences.nav.compact` (table `user_preferences`) |
| `emailAlerts` | Alerte mail pour notifications critiques | `userPreferences.notifications.email` |
| `autoUpdates` | Recharger automatiquement les listes (patients, stock) | `userPreferences.app.autoRefresh` |
| `themeMode` | Light/Dark (déjà géré via `useThemeMode`) | localStorage + backend |
| `moduleShortcuts` | Modules affichés dans le drawer | `userPreferences.nav.shortcuts:string[]` |

### 3.2 Workflow technique
1. `useUserPreferences` hook :
   - Charge via `/users/{id}/preferences`.
   - Expose `updatePreference(path, value)` avec optimistic update + rollback.
2. Local fallback :
   - Stocker un snapshot dans `localStorage('logi-pref-cache')` pour ré-hydratation instantanée.
3. Cohérence avec la page Paramètres :
   - Chaque toggle du menu rapide pointe vers la section correspondante : ex. `compactDrawer` → `ParametresGeneraux`.
   - Inline link “Ajuster plus de paramètres” -> `navigate('/parametres#sectionId')`.

## 4. Profil utilisateur enrichi

### 4.1 Contenu
- Données principales : nom, rôle (`user.role`), email, numéro de matricule (`user.identifiant` si dispo), dernière connexion.
- Affectations : modules autorisés (`user.permissions.modules`), service de rattachement.
- Préférences : langue, signature numérique, mode de notification.

### 4.2 Actions
| Action | Flux | Notes |
| --- | --- | --- |
| Modifier profil | Glide vers `/parametres?tab=profil` | Pré-remplir formulaire |
| Changer mot de passe | Modale dédiée -> `authService.updatePassword` | Exiger mot de passe courant |
| Activer 2FA | Rediriger vers `/parametres?tab=securite` | QR code + codes de secours |
| Déconnexion | Déjà implémentée, ajouter confirmation si session critique | Logger via `auditService` |

### 4.3 Structuration
- Créer `useUserProfilePanel` :
  - Charge `User` + préférences + stats personnelles (consultations réalisées, prescriptions).
  - Fournit actions `onEditProfile`, `onOpenSecurity`, `onLogout`.
- Mutualiser ce hook entre le menu et une future page “Mon compte”.

## 5. Validation, accessibilité & observabilité

### 5.1 Tests automatisés
| Cas | Type | Détails |
| --- | --- | --- |
| Recherche via clavier | Cypress | `cy.realPress(['Control','K'])`, saisir requête, vérifier navigation |
| Suggestions patients | React Testing Library | Mocker `useGlobalSearch`, vérifier update du focus |
| Notifications | Cypress component | Cliquer notification, s’assurer qu’elle passe en “lu” et navigation |
| Toggles rapides | RTL | Vérifier persistence après `updatePreference` résolu/refusé |
| Profil sans données | RTL | `user=null` => placeholders “Utilisateur” |

### 5.2 Accessibilité
- Ajouts requis :
  - `role="dialog"` + focus trap (MUI `Dialog` déjà gère) mais rajouter `aria-labelledby`.
  - Boutons icônes (`Notifications`, `Settings`) → `aria-label`.
  - Navigation clavier dans la liste de notifications (flèches + `Home/End`).
  - Couleurs badges contrastées (ratio 4.5:1).

### 5.3 Observabilité
- Événements à tracer (vers `auditService` ou analytics interne) :
  - `header.search.opened`, `header.search.result_clicked`.
  - `header.notifications.opened`, `header.notifications.mark_all_read`.
  - `header.quick_settings.updated` avec payload `{ key, value }`.
  - `header.profile.action` avec `actionType`.
- Centraliser dans `useHeaderTelemetry` pour éviter la duplication.

---

Livrables attendus :
1. Hook `useGlobalSearch` + endpoint backend de recherche.
2. Store notifications + page `/notifications-center`.
3. Hook `useUserPreferences` + persistance toggles.
4. Profil enrichi basé sur `useUserProfilePanel`.
5. Suite de tests + instrumentation & recommandations a11y.


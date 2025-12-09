# Configuration Supabase pour la Gestion des Patients

## 🚀 Étapes de Configuration

### 1. Accéder à votre Dashboard Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet : `kfuqghnlrnqaiaiwzziv`

### 2. Créer la Table des Patients

1. Dans votre dashboard Supabase, allez dans **SQL Editor**
2. Cliquez sur **New Query**
3. Copiez et collez le contenu du fichier `supabase_migrations/create_patients_table.sql`
4. Cliquez sur **Run** pour exécuter la migration

### 3. Vérifier la Création de la Table

1. Allez dans **Table Editor**
2. Vous devriez voir la table `patients` créée
3. Vérifiez que les données de démonstration sont présentes

### 4. Configurer les Permissions (Optionnel)

Si vous voulez activer la sécurité au niveau des lignes (RLS) :

1. Dans **Table Editor**, sélectionnez la table `patients`
2. Allez dans **Settings** > **RLS**
3. Activez **Enable RLS**
4. Créez une politique d'accès selon vos besoins

### 5. Vérifier la Configuration de l'Application

L'application est déjà configurée avec :
- **URL Supabase** : `https://kfuqghnlrnqaiaiwzziv.supabase.co`
- **Clé anonyme** : Configurée dans `src/services/supabase.ts`

## 📁 Structure des Fichiers Créés

```
src/
├── services/
│   ├── supabase.ts          # Configuration Supabase et types
│   └── patientService.ts    # Service CRUD pour les patients
├── hooks/
│   └── usePatients.ts       # Hook personnalisé pour la gestion des patients
└── components/
    └── patients/
        ├── PatientsTable.tsx           # Tableau des patients
        ├── PatientForm.tsx             # Formulaire d'ajout/modification
        ├── PatientDetailsDialog.tsx    # Dialogue des détails
        ├── DeleteConfirmationDialog.tsx # Dialogue de confirmation
        └── PatientsManagement.tsx      # Composant principal
```

## 🔧 Utilisation

### Intégration dans votre Application

1. **Remplacez la page existante** : Remplacez le contenu de `src/pages/GestionPatients.tsx` par :

```tsx
import { PatientsManagement } from '../components/patients/PatientsManagement';

export default function GestionPatients() {
  return <PatientsManagement />;
}
```

2. **Ou créez une nouvelle route** dans `src/App.tsx` :

```tsx
import { PatientsManagement } from './components/patients/PatientsManagement';

// Dans vos routes
<Route path="/patients-supabase" element={<PatientsManagement />} />
```

### Fonctionnalités Disponibles

- ✅ **CRUD complet** : Créer, lire, mettre à jour, supprimer des patients
- ✅ **Recherche** : Recherche par nom, prénom ou identifiant
- ✅ **Filtrage** : Par service et statut
- ✅ **Statistiques** : Compteurs et répartitions
- ✅ **Validation** : Validation des champs obligatoires
- ✅ **Interface moderne** : Material-UI avec design responsive

## 🚨 Résolution des Problèmes

### Erreur de Connexion

Si vous obtenez une erreur de connexion :

1. Vérifiez que l'URL Supabase est correcte
2. Vérifiez que la clé anonyme est valide
3. Vérifiez que la table `patients` existe

### Erreur de Table

Si la table n'est pas trouvée :

1. Exécutez à nouveau le script SQL
2. Vérifiez dans **Table Editor** que la table existe
3. Vérifiez les permissions de la table

### Erreur de Types

Si vous avez des erreurs TypeScript :

1. Vérifiez que `@supabase/supabase-js` est installé
2. Redémarrez votre serveur de développement
3. Vérifiez que tous les fichiers sont correctement importés

## 📊 Données de Démonstration

La migration crée automatiquement 10 patients de démonstration avec des données variées :
- Différents services (Médecine générale, Maternité, Pédiatrie)
- Différents statuts (Nouveau, Connu)
- Différentes couvertures santé (RAMU, CNSS, Gratuité, Aucun)
- Différents groupes sanguins

## 🔐 Sécurité

Par défaut, la table est accessible publiquement. Pour la production :

1. Activez RLS (Row Level Security)
2. Créez des politiques d'accès appropriées
3. Utilisez l'authentification Supabase si nécessaire
4. Limitez les permissions selon les rôles utilisateur

## 📱 Test de l'Application

1. Démarrez votre application : `npm start`
2. Allez sur la page de gestion des patients
3. Testez les fonctionnalités :
   - Ajouter un nouveau patient
   - Modifier un patient existant
   - Rechercher des patients
   - Filtrer par service/statut
   - Supprimer un patient

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs de la console du navigateur
2. Vérifiez les logs de Supabase dans **Logs**
3. Vérifiez que tous les composants sont correctement importés
4. Vérifiez la configuration de votre projet Supabase

---

**Note** : Cette configuration utilise la clé anonyme de Supabase, qui est sécurisée pour un usage public. Pour des applications nécessitant une authentification, configurez l'authentification Supabase et utilisez des politiques RLS appropriées.

# Configuration du Profil Utilisateur

## Vue d'ensemble

Le module de profil utilisateur intelligent a été implémenté avec les fonctionnalités suivantes :

1. **Mon Profil Modal** : Affichage des informations utilisateur avec 3 onglets (Activités, Connexions, Notifications)
2. **Paramètres Utilisateur** : Gestion des informations personnelles, photo de profil et langue
3. **Envoi d'email automatique** : Lors de l'approbation d'une demande d'inscription
4. **Suivi d'activité** : Tables pour logger les connexions et activités utilisateur

## Migrations Supabase à appliquer

### 1. Tables d'activité utilisateur

```bash
# Appliquer la migration
supabase migration up add_user_activity_tracking
```

Cette migration crée :
- `user_login_history` : Historique des connexions
- `user_activity_logs` : Logs des activités utilisateur
- Fonctions RPC : `log_user_login()` et `log_user_activity()`

### 2. Colonnes de paramètres utilisateur

```bash
# Appliquer la migration
supabase migration up add_user_settings_columns
```

Cette migration ajoute :
- `users.language` : Langue préférée (défaut: 'fr')
- `users.avatar_url` : URL de la photo de profil

## Configuration du bucket Supabase Storage

### Créer le bucket "avatars"

1. Aller dans le dashboard Supabase : **Storage** > **Buckets**
2. Cliquer sur **New bucket**
3. Nom : `avatars`
4. Public bucket : **Oui** (pour permettre l'accès aux images)
5. File size limit : 5 MB
6. Allowed MIME types : `image/*`

### Configurer les politiques RLS pour le bucket

Dans le dashboard Supabase, aller dans **Storage** > **Policies** pour le bucket `avatars` :

**Politique 1 : Lecture publique**
```sql
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

**Politique 2 : Upload par utilisateur authentifié**
```sql
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Politique 3 : Suppression par utilisateur authentifié**
```sql
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Utilisation

### Accéder au profil

1. Cliquer sur l'avatar dans le header
2. Sélectionner **"Mon Profil"**
3. La modal s'ouvre avec les 3 onglets :
   - **Activités** : Statistiques d'utilisation, graphiques
   - **Connexions** : Historique des connexions
   - **Notifications** : Historique des notifications

### Accéder aux paramètres

1. Cliquer sur l'avatar dans le header
2. Sélectionner **"Paramètres"**
3. Modifier :
   - Photo de profil (upload/suppression)
   - Langue de l'interface (FR/EN)
   - Informations personnelles (téléphone, adresse)

## Logging des activités

Pour logger automatiquement les activités utilisateur, utiliser :

```typescript
import { UserActivityService } from '../services/userActivityService';

// Logger une activité
await UserActivityService.logActivity({
  userId: user.id,
  clinicId: clinicId,
  action: 'create_patient',
  module: 'patients',
  entityType: 'patient',
  entityId: patientId,
  details: { /* données supplémentaires */ }
});

// Logger une connexion
await UserActivityService.logLogin({
  userId: user.id,
  clinicId: clinicId,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  deviceInfo: { /* infos appareil */ }
});
```

## Envoi d'email automatique

Lors de l'approbation d'une demande d'inscription, un email est automatiquement envoyé avec :
- Les identifiants de connexion
- Le code clinique
- Le mot de passe temporaire
- Les instructions de première connexion

**Configuration requise** : Variables d'environnement SMTP dans `server/config.env` :
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@logiclinic.org
```

## Notes importantes

1. **Bucket Storage** : Le bucket `avatars` doit être créé manuellement dans le dashboard Supabase
2. **Migrations** : Les migrations doivent être appliquées avant d'utiliser les fonctionnalités
3. **RLS Policies** : Les politiques RLS sont automatiquement créées par les migrations
4. **Langue** : La langue est stockée en base de données, avec fallback sur localStorage si la colonne n'existe pas encore

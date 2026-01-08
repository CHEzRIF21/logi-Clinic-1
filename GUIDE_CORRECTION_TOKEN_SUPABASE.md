# 🔑 Guide : Corriger l'Erreur de Token Supabase

## ❌ Erreur

```
Access token not provided. Supply an access token by running supabase login 
or setting the SUPABASE_ACCESS_TOKEN environment variable.
```

## ✅ Solutions

### Solution 1 : Se Connecter avec `supabase login` (Recommandé)

Cette méthode est la plus simple et la plus sécurisée.

```powershell
# 1. Se connecter à Supabase
npx supabase login

# 2. Suivez les instructions :
#    - Une fenêtre de navigateur s'ouvrira
#    - Connectez-vous à votre compte Supabase
#    - Autorisez l'accès
#    - Le token sera automatiquement sauvegardé

# 3. Vérifier la connexion
npx supabase projects list
```

**Avantages :**
- ✅ Token sauvegardé automatiquement
- ✅ Pas besoin de le gérer manuellement
- ✅ Plus sécurisé

---

### Solution 2 : Définir la Variable d'Environnement (Alternative)

Si vous préférez gérer le token manuellement :

#### Étape 1 : Obtenir votre Token Supabase

1. Allez sur : https://supabase.com/dashboard/account/tokens
2. Cliquez sur **"Generate new token"**
3. Donnez un nom : "Logi Clinic Deployment"
4. **Copiez le token** (vous ne pourrez plus le voir après)

#### Étape 2 : Définir la Variable d'Environnement

**Option A : Pour la Session Actuelle (Temporaire)**

```powershell
# Définir le token pour cette session PowerShell uniquement
$env:SUPABASE_ACCESS_TOKEN='votre_token_ici'

# Vérifier
echo $env:SUPABASE_ACCESS_TOKEN
```

**Option B : Permanent (Recommandé pour le Développement)**

```powershell
# Ajouter au profil PowerShell (permanent)
# 1. Ouvrir le profil
notepad $PROFILE

# 2. Ajouter cette ligne (remplacez YOUR_TOKEN par votre token)
$env:SUPABASE_ACCESS_TOKEN='votre_token_ici'

# 3. Sauvegarder et fermer
# 4. Recharger le profil
. $PROFILE
```

**Option C : Via le Fichier .env (Pour les Scripts)**

Créez un fichier `.env` à la racine du projet :

```powershell
# Créer le fichier .env
@"
SUPABASE_ACCESS_TOKEN=votre_token_ici
"@ | Out-File -FilePath .env -Encoding utf8
```

Puis dans vos scripts PowerShell, chargez-le :

```powershell
# Charger les variables d'environnement depuis .env
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}
```

---

## 🔍 Vérification

Après avoir configuré le token, vérifiez que tout fonctionne :

```powershell
# Vérifier la connexion
npx supabase projects list

# Ou lier le projet (si pas déjà fait)
npx supabase link --project-ref bnfgemmlokvetmohiqch
```

**Résultat attendu :**
```
✅ Linked to project bnfgemmlokvetmohiqch
```

---

## 🚀 Commandes Utiles Après Configuration

Une fois le token configuré, vous pouvez :

```powershell
# Lier le projet
npx supabase link --project-ref bnfgemmlokvetmohiqch

# Déployer une Edge Function
npx supabase functions deploy bootstrap-clinic-admin-auth

# Appliquer les migrations
npx supabase db push

# Voir les logs
npx supabase functions logs bootstrap-clinic-admin-auth
```

---

## ⚠️ Sécurité

**IMPORTANT :**
- ❌ Ne commitez JAMAIS votre token dans Git
- ✅ Ajoutez `.env` à `.gitignore`
- ✅ Utilisez des tokens avec des permissions limitées
- ✅ Régénérez le token si vous pensez qu'il a été compromis

**Fichier `.gitignore` :**
```
.env
.env.local
*.env
```

---

## 🐛 Dépannage

### Erreur : "Invalid token"

**Solution :**
1. Vérifiez que le token est correct (copié en entier)
2. Régénérez un nouveau token sur https://supabase.com/dashboard/account/tokens
3. Mettez à jour la variable d'environnement

### Erreur : "Token expired"

**Solution :**
1. Les tokens Supabase n'expirent pas normalement
2. Si vous avez régénéré le token, mettez à jour la variable
3. Utilisez `supabase login` pour éviter ce problème

### Le token ne persiste pas après fermeture de PowerShell

**Solution :**
- Utilisez `supabase login` (recommandé)
- Ou ajoutez le token au profil PowerShell (`$PROFILE`)

---

## 📝 Résumé Rapide

**Méthode la plus simple :**
```powershell
npx supabase login
```

**Méthode manuelle :**
```powershell
$env:SUPABASE_ACCESS_TOKEN='votre_token'
```

**Vérification :**
```powershell
npx supabase projects list
```

---

**🎉 Une fois configuré, vous pourrez utiliser toutes les commandes Supabase CLI !**









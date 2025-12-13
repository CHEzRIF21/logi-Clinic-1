# 🔧 Correction des Erreurs PowerShell

## ❌ Problèmes Identifiés

### 1. Erreur : "Missing file specification after redirection operator"
**Cause** : Utilisation de `<<<` qui n'existe pas en PowerShell (syntaxe bash)

**Solution** : Utiliser le pipe `|` au lieu de `<<<`

### 2. Erreur : "Cannot find path '...\server\server'"
**Cause** : Tentative de faire `cd server` alors qu'on est déjà dans le dossier server

**Solution** : Vérifier le répertoire actuel avant de changer de dossier

## ✅ Corrections Appliquées

### Script `verify-migration.ps1` ✅

**Avant (incorrect)** :
```powershell
npx prisma db execute --stdin <<< $query
```

**Après (correct)** :
```powershell
$query | npx prisma db execute --stdin
```

### Documentation ✅

Toutes les commandes dans la documentation ont été corrigées pour utiliser la syntaxe PowerShell correcte.

## 📋 Commandes Corrigées

### Vérifier l'état des migrations
```powershell
# Depuis la racine du projet
cd server
npx prisma migrate status
```

### Générer le client Prisma
```powershell
# Depuis le dossier server
npx prisma generate
```

### Tester la connexion à la base de données
```powershell
# Depuis le dossier server
"SELECT COUNT(*) FROM `"User`";" | npx prisma db execute --stdin
```

### Utiliser le script de vérification
```powershell
# Depuis la racine du projet
cd server
.\verify-migration.ps1
```

## 🚀 Utilisation Correcte

### Option 1 : Depuis la racine du projet
```powershell
# Vous êtes dans : C:\Users\Mustafa\Desktop\logi Clinic 1
cd server
.\verify-migration.ps1
```

### Option 2 : Depuis le dossier server
```powershell
# Vous êtes déjà dans : C:\Users\Mustafa\Desktop\logi Clinic 1\server
.\verify-migration.ps1
```

### Option 3 : Commandes manuelles
```powershell
# Vérifier où vous êtes
pwd

# Si vous êtes à la racine, allez dans server
cd server

# Vérifier l'état des migrations
npx prisma migrate status

# Générer le client
npx prisma generate

# Tester la connexion (syntaxe PowerShell correcte)
"SELECT COUNT(*) FROM `"User`";" | npx prisma db execute --stdin
```

## ⚠️ Notes Importantes

1. **Syntaxe PowerShell** : Utilisez toujours `|` (pipe) au lieu de `<<<` pour rediriger vers stdin
2. **Répertoire actuel** : Vérifiez toujours où vous êtes avec `pwd` avant de faire `cd`
3. **Chemins relatifs** : Les scripts PowerShell utilisent des chemins relatifs, assurez-vous d'être dans le bon répertoire

## 🔍 Vérification

Pour vérifier que tout fonctionne :

```powershell
# 1. Vérifier où vous êtes
pwd

# 2. Aller dans server si nécessaire
if (-not (Test-Path "prisma")) {
    cd server
}

# 3. Vérifier que vous êtes dans le bon dossier
if (Test-Path "prisma\schema.prisma") {
    Write-Host "✅ Vous êtes dans le bon dossier" -ForegroundColor Green
} else {
    Write-Host "❌ Vous n'êtes pas dans le dossier server" -ForegroundColor Red
    Write-Host "Exécutez: cd server" -ForegroundColor Yellow
}
```

## ✅ Résumé

- ✅ Script `verify-migration.ps1` corrigé
- ✅ Documentation mise à jour
- ✅ Syntaxe PowerShell correcte partout
- ✅ Plus d'erreurs de redirection

Tous les scripts et commandes sont maintenant compatibles avec PowerShell sur Windows !


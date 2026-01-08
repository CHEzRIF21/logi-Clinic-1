# Script de vérification du build local
# Utilisation : .\verifier-build.ps1

Write-Host "🔍 Vérification de la configuration du build..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur : package.json non trouvé. Exécutez ce script depuis la racine du projet." -ForegroundColor Red
    exit 1
}

Write-Host "✅ package.json trouvé" -ForegroundColor Green

# Vérifier vercel.json
if (Test-Path "vercel.json") {
    Write-Host "✅ vercel.json trouvé" -ForegroundColor Green
} else {
    Write-Host "⚠️  vercel.json non trouvé" -ForegroundColor Yellow
}

# Vérifier vite.config.ts
if (Test-Path "vite.config.ts") {
    Write-Host "✅ vite.config.ts trouvé" -ForegroundColor Green
} else {
    Write-Host "⚠️  vite.config.ts non trouvé" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Vérification des dépendances..." -ForegroundColor Cyan

# Vérifier node_modules
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules trouvé" -ForegroundColor Green
} else {
    Write-Host "⚠️  node_modules non trouvé. Exécutez 'npm install' d'abord." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🏗️  Test du build..." -ForegroundColor Cyan
Write-Host ""

# Exécuter le build
$buildResult = npm run build 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Build réussi !" -ForegroundColor Green
    
    # Vérifier que le dossier build existe
    if (Test-Path "build") {
        Write-Host "✅ Dossier build/ créé" -ForegroundColor Green
        
        # Compter les fichiers dans build
        $fileCount = (Get-ChildItem -Path "build" -Recurse -File | Measure-Object).Count
        Write-Host "✅ $fileCount fichiers générés dans build/" -ForegroundColor Green
    } else {
        Write-Host "❌ Dossier build/ non trouvé après le build" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors du build" -ForegroundColor Red
    Write-Host $buildResult
    exit 1
}

Write-Host ""
Write-Host "✅ Vérification terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "1. Configurer les variables d'environnement sur Vercel"
Write-Host "2. Ajouter le domaine logiclinic.org"
Write-Host "3. Déployer sur Vercel"
Write-Host ""
Write-Host "📚 Voir REINITIALISATION_VERCEL_COMPLETE.md pour le guide complet" -ForegroundColor Yellow







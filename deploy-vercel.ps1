# Script de déploiement Vercel pour Logi Clinic
# Ce script vérifie que tout est prêt et déploie sur Vercel

Write-Host "🚀 Déploiement Vercel - Logi Clinic" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "vercel.json")) {
    Write-Host "❌ Erreur: vercel.json introuvable. Assurez-vous d'être dans le répertoire racine du projet." -ForegroundColor Red
    exit 1
}

# Vérifier que le build est à jour
Write-Host "📦 Vérification du build..." -ForegroundColor Yellow
if (-not (Test-Path "build/index.html")) {
    Write-Host "⚠️  Le dossier build n'existe pas. Construction du projet..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du build. Corrigez les erreurs avant de déployer." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Build trouvé" -ForegroundColor Green
}

# Vérifier que Vercel CLI est installé
Write-Host ""
Write-Host "🔍 Vérification de Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI n'est pas installé. Installation..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation de Vercel CLI." -ForegroundColor Red
        exit 1
    }
}

# Vérifier que le projet est lié à Vercel
Write-Host ""
Write-Host "🔗 Vérification de la liaison Vercel..." -ForegroundColor Yellow
if (-not (Test-Path ".vercel/project.json")) {
    Write-Host "⚠️  Le projet n'est pas lié à Vercel. Liaison..." -ForegroundColor Yellow
    Write-Host "   Suivez les instructions pour lier votre projet." -ForegroundColor Cyan
    vercel link
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la liaison. Vérifiez votre connexion Vercel." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Projet lié à Vercel" -ForegroundColor Green
}

# Déployer sur Vercel
Write-Host ""
Write-Host "🚀 Déploiement sur Vercel..." -ForegroundColor Cyan
Write-Host "   Cela peut prendre quelques minutes..." -ForegroundColor Gray

# Option 1: Déploiement en production (avec confirmation)
Write-Host ""
$deployProd = Read-Host "Voulez-vous déployer en production? (O/N)"
if ($deployProd -eq "O" -or $deployProd -eq "o") {
    vercel --prod
} else {
    # Déploiement en preview
    vercel
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Déploiement réussi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "   1. Vérifiez votre application sur https://logiclinic.org" -ForegroundColor White
    Write-Host "   2. Vérifiez que le champ 'Code Clinique' est visible sur la page d'inscription" -ForegroundColor White
    Write-Host "   3. Si le problème persiste, videz le cache du navigateur (Ctrl+Shift+R)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors du déploiement. Vérifiez les logs ci-dessus." -ForegroundColor Red
    exit 1
}



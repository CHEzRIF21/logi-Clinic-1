# Script de déploiement de l'Edge Function API
# Usage: .\deploy-edge-function.ps1

Write-Host "🚀 Déploiement de l'Edge Function API" -ForegroundColor Cyan
Write-Host ""

# Vérifier si SUPABASE_ACCESS_TOKEN est défini
if (-not $env:SUPABASE_ACCESS_TOKEN) {
    Write-Host "⚠️  SUPABASE_ACCESS_TOKEN n'est pas défini" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour obtenir ton access token :" -ForegroundColor White
    Write-Host "1. Va sur https://supabase.com/dashboard/account/tokens" -ForegroundColor White
    Write-Host "2. Crée un nouveau token ou copie un existant" -ForegroundColor White
    Write-Host ""
    $token = Read-Host "Colle ton access token ici"
    
    if ($token) {
        $env:SUPABASE_ACCESS_TOKEN = $token
        Write-Host "✅ Token défini pour cette session" -ForegroundColor Green
    } else {
        Write-Host "❌ Token requis pour continuer" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ SUPABASE_ACCESS_TOKEN trouvé" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Déploiement via npx..." -ForegroundColor Cyan

# Se connecter avec le token
Write-Host "🔐 Authentification..." -ForegroundColor Yellow
npx supabase login --token $env:SUPABASE_ACCESS_TOKEN

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'authentification" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Déploiement de la fonction 'api'..." -ForegroundColor Yellow
npx supabase functions deploy api --project-ref bnfgemmlokvetmohiqch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Déploiement réussi !" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
    Write-Host "1. Teste une nouvelle inscription avec un code clinique valide" -ForegroundColor White
    Write-Host "2. Vérifie que la demande apparaît dans 'Demandes d'inscription'" -ForegroundColor White
    Write-Host "3. Consulte les logs sur https://supabase.com/dashboard/project/bnfgemmlokvetmohiqch/logs/edge-functions" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors du déploiement" -ForegroundColor Red
    Write-Host "Vérifie les erreurs ci-dessus" -ForegroundColor Yellow
    exit 1
}

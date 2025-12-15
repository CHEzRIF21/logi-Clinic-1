# Script de déploiement Supabase Edge Functions
# Usage: .\deploy-supabase.ps1

Write-Host "🚀 Déploiement des Supabase Edge Functions" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Supabase CLI est disponible
Write-Host "📦 Vérification de Supabase CLI..." -ForegroundColor Yellow
$supabaseVersion = npx supabase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Supabase CLI non trouvé. Installation..." -ForegroundColor Red
    npm install supabase --save-dev
}

Write-Host "✅ Supabase CLI disponible: $supabaseVersion" -ForegroundColor Green
Write-Host ""

# Instructions pour obtenir le token
Write-Host "🔑 Pour déployer, vous devez d'abord vous authentifier:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Allez sur: https://supabase.com/dashboard/account/tokens" -ForegroundColor White
Write-Host "2. Créez un nouveau token (ou utilisez un token existant)" -ForegroundColor White
Write-Host "3. Exécutez cette commande avec votre token:" -ForegroundColor White
Write-Host ""
Write-Host "   `$env:SUPABASE_ACCESS_TOKEN='votre-token-ici'" -ForegroundColor Cyan
Write-Host "   npx supabase link --project-ref bnfgemmlokvetmohiqch" -ForegroundColor Cyan
Write-Host "   npx supabase functions deploy api" -ForegroundColor Cyan
Write-Host ""

# Demander si l'utilisateur veut continuer
$continue = Read-Host "Avez-vous déjà un token Supabase ? (o/n)"
if ($continue -eq "o" -or $continue -eq "O") {
    $token = Read-Host "Entrez votre token Supabase (ou appuyez sur Entrée pour utiliser SUPABASE_ACCESS_TOKEN)"
    
    if ($token) {
        $env:SUPABASE_ACCESS_TOKEN = $token
    }
    
    if ($env:SUPABASE_ACCESS_TOKEN) {
        Write-Host ""
        Write-Host "🔗 Liaison du projet..." -ForegroundColor Yellow
        npx supabase link --project-ref bnfgemmlokvetmohiqch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "📤 Déploiement des fonctions..." -ForegroundColor Yellow
            npx supabase functions deploy api
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✅ Déploiement réussi !" -ForegroundColor Green
                Write-Host ""
                Write-Host "🌐 Votre API est disponible à:" -ForegroundColor Cyan
                Write-Host "   https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/api" -ForegroundColor White
                Write-Host ""
                Write-Host "📝 N'oubliez pas de configurer les secrets sur Supabase Dashboard:" -ForegroundColor Yellow
                Write-Host "   - SUPABASE_URL" -ForegroundColor White
                Write-Host "   - SUPABASE_ANON_KEY" -ForegroundColor White
            } else {
                Write-Host "❌ Erreur lors du déploiement" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Erreur lors de la liaison du projet" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️ Token non fourni. Veuillez configurer SUPABASE_ACCESS_TOKEN" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "📖 Instructions complètes dans: DEPLOIEMENT_SUPABASE_EDGE_FUNCTIONS.md" -ForegroundColor Cyan
}

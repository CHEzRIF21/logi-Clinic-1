# Script pour vérifier que bootstrap-clinic-admin-auth est bien déployée
# Usage: .\verify-deployment.ps1

Write-Host "🔍 Vérification du déploiement..." -ForegroundColor Cyan
Write-Host ""

$functionUrl = "https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/bootstrap-clinic-admin-auth"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8"

try {
    # Tester la fonction sans authentification (devrait retourner 401)
    Write-Host "📤 Test de la fonction (sans authentification)..." -ForegroundColor Yellow
    
    $response = Invoke-WebRequest -Uri $functionUrl `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "apikey" = $supabaseAnonKey
        } `
        -Body '{}' `
        -ErrorAction Stop
    
    Write-Host "⚠️  Réponse inattendue (code: $($response.StatusCode))" -ForegroundColor Yellow
    
} catch [Microsoft.PowerShell.Commands.HttpResponseException] {
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode -eq 401) {
        Write-Host "✅ Fonction déployée avec succès !" -ForegroundColor Green
        Write-Host "   Code HTTP: 401 (Unauthorized) - C'est normal, la fonction demande une authentification" -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 Votre fonction est prête à être utilisée !" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Prochaine étape :" -ForegroundColor Cyan
        Write-Host "   Exécutez: .\test-bootstrap.ps1" -ForegroundColor White
    } elseif ($statusCode -eq 404) {
        Write-Host "❌ Fonction non trouvée (404)" -ForegroundColor Red
        Write-Host "   La fonction n'est peut-être pas encore déployée." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💡 Solution :" -ForegroundColor Yellow
        Write-Host "   npx supabase functions deploy bootstrap-clinic-admin-auth" -ForegroundColor White
    } else {
        Write-Host "⚠️  Code HTTP: $statusCode" -ForegroundColor Yellow
        Write-Host "   Message: $($_.ErrorDetails.Message)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Erreur lors de la vérification" -ForegroundColor Red
    Write-Host "   Message: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""






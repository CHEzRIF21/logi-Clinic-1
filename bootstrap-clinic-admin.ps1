# Script PowerShell pour appeler bootstrap-clinic-admin-auth
# Usage: .\bootstrap-clinic-admin.ps1

param(
    [string]$SuperAdminToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6InJ1SlJDM3F4MlpPbzlIelUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2JuZmdlbW1sb2t2ZXRtb2hpcWNoLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2NGZmOWEwNi1iYjRjLTQzOWYtODQxZi1hMDYyNzgyNTEzNzUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY2NTIzNDk0LCJpYXQiOjE3NjY1MTk4OTQsImVtYWlsIjoiYmFib2NoZXIyMUBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2NjUxOTg5NH1dLCJzZXNzaW9uX2lkIjoiOTljZTM0YTEtZDE1NC00MTgyLWE1MjUtOGVlZGM3MDE0OTc3IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.qR36166VxIpzNr8RKArcMvrbg98njxFjbKb_IKTow8o",
    [string]$ClinicCode = "CAMPUS-001",
    [string]$AdminEmail = "bagarayannick1@gmail.com",
    [string]$AdminPassword = "TempClinic2024!" 
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Bootstrap Clinic Admin Auth" -ForegroundColor Cyan
Write-Host ""

# Configuration
$supabaseUrl = "https://bnfgemmlokvetmohiqch.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8"
$functionUrl = "$supabaseUrl/functions/v1/bootstrap-clinic-admin-auth"

# Vérifier le token SUPER_ADMIN
if ([string]::IsNullOrWhiteSpace($SuperAdminToken)) {
    Write-Host "⚠️  Token SUPER_ADMIN non fourni" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour obtenir le token :" -ForegroundColor White
    Write-Host "1. Connectez-vous à l'application avec babocher21@gmail.com" -ForegroundColor White
    Write-Host "2. Ouvrez la console du navigateur (F12)" -ForegroundColor White
    Write-Host "3. Exécutez : const { data: { session } } = await supabase.auth.getSession(); console.log(session?.access_token);" -ForegroundColor White
    Write-Host ""
    $SuperAdminToken = Read-Host "Entrez le token SUPER_ADMIN (ou appuyez sur Entrée pour quitter)"
    
    if ([string]::IsNullOrWhiteSpace($SuperAdminToken)) {
        Write-Host "❌ Token requis. Arrêt du script." -ForegroundColor Red
        exit 1
    }
}

Write-Host "📋 Paramètres :" -ForegroundColor Yellow
Write-Host "   Clinic Code: $ClinicCode" -ForegroundColor White
Write-Host "   Admin Email: $AdminEmail" -ForegroundColor White
Write-Host "   Admin Password: $AdminPassword" -ForegroundColor White
Write-Host ""

# Préparer le body
$body = @{
    clinicCode = $ClinicCode
    adminEmail = $AdminEmail
    adminPassword = $AdminPassword
} | ConvertTo-Json

Write-Host "📤 Appel de la fonction..." -ForegroundColor Yellow

try {
    # Utiliser Invoke-RestMethod avec gestion d'erreur personnalisée
    $response = $null
    
    try {
        $response = Invoke-RestMethod -Uri $functionUrl `
            -Method Post `
            -Headers @{
                "Authorization" = "Bearer $SuperAdminToken"
                "Content-Type" = "application/json"
                "apikey" = $supabaseAnonKey
            } `
            -Body $body `
            -ErrorAction Stop
    } catch [Microsoft.PowerShell.Commands.HttpResponseException] {
        # Pour PowerShell Core, lire le contenu de l'erreur
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorContent = $_.ErrorDetails.Message
        
        if ($errorContent) {
            try {
                $errorJson = $errorContent | ConvertFrom-Json
                Write-Host ""
                Write-Host "❌ Erreur HTTP $statusCode" -ForegroundColor Red
                Write-Host "Erreur: $($errorJson.error)" -ForegroundColor Red
                if ($errorJson.details) {
                    Write-Host "Détails: $($errorJson.details)" -ForegroundColor Red
                }
                if ($errorJson.recoveryLink) {
                    Write-Host ""
                    Write-Host "🔗 Recovery Link: $($errorJson.recoveryLink)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host ""
                Write-Host "❌ Erreur HTTP $statusCode" -ForegroundColor Red
                Write-Host "Réponse: $errorContent" -ForegroundColor Red
            }
        } else {
            Write-Host ""
            Write-Host "❌ Erreur HTTP $statusCode" -ForegroundColor Red
            Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "💡 Vérifiez :" -ForegroundColor Yellow
        Write-Host "   - Le token SUPER_ADMIN est valide" -ForegroundColor White
        Write-Host "   - L'utilisateur existe dans public.users pour cette clinique" -ForegroundColor White
        Write-Host "   - La clinique CAMPUS-001 existe et est active" -ForegroundColor White
        Write-Host "   - La fonction est déployée" -ForegroundColor White
        
        exit 1
    }

    # Si on arrive ici, la requête a réussi
    Write-Host ""
    Write-Host "✅ Succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "📄 Réponse :" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($response.success) {
        Write-Host ""
        Write-Host "✅ Utilisateur créé/linké avec succès !" -ForegroundColor Green
        Write-Host "   Email: $($response.user.email)" -ForegroundColor White
        Write-Host "   Auth User ID: $($response.user.auth_user_id)" -ForegroundColor White
        Write-Host "   Clinic: $($response.clinic.code) - $($response.clinic.name)" -ForegroundColor White
        
        if ($response.recoveryLink) {
            Write-Host ""
            Write-Host "🔗 Recovery Link (si nécessaire) :" -ForegroundColor Yellow
            Write-Host "   $($response.recoveryLink)" -ForegroundColor White
        }
    } else {
        Write-Host ""
        Write-Host "⚠️  Attention : $($response.error)" -ForegroundColor Yellow
        if ($response.recoveryLink) {
            Write-Host ""
            Write-Host "🔗 Recovery Link :" -ForegroundColor Yellow
            Write-Host "   $($response.recoveryLink)" -ForegroundColor White
        }
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Erreur inattendue" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Vérifiez :" -ForegroundColor Yellow
    Write-Host "   - La connexion Internet" -ForegroundColor White
    Write-Host "   - L'URL de la fonction est correcte" -ForegroundColor White
    Write-Host "   - La fonction est déployée" -ForegroundColor White
    
    exit 1
}

Write-Host ""
Write-Host "🎉 Terminé !" -ForegroundColor Green


# Script PowerShell pour créer l'utilisateur Auth pour admin@test.bj
# Usage: .\create_clinic_admin_auth.ps1

param(
    [string]$SuperAdminToken = "",
    [string]$ClinicCode = "CLIN-2025-001",
    [string]$AdminEmail = "admin@test.bj",
    [string]$AdminPassword = ""
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Création de l'utilisateur Auth pour la clinique" -ForegroundColor Cyan
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

Write-Host "📤 Appel de la fonction bootstrap-clinic-admin-auth..." -ForegroundColor Yellow

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

    Write-Host ""
    Write-Host "✅ Succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "📄 Réponse :" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($response.success) {
        Write-Host ""
        Write-Host "✅ Utilisateur Auth créé/linké avec succès !" -ForegroundColor Green
        Write-Host "   Email: $($response.user.email)" -ForegroundColor White
        Write-Host "   Auth User ID: $($response.user.auth_user_id)" -ForegroundColor White
        Write-Host "   Clinic: $($response.clinic.code) - $($response.clinic.name)" -ForegroundColor White
        
        if ($response.recoveryLink) {
            Write-Host ""
            Write-Host "🔗 Recovery Link (si nécessaire) :" -ForegroundColor Yellow
            Write-Host "   $($response.recoveryLink)" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "🎉 Vous pouvez maintenant vous connecter avec:" -ForegroundColor Green
        Write-Host "   - Code clinique: $ClinicCode" -ForegroundColor White
        Write-Host "   - Email: $AdminEmail" -ForegroundColor White
        Write-Host "   - Mot de passe: $AdminPassword" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "⚠️  Attention : $($response.error)" -ForegroundColor Yellow
        if ($response.recoveryLink) {
            Write-Host ""
            Write-Host "🔗 Recovery Link :" -ForegroundColor Yellow
            Write-Host "   $($response.recoveryLink)" -ForegroundColor White
        }
    }
    
} catch [Microsoft.PowerShell.Commands.HttpResponseException] {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorContent = $_.ErrorDetails.Message
    
    Write-Host ""
    Write-Host "❌ Erreur HTTP $statusCode" -ForegroundColor Red
    
    if ($errorContent) {
        try {
            $errorJson = $errorContent | ConvertFrom-Json
            Write-Host "Erreur: $($errorJson.error)" -ForegroundColor Red
            if ($errorJson.details) {
                Write-Host "Détails: $($errorJson.details)" -ForegroundColor Red
            }
        } catch {
            Write-Host "Réponse: $errorContent" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "💡 Vérifiez :" -ForegroundColor Yellow
    Write-Host "   - Le token SUPER_ADMIN est valide" -ForegroundColor White
    Write-Host "   - L'utilisateur existe dans public.users pour cette clinique" -ForegroundColor White
    Write-Host "   - La clinique $ClinicCode existe et est active" -ForegroundColor White
    Write-Host "   - La fonction bootstrap-clinic-admin-auth est déployée" -ForegroundColor White
    
    exit 1
} catch {
    Write-Host ""
    Write-Host "❌ Erreur inattendue" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Terminé !" -ForegroundColor Green



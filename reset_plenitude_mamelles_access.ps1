# ============================================
# SCRIPT DE RÉINITIALISATION ACCÈS PLENITUDE-001 ET MAMELLES-001
# ============================================
# Ce script réinitialise les mots de passe temporaires pour :
# - PLENITUDE-001 : 2 admins (laplenitude.hc@yahoo.com, hakpovi95@yahoo.fr)
# - MAMELLES-001 : 1 admin (dieudange@gmail.com)
# ============================================

Write-Host ""
Write-Host "🔄 RÉINITIALISATION ACCÈS PLENITUDE-001 ET MAMELLES-001" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$supabaseUrl = "https://bnfgemmlokvetmohiqch.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8"

# Mots de passe temporaires sécurisés
$plenitudeAdmin1Email = "laplenitude.hc@yahoo.com"
$plenitudeAdmin1Password = "TempPlenitude2026!"

$plenitudeAdmin2Email = "hakpovi95@yahoo.fr"
$plenitudeAdmin2Password = "TempHakpovi2026!"

$mamellesAdminEmail = "dieudange@gmail.com"
$mamellesAdminPassword = "TempMamelles2026!"

# ============================================
# ÉTAPE 1 : Obtenir le Token SUPER_ADMIN
# ============================================

Write-Host "📋 ÉTAPE 1 : Obtenir le Token SUPER_ADMIN" -ForegroundColor Yellow
Write-Host ""
Write-Host "SUPER_ADMINs disponibles:" -ForegroundColor Gray
Write-Host "  1. babocher21@gmail.com" -ForegroundColor Gray
Write-Host "  2. arafathimorou@gmail.com" -ForegroundColor Gray
Write-Host ""

$superAdminEmail = Read-Host "Entrez l'email du SUPER_ADMIN"
$superAdminEmail = $superAdminEmail.Trim()  # Supprimer les espaces
$superAdminPassword = Read-Host "Entrez le mot de passe du SUPER_ADMIN" -AsSecureString
$superAdminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($superAdminPassword)
)

Write-Host "Connexion en cours avec $superAdminEmail..." -ForegroundColor Gray

try {
    $loginBody = @{
        email = $superAdminEmail
        password = $superAdminPasswordPlain
    } | ConvertTo-Json

    Write-Host "DEBUG: Tentative de connexion à $supabaseUrl/auth/v1/token" -ForegroundColor DarkGray

    $loginResponse = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=password" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "apikey" = $supabaseAnonKey
        } `
        -Body $loginBody `
        -ErrorAction Stop

    $superAdminToken = $loginResponse.access_token
    Write-Host "✅ Token SUPER_ADMIN obtenu avec succès" -ForegroundColor Green
    Write-Host ""
} catch {
    $isHttpError = $false
    $statusCode = $null
    $errorContent = $null
    
    if ($_.Exception.Response) {
        $isHttpError = $true
        try {
            $statusCode = $_.Exception.Response.StatusCode.value__
        } catch {
            try {
                $statusCode = $_.Exception.Response.StatusCode
            } catch {
                $statusCode = "Unknown"
            }
        }
        
        if ($_.ErrorDetails) {
            $errorContent = $_.ErrorDetails.Message
        }
    }
    
    if ($isHttpError -and $statusCode) {
        Write-Host "❌ Erreur HTTP $statusCode lors de la connexion" -ForegroundColor Red
        Write-Host ""
        
        if ($errorContent) {
            try {
                $errorJson = $errorContent | ConvertFrom-Json
                Write-Host "Erreur: $($errorJson.error)" -ForegroundColor Red
                Write-Host "Code: $($errorJson.error_code)" -ForegroundColor Red
                if ($errorJson.message) {
                    Write-Host "Message: $($errorJson.message)" -ForegroundColor Red
                }
                if ($errorJson.msg) {
                    Write-Host "Message: $($errorJson.msg)" -ForegroundColor Red
                }
            } catch {
                Write-Host "Réponse: $errorContent" -ForegroundColor Red
            }
        } else {
            Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "💡 Solutions possibles :" -ForegroundColor Yellow
        Write-Host "   - Vérifiez que l'email est correct (sans espaces)" -ForegroundColor White
        Write-Host "   - Vérifiez le mot de passe du SUPER_ADMIN" -ForegroundColor White
        Write-Host "   - Essayez avec l'autre SUPER_ADMIN (babocher21@gmail.com ou arafathimorou@gmail.com)" -ForegroundColor White
    } else {
        Write-Host "❌ Erreur lors de la connexion : $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Vérifiez votre connexion Internet" -ForegroundColor Yellow
    }
    exit 1
}

# ============================================
# ÉTAPE 2 : Réinitialiser PLENITUDE-001 - Admin 1
# ============================================

Write-Host "📋 ÉTAPE 2 : Réinitialiser PLENITUDE-001 - Admin 1" -ForegroundColor Yellow
Write-Host ""

Write-Host "Configuration :" -ForegroundColor Gray
Write-Host "  - Code clinique : PLENITUDE-001" -ForegroundColor Gray
Write-Host "  - Email admin : $plenitudeAdmin1Email" -ForegroundColor Gray
Write-Host "  - Mot de passe temporaire : $plenitudeAdmin1Password" -ForegroundColor Gray
Write-Host ""

try {
    $body = @{
        clinicCode = "PLENITUDE-001"
        adminEmail = $plenitudeAdmin1Email
        adminPassword = $plenitudeAdmin1Password
    } | ConvertTo-Json

    Write-Host "Appel de bootstrap-clinic-admin-auth..." -ForegroundColor Gray

    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/bootstrap-clinic-admin-auth" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $superAdminToken"
            "Content-Type" = "application/json"
            "apikey" = $supabaseAnonKey
        } `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ Réinitialisation réussie pour $plenitudeAdmin1Email" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Erreur lors de la réinitialisation de $plenitudeAdmin1Email" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Détails: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# ============================================
# ÉTAPE 3 : Réinitialiser PLENITUDE-001 - Admin 2
# ============================================

Write-Host "📋 ÉTAPE 3 : Réinitialiser PLENITUDE-001 - Admin 2" -ForegroundColor Yellow
Write-Host ""

Write-Host "Configuration :" -ForegroundColor Gray
Write-Host "  - Code clinique : PLENITUDE-001" -ForegroundColor Gray
Write-Host "  - Email admin : $plenitudeAdmin2Email" -ForegroundColor Gray
Write-Host "  - Mot de passe temporaire : $plenitudeAdmin2Password" -ForegroundColor Gray
Write-Host ""

try {
    $body = @{
        clinicCode = "PLENITUDE-001"
        adminEmail = $plenitudeAdmin2Email
        adminPassword = $plenitudeAdmin2Password
    } | ConvertTo-Json

    Write-Host "Appel de bootstrap-clinic-admin-auth..." -ForegroundColor Gray

    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/bootstrap-clinic-admin-auth" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $superAdminToken"
            "Content-Type" = "application/json"
            "apikey" = $supabaseAnonKey
        } `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ Réinitialisation réussie pour $plenitudeAdmin2Email" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Erreur lors de la réinitialisation de $plenitudeAdmin2Email" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Détails: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# ============================================
# ÉTAPE 4 : Réinitialiser MAMELLES-001
# ============================================

Write-Host "📋 ÉTAPE 4 : Réinitialiser MAMELLES-001" -ForegroundColor Yellow
Write-Host ""

Write-Host "Configuration :" -ForegroundColor Gray
Write-Host "  - Code clinique : MAMELLES-001" -ForegroundColor Gray
Write-Host "  - Email admin : $mamellesAdminEmail" -ForegroundColor Gray
Write-Host "  - Mot de passe temporaire : $mamellesAdminPassword" -ForegroundColor Gray
Write-Host ""

try {
    $body = @{
        clinicCode = "MAMELLES-001"
        adminEmail = $mamellesAdminEmail
        adminPassword = $mamellesAdminPassword
    } | ConvertTo-Json

    Write-Host "Appel de bootstrap-clinic-admin-auth..." -ForegroundColor Gray

    $response = Invoke-RestMethod -Uri "$supabaseUrl/functions/v1/bootstrap-clinic-admin-auth" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $superAdminToken"
            "Content-Type" = "application/json"
            "apikey" = $supabaseAnonKey
        } `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ Réinitialisation réussie pour $mamellesAdminEmail" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Erreur lors de la réinitialisation de $mamellesAdminEmail" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Détails: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# ============================================
# RÉSUMÉ DES IDENTIFIANTS
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📋 IDENTIFIANTS DE CONNEXION" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🏥 CLINIQUE PLENITUDE-001" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Admin 1 :" -ForegroundColor White
Write-Host "  Code clinique : PLENITUDE-001" -ForegroundColor White
Write-Host "  Email         : $plenitudeAdmin1Email" -ForegroundColor White
Write-Host "  Mot de passe  : $plenitudeAdmin1Password" -ForegroundColor Green
Write-Host ""
Write-Host "Admin 2 :" -ForegroundColor White
Write-Host "  Code clinique : PLENITUDE-001" -ForegroundColor White
Write-Host "  Email         : $plenitudeAdmin2Email" -ForegroundColor White
Write-Host "  Mot de passe  : $plenitudeAdmin2Password" -ForegroundColor Green
Write-Host ""

Write-Host "🏥 CLINIQUE MAMELLES-001" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Admin :" -ForegroundColor White
Write-Host "  Code clinique : MAMELLES-001" -ForegroundColor White
Write-Host "  Email         : $mamellesAdminEmail" -ForegroundColor White
Write-Host "  Mot de passe  : $mamellesAdminPassword" -ForegroundColor Green
Write-Host ""

Write-Host "⚠️  IMPORTANT :" -ForegroundColor Yellow
Write-Host "   - Les admins devront changer leur mot de passe à la première connexion" -ForegroundColor Yellow
Write-Host "   - Le statut est maintenant 'PENDING'" -ForegroundColor Yellow
Write-Host "   - Le dialogue de changement de mot de passe s'affichera automatiquement" -ForegroundColor Yellow
Write-Host "   - Les mots de passe temporaires ne sont utilisables qu'une seule fois" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ Réinitialisation terminée avec succès !" -ForegroundColor Green
Write-Host ""

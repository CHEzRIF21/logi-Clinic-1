# ============================================
# SCRIPT DE RÉINITIALISATION ADMIN CAMPUS-001
# ============================================
# Ce script réinitialise complètement l'admin de CAMPUS-001
# pour permettre une nouvelle première connexion avec code temporaire
# ============================================

Write-Host ""
Write-Host "🔄 RÉINITIALISATION ADMIN CAMPUS-001" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$supabaseUrl = "https://bnfgemmlokvetmohiqch.supabase.co"
$supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8"
$clinicCode = "CAMPUS-001"
$adminEmail = "bagarayannick1@gmail.com"
$tempPassword = "TempCampus2025!"

# ============================================
# ÉTAPE 1 : Obtenir le Token SUPER_ADMIN
# ============================================

Write-Host "📋 ÉTAPE 1 : Obtenir le Token SUPER_ADMIN" -ForegroundColor Yellow
Write-Host ""

$superAdminEmail = Read-Host "Entrez l'email du SUPER_ADMIN (babocher21@gmail.com)"
$superAdminPassword = Read-Host "Entrez le mot de passe du SUPER_ADMIN" -AsSecureString
$superAdminPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($superAdminPassword)
)

Write-Host "Connexion en cours..." -ForegroundColor Gray

try {
    $loginBody = @{
        email = $superAdminEmail
        password = $superAdminPasswordPlain
    } | ConvertTo-Json

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
    # Vérifier si c'est une erreur HTTP
    $isHttpError = $false
    $statusCode = $null
    $errorContent = $null
    
    # Essayer de détecter une erreur HTTP de différentes manières (compatible toutes versions PowerShell)
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
        
        # Essayer de récupérer le message d'erreur
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
                if ($errorJson.message) {
                    Write-Host "Message: $($errorJson.message)" -ForegroundColor Red
                }
            } catch {
                Write-Host "Réponse: $errorContent" -ForegroundColor Red
            }
        } else {
            Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "💡 Vérifiez votre email et mot de passe SUPER_ADMIN" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Erreur lors de la connexion : $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Vérifiez votre connexion Internet" -ForegroundColor Yellow
    }
    exit 1
}

# ============================================
# ÉTAPE 2 : Appeler bootstrap-clinic-admin-auth
# ============================================

Write-Host "📋 ÉTAPE 2 : Créer/Réinitialiser l'utilisateur Auth" -ForegroundColor Yellow
Write-Host ""

Write-Host "Configuration :" -ForegroundColor Gray
Write-Host "  - Code clinique : $clinicCode" -ForegroundColor Gray
Write-Host "  - Email admin : $adminEmail" -ForegroundColor Gray
Write-Host "  - Mot de passe temporaire : $tempPassword" -ForegroundColor Gray
Write-Host ""

try {
    $body = @{
        clinicCode = $clinicCode
        adminEmail = $adminEmail
        adminPassword = $tempPassword
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

    Write-Host ""
    Write-Host "✅ Réinitialisation réussie !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Résultat :" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
    Write-Host ""

    # Afficher les informations de connexion
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host "📋 INFORMATIONS DE CONNEXION" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Code clinique : $clinicCode" -ForegroundColor White
    Write-Host "Email : $adminEmail" -ForegroundColor White
    Write-Host "Mot de passe temporaire : $tempPassword" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  IMPORTANT :" -ForegroundColor Yellow
    Write-Host "   - L'admin devra changer son mot de passe à la première connexion" -ForegroundColor Yellow
    Write-Host "   - Le statut est maintenant 'PENDING'" -ForegroundColor Yellow
    Write-Host "   - Le dialogue de changement de mot de passe s'affichera automatiquement" -ForegroundColor Yellow
    Write-Host ""

} catch {
    # Gestion des erreurs (compatible toutes versions PowerShell)
    $isHttpError = $false
    $statusCode = $null
    $errorContent = $null
    
    # Détecter si c'est une erreur HTTP
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
        
        # Récupérer le message d'erreur
        if ($_.ErrorDetails) {
            $errorContent = $_.ErrorDetails.Message
        }
    }
    
    Write-Host ""
    
    if ($isHttpError -and $statusCode) {
        Write-Host "❌ Erreur HTTP $statusCode lors de l'appel à bootstrap-clinic-admin-auth" -ForegroundColor Red
        Write-Host ""
        
        if ($errorContent) {
            try {
                # Essayer de parser le JSON d'erreur
                $errorJson = $errorContent | ConvertFrom-Json
                Write-Host "Erreur: $($errorJson.error)" -ForegroundColor Red
                if ($errorJson.details) {
                    Write-Host "Détails: $($errorJson.details)" -ForegroundColor Red
                }
                if ($errorJson.recoveryLink) {
                    Write-Host ""
                    Write-Host "🔗 Recovery Link: $($errorJson.recoveryLink)" -ForegroundColor Yellow
                }
            } catch {
                # Si ce n'est pas du JSON, afficher tel quel
                Write-Host "Réponse: $errorContent" -ForegroundColor Red
            }
        } else {
            Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "💡 Solutions possibles :" -ForegroundColor Yellow
        Write-Host "   1. Vérifiez que la migration 'reset_campus001_admin_password' a été appliquée" -ForegroundColor White
        Write-Host "   2. Vérifiez que l'utilisateur Auth a été supprimé" -ForegroundColor White
        Write-Host "   3. Vérifiez que le token SUPER_ADMIN est valide" -ForegroundColor White
        Write-Host "   4. Vérifiez que la fonction bootstrap-clinic-admin-auth est déployée" -ForegroundColor White
        Write-Host "   5. Vérifiez que la clinique CAMPUS-001 existe et est active" -ForegroundColor White
    } else {
        Write-Host "❌ Erreur inattendue lors de l'appel à bootstrap-clinic-admin-auth" -ForegroundColor Red
        Write-Host ""
        Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Vérifiez :" -ForegroundColor Yellow
        Write-Host "   - La connexion Internet" -ForegroundColor White
        Write-Host "   - L'URL de la fonction est correcte" -ForegroundColor White
        Write-Host "   - La fonction est déployée" -ForegroundColor White
    }
    exit 1
}

Write-Host "✅ Réinitialisation terminée avec succès !" -ForegroundColor Green
Write-Host ""


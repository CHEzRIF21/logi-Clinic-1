# ============================================
# SCRIPT DE VÉRIFICATION - reset_campus001_admin.ps1
# ============================================
# Ce script vérifie que reset_campus001_admin.ps1 est correct
# ============================================

Write-Host ""
Write-Host "VERIFICATION DU SCRIPT reset_campus001_admin.ps1" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = "reset_campus001_admin.ps1"
$errors = @()

# 1. Verifier que le fichier existe
Write-Host "1. Verification de l'existence du fichier..." -ForegroundColor Yellow
if (Test-Path $scriptPath) {
    Write-Host "   OK : Fichier trouve : $scriptPath" -ForegroundColor Green
} else {
    Write-Host "   ERREUR : Fichier introuvable : $scriptPath" -ForegroundColor Red
    $errors += "Fichier introuvable"
    exit 1
}

# 2. Verifier qu'il n'y a pas GetResponseStream
Write-Host ""
Write-Host "2. Verification de l'absence de GetResponseStream..." -ForegroundColor Yellow
$content = Get-Content $scriptPath -Raw
if ($content -match "GetResponseStream") {
    Write-Host "   ERREUR : GetResponseStream trouve dans le script !" -ForegroundColor Red
    Write-Host "   Le script doit etre corrige." -ForegroundColor Red
    $errors += "GetResponseStream present"
} else {
    Write-Host "   OK : Aucune reference a GetResponseStream" -ForegroundColor Green
}

# 3. Verifier la presence de ErrorAction Stop
Write-Host ""
Write-Host "3. Verification de -ErrorAction Stop..." -ForegroundColor Yellow
if ($content -match "-ErrorAction Stop") {
    Write-Host "   OK : -ErrorAction Stop present" -ForegroundColor Green
} else {
    Write-Host "   ATTENTION : -ErrorAction Stop non trouve" -ForegroundColor Yellow
}

# 4. Verifier la gestion d'erreur HTTP (detection dynamique)
Write-Host ""
Write-Host "4. Verification de la gestion d'erreur HTTP..." -ForegroundColor Yellow
if ($content -match "Exception\.Response" -and $content -match "StatusCode") {
    Write-Host "   OK : Gestion d'erreur HTTP presente (detection dynamique)" -ForegroundColor Green
} else {
    Write-Host "   ERREUR : Gestion d'erreur HTTP manquante" -ForegroundColor Red
    $errors += "Gestion d'erreur HTTP manquante"
}

# 5. Verifier ErrorDetails.Message
Write-Host ""
Write-Host "5. Verification de ErrorDetails.Message..." -ForegroundColor Yellow
if ($content -match "ErrorDetails\.Message") {
    Write-Host "   OK : ErrorDetails.Message utilise (methode correcte)" -ForegroundColor Green
} else {
    Write-Host "   ERREUR : ErrorDetails.Message non trouve" -ForegroundColor Red
    $errors += "ErrorDetails.Message manquant"
}

# 6. Verifier StatusCode.value__
Write-Host ""
Write-Host "6. Verification de StatusCode.value__..." -ForegroundColor Yellow
if ($content -match "StatusCode\.value__") {
    Write-Host "   OK : StatusCode.value__ utilise" -ForegroundColor Green
} else {
    Write-Host "   ATTENTION : StatusCode.value__ non trouve" -ForegroundColor Yellow
}

# Resume
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
if ($errors.Count -eq 0) {
    Write-Host "VERIFICATION REUSSIE" -ForegroundColor Green
    Write-Host ""
    Write-Host "Le script semble correct. Vous pouvez l'executer avec :" -ForegroundColor White
    Write-Host "  .\reset_campus001_admin.ps1" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "ERREURS TROUVEES" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erreurs detectees :" -ForegroundColor Yellow
    foreach ($err in $errors) {
        Write-Host "  - $err" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Le script doit etre corrige avant utilisation." -ForegroundColor Yellow
    exit 1
}

Write-Host ""


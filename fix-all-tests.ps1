# Script PowerShell pour corriger tous les tests
$testDir = "testsprite_tests"
$files = Get-ChildItem -Path $testDir -Filter "TC*.py" -File

$fixedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $changed = $false
    
    # Correction 1: Endpoint auth
    if ($content -match '/auth/login') {
        $content = $content -replace '/auth/login', '/api/auth/login'
        $changed = $true
    }
    
    # Correction 2: Mots de passe
    if ($content -match 'superadminpassword') {
        $content = $content -replace 'superadminpassword', 'SuperAdmin2024!'
        $changed = $true
    }
    
    if ($content -match 'clinicadminpassword') {
        $content = $content -replace 'clinicadminpassword', 'TempClinic2024!'
        $changed = $true
    }
    
    # Correction 3: Token
    if ($content -match 'access_token') {
        $content = $content -replace 'access_token', 'token'
        $changed = $true
    }
    
    if ($changed) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Corrige: $($file.Name)" -ForegroundColor Green
        $fixedCount++
    } else {
        Write-Host "Aucun changement: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Correction terminee: $fixedCount/$($files.Count) fichiers corriges" -ForegroundColor Cyan

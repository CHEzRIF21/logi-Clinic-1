# ============================================
# Script de vérification des cliniques
# Vérifie que CLINIC001 et CAMPUS-001 existent
# ============================================

param(
    [string]$SupabaseUrl = "https://bnfgemmlokvetmohiqch.supabase.co",
    [string]$ServiceRoleKey = "",
    [string]$DatabaseUrl = ""
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Vérification des Cliniques" -ForegroundColor Cyan
Write-Host "CLINIC001 et CAMPUS-001" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Requête SQL de vérification
$verificationQuery = @"
-- Vérification des cliniques
SELECT 
    code,
    name,
    active,
    is_demo,
    is_temporary_code,
    requires_code_change,
    (SELECT COUNT(*) FROM users WHERE clinic_id = clinics.id) as nb_utilisateurs
FROM clinics
WHERE code IN ('CLINIC001', 'CAMPUS-001')
ORDER BY code;

-- Vérification des utilisateurs CLINIC001
SELECT 
    'CLINIC001' as clinic_code,
    u.email,
    u.nom,
    u.prenom,
    u.role,
    u.status,
    u.actif
FROM users u
JOIN clinics c ON u.clinic_id = c.id
WHERE c.code = 'CLINIC001'
ORDER BY u.role;

-- Vérification des utilisateurs CAMPUS-001
SELECT 
    'CAMPUS-001' as clinic_code,
    u.email,
    u.nom,
    u.prenom,
    u.role,
    u.status,
    u.actif
FROM users u
JOIN clinics c ON u.clinic_id = c.id
WHERE c.code = 'CAMPUS-001'
ORDER BY u.role;

-- Vérification qu'il n'y a pas d'autres cliniques
SELECT 
    COUNT(*) as autres_cliniques
FROM clinics
WHERE code NOT IN ('CLINIC001', 'CAMPUS-001');
"@

# Option 1: Utiliser psql
if ($DatabaseUrl) {
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        Write-Host "❌ psql n'est pas installé" -ForegroundColor Red
        Write-Host "   Utilisez Supabase Dashboard → SQL Editor" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "📤 Exécution via psql..." -ForegroundColor Yellow
    
    $uri = [System.Uri]$DatabaseUrl
    $userInfo = $uri.UserInfo.Split(':')
    $user = $userInfo[0]
    $password = if ($userInfo.Length -gt 1) { $userInfo[1] } else { "" }
    $host = $uri.Host
    $port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
    $database = $uri.AbsolutePath.TrimStart('/')
    
    $env:PGPASSWORD = $password
    
    try {
        $verificationQuery | & psql -h $host -p $port -U $user -d $database
        Write-Host ""
        Write-Host "✅ Vérification terminée!" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "❌ Erreur: $_" -ForegroundColor Red
        exit 1
    }
}
# Option 2: Instructions pour Supabase Dashboard
else {
    Write-Host "📋 INSTRUCTIONS POUR SUPABASE DASHBOARD:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Ouvrez https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Sélectionnez votre projet" -ForegroundColor White
    Write-Host "3. Allez dans SQL Editor" -ForegroundColor White
    Write-Host "4. Copiez et exécutez la requête suivante:" -ForegroundColor White
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host $verificationQuery -ForegroundColor White
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 Résultats attendus:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✅ CLINIC001:" -ForegroundColor Green
    Write-Host "   - active: true" -ForegroundColor White
    Write-Host "   - is_demo: true" -ForegroundColor White
    Write-Host "   - nb_utilisateurs: 4 (admin, medecin, infirmier, receptionniste)" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ CAMPUS-001:" -ForegroundColor Green
    Write-Host "   - active: true" -ForegroundColor White
    Write-Host "   - is_demo: false" -ForegroundColor White
    Write-Host "   - nb_utilisateurs: 1 (admin)" -ForegroundColor White
    Write-Host ""
    Write-Host "✅ Autres cliniques: 0" -ForegroundColor Green
    Write-Host ""
}

Write-Host "=========================================" -ForegroundColor Cyan






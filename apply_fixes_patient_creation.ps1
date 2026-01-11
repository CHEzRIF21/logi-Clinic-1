# Script pour appliquer les corrections pour la création de patients
# Usage: .\apply_fixes_patient_creation.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Corrections pour la création de patients" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 DEUX MIGRATIONS À APPLIQUER:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Correction de la longueur du champ personne_prevenir_option" -ForegroundColor White
Write-Host "2. Nettoyage des patients orphelins (clinic_id = null)" -ForegroundColor White
Write-Host ""

$migration1 = "supabase_migrations\fix_personne_prevenir_option_length.sql"
$migration2 = "supabase_migrations\cleanup_orphan_patients_campus001.sql"

if (-not (Test-Path $migration1)) {
    Write-Host "❌ Fichier de migration 1 introuvable: $migration1" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $migration2)) {
    Write-Host "❌ Fichier de migration 2 introuvable: $migration2" -ForegroundColor Red
    exit 1
}

Write-Host "📋 INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "1. Ouvrez Supabase Dashboard → SQL Editor" -ForegroundColor White
Write-Host "2. Appliquez les migrations dans l'ordre ci-dessous" -ForegroundColor White
Write-Host "3. Cliquez sur 'Run' après chaque migration" -ForegroundColor White
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "MIGRATION 1: Correction personne_prevenir_option" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Get-Content $migration1

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "MIGRATION 2: Nettoyage patients orphelins" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Get-Content $migration2

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Après avoir appliqué les deux migrations:" -ForegroundColor Green
Write-Host "   - Le champ personne_prevenir_option acceptera 'identique_accompagnant' (22 caractères)" -ForegroundColor Green
Write-Host "   - Les patients orphelins (clinic_id = null) seront supprimés" -ForegroundColor Green
Write-Host "   - Vous pourrez créer des patients avec PAT001, PAT002, etc." -ForegroundColor Green
Write-Host ""

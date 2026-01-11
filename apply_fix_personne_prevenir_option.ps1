# Script pour appliquer la correction du champ personne_prevenir_option
# Usage: .\apply_fix_personne_prevenir_option.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Correction du champ personne_prevenir_option" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$migrationFile = "supabase_migrations\fix_personne_prevenir_option_length.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Fichier de migration introuvable: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Fichier de migration: $migrationFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "1. Ouvrez Supabase Dashboard → SQL Editor" -ForegroundColor White
Write-Host "2. Copiez le contenu du fichier ci-dessous" -ForegroundColor White
Write-Host "3. Collez-le dans l'éditeur SQL" -ForegroundColor White
Write-Host "4. Cliquez sur 'Run' ou appuyez sur Ctrl+Enter" -ForegroundColor White
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "CONTENU DE LA MIGRATION:" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Get-Content $migrationFile

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Après avoir appliqué la migration, testez la création d'un patient." -ForegroundColor Green
Write-Host ""

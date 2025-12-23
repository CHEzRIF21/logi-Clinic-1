# Script PowerShell pour appliquer la migration des codes temporaires
# Exécuter avec: .\apply_temp_code_migration.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Migration: Système de Codes Cliniques Temporaires" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Charger les variables d'environnement
$envFile = ".\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

$SUPABASE_URL = $env:VITE_SUPABASE_URL
$SUPABASE_SERVICE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_SERVICE_KEY) {
    Write-Host "Erreur: Variables d'environnement VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pour appliquer manuellement:" -ForegroundColor Yellow
    Write-Host "1. Ouvrez Supabase Studio" -ForegroundColor White
    Write-Host "2. Allez dans SQL Editor" -ForegroundColor White
    Write-Host "3. Copiez-collez le contenu de: supabase_migrations/06_TEMPORARY_CLINIC_CODES.sql" -ForegroundColor White
    Write-Host "4. Exécutez le script" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "URL Supabase: $SUPABASE_URL" -ForegroundColor Green
Write-Host ""

# Lire le fichier de migration
$migrationFile = ".\supabase_migrations\06_TEMPORARY_CLINIC_CODES.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "Erreur: Fichier de migration non trouvé: $migrationFile" -ForegroundColor Red
    exit 1
}

$migrationSQL = Get-Content $migrationFile -Raw

Write-Host "Fichier de migration trouvé: $migrationFile" -ForegroundColor Green
Write-Host "Taille: $($migrationSQL.Length) caractères" -ForegroundColor Gray
Write-Host ""
Write-Host "Instructions pour appliquer la migration:" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "OPTION 1: Via Supabase Studio (Recommandé)" -ForegroundColor Cyan
Write-Host "1. Ouvrez votre projet dans Supabase Studio" -ForegroundColor White
Write-Host "2. Cliquez sur 'SQL Editor' dans le menu gauche" -ForegroundColor White
Write-Host "3. Créez une nouvelle requête" -ForegroundColor White
Write-Host "4. Copiez le contenu du fichier:" -ForegroundColor White
Write-Host "   $migrationFile" -ForegroundColor Yellow
Write-Host "5. Cliquez sur 'RUN' pour exécuter" -ForegroundColor White
Write-Host ""
Write-Host "OPTION 2: Via Supabase CLI" -ForegroundColor Cyan
Write-Host "npx supabase db push" -ForegroundColor White
Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "DONNÉES DE TEST CONFIGURÉES" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Clinique: Clinique du Campus" -ForegroundColor White
Write-Host "Code clinique temporaire: CAMPUS-001" -ForegroundColor Green
Write-Host "Email admin: bagarayannick1@gmail.com" -ForegroundColor Green
Write-Host "Mot de passe: TempClinic2024!" -ForegroundColor Green
Write-Host ""
Write-Host "Validité du code: 72 heures après application de la migration" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Après la migration, testez avec ces identifiants" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan


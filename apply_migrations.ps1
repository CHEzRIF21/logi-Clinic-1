# Script pour appliquer des migrations SQL Supabase.
# Usage:
#   - Mode "local Supabase CLI" (si supabase CLI dispo): .\apply_migrations.ps1
#   - Mode "fallback psql" (sans supabase CLI):         .\apply_migrations.ps1 -DbUrl $env:DATABASE_URL -NonInteractive
#
# Notes:
# - Ce repo contient 2 dossiers:
#   - supabase/migrations : migrations "standard" compatibles Supabase CLI
#   - supabase_migrations : scripts historiques à copier/coller dans le SQL Editor

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Application des migrations Supabase" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Paramètres
param(
    [string]$DbUrl = $env:DATABASE_URL,
    [switch]$NonInteractive
)

function ConvertFrom-PostgresUrl {
    param([Parameter(Mandatory=$true)][string]$Url)
    # Format: postgresql://user:pass@host:port/dbname?sslmode=require
    $u = [System.Uri]$Url
    $userInfo = $u.UserInfo.Split(':', 2)
    $user = $userInfo[0]
    $pass = if ($userInfo.Length -gt 1) { $userInfo[1] } else { "" }
    $dbName = $u.AbsolutePath.TrimStart('/')
    return @{
        Host = $u.Host
        Port = if ($u.Port -gt 0) { $u.Port } else { 5432 }
        User = $user
        Password = $pass
        Database = $dbName
    }
}

# Détection supabase CLI (optionnelle)
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
$supabaseStatus = $null
if ($supabaseInstalled) {
    Write-Host "Vérification de la connexion Supabase..." -ForegroundColor Yellow
    $supabaseStatus = supabase status 2>&1
}

Write-Host ""
Write-Host "Migrations disponibles:" -ForegroundColor Cyan
Write-Host "1. supabase/migrations/*.sql (standard Supabase CLI)" -ForegroundColor White
Write-Host "2. supabase_migrations/*.sql (scripts historiques)" -ForegroundColor White
Write-Host ""

if (-not $NonInteractive) {
    $apply = Read-Host "Voulez-vous appliquer les migrations? (o/n)"
    if ($apply -ne "o" -and $apply -ne "O") {
        Write-Host "Annulé." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Application des migrations..." -ForegroundColor Green

# 1) Migrations Supabase standard
$supabaseMigrationDir = "supabase\migrations"
$supabaseMigrationFiles = @()
if (Test-Path $supabaseMigrationDir) {
    $supabaseMigrationFiles = Get-ChildItem -Path $supabaseMigrationDir -Filter "*.sql" | Sort-Object Name
}

# 2) Liste historique (conservée)
$migrationDir = "supabase_migrations"
$migrations = @(
    "create_stock_tables.sql",
    "add_medicament_pricing_columns.sql",
    "enhance_dispensation_tables.sql",
    "consolidate_stock_dispensation_schema.sql"
)
$successCount = 0
$errorCount = 0

function Invoke-PsqlFile {
    param(
        [Parameter(Mandatory=$true)][string]$FilePath,
        [Parameter(Mandatory=$true)][hashtable]$Conn
    )
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        throw "psql introuvable. Installez PostgreSQL client (psql) ou utilisez Supabase Dashboard → SQL Editor."
    }
    $env:PGPASSWORD = $Conn.Password
    & psql -h $Conn.Host -p $Conn.Port -U $Conn.User -d $Conn.Database -v ON_ERROR_STOP=1 -f $FilePath | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "psql a retourné un code d'erreur ($LASTEXITCODE)."
    }
}

if (-not $supabaseInstalled -and -not $DbUrl) {
    Write-Host "❌ Supabase CLI non détectée ET DbUrl absent." -ForegroundColor Red
    Write-Host "➡️  Options:" -ForegroundColor Yellow
    Write-Host "   - Appliquer via Supabase Dashboard → SQL Editor (voir APPLIQUER_MIGRATIONS.md)" -ForegroundColor Yellow
    Write-Host "   - OU relancer avec: .\\apply_migrations.ps1 -DbUrl `$env:DATABASE_URL -NonInteractive" -ForegroundColor Yellow
    exit 1
}

# Appliquer les migrations standard (supabase/migrations) via psql si DbUrl fourni, sinon afficher instruction CLI
if ($supabaseMigrationFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "📦 Migrations Supabase standard (supabase/migrations)..." -ForegroundColor Cyan
    foreach ($file in $supabaseMigrationFiles) {
        Write-Host "📄 Application de: $($file.FullName)" -ForegroundColor Cyan
        try {
            if ($DbUrl) {
                $conn = ConvertFrom-PostgresUrl -Url $DbUrl
                Invoke-PsqlFile -FilePath $file.FullName -Conn $conn
                Write-Host "✅ OK: $($file.Name)" -ForegroundColor Green
                $successCount++
            } elseif ($supabaseInstalled) {
                Write-Host "⚠️  Supabase CLI détectée mais DbUrl non fourni." -ForegroundColor Yellow
                Write-Host "   Utilisez: supabase db push (appliquera automatiquement supabase/migrations)" -ForegroundColor Yellow
                break
            }
        } catch {
            Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
            $errorCount++
        }
    }
}

# Appliquer quelques scripts historiques si supabase local est up (DB_URL) ou via psql (DbUrl)
foreach ($migration in $migrations) {
    $migrationPath = Join-Path $migrationDir $migration
    
    if (-not (Test-Path $migrationPath)) {
        Write-Host "⚠️  Migration non trouvée: $migration" -ForegroundColor Yellow
        continue
    }
    
    Write-Host ""
    Write-Host "📄 Application de: $migration" -ForegroundColor Cyan
    
    try {
        if ($DbUrl) {
            $conn = ConvertFrom-PostgresUrl -Url $DbUrl
            Invoke-PsqlFile -FilePath $migrationPath -Conn $conn
            Write-Host "✅ Migration appliquée avec succès (psql): $migration" -ForegroundColor Green
            $successCount++
        } elseif ($supabaseInstalled -and ($supabaseStatus -match "API URL")) {
            # Supabase local: DB_URL via supabase status
            $dbUrl = (supabase status --output json | ConvertFrom-Json).DB_URL
            $conn = ConvertFrom-PostgresUrl -Url $dbUrl
            Invoke-PsqlFile -FilePath $migrationPath -Conn $conn
            Write-Host "✅ Migration appliquée avec succès (supabase local): $migration" -ForegroundColor Green
            $successCount++
        } else {
            # Distant / pas de CLI: instructions
            Write-Host "⚠️  Exécution automatique non disponible pour: $migration" -ForegroundColor Yellow
            Write-Host "   Appliquez via Supabase Dashboard → SQL Editor (voir APPLIQUER_MIGRATIONS.md)" -ForegroundColor Yellow
            Write-Host "   Fichier: $migrationPath" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Erreur: $_" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Résumé:" -ForegroundColor Cyan
Write-Host "✅ Migrations réussies: $successCount" -ForegroundColor Green
Write-Host "❌ Migrations échouées: $errorCount" -ForegroundColor Red
Write-Host "=========================================" -ForegroundColor Cyan

if ($errorCount -eq 0) {
    Write-Host ""
    Write-Host "✅ Toutes les migrations ont été appliquées avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "1. Vérifiez que les tables existent dans Supabase" -ForegroundColor White
    Write-Host "2. Vérifiez que les colonnes sont présentes" -ForegroundColor White
    Write-Host "3. Testez l'application" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️  Certaines migrations ont échoué. Vérifiez les erreurs ci-dessus." -ForegroundColor Yellow
}


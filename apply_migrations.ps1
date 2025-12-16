# Script pour appliquer toutes les migrations Supabase
# Usage: .\apply_migrations.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Application des migrations Supabase" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Supabase CLI est installé
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI n'est pas installé!" -ForegroundColor Red
    Write-Host "Installez-le avec: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Vérifier que l'utilisateur est connecté à Supabase
Write-Host "Vérification de la connexion Supabase..." -ForegroundColor Yellow
$supabaseStatus = supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Supabase n'est pas démarré localement ou vous n'êtes pas connecté au projet distant" -ForegroundColor Yellow
    Write-Host "Pour démarrer localement: supabase start" -ForegroundColor Yellow
    Write-Host "Pour vous connecter au projet distant: supabase link --project-ref <project-ref>" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Voulez-vous continuer quand même? (o/n)"
    if ($continue -ne "o" -and $continue -ne "O") {
        exit 1
    }
}

Write-Host ""
Write-Host "Ordre d'application des migrations:" -ForegroundColor Cyan
Write-Host "1. create_stock_tables.sql - Tables de base pour le stock" -ForegroundColor White
Write-Host "2. add_medicament_pricing_columns.sql - Colonnes de prix" -ForegroundColor White
Write-Host "3. enhance_dispensation_tables.sql - Amélioration des dispensations" -ForegroundColor White
Write-Host "4. consolidate_stock_dispensation_schema.sql - Migration consolidée (vérifie tout)" -ForegroundColor White
Write-Host ""

$apply = Read-Host "Voulez-vous appliquer les migrations? (o/n)"
if ($apply -ne "o" -and $apply -ne "O") {
    Write-Host "Annulé." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Application des migrations..." -ForegroundColor Green

# Liste des migrations dans l'ordre
$migrations = @(
    "create_stock_tables.sql",
    "add_medicament_pricing_columns.sql",
    "enhance_dispensation_tables.sql",
    "consolidate_stock_dispensation_schema.sql"
)

$migrationDir = "supabase_migrations"
$successCount = 0
$errorCount = 0

foreach ($migration in $migrations) {
    $migrationPath = Join-Path $migrationDir $migration
    
    if (-not (Test-Path $migrationPath)) {
        Write-Host "⚠️  Migration non trouvée: $migration" -ForegroundColor Yellow
        continue
    }
    
    Write-Host ""
    Write-Host "📄 Application de: $migration" -ForegroundColor Cyan
    
    try {
        # Pour Supabase local
        if ($supabaseStatus -match "API URL") {
            $dbUrl = (supabase status --output json | ConvertFrom-Json).DB_URL
            $env:PGPASSWORD = ($dbUrl -split '@')[0] -replace '.*:', ''
            $dbHost = ($dbUrl -split '@')[1] -split '/' | Select-Object -First 1
            $dbName = ($dbUrl -split '/')[-1]
            $dbUser = ($dbUrl -split '@')[0] -replace '.*//', '' -split ':' | Select-Object -First 1
            
            $sqlContent = Get-Content $migrationPath -Raw
            $sqlContent | psql -h $dbHost -U $dbUser -d $dbName -q
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Migration appliquée avec succès: $migration" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host "❌ Erreur lors de l'application de: $migration" -ForegroundColor Red
                $errorCount++
            }
        } else {
            # Pour Supabase distant, utiliser la console SQL
            Write-Host "⚠️  Pour appliquer cette migration sur Supabase distant:" -ForegroundColor Yellow
            Write-Host "   1. Allez sur https://supabase.com/dashboard" -ForegroundColor Yellow
            Write-Host "   2. Sélectionnez votre projet" -ForegroundColor Yellow
            Write-Host "   3. Allez dans SQL Editor" -ForegroundColor Yellow
            Write-Host "   4. Copiez le contenu de: $migrationPath" -ForegroundColor Yellow
            Write-Host "   5. Exécutez le script SQL" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Ou utilisez: supabase db push" -ForegroundColor Yellow
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


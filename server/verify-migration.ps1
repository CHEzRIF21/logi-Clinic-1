# Script de vérification des migrations Prisma
# Usage: .\verify-migration.ps1 (depuis le dossier server)

# Sauvegarder le répertoire de départ
$originalLocation = Get-Location

# Déterminer le répertoire du script
$scriptPath = if ($MyInvocation.MyCommand.Path) {
    Split-Path -Parent $MyInvocation.MyCommand.Path
} else {
    Get-Location
}

# Vérifier si nous sommes déjà dans le bon répertoire
$currentPath = (Get-Location).Path
$serverPath = $null

# Vérifier si on est déjà dans server
if (Test-Path "prisma\schema.prisma") {
    $serverPath = $currentPath
    Write-Host "📍 Répertoire détecté: $(Split-Path -Leaf $currentPath)" -ForegroundColor Gray
} elseif (Test-Path "$scriptPath\prisma\schema.prisma") {
    # Le script est dans server, on y est déjà
    $serverPath = $scriptPath
    if ($currentPath -ne $serverPath) {
        Set-Location $serverPath -ErrorAction Stop
    }
} else {
    # Essayer de trouver server depuis la racine
    $parentPath = Split-Path -Parent $scriptPath
    $possibleServerPath = Join-Path $parentPath "server"
    
    if (Test-Path "$possibleServerPath\prisma\schema.prisma") {
        $serverPath = $possibleServerPath
        Set-Location $serverPath -ErrorAction Stop
    } else {
        Write-Host "❌ Erreur: Impossible de trouver le dossier 'server' avec prisma\schema.prisma" -ForegroundColor Red
        Write-Host "   Répertoire actuel: $currentPath" -ForegroundColor Yellow
        Write-Host "   Répertoire script: $scriptPath" -ForegroundColor Yellow
        Write-Host "   Essayez d'exécuter ce script depuis le dossier 'server'" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "🔍 Vérification de l'état des migrations Prisma..." -ForegroundColor Cyan
Write-Host "   Répertoire: $(Get-Location)" -ForegroundColor Gray

# Vérifier l'état des migrations
Write-Host "`n📊 État des migrations:" -ForegroundColor Yellow
$migrateStatus = npx prisma migrate status 2>&1
$migrateOutput = $migrateStatus | Out-String
Write-Host $migrateOutput

# Vérifier si la base de données est accessible
$dbAccessible = $migrateOutput -notmatch "Can't reach database server" -and $migrateOutput -notmatch "P1001"

# Générer le client Prisma
Write-Host "`n🔧 Génération du client Prisma..." -ForegroundColor Yellow
$generateResult = npx prisma generate 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Client Prisma généré avec succès!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Erreur lors de la génération du client Prisma" -ForegroundColor Yellow
    Write-Host $generateResult
}

# Vérifier la connexion à la base de données seulement si accessible
if ($dbAccessible) {
    Write-Host "`n🔌 Test de connexion à la base de données..." -ForegroundColor Yellow
    $query = "SELECT COUNT(*) as count FROM `"User`";"
    try {
        $result = $query | npx prisma db execute --stdin 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Connexion réussie!" -ForegroundColor Green
            Write-Host $result
        } else {
            Write-Host "⚠️  Erreur de connexion à la base de données" -ForegroundColor Yellow
            Write-Host $result
        }
    } catch {
        Write-Host "⚠️  Erreur lors du test de connexion: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n⚠️  Base de données non accessible - Test de connexion ignoré" -ForegroundColor Yellow
    Write-Host "   Pour corriger, consultez: DEMARRER_POSTGRESQL.md" -ForegroundColor Cyan
    Write-Host "   Solutions rapides:" -ForegroundColor Gray
    Write-Host "   1. Docker: docker-compose up -d postgres" -ForegroundColor Gray
    Write-Host "   2. Service Windows: Start-Service postgresql-*" -ForegroundColor Gray
    Write-Host "   3. Vérifiez DATABASE_URL dans server/.env" -ForegroundColor Gray
}

# Restaurer le répertoire original
Set-Location $originalLocation -ErrorAction SilentlyContinue

Write-Host "`n✅ Vérification terminée!" -ForegroundColor Green


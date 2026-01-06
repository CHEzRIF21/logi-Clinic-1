# ============================================
# Script pour appliquer la migration consolidée
# 28_CREATE_CLINIC001_AND_CAMPUS001_ONLY.sql
# ============================================
# Ce script applique la migration qui crée uniquement
# CLINIC001 (démo) et CAMPUS-001
# ============================================

param(
    [string]$SupabaseUrl = "https://bnfgemmlokvetmohiqch.supabase.co",
    [string]$ServiceRoleKey = "",
    [switch]$UsePsql = $false,
    [string]$DatabaseUrl = ""
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Application de la Migration Consolidée" -ForegroundColor Cyan
Write-Host "28_CREATE_CLINIC001_AND_CAMPUS001_ONLY" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$migrationFile = "supabase_migrations\28_CREATE_CLINIC001_AND_CAMPUS001_ONLY.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Fichier de migration non trouvé: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Fichier de migration trouvé: $migrationFile" -ForegroundColor Green
Write-Host ""

# Afficher un avertissement
Write-Host "⚠️  ATTENTION:" -ForegroundColor Yellow
Write-Host "Cette migration va:" -ForegroundColor Yellow
Write-Host "  1. Créer/vérifier CLINIC001 (Clinique Démo)" -ForegroundColor White
Write-Host "  2. Créer/vérifier CAMPUS-001 (Clinique du Campus)" -ForegroundColor White
Write-Host "  3. SUPPRIMER toutes les autres cliniques" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Voulez-vous continuer? (O/N)"
if ($confirmation -ne "O" -and $confirmation -ne "o") {
    Write-Host "❌ Migration annulée." -ForegroundColor Red
    exit 0
}

$sqlContent = Get-Content $migrationFile -Raw -Encoding UTF8

# Option 1: Utiliser psql si disponible
if ($UsePsql -or $DatabaseUrl) {
    if (-not $DatabaseUrl) {
        Write-Host "⚠️  DatabaseUrl requis pour psql" -ForegroundColor Yellow
        Write-Host "   Format: postgresql://user:password@host:port/database" -ForegroundColor Yellow
        $DatabaseUrl = Read-Host "Entrez la DatabaseUrl (ou appuyez sur Entrée pour utiliser Supabase Dashboard)"
        
        if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
            Write-Host ""
            Write-Host "📋 INSTRUCTIONS POUR SUPABASE DASHBOARD:" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "1. Ouvrez https://supabase.com/dashboard" -ForegroundColor White
            Write-Host "2. Sélectionnez votre projet" -ForegroundColor White
            Write-Host "3. Allez dans SQL Editor" -ForegroundColor White
            Write-Host "4. Ouvrez le fichier: $migrationFile" -ForegroundColor White
            Write-Host "5. Copiez tout le contenu" -ForegroundColor White
            Write-Host "6. Collez dans le SQL Editor" -ForegroundColor White
            Write-Host "7. Cliquez sur Run (ou F5)" -ForegroundColor White
            Write-Host ""
            exit 0
        }
    }
    
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        Write-Host "❌ psql n'est pas installé" -ForegroundColor Red
        Write-Host "   Installez PostgreSQL client ou utilisez Supabase Dashboard" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "📤 Application via psql..." -ForegroundColor Yellow
    
    # Parser l'URL de la base de données
    $uri = [System.Uri]$DatabaseUrl
    $userInfo = $uri.UserInfo.Split(':')
    $user = $userInfo[0]
    $password = if ($userInfo.Length -gt 1) { $userInfo[1] } else { "" }
    $host = $uri.Host
    $port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
    $database = $uri.AbsolutePath.TrimStart('/')
    
    $env:PGPASSWORD = $password
    
    try {
        $sqlContent | & psql -h $host -p $port -U $user -d $database -v ON_ERROR_STOP=1
        Write-Host ""
        Write-Host "✅ Migration appliquée avec succès via psql!" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "❌ Erreur lors de l'application: $_" -ForegroundColor Red
        exit 1
    }
}
# Option 2: Utiliser Supabase API (si ServiceRoleKey fourni)
elseif ($ServiceRoleKey) {
    Write-Host "📤 Application via Supabase API..." -ForegroundColor Yellow
    
    $headers = @{
        "apikey" = $ServiceRoleKey
        "Authorization" = "Bearer $ServiceRoleKey"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        query = $sqlContent
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/rpc/exec_sql" `
            -Method Post `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host ""
        Write-Host "✅ Migration appliquée avec succès via API!" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "❌ Erreur lors de l'application: $_" -ForegroundColor Red
        Write-Host "   Note: L'API Supabase peut ne pas supporter l'exécution SQL directe." -ForegroundColor Yellow
        Write-Host "   Utilisez Supabase Dashboard → SQL Editor à la place." -ForegroundColor Yellow
        exit 1
    }
}
# Option 3: Instructions pour Supabase Dashboard
else {
    Write-Host "📋 INSTRUCTIONS POUR SUPABASE DASHBOARD:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Ouvrez https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Sélectionnez votre projet" -ForegroundColor White
    Write-Host "3. Allez dans SQL Editor" -ForegroundColor White
    Write-Host "4. Ouvrez le fichier: $migrationFile" -ForegroundColor White
    Write-Host "5. Copiez tout le contenu" -ForegroundColor White
    Write-Host "6. Collez dans le SQL Editor" -ForegroundColor White
    Write-Host "7. Cliquez sur Run (ou F5)" -ForegroundColor White
    Write-Host ""
    Write-Host "📄 Chemin complet du fichier:" -ForegroundColor Yellow
    Write-Host "   $((Get-Item $migrationFile).FullName)" -ForegroundColor White
    Write-Host ""
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ Script terminé" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Exécutez: .\verify_clinics.ps1" -ForegroundColor White
Write-Host "2. Testez les connexions (voir GUIDE_TEST_CONNEXIONS.md)" -ForegroundColor White
Write-Host ""







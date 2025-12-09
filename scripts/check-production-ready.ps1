# Script PowerShell de vérification de préparation à la production
# Usage: .\scripts\check-production-ready.ps1

Write-Host "🔍 Vérification de préparation à la production - Logi Clinic" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$Errors = 0
$Warnings = 0

# Vérifier Node.js
Write-Host "📦 Vérification Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "  ✅ Node.js installé: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js non installé" -ForegroundColor Red
    $Errors++
}

# Vérifier npm
Write-Host "📦 Vérification npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "  ✅ npm installé: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ npm non installé" -ForegroundColor Red
    $Errors++
}

# Vérifier le fichier .env.production
Write-Host "📝 Vérification variables d'environnement..." -ForegroundColor Yellow
if (Test-Path ".env.production") {
    Write-Host "  ✅ Fichier .env.production trouvé" -ForegroundColor Green
    
    $envContent = Get-Content ".env.production" -Raw
    
    if ($envContent -match "VITE_SUPABASE_URL=https://" -and $envContent -notmatch "votre-projet\.supabase\.co") {
        Write-Host "  ✅ VITE_SUPABASE_URL configuré" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  VITE_SUPABASE_URL non configuré ou utilise une valeur placeholder" -ForegroundColor Yellow
        $Warnings++
    }
    
    if ($envContent -match "VITE_SUPABASE_ANON_KEY=eyJ" -and $envContent -notmatch "votre-anon-key-ici") {
        Write-Host "  ✅ VITE_SUPABASE_ANON_KEY configuré" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  VITE_SUPABASE_ANON_KEY non configuré ou utilise une valeur placeholder" -ForegroundColor Yellow
        $Warnings++
    }
} else {
    Write-Host "  ⚠️  Fichier .env.production non trouvé (optionnel mais recommandé)" -ForegroundColor Yellow
    $Warnings++
}

# Vérifier que .env.production n'est pas dans git
Write-Host "🔒 Vérification sécurité..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "\.env\.production") {
        Write-Host "  ✅ .env.production dans .gitignore" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  .env.production pas dans .gitignore (risque de sécurité)" -ForegroundColor Yellow
        $Warnings++
    }
} else {
    Write-Host "  ⚠️  .gitignore non trouvé" -ForegroundColor Yellow
    $Warnings++
}

# Vérifier les migrations
Write-Host "🗄️  Vérification migrations Supabase..." -ForegroundColor Yellow
if (Test-Path "supabase_migrations") {
    $migrationFiles = Get-ChildItem -Path "supabase_migrations" -Filter "*.sql"
    $migrationCount = $migrationFiles.Count
    Write-Host "  ✅ $migrationCount fichiers de migration trouvés" -ForegroundColor Green
    
    if (Test-Path "supabase_migrations\apply_all_migrations_and_rls.sql") {
        Write-Host "  ✅ Script de migration consolidé trouvé" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Script de migration consolidé non trouvé" -ForegroundColor Yellow
        $Warnings++
    }
} else {
    Write-Host "  ❌ Dossier supabase_migrations non trouvé" -ForegroundColor Red
    $Errors++
}

# Vérifier le build
Write-Host "🔨 Test de build..." -ForegroundColor Yellow
try {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Build réussi" -ForegroundColor Green
        
        if (Test-Path "build") {
            $buildSize = (Get-ChildItem -Path "build" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
            Write-Host "  ✅ Dossier build créé (taille: $([math]::Round($buildSize, 2)) MB)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Dossier build non créé" -ForegroundColor Red
            $Errors++
        }
    } else {
        Write-Host "  ❌ Build échoué (exécutez 'npm run build' pour voir les erreurs)" -ForegroundColor Red
        $Errors++
    }
} catch {
    Write-Host "  ❌ Erreur lors du test de build" -ForegroundColor Red
    $Errors++
}

# Vérifier les dépendances
Write-Host "📚 Vérification dépendances..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "  ✅ package.json trouvé" -ForegroundColor Green
    
    if (Test-Path "node_modules") {
        Write-Host "  ✅ node_modules trouvé" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  node_modules non trouvé (exécutez 'npm install')" -ForegroundColor Yellow
        $Warnings++
    }
} else {
    Write-Host "  ❌ package.json non trouvé" -ForegroundColor Red
    $Errors++
}

# Résumé
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "📊 Résumé" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ❌ Erreurs: $Errors" -ForegroundColor $(if ($Errors -eq 0) { "Green" } else { "Red" })
Write-Host "  ⚠️  Avertissements: $Warnings" -ForegroundColor $(if ($Warnings -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($Errors -eq 0 -and $Warnings -eq 0) {
    Write-Host "✅ Tout est prêt pour la production !" -ForegroundColor Green
    exit 0
} elseif ($Errors -eq 0) {
    Write-Host "⚠️  Prêt avec quelques avertissements" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ Des erreurs doivent être corrigées avant le déploiement" -ForegroundColor Red
    exit 1
}


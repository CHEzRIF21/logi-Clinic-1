# Script PowerShell pour appliquer la migration de correction de la contrainte lots
# Ce script applique la migration SQL via Supabase CLI

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration: Correction contrainte lots" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier si Supabase CLI est installé
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI n'est pas installé." -ForegroundColor Red
    Write-Host "`nVeuillez installer Supabase CLI avec npm:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host "`nOu appliquez la migration manuellement via l'interface Supabase:" -ForegroundColor Yellow
    Write-Host "  1. Aller sur https://app.supabase.com" -ForegroundColor White
    Write-Host "  2. Sélectionner votre projet" -ForegroundColor White
    Write-Host "  3. Aller dans 'SQL Editor'" -ForegroundColor White
    Write-Host "  4. Copier le contenu de 'supabase_migrations/fix_lots_unique_constraint.sql'" -ForegroundColor White
    Write-Host "  5. Exécuter la requête`n" -ForegroundColor White
    exit 1
}

Write-Host "✓ Supabase CLI détecté`n" -ForegroundColor Green

# Demander confirmation
Write-Host "Cette migration va :" -ForegroundColor Yellow
Write-Host "  1. Supprimer la contrainte UNIQUE(medicament_id, numero_lot)" -ForegroundColor White
Write-Host "  2. Ajouter une nouvelle contrainte UNIQUE(medicament_id, numero_lot, magasin)" -ForegroundColor White
Write-Host "  3. Créer un index pour optimiser les performances`n" -ForegroundColor White

$confirmation = Read-Host "Voulez-vous continuer? (O/N)"

if ($confirmation -ne "O" -and $confirmation -ne "o") {
    Write-Host "`n❌ Migration annulée." -ForegroundColor Red
    exit 0
}

Write-Host "`n📝 Application de la migration..." -ForegroundColor Cyan

# Appliquer la migration
try {
    $migrationFile = "supabase_migrations/fix_lots_unique_constraint.sql"
    
    if (-not (Test-Path $migrationFile)) {
        Write-Host "`n❌ Fichier de migration introuvable: $migrationFile" -ForegroundColor Red
        exit 1
    }

    # Lire le contenu du fichier
    $sqlContent = Get-Content $migrationFile -Raw

    # Exécuter via Supabase CLI
    Write-Host "`nExécution de la migration..." -ForegroundColor Yellow
    $sqlContent | supabase db execute

    Write-Host "`n✅ Migration appliquée avec succès!" -ForegroundColor Green
    Write-Host "`nLe problème de contrainte unique a été corrigé." -ForegroundColor Green
    Write-Host "Vous pouvez maintenant valider les transferts sans erreur.`n" -ForegroundColor Green

} catch {
    Write-Host "`n❌ Erreur lors de l'application de la migration:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nVeuillez appliquer la migration manuellement via l'interface Supabase.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================`n" -ForegroundColor Cyan

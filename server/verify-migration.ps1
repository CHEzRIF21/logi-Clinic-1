# Script de vérification des migrations Prisma
# Usage: .\verify-migration.ps1

Write-Host "🔍 Vérification de l'état des migrations Prisma..." -ForegroundColor Cyan

# Vérifier l'état des migrations
Write-Host "`n📊 État des migrations:" -ForegroundColor Yellow
npx prisma migrate status

# Générer le client Prisma
Write-Host "`n🔧 Génération du client Prisma..." -ForegroundColor Yellow
npx prisma generate

# Vérifier la connexion à la base de données
Write-Host "`n🔌 Test de connexion à la base de données..." -ForegroundColor Yellow
$query = "SELECT COUNT(*) as count FROM `"User`";"
npx prisma db execute --stdin <<< $query

Write-Host "`n✅ Vérification terminée!" -ForegroundColor Green


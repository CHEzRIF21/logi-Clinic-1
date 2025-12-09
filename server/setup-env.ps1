# Script PowerShell pour créer le fichier .env à partir de .env.example
# Usage: .\setup-env.ps1

$envExample = Join-Path $PSScriptRoot ".env.example"
$envFile = Join-Path $PSScriptRoot ".env"

if (Test-Path $envFile) {
    Write-Host "⚠️  Le fichier .env existe déjà." -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous le remplacer? (o/N)"
    if ($response -ne "o" -and $response -ne "O") {
        Write-Host "❌ Opération annulée." -ForegroundColor Red
        exit
    }
}

if (-not (Test-Path $envExample)) {
    Write-Host "❌ Le fichier .env.example n'existe pas!" -ForegroundColor Red
    exit 1
}

Copy-Item $envExample $envFile
Write-Host "✅ Fichier .env créé à partir de .env.example" -ForegroundColor Green
Write-Host "📝 N'oubliez pas de modifier les valeurs dans .env selon votre configuration!" -ForegroundColor Yellow


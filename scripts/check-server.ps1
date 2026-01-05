# Script de vérification du serveur de développement
# Vérifie que le serveur Vite est en cours d'exécution sur le port 3001

param(
    [int]$Port = 3001,
    [int]$TimeoutSeconds = 5,
    [string]$Url = "http://localhost:$Port"
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Vérification du serveur de développement..." -ForegroundColor Cyan

# Vérifier si le port est en écoute
Write-Host "  → Vérification du port $Port..." -ForegroundColor Yellow
$portInUse = $false
try {
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    $portInUse = $connection
} catch {
    $portInUse = $false
}

if (-not $portInUse) {
    Write-Host "  ❌ Le port $Port n'est pas en écoute" -ForegroundColor Red
    Write-Host "  💡 Démarrez le serveur avec: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✅ Le port $Port est en écoute" -ForegroundColor Green

# Vérifier si le serveur répond aux requêtes HTTP
Write-Host "  → Vérification de la réponse HTTP..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Le serveur répond correctement (HTTP $($response.StatusCode))" -ForegroundColor Green
        Write-Host "  📍 URL: $Url" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host "  ⚠️  Le serveur répond avec le code HTTP $($response.StatusCode)" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "  ❌ Le serveur ne répond pas aux requêtes HTTP" -ForegroundColor Red
    Write-Host "  💡 Erreur: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "  💡 Démarrez le serveur avec: npm run dev" -ForegroundColor Yellow
    exit 1
}


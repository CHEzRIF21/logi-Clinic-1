# Script PowerShell pour redémarrer le serveur MCP Supabase
# Exécutez ce script en tant qu'administrateur si nécessaire

Write-Host "🔄 Redémarrage du serveur MCP Supabase..." -ForegroundColor Yellow

# Arrêter tous les processus MCP en cours
Write-Host "⏹️  Arrêt des processus MCP existants..." -ForegroundColor Blue
Get-Process | Where-Object {$_.ProcessName -like "*mcp*" -or $_.ProcessName -like "*supabase*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Attendre un moment pour s'assurer que les processus sont arrêtés
Start-Sleep -Seconds 2

Write-Host "✅ Processus MCP arrêtés" -ForegroundColor Green

# Vérifier la configuration MCP
Write-Host "📋 Vérification de la configuration MCP..." -ForegroundColor Blue
$mcpConfigPath = "$env:USERPROFILE\.cursor\mcp.json"

if (Test-Path $mcpConfigPath) {
    Write-Host "✅ Fichier de configuration MCP trouvé: $mcpConfigPath" -ForegroundColor Green
    
    # Afficher la configuration actuelle
    $config = Get-Content $mcpConfigPath | ConvertFrom-Json
    Write-Host "🔧 Configuration actuelle:" -ForegroundColor Cyan
    Write-Host "   - Projet Supabase: $($config.mcpServers.supabase.args[4])" -ForegroundColor White
    Write-Host "   - Token configuré: $($config.mcpServers.supabase.env.SUPABASE_ACCESS_TOKEN -ne '<sbp_...>')" -ForegroundColor White
} else {
    Write-Host "❌ Fichier de configuration MCP non trouvé!" -ForegroundColor Red
    Write-Host "   Créez le fichier: $mcpConfigPath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Instructions pour redémarrer MCP:" -ForegroundColor Yellow
Write-Host "1. Fermez Cursor complètement" -ForegroundColor White
Write-Host "2. Rouvrez Cursor" -ForegroundColor White
Write-Host "3. Le serveur MCP se redémarrera automatiquement" -ForegroundColor White
Write-Host ""
Write-Host "📝 Pour tester la connexion:" -ForegroundColor Yellow
Write-Host "   - Allez sur http://localhost:3000/patients" -ForegroundColor White
Write-Host "   - Ou utilisez le composant SupabaseTest" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Dashboard Supabase: https://supabase.com/dashboard/project/kfuqghnlrnqaiaiwzziv" -ForegroundColor Cyan

# Attendre l'entrée utilisateur
Write-Host ""
Read-Host "Appuyez sur Entrée pour continuer..."

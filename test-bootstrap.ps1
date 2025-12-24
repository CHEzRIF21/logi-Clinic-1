# Script de test simple pour appeler bootstrap-clinic-admin-auth
# Usage: .\test-bootstrap.ps1

$superAdminToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6InJ1SlJDM3F4MlpPbzlIelUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2JuZmdlbW1sb2t2ZXRtb2hpcWNoLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI2NGZmOWEwNi1iYjRjLTQzOWYtODQxZi1hMDYyNzgyNTEzNzUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY2NTIzNDk0LCJpYXQiOjE3NjY1MTk4OTQsImVtYWlsIjoiYmFib2NoZXIyMUBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2NjUxOTg5NH1dLCJzZXNzaW9uX2lkIjoiOTljZTM0YTEtZDE1NC00MTgyLWE1MjUtOGVlZGM3MDE0OTc3IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.qR36166VxIpzNr8RKArcMvrbg98njxFjbKb_IKTow8o"

$body = @{
    clinicCode = "CAMPUS-001"
    adminEmail = "bagarayannick1@gmail.com"
    adminPassword = "TempClinic2024!"
} | ConvertTo-Json

Write-Host "🚀 Appel de bootstrap-clinic-admin-auth..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://bnfgemmlokvetmohiqch.supabase.co/functions/v1/bootstrap-clinic-admin-auth" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $superAdminToken"
            "Content-Type" = "application/json"
            "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZmdlbW1sb2t2ZXRtb2hpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzI1MTksImV4cCI6MjA3ODQ0ODUxOX0.53UOzq6eeZRqG8dk6lTGMVZsoK4aiZGU5I1q-JIUMd8"
        } `
        -Body $body

    Write-Host "✅ Succès !" -ForegroundColor Green
    Write-Host ""
    $response | ConvertTo-Json -Depth 10
    
} catch [Microsoft.PowerShell.Commands.HttpResponseException] {
    Write-Host "❌ Erreur HTTP: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Message: $($_.ErrorDetails.Message)" -ForegroundColor Red
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}



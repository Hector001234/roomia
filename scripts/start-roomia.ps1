# =============================================================================
# Roomia v3.2.0 — Arrancador 1-Clic para Defensa de Ordinario
# Levanta: Backend API (:8000) + Portal Público (:5174) + Backoffice Admin (:5175)
# =============================================================================
$Root = "C:\Users\Hector\Documents\Proyecto_Auditoria\rommia"

Write-Host "=== Iniciando Roomia v3.2.0 (PostgreSQL 18 + API + Portales) ===" -ForegroundColor Cyan

$pgSvc = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if ($pgSvc -and $pgSvc.Status -eq "Running") {
    Write-Host "[OK] PostgreSQL 18 (postgresql-x64-18) activo." -ForegroundColor Green
} else {
    Write-Host "[WARN] Verifica que el servicio postgresql-x64-18 este iniciado." -ForegroundColor Yellow
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root'; node backend/server.mjs" -WindowStyle Normal
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend'; npm run dev -- --host 127.0.0.1 --port 5174" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\frontend-admin'; npm run dev -- --host 127.0.0.1 --port 5175" -WindowStyle Normal

Start-Sleep -Seconds 4
Start-Process "http://127.0.0.1:5174"
Start-Process "http://127.0.0.1:5175"

Write-Host ""
Write-Host "Listo! Portales abiertos:" -ForegroundColor Green
Write-Host "  - Portal Publico (Huespedes): http://127.0.0.1:5174"
Write-Host "  - Backoffice Admin:           http://127.0.0.1:5175"
Write-Host "  - API Health PostgreSQL 18:   http://127.0.0.1:8000/api/v1/health"

# Revora local dev: Docker (Postgres + Redis), migrations, optional new windows for API + Next.
# Run from repo root:  powershell -ExecutionPolicy Bypass -File scripts/start-local-stack.ps1
# With servers:        powershell -ExecutionPolicy Bypass -File scripts/start-local-stack.ps1 -AlsoStartServers

param(
  [switch]$AlsoStartServers
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

Write-Host "== 1) Docker Compose (postgres + redis) ==" -ForegroundColor Cyan
$dockerOk = $false
if (Get-Command docker -ErrorAction SilentlyContinue) {
  docker compose up -d
  if ($LASTEXITCODE -eq 0) { $dockerOk = $true }
}
if (-not $dockerOk -and (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
  Write-Host "Trying legacy: docker-compose up -d" -ForegroundColor DarkYellow
  docker-compose up -d
  if ($LASTEXITCODE -eq 0) { $dockerOk = $true }
}
if (-not $dockerOk) {
  Write-Host "Docker Compose failed. Use 'docker compose' or install docker-compose v1." -ForegroundColor Red
  exit 1
}

Write-Host "`n== docker ps ==" -ForegroundColor Cyan
docker ps --filter "name=revora-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host "`n== 2) DB schema + migrations (backend) ==" -ForegroundColor Cyan
Push-Location (Join-Path $RepoRoot "backend")
try {
  npm run migrate:schema
  if ($LASTEXITCODE -ne 0) { throw "migrate:schema failed" }
  npm run migrate
  if ($LASTEXITCODE -ne 0) {
    Write-Host "npm run migrate failed (exit $LASTEXITCODE)." -ForegroundColor Red
    exit $LASTEXITCODE
  }
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
} finally {
  Pop-Location
}

Write-Host "`n== Done core setup. ==" -ForegroundColor Green
Write-Host "Health check: http://127.0.0.1:8080/health (after API is running)" -ForegroundColor Yellow

if ($AlsoStartServers) {
  Write-Host "`n== 3/4) Opening new terminals: backend + frontend ==" -ForegroundColor Cyan
  $be = Join-Path $RepoRoot "backend"
  $fe = Join-Path $RepoRoot "whatsapp-order-os"
  Start-Process powershell -ArgumentList @("-NoExit", "-Command", "cd `"$be`"; npm run dev")
  Start-Sleep -Seconds 2
  Start-Process powershell -ArgumentList @("-NoExit", "-Command", "cd `"$fe`"; npm run dev")
} else {
  Write-Host "`nNext (two separate terminals):" -ForegroundColor Yellow
  Write-Host "  Terminal A:  cd `"$(Join-Path $RepoRoot 'backend')`"`n               npm run dev"
  Write-Host "  Terminal B:  cd `"$(Join-Path $RepoRoot 'whatsapp-order-os')`"`n               npm run dev"
}

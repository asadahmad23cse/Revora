# Revora demo seed: creates a demo business, simulates unanswered WhatsApp orders,
# and simulates one answered conversation so the dashboard shows real numbers.
#
# Prerequisites: docker compose up -d, migrations run, backend `npm run dev` on :8080.
# Run from repo root:  powershell -ExecutionPolicy Bypass -File scripts/demo-seed.ps1

param(
  [string]$Api = "http://127.0.0.1:8080",
  [string]$Email = "demo@revora.test",
  [string]$Password = "DemoPass12345",
  [string]$BusinessName = "Sunita Home Kitchen",
  [string]$BusinessPhone = "919811112222"
)

$ErrorActionPreference = "Stop"

function Post($path, $body, $headers = @{}) {
  return Invoke-RestMethod -Method Post -Uri "$Api$path" -ContentType "application/json" `
    -Body ($body | ConvertTo-Json -Compress) -Headers $headers
}

Write-Host "== 0) API health ==" -ForegroundColor Cyan
try {
  $h = Invoke-RestMethod -Method Get -Uri "$Api/health" -TimeoutSec 10
  Write-Host ("   db={0} redis={1}" -f $h.checks.database, $h.checks.redis) -ForegroundColor Green
} catch {
  Write-Host "API not reachable at $Api. Start it with: cd backend; npm run dev" -ForegroundColor Red
  exit 1
}

Write-Host "`n== 1) Register (or reuse) demo business ==" -ForegroundColor Cyan
$auth = $null
try {
  $auth = Post "/api/auth/register" @{
    email         = $Email
    password      = $Password
    business_name = $BusinessName
    phone         = $BusinessPhone
  }
  Write-Host "   registered new account" -ForegroundColor Green
} catch {
  $auth = Post "/api/auth/login" @{ email = $Email; password = $Password }
  Write-Host "   account existed; logged in" -ForegroundColor Yellow
}
$businessId = $auth.businessId
$token = $auth.token
Write-Host "   businessId = $businessId"

Write-Host "`n== 2) Simulate unanswered order messages (these become 'at risk') ==" -ForegroundColor Cyan
$orders = @(
  "3 rajma chawal bhej do sector 4",
  "aaj lunch box chahiye 2",
  "2 paneer roll delivery 1pm",
  "tiffin chahiye kal se",
  "biryani ka order dena hai",
  "kal ke liye 4 thali book kar do"
)
$stamp = [int][double]::Parse((Get-Date -UFormat %s)) % 10000
$i = 0
foreach ($text in $orders) {
  $i++
  $phone = "9197{0:D5}{1:D2}" -f $stamp, $i
  Post "/dev/simulate-message" @{ phone = $phone; text = $text; businessId = $businessId } | Out-Null
  Write-Host "   sent: $text"
}

Write-Host "`n== 3) Simulate one conversation the owner DID answer (contrast case) ==" -ForegroundColor Cyan
$answeredPhone = "9197{0:D5}99" -f $stamp
Post "/webhook" @{
  simulate       = $true
  business_phone = $BusinessPhone
  customer_phone = $answeredPhone
  direction      = "incoming"
  text           = "2 paneer thali bhej do lunch ke liye"
  wa_message_id  = "wamid.demo-in-$stamp"
} | Out-Null
Start-Sleep -Seconds 4
Post "/webhook" @{
  simulate       = $true
  business_phone = $BusinessPhone
  customer_phone = $answeredPhone
  direction      = "outgoing"
  text           = "Ji bilkul, 2 paneer thali confirm. 1 baje tak pahunch jayega."
  wa_message_id  = "wamid.demo-out-$stamp"
} | Out-Null
Write-Host "   answered in ~4s -> tracked as on-time, NOT at risk" -ForegroundColor Green

$threshold = 75
Write-Host "`n== 4) Waiting ${threshold}s for the risk worker to fire ==" -ForegroundColor Cyan
Write-Host "   (RESPONSE_THRESHOLD_SECONDS in backend/.env controls this)" -ForegroundColor DarkGray
Start-Sleep -Seconds $threshold

Write-Host "`n== 5) Report ==" -ForegroundColor Cyan
$report = Invoke-RestMethod -Method Get -Uri "$Api/reports/14days" -Headers @{ Authorization = "Bearer $token" }
Write-Host ("   messages at risk : {0}" -f $report.totalRiskyMessages) -ForegroundColor Green
Write-Host ("   revenue at risk  : Rs {0}" -f $report.totalEstimatedRevenueAtRiskInr) -ForegroundColor Green
Write-Host ("   summary          : {0}" -f $report.summary)

Write-Host "`n== Ready ==" -ForegroundColor Green
Write-Host "   Landing   : http://localhost:3000"
Write-Host "   Dashboard : http://localhost:3000/admin"
Write-Host "   Login     : $Email / $Password"

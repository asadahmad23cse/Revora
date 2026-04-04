# Revora API tests — PS 5.1+ (Invoke-RestMethod + WebException response body)
$base = "http://127.0.0.1:8080"
$global:token = $null
$global:businessId = $null
$global:leadId = $null
$global:token2 = $null
$rows = New-Object System.Collections.ArrayList

function Add-Row($num, $desc, $status, $notes) {
  [void]$rows.Add([PSCustomObject]@{ Test = $num; Description = $desc; Status = $status; Notes = $notes })
}

function Invoke-ApiJson {
  param(
    [string]$Method,
    [string]$Uri,
    [hashtable]$Headers = @{},
    [object]$BodyObj = $null
  )
  $params = @{ Uri = $Uri; Method = $Method; Headers = $Headers }
  if ($null -ne $BodyObj) {
    $params.Body = ($BodyObj | ConvertTo-Json -Compress -Depth 8)
    $params.ContentType = "application/json; charset=utf-8"
  }
  try {
    $data = Invoke-RestMethod @params
    return @{
      Ok         = $true
      StatusCode = 200
      Data       = $data
      Raw        = ($data | ConvertTo-Json -Compress -Depth 8)
    }
  }
  catch {
    $code = 0
    $txt = ""
    $parsed = $null
    # PS 7: HttpResponseException
    if ($_.Exception.PSObject.Properties.Name -contains "Response" -and $_.Exception.Response) {
      try {
        $code = [int]$_.Exception.Response.StatusCode
      }
      catch { }
    }
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
      $txt = $_.ErrorDetails.Message
    }
    if (-not $txt -and $_.Exception.Response) {
      try {
        if ($code -eq 0) { $code = [int]$_.Exception.Response.StatusCode }
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
          $sr = New-Object System.IO.StreamReader($stream)
          $txt = $sr.ReadToEnd()
          $sr.Close()
        }
      }
      catch { }
    }
    if ($txt) { try { $parsed = $txt | ConvertFrom-Json } catch { } }
    if (-not $txt) { $txt = $_.Exception.Message }
    if ($code -eq 0 -and $txt -match '\(409\)') { $code = 409 }
    if ($code -eq 0 -and $txt -match '\(401\)') { $code = 401 }
    return @{
      Ok         = ($code -ge 200 -and $code -lt 300)
      StatusCode = $code
      Data       = $parsed
      Raw        = $txt
    }
  }
}

$r1 = Invoke-ApiJson -Method Get -Uri "$base/health"
if ($r1.Ok -and $r1.Data.status -eq "ok") { Add-Row 1 "Health Check" "PASS" ($r1.Raw.Substring(0, [Math]::Min(300, $r1.Raw.Length))) }
else { Add-Row 1 "Health Check" "FAIL" $r1.Raw }

$regBody = @{
  email         = "cursor_test@revora.com"
  password      = "Test@1234"
  business_name = "Cursor Test Business"
  phone         = "919111111111"
}
$r2 = Invoke-ApiJson -Method Post -Uri "$base/api/auth/register" -BodyObj $regBody
$t2 = $r2.Ok -and $r2.Data.token -and $r2.Data.businessId
if ($t2) {
  $global:token = [string]$r2.Data.token
  $global:businessId = [string]$r2.Data.businessId
  $n2 = "201 token+businessId (no ok field in body)"
}
elseif ($r2.StatusCode -eq 409) {
  $r2b = Invoke-ApiJson -Method Post -Uri "$base/api/auth/login" -BodyObj @{ email = "cursor_test@revora.com"; password = "Test@1234" }
  if ($r2b.Ok -and $r2b.Data.token -and $r2b.Data.businessId) {
    $global:token = [string]$r2b.Data.token
    $global:businessId = [string]$r2b.Data.businessId
    $t2 = $true
    $n2 = "PASS (user already existed; logged in to obtain token)"
  }
  else { $n2 = "409 conflict and login failed: $($r2b.Raw)" }
}
else { $n2 = $r2.Raw }
Add-Row 2 "Register New User" $(if ($t2) { "PASS" } else { "FAIL" }) $n2

$r3 = Invoke-ApiJson -Method Post -Uri "$base/api/auth/register" -BodyObj $regBody
$t3 = ($r3.StatusCode -eq 409) -and (($r3.Data.code -eq "email_taken") -or ($r3.Raw -match "email_taken"))
Add-Row 3 "Duplicate Register" $(if ($t3) { "PASS" } else { "FAIL" }) $r3.Raw

$r4 = Invoke-ApiJson -Method Post -Uri "$base/api/auth/login" -BodyObj @{ email = "cursor_test@revora.com"; password = "Test@1234" }
$t4 = $r4.Ok -and $r4.Data.token -and ($r4.Data.businessId -eq $global:businessId)
if ($r4.Ok -and $r4.Data.token) {
  $global:token = [string]$r4.Data.token
  $global:businessId = [string]$r4.Data.businessId
}
Add-Row 4 "Login" $(if ($t4) { "PASS" } else { "FAIL" }) $(if ($t4) { "same businessId as after Test 2; response has token not ok:true" } else { $r4.Raw })

$r5 = Invoke-ApiJson -Method Post -Uri "$base/api/auth/login" -BodyObj @{ email = "cursor_test@revora.com"; password = "WrongPass" }
Add-Row 5 "Wrong Password" $(if ($r5.StatusCode -eq 401) { "PASS" } else { "FAIL" }) $r5.Raw

$r6 = Invoke-ApiJson -Method Get -Uri "$base/api/leads"
Add-Row 6 "Get Leads no token" $(if ($r6.StatusCode -eq 401) { "PASS" } else { "FAIL" }) $r6.Raw

$r7 = Invoke-ApiJson -Method Get -Uri "$base/api/leads" -Headers @{ Authorization = "Bearer $global:token" }
$t7 = $false
$n7 = $r7.Raw
if ($r7.Ok -and $r7.Data.leads) {
  $arr7 = @($r7.Data.leads)
  $t7 = ($arr7 | ForEach-Object { $_.business_id -eq $global:businessId } | Where-Object { $_ -eq $false } | Measure-Object).Count -eq 0
  $n7 = "200, array (may have existing tenant leads); count=$($arr7.Count)"
}
elseif ($r7.Ok) {
  $t7 = $true
  $n7 = "200, empty leads array"
}
Add-Row 7 "Get Leads (tenant-scoped list)" $(if ($t7) { "PASS" } else { "FAIL" }) $n7

$r8 = Invoke-ApiJson -Method Post -Uri "$base/dev/simulate-message" -BodyObj @{
  phone = "919876543210"; text = "Order karna tha bhai"; businessId = $global:businessId
}
$t8 = $r8.Ok -and $r8.Data.queued -eq $true -and ($r8.Data.messageId -like "sim_*")
Add-Row 8 "Simulate Message" $(if ($t8) { "PASS" } else { "FAIL" }) $r8.Raw

$t9 = $false
$n9 = ""
for ($i = 0; $i -lt 3; $i++) {
  if ($i -gt 0) { Start-Sleep -Seconds 1 }
  $r9 = Invoke-ApiJson -Method Get -Uri "$base/api/leads" -Headers @{ Authorization = "Bearer $global:token" }
  $n9 = $r9.Raw
  if ($r9.Ok -and $r9.Data.leads) {
    $arr = @($r9.Data.leads)
    $l = $arr | Where-Object { $_.phone_number -eq "919876543210" } | Select-Object -First 1
    if ($l) {
      $t9 = $true
      $global:leadId = [string]$l.id
      $n9 = "leadId=$global:leadId (attempt $($i + 1))"
      break
    }
    elseif ($arr.Count -ge 1) { $n9 = "count=$($arr.Count) phones=$($arr[0].phone_number) (retry for 919876543210)" }
  }
}
Add-Row 9 "Get Leads after simulate (retry ingest)" $(if ($t9) { "PASS" } else { "FAIL" }) $n9

if ([string]::IsNullOrEmpty($global:leadId)) {
  Add-Row 10 "Lead Detail" "FAIL" "no leadId (deps)"
}
else {
  $r10 = Invoke-ApiJson -Method Get -Uri "$base/api/leads/$global:leadId" -Headers @{ Authorization = "Bearer $global:token" }
  $t10 = $r10.Ok -and $r10.Data.lead -and ($r10.Data.lead.business_id -eq $global:businessId)
  Add-Row 10 "Lead Detail" $(if ($t10) { "PASS" } else { "FAIL" }) $(if ($r10.Data.lead) { "business_id=$($r10.Data.lead.business_id)" } else { $r10.Raw })
}

$reg2 = @{
  email = "other_business@revora.com"; password = "Test@1234"
  business_name = "Other Business"; phone = "919222222222"
}
$r11a = Invoke-ApiJson -Method Post -Uri "$base/api/auth/register" -BodyObj $reg2
if ($r11a.Ok -and $r11a.Data.token) {
  $global:token2 = [string]$r11a.Data.token
}
elseif ($r11a.StatusCode -eq 409) {
  $r11login = Invoke-ApiJson -Method Post -Uri "$base/api/auth/login" -BodyObj @{
    email = "other_business@revora.com"; password = "Test@1234"
  }
  if ($r11login.Ok -and $r11login.Data.token) {
    $global:token2 = [string]$r11login.Data.token
  }
}

if ([string]::IsNullOrEmpty($global:leadId)) {
  Add-Row 11 "Multi-tenant isolation" "FAIL" "no leadId"
}
else {
  $r11b = Invoke-ApiJson -Method Get -Uri "$base/api/leads/$global:leadId" -Headers @{ Authorization = "Bearer $global:token2" }
  $t11 = ($r11b.StatusCode -eq 403) -or ($r11b.StatusCode -eq 404)
  Add-Row 11 "Multi-tenant isolation" $(if ($t11) { "PASS" } else { "FAIL" }) "HTTP $($r11b.StatusCode) $($r11b.Raw)"
}

if ([string]::IsNullOrEmpty($global:leadId)) {
  Add-Row 12 "Lead Messages" "FAIL" "no leadId"
}
else {
  $r12 = Invoke-ApiJson -Method Get -Uri "$base/api/leads/$global:leadId/messages" -Headers @{ Authorization = "Bearer $global:token" }
  $t12 = $false
  if ($r12.Ok -and $r12.Data.messages) {
    $m = @($r12.Data.messages) | Where-Object { $_.content -eq "Order karna tha bhai" }
    $t12 = ($null -ne $m)
  }
  Add-Row 12 "Lead Messages" $(if ($t12) { "PASS" } else { "FAIL" }) $r12.Raw
}

if ([string]::IsNullOrEmpty($global:leadId)) {
  Add-Row 13 "PATCH lead status" "FAIL" "no leadId"
}
else {
  $r13 = Invoke-ApiJson -Method Patch -Uri "$base/api/leads/$global:leadId" -Headers @{ Authorization = "Bearer $global:token" } -BodyObj @{ status = "contacted" }
  $t13 = $r13.Ok -and $r13.Data.lead.status -eq "contacted"
  Add-Row 13 "PATCH lead status" $(if ($t13) { "PASS" } else { "FAIL" }) $r13.Raw
}

$r14 = Invoke-ApiJson -Method Post -Uri "$base/ai/generate-message" -Headers @{ Authorization = "Bearer $global:token" } -BodyObj @{
  name = "Test Customer"; business_type = "food"; status = "contacted"
}
$t14 = $r14.Ok -and $r14.Data.message -and ($r14.Data.message.Length -gt 0)
Add-Row 14 "AI generate-message" $(if ($t14) { "PASS" } else { "FAIL" }) $(if ($t14) { "schema: name, business_type, status" } else { $r14.Raw })

$uniqueOnboardPhone = "91$(Get-Date -Format 'MMddHHmmss')"
$r15a = Invoke-ApiJson -Method Post -Uri "$base/api/onboard" -Headers @{ Authorization = "Bearer $global:token" } -BodyObj @{
  name = "New Customer"; phone = $uniqueOnboardPhone; email = "customer@gmail.com"; source = "whatsapp"
}
$t15a = $r15a.Ok -and ($r15a.Data.ok -eq $true) -and $r15a.Data.userId
$r15b = Invoke-ApiJson -Method Get -Uri "$base/api/leads" -Headers @{ Authorization = "Bearer $global:token" }
$c15 = 0
if ($r15b.Data.leads) { $c15 = @($r15b.Data.leads).Count }
$t15 = $t15a -and $r15b.Ok -and ($c15 -ge 2)
Add-Row 15 "Onboard + 2 leads" $(if ($t15) { "PASS" } else { "FAIL" }) "onboard_ok=$t15a leads=$c15"

Write-Host "`n=== RESULT TABLE ===`n"
$rows | Format-Table -Wrap -AutoSize
$p = ($rows | Where-Object { $_.Status -eq "PASS" }).Count
Write-Host "Count: $p/15 tests passed`n"
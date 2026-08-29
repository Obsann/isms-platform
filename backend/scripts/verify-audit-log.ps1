$ErrorActionPreference = 'SilentlyContinue'
$base = 'http://localhost:4000/api'

function Login($tenantCode, $email) {
  $body = @{ tenantCode = $tenantCode; email = $email; password = 'DevPassword!123' } | ConvertTo-Json
  (Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body $body -ContentType 'application/json').accessToken
}
function Call($token, $method, $path, $body) {
  $headers = @{ Authorization = "Bearer $token" }
  try {
    if ($body) { $r = Invoke-WebRequest -Uri "$base$path" -Method $method -Headers $headers -Body $body -ContentType 'application/json' -UseBasicParsing }
    else       { $r = Invoke-WebRequest -Uri "$base$path" -Method $method -Headers $headers -UseBasicParsing }
    return [pscustomobject]@{ Status = [int]$r.StatusCode; Body = $r.Content }
  } catch {
    $code = 0; if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    return [pscustomobject]@{ Status = $code; Body = $_.ErrorDetails.Message }
  }
}

$teller = Login 'tenant-a' 'teller@tenant-a.dev'
$admin  = Login 'tenant-a' 'admin@tenant-a.dev'
$memberId = 'e94c7f8f-2688-42ee-9046-4d5175fee4e2'

$accounts = (Call $teller 'GET' "/accounts?memberId=$memberId" $null)
$acct = ($accounts.Body | ConvertFrom-Json) | Where-Object { $_.accountType -eq 'savings' } | Select-Object -First 1
if (-not $acct) { $acct = ($accounts.Body | ConvertFrom-Json) | Select-Object -First 1 }
$accountId = $acct.id
Write-Output "account under test: $accountId ($($acct.accountType))"

$before = (( Call $admin 'GET' '/audit-logs?limit=1' $null ).Body | ConvertFrom-Json).total
Write-Output "audit rows before: $before"

# 1. A successful state-changing action must be recorded.
$ref = "VERIFY-" + (Get-Random -Maximum 99999)
$dep = Call $teller 'POST' "/accounts/$accountId/deposits" ("{""amount"":""250.00"",""reference"":""$ref"",""narration"":""Task 22 verify""}")
Write-Output "deposit status: $($dep.Status)"

$page = (( Call $admin 'GET' '/audit-logs?limit=5' $null ).Body | ConvertFrom-Json)
Write-Output "audit rows after deposit: $($page.total)"
$top = $page.items[0]
Write-Output "newest audit row -> action='$($top.action)' entity='$($top.entity)' actor='$($top.actorStaffId)' at='$($top.occurredAt)'"

# 2. A GET must NOT be recorded.
$mid = (( Call $admin 'GET' '/audit-logs?limit=1' $null ).Body | ConvertFrom-Json).total
Call $teller 'GET' "/accounts/$accountId" $null | Out-Null
$afterGet = (( Call $admin 'GET' '/audit-logs?limit=1' $null ).Body | ConvertFrom-Json).total
Write-Output "rows after a read: $mid -> $afterGet (must be unchanged)"

# 3. A rejected state change must leave no audit row (rolled back with the transaction).
$bad = Call $teller 'POST' "/accounts/$accountId/withdrawals" '{"amount":"99999999.00","reference":"VERIFY-OVERDRAW","narration":"should fail"}'
Write-Output "over-limit withdrawal status: $($bad.Status)"
$afterFail = (( Call $admin 'GET' '/audit-logs?limit=1' $null ).Body | ConvertFrom-Json).total
Write-Output "rows after a rejected write: $afterGet -> $afterFail (must be unchanged)"

# 4. A 403 must leave no audit row.
Call $teller 'DELETE' "/members/$memberId" $null | Out-Null
$afterForbidden = (( Call $admin 'GET' '/audit-logs?limit=1' $null ).Body | ConvertFrom-Json).total
Write-Output "rows after a 403: $afterFail -> $afterForbidden (must be unchanged)"

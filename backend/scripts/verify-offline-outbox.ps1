$ErrorActionPreference = 'SilentlyContinue'
$base = 'http://localhost:4000/api'

function Login($tenantCode, $email) {
  $body = @{ tenantCode = $tenantCode; email = $email; password = 'DevPassword!123' } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body $body -ContentType 'application/json'
  return $r.accessToken
}

function Call($token, $method, $path, $body) {
  $headers = @{ Authorization = "Bearer $token" }
  try {
    if ($body) {
      $r = Invoke-WebRequest -Uri "$base$path" -Method $method -Headers $headers -Body $body -ContentType 'application/json' -UseBasicParsing
    } else {
      $r = Invoke-WebRequest -Uri "$base$path" -Method $method -Headers $headers -UseBasicParsing
    }
    return [pscustomobject]@{ Status = [int]$r.StatusCode; Body = $r.Content }
  } catch {
    $code = 0
    $bodyText = $_.ErrorDetails.Message
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    return [pscustomobject]@{ Status = $code; Body = $bodyText }
  }
}

$results = @()
function Check($name, $actual, $expected) {
  $ok = if ($actual -eq $expected) { 'PASS' } else { 'FAIL' }
  $script:results += [pscustomobject]@{ Result = $ok; Check = $name; Expected = $expected; Actual = $actual }
}

$teller = Login 'tenant-a' 'teller@tenant-a.dev'
if (-not $teller) {
  Write-Error 'Login failed — is the API running and seeded?'
  exit 1
}

$search = (Call $teller 'GET' '/members?search=MEM-10001' $null)
$memberId = ($search.Body | ConvertFrom-Json).items[0].id
if (-not $memberId) {
  Write-Error 'MEM-10001 not found — run npm run seed'
  exit 1
}

$accounts = (Call $teller 'GET' "/accounts?memberId=$memberId" $null)
$accountId = ($accounts.Body | ConvertFrom-Json)[0].id
if (-not $accountId) {
  Write-Error 'No savings account for MEM-10001'
  exit 1
}

$ref = "offline-verify-$(Get-Date -Format 'yyyyMMddHHmmss')"
$amount = '12.50'
$depositBody = (@{ amount = $amount; reference = $ref; narration = 'offline outbox verify' } | ConvertTo-Json)

$first = Call $teller 'POST' "/accounts/$accountId/deposits" $depositBody
Check 'first deposit with reference succeeds' $first.Status 201

$txnId = ($first.Body | ConvertFrom-Json).id
if (-not $txnId) {
  Write-Output 'WARN: could not parse transaction id from first deposit'
}

$replay = Call $teller 'POST' "/accounts/$accountId/deposits" $depositBody
Check 'idempotent replay returns 201' $replay.Status 201

if ($txnId) {
  $replayId = ($replay.Body | ConvertFrom-Json).id
  Check 'replay returns same transaction id' $replayId $txnId
}

$conflictBody = (@{ amount = '99.99'; reference = $ref; narration = 'conflict probe' } | ConvertTo-Json)
$conflict = Call $teller 'POST' "/accounts/$accountId/deposits" $conflictBody
Check 'same reference different amount is 409' $conflict.Status 409

if ($conflict.Status -eq 409) {
  $err = $conflict.Body | ConvertFrom-Json
  Check '409 error code is SyncConflict' $err.error 'SyncConflict'
}

$results | Format-Table -AutoSize
$failed = ($results | Where-Object { $_.Result -eq 'FAIL' }).Count
Write-Output "TOTAL=$($results.Count) FAILED=$failed"
if ($failed -gt 0) { exit 1 }

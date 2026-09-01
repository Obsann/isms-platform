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
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    return [pscustomobject]@{ Status = $code; Body = $_.ErrorDetails.Message }
  }
}

$results = @()
function Check($name, $actual, $expected) {
  $ok = if ($actual -eq $expected) { 'PASS' } else { 'FAIL' }
  $script:results += [pscustomobject]@{ Result = $ok; Check = $name; Expected = $expected; Actual = $actual }
}

$teller      = Login 'tenant-a' 'teller@tenant-a.dev'
$loanOfficer = Login 'tenant-a' 'loan-officer@tenant-a.dev'
$admin       = Login 'tenant-a' 'admin@tenant-a.dev'
$superAdmin  = Login 'platform' 'superadmin@platform.dev'
$member      = Login 'tenant-a' 'abebe.bikila@tenant-a.dev'

Write-Output "--- tokens: teller=$($teller.Length -gt 0) lo=$($loanOfficer.Length -gt 0) admin=$($admin.Length -gt 0) super=$($superAdmin.Length -gt 0) member=$($member.Length -gt 0)"

# Loan approval: loan-officer and tenant-admin only
$loans = (Call $loanOfficer 'GET' '/loans' $null)
$loanId = ($loans.Body | ConvertFrom-Json).items[0].id
if (-not $loanId) { $loanId = '00000000-0000-0000-0000-000000000001' }

Check 'teller CANNOT approve a loan'            (Call $teller      'PATCH' "/loans/$loanId/approve" '{"decision":"approved"}').Status 403
Check 'member CANNOT approve a loan'            (Call $member      'PATCH' "/loans/$loanId/approve" '{"decision":"approved"}').Status 403
Check 'teller CANNOT disburse a loan'           (Call $teller      'POST'  "/loans/$loanId/disburse" '{"accountId":"x"}').Status 403

# Platform tenant provisioning: super-admin only
Check 'teller CANNOT list platform tenants'     (Call $teller      'GET' '/platform/tenants' $null).Status 403
Check 'tenant-admin CANNOT list platform tenants' (Call $admin     'GET' '/platform/tenants' $null).Status 403
Check 'super-admin CAN list platform tenants'   (Call $superAdmin  'GET' '/platform/tenants' $null).Status 200

# Audit log read: tenant-admin and super-admin only
Check 'teller CANNOT read the audit log'        (Call $teller      'GET' '/audit-logs' $null).Status 403
Check 'loan-officer CANNOT read the audit log'  (Call $loanOfficer 'GET' '/audit-logs' $null).Status 403
Check 'tenant-admin CAN read the audit log'     (Call $admin       'GET' '/audit-logs' $null).Status 200

# Members
Check 'member CANNOT search members'            (Call $member      'GET'  '/members' $null).Status 403
Check 'teller CAN search members'               (Call $teller      'GET'  '/members' $null).Status 200
Check 'loan-officer CANNOT create a member'     (Call $loanOfficer 'POST' '/members' '{"firstName":"X"}').Status 403
Check 'teller CANNOT delete a member'           (Call $teller      'DELETE' '/members/00000000-0000-0000-0000-000000000001' $null).Status 403

# Reports (Task 20)
Check 'member CANNOT read savings summary'      (Call $member      'GET' '/reports/savings-summary' $null).Status 403
Check 'teller CANNOT read savings summary'      (Call $teller      'GET' '/reports/savings-summary' $null).Status 403
Check 'tenant-admin CAN read savings summary'   (Call $admin       'GET' '/reports/savings-summary' $null).Status 200
Check 'tenant-admin CAN read trial balance'     (Call $admin       'GET' '/reports/trial-balance' $null).Status 200
Check 'teller CAN read recent transactions'     (Call $teller      'GET' '/reports/recent-transactions' $null).Status 200

# Guard must run before business logic: a forbidden role on a nonexistent id is 403, never 404
Check 'guard rejects before handler (403 not 404)' (Call $teller 'DELETE' '/members/11111111-1111-1111-1111-111111111111' $null).Status 403

# No token at all
Check 'anonymous request is rejected'           (Call 'garbage' 'GET' '/members' $null).Status 401

$results | Format-Table -AutoSize
$failed = ($results | Where-Object { $_.Result -eq 'FAIL' }).Count
Write-Output "TOTAL=$($results.Count) FAILED=$failed"

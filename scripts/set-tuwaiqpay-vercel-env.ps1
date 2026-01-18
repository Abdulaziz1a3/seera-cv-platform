param(
    [string]$Environment = "production"
)

$vars = @(
    "TUWAIQPAY_BASE_URL",
    "TUWAIQPAY_USERNAME",
    "TUWAIQPAY_USER_NAME_TYPE",
    "TUWAIQPAY_PASSWORD",
    "TUWAIQPAY_WEBHOOK_HEADER_NAME",
    "TUWAIQPAY_WEBHOOK_HEADER_VALUE",
    "TUWAIQPAY_LANGUAGE"
)

Write-Host "Setting TuwaiqPay env vars for Vercel environment: $Environment"
Write-Host "You will be prompted for each value. Nothing is stored on disk."

foreach ($var in $vars) {
    if ($var -eq "TUWAIQPAY_PASSWORD") {
        $secure = Read-Host "Enter $var" -AsSecureString
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        try {
            $value = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
        } finally {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        }
    } else {
        $value = Read-Host "Enter $var"
    }

    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Host "Skipping $var (empty)" -ForegroundColor Yellow
        continue
    }

    $value | vercel env add $var $Environment
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to set $var" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Done. You can repeat with -Environment preview or development if needed."

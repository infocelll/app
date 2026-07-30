param([string]$filePath)
$content = Get-Content $filePath -Raw
$match = [regex]::Match($content, 'var _MANUAL_B64="(.*?)"(?:\s*;|\s*$)', [System.Text.RegularExpressions.RegexOptions]::Singleline)
if($match.Success) {
    $b64 = $match.Groups[1].Value
    $bytes = [System.Convert]::FromBase64String($b64)
    $decoded = [System.Text.Encoding]::UTF8.GetString($bytes)
    Set-Content -Path "C:\Users\Infocelll\Desktop\InfoCell Dashboard\v12\_manual_utf8.html" -Value $decoded -Encoding UTF8
    Write-Host "Saved. Length: $($decoded.Length)"
} else {
    Write-Host "NO MATCH"
}

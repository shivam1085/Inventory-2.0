<#
Create a release ZIP of the app build, excluding `user_data`.

This script copies the Source to a temporary folder (excluding `user_data`), compresses it,
then removes the temporary folder.

Usage:
PS> .\create-release-zip.ps1
PS> .\create-release-zip.ps1 -Source 'D:\AJ-New\AJ Autoparts Inventory-win32-x64' -OutZip 'D:\AJ-update.zip'
#>
param(
    [string]$Source = "d:\Dev\Inventory 2.0\dist\AJ Autoparts Inventory-win32-x64",
    [string]$OutZip = "d:\Dev\Inventory 2.0\AJ-Autoparts-update.zip"
)

if(-not (Test-Path $Source)){
    Write-Error "Source path not found: $Source"
    exit 1
}

$tmp = Join-Path $env:TEMP ([IO.Path]::GetRandomFileName())
Write-Host "Creating temp folder: $tmp"
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

# Copy excluding user_data
Write-Host "Copying files (excluding user_data) to temp"
$robocopyCmd = Get-Command robocopy -ErrorAction SilentlyContinue
if($robocopyCmd){
    robocopy "$Source" "$tmp" /MIR /XD "user_data" /R:2 /W:2 | Out-Null
    if($LASTEXITCODE -gt 7){ Write-Warning "robocopy returned code $LASTEXITCODE. Continue?" }
} else {
    Write-Warning "robocopy not found; using Copy-Item fallback (may not mirror deletions)."
    try{
        Get-ChildItem -Path $Source -Force | Where-Object { $_.Name -ne 'user_data' } | ForEach-Object {
            $src = $_.FullName
            $dest = Join-Path $tmp $_.Name
            if(Test-Path $src -PathType Container){
                Copy-Item -Path $src -Destination $dest -Recurse -Force
            } else {
                Copy-Item -Path $src -Destination $dest -Force
            }
        }
    } catch { Write-Warning "Copy-Item fallback failed: $_" }
}

# Create ZIP
Write-Host "Creating ZIP: $OutZip"
if(Test-Path $OutZip){ Remove-Item $OutZip -Force }
Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath $OutZip -Force

Write-Host "ZIP created: $OutZip"

# Cleanup temp
Write-Host "Removing temp folder"
Remove-Item -Path $tmp -Recurse -Force
Write-Host "Done."
<#
Safe update script for AJ Autoparts Inventory desktop app.

Default behavior:
- Backs up existing `user_data` from the target (if present)
- Copies new app files from `Source` to `Target` using `robocopy`, excluding `user_data`
- Leaves `user_data` untouched so local data is preserved

Usage examples:
PS> .\update-app.ps1
PS> .\update-app.ps1 -Source 'D:\AJ-New\AJ Autoparts Inventory-win32-x64' -Target 'C:\Program Files\AJ Autoparts Inventory'

Requires: PowerShell (5.1 or later) and robocopy (available on Windows)
#>
param(
    [string]$Source = "d:\Dev\Inventory 2.0\dist\AJ Autoparts Inventory-win32-x64",
    [string]$Target = "C:\Program Files\AJ Autoparts Inventory",
    [string]$BackupRoot = "C:\Program Files\AJ Autoparts Inventory\backups",
    [switch]$ForceRun
)

function ExitWith($code, $msg){ Write-Host $msg; exit $code }

# Confirm source exists
if(-not (Test-Path $Source)){
    ExitWith 1 "Source path not found: $Source`nPlease adjust the -Source parameter."
}

# Ensure target folder exists
if(-not (Test-Path $Target)){
    Write-Host "Target folder does not exist. Creating: $Target"
    New-Item -ItemType Directory -Path $Target -Force | Out-Null
}

# If app is running, ask user to close it (or force stop if -ForceRun)
$exeName = 'AJ Autoparts Inventory.exe'
$running = Get-CimInstance Win32_Process | Where-Object { $_.Name -ieq $exeName -or ($_.CommandLine -like "*$exeName*") }
if($running){
    Write-Host "Detected running app processes."
    if(-not $ForceRun){
        Write-Host "Please close the app before updating. Rerun with -ForceRun to attempt force-stop."
        ExitWith 2 "Aborting to avoid file-in-use errors."
    } else {
        Write-Host "Force-stopping detected processes..."
        foreach($p in $running){
            try { Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop; Write-Host "Stopped PID $($p.ProcessId)" } catch { Write-Warning "Failed to stop PID $($p.ProcessId): $_" }
        }
        Start-Sleep -Seconds 1
    }
}

# Backup user_data if present
$userDataPath = Join-Path $Target 'user_data'
$backupPath = $null
if(Test-Path $userDataPath){
    $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backupPath = Join-Path $BackupRoot "user_data-backup-$ts"
    Write-Host "Backing up existing user_data to: $backupPath"
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    # Prefer robocopy for reliable mirroring; fallback to Copy-Item if unavailable
    $robocopyCmd = Get-Command robocopy -ErrorAction SilentlyContinue
    if($robocopyCmd){
        robocopy "$userDataPath" "$backupPath" /MIR /COPY:DAT /R:2 /W:2 | Out-Null
    } else {
        Write-Warning "robocopy not found; using Copy-Item for backup (may not mirror deletions)."
        try {
            Copy-Item -Path (Join-Path $userDataPath '*') -Destination $backupPath -Recurse -Force -ErrorAction Stop
        } catch { Write-Warning "Backup via Copy-Item failed: $_" }
    }
    Write-Host "Backup complete."
} else {
    Write-Host "No existing user_data folder found in target."
}

# Use robocopy to mirror source -> target but exclude user_data
Write-Host "Copying files from Source -> Target (excluding 'user_data')"
# /MIR mirrors. /XD excludes directories.
# If robocopy available, use it for a mirror. Otherwise fallback to Copy-Item.
$robocopyCmd = Get-Command robocopy -ErrorAction SilentlyContinue
if($robocopyCmd){
    $robocmd = @($Source, $Target, '/MIR', '/XD', 'user_data', '/R:2', '/W:2')
    $rc = & robocopy @robocmd
    # robocopy returns codes; 0-7 are OK-ish. We'll treat >7 as failure.
    $lastExit = $LASTEXITCODE
    if($lastExit -gt 7){
        Write-Warning "robocopy failed with exit code $lastExit"
        ExitWith 3 "Update failed during file copy."
    }
} else {
    Write-Warning "robocopy not found; falling back to PowerShell Copy-Item. This will copy/overwrite files but will not remove deleted files from the target."
    try{
        # Copy all items from source except the user_data folder
        Get-ChildItem -Path $Source -Force | Where-Object { $_.Name -ne 'user_data' } | ForEach-Object {
            $src = $_.FullName
            $dest = Join-Path $Target $_.Name
            if(Test-Path $src -PathType Container){
                Copy-Item -Path $src -Destination $dest -Recurse -Force
            } else {
                Copy-Item -Path $src -Destination $dest -Force
            }
        }
        $lastExit = 0
    } catch {
        Write-Warning "Copy-Item fallback failed: $_"
        ExitWith 3 "Update failed during file copy."
    }
}

Write-Host "Update copied successfully. `nNote: Existing 'user_data' was preserved (not overwritten)."
Write-Host "You can now start the app from: $Target\$exeName"

# Optional: show backup location if created
if($backupPath -and (Test-Path $backupPath)){ Write-Host "Backup available at: $backupPath" }

Write-Host "Done."
<#
Simple Windows build script.
Usage:
  ./build.ps1          # creates .venv, installs pyinstaller, builds one-file EXE
  ./build.ps1 -Rebuild # cleans build artifacts then builds
#>
param(
    [switch]$Rebuild
)

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python not found. Install Python 3.8+ and ensure 'python' is on PATH."
    exit 1
}

if (-not (Test-Path .venv)) {
    python -m venv .venv
}

# Use the venv's python.exe when available so we don't depend on Activate.ps1
$venvPython = Join-Path (Resolve-Path .venv) 'Scripts\python.exe' -ErrorAction SilentlyContinue
if (Test-Path $venvPython) {
    $pythonCmd = $venvPython
} else {
    $pythonCmd = 'python'
}

Write-Host "Using Python: $pythonCmd"
Write-Host "Installing/Upgrading build tools..."
& $pythonCmd -m pip install --upgrade pip pyinstaller

if ($Rebuild) {
    Write-Host "Cleaning previous build artifacts..."
    Remove-Item -Recurse -Force build,dist,*.spec -ErrorAction SilentlyContinue
}

Write-Host "Building single-file executable..."
& $pythonCmd -m PyInstaller --noconsole --onefile main.py

if (Test-Path .\dist\main.exe) {
    Write-Host "Build complete: .\dist\main.exe"
} else {
    Write-Error "Build failed. Check PyInstaller output above."
}

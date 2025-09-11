Write-Host "====================================" -ForegroundColor Green
Write-Host " Interactive Story Game - Build Script" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

Write-Host "[1/4] Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

Write-Host "[2/4] Installing/updating dependencies..." -ForegroundColor Yellow
npm install

Write-Host "[3/4] Building Windows executable..." -ForegroundColor Yellow
npm run build-win

Write-Host "[4/4] Copying to releases folder..." -ForegroundColor Yellow
$version = Get-Date -Format "yyyy-MM-dd"
$releaseFolder = "..\interactive-story-releases\v$version"

if (!(Test-Path $releaseFolder)) {
    New-Item -ItemType Directory -Path $releaseFolder -Force
}

Write-Host "Copying executable to $releaseFolder..." -ForegroundColor Cyan
Copy-Item -Path "dist\win-unpacked\*" -Destination $releaseFolder -Recurse -Force

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host " Build Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your game executable is ready at:" -ForegroundColor White
Write-Host "$releaseFolder\Interactive Story Game.exe" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can share the entire folder: $releaseFolder" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"

@echo off
echo ====================================
echo  Interactive Story Creator Studio
echo ====================================
echo.
echo Choose an option:
echo.
echo 1. Create new story (CLI)
echo 2. Open Story Creator Studio (GUI)
echo 3. Build game for distribution
echo 4. Test current stories
echo 5. Open development guide
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Starting Story Creator CLI...
    node story-creator-cli.js
) else if "%choice%"=="2" (
    echo.
    echo Opening Story Creator Studio...
    start "" "%~dp0story-creator.html"
) else if "%choice%"=="3" (
    echo.
    echo Building game...
    npm run build-win
    echo.
    echo Build complete! Check the dist folder.
) else if "%choice%"=="4" (
    echo.
    echo Testing stories...
    npm start
) else if "%choice%"=="5" (
    echo.
    echo Opening development guide...
    start "" "DEVELOPMENT_GUIDE.md"
) else (
    echo Invalid choice. Please try again.
    pause
    goto :eof
)

echo.
pause

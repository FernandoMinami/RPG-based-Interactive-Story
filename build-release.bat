@echo off
echo ====================================
echo  Interactive Story Game - Build Script
echo ====================================
echo.

echo [1/4] Cleaning previous builds...
if exist "dist\" rmdir /s /q "dist\"

echo [2/4] Installing/updating dependencies...
call npm install

echo [3/4] Building Windows executable...
call npm run build-win

echo [4/4] Copying to releases folder...
set VERSION=%date:~10,4%-%date:~4,2%-%date:~7,2%
set RELEASE_FOLDER="..\interactive-story-releases\v%VERSION%"

if not exist "%RELEASE_FOLDER%" mkdir "%RELEASE_FOLDER%"

echo Copying executable to %RELEASE_FOLDER%...
xcopy "dist\win-unpacked\*" "%RELEASE_FOLDER%\" /E /I /Y

echo.
echo ====================================
echo  Build Complete!
echo ====================================
echo.
echo Your game executable is ready at:
echo %RELEASE_FOLDER%\Interactive Story Game.exe
echo.
echo You can share the entire folder: %RELEASE_FOLDER%
echo.
pause

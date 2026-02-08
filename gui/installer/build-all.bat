@echo off
REM POIDH Autonomous Bounty Bot - Cross-Platform Installer Builder (Windows)
REM Orchestrates building and packaging for Windows

setlocal enabledelayedexpansion

for %%I in ("%~dp0..\.") do set PROJECT_ROOT=%%~fI
set GUI_DIR=%PROJECT_ROOT%\gui
set INSTALLER_DIR=%GUI_DIR%\installer
set RELEASE_DIR=%PROJECT_ROOT%\releases

REM Extract version from package.json
for /f "tokens=2 delims=:" %%A in ('findstr "version" "%PROJECT_ROOT%\package.json" ^| findstr /v "engines"') do (
  set VERSION=%%A
  for /f "tokens=1 delims=, " %%B in ("!VERSION!") do (
    set VERSION=%%B
  )
  goto :version_done
)
:version_done
set VERSION=%VERSION:"=%
set VERSION=%VERSION% =% 

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║         POIDH Autonomous Bot - Windows Installer Builder           ║
echo ║                       Version: %VERSION%                              ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

echo 📦 Detected platform: Windows
echo.

if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"

echo ═══════════════════════════════════════════════════════════════════
echo Step 1: Building PyInstaller Executable
echo ═══════════════════════════════════════════════════════════════════
echo.

echo 🔨 Building Windows executable...
call "%GUI_DIR%\build.bat"

if errorlevel 1 (
  echo ❌ Build failed
  exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════════
echo Step 2: Creating Windows Installer
echo ═══════════════════════════════════════════════════════════════════
echo.

REM Check if NSIS is installed
where makensis >nul 2>&1
if %errorlevel% neq 0 (
  echo ⚠️  NSIS not found
  echo.
  echo To create Windows installer:
  echo   1. Install NSIS from: https://nsis.sourceforge.io/
  echo   2. Run: makensis /D PROJECT_ROOT="%PROJECT_ROOT%" /D VERSION="%VERSION%" "%INSTALLER_DIR%\windows.nsi"
  echo.
) else (
  echo 🪟 Creating NSIS installer...
  makensis /D PROJECT_ROOT="%PROJECT_ROOT%" /D VERSION="%VERSION%" "%INSTALLER_DIR%\windows.nsi"
  
  if errorlevel 1 (
    echo ❌ NSIS build failed
  ) else (
    echo ✅ Windows installer created
  )
)

echo.
echo ═══════════════════════════════════════════════════════════════════
echo Build Summary
echo ═══════════════════════════════════════════════════════════════════
echo.

if exist "%RELEASE_DIR%" (
  echo 📦 Release artifacts:
  for %%F in ("%RELEASE_DIR%\*") do (
    for /F "usebackq" %%A in ('%%~zF') do (
      echo   %%~nxF ^(%%A bytes^)
    )
  )
  echo.
  echo 📍 Location: %RELEASE_DIR%
) else (
  echo ⚠️  No releases directory found
)

echo.
echo ✅ Build process complete!
echo.
echo Next steps:
echo   1. Test installer on Windows
echo   2. Upload releases to GitHub
echo   3. Create release notes
echo.

pause

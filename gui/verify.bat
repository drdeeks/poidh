@echo off
REM POIDH GUI Verification Script for Windows

echo.
echo 0x09 POIDH GUI Verification
echo ================================================================================
echo.

setlocal enabledelayedexpansion

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found
    exit /b 1
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PY_VER=%%i
    echo ✅ Python !PY_VER! found
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found
    exit /b 1
) else (
    for /f %%i in ('node --version') do set NODE_VER=%%i
    echo ✅ Node.js !NODE_VER! found
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found
    exit /b 1
) else (
    for /f %%i in ('npm --version') do set NPM_VER=%%i
    echo ✅ npm !NPM_VER! found
)

echo.
echo 📦 Checking project setup...

REM Check .env
if exist .env (
    echo ✅ .env file found
) else (
    echo ⚠️ .env not found ^(create with wallet create command^)
)

REM Check node_modules
if exist node_modules (
    echo ✅ Node.js dependencies installed
) else (
    echo ❌ node_modules not found - run: npm install
    exit /b 1
)

REM Check GUI files
echo.
echo 🎯 Checking GUI/CLI files...

if exist gui\poidh_gui.py (
    echo ✅ gui\poidh_gui.py found
) else (
    echo ❌ gui\poidh_gui.py missing
    exit /b 1
)

if exist gui\cli.py (
    echo ✅ gui\cli.py found
) else (
    echo ❌ gui\cli.py missing
    exit /b 1
)

if exist gui\setup.py (
    echo ✅ gui\setup.py found
) else (
    echo ❌ gui\setup.py missing
    exit /b 1
)

echo.
echo ================================================================================
echo.
echo ✅ Verification complete! You're ready to go.
echo.
echo Next steps:
echo   • Install Python dependencies:  pip install -r gui\requirements.txt
echo   • Start GUI:                     python gui\poidh_gui.py
echo   • Use CLI:                       python gui\cli.py --help
echo   • Quick start:                   Check gui\QUICKSTART.md
echo.

endlocal

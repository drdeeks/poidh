@echo off
REM Build standalone POIDH GUI executable for Windows

setlocal enabledelayedexpansion

echo 🔨 Building POIDH GUI...

REM Get project root
for %%I in ("%~dp0..") do set PROJECT_ROOT=%%~fI
set GUI_DIR=%PROJECT_ROOT%\gui

echo Project root: %PROJECT_ROOT%
echo GUI directory: %GUI_DIR%

REM Install Python dependencies
echo 📦 Installing Python dependencies...
pip install -r "%GUI_DIR%\requirements.txt"
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

REM Build with PyInstaller
echo 🏗️  Building executable...
cd /d "%GUI_DIR%"

pyinstaller --onefile --windowed ^
    --add-data "%PROJECT_ROOT%;." ^
    --name "POIDH-Bot-GUI" ^
    poidh_gui.py

if errorlevel 1 (
    echo ❌ Build failed
    exit /b 1
)

echo.
echo ✅ Windows executable created: dist\POIDH-Bot-GUI.exe
echo.
echo 🎉 Build complete!
echo Run with: dist\POIDH-Bot-GUI.exe

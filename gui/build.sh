#!/bin/bash
# Build standalone POIDH GUI executable

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GUI_DIR="$PROJECT_ROOT/gui"

echo "🔨 Building POIDH GUI..."
echo "Project root: $PROJECT_ROOT"
echo "GUI directory: $GUI_DIR"

# Check if poidh_gui.py exists
if [ ! -f "$GUI_DIR/poidh_gui.py" ]; then
  echo "❌ poidh_gui.py not found in $GUI_DIR"
  exit 1
fi

# Check if requirements.txt exists
if [ ! -f "$GUI_DIR/requirements.txt" ]; then
  echo "❌ requirements.txt not found in $GUI_DIR"
  exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r "$GUI_DIR/requirements.txt"

# Build with PyInstaller
echo "🏗️  Building executable..."
cd "$GUI_DIR"

# Create releases directory for later use
mkdir -p "$PROJECT_ROOT/releases"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    pyinstaller --onefile --windowed \
        --add-data "${PROJECT_ROOT}:/." \
        --name "POIDH-Bot-GUI" \
        poidh_gui.py
    echo "✅ macOS app created: dist/POIDH-Bot-GUI"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    pyinstaller --onefile --windowed \
        --add-data "${PROJECT_ROOT};." \
        --name "POIDH-Bot-GUI" \
        poidh_gui.py
    echo "✅ Windows executable created: dist/POIDH-Bot-GUI.exe"
else
    # Linux
    pyinstaller --onefile \
        --add-data "${PROJECT_ROOT}:/." \
        --name "POIDH-Bot-GUI" \
        poidh_gui.py
    echo "✅ Linux executable created: dist/POIDH-Bot-GUI"
fi

echo ""
echo "🎉 Build complete!"
echo "Run with: ./dist/POIDH-Bot-GUI"

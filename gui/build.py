#!/usr/bin/env python3
"""
Build standalone executable for POIDH Bounty Bot GUI
Packages Python GUI + Node.js bot into a single executable
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path
import PyInstaller.__main__

# Paths
ROOT_DIR = Path(__file__).parent.parent
GUI_DIR = Path(__file__).parent
DIST_DIR = ROOT_DIR / 'dist'
BUILD_DIR = ROOT_DIR / 'gui_build'

def clean_build_files():
    """Clean previous build artifacts"""
    print("Cleaning previous builds...")
    for d in [BUILD_DIR, DIST_DIR / 'poidh-bot-gui']:
        if d.exists():
            shutil.rmtree(d)
            print(f"  Removed {d}")

def build_typescript():
    """Build TypeScript bot"""
    print("\nBuilding TypeScript application...")
    result = subprocess.run(
        ['npm', 'run', 'build'],
        cwd=str(ROOT_DIR),
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"  ❌ Failed to build TypeScript:\n{result.stderr}")
        return False
    print("  ✅ TypeScript built successfully")
    return True

def build_gui_executable():
    """Build GUI executable with PyInstaller"""
    print("\nBuilding GUI executable with PyInstaller...")
    
    # Prepare arguments for PyInstaller
    args = [
        str(GUI_DIR / 'main.py'),
        '--name=poidh-bot-gui',
        '--onefile',  # Single executable
        '--windowed',  # No console window
        '--icon=' + str(GUI_DIR / 'icon.ico') if (GUI_DIR / 'icon.ico').exists() else '',
        f'--distpath={DIST_DIR}',
        f'--buildpath={BUILD_DIR}',
        f'--specpath={BUILD_DIR}',
        '--hidden-import=PyQt6',
        '--hidden-import=PyQt6.QtCore',
        '--hidden-import=PyQt6.QtGui',
        '--hidden-import=PyQt6.QtWidgets',
        '--hidden-import=PyQt6.QtWebEngineWidgets',
    ]
    
    # Filter out empty strings
    args = [arg for arg in args if arg]
    
    try:
        PyInstaller.__main__.run(args)
        print("  ✅ GUI executable built successfully")
        return True
    except Exception as e:
        print(f"  ❌ Failed to build GUI: {e}")
        return False

def bundle_nodejs():
    """Bundle Node.js application with GUI"""
    print("\nBundling Node.js application...")
    
    exe_path = DIST_DIR / 'poidh-bot-gui' / 'poidh-bot-gui.exe'
    if not exe_path.exists():
        exe_path = DIST_DIR / 'poidh-bot-gui'  # On Linux/Mac
    
    if not exe_path.exists():
        print(f"  ❌ GUI executable not found at {exe_path}")
        return False
    
    # Create app directory
    app_dir = DIST_DIR / 'poidh-bot-gui'
    app_dir.mkdir(exist_ok=True)
    
    # Copy Node.js bot files
    print("  Copying Node.js bot files...")
    
    # Copy essential files
    files_to_copy = [
        'src',
        'dist',
        'web',
        'package.json',
        'package-lock.json',
        '.env.example',
        'README.md',
        'PROOF_OF_AUTONOMY.md',
    ]
    
    for item in files_to_copy:
        src = ROOT_DIR / item
        dst = app_dir / item
        
        if src.exists():
            if src.is_dir():
                if dst.exists():
                    shutil.rmtree(dst)
                shutil.copytree(src, dst)
            else:
                shutil.copy2(src, dst)
            print(f"    ✓ Copied {item}")
    
    # Create launcher script
    launcher_script = app_dir / 'launcher.sh'
    launcher_script.write_text('''#!/bin/bash
    cd "$(dirname "$0")"
    npm install
    npm run build
    npm start
    ''')
    launcher_script.chmod(0o755)
    
    print("  ✅ Node.js files bundled successfully")
    return True

def create_installer_script():
    """Create installation script"""
    print("\nCreating installation script...")
    
    installer = DIST_DIR / 'poidh-bot-gui' / 'INSTALL.md'
    installer.write_text("""# POIDH Autonomous Bounty Bot - Installation

## Quick Start

1. **Download** the application from the releases page
2. **Extract** the archive to your desired location
3. **Run** `poidh-bot-gui.exe` (Windows) or `poidh-bot-gui` (Mac/Linux)
4. **Configure** wallet and settings in the GUI
5. **Start** creating bounties!

## First Time Setup

1. **Wallet Setup**
   - Click the "Wallet" tab
   - Click "Generate New Wallet" or import an existing one
   - Save the private key securely

2. **Configure**
   - Click the "Configuration" tab
   - Set your RPC endpoints and API keys
   - Click "Save Configuration"

3. **Create Bounty**
   - Click the "Agent" tab
   - Select a pre-built bounty or create a custom one
   - Monitor on the "Dashboard" tab

## Requirements

- Node.js 18+ (included in standalone version)
- Internet connection
- Small amount of cryptocurrency for bounty rewards

## Troubleshooting

See the embedded help or visit: https://github.com/drdeeks/poidh

## License

MIT License - See LICENSE file for details
""")
    
    print("  ✅ Installation script created")

def main():
    """Main build process"""
    print("═" * 70)
    print("POIDH Autonomous Bounty Bot - GUI Build Process")
    print("═" * 70)
    
    # Clean previous builds
    clean_build_files()
    
    # Build TypeScript
    if not build_typescript():
        print("\n❌ Build failed at TypeScript compilation")
        sys.exit(1)
    
    # Build GUI
    if not build_gui_executable():
        print("\n❌ Build failed at GUI compilation")
        sys.exit(1)
    
    # Bundle Node.js
    if not bundle_nodejs():
        print("\n❌ Build failed at Node.js bundling")
        sys.exit(1)
    
    # Create installer script
    create_installer_script()
    
    print("\n" + "═" * 70)
    print("✅ BUILD COMPLETE!")
    print("═" * 70)
    print(f"\nOutput: {DIST_DIR / 'poidh-bot-gui'}")
    print("\nNext steps:")
    print("1. Package the dist/poidh-bot-gui folder")
    print("2. Create installer (optional)")
    print("3. Distribute to users")
    print("\n" + "═" * 70)

if __name__ == '__main__':
    main()

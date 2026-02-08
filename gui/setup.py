#!/usr/bin/env python3
"""
Setup script for POIDH GUI - Installs dependencies and validates environment
"""

import sys
import subprocess
import json
from pathlib import Path


def run_cmd(cmd: str, check: bool = True) -> bool:
    """Run command and return success status"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        if check and result.returncode != 0:
            print(f"❌ Command failed: {cmd}")
            print(result.stderr)
            return False
        return True
    except subprocess.TimeoutExpired:
        print(f"⏱️  Timeout: {cmd}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def check_python():
    """Check Python version"""
    print("📦 Checking Python version...")
    try:
        version = sys.version_info
        if version.major < 3 or (version.major == 3 and version.minor < 8):
            print(f"❌ Python 3.8+ required (found {version.major}.{version.minor})")
            return False
        print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def check_nodejs():
    """Check Node.js installation"""
    print("📦 Checking Node.js...")
    if not run_cmd("node --version", check=False):
        print("❌ Node.js not found. Install from https://nodejs.org/")
        return False
    
    if not run_cmd("npm --version", check=False):
        print("❌ npm not found")
        return False
    
    print("✅ Node.js and npm installed")
    return True


def check_dependencies():
    """Check project dependencies"""
    print("📦 Checking dependencies...")
    
    project_root = Path(__file__).parent.parent
    
    # Check Node.js dependencies
    if not (project_root / 'node_modules').exists():
        print("⚠️  npm dependencies not installed. Installing...")
        if not run_cmd(f"npm install", check=True):
            return False
        print("✅ npm dependencies installed")
    else:
        print("✅ npm dependencies found")
    
    return True


def install_python_deps():
    """Install Python GUI dependencies"""
    print("📦 Installing Python dependencies...")
    
    gui_dir = Path(__file__).parent
    req_file = gui_dir / 'requirements.txt'
    
    if not req_file.exists():
        print(f"❌ {req_file} not found")
        return False
    
    # Try with --break-system-packages first (for Ubuntu 23.10+)
    if not run_cmd(f"pip install -r {req_file} --break-system-packages", check=False):
        # Try with --user flag for managed environments
        if not run_cmd(f"pip install -r {req_file} --user", check=False):
            # Try with venv
            print("⚠️  Using virtual environment...")
            if not run_cmd(f"python3 -m venv gui/venv", check=False):
                print("❌ Failed to create virtual environment")
                return False
            
            if not run_cmd(f"gui/venv/bin/pip install -r {req_file}", check=False):
                print("❌ Failed to install Python dependencies")
                return False
            
            print("✅ Python dependencies installed in virtual environment")
            print("⚠️  To use GUI, activate venv: source gui/venv/bin/activate")
            return True
    
    print("✅ Python dependencies installed")
    return True


def verify_environment():
    """Verify complete environment setup"""
    print("\n🔍 Verifying environment...")
    
    checks = {
        "Python version": check_python(),
        "Node.js/npm": check_nodejs(),
        "Project dependencies": check_dependencies(),
        "Python GUI dependencies": install_python_deps(),
    }
    
    print("\n" + "=" * 60)
    print("Setup Summary:")
    print("=" * 60)
    
    for check_name, passed in checks.items():
        status = "✅" if passed else "❌"
        print(f"{status} {check_name}")
    
    if all(checks.values()):
        print("\n✅ Setup complete! You can now run:")
        print("   python gui/poidh_gui.py          # GUI application")
        print("   python gui/cli.py --help         # CLI tools")
        print("   npm run gui:build                # Build standalone executable")
        return 0
    else:
        print("\n❌ Setup failed. Please fix errors above.")
        return 1


if __name__ == '__main__':
    sys.exit(verify_environment())

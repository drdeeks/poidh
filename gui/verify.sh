#!/bin/bash
# Verify POIDH GUI installation and readiness

set -e

echo "🔍 POIDH GUI Verification"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅${NC} $1"; }
fail() { echo -e "${RED}❌${NC} $1"; }
warn() { echo -e "${YELLOW}⚠️ ${NC} $1"; }

# Check Python
if command -v python3 &> /dev/null; then
    VERSION=$(python3 --version | awk '{print $2}')
    pass "Python $VERSION found"
else
    fail "Python 3 not found"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    VERSION=$(node --version | sed 's/v//')
    pass "Node.js $VERSION found"
else
    fail "Node.js not found"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    VERSION=$(npm --version)
    pass "npm $VERSION found"
else
    fail "npm not found"
    exit 1
fi

# Check git
if command -v git &> /dev/null; then
    pass "Git installed"
else
    warn "Git not found (optional)"
fi

echo ""
echo "📦 Checking project setup..."

# Check .env
if [ -f .env ]; then
    pass ".env file found"
    
    if grep -q "CHAIN_ID" .env; then
        CHAIN=$(grep "CHAIN_ID" .env | cut -d'=' -f2)
        pass "CHAIN_ID set to: $CHAIN"
    else
        warn ".env exists but CHAIN_ID not set"
    fi
else
    warn ".env not found (create with wallet create command)"
fi

# Check node_modules
if [ -d node_modules ]; then
    pass "Node.js dependencies installed"
else
    fail "node_modules not found - run: npm install"
    exit 1
fi

# Check Python packages
echo ""
echo "📚 Checking Python packages..."

for package in PyQt5 dotenv requests; do
    if python3 -c "import ${package}" 2>/dev/null; then
        pass "$package installed"
    else
        fail "$package missing - run: pip install -r gui/requirements.txt"
        exit 1
    fi
done

echo ""
echo "🎯 Checking GUI/CLI files..."

FILES=("gui/poidh_gui.py" "gui/cli.py" "gui/setup.py")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        pass "$file found"
    else
        fail "$file missing"
        exit 1
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✅ Verification complete! You're ready to go."
echo ""
echo "Next steps:"
echo "  • Start GUI:  python3 gui/poidh_gui.py"
echo "  • Use CLI:    python3 gui/cli.py --help"
echo "  • Quick start: Check gui/QUICKSTART.md"
echo ""

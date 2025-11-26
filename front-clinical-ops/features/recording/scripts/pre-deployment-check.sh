#!/bin/bash

# Pre-deployment checklist script for offline recording feature
# Run this before deploying to staging or production

set -e

echo "🚀 Pre-Deployment Checklist for Offline Recording Feature"
echo "=========================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to print check result
check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} $2"
        ((CHECKS_FAILED++))
    fi
}

# Function to print warning
check_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. Checking Node.js and npm..."
if command -v node &> /dev/null && command -v npm &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    check_result 0 "Node.js $NODE_VERSION and npm $NPM_VERSION installed"
else
    check_result 1 "Node.js or npm not found"
fi

echo ""
echo "2. Checking dependencies..."
if [ -f "package.json" ] && [ -d "node_modules" ]; then
    check_result 0 "Dependencies installed"
else
    check_result 1 "Dependencies not installed. Run 'npm install'"
fi

echo ""
echo "3. Running linter..."
if npm run lint > /dev/null 2>&1; then
    check_result 0 "Linting passed"
else
    check_result 1 "Linting failed. Run 'npm run lint' to see errors"
fi

echo ""
echo "4. Running tests..."
if npm run test:run > /dev/null 2>&1; then
    check_result 0 "Tests passed"
else
    check_result 1 "Tests failed. Run 'npm run test:run' to see errors"
fi

echo ""
echo "5. Checking TypeScript compilation..."
if npx tsc --noEmit > /dev/null 2>&1; then
    check_result 0 "TypeScript compilation successful"
else
    check_result 1 "TypeScript compilation failed. Run 'npx tsc --noEmit' to see errors"
fi

echo ""
echo "6. Checking environment variables..."
if [ -f ".env.local.example" ]; then
    check_result 0 "Environment variable example file exists"
    check_warning "Ensure production environment variables are configured"
else
    check_result 1 "Environment variable example file missing"
fi

echo ""
echo "7. Checking feature flag configuration..."
if grep -q "NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING" .env.local.example; then
    check_result 0 "Feature flag documented in .env.local.example"
else
    check_result 1 "Feature flag not documented"
fi

echo ""
echo "8. Checking critical files..."
CRITICAL_FILES=(
    "lib/feature-flags.ts"
    "features/recording/services/performance-monitoring.service.ts"
    "features/recording/services/recording-storage.service.ts"
    "features/recording/hooks/use-media-recorder.ts"
    "features/recording/hooks/use-sync-manager.ts"
    "features/recording/components/recording-interface.tsx"
    "features/recording/components/recording-interface-legacy.tsx"
    "features/recording/components/recording-interface-wrapper.tsx"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_result 0 "$file exists"
    else
        check_result 1 "$file missing"
    fi
done

echo ""
echo "9. Checking documentation..."
DOC_FILES=(
    "features/recording/docs/DEPLOYMENT_GUIDE.md"
    "features/recording/docs/IMPLEMENTATION_SUMMARY.md"
    "features/recording/docs/OFFLINE_MODE_GUIDE.md"
    "features/recording/docs/STORAGE_MANAGEMENT.md"
)

for file in "${DOC_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_result 0 "$file exists"
    else
        check_result 1 "$file missing"
    fi
done

echo ""
echo "10. Building for production..."
if npm run build > /dev/null 2>&1; then
    check_result 0 "Production build successful"
else
    check_result 1 "Production build failed. Run 'npm run build' to see errors"
fi

echo ""
echo "=========================================================="
echo "Summary:"
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review DEPLOYMENT_GUIDE.md"
    echo "2. Configure environment variables in staging/production"
    echo "3. Deploy to staging first"
    echo "4. Test thoroughly before production deployment"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please fix the issues before deploying.${NC}"
    exit 1
fi

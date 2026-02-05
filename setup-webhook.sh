#!/usr/bin/env bash

##############################################################################
# Webhook Moota Setup Script
# 
# Usage:
#   Windows: node setup-webhook.js
#   Linux/Mac: ./setup-webhook.sh
#
# This script helps setup webhook for Moota auto-payment verification
##############################################################################

echo "🔧 Webhook Moota Setup Helper"
echo "=============================="
echo ""

# Step 1: Check Node.js
echo "1️⃣ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install from nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION found"
echo ""

# Step 2: Check npm packages
echo "2️⃣ Checking npm packages..."
if ! npm list express &> /dev/null; then
    echo "⚠️ Missing dependencies. Running npm install..."
    npm install express cors dotenv
    npm install --save-dev @types/express @types/cors tsx
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Step 3: Check .env file
echo "3️⃣ Checking .env file..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check for webhook secret
    if grep -q "MOOTA_SECRET_TOKEN=" .env; then
        echo "✅ MOOTA_SECRET_TOKEN found in .env"
    else
        echo "⚠️ MOOTA_SECRET_TOKEN not found in .env"
        echo "   Please add: MOOTA_SECRET_TOKEN=your_secret_token"
    fi
else
    echo "⚠️ .env file not found"
    echo "   Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env created from .env.example"
        echo "   Please edit .env and add MOOTA_SECRET_TOKEN"
    else
        echo "❌ .env.example not found"
    fi
fi
echo ""

# Step 4: Check files
echo "4️⃣ Checking webhook files..."
FILES_TO_CHECK=(
    "server.ts"
    "services/webhook_moota_handler.ts"
    "services/webhook_migration.sql"
    "WEBHOOK_SETUP_GUIDE.md"
    "WEBHOOK_QUICK_START.md"
)

ALL_FILES_EXIST=true
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file missing"
        ALL_FILES_EXIST=false
    fi
done

if [ "$ALL_FILES_EXIST" = true ]; then
    echo "✅ All webhook files present"
else
    echo "⚠️ Some files are missing"
fi
echo ""

# Step 5: Build check
echo "5️⃣ Checking build..."
if npm run build &> /dev/null; then
    echo "✅ Build successful"
else
    echo "⚠️ Build has errors"
    echo "   Run: npm run build"
fi
echo ""

# Step 6: Summary
echo "📋 Setup Summary"
echo "================"
echo "✅ = Ready to use"
echo "⚠️  = Action needed"
echo "❌ = Error"
echo ""

echo "📚 Next Steps:"
echo "1. Edit .env and set MOOTA_SECRET_TOKEN"
echo "2. Run database migration (services/webhook_migration.sql)"
echo "3. Deploy server (npm run start:server:prod)"
echo "4. Configure webhook in Moota dashboard"
echo "5. Test with: npm run start:server & test endpoint"
echo ""

echo "📖 Read WEBHOOK_QUICK_START.md for detailed setup"
echo ""
echo "✨ Setup complete! Happy coding!"

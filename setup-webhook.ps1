###############################################################################
# Webhook Moota Setup Script for Windows PowerShell
# 
# Usage:
#   powershell -ExecutionPolicy Bypass -File setup-webhook.ps1
#
# This script helps setup webhook for Moota auto-payment verification
###############################################################################

Write-Host "🔧 Webhook Moota Setup Helper" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node.js
Write-Host "1️⃣ Checking Node.js..." -ForegroundColor Yellow
$nodeExe = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $nodeExe) {
    Write-Host "❌ Node.js not found. Please install from nodejs.org" -ForegroundColor Red
    exit 1
}
$nodeVersion = node -v
Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
Write-Host ""

# Step 2: Check npm packages
Write-Host "2️⃣ Checking npm packages..." -ForegroundColor Yellow
$expressCheck = npm list express 2>$null | Select-String "express" -ErrorAction SilentlyContinue
if ($null -eq $expressCheck) {
    Write-Host "⚠️ Missing dependencies. Running npm install..." -ForegroundColor Yellow
    npm install express cors dotenv
    npm install --save-dev @types/express @types/cors tsx
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}
Write-Host ""

# Step 3: Check .env file
Write-Host "3️⃣ Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    # Check for webhook secret
    $envContent = Get-Content ".env"
    if ($envContent -match "MOOTA_SECRET_TOKEN=") {
        Write-Host "✅ MOOTA_SECRET_TOKEN found in .env" -ForegroundColor Green
    } else {
        Write-Host "⚠️ MOOTA_SECRET_TOKEN not found in .env" -ForegroundColor Yellow
        Write-Host "   Please add: MOOTA_SECRET_TOKEN=your_secret_token" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ .env file not found" -ForegroundColor Yellow
    Write-Host "   Creating .env from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env created from .env.example" -ForegroundColor Green
        Write-Host "   Please edit .env and add MOOTA_SECRET_TOKEN" -ForegroundColor Yellow
    } else {
        Write-Host "❌ .env.example not found" -ForegroundColor Red
    }
}
Write-Host ""

# Step 4: Check files
Write-Host "4️⃣ Checking webhook files..." -ForegroundColor Yellow
$filesToCheck = @(
    "server.ts",
    "services/webhook_moota_handler.ts",
    "services/webhook_migration.sql",
    "WEBHOOK_SETUP_GUIDE.md",
    "WEBHOOK_QUICK_START.md"
)

$allFilesExist = $true
foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if ($allFilesExist) {
    Write-Host "✅ All webhook files present" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some files are missing" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Build check
Write-Host "5️⃣ Checking build..." -ForegroundColor Yellow
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "⚠️ Build has errors" -ForegroundColor Yellow
    Write-Host "   Run: npm run build" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Summary
Write-Host "📋 Setup Summary" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
Write-Host "✅ = Ready to use" -ForegroundColor Green
Write-Host "⚠️  = Action needed" -ForegroundColor Yellow
Write-Host "❌ = Error" -ForegroundColor Red
Write-Host ""

Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env and set MOOTA_SECRET_TOKEN" -ForegroundColor White
Write-Host "2. Run database migration (services/webhook_migration.sql)" -ForegroundColor White
Write-Host "3. Deploy server (npm run start:server:prod)" -ForegroundColor White
Write-Host "4. Configure webhook in Moota dashboard" -ForegroundColor White
Write-Host "5. Test with: npm run start:server & test endpoint" -ForegroundColor White
Write-Host ""

Write-Host "📖 Read WEBHOOK_QUICK_START.md for detailed setup" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Setup complete! Happy coding!" -ForegroundColor Green

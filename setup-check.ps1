# CloudBlitz Setup Verification

Write-Host "`n=== CloudBlitz - Trainer Lab Access Portal ===" -ForegroundColor Cyan
Write-Host "Setup Verification Script`n" -ForegroundColor Cyan

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js v18+" -ForegroundColor Red
    exit 1
}

# Check MongoDB
Write-Host "`nChecking MongoDB..." -ForegroundColor Yellow
try {
    $mongoStatus = mongod --version 2>&1 | Select-String "db version"
    if ($mongoStatus) {
        Write-Host "✓ MongoDB installed" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ MongoDB not found in PATH. Make sure MongoDB is installed and running." -ForegroundColor Yellow
}

# Check Backend dependencies
Write-Host "`nChecking Backend..." -ForegroundColor Yellow
if (Test-Path "Backend/node_modules") {
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Backend dependencies missing. Run: cd Backend && npm install" -ForegroundColor Red
}

if (Test-Path "Backend/.env") {
    Write-Host "✓ Backend .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠ Backend .env file missing. Copy from .env.example" -ForegroundColor Yellow
}

# Check Frontend dependencies
Write-Host "`nChecking Frontend..." -ForegroundColor Yellow
if (Test-Path "Frontend/node_modules") {
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend dependencies missing. Run: cd Frontend && npm install" -ForegroundColor Red
}

if (Test-Path "Frontend/.env") {
    Write-Host "✓ Frontend .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠ Frontend .env file missing (optional)" -ForegroundColor Yellow
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "`nTo start the application:" -ForegroundColor White
Write-Host "1. Start MongoDB (if not running)" -ForegroundColor White
Write-Host "2. Terminal 1: cd Backend && npm run dev" -ForegroundColor White
Write-Host "3. Terminal 2: cd Frontend && npm run dev" -ForegroundColor White
Write-Host "`nFrontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3000`n" -ForegroundColor Green

# Quick Setup Script for OpenAI Integration
# Run this after cloning the repo or pulling OpenAI changes

Write-Host "🚀 Setting up OpenAI Integration..." -ForegroundColor Cyan

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created. Please edit it and add your API keys!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Required: Add one of the following:" -ForegroundColor Yellow
    Write-Host "  - OPENAI_API_KEY (for standard OpenAI)" -ForegroundColor Gray
    Write-Host "  - AZURE_OPENAI_* credentials (for Azure OpenAI)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Install backend dependencies
Write-Host ""
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Cyan
Push-Location "code\backend"

if (Test-Path ".venv") {
    Write-Host "   Using existing virtual environment" -ForegroundColor Gray
    & .venv\Scripts\Activate.ps1
} else {
    Write-Host "   Creating virtual environment..." -ForegroundColor Gray
    python -m venv .venv
    & .venv\Scripts\Activate.ps1
}

pip install -r requirements.txt --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Python dependencies installed" -ForegroundColor Green
}

# Run migrations
Write-Host ""
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
python manage.py migrate --noinput
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database migrations completed" -ForegroundColor Green
}

Pop-Location

# Install frontend dependencies
Write-Host ""
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Cyan
Push-Location "code\frontend"
npm install --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js dependencies installed" -ForegroundColor Green
}
Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env and add your OpenAI API key" -ForegroundColor White
Write-Host "2. Run: .\start-dev.ps1" -ForegroundColor White
Write-Host "3. Visit: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "To test OpenAI integration:" -ForegroundColor Yellow
Write-Host "- Import AIExample component in your app" -ForegroundColor White
Write-Host "- Or check the health endpoint: http://localhost:8000/api/grading/health/" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: docs\OPENAI_INTEGRATION.md" -ForegroundColor Cyan

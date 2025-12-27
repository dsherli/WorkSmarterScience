# WorkSmarterScience Development Server Starter (venv version)
# This script starts both backend and frontend servers in separate windows

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  WorkSmarterScience - Starting Development Servers" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if venv exists
$venvPath = "code\backend\venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "Virtual environment not found!" -ForegroundColor Red
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    
    Push-Location code\backend
    python -m venv venv
    
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    .\venv\Scripts\Activate.ps1
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    pip install psycopg2-binary Pillow
    deactivate
    Pop-Location
    
    Write-Host "Virtual environment created successfully!" -ForegroundColor Green
    Write-Host ""
}

# Check if node_modules exists
if (-not (Test-Path "code\frontend\node_modules")) {
    Write-Host "Node modules not found!" -ForegroundColor Red
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    
    Push-Location code\frontend
    npm install
    Pop-Location
    
    Write-Host "npm dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
}

# Start Backend Server
Write-Host "Starting Django backend server..." -ForegroundColor Green
$backendScript = @"
`$host.UI.RawUI.WindowTitle = 'Django Backend - Port 8000'
cd code\backend
.\venv\Scripts\Activate.ps1
Write-Host '==================================================' -ForegroundColor Cyan
Write-Host '  Django Backend Server' -ForegroundColor Cyan
Write-Host '==================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Server running at: http://localhost:8000' -ForegroundColor Green
Write-Host 'Admin panel: http://localhost:8000/admin' -ForegroundColor Green
Write-Host 'API endpoint: http://localhost:8000/api' -ForegroundColor Green
Write-Host ''
Write-Host 'Press Ctrl+C to stop the server' -ForegroundColor Yellow
Write-Host ''
python manage.py runserver
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript

# Wait for backend to initialize
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

# Start Frontend Server
Write-Host "Starting Vite frontend server..." -ForegroundColor Green
$frontendScript = @"
`$host.UI.RawUI.WindowTitle = 'Vite Frontend - Port 5173'
cd code\frontend
Write-Host '==================================================' -ForegroundColor Cyan
Write-Host '  Vite Frontend Server' -ForegroundColor Cyan
Write-Host '==================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Server running at: http://localhost:5173' -ForegroundColor Green
Write-Host ''
Write-Host 'Press Ctrl+C to stop the server' -ForegroundColor Yellow
Write-Host ''
npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript

# Summary
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Servers Started Successfully!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Admin:    http://localhost:8000/admin" -ForegroundColor Cyan
Write-Host "API:      http://localhost:8000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Two new PowerShell windows have opened." -ForegroundColor Yellow
Write-Host "Close those windows or press Ctrl+C in them to stop servers." -ForegroundColor Yellow
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Magenta
Write-Host ""

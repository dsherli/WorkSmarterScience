# Convenience PowerShell script to start backend and frontend dev servers on Windows
# Usage: Open PowerShell and run: .\start-dev.ps1
# Requires: Node 22.12.0 (or supported), Python and virtualenv for backend

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Backend
$backendPath = Join-Path $repoRoot 'code\backend'
# Frontend
$frontendPath = Join-Path $repoRoot 'code\frontend'

Write-Host "Starting backend in a new PowerShell window..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$backendPath'; if (-Not (Test-Path .venv)) { python -m venv .venv }; . .venv\Scripts\Activate.ps1; pip install -r requirements.txt; python manage.py migrate; python manage.py runserver 0.0.0.0:8000"

Start-Sleep -Milliseconds 800

Write-Host "Starting frontend in a new PowerShell window..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$frontendPath'; npm install; npm run dev"

Write-Host "Dev servers started in separate windows. Close them to stop."

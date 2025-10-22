# Setup with Python venv (No Conda Required)

This guide shows how to run WorkSmarterScience using a standard Python virtual environment instead of Conda.

## Prerequisites

- Python 3.10 or higher installed on your system
- Node.js 18+ and npm
- Git

## Step 1: Create Virtual Environment

Open PowerShell in the project root directory:

```powershell
# Navigate to backend directory
cd code\backend

# Create virtual environment
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1
```

**Note:** If you get an execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Step 2: Install Python Dependencies

With the virtual environment activated:

```powershell
# Upgrade pip
python -m pip install --upgrade pip

# Install all requirements
pip install -r requirements.txt

# Install additional dependencies for rubric grading
pip install psycopg2-binary Pillow
```

## Step 3: Configure Environment Variables

Create a `.env` file in `code/backend/`:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:your-password@ep-holy-waterfall-a80yg68c-pooler.eastus2.azure.neon.tech/neondb?sslmode=require

# OpenAI API (choose one)
OPENAI_API_KEY=sk-proj-...

# Or Azure OpenAI
# AZURE_OPENAI_API_KEY=your-azure-key
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
# AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
# AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Django settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## Step 4: Run Database Migrations

Still in `code\backend` with venv activated:

```powershell
# Apply migrations
python manage.py migrate

# Create superuser (optional, for admin access)
python manage.py createsuperuser
```

## Step 5: Start Backend Server

```powershell
# Make sure you're in code\backend with venv activated
python manage.py runserver
```

The backend will be running at `http://localhost:8000`

## Step 6: Setup Frontend (New Terminal)

Open a **new** PowerShell terminal (don't close the backend):

```powershell
# Navigate to frontend directory
cd code\frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

The frontend will be running at `http://localhost:5173`

## Daily Usage

### Starting the Application

**Terminal 1 (Backend):**
```powershell
cd code\backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

**Terminal 2 (Frontend):**
```powershell
cd code\frontend
npm run dev
```

### Stopping the Application

- Press `Ctrl+C` in each terminal
- Deactivate venv: `deactivate`

## Convenience Scripts

### PowerShell Script: start-dev-venv.ps1

Create this in the project root:

```powershell
# Start Backend
Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd code\backend; .\venv\Scripts\Activate.ps1; python manage.py runserver"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting frontend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd code\frontend; npm run dev"

Write-Host "`nServers starting..." -ForegroundColor Yellow
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
```

Run it with:
```powershell
.\start-dev-venv.ps1
```

## Troubleshooting

### "venv is not recognized"
Make sure you're in the `code\backend` directory when activating.

### "Execution policy" error
Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### "Module not found" errors
Make sure venv is activated (you should see `(venv)` in your prompt):
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Database connection errors
Check your `.env` file has correct `DATABASE_URL`

### "Port already in use"
Kill existing processes:
```powershell
# Find process using port 8000
netstat -ano | findstr :8000
# Kill it (replace PID with actual number)
taskkill /PID <PID> /F
```

## Testing the Rubric Grading System

1. **Update `src/App.tsx`:**
   ```tsx
   import RubricGradingDemo from './components/RubricGradingDemo';
   
   function App() {
     return <RubricGradingDemo />;
   }
   ```

2. **Open browser:** `http://localhost:5173`

3. **Test workflow:**
   - Click "Create Rubric" → Add criteria → Save
   - Click "Submit Work" → Fill form → Submit
   - Click "Grade Submission" → Select submission → "Grade with AI"

## Virtual Environment Commands

```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Deactivate venv
deactivate

# Install new package
pip install package-name

# Update requirements.txt
pip freeze > requirements.txt

# List installed packages
pip list

# Remove venv completely
deactivate
Remove-Item -Recurse -Force venv
```

## Advantages of venv over Conda

✅ Lighter weight (smaller disk space)  
✅ Faster environment activation  
✅ Standard Python tooling  
✅ Better for deployment  
✅ Simpler for most use cases  

## Migration from Conda (If you have existing Conda setup)

1. Export your conda dependencies:
   ```powershell
   conda list --export > conda-packages.txt
   ```

2. Create and activate venv (see Step 1 above)

3. Install from requirements.txt:
   ```powershell
   pip install -r requirements.txt
   ```

4. Verify everything works:
   ```powershell
   python manage.py check
   ```

## VS Code Integration

Add to `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/code/backend/venv/Scripts/python.exe",
  "python.terminal.activateEnvironment": true
}
```

This will automatically use your venv in VS Code terminals.

## Production Deployment

For production, use the same venv approach:

```bash
# On Linux/production server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py collectstatic
gunicorn api.wsgi:application
```

---

**You're all set!** The venv approach is simpler and more portable than Conda for this project.

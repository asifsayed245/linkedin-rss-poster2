@echo off
chcp 65001 >nul
echo ===========================================
echo  LinkedIn RSS Poster - Deployment Tool
echo ===========================================
echo.
echo This script will:
echo  1. Install Git (if not present)
echo  2. Initialize Git repository
echo  3. Push code to GitHub
echo  4. Prepare for Render deployment
echo.
echo Press any key to continue...
pause >nul
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PowerShell is not available on this system.
    echo 📥 Please install PowerShell or use the manual deployment method.
    echo.
    echo 📖 See DEPLOY.md for manual instructions.
    pause
    exit /b 1
)

REM Run the PowerShell deployment script
echo 🚀 Starting deployment script...
echo.
powershell -ExecutionPolicy Bypass -File "deploy-full.ps1"

if %errorlevel% neq 0 (
    echo.
    echo ❌ Deployment script failed.
    echo 💡 Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ✅ Deployment preparation complete!
pause

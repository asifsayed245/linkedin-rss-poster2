@echo off
chcp 65001 >nul
echo 🚀 LinkedIn RSS Poster Deployment Script
echo ========================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Git is not installed. Please install Git first:
    echo    https://git-scm.com/download/win
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the linkedin-rss-poster directory.
    pause
    exit /b 1
)

echo ✅ Found package.json
echo.

REM Initialize git if not already initialized
if not exist ".git" (
    echo 📦 Initializing git repository...
    git init
    git branch -M main
) else (
    echo ✅ Git repository already initialized
)

REM Check if remote exists
git remote | findstr "origin" >nul
if %errorlevel% neq 0 (
    echo 🔗 Adding GitHub remote...
    git remote add origin https://github.com/asifsayed245/linkedin-rss-poster.git
) else (
    echo ✅ GitHub remote already configured
)

echo.
echo 📤 Staging files...
git add .

echo 💾 Creating commit...
git commit -m "Initial commit - Ready for deployment"

echo ☁️  Pushing to GitHub...
git push -u origin main

echo.
echo ✅ Code pushed to GitHub successfully!
echo.
echo 🌐 Next steps:
echo    1. Go to https://render.com
echo    2. Click 'New +' -^> 'Web Service'
echo    3. Connect your GitHub repository
echo    4. Render will auto-deploy using the render.yaml configuration
echo.
echo 📊 Render will use these settings:
echo    - Build: npm install ^&^& npm run build
echo    - Start: npm start
echo    - Plan: Free
echo.
echo ⚠️  IMPORTANT SECURITY NOTE:
echo    You have exposed your HuggingFace token in the .env file.
echo    Please regenerate it at: https://huggingface.co/settings/tokens
echo    Then add the new token to Render's environment variables.
echo.
pause

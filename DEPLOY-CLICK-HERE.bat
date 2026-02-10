@echo off
echo.
echo ===========================================
echo   DEPLOYMENT HELPER - LinkedIn RSS Poster
echo ===========================================
echo.
echo This script will help you push your code to GitHub.
echo.

:: Check for Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed!
    echo Please install Git from https://git-scm.com/download/win
    pause
    exit /b
)

:: Check for PowerShell
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PowerShell is not found!
    pause
    exit /b
)

echo [1/5] Initializing Git repository...
git init
git branch -M main

echo [2/5] Adding your remote...
echo Please ensure you have created the repository: linkedin-rss-poster
set /p GITHUB_USER="Enter your GitHub Username: "
git remote add origin https://github.com/%GITHUB_USER%/linkedin-rss-poster.git

echo [3/5] Staging files...
git add .

echo [4/5] Committing files...
git commit -m "Initial commit prior to deployment"

echo [5/5] Pushing to GitHub...
echo.
echo Note: A popup might appear asking you to sign in to GitHub.
echo.
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed. 
    echo 1. Check if the repository 'linkedin-rss-poster' exists.
    echo 2. Check your internet connection.
    echo 3. Check your permissions.
    pause
    exit /b
)

echo.
echo ===========================================
echo   SUCCESS! 🚀
echo ===========================================
echo.
echo Now you can go to Render.com and deploy:
echo 1. New Web Service
echo 2. Connect your GitHub repository
echo 3. Click Deploy
echo.
pause

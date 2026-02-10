@echo off
echo LinkedIn RSS Poster - Deployment Script
echo =======================================

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git is not installed. Please install it first.
    exit /b
)

:: Init repo
git init
git branch -M main

:: Ask for username
set /p user="Enter your GitHub username: "

:: Add remote
git remote add origin https://github.com/%user%/linkedin-rss-poster.git

:: Add files
git add .
git commit -m "Initial commit"

:: Push
echo Pushing to GitHub...
git push -u origin main

echo.
echo Done! Go to Render.com to deploy.
echo Don't forget to add your HUGGINGFACE_TOKEN in Render environment variables!
pause

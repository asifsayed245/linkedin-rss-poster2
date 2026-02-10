@echo off
chcp 65001 >nul
title LinkedIn RSS Poster - GitHub Push Tool
echo ===========================================
echo  LinkedIn RSS Poster - GitHub Push
echo ===========================================
echo.
echo ⚠️  IMPORTANT: Repository Setup Required
echo.
echo The GitHub API token doesn't have permission to create
echo repositories automatically. Please follow these steps:
echo.
echo ===========================================
echo  STEP 1: Create Repository on GitHub
echo ===========================================
echo.
echo 1. Go to: https://github.com/new
echo 2. Repository name: linkedin-rss-poster
echo 3. Description: Auto-generate LinkedIn posts from tech and AI news
echo 4. Make it: Public
echo 5. Check: Add a README file
echo 6. Click: Create repository
echo.
echo ===========================================
echo  STEP 2: Push Code (After creating repo)
echo ===========================================
echo.
echo Once you've created the repository, press any key
echo to continue with the push...
echo.
pause >nul
echo.
echo Checking if repository exists...
echo.

REM Check if git is available
where git >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Git is installed
    echo.
    echo 📦 Initializing and pushing...
    echo.
    
    if not exist ".git" (
        git init
        git branch -M main
    )
    
    git remote remove origin 2>nul
    git remote add origin https://github.com/asifsayed245/linkedin-rss-poster.git
    
    git add .
    git commit -m "Initial deployment"
    git push -u origin main
    
    if %errorlevel% equ 0 (
        echo.
        echo ✅ SUCCESS! Code pushed to GitHub!
        echo.
        echo ===========================================
        echo  NEXT STEP: Deploy to Render
        echo ===========================================
        echo.
        echo 1. Go to: https://render.com
        echo 2. Sign up with GitHub
        echo 3. New + ^> Web Service
        echo 4. Select: asifsayed245/linkedin-rss-poster
        echo 5. Click: Create Web Service
        echo.
        echo Your app will be live at:
        echo https://linkedin-rss-poster.onrender.com
        echo.
    ) else (
        echo.
        echo ❌ Push failed. Please check the error above.
        echo.
        echo Try manually:
        echo   git push -u origin main
        echo.
    )
) else (
    echo ❌ Git is not installed on this system.
    echo.
    echo Please use one of these methods:
    echo.
    echo METHOD 1 - GitHub Desktop:
    echo   1. Download: https://desktop.github.com
    echo   2. Open linkedin-rss-poster folder
    echo   3. Publish repository to GitHub
    echo.
    echo METHOD 2 - VS Code:
    echo   1. Open linkedin-rss-poster in VS Code
    echo   2. Click Source Control icon (left sidebar)
    echo   3. Initialize Repository
    echo   4. Stage all files
    echo   5. Commit and Push
    echo.
    echo METHOD 3 - Upload via GitHub Web:
    echo   1. Go to: https://github.com/asifsayed245/linkedin-rss-poster
    echo   2. Click: Add file ^> Upload files
    echo   3. Drag and drop all files from linkedin-rss-poster folder
    echo   4. Commit changes
    echo.
)

echo.
echo Press any key to exit...
pause >nul

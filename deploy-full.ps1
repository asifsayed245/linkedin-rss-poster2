# LinkedIn RSS Poster - Complete Deployment Script
# This script will push to GitHub and deploy to Render

param(
    [string]$GitHubUsername = "asifsayed245",
    [string]$RepoName = "linkedin-rss-poster",
    [string]$CommitMessage = "Initial deployment commit"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"

Write-Host "`n🚀 LinkedIn RSS Poster - Deployment Script" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Colors
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

# Function to check if command exists
function Test-Command($Command) {
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Step 1: Check Git Installation
Write-Host "📦 Step 1: Checking Git installation..." -ForegroundColor $Cyan

if (Test-Command "git") {
    $gitVersion = git --version
    Write-Host "   ✅ Git found: $gitVersion" -ForegroundColor $Green
} else {
    Write-Host "   ❌ Git not found. Installing Git..." -ForegroundColor $Yellow
    
    # Try to install git using winget
    if (Test-Command "winget") {
        Write-Host "   📥 Installing Git via winget..." -ForegroundColor $Cyan
        try {
            winget install --id Git.Git -e --source winget
            Write-Host "   ✅ Git installed successfully!" -ForegroundColor $Green
            Write-Host "   ⚠️  Please restart your terminal and run this script again." -ForegroundColor $Yellow
            exit 0
        } catch {
            Write-Host "   ❌ Failed to install Git automatically." -ForegroundColor $Red
            Write-Host "   📥 Please download and install Git manually from:" -ForegroundColor $Yellow
            Write-Host "      https://git-scm.com/download/win" -ForegroundColor $Cyan
            Write-Host "   🔄 Then run this script again." -ForegroundColor $Yellow
            exit 1
        }
    } else {
        Write-Host "   ❌ Winget not available. Please install Git manually:" -ForegroundColor $Red
        Write-Host "      https://git-scm.com/download/win" -ForegroundColor $Cyan
        exit 1
    }
}

# Step 2: Check if we're in the right directory
Write-Host "`n📂 Step 2: Checking project directory..." -ForegroundColor $Cyan

$packageJson = Join-Path $PWD "package.json"
if (-not (Test-Path $packageJson)) {
    Write-Host "   ❌ Error: package.json not found!" -ForegroundColor $Red
    Write-Host "   📂 Please run this script from the linkedin-rss-poster directory." -ForegroundColor $Yellow
    exit 1
}

Write-Host "   ✅ Found package.json in: $PWD" -ForegroundColor $Green

# Step 3: Initialize Git Repository
Write-Host "`n🔧 Step 3: Initializing Git repository..." -ForegroundColor $Cyan

if (Test-Path ".git") {
    Write-Host "   ✅ Git repository already initialized" -ForegroundColor $Green
} else {
    git init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Git repository initialized" -ForegroundColor $Green
    } else {
        Write-Host "   ❌ Failed to initialize Git repository" -ForegroundColor $Red
        exit 1
    }
}

# Set branch to main
git branch -M main 2>$null
Write-Host "   ✅ Branch set to 'main'" -ForegroundColor $Green

# Step 4: Configure Git (if not already configured)
Write-Host "`n👤 Step 4: Configuring Git..." -ForegroundColor $Cyan

$gitName = git config user.name 2>$null
$gitEmail = git config user.email 2>$null

if (-not $gitName) {
    git config user.name "Deployment Bot"
    Write-Host "   ✅ Set Git user.name" -ForegroundColor $Green
}

if (-not $gitEmail) {
    git config user.email "deploy@linkedin-rss-poster.local"
    Write-Host "   ✅ Set Git user.email" -ForegroundColor $Green
}

# Step 5: Check Remote
Write-Host "`n🔗 Step 5: Configuring GitHub remote..." -ForegroundColor $Cyan

$remoteUrl = "https://github.com/$GitHubUsername/$RepoName.git"

$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "   ✅ Remote already configured: $existingRemote" -ForegroundColor $Green
} else {
    Write-Host "   🔗 Adding remote: $remoteUrl" -ForegroundColor $Cyan
    git remote add origin $remoteUrl
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Remote added successfully" -ForegroundColor $Green
    } else {
        Write-Host "   ❌ Failed to add remote" -ForegroundColor $Red
        exit 1
    }
}

# Step 6: Stage Files
Write-Host "`n📤 Step 6: Staging files..." -ForegroundColor $Cyan

# Show what will be staged
Write-Host "   📋 Files to be committed:" -ForegroundColor $Cyan

# Get list of files that will be added
$filesToAdd = @(
    "src\*.ts",
    "src\config\*.ts",
    "src\services\*.ts",
    "*.json",
    "*.md",
    "*.yaml",
    ".gitignore",
    ".env.example"
)

git add $filesToAdd 2>$null
git add render.yaml 2>$null

$stagedFiles = git diff --cached --name-only
$fileCount = ($stagedFiles -split "`n").Count

Write-Host "   ✅ Staged $fileCount files" -ForegroundColor $Green

# Step 7: Commit
Write-Host "`n💾 Step 7: Creating commit..." -ForegroundColor $Cyan

$status = git status --porcelain
if (-not $status) {
    Write-Host "   ℹ️  Nothing to commit (working tree clean)" -ForegroundColor $Yellow
} else {
    git commit -m "$CommitMessage"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Commit created successfully" -ForegroundColor $Green
    } else {
        Write-Host "   ❌ Failed to create commit" -ForegroundColor $Red
        exit 1
    }
}

# Step 8: Push to GitHub
Write-Host "`n☁️  Step 8: Pushing to GitHub..." -ForegroundColor $Cyan
Write-Host "   🌐 Repository: $remoteUrl" -ForegroundColor $Cyan

# Check if we need to pull first (in case of existing repo)
$hasRemoteCommits = $false
try {
    $null = git ls-remote origin main 2>$null
    if ($LASTEXITCODE -eq 0) {
        $hasRemoteCommits = $true
    }
} catch {
    $hasRemoteCommits = $false
}

if ($hasRemoteCommits) {
    Write-Host "   🔄 Pulling latest changes from remote..." -ForegroundColor $Yellow
    git pull origin main --allow-unrelated-histories 2>$null
}

# Push to GitHub
Write-Host "   📤 Pushing to origin main..." -ForegroundColor $Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Successfully pushed to GitHub!" -ForegroundColor $Green
    Write-Host "   🌐 Repository URL: https://github.com/$GitHubUsername/$RepoName" -ForegroundColor $Cyan
} else {
    Write-Host "   ❌ Failed to push to GitHub" -ForegroundColor $Red
    Write-Host "   💡 Common issues:" -ForegroundColor $Yellow
    Write-Host "      - Make sure the GitHub repository exists" -ForegroundColor $Yellow
    Write-Host "      - Check your internet connection" -ForegroundColor $Yellow
    Write-Host "      - You may need to authenticate with GitHub" -ForegroundColor $Yellow
    Write-Host "      - Try: git push -u origin main" -ForegroundColor $Cyan
    exit 1
}

# Step 9: Deployment Summary
Write-Host "`n" -NoNewline
Write-Host "===========================================" -ForegroundColor $Green
Write-Host "✅ SUCCESS! Code pushed to GitHub" -ForegroundColor $Green
Write-Host "===========================================" -ForegroundColor $Green
Write-Host ""

Write-Host "🚀 Next Steps - Deploy to Render:" -ForegroundColor $Cyan
Write-Host "-------------------------------------------" -ForegroundColor $Cyan
Write-Host ""
Write-Host "1. 🌐 Go to https://render.com" -ForegroundColor White
Write-Host "2. 🔐 Sign up/login with your GitHub account" -ForegroundColor White
Write-Host "3. ➕ Click 'New +' → 'Web Service'" -ForegroundColor White
Write-Host "4. 🔗 Connect your GitHub repository:" -ForegroundColor White
Write-Host "   📁 $GitHubUsername/$RepoName" -ForegroundColor Yellow
Write-Host "5. ⚙️  Render will auto-detect render.yaml configuration" -ForegroundColor White
Write-Host "6. 🚀 Click 'Create Web Service'" -ForegroundColor White
Write-Host ""

Write-Host "📊 Render Configuration (from render.yaml):" -ForegroundColor $Cyan
Write-Host "-------------------------------------------" -ForegroundColor $Cyan
Write-Host "   Build: npm install && npm run build" -ForegroundColor Gray
Write-Host "   Start: npm start" -ForegroundColor Gray
Write-Host "   Plan: Free (750 hours/month)" -ForegroundColor Gray
Write-Host "   Disk: 1GB persistent storage" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  IMPORTANT - Set Environment Variables:" -ForegroundColor $Yellow
Write-Host "-------------------------------------------" -ForegroundColor $Yellow
Write-Host "   In Render dashboard → Environment:" -ForegroundColor White
Write-Host "   HUGGINGFACE_TOKEN=your_token_here" -ForegroundColor Cyan
Write-Host "   PORT=10000" -ForegroundColor Cyan
Write-Host "   NODE_ENV=production" -ForegroundColor Cyan
Write-Host "   MAX_POSTS_PER_DAY=3" -ForegroundColor Cyan
Write-Host "   SCHEDULE_HOUR=9" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔐 Security Reminder:" -ForegroundColor $Red
Write-Host "-------------------------------------------" -ForegroundColor $Red
Write-Host "   Your HuggingFace token is in .env file." -ForegroundColor Yellow
Write-Host "   Please regenerate it at:" -ForegroundColor Yellow
Write-Host "   https://huggingface.co/settings/tokens" -ForegroundColor Cyan
Write-Host "   And update Render environment variables." -ForegroundColor Yellow
Write-Host ""

Write-Host "📱 Your app will be available at:" -ForegroundColor $Green
Write-Host "   https://linkedin-rss-poster.onrender.com" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎉 Deployment preparation complete!" -ForegroundColor $Green
Write-Host ""

# Pause to let user read
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

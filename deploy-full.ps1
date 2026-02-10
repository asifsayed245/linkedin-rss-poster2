<#
.SYNOPSIS
    Automated Deployment Script for LinkedIn RSS Poster
.DESCRIPTION
    This script initializes Git, commits changes, and pushes to a user-specified 
    GitHub repository to prepare for Render.com deployment.
#>

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "   LinkedIn RSS Poster - Deployment Helper" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check for Prerequisites
# --------------------------
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed! Please install Git from https://git-scm.com/download/win"
    exit 1
}

Write-Host "  - Git is installed." -ForegroundColor Green
Write-Host ""

# 2. Initialize Repository
# ------------------------
Write-Host "[2/5] Initializing local repository..." -ForegroundColor Yellow

if (-not (Test-Path ".git")) {
    git init | Out-Null
    Write-Host "  - Repository initialized." -ForegroundColor Green
} else {
    Write-Host "  - Repository already exists." -ForegroundColor Gray
}

# Rename branch to main (modern standard)
git branch -M main 2>$null
Write-Host ""

# 3. Configure Remote
# -------------------
Write-Host "[3/5] Configuring GitHub remote..." -ForegroundColor Yellow

$currentRemote = git remote get-url origin 2>$null

if ($currentRemote) {
    Write-Host "  - Remote 'origin' already exists: $currentRemote" -ForegroundColor Gray
    $choice = Read-Host "  Do you want to keep this remote? (Y/N)"
    if ($choice -eq 'N' -or $choice -eq 'n') {
        git remote remove origin
        $username = Read-Host "  Enter your GitHub username"
        $repoName = "linkedin-rss-poster"
        $remoteUrl = "https://github.com/$username/$repoName.git"
        git remote add origin $remoteUrl
        Write-Host "  - Remote updated to: $remoteUrl" -ForegroundColor Green
    }
} else {
    $username = Read-Host "  Enter your GitHub username"
    $repoName = "linkedin-rss-poster"
    $remoteUrl = "https://github.com/$username/$repoName.git"
    git remote add origin $remoteUrl
    Write-Host "  - Remote added: $remoteUrl" -ForegroundColor Green
}
Write-Host ""

# 4. Commit Files
# ---------------
Write-Host "[4/5] Staging and Committing files..." -ForegroundColor Yellow

# Check status
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "  - No changes to commit." -ForegroundColor Gray
} else {
    git add .
    git commit -m "Deploy: Update application code" | Out-Null
    Write-Host "  - Files committed." -ForegroundColor Green
}
Write-Host ""

# 5. Push to GitHub
# -----------------
Write-Host "[5/5] Pushing code to GitHub..." -ForegroundColor Yellow
Write-Host "  (A browser window may open asking you to sign in)" -ForegroundColor DarkGray

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host "   SUCCESS! Code is on GitHub. 🚀" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps for Render.com:"
    Write-Host "1. Go to https://render.com"
    Write-Host "2. Create a 'New Web Service'"
    Write-Host "3. Connect your repository: linkedin-rss-poster"
    Write-Host "4. Add Environment Variable:"
    Write-Host "   Key: HUGGINGFACE_TOKEN"
    Write-Host "   Value: [Your Token]"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host "   PUSH FAILED ❌" -ForegroundColor Red
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host "Common fixes:"
    Write-Host "1. Create the repository on GitHub first!"
    Write-Host "   https://github.com/new"
    Write-Host "   Name: linkedin-rss-poster"
    Write-Host "2. Check you used the correct username."
    Write-Host "3. Check your internet connection."
    Write-Host ""
}

Pause

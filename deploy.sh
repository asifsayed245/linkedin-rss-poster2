#!/bin/bash

# Deployment Script for LinkedIn RSS Poster
# This script automates the deployment process

echo "🚀 LinkedIn RSS Poster Deployment Script"
echo "========================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first:"
    echo "   https://git-scm.com/download/win"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the linkedin-rss-poster directory."
    exit 1
fi

echo "✅ Found package.json"
echo ""

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git branch -M main
else
    echo "✅ Git repository already initialized"
fi

# Check if remote exists
if ! git remote | grep -q "origin"; then
    echo "🔗 Adding GitHub remote..."
    git remote add origin https://github.com/asifsayed245/linkedin-rss-poster.git
else
    echo "✅ GitHub remote already configured"
fi

echo ""
echo "📋 Files to be committed:"
echo "------------------------"

# Show what will be added
git add -n .

echo ""
echo "⚠️  IMPORTANT: The following files/directories will be EXCLUDED:"
echo "   - node_modules/"
echo "   - dist/"
echo "   - data/"
echo "   - drafts/"
echo "   - .env"
echo ""

# Stage files
echo "📤 Staging files..."
git add .

# Commit
echo "💾 Creating commit..."
git commit -m "Initial commit - Ready for deployment"

# Push
echo "☁️  Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Code pushed to GitHub successfully!"
echo ""
echo "🌐 Next steps:"
echo "   1. Go to https://render.com"
echo "   2. Click 'New +' → 'Web Service'"
echo "   3. Connect your GitHub repository"
echo "   4. Render will auto-deploy using the render.yaml configuration"
echo ""
echo "📊 Render will use these settings:"
echo "   - Build: npm install && npm run build"
echo "   - Start: npm start"
echo "   - Plan: Free"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTE:"
echo "   You have exposed your HuggingFace token in the .env file."
echo "   Please regenerate it at: https://huggingface.co/settings/tokens"
echo "   Then add the new token to Render's environment variables."
echo ""

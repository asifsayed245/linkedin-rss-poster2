#!/bin/bash

echo "LinkedIn RSS Poster - Deployment Script"
echo "======================================="

# Check git
if ! command -v git &> /dev/null; then
    echo "Git is not installed."
    exit 1
fi

# Init
git init
git branch -M main

# Remote
read -p "Enter your GitHub username: " user
git remote add origin https://github.com/$user/linkedin-rss-poster.git

# Add & Commit
git add .
git commit -m "Initial commit"

# Push
echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "Done! Go to Render.com to deploy."
echo "Remember to set HUGGINGFACE_TOKEN in Render environment variables!"

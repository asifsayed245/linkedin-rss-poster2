# 🚀 Deployment Guide

## ⚠️ URGENT: Security Issue

**Your HuggingFace token is exposed!** The token `hf_***REDACTED***` was found in your `.env` file.

### Action Required:
1. Go to https://huggingface.co/settings/tokens
2. Delete the exposed token
3. Generate a new token
4. Update your `.env` file with the new token
5. Add the new token to Render's environment variables (not in code!)

---

## 📦 Files Created for Deployment

I've set up the following files:

1. **`render.yaml`** - Render.com deployment configuration
2. **`deploy.bat`** - Windows deployment script (double-click to run)
3. **`deploy.sh`** - Linux/Mac deployment script
4. **Updated `package.json`** - Changed start script for production
5. **Updated `.env.example`** - Removed exposed token

---

## 🚀 Quick Deployment Steps

### Step 1: Secure Your Token (REQUIRED!)

```bash
# 1. Go to https://huggingface.co/settings/tokens
# 2. Delete the old token: hf_***REDACTED***
# 3. Create a new token
# 4. Update your .env file with the new token
```

### Step 2: Push to GitHub

**Option A: Using the deployment script (Recommended)**
1. Open Command Prompt in the `linkedin-rss-poster` folder
2. Run: `deploy.bat`
3. Follow the prompts

**Option B: Using Git extension GUI**
1. Open your Git extension (VS Code/GitHub Desktop)
2. Initialize repository in the folder
3. Stage all files (except node_modules/, dist/, data/, drafts/, .env)
4. Commit with message: "Initial commit"
5. Add remote: `https://github.com/asifsayed245/linkedin-rss-poster2.git`
6. Push to main branch

### Step 3: Deploy on Render

1. Go to https://render.com
2. Sign up/login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository: `asifsayed245/linkedin-rss-poster2`
5. Render will automatically detect `render.yaml` and configure everything
6. Click **"Create Web Service"**

### Step 4: Set Environment Variables

In Render dashboard → Environment, add:

```
HUGGINGFACE_TOKEN=your_new_token_here
PORT=10000
NODE_ENV=production
MAX_POSTS_PER_DAY=3
SCHEDULE_HOUR=9
SCHEDULE_MINUTE=0
SCHEDULE_TIMEZONE=America/New_York
DATABASE_PATH=./data/articles.db
DRAFTS_PATH=./drafts
MAX_ARTICLES_PER_SOURCE=5
FETCH_TIMEOUT_MS=30000
```

---

## 📊 Render Configuration

The `render.yaml` file includes:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start` (runs `dist/web.js`)
- **Plan**: Free tier
- **Disk**: 1GB persistent storage for SQLite database

---

## ⚠️ Important Notes

### Free Tier Limitations
- **Database**: Will persist with the 1GB disk attached
- **Sleep**: Service sleeps after 15 minutes of inactivity (wakes on next request)
- **Monthly Hours**: 750 hours free (enough for 1 service running 24/7)

### What's Excluded from Git
- `node_modules/` - Dependencies (installed during build)
- `dist/` - Build output (generated during build)
- `data/` - SQLite database (created at runtime, stored on disk)
- `drafts/` - Generated drafts (created at runtime)
- `.env` - Environment variables (set in Render dashboard)

---

## 🔧 Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure TypeScript compiles without errors locally: `npm run build`

### App Won't Start
- Check Render logs in the dashboard
- Verify all environment variables are set
- Check that PORT is set to 10000 (Render's default)

### Database Issues
- Free tier has ephemeral storage unless disk is attached
- The `render.yaml` includes disk configuration
- If data is lost, ensure disk is properly mounted

---

## 📝 Post-Deployment

Once deployed, your app will be available at:
`https://linkedin-rss-poster.onrender.com`

You can:
- Access the web interface
- Schedule runs automatically
- View logs in Render dashboard

---

## 🆘 Need Help?

1. Check Render documentation: https://render.com/docs
2. Review deployment logs in Render dashboard
3. Test locally first: `npm run build && npm start`

---

**Ready to deploy?** Run `deploy.bat` now!

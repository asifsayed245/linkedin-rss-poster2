# Deployment Guide 🚀

This application is ready to be deployed on **Render.com** (recommended free tier) or any Node.js hosting platform.

> ⚠️ **SECURITY WARNING:** 
> NEVER commit your `.env` file containing your real HuggingFace token to GitHub.
> Instead, you will add the token as an Environment Variable in the Render dashboard.

## Option 1: One-Click Deployment (Recommended)

1. **Push to GitHub**:
   - Run the included `deploy.bat` (Windows) or `deploy.sh` (Mac/Linux).
   - OR run these commands:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/YOUR_USER/linkedin-rss-poster.git
     git push -u origin main
     ```

2. **Deploy on Render**:
   - Create account at [render.com](https://render.com)
   - Click **New** -> **Web Service**
   - Connect your GitHub repository
   - Render will auto-detect the configuration from `render.yaml`
   - **IMPORTANT**: Scroll down to "Environment Variables" and add:
     - Key: `HUGGINGFACE_TOKEN`
     - Value: `(Your actual token starting with hf_...)`

3. **Done!**
   - Render will provide a URL (e.g., `https://linkedin-poster.onrender.com`)
   - Your app will now run daily automatically!

## Option 2: Run Locally (24/7 PC)

If you have a computer that stays on (or a Raspberry Pi):

1. Edit `.env` with your settings
2. Run `npm install`
3. Run `npm run build`
4. Run `npm run schedule`

The app will run in the background.

## Database Note

This app uses **SQLite**.
- On free services like Render/Vercel, the filesystem (and thus the database) is **ephemeral** (resets every deployment or restart).
- **Solution defined in `render.yaml`**: We requested a "Disk" mount at `./data` to keep your database safe across restarts. (Render free tier supports this).

---

## Troubleshooting

- **Deployment Fails?** Check the "Logs" tab in Render.
- **No Posts?** Ensure `HUGGINGFACE_TOKEN` is set in Render Environment Variables.

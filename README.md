# LinkedIn RSS Poster 🤖📰

Automatically fetch the latest tech and AI news from popular RSS feeds and generate engaging LinkedIn posts. Perfect for staying active on LinkedIn without spending hours curating content!

## ✨ Features

- **8+ Curated RSS Sources**: TechCrunch AI, VentureBeat, Ars Technica, MIT Technology Review, and more
- **AI-Powered Generation**: Uses Hugging Face's free API to transform articles into LinkedIn posts
- **Daily Automation**: Runs automatically once per day at your preferred time
- **Draft Review**: All posts are saved as drafts for your review before posting
- **No API Costs**: Works without paid APIs using free tiers and local processing
- **SQLite Storage**: Tracks articles and posts locally, no external database needed

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd linkedin-rss-poster
npm install
```

### 2. Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your settings
```

### 3. Run It!

```bash
# Fetch articles and generate posts once
npm run fetch

# View your generated drafts
npm run review

# Start the daily scheduler
npm run schedule
```

## ⚙️ Configuration

Edit the `.env` file to customize:

```env
# Optional: Hugging Face API Token for AI generation
# Get free token at: https://huggingface.co/settings/tokens
HUGGINGFACE_TOKEN=your_token_here

# Scheduler settings (default: 9:00 AM daily)
SCHEDULE_HOUR=9
SCHEDULE_MINUTE=0
SCHEDULE_TIMEZONE=America/New_York

# Post generation settings
MAX_POSTS_PER_DAY=3
MIN_ARTICLE_LENGTH=200
MAX_ARTICLE_LENGTH=8000

# AI Model (using free Hugging Face models)
SUMMARIZATION_MODEL=facebook/bart-large-cnn
```

### Getting a Hugging Face Token (Optional)

The app works without a token using a fallback method, but for better AI-generated posts:

1. Visit https://huggingface.co/settings/tokens
2. Create a free account
3. Generate a new token
4. Add it to your `.env` file

Free tier includes 30,000 requests/month - more than enough!

## 📡 RSS Sources

The app fetches from these curated sources:

**AI-Focused:**
- TechCrunch AI
- VentureBeat AI
- MarkTechPost
- AI Weekly

**Tech & Science:**
- Ars Technica
- The Verge
- MIT Technology Review
- Hacker News (AI/Tech filtered)

All sources are configured in `src/config/sources.ts` - you can enable/disable or add your own!

## 📝 Usage

### Fetch & Generate (One-time)
```bash
npm run fetch
```
Fetches latest articles and generates LinkedIn post drafts.

### Review Drafts
```bash
npm run review
```
Shows all your generated LinkedIn posts with:
- Title and source link
- Full post content
- Suggested hashtags
- Creation date

### Start Daily Scheduler
```bash
npm run schedule
```
Runs automatically every day at the configured time. Press `Ctrl+C` to stop.

### View Statistics
```bash
npm run stats
```
Shows total articles, posts generated, and drafts ready.

### Export Drafts
```bash
# Export to JSON
npm run export

# Export to Markdown (easier to read)
npm run export:md
```

## 📊 Data Storage

- **Database**: `data/articles.db` (SQLite)
- **Drafts**: `drafts/` folder (JSON and Markdown files)
- **Logs**: Console output with timestamps

The database tracks:
- All fetched articles (to avoid duplicates)
- Generated LinkedIn posts
- Posting status (draft, approved, posted)

## 🎨 How It Works

1. **Fetch**: Retrieves latest articles from RSS feeds
2. **Filter**: Skips duplicates and short/low-quality content
3. **Generate**: Transforms articles into engaging LinkedIn posts
   - Extracts key insights
   - Adds engaging hooks
   - Includes source links
   - Suggests relevant hashtags
4. **Store**: Saves as drafts for your review
5. **Schedule**: Runs daily at your preferred time

## 🛠️ Customization

### Add New RSS Sources

Edit `src/config/sources.ts`:

```typescript
{
  name: 'Your Source Name',
  url: 'https://example.com/feed.xml',
  category: 'ai', // or 'tech' or 'science'
  enabled: true,
}
```

### Customize Post Style

Edit `src/services/postGenerator.ts`:

- Change hooks array for different opening lines
- Modify commentary templates
- Adjust hashtag generation
- Use a different Hugging Face model

### Change Schedule

Edit `.env`:

```env
SCHEDULE_HOUR=14    # 2 PM
SCHEDULE_MINUTE=30  # :30 minutes
SCHEDULE_TIMEZONE=Europe/London
```

## 📁 Project Structure

```
linkedin-rss-poster/
├── src/
│   ├── config/
│   │   ├── config.ts      # Environment configuration
│   │   └── sources.ts     # RSS sources definition
│   ├── services/
│   │   ├── database.ts    # SQLite storage
│   │   ├── rssFetcher.ts  # RSS feed fetching
│   │   ├── postGenerator.ts  # AI post generation
│   │   ├── scheduler.ts   # Daily scheduler
│   │   └── review.ts      # CLI review interface
│   └── index.ts           # Main entry point
├── data/                  # SQLite database
├── drafts/                # Exported posts
├── .env                   # Your configuration
└── package.json
```

## 🤝 Tips for Best Results

1. **Review Before Posting**: Always review drafts before copying to LinkedIn
2. **Customize Hooks**: Edit the hooks array in postGenerator.ts to match your voice
3. **Engage With Comments**: After posting, engage with comments to boost reach
4. **Mix Content**: Don't just post AI news - share your own insights too
5. **Track Performance**: Note which posts get more engagement and refine accordingly

## 🐛 Troubleshooting

**"No drafts available"**
- Run `npm run fetch` to generate posts
- Check that RSS sources are reachable
- Verify `MAX_POSTS_PER_DAY` setting

**HuggingFace API errors**
- Check your token is valid
- Try a different model in config
- App falls back to local generation if API fails

**RSS fetch failures**
- Some sources may block automated requests
- Check your internet connection
- Try increasing `FETCH_TIMEOUT_MS`

## 📄 License

ISC License - Feel free to use and modify!

## 🙏 Credits

Built with:
- [RSS Parser](https://github.com/rbren/rss-parser)
- [Hugging Face Inference API](https://huggingface.co/inference-api)
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3)
- [Node Cron](https://github.com/node-cron/node-cron)

---

**Happy Posting!** 🚀

Remember: The best LinkedIn posts combine curated content with your unique perspective. Use these drafts as a starting point and add your own insights!

---

## 🚀 Deployment

### Important: Database Limitation

This app uses SQLite (better-sqlite3). For cloud deployment:
- **Vercel**: Data is ephemeral (resets on each deploy/function call)
- **Railway/Render**: Data persists with persistent storage

### Deploy to Railway (Recommended)

Railway offers free persistent storage for SQLite:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/linkedin-rss-poster.git
   git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to https://railway.app
   - New Project → Deploy from GitHub repo
   - Select your repository
   - Railway auto-deploys with persistent storage

### Deploy to Vercel

For serverless deployment (data resets on each deploy):

1. Push to GitHub (same as above)
2. Go to https://vercel.com/new
3. Import your GitHub repo
4. Framework Preset: `Other`
5. Build Command: `npm run build`
6. Deploy

### Deploy to Render

1. Push to GitHub (same as above)
2. Go to https://render.com
3. New Web Service → Connect GitHub repo
4. Settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Deploy

### Environment Variables

Set these in your hosting platform:

```
HUGGINGFACE_TOKEN=your_token_here
MAX_POSTS_PER_DAY=3
SCHEDULE_HOUR=9
```

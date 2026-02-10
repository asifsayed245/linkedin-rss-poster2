import express from 'express';
import path from 'path';
import { DatabaseService } from './services/database';
import { Scheduler } from './services/scheduler';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database (will be ephemeral on Vercel)
let db: DatabaseService;
try {
    db = new DatabaseService();
} catch (error) {
    console.error('Database initialization failed:', error);
}

app.use(express.static('public'));
app.use(express.json());

// Home page - show all drafts
app.get('/', (req, res) => {
    const drafts = db.getDrafts(50);
    const stats = db.getStats();

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LinkedIn RSS Poster</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-box { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .stat-value { font-size: 24px; font-weight: bold; color: #0077b5; }
        .stat-label { font-size: 14px; color: #666; }
        .btn { background: #0077b5; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 14px; }
        .btn:hover { background: #006097; }
        .post-date { color: #666; font-size: 14px; }
        .post-content { white-space: pre-wrap; margin: 15px 0; line-height: 1.5; }
        .tags { color: #0077b5; font-size: 14px; }
        .source-link { color: #666; text-decoration: none; font-size: 14px; display: inline-block; margin-top: 10px; }
        .source-link:hover { text-decoration: underline; }
        .controls { display: flex; gap: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>LinkedIn RSS Poster</h1>
        <div class="controls">
            <button class="btn" onclick="fetchNew()">Fetch New Articles</button>
            <a href="/export" class="btn" style="background: #28a745;">Export All Drafts</a>
        </div>
    </div>

    <div class="stats">
        <div class="stat-box">
            <div class="stat-value">${stats.totalArticles}</div>
            <div class="stat-label">Total Articles</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">${stats.totalPosts}</div>
            <div class="stat-label">Generated Posts</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">${stats.drafts}</div>
            <div class="stat-label">Pending Drafts</div>
        </div>
    </div>

    <h2>Recent Drafts</h2>
    <div id="postsContainer">
`;

    if (drafts.length === 0) {
        html += '<div class="card" style="text-align: center; color: #666;">No drafts available. Click "Fetch New Articles" to generate some!</div>';
    } else {
        drafts.forEach(draft => {
            html += `
        <div class="card">
            <div class="post-date">Created: ${draft.createdAt.toLocaleDateString()}</div>
            <h3>${draft.title}</h3>
            <div class="post-content">${draft.content}</div>
            <div class="tags">${draft.hashtags.join(' ')}</div>
            <a href="${draft.link}" target="_blank" class="source-link">Source: ${draft.link}</a>
        </div>
        `;
        });
    }

    html += `
    </div>

    <script>
        function fetchNew() {
            const btn = document.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'Processing...';
            btn.disabled = true;
            
            fetch('/fetch', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('Error: ' + data.error);
                        btn.innerText = originalText;
                        btn.disabled = false;
                    }
                })
                .catch(err => {
                    alert('Error fetching articles');
                    btn.innerText = originalText;
                    btn.disabled = false;
                });
        }
    </script>
</body>
</html>`;

    res.send(html);
});

// Trigger fetch
app.post('/fetch', (req, res) => {
    const scheduler = new Scheduler();
    scheduler.runOnce().then(() => {
        res.json({ success: true });
    }).catch(error => {
        res.status(500).json({ error: error.message });
    });
});

// Export all drafts as markdown
app.get('/export', (req, res) => {
    const drafts = db.getDrafts(100);

    let markdown = `# LinkedIn Post Drafts - ${new Date().toISOString().split('T')[0]}\n\n`;
    markdown += `Generated ${drafts.length} posts from tech & AI RSS feeds\n\n`;
    markdown += '---\n\n';

    drafts.forEach((draft, index) => {
        markdown += `## Post ${index + 1}: ${draft.title}\n\n`;
        markdown += `**Source:** [${draft.link}](${draft.link})\n\n`;
        markdown += `**Created:** ${draft.createdAt.toLocaleDateString()}\n\n`;
        markdown += '**Content:**\n\n';
        markdown += '\`\`\`\n' + draft.content + '\n\`\`\`\n\n';
        markdown += `**Hashtags:** ${draft.hashtags.join(' ')}\n\n`;
        markdown += '---\n\n';
    });

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename=linkedin-drafts-${new Date().toISOString().split('T')[0]}.md`);
    res.send(markdown);
});

// API endpoint to get drafts as JSON
app.get('/api/drafts', (req, res) => {
    const drafts = db.getDrafts(100);
    res.json(drafts);
});

// API endpoint to get drafts by category
app.get('/api/drafts/:category', (req, res) => {
    const category = req.params.category;
    const drafts = db.getDraftsByCategory(category);
    res.json(drafts);
});

// API endpoint to get all categories with counts
app.get('/api/categories', (req, res) => {
    const drafts = db.getDrafts(100);
    const counts: Record<string, number> = {};
    drafts.forEach(d => {
        const cat = (d as any).category || 'tech';
        counts[cat] = (counts[cat] || 0) + 1;
    });
    res.json(counts);
});

// Get stats
app.get('/api/stats', (req, res) => {
    res.json(db.getStats());
});

// Export for Vercel serverless functions
export default app;

// Start server only if running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log('\n🌐 LinkedIn RSS Poster Web Interface');
        console.log('========================================');
        console.log(`📱 Open your browser and go to:`);
        console.log(`   http://localhost:${PORT}\n`);
        console.log('Press Ctrl+C to stop the server\n');
    });
}

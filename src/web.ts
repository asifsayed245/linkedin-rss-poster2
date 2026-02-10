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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
            padding: 20px;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        .stats-bar {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 40px;
            flex-wrap: wrap;
        }
        .stat-box {
            background: white;
            padding: 20px 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            min-width: 150px;
        }
        .stat-box h3 {
            color: #667eea;
            font-size: 2em;
            margin-bottom: 5px;
        }
        .stat-box p {
            color: #666;
            font-size: 0.9em;
        }
        .actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 40px;
            flex-wrap: wrap;
        }
        .btn {
            background: white;
            color: #667eea;
            border: none;
            padding: 15px 30px;
            border-radius: 30px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }
        .btn-primary {
            background: #ff6b6b;
            color: white;
        }
        .draft-card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s ease;
        }
        .draft-card:hover {
            transform: translateY(-5px);
        }
        .draft-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
        }
        .draft-title {
            font-size: 1.4em;
            color: #333;
            font-weight: 600;
            margin-bottom: 5px;
            line-height: 1.4;
        }
        .draft-source {
            color: #667eea;
            font-size: 0.9em;
            text-decoration: none;
        }
        .draft-source:hover {
            text-decoration: underline;
        }
        .draft-date {
            color: #999;
            font-size: 0.85em;
            white-space: nowrap;
            margin-left: 20px;
        }
        .draft-content {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            font-size: 1.05em;
            line-height: 1.8;
            color: #444;
            border-left: 4px solid #667eea;
        }
        .draft-content p {
            margin-bottom: 10px;
        }
        .hashtags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 15px;
        }
        .hashtag {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 500;
        }
        .copy-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 0.95em;
            font-weight: 600;
            margin-top: 15px;
            transition: all 0.3s ease;
        }
        .copy-btn:hover {
            background: #218838;
            transform: translateY(-2px);
        }
        .copy-btn.copied {
            background: #6c757d;
        }
        .empty-state {
            text-align: center;
            color: white;
            padding: 60px 20px;
        }
        .empty-state h2 {
            font-size: 2em;
            margin-bottom: 20px;
        }
        .empty-state p {
            font-size: 1.2em;
            opacity: 0.9;
            margin-bottom: 30px;
        }
        .status-bar {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
        }
        .category-tabs {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .category-tab {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 2px solid transparent;
            padding: 10px 25px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        .category-tab:hover {
            background: rgba(255,255,255,0.3);
        }
        .category-tab.active {
            background: white;
            color: #667eea;
            border-color: #667eea;
        }
        .category-count {
            background: rgba(0,0,0,0.2);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.8em;
            margin-left: 5px;
        }
        .category-section {
            margin-bottom: 40px;
        }
        .category-title {
            color: white;
            font-size: 1.5em;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .category-icon {
            font-size: 1.2em;
        }
        .section-divider {
            border-top: 2px dashed rgba(255,255,255,0.3);
            margin: 40px 0;
        }
        @media (max-width: 768px) {
            .header h1 { font-size: 1.8em; }
            .stat-box { padding: 15px 25px; min-width: 120px; }
            .draft-header { flex-direction: column; }
            .draft-date { margin-left: 0; margin-top: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 LinkedIn RSS Poster</h1>
            <p>Your AI-powered content curator</p>
        </div>
        
        <div class="status-bar">
            📱 Open this app at: <strong>http://localhost:${PORT}</strong>
        </div>

        <div class="stats-bar">
            <div class="stat-box">
                <h3>${stats.totalArticles}</h3>
                <p>Articles Fetched</p>
            </div>
            <div class="stat-box">
                <h3>${stats.totalPosts}</h3>
                <p>Posts Generated</p>
            </div>
            <div class="stat-box">
                <h3>${stats.drafts}</h3>
                <p>Drafts Ready</p>
            </div>
        </div>

        <div class="actions">
            <button class="btn btn-primary" onclick="fetchNew()">🔄 Fetch New Articles</button>
            <a href="/export" class="btn">📥 Export All Drafts</a>
        </div>
`;

  if (drafts.length === 0) {
    html += `
        <div class="empty-state">
            <h2>📭 No Drafts Available</h2>
            <p>Click "Fetch New Articles" to get started!</p>
        </div>
`;
  } else {
    // Group drafts by category
    const categories = ['ai', 'tech', 'science'];
    const categoryInfo = {
      ai: { name: 'AI & Machine Learning', icon: '🤖', color: '#667eea' },
      tech: { name: 'Technology', icon: '💻', color: '#28a745' },
      science: { name: 'Science', icon: '🔬', color: '#ffc107' },
    };
    
    // Filter drafts by category
    const draftsByCategory: Record<string, typeof drafts> = {};
    categories.forEach(cat => {
      draftsByCategory[cat] = drafts.filter(d => {
        const draft = d as any;
        return draft.category === cat;
      });
    });
    
    html += `        <div class="category-tabs" id="categoryTabs">
            <button class="category-tab active" onclick="filterCategory('all', this)">
                📋 All <span class="category-count">${drafts.length}</span>
            </button>
`;
    categories.forEach(cat => {
      const count = draftsByCategory[cat]?.length || 0;
      if (count > 0) {
        html += `            <button class="category-tab" onclick="filterCategory('${cat}', this)">
                ${categoryInfo[cat as keyof typeof categoryInfo].icon} ${categoryInfo[cat as keyof typeof categoryInfo].name} <span class="category-count">${count}</span>
            </button>
`;
      }
    });
    html += `        </div>

        <div id="postsContainer">
`;
    
    // Show all posts initially (will be filtered by JS)
    drafts.forEach((draft, index) => {
      const content = draft.content
        .replace(/\n/g, '<br>')
        .replace(/&#8217;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, ' ');
      
      const cat = (draft as any).category || 'tech';
      const catInfo = categoryInfo[cat as keyof typeof categoryInfo] || categoryInfo.tech;
      
      html += `
            <div class="draft-card category-item" data-category="${cat}">
                <div class="draft-header">
                    <div>
                        <div class="draft-title">${index + 1}. ${draft.title}</div>
                        <a href="${draft.link}" target="_blank" class="draft-source">🔗 ${catInfo.icon} ${catInfo.name} • ${(draft as any).source || 'Unknown Source'}</a>
                    </div>
                    <div class="draft-date">${draft.createdAt.toLocaleDateString()}</div>
                </div>
                <div class="draft-content" id="content-${index}">
                    ${content}
                </div>
                <div class="hashtags">
                    ${draft.hashtags.map((tag: string) => `<span class="hashtag">${tag}</span>`).join('')}
                </div>
                <button class="copy-btn" onclick="copyToClipboard(${index})">
                    📋 Copy to Clipboard
                </button>
            </div>
`;
    });
    
    html += `        </div>
`;
  }

  html += `
    </div>

    <script>
        let currentFilter = 'all';

        function copyToClipboard(index) {
            const content = document.getElementById('content-' + index).innerText;
            navigator.clipboard.writeText(content).then(() => {
                const btn = event.target;
                btn.textContent = '✅ Copied!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = '📋 Copy to Clipboard';
                    btn.classList.remove('copied');
                }, 2000);
            });
        }

        function fetchNew() {
            const btn = event.target;
            btn.textContent = '🔄 Fetching...';
            btn.disabled = true;
            fetch('/fetch', { method: 'POST' })
                .then(() => {
                    location.reload();
                })
                .catch(() => {
                    btn.textContent = '🔄 Fetch New Articles';
                    btn.disabled = false;
                    alert('Fetch initiated! Page will refresh shortly.');
                    setTimeout(() => location.reload(), 3000);
                });
        }

        function filterCategory(category, btn) {
            currentFilter = category;
            
            // Update active tab
            document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter posts
            document.querySelectorAll('.category-item').forEach(item => {
                if (category === 'all' || item.dataset.category === category) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
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

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

// Home page - show all drafts with category filter
app.get('/', (req, res) => {
    const category = req.query.category as string;
    let drafts, categories;

    if (category && category !== 'all') {
        drafts = db.getDraftsByCategory(category);
    } else {
        drafts = db.getDraftsWithImages(50);
    }

    categories = db.getAllCategories();
    const dbStats = db.getStats();

    // Calculate stats based on current view
    const totalDrafts = dbStats.drafts;
    const showingCount = drafts.length;
    const isFiltered = !!(category && category !== 'all');

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LinkedIn RSS Poster</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-box { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .stat-value { font-size: 24px; font-weight: bold; color: #0077b5; }
        .stat-label { font-size: 14px; color: #666; }
        .stat-box.active { background: #e3f2fd; border: 2px solid #0077b5; }
        .btn { background: #0077b5; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 14px; display: inline-flex; align-items: center; gap: 5px; }
        .btn:hover { background: #006097; }
        .btn-secondary { background: #6c757d; }
        .btn-secondary:hover { background: #5a6268; }
        .btn-success { background: #28a745; }
        .btn-success:hover { background: #218838; }
        .post-date { color: #666; font-size: 14px; }
        .post-content { white-space: pre-wrap; margin: 15px 0; line-height: 1.5; }
        .tags { color: #0077b5; font-size: 14px; }
        .source-link { color: #666; text-decoration: none; font-size: 14px; display: inline-block; margin-top: 10px; }
        .source-link:hover { text-decoration: underline; }
        .controls { display: flex; gap: 10px; flex-wrap: wrap; }
        .image-container { margin: 15px 0; text-align: center; }
        .post-image { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .visual-badge { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-left: 10px; }
        .category-badge { display: inline-block; background: #f0f0f0; color: #333; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-right: 10px; text-transform: uppercase; font-weight: 600; }
        .category-badge.ai { background: #e3f2fd; color: #1565c0; }
        .category-badge.tech { background: #e8f5e9; color: #2e7d32; }
        .category-badge.science { background: #fff3e0; color: #ef6c00; }
        .category-filter { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: center; }
        .category-btn { background: white; border: 2px solid #ddd; color: #333; padding: 8px 16px; border-radius: 20px; cursor: pointer; text-decoration: none; font-size: 14px; transition: all 0.2s; }
        .category-btn:hover { border-color: #0077b5; color: #0077b5; }
        .category-btn.active { background: #0077b5; color: white; border-color: #0077b5; }
        .copy-btn { background: #17a2b8; }
        .copy-btn:hover { background: #138496; }
        .copy-btn.copied { background: #28a745; }
        .post-actions { display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap; }
        .toast { position: fixed; bottom: 20px; right: 20px; background: #28a745; color: white; padding: 12px 24px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); opacity: 0; transform: translateY(20px); transition: all 0.3s; z-index: 1000; }
        .toast.show { opacity: 1; transform: translateY(0); }
        .section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .section-title h2 { margin: 0; }
        .no-posts { text-align: center; color: #666; padding: 40px; }
        .category-count { font-size: 12px; color: #666; margin-left: 5px; }
        .showing-info { background: #e3f2fd; padding: 10px 15px; border-radius: 8px; margin-bottom: 20px; color: #1565c0; font-size: 14px; }
        .clear-filter { color: #0077b5; text-decoration: underline; cursor: pointer; margin-left: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>LinkedIn RSS Poster</h1>
        <div class="controls">
            <button class="btn" onclick="fetchNew()">Fetch New Articles</button>
            <a href="/export" class="btn btn-success">Export Markdown</a>
            <a href="/export/doc" class="btn btn-success">Export Word Doc</a>
        </div>
    </div>

    <div class="stats">
        <div class="stat-box">
            <div class="stat-value">${dbStats.totalArticles}</div>
            <div class="stat-label">Total Articles Fetched</div>
        </div>
        <div class="stat-box">
            <div class="stat-value">${dbStats.totalPosts}</div>
            <div class="stat-label">Total Posts Generated</div>
        </div>
        <div class="stat-box ${isFiltered ? 'active' : ''}">
            <div class="stat-value">${showingCount}</div>
            <div class="stat-label">${isFiltered ? category.toUpperCase() + ' Posts' : 'Drafts Ready to Post'}</div>
        </div>
    </div>

    ${isFiltered ? `
    <div class="showing-info">
        <strong>Showing:</strong> ${showingCount} posts from category "${category}" 
        <a href="/?category=all" class="clear-filter">Clear Filter</a>
    </div>
    ` : ''}

    <div class="section-title">
        <h2>Filter by Category</h2>
    </div>
    
    <div class="category-filter">
        <a href="/?category=all" class="category-btn ${!category || category === 'all' ? 'active' : ''}">
            All Categories
            <span class="category-count">(${totalDrafts})</span>
        </a>
        ${categories.map(cat => `
            <a href="/?category=${cat}" class="category-btn ${category === cat ? 'active' : ''}">
                ${cat}
                <span class="category-count">(${db.getDraftsByCategory(cat).length})</span>
            </a>
        `).join('')}
    </div>

    <div class="section-title">
        <h2>${isFiltered ? category.toUpperCase() + ' Posts' : 'Recent Drafts'}</h2>
    </div>
    
    <div id="postsContainer">
`;

    if (drafts.length === 0) {
        html += '<div class="card no-posts">No drafts available' + (isFiltered ? ' for category "' + category + '"' : '') + '. Click "Fetch New Articles" to generate some!</div>';
    } else {
        drafts.forEach(draft => {
            html += `
        <div class="card" data-category="${draft.category}">
            <div class="post-date">
                <span class="category-badge ${draft.category}">${draft.category}</span>
                Created: ${draft.createdAt.toLocaleDateString()}
                ${draft.hasImage ? '<span class="visual-badge">AI Image</span>' : ''}
                ${draft.infographicPath ? '<span class="visual-badge">Infographic</span>' : ''}
            </div>
            <h3>${draft.title}</h3>
            
            ${draft.imageUrl ? `
            <div class="image-container">
                <img src="${draft.imageUrl}" alt="AI Generated Image" class="post-image" loading="lazy">
            </div>
            ` : ''}
            
            <div class="post-content" id="content-${draft.id}">${draft.content}</div>
            <div class="tags">${draft.hashtags.join(' ')}</div>
            
            <div class="post-actions">
                <a href="${draft.link}" target="_blank" class="btn btn-secondary">Source</a>
                <button class="btn copy-btn" onclick="copyPost(${draft.id}, this)">
                    Copy Post
                </button>
                ${draft.imageUrl ? `
                <a href="${draft.imageUrl}" download class="btn btn-success">Download Image</a>
                ` : ''}
            </div>
        </div>
        `;
        });
    }

    html += `
    </div>

    <div id="toast" class="toast">Copied to clipboard!</div>

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

        async function copyPost(postId, btn) {
            const content = document.getElementById('content-' + postId).innerText;
            
            try {
                await navigator.clipboard.writeText(content);
                
                // Show visual feedback
                const originalText = btn.innerText;
                btn.innerText = 'Copied!';
                btn.classList.add('copied');
                
                // Show toast
                showToast();
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.classList.remove('copied');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                alert('Failed to copy to clipboard');
            }
        }

        function showToast() {
            const toast = document.getElementById('toast');
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    </script>
</body>
</html>`;

    res.send(html);
});

// Category page - show posts by category
app.get('/category/:category', (req, res) => {
    const category = req.params.category;
    const drafts = db.getDraftsByCategory(category);

    res.json({
        category,
        count: drafts.length,
        drafts
    });
});

// Get all categories
app.get('/api/categories', (req, res) => {
    const categories = db.getAllCategories();
    const counts = categories.map(cat => ({
        name: cat,
        count: db.getDraftsByCategory(cat).length
    }));

    res.json({ categories: counts });
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

    let markdown = '# LinkedIn Post Drafts - ' + new Date().toISOString().split('T')[0] + '\n\n';
    markdown += 'Generated ' + drafts.length + ' posts from tech & AI RSS feeds\n\n';
    markdown += '---\n\n';

    drafts.forEach((draft, index) => {
        markdown += '## Post ' + (index + 1) + ': ' + draft.title + '\n\n';
        markdown += '**Category:** ' + (draft.category || 'N/A') + '\n\n';
        markdown += '**Source:** [' + draft.link + '](' + draft.link + ')\n\n';
        markdown += '**Created:** ' + draft.createdAt.toLocaleDateString() + '\n\n';
        markdown += '**Content:**\n\n';
        markdown += '```\n' + draft.content + '\n```\n\n';
        markdown += '**Hashtags:** ' + draft.hashtags.join(' ') + '\n\n';
        markdown += '---\n\n';
    });

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename=linkedin-drafts-' + new Date().toISOString().split('T')[0] + '.md');
    res.send(markdown);
});

// Export all drafts as Word document (HTML format)
app.get('/export/doc', (req, res) => {
    const drafts = db.getDrafts(100);
    const date = new Date().toISOString().split('T')[0];

    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">\n<head>\n    <meta charset="utf-8">\n    <title>LinkedIn Post Drafts</title>\n    <style>\n        body { font-family: Calibri, Arial, sans-serif; line-height: 1.6; margin: 40px; }\n        h1 { color: #0077b5; border-bottom: 2px solid #0077b5; padding-bottom: 10px; }\n        h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }\n        .meta { color: #666; font-size: 14px; margin: 10px 0; }\n        .content { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; white-space: pre-wrap; }\n        .hashtags { color: #0077b5; font-weight: bold; }\n        .category { background: #e3f2fd; color: #1565c0; padding: 3px 10px; border-radius: 12px; font-size: 12px; text-transform: uppercase; }\n        hr { border: none; border-top: 1px solid #ddd; margin: 30px 0; }\n        .source { color: #666; font-size: 13px; }\n    </style>\n</head>\n<body>\n    <h1>LinkedIn Post Drafts - ' + date + '</h1>\n    <p style="color: #666;">Generated ' + drafts.length + ' posts from tech & AI RSS feeds</p>\n    <hr>';

    drafts.forEach((draft, index) => {
        html += '\n    <h2>Post ' + (index + 1) + ': ' + draft.title + '</h2>\n    <div class="meta">\n        <span class="category">' + (draft.category || 'N/A') + '</span> | \n        Created: ' + draft.createdAt.toLocaleDateString() + ' | \n        <span class="source">Source: ' + draft.link + '</span>\n    </div>\n    <div class="content">' + draft.content.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>\n    <div class="hashtags">' + draft.hashtags.join(' ') + '</div>\n    <hr>';
    });

    html += '\n</body>\n</html>';

    res.setHeader('Content-Type', 'application/msword');
    res.setHeader('Content-Disposition', 'attachment; filename=linkedin-drafts-' + date + '.doc');
    res.send(html);
});

// API endpoint to get drafts as JSON
app.get('/api/drafts', (req, res) => {
    const category = req.query.category as string;
    let drafts;

    if (category) {
        drafts = db.getDraftsByCategory(category);
    } else {
        drafts = db.getDrafts(100);
    }

    res.json(drafts);
});

// Get stats
app.get('/api/stats', (req, res) => {
    res.json(db.getStats());
});

// Debug endpoint to check configuration (Masked)
app.get('/debug/config', (req, res) => {
    const hfToken = process.env.HUGGINGFACE_TOKEN;
    const dbPath = process.env.DB_PATH || './data/linkedin.db';

    res.json({
        env: {
            NODE_ENV: process.env.NODE_ENV,
            HUGGINGFACE_TOKEN: hfToken ? `${hfToken.substring(0, 4)}...${hfToken.substring(hfToken.length - 4)}` : 'MISSING',
            DB_PATH: dbPath,
            PORT: process.env.PORT
        },
        status: {
            database: db ? 'Connected' : 'Failed',
            scheduler: 'Active'
        }
    });
});

import { ImageGenerator } from './services/imageGenerator';

// Debug endpoint to test Hugging Face generation directly (No Fallback)
app.get('/debug/test-image', async (req, res) => {
    const generator = new ImageGenerator();
    const result = await generator.testHuggingFaceConnection();
    res.json(result);
});

// Export for Vercel serverless functions
export default app;

// Start server only if running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log('\n🌐 LinkedIn RSS Poster Web Interface');
        console.log('========================================');
        console.log('📱 Open your browser and go to:');
        console.log('   http://localhost:' + PORT + '\n');
        console.log('Press Ctrl+C to stop the server\n');
    });
}

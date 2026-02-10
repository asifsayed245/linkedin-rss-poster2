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
    <title>KOSMA | NETWORK LINK</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
    <style>
        :root {
            --chassis-bg: #e0e0e0;
            --panel-bg: #1a1a1a;
            --accent-orange: #ff5500;
            --text-main: #e0e0e0;
            --text-muted: #888;
            --grid-line: rgba(255, 255, 255, 0.1);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Share Tech Mono', monospace;
            background-color: #c0c0c0;
            background-image: radial-gradient(#b0b0b0 1px, transparent 1px);
            background-size: 20px 20px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px 20px;
            color: var(--text-main);
        }

        /* --- Animations --- */
        @keyframes bootText {
            0% { opacity: 0; transform: translateY(-10px); }
            50% { opacity: 1; }
            100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 5px var(--accent-orange); }
            50% { box-shadow: 0 0 15px var(--accent-orange); }
            100% { box-shadow: 0 0 5px var(--accent-orange); }
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* --- Device Chassis --- */
        .device-chassis {
            background: var(--chassis-bg);
            width: 100%;
            max-width: 1000px;
            border-radius: 40px;
            padding: 40px;
            box-shadow: 
                20px 20px 60px #a3a3a3,
                -20px -20px 60px #ffffff,
                inset 5px 5px 10px rgba(0,0,0,0.1);
            position: relative;
            border: 2px solid #bbb;
        }

        /* Decor Screws */
        .screw {
            position: absolute;
            width: 15px;
            height: 15px;
            background: #bdc3c7;
            border-radius: 50%;
            box-shadow: inset 1px 1px 2px rgba(0,0,0,0.3), 1px 1px 0 white;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .screw::after { content: ''; width: 100%; height: 2px; background: #95a5a6; transform: rotate(45deg); }
        .screw.tl { top: 15px; left: 15px; }
        .screw.tr { top: 15px; right: 15px; transform: rotate(90deg); }
        .screw.bl { bottom: 15px; left: 15px; transform: rotate(180deg); }
        .screw.br { bottom: 15px; right: 15px; transform: rotate(270deg); }

        /* --- Main Interface Panel --- */
        .interface-panel {
            background: var(--panel-bg);
            border-radius: 20px;
            padding: 30px;
            box-shadow: inset 0 0 30px rgba(0,0,0,0.8);
            position: relative;
            overflow: hidden;
            border: 2px solid #333;
        }

        /* Screen Glare & Scanline */
        .interface-panel::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%);
            pointer-events: none;
            z-index: 10;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 30px;
            border-bottom: 1px solid var(--grid-line);
            padding-bottom: 15px;
            animation: bootText 0.8s ease-out;
        }

        .brand h1 {
            font-size: 3em;
            color: var(--text-main);
            letter-spacing: -2px;
            line-height: 0.8;
            margin-bottom: 5px;
        }
        
        .brand .subtitle {
            font-size: 0.8em;
            color: var(--accent-orange);
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .system-status {
            text-align: right;
            font-size: 0.7em;
            color: var(--text-muted);
        }

        .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: var(--accent-orange);
            border-radius: 50%;
            margin-left: 5px;
            animation: pulse 2s infinite;
        }

        /* --- Stats Grid --- */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }

        .stat-module {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--grid-line);
            padding: 15px;
            border-radius: 5px;
            animation: slideUp 0.5s ease-out backwards;
        }
        .stat-module:nth-child(1) { animation-delay: 0.1s; }
        .stat-module:nth-child(2) { animation-delay: 0.2s; }
        .stat-module:nth-child(3) { animation-delay: 0.3s; }

        .stat-value {
            font-size: 2.5em;
            color: var(--accent-orange);
            line-height: 1;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 0.7em;
            text-transform: uppercase;
            color: var(--text-muted);
            letter-spacing: 1px;
        }

        /* --- Controls --- */
        .control-panel {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
            border: 1px solid #333;
        }

        .btn {
            background: #2a2a2a;
            color: var(--text-main);
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            font-family: 'Share Tech Mono', monospace;
            font-size: 1em;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.2s;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 0 #000;
        }

        .btn:hover {
            background: #333;
            transform: translateY(-2px);
            box-shadow: 0 6px 0 #000;
            color: var(--accent-orange);
        }

        .btn:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0 #000;
        }

        .btn-primary {
            background: var(--accent-orange);
            color: #000;
            font-weight: bold;
            box-shadow: 0 4px 0 #b33c00;
        }
        
        .btn-primary:hover {
            background: #ff6a22;
            color: #000;
            box-shadow: 0 6px 0 #b33c00;
        }

        .tabs {
            display: flex;
            gap: 2px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--grid-line);
        }

        .tab {
            background: transparent;
            border: 1px solid transparent;
            color: var(--text-muted);
            padding: 8px 16px;
            cursor: pointer;
            font-family: inherit;
            transition: 0.3s;
        }
        
        .tab.active {
            border: 1px solid var(--grid-line);
            border-bottom-color: var(--panel-bg);
            color: var(--accent-orange);
            background: rgba(255,255,255,0.02);
        }

        /* --- Content Area --- */
        .feed-container {
            height: 500px;
            overflow-y: auto;
            padding-right: 10px;
        }

        /* Scrollbar */
        .feed-container::-webkit-scrollbar { width: 8px; }
        .feed-container::-webkit-scrollbar-track { background: #000; }
        .feed-container::-webkit-scrollbar-thumb { background: #333; border: 1px solid #555; }
        
        .log-entry {
            border-left: 2px solid var(--grid-line);
            padding: 15px 15px 15px 20px;
            margin-bottom: 20px;
            background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, transparent 100%);
            transition: 0.3s;
            position: relative;
            animation: slideUp 0.5s ease-out backwards;
        }
        
        .log-entry::before {
            content: '';
            position: absolute;
            left: -6px;
            top: 20px;
            width: 10px;
            height: 10px;
            background: var(--panel-bg);
            border: 2px solid var(--grid-line);
            transform: rotate(45deg);
            transition: 0.3s;
        }

        .log-entry:hover {
            border-left-color: var(--accent-orange);
            background: linear-gradient(90deg, rgba(255,85,0,0.1) 0%, transparent 100%);
        }

        .log-entry:hover::before {
            border-color: var(--accent-orange);
            background: var(--accent-orange);
        }

        .entry-meta {
            font-size: 0.75em;
            color: var(--text-muted);
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }

        .entry-title {
            font-size: 1.2em;
            margin-bottom: 10px;
            color: #fff;
        }

        .entry-source {
            color: var(--accent-orange);
            text-decoration: none;
        }

        .entry-content {
            font-size: 0.9em;
            line-height: 1.6;
            color: #ccc;
            margin-bottom: 10px;
            max-height: 100px;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
        }

        .tag {
            display: inline-block;
            font-size: 0.7em;
            border: 1px solid var(--text-muted);
            padding: 2px 6px;
            margin-right: 5px;
            color: var(--text-muted);
        }

        .copy-trigger {
            background: transparent;
            border: 1px solid var(--accent-orange);
            color: var(--accent-orange);
            font-size: 0.7em;
            padding: 4px 10px;
            cursor: pointer;
            margin-top: 10px;
            transition: 0.2s;
            text-transform: uppercase;
        }
        
        .copy-trigger:hover {
            background: var(--accent-orange);
            color: #000;
        }

        /* Loading Spinner */
        .spinner {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 2px solid rgba(0,0,0,0.3);
            border-radius: 50%;
            border-top-color: #000;
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
        }
        
    </style>
</head>
<body>
    <div class="device-chassis">
        <div class="screw tl"></div>
        <div class="screw tr"></div>
        <div class="screw bl"></div>
        <div class="screw br"></div>

        <div class="interface-panel">
            <header class="header">
                <div class="brand">
                    <div class="subtitle">AUTONOMOUS FEED UNIT</div>
                    <h1>KOSMA<span style="color:var(--accent-orange)">62</span></h1>
                </div>
                <div class="system-status">
                    SYSTEM ONLINE <span class="status-dot"></span><br>
                    V.1.0.4.RC
                </div>
            </header>

            <div class="stats-grid">
                <div class="stat-module">
                    <div class="stat-value">${stats.totalArticles}</div>
                    <div class="stat-label">INPUT_STREAMS</div>
                </div>
                <div class="stat-module">
                    <div class="stat-value">${stats.totalPosts}</div>
                    <div class="stat-label">GENERATED_LOGS</div>
                </div>
                <div class="stat-module">
                    <div class="stat-value">${stats.drafts}</div>
                    <div class="stat-label">BUFFER_SIZE</div>
                </div>
            </div>

            <div class="control-panel">
                <button class="btn btn-primary" onclick="fetchNew(this)">
                    INITIATE_FETCH
                </button>
                <a href="/export" class="btn">
                    EXPORT_DATA_DUMP
                </a>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="filterCategory('all', this)">ALL_STREAMS [${drafts.length}]</button>
                <button class="tab" onclick="filterCategory('ai', this)">AI_CORE</button>
                <button class="tab" onclick="filterCategory('tech', this)">TECH_SECTOR</button>
                <button class="tab" onclick="filterCategory('science', this)">RESEARCH_LABS</button>
            </div>

            <div class="feed-container" id="postsContainer">
`;

    if (drafts.length === 0) {
        html += `
                <div style="text-align:center; padding: 40px; color: var(--text-muted);">
                    [ NO_DATA_IN_BUFFER ]<br>
                    INITIATE_FETCH_SEQUENCE
                </div>
    `;
    } else {
        drafts.forEach((draft, index) => {
            const content = draft.content
                .replace(/\n/g, '<br>')
                .replace(/[']/g, "\\'") // Escape single quotes for JS if needed, mostly handled by browser
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            const cat = (draft as any).category || 'tech';

            // Stagger animation delay based on index
            const delay = (index % 10) * 0.1;

            html += `
                <div class="log-entry" data-category="${cat}" style="animation-delay: ${delay}s">
                    <div class="entry-meta">
                        <span>ID: #${String(index + 1).padStart(3, '0')}</span>
                        <span>${draft.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div class="entry-title">${draft.title}</div>
                    <a href="${draft.link}" target="_blank" class="entry-source">SOURCE_LINK >></a>
                    
                    <div class="entry-content" id="content-${index}">${content}</div>
                    
                    <div style="margin-top: 10px;">
                        ${draft.hashtags.map((tag: string) => `<span class="tag">${tag}</span>`).join('')}
                    </div>

                    <button class="copy-trigger" onclick="copyToClipboard(${index}, this)">
                        COPY_TO_CLIPBOARD
                    </button>
                </div>
        `;
        });
    }

    html += `
            </div> <!-- End feed-container -->
        </div> <!-- End interface-panel -->
    </div> <!-- End device-chassis -->

    <script>
        function copyToClipboard(index, btn) {
            const content = document.getElementById('content-' + index).innerText;
            navigator.clipboard.writeText(content).then(() => {
                const originalText = btn.innerText;
                btn.innerText = 'COPIED_TO_BUFFER';
                btn.style.backgroundColor = 'var(--accent-orange)';
                btn.style.color = 'black';
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = 'transparent';
                    btn.style.color = 'var(--accent-orange)';
                }, 2000);
            });
        }

        function fetchNew(btn) {
            const originalText = btn.innerText;
            btn.innerHTML = '<span class="spinner"></span> PROCESSING...';
            btn.disabled = true;
            
            fetch('/fetch', { method: 'POST' })
                .then(() => {
                    btn.innerText = 'SUCCESS_RELOADING';
                    setTimeout(() => location.reload(), 1000);
                })
                .catch(() => {
                    btn.innerText = 'ERROR_RETRY';
                    btn.disabled = false;
                    setTimeout(() => btn.innerText = originalText, 3000);
                });
        }

        function filterCategory(category, btn) {
            // Tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');

            // Entries
            const entries = document.querySelectorAll('.log-entry');
            entries.forEach(entry => {
                if (category === 'all' || entry.dataset.category === category) {
                    entry.style.display = 'block';
                    // Re-trigger animation
                    entry.style.animation = 'none';
                    entry.offsetHeight; /* trigger reflow */
                    entry.style.animation = null; 
                } else {
                    entry.style.display = 'none';
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

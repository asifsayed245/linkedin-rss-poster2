import express from 'express';
import { DatabaseService } from './services/database';
import { RssFetcher } from './services/rssFetcher';
import { PostGenerator } from './services/postGenerator';
import { config } from './config/config';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

// Initialize services
const db = new DatabaseService();
const fetcher = new RssFetcher(db);
const generator = new PostGenerator(db);

app.use(express.json());
app.use(express.static('public'));

// Basic UI
const htmlTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LinkedIn RSS Poster 🤖</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">
    <style>
        body { background-color: #f3f2ef; }
        .card { border: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .linkedin-post { font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto; }
        .post-preview { white-space: pre-wrap; background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; }
        .hashtag { color: #0a66c2; font-weight: bold; }
        .nav-link.active { color: #0a66c2 !important; border-bottom: 2px solid #0a66c2; }
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top mb-4">
        <div class="container">
            <a class="navbar-brand text-primary fw-bold" href="/"><i class="bi bi-linkedin"></i> RSS Poster</a>
            <div class="d-flex gap-2">
                <button onclick="triggerFetch()" class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-arrow-clockwise"></i> Fetch Now
                </button>
                <a href="/csv" class="btn btn-success btn-sm">
                    <i class="bi bi-file-earmark-spreadsheet"></i> Export CSV
                </a>
            </div>
        </div>
    </nav>

    <div class="container">
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card p-3 text-center">
                    <h3 class="fw-bold text-primary" id="today-count">-</h3>
                    <small class="text-muted">Generated Today</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card p-3 text-center">
                    <h3 class="fw-bold text-warning" id="draft-count">-</h3>
                    <small class="text-muted">Drafts Pending</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card p-3 text-center">
                    <h3 class="fw-bold text-success" id="posted-count">-</h3>
                    <small class="text-muted">Marked Posted</small>
                </div>
            </div>
        </div>

        <ul class="nav nav-tabs mb-4 bg-white rounded p-2">
            <li class="nav-item">
                <a class="nav-link active" href="#" onclick="filterPosts('draft')">Drafts</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="filterPosts('posted')">Posted History</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="filterPosts('all')">All Articles</a>
            </li>
        </ul>

        <div id="posts-container" class="row">
            <!-- Posts injected here -->
        </div>
    </div>

    <script>
        let currentFilter = 'draft';

        async function loadStats() {
            const res = await fetch('/api/stats');
            const data = await res.json();
            document.getElementById('draft-count').innerText = data.drafts;
            document.getElementById('posted-count').innerText = data.posted;
            document.getElementById('today-count').innerText = data.today;
        }

        async function loadPosts() {
            const res = await fetch('/api/posts?status=' + currentFilter);
            const posts = await res.json();
            const container = document.getElementById('posts-container');
            
            if (posts.length === 0) {
                container.innerHTML = '<div class="col-12 text-center py-5 text-muted"><h4>No posts found</h4><p>Try fetching new articles!</p></div>';
                return;
            }

            container.innerHTML = posts.map(post => \`
                <div class="col-md-6 col-lg-4 fade-in">
                    <div class="card h-100">
                        <div class="card-body">
                            <span class="badge bg-\${post.status === 'draft' ? 'warning' : 'success'} mb-2">\${post.status.toUpperCase()}</span>
                            <small class="text-muted d-block mb-2">\${new Date(post.created_at).toLocaleDateString()}</small>
                            <h5 class="card-title text-truncate">\${post.title}</h5>
                            <a href="\${post.url}" target="_blank" class="small text-decoration-none mb-3 d-inline-block">
                                <i class="bi bi-box-arrow-up-right"></i> Read Source
                            </a>
                            
                            \${post.content ? \`
                                <div class="post-preview mb-3 bg-light p-2 rounded small" style="max-height: 200px; overflow-y: auto;">
                                    \${post.content.replace(/#(\\w+)/g, '<span class="hashtag">#$1</span>')}
                                </div>
                                <button class="btn btn-outline-secondary btn-sm w-100 mb-2" onclick="copyToClipboard(this, \`\${post.content.replace(/\`/g, '\\\`')}\`)">
                                    <i class="bi bi-clipboard"></i> Copy Text
                                </button>
                            \` : '<div class="alert alert-secondary small">Not generated yet</div>'}

                            <div class="d-flex justify-content-between mt-3">
                                \${post.status === 'draft' ? \`
                                    <button onclick="updateStatus(\${post.id}, 'posted')" class="btn btn-success btn-sm flex-grow-1 me-1">
                                        <i class="bi bi-check-lg"></i> Mark Posted
                                    </button>
                                    <button onclick="updateStatus(\${post.id}, 'rejected')" class="btn btn-outline-danger btn-sm">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                \` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        async function updateStatus(id, status) {
            await fetch('/api/posts/' + id, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            loadPosts();
            loadStats();
        }

        async function triggerFetch() {
            const btn = document.querySelector('button[onclick="triggerFetch()"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Fetching...';
            btn.disabled = true;
            
            try {
                await fetch('/api/fetch', { method: 'POST' });
                await loadPosts();
                await loadStats();
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        function filterPosts(status) {
            currentFilter = status;
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            event.target.classList.add('active');
            loadPosts();
        }

        function copyToClipboard(btn, text) {
            navigator.clipboard.writeText(text);
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-check2"></i> Copied!';
            setTimeout(() => btn.innerHTML = original, 2000);
        }

        // Init
        loadStats();
        loadPosts();
    </script>
</body>
</html>
`;

// API Routes
app.get('/', (req, res) => {
    res.send(htmlTemplate(''));
});

app.get('/api/stats', (req, res) => {
    const stats = {
        drafts: db.getDrafts().length,
        posted: db.getPostsByStatus('posted').length,
        today: db.getPostsGeneratedToday()
    };
    res.json(stats);
});

app.get('/api/posts', (req, res) => {
    const status = req.query.status as string;
    let posts;
    
    if (status === 'all') {
        // Get generic article list if nothing generated
        posts = db.getAllArticles();
    } else if (status) {
        posts = db.getPostsByStatus(status);
    } else {
        posts = db.getDrafts();
    }
    
    res.json(posts);
});

app.patch('/api/posts/:id', (req, res) => {
    const { status } = req.body;
    db.updateStatus(Number(req.params.id), status);
    res.json({ success: true });
});

app.post('/api/fetch', async (req, res) => {
    try {
        console.log('Fetching articles via web trigger...');
        await fetcher.fetchAndStore();
        await generator.generateDailyPosts();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

app.get('/csv', (req, res) => {
    const posts = db.getDrafts();
    let csv = 'Title,URL,Content,Status\n';
    posts.forEach(p => {
        csv += `"${p.title.replace(/"/g, '""')}","${p.url}","${p.content.replace(/"/g, '""')}","${p.status}"\n`;
    });
    res.header('Content-Type', 'text/csv');
    res.attachment('linkedin-posts.csv');
    res.send(csv);
});

app.listen(port, () => {
    console.log(`
🚀 Server running at http://localhost:${port}
------------------------------------------
1. Open http://localhost:${port} to view dashboard
2. Click "Fetch Now" to generate posts
3. Export CSV or copy text to LinkedIn
    `);
});

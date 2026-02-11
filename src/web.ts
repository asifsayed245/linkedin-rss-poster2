// ... (previous code) ...
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
// ... (rest of file) ...
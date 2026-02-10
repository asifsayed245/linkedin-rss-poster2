import { DatabaseService } from './database';
import { config } from '../config/config';
import axios from 'axios';

export class PostGenerator {
  private db: DatabaseService;

  // Hooks to make the post engaging
  private hooks = [
    "🔥 This just happened in AI:",
    "💡 Interesting development:",
    "🤖 The AI landscape is shifting fast:",
    "👀 Have you seen this?",
    "🚀 Major update in tech:",
    "⚡ Quick insight for my network:",
  ];

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async generateDailyPosts() {
    const todayCount = this.db.getPostsGeneratedToday();
    if (todayCount >= config.posts.maxPerDay) {
      console.log('✅ Daily post limit reached. Skipping generation.');
      return;
    }

    const remaining = config.posts.maxPerDay - todayCount;
    const articles = this.db.getUnusedArticles(remaining);

    if (articles.length === 0) {
      console.log('⚠️ No new articles to process.');
      return;
    }

    console.log(`🏭 Generating ${articles.length} posts...`);

    for (const article of articles) {
      try {
        const summary = await this.summarizeContent(article.content || article.snippet || article.title);
        const post = this.formatLinkedInPost(article, summary);
        
        this.db.savePost({
          articleId: article.id,
          originalTitle: article.title,
          url: article.link,
          summary: summary,
          content: post,
          hashtags: this.generateHashtags(article),
          status: 'draft'
        });

        this.db.markArticleUsed(article.id);
        console.log(`✅ Draft generated for: ${article.title}`);
        
      } catch (error) {
        console.error(`❌ Failed to generate post for ${article.title}:`, error);
      }
    }
  }

  private async summarizeContent(text: string): Promise<string> {
    // If no HuggingFace token, use simple fallback truncation
    if (!config.huggingFace.token) {
        return this.fallbackSummarize(text);
    }

    try {
      // Use Hugging Face Inference API
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${config.huggingFace.model}`,
        { inputs: text.substring(0, 3000) }, // Truncate to avoid context errors
        {
          headers: { Authorization: `Bearer ${config.huggingFace.token}` },
          timeout: 20000 // 20s timeout
        }
      );

      if (response.data && response.data[0] && response.data[0].summary_text) {
        return response.data[0].summary_text;
      }
      
      throw new Error('Invalid API response');
      
    } catch (error) {
      console.warn('⚠️ AI Summarization failed (using fallback):');
      return this.fallbackSummarize(text);
    }
  }

  private fallbackSummarize(text: string): string {
    // Simple heuristic summary: First 3 sentences
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
    return sentences.slice(0, 3).join(' ');
  }

  private formatLinkedInPost(article: any, summary: string): string {
    const hook = this.hooks[Math.floor(Math.random() * this.hooks.length)];
    const thoughts = "Applying this to our work in tech:"; // Placeholder for manual edit
    const hashtags = this.generateHashtags(article).map(t => `#${t}`).join(' ');

    return `
${hook}

${article.title}

${summary}

----
${thoughts}
👇 What are your thoughts on this?

🔗 Full story: ${article.link}

${hashtags}
    `.trim();
  }

  private generateHashtags(article: any): string[] {
    const baseTags = ['TechNews', 'Innovation', 'Technology'];
    if (article.category === 'ai' || article.title.toLowerCase().includes('ai')) {
      baseTags.unshift('ArtificialIntelligence', 'AI', 'MachineLearning');
    }
    return [...new Set(baseTags)]; // Unique tags
  }
}

import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  // Hugging Face API
  huggingface: {
    token: process.env.HUGGINGFACE_TOKEN || '',
    model: process.env.SUMMARIZATION_MODEL || 'facebook/bart-large-cnn',
    timeout: 30000,
  },
  
  // Scheduler
  scheduler: {
    hour: parseInt(process.env.SCHEDULE_HOUR || '9', 10),
    minute: parseInt(process.env.SCHEDULE_MINUTE || '0', 10),
    timezone: process.env.SCHEDULE_TIMEZONE || 'America/New_York',
  },
  
  // Post generation
  posts: {
    maxPerDay: parseInt(process.env.MAX_POSTS_PER_DAY || '3', 10),
    minArticleLength: parseInt(process.env.MIN_ARTICLE_LENGTH || '200', 10),
    maxArticleLength: parseInt(process.env.MAX_ARTICLE_LENGTH || '8000', 10),
  },
  
  // Storage
  storage: {
    databasePath: process.env.DATABASE_PATH || './data/articles.db',
    draftsPath: process.env.DRAFTS_PATH || './drafts',
  },
  
  // RSS
  rss: {
    maxArticlesPerSource: parseInt(process.env.MAX_ARTICLES_PER_SOURCE || '5', 10),
    fetchTimeout: parseInt(process.env.FETCH_TIMEOUT_MS || '30000', 10),
  },
};

// Validate critical config
export function validateConfig(): void {
  if (!config.huggingface.token) {
    console.warn('⚠️  Warning: HUGGINGFACE_TOKEN not set. AI generation will not work.');
    console.log('   Get a free token at: https://huggingface.co/settings/tokens');
  }
}

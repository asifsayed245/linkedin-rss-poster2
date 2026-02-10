import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  
  huggingFace: {
    token: process.env.HUGGINGFACE_TOKEN || '',
    model: process.env.SUMMARIZATION_MODEL || 'facebook/bart-large-cnn',
  },
  
  scheduler: {
    hour: parseInt(process.env.SCHEDULE_HOUR || '9', 10),
    minute: parseInt(process.env.SCHEDULE_MINUTE || '0', 10),
    timezone: process.env.SCHEDULE_TIMEZONE || 'America/New_York',
  },
  
  posts: {
    maxPerDay: parseInt(process.env.MAX_POSTS_PER_DAY || '3', 10),
    minLength: parseInt(process.env.MIN_ARTICLE_LENGTH || '200', 10),
    maxLength: parseInt(process.env.MAX_ARTICLE_LENGTH || '8000', 10),
  },

  storage: {
    dbPath: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'articles.db'),
    draftsPath: process.env.DRAFTS_PATH || path.join(process.cwd(), 'drafts'),
  },

  rss: {
    maxPerSource: parseInt(process.env.MAX_ARTICLES_PER_SOURCE || '5', 10),
    timeout: parseInt(process.env.FETCH_TIMEOUT_MS || '30000', 10),
  }
};

// Validation
if (!config.huggingFace.token) {
  console.warn('⚠️  WARNING: HUGGINGFACE_TOKEN is missing in .env');
  console.warn('   The app will use a fallback logic, but AI generation will be limited.');
}

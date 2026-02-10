import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Article, LinkedInPost } from '../config/sources';
import { config } from '../config/config';

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    // Ensure data directory exists
    const dbDir = path.dirname(config.storage.databasePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(config.storage.databasePath);
    this.initTables();
  }

  private initTables(): void {
    // Articles table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        link TEXT UNIQUE NOT NULL,
        content TEXT,
        summary TEXT,
        source TEXT NOT NULL,
        category TEXT NOT NULL,
        published_at DATETIME,
        fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed BOOLEAN DEFAULT 0
      )
    `);

    // LinkedIn posts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS linkedin_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        hashtags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'draft',
        posted_at DATETIME,
        FOREIGN KEY (article_id) REFERENCES articles(id)
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_articles_link ON articles(link);
      CREATE INDEX IF NOT EXISTS idx_articles_processed ON articles(processed);
      CREATE INDEX IF NOT EXISTS idx_posts_status ON linkedin_posts(status);
    `);
  }

  // Article methods
  insertArticle(article: Article): number | null {
    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO articles 
        (title, link, content, summary, source, category, published_at, fetched_at, processed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        article.title,
        article.link,
        article.content,
        article.summary || null,
        article.source,
        article.category,
        article.publishedAt.toISOString(),
        article.fetchedAt.toISOString(),
        article.processed ? 1 : 0
      );

      return result.lastInsertRowid as number;
    } catch (error) {
      console.error('Error inserting article:', error);
      return null;
    }
  }

  articleExists(link: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM articles WHERE link = ?');
    const result = stmt.get(link);
    return !!result;
  }

  getUnprocessedArticles(limit: number = 10): Article[] {
    const stmt = this.db.prepare(`
      SELECT * FROM articles 
      WHERE processed = 0 
      ORDER BY published_at DESC 
      LIMIT ?
    `);
    
    const rows = stmt.all(limit) as any[];
    return rows.map(this.rowToArticle);
  }

  markArticleProcessed(id: number): void {
    const stmt = this.db.prepare('UPDATE articles SET processed = 1 WHERE id = ?');
    stmt.run(id);
  }

  getArticlesByDate(date: Date): Article[] {
    const stmt = this.db.prepare(`
      SELECT * FROM articles 
      WHERE DATE(fetched_at) = DATE(?)
      ORDER BY published_at DESC
    `);
    
    const rows = stmt.all(date.toISOString()) as any[];
    return rows.map(this.rowToArticle);
  }

  // LinkedIn post methods
  createPost(post: LinkedInPost): number | null {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO linkedin_posts (article_id, content, hashtags, status)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        post.articleId,
        post.content,
        JSON.stringify(post.hashtags),
        post.status
      );

      return result.lastInsertRowid as number;
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  }

  getDrafts(limit: number = 10): (LinkedInPost & { title: string; link: string; source: string; category: string })[] {
    const stmt = this.db.prepare(`
      SELECT p.*, a.title, a.link, a.category, a.source
      FROM linkedin_posts p
      JOIN articles a ON p.article_id = a.id
      WHERE p.status = 'draft'
      ORDER BY p.created_at DESC
      LIMIT ?
    `);
    
    const rows = stmt.all(limit) as any[];
    return rows.map(row => ({
      ...this.rowToPost(row),
      title: row.title,
      link: row.link,
      source: row.source,
      category: row.category,
    }));
  }

  getDraftsByCategory(category: string): (LinkedInPost & { title: string; link: string; source: string })[] {
    const stmt = this.db.prepare(`
      SELECT p.*, a.title, a.link, a.category, a.source
      FROM linkedin_posts p
      JOIN articles a ON p.article_id = a.id
      WHERE p.status = 'draft' AND a.category = ?
      ORDER BY p.created_at DESC
    `);
    
    const rows = stmt.all(category) as any[];
    return rows.map(row => ({
      ...this.rowToPost(row),
      title: row.title,
      link: row.link,
      source: row.source,
    }));
  }

  getAllCategories(): string[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT a.category 
      FROM linkedin_posts p
      JOIN articles a ON p.article_id = a.id
      WHERE p.status = 'draft'
    `);
    const rows = stmt.all() as { category: string }[];
    return rows.map(r => r.category);
  }

  approvePost(id: number): void {
    const stmt = this.db.prepare("UPDATE linkedin_posts SET status = 'approved' WHERE id = ?");
    stmt.run(id);
  }

  markPosted(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE linkedin_posts 
      SET status = 'posted', posted_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(id);
  }

  deleteAllPosts(): void {
    this.db.prepare('DELETE FROM linkedin_posts').run();
  }

  resetArticleProcessing(): void {
    this.db.prepare('UPDATE articles SET processed = 0').run();
  }

  getAllArticles(): Article[] {
    const stmt = this.db.prepare(`SELECT * FROM articles ORDER BY published_at DESC`);
    const rows = stmt.all() as any[];
    return rows.map(this.rowToArticle);
  }

  deletePost(id: number): void {
    const stmt = this.db.prepare('DELETE FROM linkedin_posts WHERE id = ?');
    stmt.run(id);
  }

  getStats(): { totalArticles: number; totalPosts: number; drafts: number } {
    const articlesCount = this.db.prepare('SELECT COUNT(*) as count FROM articles').get() as { count: number };
    const postsCount = this.db.prepare('SELECT COUNT(*) as count FROM linkedin_posts').get() as { count: number };
    const draftsCount = this.db.prepare("SELECT COUNT(*) as count FROM linkedin_posts WHERE status = 'draft'").get() as { count: number };

    return {
      totalArticles: articlesCount.count,
      totalPosts: postsCount.count,
      drafts: draftsCount.count,
    };
  }

  private rowToArticle(row: any): Article {
    return {
      id: row.id,
      title: row.title,
      link: row.link,
      content: row.content,
      summary: row.summary,
      source: row.source,
      category: row.category,
      publishedAt: new Date(row.published_at),
      fetchedAt: new Date(row.fetched_at),
      processed: Boolean(row.processed),
    };
  }

  private rowToPost(row: any): LinkedInPost {
    return {
      id: row.id,
      articleId: row.article_id,
      content: row.content,
      hashtags: JSON.parse(row.hashtags || '[]'),
      createdAt: new Date(row.created_at),
      status: row.status,
      postedAt: row.posted_at ? new Date(row.posted_at) : undefined,
    };
  }

  close(): void {
    this.db.close();
  }
}

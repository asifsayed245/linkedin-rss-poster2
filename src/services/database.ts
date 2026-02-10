import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config/config';
import { Article, LinkedInPost } from '../config/sources';

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    // Ensure data directory exists
    const dir = path.dirname(config.storage.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(config.storage.dbPath);
    this.init();
  }

  private init() {
    // Table for raw fetched articles
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guid TEXT UNIQUE,
        title TEXT,
        link TEXT,
        content TEXT,
        snippet TEXT,
        source TEXT,
        category TEXT,
        pubDate TEXT,
        fetchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isUsed BOOLEAN DEFAULT 0
      )
    `);

    // Table for generated posts
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        articleId INTEGER,
        title TEXT,
        url TEXT,
        summary TEXT,
        content TEXT,
        hashtags TEXT,
        status TEXT DEFAULT 'draft',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (articleId) REFERENCES articles(id)
      )
    `);
  }

  articleExists(guid: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM articles WHERE guid = ?');
    return !!stmt.get(guid);
  }

  addArticle(article: Article): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO articles (guid, title, link, content, snippet, source, category, pubDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Use link as fallback GUID
    const guid = article.guid || article.link;
    
    stmt.run(
      guid,
      article.title,
      article.link,
      article.content || '',
      article.contentSnippet || '',
      article.source,
      article.category,
      article.pubDate
    );
  }

  getUnusedArticles(limit: number = 5): any[] {
    // Prefer posts from today/yesterday first
    return this.db.prepare(`
      SELECT * FROM articles 
      WHERE isUsed = 0 
      ORDER BY pubDate DESC 
      LIMIT ?
    `).all(limit);
  }

  markArticleUsed(id: number): void {
    this.db.prepare('UPDATE articles SET isUsed = 1 WHERE id = ?').run(id);
  }

  savePost(post: Partial<LinkedInPost>): void {
    const stmt = this.db.prepare(`
      INSERT INTO posts (articleId, title, url, summary, content, hashtags, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      post.articleId,
      post.originalTitle,
      post.url,
      post.summary,
      post.content,
      JSON.stringify(post.hashtags),
      post.status || 'draft'
    );
  }

  getDrafts(): any[] {
    return this.db.prepare("SELECT * FROM posts WHERE status = 'draft' ORDER BY createdAt DESC").all();
  }

  updateStatus(id: number, status: string): void {
    this.db.prepare('UPDATE posts SET status = ? WHERE id = ?').run(status, id);
  }

  // --- Analysis Helpers ---

  getPostsGeneratedToday(): number {
    const count = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM posts 
      WHERE date(createdAt) = date('now')
    `).get() as { count: number };
    return count.count;
  }

  getAllArticles(): any[] {
    return this.db.prepare("SELECT * FROM articles ORDER BY pubDate DESC LIMIT 50").all();
  }

  getPostsByStatus(status: string): any[] {
    return this.db.prepare("SELECT * FROM posts WHERE status = ? ORDER BY createdAt DESC").all(status);
  }
}

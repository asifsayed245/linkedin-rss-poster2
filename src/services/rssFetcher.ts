import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { sources, Article } from '../config/sources';
import { config } from '../config/config';
import { DatabaseService } from './database';

export class RssFetcher {
  private parser: Parser;
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.parser = new Parser();
    this.db = db;
  }

  async fetchAndStore() {
    console.log('📡 Starting RSS Fetch cycle...');
    
    for (const source of sources) {
      if (!source.enabled) continue;
      
      try {
        console.log(`   fetching: ${source.name}...`);
        const feed = await this.parser.parseURL(source.url);
        
        let count = 0;
        for (const item of feed.items) {
          if (count >= config.rss.maxPerSource) break;

          // Skip if already exists
          // GUID is standard, but some feeds lack it, so fallback to link
          const guid = item.guid || item.link || item.title;
          if (!guid || this.db.articleExists(guid)) continue;

          // Process content
          const content = await this.processContent(item);
          
          if (!content || content.length < config.posts.minLength) {
             continue; // Skip short/empty articles
          }

          const article: Article = {
            title: item.title || 'Untitled',
            link: item.link || '',
            content: content,
            contentSnippet: item.contentSnippet,
            pubDate: item.pubDate || new Date().toISOString(),
            source: source.name,
            category: source.category,
            guid: guid
          };

          this.db.addArticle(article);
          count++;
        }
        console.log(`   ✅ Added ${count} new articles from ${source.name}`);

      } catch (error) {
        console.error(`   ❌ Error fetching ${source.name}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  private async processContent(item: any): Promise<string> {
    // 1. Try content from RSS feed first
    const fullText = item['content:encoded'] || item.content;
    
    if (fullText && fullText.length > 500) {
      return this.cleanHtml(fullText);
    }

    // 2. If RSS content is thin, scrape the page (basic scraping)
    if (item.link) {
      try {
        const res = await axios.get(item.link, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 5000 
        });
        const $ = cheerio.load(res.data);
        
        // Remove known junk
        $('script, style, nav, footer, header, .ads, .comments').remove();
        
        // Try generic article selectors
        const articleText = $('article, main, .post-content, .entry-content').first().text();
        return articleText.replace(/\s+/g, ' ').trim();
      } catch (e) {
        // Fallback to snippet if scraping fails
        return item.contentSnippet || '';
      }
    }

    return item.contentSnippet || '';
  }

  private cleanHtml(html: string): string {
    const $ = cheerio.load(html);
    return $.text().replace(/\s+/g, ' ').trim();
  }
}

import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { RSS_SOURCES, Article, RssSource } from '../config/sources';
import { config } from '../config/config';

const parser = new Parser({
  timeout: config.rss.fetchTimeout,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
});

export class RssFetcher {
  async fetchAllSources(): Promise<Article[]> {
    const allArticles: Article[] = [];
    const enabledSources = RSS_SOURCES.filter(s => s.enabled);

    console.log(`📡 Fetching from ${enabledSources.length} RSS sources...\n`);

    for (const source of enabledSources) {
      try {
        const articles = await this.fetchSource(source);
        allArticles.push(...articles);
        console.log(`  ✅ ${source.name}: ${articles.length} articles`);
      } catch (error) {
        console.error(`  ❌ ${source.name}: Failed to fetch -`, (error as Error).message);
      }
    }

    console.log(`\n📊 Total articles fetched: ${allArticles.length}`);
    return allArticles;
  }

  private async fetchSource(source: RssSource): Promise<Article[]> {
    const feed = await parser.parseURL(source.url);
    const articles: Article[] = [];

    const items = feed.items.slice(0, config.rss.maxArticlesPerSource);

    for (const item of items) {
      if (!item.title || !item.link) continue;

      // Try to get full content
      let content = item['content:encoded'] || item.content || item.summary || '';
      
      // If content is too short, try to fetch from URL
      if (content.length < config.posts.minArticleLength) {
        try {
          content = await this.fetchFullContent(item.link);
        } catch (error) {
          // Use what we have
        }
      }

      // Clean up content
      content = this.cleanContent(content);

      // Skip if content is too short after cleaning
      if (content.length < config.posts.minArticleLength) {
        continue;
      }

      // Extract summary (first 300 characters, roughly 2-3 sentences)
      const rawSummary = item.summary || item.contentSnippet || content.substring(0, 500);
      let summary = this.cleanContent(rawSummary);
      
      // Truncate to ~300 chars at sentence boundary
      if (summary.length > 300) {
        const truncated = summary.substring(0, 300);
        const lastPeriod = truncated.lastIndexOf('.');
        summary = truncated.substring(0, lastPeriod + 1).trim();
      }

      // Skip if summary is too short
      if (summary.length < 50) {
        console.warn(`  ⚠️ Skipping article with insufficient summary: ${item.title?.substring(0, 50)}`);
        continue;
      }

      articles.push({
        title: item.title,
        link: item.link,
        content: content.substring(0, config.posts.maxArticleLength),
        summary: summary,
        source: source.name,
        category: source.category,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        fetchedAt: new Date(),
        processed: false,
      });
    }

    return articles;
  }

  private async fetchFullContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const $ = cheerio.load(response.data);
      
      // Remove script and style elements
      $('script, style, nav, footer, header, aside').remove();
      
      // Try to find article content
      const article = $('article').text() || 
                      $('[class*="article"]').text() || 
                      $('[class*="content"]').text() || 
                      $('main').text() ||
                      $('body').text();

      return article.trim();
    } catch (error) {
      return '';
    }
  }

  private cleanContent(content: string): string {
    return content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\[\s*\+\s*\d+\s+chars\s*\]/g, '')
      .trim();
  }
}

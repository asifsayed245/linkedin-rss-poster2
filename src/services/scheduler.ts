import * as cron from 'node-cron';
import { config } from '../config/config';
import { DatabaseService } from './database';
import { RssFetcher } from './rssFetcher';
import { PostGenerator } from './postGenerator';

export class Scheduler {
  private db: DatabaseService;
  private fetcher: RssFetcher;
  private generator: PostGenerator;
  private task: ReturnType<typeof cron.schedule> | null = null;

  constructor() {
    this.db = new DatabaseService();
    this.fetcher = new RssFetcher();
    this.generator = new PostGenerator();
  }

  start(): void {
    const cronExpression = `${config.scheduler.minute} ${config.scheduler.hour} * * *`;
    
    console.log(`⏰ Scheduler started`);
    console.log(`   Will run daily at ${config.scheduler.hour}:${config.scheduler.minute.toString().padStart(2, '0')} ${config.scheduler.timezone}`);
    console.log(`   Cron: ${cronExpression}\n`);

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      console.error('❌ Invalid cron expression');
      return;
    }

    this.task = cron.schedule(cronExpression, async () => {
      await this.runJob();
    }, {
      timezone: config.scheduler.timezone,
    });

    // Run immediately on start
    this.runJob();
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      console.log('⏹️  Scheduler stopped');
    }
  }

  async runJob(): Promise<void> {
    console.log(`\n🔄 Job started at ${new Date().toLocaleString()}`);
    console.log('=' .repeat(50));

    try {
      // Step 1: Fetch articles
      const articles = await this.fetcher.fetchAllSources();
      
      // Step 2: Store new articles
      let newArticlesCount = 0;
      for (const article of articles) {
        if (!this.db.articleExists(article.link)) {
          const id = this.db.insertArticle(article);
          if (id) {
            article.id = id;
            newArticlesCount++;
          }
        }
      }
      console.log(`\n💾 New articles stored: ${newArticlesCount}`);

      // Step 3: Get unprocessed articles
      const unprocessed = this.db.getUnprocessedArticles(config.posts.maxPerDay);
      console.log(`📝 Unprocessed articles: ${unprocessed.length}`);

      // Step 4: Generate LinkedIn posts
      if (unprocessed.length === 0) {
        console.log('✨ No new articles to process');
      } else {
        console.log('\n🤖 Generating LinkedIn posts...\n');
        
        for (const article of unprocessed.slice(0, config.posts.maxPerDay)) {
          const post = await this.generator.generatePost(article);
          
          if (post) {
            const postId = this.db.createPost(post);
            if (postId) {
              console.log(`  ✅ Generated post for: "${article.title.substring(0, 60)}..."`);
              this.db.markArticleProcessed(article.id!);
            }
          } else {
            console.log(`  ⚠️  Failed to generate post for: "${article.title.substring(0, 60)}..."`);
          }
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Step 5: Show stats
      const stats = this.db.getStats();
      console.log(`\n📊 Stats:`);
      console.log(`   Total articles: ${stats.totalArticles}`);
      console.log(`   Total posts: ${stats.totalPosts}`);
      console.log(`   Drafts ready: ${stats.drafts}`);

    } catch (error) {
      console.error('❌ Job failed:', error);
    }

    console.log(`\n✅ Job completed at ${new Date().toLocaleString()}`);
    console.log('=' .repeat(50) + '\n');
  }

  async runOnce(): Promise<void> {
    await this.runJob();
  }
}

import cron from 'node-cron';
import { RssFetcher } from './rssFetcher';
import { PostGenerator } from './postGenerator';
import { config } from '../config/config';

export class Scheduler {
  private fetcher: RssFetcher;
  private generator: PostGenerator;
  private task: cron.ScheduledTask | null = null;

  constructor(fetcher: RssFetcher, generator: PostGenerator) {
    this.fetcher = fetcher;
    this.generator = generator;
  }

  start() {
    if (this.task) {
      console.log('Scheduler already running.');
      return;
    }

    // Schedule specifically for configured time
    // Cron format: Minute Hour * * *
    const cronExpression = `${config.scheduler.minute} ${config.scheduler.hour} * * *`;
    
    console.log(`✅ Scheduler started. Next run at: ${config.scheduler.hour}:${config.scheduler.minute} (${config.scheduler.timezone})`);

    this.task = cron.schedule(cronExpression, () => {
      this.runDailyJob();
    }, {
      scheduled: true,
      timezone: config.scheduler.timezone
    });
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('🛑 Scheduler stopped.');
    }
  }

  async runDailyJob() {
    console.log(`\n📅 Starting Daily Job: ${new Date().toLocaleString()}`);
    
    try {
      // 1. Fetch new content
      await this.fetcher.fetchAndStore();
      
      // 2. Generate posts
      await this.generator.generateDailyPosts();
      
      console.log('✨ Daily job completed successfully.');
      
    } catch (error) {
      console.error('❌ Daily job failed:', error);
    }
  }
}

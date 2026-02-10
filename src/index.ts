import express from 'express';
import { RssFetcher } from './services/rssFetcher';
import { PostGenerator } from './services/postGenerator';
import { Scheduler } from './services/scheduler';
import { DatabaseService } from './services/database';
import { ReviewInterface } from './services/review';
import { config } from './config/config';
import fs from 'fs';
import path from 'path';

// Initialize services
const db = new DatabaseService();
const fetcher = new RssFetcher(db);
const generator = new PostGenerator(db);
const scheduler = new Scheduler(fetcher, generator);
const reviewInterface = new ReviewInterface(db);

// Handle command line arguments
const args = process.argv.slice(2);

async function main() {
  // Check for specific commands
  if (args.includes('--fetch')) {
    console.log('🔄 Manually triggering fetch and generate cycle...');
    await scheduler.runDailyJob();
    process.exit(0);
  }
  
  if (args.includes('--review')) {
    await reviewInterface.startReview();
    // review interface handles exit
    return;
  }

  if (args.includes('--schedule')) {
    console.log(`⏰ Starting scheduler (Running at ${config.scheduler.hour}:${config.scheduler.minute.toString().padStart(2, '0')} ${config.scheduler.timezone})`);
    scheduler.start();
    // Keep process alive
    return;
  }

  if (args.includes('--stats')) {
    reviewInterface.showStats();
    process.exit(0);
  }

  if (args.includes('--export')) {
    const drafts = db.getDrafts();
    if (drafts.length === 0) {
      console.log('No drafts to export.');
      process.exit(0);
    }
    
    const exportPath = path.join(process.cwd(), 'drafts');
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath);
    }
    
    const fileName = `drafts_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(path.join(exportPath, fileName), JSON.stringify(drafts, null, 2));
    console.log(`✅ Exported ${drafts.length} drafts to ${path.join(exportPath, fileName)}`);
    process.exit(0);
  }

  if (args.includes('--export-md')) {
    const drafts = db.getDrafts();
    if (drafts.length === 0) {
      console.log('No drafts to export.');
      process.exit(0);
    }
    
    const exportPath = path.join(process.cwd(), 'drafts');
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath);
    }
    
    const fileName = `drafts_${new Date().toISOString().split('T')[0]}.md`;
    let content = '# LinkedIn Drafts\n\n';
    
    drafts.forEach((draft, index) => {
      content += `## Post ${index + 1}\n\n`;
      content += `**Source:** [${draft.title}](${draft.url})\n\n`;
      content += `\`\`\`\n${draft.content}\n\`\`\`\n\n`;
      content += `---\n\n`;
    });
    
    fs.writeFileSync(path.join(exportPath, fileName), content);
    console.log(`✅ Exported ${drafts.length} drafts to ${path.join(exportPath, fileName)}`);
    process.exit(0);
  }

  // Use web interface by default if no args or just --help
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
🤖 LinkedIn RSS Poster - Command Line Interface

Usage:
  npm run fetch      Fetch articles and generate drafts immediately
  npm run review     Interactive CLI to review and approve drafts
  npm run schedule   Start the daily scheduler daemon
  npm run stats      Show database statistics
  npm run export     Export current drafts to JSON
  npm run export:md  Export current drafts to Markdown
  npm start          Start the web interface (default)
    `);
    
    // Fallback to starting web server if just running 'node dist/index.js'
    if (args.length === 0) {
        import('./web');
    }
  }
}

main().catch(console.error);

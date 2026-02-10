import { config, validateConfig } from './config/config';
import { DatabaseService } from './services/database';
import { RssFetcher } from './services/rssFetcher';
import { Scheduler } from './services/scheduler';
import { ReviewInterface } from './services/review';
import { PostGenerator } from './services/postGenerator';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || '--help';

  // Validate configuration
  validateConfig();

  console.log('\n🚀 LinkedIn RSS Poster\n');

  switch (command) {
    case '--fetch':
    case '-f':
      await runFetch();
      break;

    case '--review':
    case '-r':
      await runReview();
      break;

    case '--schedule':
    case '-s':
      runScheduler();
      break;

    case '--stats':
      showStats();
      break;

    case '--export':
      await exportDrafts();
      break;

    case '--export-md':
      await exportMarkdown();
      break;

    case '--help':
    case '-h':
    default:
      showHelp();
      break;
  }
}

async function runFetch(): Promise<void> {
  const scheduler = new Scheduler();
  await scheduler.runOnce();
  process.exit(0);
}

async function runReview(): Promise<void> {
  const review = new ReviewInterface();
  await review.showDrafts();
  process.exit(0);
}

function runScheduler(): void {
  const scheduler = new Scheduler();
  scheduler.start();

  // Keep the process running
  console.log('   Press Ctrl+C to stop\n');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down gracefully...');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    scheduler.stop();
    process.exit(0);
  });
}

function showStats(): void {
  const review = new ReviewInterface();
  review.showStats();
  process.exit(0);
}

async function exportDrafts(): Promise<void> {
  const review = new ReviewInterface();
  review.exportDrafts();
  process.exit(0);
}

async function exportMarkdown(): Promise<void> {
  const review = new ReviewInterface();
  review.exportAsMarkdown();
  process.exit(0);
}

function showHelp(): void {
  console.log('Usage: npm run [command]\n');
  console.log('Commands:');
  console.log('  npm run fetch          Fetch RSS feeds and generate posts (one-time)');
  console.log('  npm run review         View all generated LinkedIn post drafts');
  console.log('  npm run schedule       Start the daily scheduler');
  console.log('  npm run stats          Show application statistics');
  console.log('  npm run export         Export drafts to JSON');
  console.log('  npm run export:md      Export drafts to Markdown\n');
  console.log('Options:');
  console.log('  --fetch, -f            Same as "npm run fetch"');
  console.log('  --review, -r           Same as "npm run review"');
  console.log('  --schedule, -s         Same as "npm run schedule"');
  console.log('  --stats                Show statistics');
  console.log('  --export               Export to JSON');
  console.log('  --export-md            Export to Markdown');
  console.log('  --help, -h             Show this help message\n');
  console.log('Configuration:');
  console.log('  Create a .env file with your settings (see .env.example)\n');
  console.log('Examples:');
  console.log('  npm run fetch                    # Fetch and generate once');
  console.log('  npm run schedule                 # Start daily scheduler');
  console.log('  npm run review                   # View your drafts\n');
  process.exit(0);
}

// Run main function
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

import { DatabaseService } from './database';

export class ReviewInterface {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async startReview() {
    console.clear();
    console.log('🔎 Checking for pending drafts...\n');

    const drafts = this.db.getDrafts();

    if (drafts.length === 0) {
      console.log('✅ No pending drafts to review.');
      console.log('Run "npm run fetch" to generate new posts from RSS feeds.');
      return;
    }

    console.log(`Found ${drafts.length} drafts waiting for review:\n`);

    drafts.forEach((post, index) => {
      console.log(`--- [ Draft #${index + 1} ] ---`);
      console.log(`📄 Title: ${post.title}`);
      console.log(`🔗 URL:   ${post.url}`);
      console.log(`------------------------------`);
      console.log(post.content);
      console.log(`------------------------------\n`);
    });

    console.log(`\n👉 To approve or reject, please use the Web Interface: npm start`);
    console.log(`   (Or verify directly in the "drafts" folder if exported)`);
  }

  showStats() {
    const drafts = this.db.getDrafts();
    const today = this.db.getPostsGeneratedToday();
    // Assuming we might add 'posted' logic later
    console.log(`
📊 Statistics:
- 📥 Drafts Pending:  ${drafts.length}
- 📅 Generated Today: ${today}
    `);
  }
}

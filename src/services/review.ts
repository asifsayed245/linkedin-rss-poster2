import { DatabaseService } from './database';
import fs from 'fs';
import path from 'path';
import { config } from '../config/config';

export class ReviewInterface {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  async showDrafts(): Promise<void> {
    const drafts = this.db.getDrafts(20);

    if (drafts.length === 0) {
      console.log('\n📭 No drafts available.');
      console.log('   Run "npm run fetch" or wait for the scheduler to generate posts.\n');
      return;
    }

    console.log(`\n📝 LinkedIn Post Drafts (${drafts.length} available)\n`);
    console.log('=' .repeat(80));

    drafts.forEach((draft, index) => {
      console.log(`\n[${index + 1}] ${draft.title}`);
      console.log(`    Source: ${draft.link}`);
      console.log(`    Created: ${draft.createdAt.toLocaleDateString()}`);
      console.log('\n    Content:');
      console.log('    ' + '-'.repeat(76));
      
      // Format content with line breaks
      const lines = draft.content.split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          console.log('    ' + line);
        }
      });
      
      console.log('    ' + '-'.repeat(76));
      console.log(`    Hashtags: ${draft.hashtags.join(' ')}`);
      console.log('=' .repeat(80));
    });

    this.showCommands();
  }

  exportDrafts(): void {
    const drafts = this.db.getDrafts(100);

    if (drafts.length === 0) {
      console.log('\n⚠️  No drafts to export.\n');
      return;
    }

    // Ensure drafts directory exists
    if (!fs.existsSync(config.storage.draftsPath)) {
      fs.mkdirSync(config.storage.draftsPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = path.join(config.storage.draftsPath, `drafts-${timestamp}.json`);

    const exportData = drafts.map(draft => ({
      title: draft.title,
      link: draft.link,
      content: draft.content,
      hashtags: draft.hashtags,
      createdAt: draft.createdAt,
    }));

    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    console.log(`\n✅ Exported ${drafts.length} drafts to: ${filename}\n`);
  }

  exportAsMarkdown(): void {
    const drafts = this.db.getDrafts(100);

    if (drafts.length === 0) {
      console.log('\n⚠️  No drafts to export.\n');
      return;
    }

    // Ensure drafts directory exists
    if (!fs.existsSync(config.storage.draftsPath)) {
      fs.mkdirSync(config.storage.draftsPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = path.join(config.storage.draftsPath, `drafts-${timestamp}.md`);

    let markdown = `# LinkedIn Post Drafts - ${timestamp}\n\n`;
    markdown += `Generated ${drafts.length} posts from tech & AI RSS feeds\n\n`;
    markdown += '---\n\n';

    drafts.forEach((draft, index) => {
      markdown += `## Post ${index + 1}: ${draft.title}\n\n`;
      markdown += `**Source:** [${draft.link}](${draft.link})\n\n`;
      markdown += `**Created:** ${draft.createdAt.toLocaleDateString()}\n\n`;
      markdown += '**Content:**\n\n';
      markdown += draft.content.split('\n').map(line => `> ${line}`).join('\n');
      markdown += '\n\n';
      markdown += `**Hashtags:** ${draft.hashtags.join(' ')}\n\n`;
      markdown += '---\n\n';
    });

    fs.writeFileSync(filename, markdown);
    console.log(`\n✅ Exported ${drafts.length} drafts to Markdown: ${filename}\n`);
  }

  showStats(): void {
    const stats = this.db.getStats();

    console.log('\n📊 Application Statistics\n');
    console.log('=' .repeat(40));
    console.log(`Total Articles Fetched: ${stats.totalArticles}`);
    console.log(`Total Posts Generated:  ${stats.totalPosts}`);
    console.log(`Drafts Ready to Post:   ${stats.drafts}`);
    console.log('=' .repeat(40));
    console.log('');
  }

  private showCommands(): void {
    console.log('\n📋 Available Commands:');
    console.log('  npm run review         - View all drafts');
    console.log('  npm run review:export  - Export drafts to JSON');
    console.log('  npm run review:md      - Export drafts to Markdown');
    console.log('  npm run review:stats   - View statistics\n');
  }
}

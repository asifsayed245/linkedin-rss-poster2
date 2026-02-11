import axios from 'axios';
import { Article, LinkedInPost } from '../config/sources';
import { config } from '../config/config';
import { ImageGenerator } from './imageGenerator';
import { InfographicGenerator } from './infographicGenerator';
import { DatabaseService } from './database';

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

class Logger {
  private static log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
    console.log(JSON.stringify(entry));
  }

  static debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.DEBUG) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  static info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  static warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  static error(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context);
  }
}

export class PostGenerator {
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000;
  private imageGenerator: ImageGenerator;
  private infographicGenerator: InfographicGenerator;

  constructor() {
    this.imageGenerator = new ImageGenerator();
    this.infographicGenerator = new InfographicGenerator();
  }

  async generatePost(article: Article, db: DatabaseService): Promise<LinkedInPost | null> {
    Logger.info('Starting post generation', { articleTitle: article.title, source: article.source });

    try {
      const content = await this.summarizeAndTransform(article);
      
      if (!content) {
        Logger.warn('Post generation returned null content', { articleTitle: article.title });
        return null;
      }

      const hashtags = this.generateHashtags(article);
      const post: LinkedInPost = {
        articleId: article.id!,
        content,
        hashtags,
        createdAt: new Date(),
        status: 'draft',
      };

      Logger.info('Post generated successfully', { 
        articleTitle: article.title, 
        contentLength: content.length,
        hashtagCount: hashtags.length 
      });

      console.log(`🔍 DEBUG: Calling generateVisualContent for ${article.title}`);

      // Generate AI image and infographic before returning the post
      await this.generateVisualContent(article, post, db);

      return post;
    } catch (error) {
      Logger.error('Post generation failed', { 
        articleTitle: article.title, 
        error: (error as Error).message 
      });
      return null;
    }
  }

  /**
   * Generate AI image and infographic for the post
   */
  private async generateVisualContent(
    article: Article, 
    post: LinkedInPost, 
    db: DatabaseService
  ): Promise<void> {
    try {
      console.log(`🔍 DEBUG: Inside generateVisualContent for ${article.title}`);
      Logger.info('Generating visual content', { articleTitle: article.title });

      // Step 1: Generate AI image with full content for better concept extraction
      const generatedImage = await this.imageGenerator.generatePostImage({
        title: article.title,
        summary: article.summary || '',
        category: article.category,
        content: article.content
      });

      if (generatedImage) {
        post.imageUrl = generatedImage.url;
        post.hasImage = true;
        Logger.info('AI image generated', { imageUrl: generatedImage.url });
      }

      // Step 2: Create infographic with text overlay
      const keyPoints = this.infographicGenerator.extractKeyPoints(post.content, 5);
      const infographicData = {
        title: article.title,
        keyPoints,
        source: article.source,
        category: article.category,
        articleUrl: article.link,
        imageUrl: generatedImage?.url
      };

      const infographic = this.infographicGenerator.generateInfographic(infographicData);
      post.infographicPath = `/infographics/${infographic.filename}`;
      Logger.info('Infographic generated', { path: post.infographicPath });

      // Step 3: Update database with image info (if post was saved)
      // Note: The post will be saved by the scheduler after this method returns
      Logger.info('Visual content generation complete', { 
        hasImage: !!post.imageUrl,
        hasInfographic: !!post.infographicPath 
      });

    } catch (error) {
      Logger.warn('Visual content generation failed', { 
        articleTitle: article.title, 
        error: (error as Error).message 
      });
      // Continue without visual content - post is still valid
    }
  }

  private async summarizeAndTransform(article: Article): Promise<string> {
    // If no HuggingFace token, use fallback method
    if (!config.huggingface.token) {
      Logger.debug('No HuggingFace token, using fallback generation');
      return this.fallbackGeneration(article);
    }

    try {
      Logger.debug('Calling HuggingFace API', { model: config.huggingface.model });
      
      const prompt = this.createPrompt(article);
      
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${config.huggingface.model}`,
        {
          inputs: prompt,
          parameters: {
            max_length: 350,
            min_length: 100,
            do_sample: true,
            temperature: 0.7,
            top_p: 0.9,
            repetition_penalty: 1.2,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${config.huggingface.token}`,
            'Content-Type': 'application/json',
          },
          timeout: config.huggingface.timeout,
        }
      );

      if (response.data && response.data[0] && response.data[0].summary_text) {
        Logger.debug('HuggingFace API returned successfully');
        return this.formatLinkedInPost(response.data[0].summary_text, article);
      }

      Logger.warn('HuggingFace API returned unexpected format, using fallback');
    } catch (error) {
      Logger.warn('HuggingFace API failed, using fallback', {
        error: (error as Error).message,
        status: (error as { response?: { status?: number } }).response?.status
      });
    }

    return this.fallbackGeneration(article);
  }

  private createPrompt(article: Article): string {
    return `Transform this article summary into an engaging LinkedIn post:

Title: ${article.title}
Summary: ${article.summary}
Source: ${article.source}
Category: ${article.category}

Write a LinkedIn post that:
1. Starts with a hook or thought-provoking question
2. Mentions "as per the latest update" when referencing the article insights
3. Expands on the key points from the summary
4. Adds personal commentary on why this matters
5. Ends with an engaging question for the community
6. Keeps it under 300 words and conversational`;
  }

  private formatLinkedInPost(summary: string, article: Article): string {
    let formatted = summary
      .replace(/^\s*Summary:\s*/i, '')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    formatted += `\n\nAs per the latest update from ${article.source}: "${article.summary}"`;

    const hashtags = this.generateHashtags(article);
    formatted += `\n\n${hashtags.join(' ')}`;

    formatted += `\n\n🔗 Read more: <a href="${article.link}" target="_blank">${article.link}</a>`;

    return formatted;
  }

  private fallbackGeneration(article: Article): string {
    const hooks = [
      '🚀 Just came across something fascinating:',
      '💡 Interesting development in tech:',
      '🤔 Food for thought:',
      '⚡ Breaking:',
      '🔍 Worth watching:',
    ];

    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    
    const commentaryOptions = {
      ai: [
        "This is another exciting step forward in AI. The implications for how we work and create are profound.",
        "AI continues to push boundaries in ways we couldn't have imagined just years ago.",
        "The rapid evolution of AI is reshaping industries at an unprecedented pace.",
        "These AI advancements remind us how quickly the technology landscape is transforming.",
      ],
      tech: [
        "The pace of innovation in tech never ceases to amaze. This could change how we approach problems in this space.",
        "Technology evolves so rapidly that today's breakthrough becomes tomorrow's standard.",
        "We're witnessing another example of how tech continues to redefine what's possible.",
        "Innovation in this space moves fast, and this development proves it once again.",
      ],
      science: [
        "Science continues to push the boundaries of what we know about our world.",
        "This discovery adds another piece to the puzzle of understanding our universe.",
        "Research like this reminds us how much more there is to learn.",
        "Science never ceases to amaze with its ability to reveal the unknown.",
      ],
    };

    const category = article.category === 'ai' ? 'ai' : article.category === 'science' ? 'science' : 'tech';
    const commentary = commentaryOptions[category][Math.floor(Math.random() * commentaryOptions[category].length)];

    const questions = [
      "What do you think about this development?",
      "How do you see this impacting your work?",
      "Would you use something like this?",
      "What's your take on this trend?",
      "Does this align with what you're seeing in the industry?",
      "How might this shape the future of our field?",
    ];
    const question = questions[Math.floor(Math.random() * questions.length)];

    const hashtags = this.generateHashtags(article);

    return `${hook}

${article.title}

As per the latest update from ${article.source}: "${article.summary}"

${commentary}

${question}

${hashtags.join(' ')}

🔗 Read more: <a href="${article.link}" target="_blank">${article.link}</a>`;
  }

  private generateHashtags(article: Article): string[] {
    const baseHashtags = ['#TechNews', '#Innovation', '#Technology'];
    
    const categoryTags: Record<string, string[]> = {
      ai: ['#AI', '#ArtificialIntelligence', '#MachineLearning', '#FutureOfWork'],
      tech: ['#Tech', '#DigitalTransformation', '#Startup'],
      science: ['#Science', '#Research', '#Discovery'],
    };

    const specificTags = categoryTags[article.category] || categoryTags.tech;
    
    // Extract potential hashtags from title
    const titleWords = article.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 2)
      .map(word => '#' + word.charAt(0).toUpperCase() + word.slice(1));

    return [...baseHashtags, ...specificTags, ...titleWords].slice(0, 8);
  }

  private validateGeneratedPost(content: string): boolean {
    const minLength = 50;
    const maxLength = 3000;

    if (content.length < minLength || content.length > maxLength) {
      Logger.warn('Generated post failed validation', { length: content.length, minLength, maxLength });
      return false;
    }

    return true;
  }
}

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { config } from '../config/config';

export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  model?: ImageModel;
  nologo?: boolean;
  enhance?: boolean;
}

export type ImageModel = 'nano' | 'flux' | 'flux-realism' | 'flux-anime' | 'flux-3d' | 'flux-pro' | 'turbo';
export type ImageProvider = 'pollinations' | 'huggingface';

export interface GeneratedImage {
  url: string;
  localPath: string;
  seed: number;
  width: number;
  height: number;
  provider: ImageProvider;
}

export class ImageGenerator {
  private readonly baseUrl = 'https://image.pollinations.ai/prompt';
  private readonly huggingFaceUrl = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell';
  private readonly imagesDir: string;

  constructor() {
    this.imagesDir = path.join(process.cwd(), 'public', 'images');
    this.ensureImagesDirectory();
  }

  private ensureImagesDirectory(): void {
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

  /**
    * Generate an AI image from a text prompt
    * Prefers Hugging Face if key is present, otherwise falls back to Pollinations
    */
  async generateImage(options: ImageGenerationOptions): Promise<GeneratedImage | null> {
    const hfKey = config.huggingface.token;

    // Prefer Hugging Face for quality if key prevents
    if (hfKey && !options.model?.includes('nano')) {
      console.log("🚀 Using Hugging Face (Flux Schnell) for high quality...");
      return this.generateWithHuggingFace(options, hfKey);
    }

    return this.generateWithPollinations(options);
  }

  private async generateWithPollinations(options: ImageGenerationOptions): Promise<GeneratedImage | null> {
    try {
      const {
        prompt,
        width = 1024,
        height = 1024,
        seed = Math.floor(Math.random() * 1000000),
        model = 'flux-realism',
        nologo = true,
        enhance = true
      } = options;

      // Map model names to Pollinations.ai model identifiers
      const modelMap: Record<ImageModel, string> = {
        'flux': 'flux',
        'flux-realism': 'flux-realism',
        'flux-anime': 'flux-anime',
        'flux-3d': 'flux-3d',
        'flux-pro': 'flux-pro',
        'nano': 'nano',
        'turbo': 'turbo'
      };

      const pollinationsModel = modelMap[model] || 'flux';

      // Build URL with parameters
      const encodedPrompt = encodeURIComponent(prompt);
      const url = `${this.baseUrl}/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${pollinationsModel}&nologo=${nologo}&enhance=${enhance}&private=true`;

      console.log(`🎨 Generating image with Pollinations (${model})...`);

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 180000,
        headers: { 'User-Agent': 'LinkedIn-RSS-Poster/1.0' }
      });

      const filename = `img_${Date.now()}_${seed}.jpg`; // Pollinations returns JPG usually
      const localPath = path.join(this.imagesDir, filename);
      fs.writeFileSync(localPath, response.data);

      return {
        url: `/images/${filename}`,
        localPath: localPath,
        seed,
        width,
        height,
        provider: 'pollinations'
      };
    } catch (error) {
      console.error('❌ Pollinations generation failed:', (error as Error).message);
      return null;
    }
  }

  private async generateWithHuggingFace(options: ImageGenerationOptions, apiKey: string): Promise<GeneratedImage | null> {
    try {
      const { prompt, width = 1024, height = 1024, seed = Math.floor(Math.random() * 1000000) } = options;

      console.log(`🎨 Generating HIGH QUALITY image with Hugging Face (Flux Schnell)...`);

      const response = await axios.post(
        this.huggingFaceUrl,
        { inputs: prompt, parameters: { width, height, seed } },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'image/jpeg'
          },
          responseType: 'arraybuffer'
        }
      );

      const filename = `hf_${Date.now()}_${seed}.jpg`;
      const localPath = path.join(this.imagesDir, filename);
      fs.writeFileSync(localPath, response.data);

      const stats = fs.statSync(localPath);
      const fileSizeKB = Math.round(stats.size / 1024);
      console.log(`✅ High-Quality HF Image generated: ${filename} (${fileSizeKB}KB)`);

      return {
        url: `/images/${filename}`,
        localPath: localPath,
        seed,
        width,
        height,
        provider: 'huggingface'
      };

    } catch (error) {
      console.error('❌ Hugging Face generation failed:', (error as any).response?.data?.toString() || (error as Error).message);
      console.log('⚠️ Falling back to Pollinations...');
      return this.generateWithPollinations(options);
    }
  }

  /**
    * Generate an image for a LinkedIn post based on article content
    */
  async generatePostImage(article: {
    title: string;
    summary: string;
    category: string;
    content?: string;
  }): Promise<GeneratedImage | null> {
    // Create an optimized prompt for LinkedIn posts
    const prompt = this.createPrompt(article);

    return this.generateImage({
      prompt,
      width: 1024,
      height: 1024,
      model: 'flux',
      enhance: true
    });
  }

  /**
   * Create a compelling prompt for image generation using both title and summary
   */
  private createPrompt(article: {
    title: string;
    summary: string;
    category: string;
    content?: string;
  }): string {
    const { title, summary, category, content } = article;

    // Clean, sharp style prompts - NO haze, NO fog, NO blur, NO atmospheric effects
    const stylePrompts: Record<string, string> = {
      ai: 'professional tech photography, sharp focus throughout, ultra-crisp details, clear bright lighting, pristine image quality, maximum clarity, modern tech aesthetic',
      tech: 'clean product photography, razor sharp focus, maximum detail clarity, bright even lighting, professional tech advertising, pristine white background, studio quality',
      science: 'clinical laboratory photography, sharp focus on details, maximum clarity, clean bright lighting, scientific documentation quality, pristine environment, ultra detailed'
    };

    const style = stylePrompts[category] || stylePrompts.tech;

    // Extract key visual concepts from both title and summary
    const visualConcept = this.extractVisualConcept(title, summary, category, content);

    // Combine concept with ultra-high quality directives
    return `${visualConcept}, ${style}, ultra sharp focus, maximum clarity, crisp edges throughout, no haze no fog no blur no soft edges, perfect focus everywhere, bright clear lighting, pristine image quality, professional LinkedIn featured image`;

  }

  /**
   * Extract specific visual concept based on article content
   * Analyzes the actual subject matter to create a relevant image prompt
   */
  private extractSpecificConcept(title: string, summary: string): string | null {
    const text = (title + ' ' + summary).toLowerCase();

    // Extract key subject - look for proper nouns and main topics
    // Remove common stop words and extract key terms
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'and', 'but', 'or', 'yet', 'so', 'for', 'nor', 'as', 'if', 'than', 'when', 'while', 'where', 'because', 'since', 'until', 'although', 'though', 'unless', 'whether', 'before', 'after', 'once', 'how', 'what', 'which', 'who', 'whom', 'whose', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now', 'also', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same', 'able']);

    // Extract meaningful noun phrases and key terms
    const words = text.split(/\s+/).filter(word => {
      const clean = word.replace(/[^a-z]/g, '');
      return clean.length > 2 && !stopWords.has(clean);
    });

    // Count word frequency to find key topics
    const wordFreq: Map<string, number> = new Map();
    words.forEach(word => {
      const clean = word.replace(/[^a-z]/g, '');
      wordFreq.set(clean, (wordFreq.get(clean) || 0) + 1);
    });

    // Get top keywords
    const topKeywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    // Try to extract the main subject from title
    const titleWords = title.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));

    const mainSubject = titleWords.slice(0, 3).join(' ');

    // Look for specific companies, products, or technologies
    const companyPatterns = [
      { pattern: /google|alphabet/g, prompt: 'Google technology showcase, modern tech workspace with Google branding elements, clean professional environment' },
      { pattern: /microsoft|azure|windows/g, prompt: 'Microsoft technology ecosystem, modern software interface, professional tech environment with blue theme' },
      { pattern: /apple|iphone|mac|ios/g, prompt: 'Apple product showcase, sleek minimalist design, modern technology with clean white aesthetic' },
      { pattern: /amazon|aws|alexa/g, prompt: 'Amazon cloud technology, AWS infrastructure visualization, modern e-commerce platform interface' },
      { pattern: /meta|facebook|instagram|whatsapp/g, prompt: 'Meta social platform technology, modern social media interface, connected digital ecosystem' },
      { pattern: /tesla|spacex|elon/g, prompt: 'Tesla innovation technology, futuristic electric vehicle, clean energy concept, modern automotive design' },
      { pattern: /openai|chatgpt|gpt/g, prompt: 'OpenAI artificial intelligence, futuristic AI interface, neural network visualization, modern tech aesthetic' },
      { pattern: /nvidia|gpu|graphics/g, prompt: 'NVIDIA graphics technology, advanced GPU visualization, gaming and AI hardware, green tech aesthetic' },
      { pattern: /intel|processor|cpu/g, prompt: 'Intel processor technology, semiconductor chip close-up, advanced computing hardware, blue tech aesthetic' },
      { pattern: /amd|ryzen/g, prompt: 'AMD processor technology, advanced CPU architecture, high-performance computing hardware, red tech aesthetic' }
    ];

    for (const { pattern, prompt } of companyPatterns) {
      if (pattern.test(text)) {
        return prompt;
      }
    }

    // Look for specific technologies or concepts
    const techPatterns = [
      { pattern: /automation|automate|workflow/g, prompt: 'business process automation visualization, automated workflow diagram, robotic process automation concept, modern efficiency technology' },
      { pattern: /api|integration|sdk/g, prompt: 'API integration visualization, connected software systems, modern integration platform, clean technical diagram' },
      { pattern: /database|sql|storage/g, prompt: 'database architecture visualization, data storage infrastructure, modern database technology, organized information system' },
      { pattern: /kubernetes|docker|container/g, prompt: 'container orchestration visualization, Docker containers, Kubernetes architecture, modern cloud infrastructure' },
      { pattern: /blockchain|crypto|web3/g, prompt: 'blockchain technology visualization, decentralized network, cryptocurrency concept, modern digital ledger system' },
      { pattern: /5g|network|connectivity/g, prompt: '5G network technology, high-speed connectivity visualization, modern telecommunications infrastructure, wireless technology' },
      { pattern: /vr|ar|virtual reality|augmented/g, prompt: 'virtual reality technology, immersive digital experience, VR headset with futuristic interface, modern extended reality concept' },
      { pattern: /iot|internet of things|sensor/g, prompt: 'Internet of Things ecosystem, connected smart devices, IoT network visualization, modern sensor technology' },
      { pattern: /quantum|quantum computing/g, prompt: 'quantum computing visualization, quantum processor, futuristic quantum technology, advanced computational system' }
    ];

    for (const { pattern, prompt } of techPatterns) {
      if (pattern.test(text)) {
        return prompt;
      }
    }

    // If we have a clear main subject, create a specific prompt
    if (mainSubject && mainSubject.length > 5) {
      return `modern technology concept visualization: ${mainSubject}, professional tech illustration, clean modern aesthetic, high-quality digital art`;
    }

    return null;
  }

  /**
   * Extract visual concept from title and summary combined
   * Uses a scoring system to find the most relevant theme
   */
  private extractVisualConcept(title: string, summary: string, category: string, content?: string): string {
    const fullText = (title + ' ' + summary + ' ' + (content || '')).toLowerCase();
    const combinedText = (title + ' ' + summary).toLowerCase();

    // First, try to extract specific entities/concepts from the content
    const extractedConcept = this.extractSpecificConcept(title, summary);
    if (extractedConcept) {
      console.log(`   Extracted concept: "${extractedConcept.substring(0, 80)}..."`);
      return extractedConcept;
    }

    // Define theme categories with weighted keywords - SPECIFIC themes have HIGHER priority
    const themes: { keywords: string[]; prompt: string; weight: number; contextKeywords?: string[] }[] = [
      // Video/Media Production (high priority)
      {
        keywords: ['video', 'clipper', 'editor', 'editing', 'footage', 'streaming', 'media player', 'clip', 'montage', 'movie', 'film', 'cinema', 'timeline', 'video production'],
        prompt: 'professional video editing workspace, multiple monitors with crisp timeline visible, cinema camera equipment, clean studio environment, sharp focus on editing equipment',
        weight: 15,
        contextKeywords: ['content creation', 'video production', 'film editing', 'media workflow']
      },
      // Gaming (high priority)
      {
        keywords: ['game', 'gaming', 'playstation', 'nintendo', 'xbox', 'console', 'gameplay', 'player', 'virtual reality', 'vr headset', 'game controller', 'esports'],
        prompt: 'modern gaming setup, RGB lighting, gaming chair and desk, multiple monitors with sharp gameplay footage, clean high-end gaming equipment, ultra-detailed graphics visible',
        weight: 15,
        contextKeywords: ['entertainment', 'interactive media', 'digital gaming', 'virtual worlds']
      },
      // Web/Browser (high priority)
      {
        keywords: ['browser', 'web app', 'web application', 'runs in browser', 'client-side', 'website', 'webpage', 'internet tool', 'online tool', 'web-based', 'chrome', 'firefox', 'safari'],
        prompt: 'modern web browser on sleek monitor, clean responsive web design mockup, code editor with sharp syntax highlighting, cloud application interface',
        weight: 15,
        contextKeywords: ['web development', 'frontend', 'user interface', 'digital platform']
      },
      // Mobile/Apps (high priority)
      {
        keywords: ['mobile', 'smartphone', 'iphone', 'android', 'ios', 'mobile app', 'phone application', 'tablet', 'app development', 'app store'],
        prompt: 'modern smartphone displaying app interface, clean touchscreen display, mobile device mockup with sharp UI design, professional product photography',
        weight: 15,
        contextKeywords: ['mobile technology', 'portable devices', 'app ecosystem', 'on-the-go computing']
      },
      // Robotics/Automation (high priority)
      {
        keywords: ['robot', 'robotics', 'automation', 'drone', 'mechanical arm', 'industrial robot', 'autonomous', 'factory automation', 'manufacturing bot'],
        prompt: 'advanced robotic arm in clean facility, automated manufacturing equipment, futuristic robot with sharp details, pristine mechanical technology',
        weight: 12,
        contextKeywords: ['industrial automation', 'smart manufacturing', 'robotic systems', 'mechatronics']
      },
      // Security (high priority)
      {
        keywords: ['security', 'cybersecurity', 'firewall', 'authentication', 'secure network', 'data protection', 'privacy protection', 'encryption', 'hacking', 'breach'],
        prompt: 'cybersecurity visualization, digital lock with sharp details, encrypted data streams, security shield hologram, clean modern technology',
        weight: 12,
        contextKeywords: ['digital security', 'information protection', 'cyber defense', 'privacy technology']
      },
      // Cloud/Infrastructure (medium priority)
      {
        keywords: ['cloud computing', 'server', 'hosting', 'data center', 'aws', 'azure', 'gcp', 'infrastructure', 'kubernetes', 'docker', 'devops'],
        prompt: 'clean server room with blue lighting, data center rows, network connectivity visualization, modern cloud infrastructure, sharp technical details',
        weight: 10,
        contextKeywords: ['distributed computing', 'scalable infrastructure', 'cloud services', 'server architecture']
      },
      // Data/Analytics (medium priority)
      {
        keywords: ['analytics', 'big data', 'data visualization', 'business intelligence', 'data analysis', 'metrics dashboard', 'statistics', 'data mining'],
        prompt: 'modern data visualization dashboard, sharp 3D charts and graphs, clean analytics interface, business intelligence graphics',
        weight: 10,
        contextKeywords: ['data science', 'business analytics', 'insights platform', 'metric tracking']
      },
      // Programming/Development (medium priority)
      {
        keywords: ['programming', 'software development', 'code editor', 'ide', 'repository', 'coding', 'developer tools', 'github', 'gitlab', 'version control'],
        prompt: 'professional developer workspace, multiple monitors with sharp code editor, clean software development environment, modern tech setup',
        weight: 10,
        contextKeywords: ['software engineering', 'code development', 'developer workflow', 'programming environment']
      },
      // Design/Creative (medium priority)
      {
        keywords: ['design', 'creative', 'graphic design', 'ui design', 'ux design', 'digital art', 'branding', 'illustration', 'figma', 'sketch', 'adobe'],
        prompt: 'creative design workspace, drawing tablet with sharp display, color swatches, digital art creation setup, clean graphic design studio',
        weight: 10,
        contextKeywords: ['visual design', 'creative process', 'digital art', 'brand identity']
      },
      // Communication/Social (medium priority)
      {
        keywords: ['social media', 'communication platform', 'messaging app', 'community platform', 'network connection', 'collaboration tool', 'team chat'],
        prompt: 'social media network visualization, connected user avatars, clean digital communication interface, messaging app design',
        weight: 8,
        contextKeywords: ['digital communication', 'social networking', 'online community', 'connectivity platform']
      },
      // Business/Startup (medium priority)
      {
        keywords: ['startup', 'entrepreneur', 'business strategy', 'company growth', 'venture capital', 'innovation hub', 'funding', 'investment', 'market'],
        prompt: 'modern startup office, collaborative workspace with glass walls, business professionals in clean meeting room, contemporary corporate setting',
        weight: 8,
        contextKeywords: ['business innovation', 'corporate growth', 'entrepreneurship', 'market expansion']
      },
      // Science/Research (medium priority)
      {
        keywords: ['research', 'laboratory', 'scientific', 'experiment', 'discovery', 'microscope', 'lab equipment', 'biotech', 'genetics'],
        prompt: 'modern research laboratory, advanced equipment with sharp details, clean white laboratory environment, scientist at work',
        weight: 8,
        contextKeywords: ['scientific discovery', 'laboratory research', 'biological sciences', 'experimental technology']
      },
      // Finance/Fintech (medium priority)
      {
        keywords: ['finance', 'fintech', 'banking', 'payment', 'cryptocurrency', 'bitcoin', 'blockchain', 'trading', 'investment app', 'wallet'],
        prompt: 'modern financial technology interface, digital banking visualization, cryptocurrency concept with sharp details, fintech dashboard',
        weight: 10,
        contextKeywords: ['digital finance', 'financial technology', 'modern banking', 'crypto assets']
      },
      // Healthcare/Medical Tech (medium priority)
      {
        keywords: ['healthcare', 'medical', 'health tech', 'telemedicine', 'diagnosis', 'patient care', 'medical device', 'hospital technology'],
        prompt: 'modern medical technology, healthcare innovation, medical device with sharp details, clean clinical environment with advanced equipment',
        weight: 10,
        contextKeywords: ['medical innovation', 'healthcare technology', 'patient care systems', 'clinical technology']
      },
      // Education/Learning (medium priority)
      {
        keywords: ['education', 'learning', 'e-learning', 'online course', 'training', 'tutorial', 'academic', 'student', 'classroom'],
        prompt: 'modern educational technology setup, e-learning platform interface, digital classroom with sharp displays, online learning environment',
        weight: 8,
        contextKeywords: ['digital education', 'online learning', 'educational technology', 'knowledge platform']
      },
      // Hardware/Devices (high priority)
      {
        keywords: ['hardware', 'device', 'chip', 'processor', 'semiconductor', 'circuit', 'electronics', 'gadget', 'laptop', 'computer'],
        prompt: 'advanced computer hardware, semiconductor chip with sharp details, modern electronic device, clean tech product photography',
        weight: 12,
        contextKeywords: ['computer hardware', 'electronic devices', 'semiconductor technology', 'physical computing']
      },
      // AI/ML Specific (highest priority for AI category)
      {
        keywords: ['neural network', 'deep learning', 'llm', 'large language model', 'chatgpt', 'claude', 'ai model', 'training', 'inference', 'transformer'],
        prompt: 'abstract neural network visualization, interconnected nodes with glowing connections, artificial intelligence concept art, clean tech aesthetic with data flows',
        weight: 14,
        contextKeywords: ['machine intelligence', 'neural computing', 'cognitive systems', 'AI architecture']
      },
      // Chatbots/Virtual Assistants (lower priority)
      {
        keywords: ['chatbot', 'virtual assistant', 'voice assistant', 'conversational ai', 'natural language processing', 'nlu', 'nlg'],
        prompt: 'futuristic virtual assistant interface, clean holographic display, sharp voice wave visualization, modern chat interface',
        weight: 6,
        contextKeywords: ['conversational interface', 'digital assistant', 'voice technology', 'chat interface']
      },
      // Generic AI (lowest priority - only if no specific theme found)
      {
        keywords: ['artificial intelligence', 'machine learning', 'ai technology', 'smart system', 'intelligent automation'],
        prompt: 'abstract AI technology visualization, clean geometric digital patterns, flowing data visualization, modern tech aesthetic with blue gradients',
        weight: 3,
        contextKeywords: ['intelligent systems', 'automated intelligence', 'cognitive computing']
      }
    ];

    // Score each theme based on keyword and context matches
    const themeScores = themes.map(theme => {
      // Count direct keyword matches
      const keywordMatches = theme.keywords.filter(keyword => combinedText.includes(keyword)).length;

      // Count context keyword matches (if available)
      const contextMatches = theme.contextKeywords
        ? theme.contextKeywords.filter(keyword => fullText.includes(keyword)).length
        : 0;

      // Calculate weighted score: direct keywords get full weight, context gets half weight
      const score = (keywordMatches * theme.weight) + (contextMatches * theme.weight * 0.5);

      return { theme, score, keywordMatches, contextMatches };
    });

    // Sort by score and get the best match
    themeScores.sort((a, b) => b.score - a.score);
    const bestMatch = themeScores[0];

    // If we have a good match (score > 0), use it
    if (bestMatch && bestMatch.score > 0) {
      console.log(`   Image theme: ${bestMatch.theme.keywords[0]} (score: ${Math.round(bestMatch.score)}, keywords: ${bestMatch.keywordMatches}, context: ${bestMatch.contextMatches})`);
      return bestMatch.theme.prompt;
    }

    // Fallback based on category - create diverse, sharp prompts
    const categoryPrompts: Record<string, string[]> = {
      ai: [
        'modern artificial intelligence workspace, AI research laboratory, futuristic computer interface with sharp details',
        'clean abstract AI visualization, neural pathway artwork, digital transformation concept with maximum clarity',
        'smart technology integration, intelligent automation system, AI-powered device showcase with crisp edges',
        'futuristic data processing center, algorithm visualization, computational technology with perfect focus'
      ],
      tech: [
        'modern technology workspace with multiple devices, sleek gadget setup with sharp focus, innovation environment',
        'contemporary digital workspace, professional tech equipment with maximum clarity, clean modern office',
        'advanced technology showcase, cutting-edge device display with pristine details, tech innovation concept',
        'modern innovation hub interior, technology-driven workspace, digital transformation setting with clean lines'
      ],
      science: [
        'modern scientific research facility, advanced laboratory equipment with sharp details, discovery environment',
        'cutting-edge science laboratory, research innovation space with perfect focus, scientific exploration',
        'contemporary research center, modern scientific instruments with maximum clarity, breakthrough technology',
        'state-of-the-art science facility, research and development lab, scientific advancement with crisp edges'
      ]
    };

    // Randomly select from category prompts for variety
    const prompts = categoryPrompts[category] || categoryPrompts.tech;
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    return randomPrompt;
  }

  /**
   * Delete an image file
   */
  deleteImage(imagePath: string): void {
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`🗑️  Deleted image: ${path.basename(imagePath)}`);
      }
    } catch (error) {
      console.error('❌ Failed to delete image:', (error as Error).message);
    }
  }

  /**
    * Get image dimensions for validation
    */
  async getImageInfo(imagePath: string): Promise<{ width: number; height: number; size: number } | null> {
    try {
      const stats = fs.statSync(imagePath);
      return {
        width: 2048,
        height: 2048,
        size: stats.size
      };
    } catch (error) {
      return null;
    }
  }

  /**
    * Get available models with quality rankings
    */
  getAvailableModels(): { name: string; quality: string; description: string }[] {
    return [
      { name: 'flux', quality: 'excellent', description: 'Flux 1 (Standard) - Best overall realism and quality' },
      { name: 'flux-realism', quality: 'excellent', description: 'Flux Realism - Photorealistic style' },
      { name: 'flux-pro', quality: 'best', description: 'Flux Pro - Highest fidelity' },
      { name: 'nano', quality: 'very good', description: 'Nano Banana - Good for speed' },
      { name: 'flux-anime', quality: 'excellent', description: 'Flux Anime - Best for anime style' },
      { name: 'flux-3d', quality: 'excellent', description: 'Flux 3D - 3D render style' }
    ];
  }

  /**
   * Set the default model for all generations
   */
  setDefaultModel(model: ImageModel): void {
    console.log(`📸 Default image model changed to: ${model}`);
  }

  /**
   * Test Hugging Face connection explicitly and return result/error
   * Used for debugging /debug/test-image endpoint
   */
  async testHuggingFaceConnection(): Promise<{ success: boolean; message: string }> {
    const hfKey = config.huggingface.token;
    if (!hfKey) {
        return { success: false, message: 'HUGGINGFACE_TOKEN is missing in environment.' };
    }

    try {
        console.log("🧪 Testing Hugging Face connection (Debug)...");
        // Try a tiny image generation to verify token
        await axios.post(
            this.huggingFaceUrl,
            { inputs: "test", parameters: { width: 256, height: 256 } },
            {
                headers: {
                    Authorization: `Bearer ${hfKey}`,
                    'Content-Type': 'application/json',
                },
                responseType: 'arraybuffer',
                timeout: 10000 
            }
        );
        
        return { success: true, message: '✅ Hugging Face API is responding correctly! Token is valid.' };
    } catch (error) {
        const errorMsg = (error as any).response?.data?.toString() || (error as Error).message;
        const status = (error as any).response?.status;
        
        return { 
            success: false, 
            message: `❌ Hugging Face Error (${status || 'Unknown'}): ${errorMsg}` 
        };
    }
  }
}
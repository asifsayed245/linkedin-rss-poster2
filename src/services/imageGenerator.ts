import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { config } from '../config/config';

export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  model?: string;
  seed?: number;
  nologo?: boolean;
  enhance?: boolean;
}

export interface GeneratedImage {
  url: string;
  localPath: string;
  seed: number;
  width: number;
  height: number;
  provider: 'pollinations' | 'huggingface';
}

export class ImageGenerator {
  private readonly imagesDir: string;
  private readonly pollinationsUrl = 'https://image.pollinations.ai';
  // Use a reliable model that doesn't need authentication for high availability or fallback
  // FLUX.1-schnell is great but often requires auth on HF due to load. 
  // Pollinations handles this for us usually, but direct HF offers better control.
  private readonly huggingFaceUrl = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell';

  constructor() {
    this.imagesDir = path.join(process.cwd(), 'public', 'images');
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

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
      const { prompt, width = 1024, height = 1024, model = 'flux', seed = Math.floor(Math.random() * 1000000), nologo = true, enhance = true } = options;
      
      console.log(`🎨 Generating image with Pollinations (Model: ${model})...`);
      
      const encodedPrompt = encodeURIComponent(prompt);
      let url = `${this.pollinationsUrl}/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=${nologo}`;
      
      if (enhance) {
        url += '&enhance=true';
      }

      const response = await axios.get(url, { responseType: 'arraybuffer' });
      
      const filename = `image_${Date.now()}_${seed}.jpg`;
      const localPath = path.join(this.imagesDir, filename);
      
      fs.writeFileSync(localPath, response.data);
      
      console.log(`✅ Image generated: ${filename}`);
      
      return {
        url: `/images/${filename}`,
        localPath,
        seed,
        width,
        height,
        provider: 'pollinations'
      };
    } catch (error) {
      console.error('❌ Image generation failed:', (error as Error).message);
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

  async generatePostImage(article: {
    title: string;
    summary: string;
    category: string
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

  private createPrompt(article: { title: string; summary: string; category: string; content?: string }): string {
    const visualConcept = this.extractVisualConcept(article.title, article.summary, article.content);
    
    // Enhanced styles for professional LinkedIn content
    const styles = {
      ai: "futuristic, high-tech, neural networks, glowing nodes, cyan and purple accent lighting, clean 3d render, unreal engine 5 style, ultra detailed, professional",
      tech: "modern minimalist workspace, latest gadgets, clean desk setup, soft lighting, professional photography, 8k resolution, depth of field",
      science: "laboratory setting, molecular structures, data visualization, scientific innovation, clean white and blue aesthetic, macro photography style"
    };

    const style = styles[article.category as keyof typeof styles] || styles.tech;
    
    return `${visualConcept}, ${style}, no text, no words, high quality, photorealistic, cinematic lighting`;
  }

  private extractVisualConcept(title: string, summary: string, content?: string): string {
    // Try to extract a concrete visual subject from the article
    // This is a simple heuristic - could be improved with NLP
    
    const combinedText = `${title} ${summary} ${content || ''}`.toLowerCase();
    
    // Priority specific mappings for better relevance
    if (combinedText.includes('robot') || combinedText.includes('humanoid')) return "advanced humanoid robot working in modern office";
    if (combinedText.includes('medical') || combinedText.includes('health')) return "medical technology visualization, dna strands, digital healthcare interface";
    if (combinedText.includes('cyber') || combinedText.includes('security')) return "digital security shield, holographic lock, binary code rain matrix style";
    if (combinedText.includes('cloud') || combinedText.includes('server')) return "futuristic server room with glowing blue lights, cloud computing concept";
    if (combinedText.includes('code') || combinedText.includes('developer')) return "developer working on multiple monitors with code screens, dark mode aesthetic";
    if (combinedText.includes('brain') || combinedText.includes('neural')) return "glowing digital brain, neural network connections, synapse";
    if (combinedText.includes('car') || combinedText.includes('automotive')) return "futuristic autonomous electric vehicle concept, sleek design";
    if (combinedText.includes('space') || combinedText.includes('rocket')) return "space exploration, rocket launch, nebula background";
    
    // Fallback based on generic keywords
    const keywords = ['robot', 'brain', 'computer', 'network', 'city', 'office', 'laboratory'];
    const found = keywords.find(k => title.toLowerCase().includes(k));
    
    if (found) return `futuristic ${found} visualization`;
    
    // Default abstract concept if nothing specific found
    return `abstract concept art representing ${title}, professional corporate illustration`;
  }
}

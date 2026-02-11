import fs from 'fs';
import path from 'path';

export interface InfographicData {
  title: string;
  keyPoints: string[];
  source: string;
  category: string;
  imageUrl?: string;
  articleUrl: string;
}

export interface InfographicResult {
  html: string;
  path: string;
  filename: string;
}

export class InfographicGenerator {
  private readonly infographicsDir: string;

  constructor() {
    this.infographicsDir = path.join(process.cwd(), 'public', 'infographics');
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.infographicsDir)) {
      fs.mkdirSync(this.infographicsDir, { recursive: true });
    }
  }

  /**
   * Generate a branded infographic HTML that can be rendered or converted to image
   */
  generateInfographic(data: InfographicData): InfographicResult {
    const { title, keyPoints, source, category, articleUrl } = data;
    
    const filename = `infographic_${Date.now()}.html`;
    const filePath = path.join(this.infographicsDir, filename);
    
    const html = this.createInfographicHTML(data);
    
    fs.writeFileSync(filePath, html);
    
    console.log(`📊 Infographic generated: ${filename}`);
    
    return {
      html,
      path: filePath,
      filename
    };
  }

  /**
   * Create the infographic HTML with professional styling
   */
  private createInfographicHTML(data: InfographicData): string {
    const { title, keyPoints, source, category, imageUrl, articleUrl } = data;
    
    // Category colors
    const colors: Record<string, { primary: string; secondary: string; accent: string }> = {
      ai: { primary: '#667eea', secondary: '#764ba2', accent: '#f093fb' },
      tech: { primary: '#11998e', secondary: '#38ef7d', accent: '#0f9b0f' },
      science: { primary: '#fc4a1a', secondary: '#f7b733', accent: '#ff6b6b' }
    };
    
    const theme = colors[category] || colors.tech;
    
    // Format key points
    const pointsHTML = keyPoints.map((point, index) => `
      <div class="key-point">
        <div class="point-number">${index + 1}</div>
        <div class="point-text">${point}</div>
      </div>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px;
        }
        
        .infographic {
            background: white;
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            max-width: 800px;
            width: 100%;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .category-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
        }
        
        .title {
            font-size: 32px;
            font-weight: 700;
            line-height: 1.3;
            margin-bottom: 15px;
        }
        
        .source {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .key-points {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #333;
            margin-bottom: 25px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .key-point {
            display: flex;
            align-items: flex-start;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 12px;
            border-left: 4px solid ${theme.primary};
        }
        
        .point-number {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            margin-right: 15px;
            flex-shrink: 0;
        }
        
        .point-text {
            font-size: 16px;
            line-height: 1.6;
            color: #444;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 25px 40px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .read-more {
            display: inline-block;
            background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%);
            color: white;
            padding: 12px 30px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: transform 0.2s;
        }
        
        .read-more:hover {
            transform: translateY(-2px);
        }
        
        .hashtags {
            margin-top: 20px;
            font-size: 14px;
            color: #666;
        }
        
        .image-container {
            margin: 30px 0;
            text-align: center;
        }
        
        .generated-image {
            max-width: 100%;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .infographic {
                box-shadow: none;
            }
        }
        
        @media (max-width: 600px) {
            body {
                padding: 20px;
            }
            .title {
                font-size: 24px;
            }
            .header, .content {
                padding: 25px;
            }
        }
    </style>
</head>
<body>
    <div class="infographic">
        <div class="header">
            <div class="category-badge">${category.toUpperCase()}</div>
            <h1 class="title">${title}</h1>
            <div class="source">📰 Source: ${source}</div>
        </div>
        
        <div class="content">
            ${imageUrl ? `
            <div class="image-container">
                <img src="${imageUrl}" alt="Generated illustration" class="generated-image">
            </div>
            ` : ''}
            
            <div class="key-points">
                <div class="section-title">Key Takeaways</div>
                ${pointsHTML}
            </div>
        </div>
        
        <div class="footer">
            <a href="${articleUrl}" target="_blank" class="read-more">🔗 Read Full Article</a>
            <div class="hashtags">
                #TechNews #Innovation #${category === 'ai' ? 'AI #ArtificialIntelligence' : category === 'science' ? 'Science #Research' : 'Technology #DigitalTransformation'}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Extract key points from post content for infographic
   */
  extractKeyPoints(content: string, maxPoints: number = 5): string[] {
    // Split by sentences and filter for key insights
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200);
    
    // Take first few meaningful sentences as key points
    return sentences.slice(0, maxPoints).map(s => {
      // Clean up and format
      return s
        .replace(/^\s+/, '')
        .replace(/\s+/g, ' ')
        .trim();
    });
  }

  /**
   * Create a text-only fallback infographic (no AI image)
   */
  generateTextOnlyInfographic(data: InfographicData): InfographicResult {
    return this.generateInfographic({
      ...data,
      imageUrl: undefined
    });
  }

  /**
   * Delete an infographic file
   */
  deleteInfographic(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted infographic: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.error('❌ Failed to delete infographic:', (error as Error).message);
    }
  }
}

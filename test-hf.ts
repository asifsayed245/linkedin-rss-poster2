import { ImageGenerator } from './src/services/imageGenerator';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testHuggingFace() {
    console.log('🧪 Testing Hugging Face Image Generation...');

    const apiKey = process.env.HUGGINGFACE_TOKEN;
    if (!apiKey || apiKey === 'hf_your_token_here') {
        console.error('❌ HUGGINGFACE_TOKEN is missing or default in .env');
        console.log('👉 Please get a free token from https://huggingface.co/settings/tokens and add it to your .env file.');
        return;
    }

    const generator = new ImageGenerator();
    
    // Force a prompt that would trigger HF (any prompt, but ensure key is present)
    const result = await generator.generateImage({
        prompt: "A futuristic city with flying cars, cyberpunk style, highly detailed, 8k resolution, ultra realistic",
        width: 1024,
        height: 1024,
        model: 'flux', // Should trigger HF preferred path
        nologo: true
    });

    if (result) {
        console.log('\n✅ Generation Successful!');
        console.log(`Typical Provider: ${result.provider}`);
        console.log(`Image saved to: ${result.localPath}`);
        
        const stats = fs.statSync(result.localPath);
        console.log(`Size: ${Math.round(stats.size / 1024)} KB`);
        
        if (result.provider === 'huggingface') {
            console.log('🎉 SUCCESSFULLY used Hugging Face!');
        } else {
            console.log('⚠️  Fallback to Pollinations used. Check your API Key or Quota.');
        }
    } else {
        console.error('❌ Generation Failed.');
    }
}

testHuggingFace();

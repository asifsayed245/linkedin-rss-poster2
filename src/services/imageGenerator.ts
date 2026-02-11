// ... (previous code) ...

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
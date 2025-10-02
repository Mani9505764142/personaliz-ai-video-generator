// services/ttsService.ts
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

interface AudioGenerationResult {
    success: boolean;
    audioPath: string | null;
    fileName: string | null;
    duration?: number | null;
    error?: string;
}

interface TTSServiceConfig {
    apiKey?: string;
    model?: string;
    speed?: number;
}

class TTSService {
    private openai: OpenAI;
    private audioDir: string;
    private config: TTSServiceConfig;

    constructor(config: TTSServiceConfig = {}) {
        this.config = {
            model: 'tts-1',
            speed: 1.0,
            ...config
        };

        this.openai = new OpenAI({
            apiKey: config.apiKey || process.env.OPENAI_API_KEY || 'your-openai-api-key'
        });

        this.audioDir = path.join(process.cwd(), 'temp', 'audio');
        
        // Ensure audio directory exists
        if (!fs.existsSync(this.audioDir)) {
            fs.mkdirSync(this.audioDir, { recursive: true });
        }
    }

    async generateAudio(
        text: string, 
        voice: 'nova' | 'onyx' | 'shimmer' | 'alloy' | 'echo' | 'fable' = 'nova',
        outputFileName?: string
    ): Promise<AudioGenerationResult> {
        try {
            console.log('🎤 Generating TTS audio for:', text.substring(0, 50) + '...');
            
            const response = await this.openai.audio.speech.create({
                model: this.config.model as 'tts-1' | 'tts-1-hd',
                voice: voice,
                input: text,
                speed: this.config.speed || 1.0
            });

            // Generate filename if not provided
            const fileName = outputFileName || `tts_${Date.now()}.mp3`;
            const filePath = path.join(this.audioDir, fileName);
            
            // Convert response to buffer and save
            const buffer = Buffer.from(await response.arrayBuffer());
            fs.writeFileSync(filePath, buffer);
            
            console.log('✅ TTS audio generated:', filePath);
            return {
                success: true,
                audioPath: filePath,
                fileName: fileName,
                duration: null // Could calculate duration if needed
            };
            
        } catch (error) {
            console.error('❌ TTS generation failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                audioPath: null,
                fileName: null
            };
        }
    }

    // Get available voices
    getAvailableVoices(): string[] {
        return ['nova', 'onyx', 'shimmer', 'alloy', 'echo', 'fable'];
    }

    // Clean up old audio files
    cleanupOldFiles(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 hours default
        try {
            const files = fs.readdirSync(this.audioDir);
            const now = Date.now();
            
            files.forEach(file => {
                const filePath = path.join(this.audioDir, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > maxAge) {
                    fs.unlinkSync(filePath);
                    console.log('🗑️ Cleaned up old file:', file);
                }
            });
        } catch (error) {
            console.error('❌ Cleanup failed:', error);
        }
    }

    // Get audio directory path
    getAudioDirectory(): string {
        return this.audioDir;
    }
}

export default TTSService;
export type { AudioGenerationResult, TTSServiceConfig };

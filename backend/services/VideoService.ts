// services/videoService.ts
import TTSService from './ttsService';
import ScriptService from './scriptService';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

interface VideoRequest {
    name: string;
    city: string;
    phone: string;
    templateId?: string;
    actorImage?: string;
    voice?: 'nova' | 'onyx' | 'shimmer' | 'alloy' | 'echo' | 'fable';
}

interface VideoResult {
    success: boolean;
    videoPath?: string;
    videoUrl?: string;
    audioPath?: string;
    scriptContent?: string;
    error?: string;
    processingTime?: number;
    metadata?: {
        duration: number;
        templateUsed: string;
        voice: string;
        generatedAt: Date;
    };
}

class VideoService {
    private ttsService: TTSService;
    private scriptService: ScriptService;
    private videoDir: string;
    private defaultActorImages: string[];

    constructor() {
        this.ttsService = new TTSService();
        this.scriptService = new ScriptService();
        this.videoDir = path.join(process.cwd(), 'temp', 'videos');
        
        // Default actor images (you can customize these paths)
        this.defaultActorImages = [
            path.join(process.cwd(), 'assets', 'actors', 'actor1.jpg'),
            path.join(process.cwd(), 'assets', 'actors', 'actor2.jpg'),
            path.join(process.cwd(), 'assets', 'actors', 'actor3.jpg')
        ];

        // Ensure directories exist
        this.ensureDirectories();
    }

    private ensureDirectories(): void {
        [this.videoDir, path.join(process.cwd(), 'assets', 'actors')].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async generatePersonalizedVideo(request: VideoRequest): Promise<VideoResult> {
        const startTime = Date.now();
        console.log(`🎬 Starting video generation for ${request.name} from ${request.city}`);

        try {
            // Step 1: Generate personalized script
            const templateId = request.templateId || this.scriptService.getRandomTemplate().id;
            const generatedScript = this.scriptService.generateScript(templateId, {
                name: request.name,
                city: request.city,
                phone: request.phone
            });

            if (!generatedScript) {
                throw new Error('Failed to generate script');
            }

            console.log(`📝 Script generated: ${generatedScript.personalizedContent.substring(0, 50)}...`);

            // Step 2: Generate TTS audio
            const voice = request.voice || 'nova';
            const audioFileName = `audio_${request.name.replace(/\s+/g, '_')}_${Date.now()}.mp3`;
            const audioResult = await this.ttsService.generateAudio(
                generatedScript.personalizedContent,
                voice,
                audioFileName
            );

            if (!audioResult.success || !audioResult.audioPath) {
                throw new Error(`TTS generation failed: ${audioResult.error}`);
            }

            console.log(`🎤 TTS audio generated: ${audioResult.fileName}`);

            // Step 3: Select actor image
            const actorImagePath = request.actorImage || this.getRandomActorImage();
            if (!fs.existsSync(actorImagePath)) {
                throw new Error(`Actor image not found: ${actorImagePath}`);
            }

            // Step 4: Generate video with Wav2Lip
            const videoFileName = `video_${request.name.replace(/\s+/g, '_')}_${Date.now()}.mp4`;
            const videoPath = path.join(this.videoDir, videoFileName);

            const wav2lipResult = await this.runWav2Lip(
                actorImagePath,
                audioResult.audioPath,
                videoPath
            );

            if (!wav2lipResult.success) {
                throw new Error(`Wav2Lip processing failed: ${wav2lipResult.error}`);
            }

            console.log(`🎬 Video generated successfully: ${videoFileName}`);

            // Step 5: Clean up temporary files (optional)
            this.cleanupTempFiles([audioResult.audioPath]);

            const processingTime = Date.now() - startTime;

            return {
                success: true,
                videoPath: videoPath,
                videoUrl: `/api/videos/${videoFileName}`, // Adjust based on your API structure
                audioPath: audioResult.audioPath,
                scriptContent: generatedScript.personalizedContent,
                processingTime,
                metadata: {
                    duration: generatedScript.estimatedDuration || 15,
                    templateUsed: templateId,
                    voice: voice,
                    generatedAt: new Date()
                }
            };

        } catch (error) {
            console.error('❌ Video generation failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                processingTime: Date.now() - startTime
            };
        }
    }

    private async runWav2Lip(imagePath: string, audioPath: string, outputPath: string): Promise<{success: boolean, error?: string}> {
        return new Promise((resolve) => {
            console.log('🎭 Running Wav2Lip processing...');
            
            // Construct Wav2Lip command
            // Adjust this command based on your Wav2Lip setup
            const wav2lipCommand = 'python';
            const wav2lipScript = path.join(process.cwd(), 'Wav2Lip', 'inference.py'); // Adjust path
            
            const args = [
                wav2lipScript,
                '--checkpoint_path', path.join(process.cwd(), 'Wav2Lip', 'checkpoints', 'wav2lip_gan.pth'),
                '--face', imagePath,
                '--audio', audioPath,
                '--outfile', outputPath,
                '--static', // Remove this if you want head movement
                '--fps', '25',
                '--pads', '0', '10', '0', '0'
            ];

            const wav2lipProcess = spawn(wav2lipCommand, args);
            let errorOutput = '';

            wav2lipProcess.stdout.on('data', (data) => {
                console.log(`Wav2Lip: ${data.toString()}`);
            });

            wav2lipProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.error(`Wav2Lip Error: ${data.toString()}`);
            });

            wav2lipProcess.on('close', (code) => {
                if (code === 0 && fs.existsSync(outputPath)) {
                    console.log('✅ Wav2Lip processing completed successfully');
                    resolve({ success: true });
                } else {
                    console.error(`❌ Wav2Lip process exited with code ${code}`);
                    resolve({ 
                        success: false, 
                        error: `Wav2Lip failed with code ${code}: ${errorOutput}`
                    });
                }
            });

            wav2lipProcess.on('error', (error) => {
                console.error('❌ Failed to start Wav2Lip process:', error);
                resolve({ 
                    success: false, 
                    error: `Failed to start Wav2Lip: ${error.message}`
                });
            });
        });
    }

    private getRandomActorImage(): string {
        const availableImages = this.defaultActorImages.filter(img => fs.existsSync(img));
        if (availableImages.length === 0) {
            throw new Error('No actor images found. Please add images to assets/actors/');
        }
        const randomIndex = Math.floor(Math.random() * availableImages.length);
        return availableImages[randomIndex];
    }

    private cleanupTempFiles(filePaths: string[]): void {
        filePaths.forEach(filePath => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ Cleaned up: ${path.basename(filePath)}`);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to cleanup ${filePath}:`, error);
            }
        });
    }

    // Get list of available templates
    getAvailableTemplates() {
        return this.scriptService.getTemplates();
    }

    // Get available voices
    getAvailableVoices() {
        return this.ttsService.getAvailableVoices();
    }

    // Get video directory for serving files
    getVideoDirectory(): string {
        return this.videoDir;
    }

    // Bulk video generation (for multiple users)
    async generateBulkVideos(requests: VideoRequest[]): Promise<VideoResult[]> {
        console.log(`🎬 Starting bulk video generation for ${requests.length} users`);
        const results: VideoResult[] = [];

        for (const request of requests) {
            try {
                const result = await this.generatePersonalizedVideo(request);
                results.push(result);
                
                // Add delay between generations to avoid overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                results.push({
                    success: false,
                    error: `Failed for ${request.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
        }

        console.log(`✅ Bulk generation completed. Success: ${results.filter(r => r.success).length}/${results.length}`);
        return results;
    }
}

export default VideoService;
export type { VideoRequest, VideoResult };

import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

import Wav2LipService from './Wav2LipService';
import ElevenLabsService from './ElevenLabsService';

interface PersonalizationRequest {
  name: string;
  city: string;
  phone?: string;
  customMessage?: string;
  celebrity: 'mahesh' | 'prabhas' | 'default';
}

interface PersonalizationResult {
  success: boolean;
  data?: {
    videoId: string;
    videoUrl: string;
    thumbnailUrl: string;
    audioUrl: string;
    name: string;
    city: string;
    celebrity: string;
    personalizedScript: string;
    fileSize: number;
    method: string;
  };
  error?: string;
}

class PersonalizedVideoService {
  private wav2lipService: Wav2LipService;
  private elevenLabsService: ElevenLabsService;
  private sourceVideoPath: string;
  private uploadsDir: string;

  constructor(wav2lipService: Wav2LipService, elevenLabsService: ElevenLabsService) {
    this.wav2lipService = wav2lipService;
    this.elevenLabsService = elevenLabsService;
    // 🔧 FIXED: Go up one directory from services to backend, then into assets
    this.sourceVideoPath = path.join(__dirname, '..', 'assets', 'Personaliz video (1).mp4');
    this.uploadsDir = process.env.UPLOAD_PATH || './uploads';

    // Ensure directories exist
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    console.log('🎬 PersonalizedVideoService initialized');
    console.log(`📁 Source video: ${this.sourceVideoPath}`);
    console.log(`📁 Uploads directory: ${this.uploadsDir}`);
    console.log(`📹 Source video exists: ${fs.existsSync(this.sourceVideoPath) ? 'YES ✅' : 'NO ❌'}`);
  }

  // [REST OF THE CODE REMAINS THE SAME - just copy your existing methods here]
  
  // Main function to generate personalized video
  async generatePersonalizedVideo(request: PersonalizationRequest): Promise<PersonalizationResult> {
    try {
      console.log('\n🎬 === PERSONALIZED VIDEO GENERATION START ===');
      console.log('Request:', {
        name: request.name,
        city: request.city,
        celebrity: request.celebrity,
        customMessage: request.customMessage?.substring(0, 50) + '...'
      });

      // Generate unique video ID
      const videoId = `${request.celebrity}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create personalized content
      const overlayText = `Hi ${request.name} from ${request.city}!`;
      const speechText = request.customMessage ? 
        `Hi ${request.name}! I hope you're having a wonderful day in ${request.city}. ${request.customMessage}. Thank you for choosing our service!` :
        `Hello ${request.name}! Welcome from ${request.city}! We're excited to create this personalized video just for you. Thank you!`;

      console.log('📝 Generated content:');
      console.log('- Overlay Text:', overlayText);
      console.log('- Speech Text:', speechText.substring(0, 100) + '...');

      // Setup file paths
      const personalizedAudioPath = path.join(this.uploadsDir, `${videoId}_speech.wav`);
      const lipSyncVideoPath = path.join(this.uploadsDir, `${videoId}_lipsync.mp4`);
      const finalVideoPath = path.join(this.uploadsDir, `${videoId}.mp4`);
      const audioPath = path.join(this.uploadsDir, `${videoId}_audio.mp3`);
      const thumbnailPath = path.join(this.uploadsDir, `${videoId}_thumb.jpg`);

      let method = 'None';
      let success = false;

      // Step 1: Generate personalized audio
      console.log('\n🎤 === AUDIO GENERATION ===');
      
      let audioGenerated = false;
      
      if (request.celebrity !== 'default') {
        console.log(`🎭 Generating ${request.celebrity} voice...`);
        audioGenerated = await this.elevenLabsService.generateCelebrityVoice(
          speechText, 
          personalizedAudioPath, 
          request.celebrity
        );
        
        if (audioGenerated) {
          method = `${request.celebrity === 'mahesh' ? 'Mahesh Babu' : 'Prabhas'} Voice Clone`;
        }
      }
      
      if (!audioGenerated) {
        console.log('🎤 Generating default voice...');
        audioGenerated = await this.elevenLabsService.generateSpeech(speechText, personalizedAudioPath);
        
        if (audioGenerated) {
          method = 'ElevenLabs Default Voice';
        }
      }

      if (!audioGenerated) {
        throw new Error('Audio generation failed with all methods');
      }

      console.log(`✅ Audio generated: ${method}`);

      // Step 2: Apply Wav2Lip for lip-sync
      console.log('\n🎭 === WAV2LIP PROCESSING ===');
      
      const wav2lipSuccess = await this.wav2lipService.generateLipSync(
        this.sourceVideoPath,
        personalizedAudioPath,
        lipSyncVideoPath
      );

      if (wav2lipSuccess) {
        console.log('✅ Wav2Lip processing successful');
        
        // Step 3: Add text overlay
        console.log('\n🎨 === ADDING TEXT OVERLAY ===');
        
        const overlaySuccess = await this.addTextOverlay(lipSyncVideoPath, overlayText, finalVideoPath);
        
        if (overlaySuccess) {
          method = `${method} + Wav2Lip + Text Overlay`;
          success = true;
        } else {
          console.log('⚠️ Text overlay failed, using video without overlay');
          fs.copyFileSync(lipSyncVideoPath, finalVideoPath);
          method = `${method} + Wav2Lip`;
          success = true;
        }
        
      } else {
        console.log('❌ Wav2Lip failed, creating fallback video');
        
        // Fallback: Original video with text overlay
        const fallbackSuccess = await this.createFallbackVideo(overlayText, finalVideoPath);
        
        if (fallbackSuccess) {
          method = 'Fallback: Original Video + Text Overlay';
          success = true;
        } else {
          throw new Error('All video generation methods failed');
        }
      }

      // Step 4: Generate response audio and thumbnail
      await Promise.all([
        this.generateResponseAudio(speechText, audioPath, request.celebrity),
        this.generateThumbnail(finalVideoPath, thumbnailPath)
      ]);

      // Clean up temporary files
      [personalizedAudioPath, lipSyncVideoPath].forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });

      // Generate URLs
      const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
      const videoUrl = `${baseUrl}/uploads/${videoId}.mp4`;
      const thumbnailUrl = `${baseUrl}/uploads/${videoId}_thumb.jpg`;
      const audioUrl = `${baseUrl}/uploads/${videoId}_audio.mp3`;

      const fileSize = fs.existsSync(finalVideoPath) ? fs.statSync(finalVideoPath).size : 0;

      console.log('\n🎯 === GENERATION COMPLETE ===');
      console.log(`✅ Success: ${success}`);
      console.log(`🎭 Method: ${method}`);
      console.log(`📏 File size: ${fileSize} bytes`);
      console.log(`🔗 Video URL: ${videoUrl}`);

      return {
        success: true,
        data: {
          videoId,
          videoUrl,
          thumbnailUrl,
          audioUrl,
          name: request.name,
          city: request.city,
          celebrity: request.celebrity === 'default' ? 'Default Person' : 
                    (request.celebrity === 'mahesh' ? 'Mahesh Babu' : 'Prabhas'),
          personalizedScript: speechText,
          fileSize,
          method
        }
      };

    } catch (error: any) {
      console.error('\n💥 PersonalizedVideoService error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Add text overlay to video
  private async addTextOverlay(inputVideoPath: string, overlayText: string, outputVideoPath: string): Promise<boolean> {
    try {
      console.log('🎨 Adding text overlay...');
      
      const escapedText = overlayText
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "'\\''")
        .replace(/"/g, '\\"')
        .replace(/:/g, '\\:')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');
      
      const overlayCommand = `ffmpeg -i "${inputVideoPath}" -vf "drawtext=text='${escapedText}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=50:box=1:boxcolor=black@0.8:boxborderw=5" -c:v libx264 -c:a copy -pix_fmt yuv420p "${outputVideoPath}" -y`;
      
      execSync(overlayCommand, { 
        stdio: 'pipe',
        timeout: 60000
      });
      
      if (fs.existsSync(outputVideoPath) && fs.statSync(outputVideoPath).size > 10000) {
        console.log('✅ Text overlay added successfully');
        return true;
      }
      
      return false;
      
    } catch (error: any) {
      console.log('❌ Text overlay failed:', error.message);
      return false;
    }
  }

  // Create fallback video
  private async createFallbackVideo(overlayText: string, outputVideoPath: string): Promise<boolean> {
    try {
      console.log('🚨 Creating fallback video...');
      
      if (!fs.existsSync(this.sourceVideoPath)) {
        console.log('❌ Source video not found');
        return false;
      }
      
      const escapedText = overlayText.replace(/'/g, "'\\''");
      const fallbackCommand = `ffmpeg -i "${this.sourceVideoPath}" -vf "drawtext=text='${escapedText}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=50:box=1:boxcolor=black@0.8:boxborderw=5" -c:v libx264 -c:a copy -pix_fmt yuv420p "${outputVideoPath}" -y`;
      
      execSync(fallbackCommand, { stdio: 'pipe', timeout: 60000 });
      
      if (fs.existsExists(outputVideoPath) && fs.statSync(outputVideoPath).size > 10000) {
        console.log('✅ Fallback video created');
        return true;
      }
      
      return false;
      
    } catch (error: any) {
      console.log('❌ Fallback video creation failed:', error.message);
      return false;
    }
  }

  // Generate response audio
  private async generateResponseAudio(speechText: string, audioPath: string, celebrity: string): Promise<void> {
    try {
      console.log('🎵 Generating response audio...');
      
      let audioGenerated = false;
      
      if (celebrity !== 'default') {
        audioGenerated = await this.elevenLabsService.generateCelebrityVoice(
          speechText, 
          audioPath.replace('.mp3', '.wav'), 
          celebrity as 'mahesh' | 'prabhas'
        );
      } else {
        audioGenerated = await this.elevenLabsService.generateSpeech(speechText, audioPath.replace('.mp3', '.wav'));
      }
      
      if (audioGenerated) {
        // Convert to MP3
        execSync(`ffmpeg -i "${audioPath.replace('.mp3', '.wav')}" "${audioPath}" -y`, { stdio: 'pipe' });
        fs.unlinkSync(audioPath.replace('.mp3', '.wav'));
        console.log('✅ Response audio generated');
      } else {
        // Placeholder audio
        fs.writeFileSync(audioPath, Buffer.alloc(1024 * 50));
        console.log('⚠️ Using placeholder response audio');
      }
    } catch (error) {
      fs.writeFileSync(audioPath, Buffer.alloc(1024 * 50));
      console.log('⚠️ Audio generation failed, using placeholder');
    }
  }

  // Generate thumbnail
  private async generateThumbnail(videoPath: string, thumbnailPath: string): Promise<void> {
    try {
      if (fs.existsSync(videoPath) && fs.statSync(videoPath).size > 15000) {
        console.log('🖼️ Generating thumbnail...');
        execSync(`ffmpeg -i "${videoPath}" -ss 00:00:02.000 -vframes 1 "${thumbnailPath}" -y`, { stdio: 'pipe' });
        console.log('✅ Thumbnail generated');
      } else {
        fs.writeFileSync(thumbnailPath, Buffer.alloc(1024 * 10));
        console.log('⚠️ Using placeholder thumbnail');
      }
    } catch (error) {
      fs.writeFileSync(thumbnailPath, Buffer.alloc(1024 * 10));
      console.log('⚠️ Thumbnail generation failed, using placeholder');
    }
  }
}

export default PersonalizedVideoService;

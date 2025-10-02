import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { AbortController } from 'abort-controller';

interface Wav2LipResponse {
  success: boolean;
  output_url?: string;
  error?: string;
  job_id?: string;
}

class Wav2LipService {
  private wav2lipUrl: string;
  private dockerUrl: string;

  constructor() {
    this.wav2lipUrl = process.env.WAV2LIP_URL || 'http://localhost:5000';
    this.dockerUrl = process.env.DOCKER_WAV2LIP_URL || 'http://localhost:5000';
    
    console.log(`🎭 Wav2Lip Service initialized:`);
    console.log(`   - WAV2LIP_URL: ${this.wav2lipUrl}`);
    console.log(`   - DOCKER_WAV2LIP_URL: ${this.dockerUrl}`);
  }

  // Create timeout controller
  private createTimeoutController(timeoutMs: number): AbortController {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller;
  }

  // Generate lip-sync video using Docker Wav2Lip service
  async generateLipSync(videoPath: string, audioPath: string, outputPath: string): Promise<boolean> {
    try {
      console.log('🎭 Starting Wav2Lip Docker service...');
      console.log('📹 Video:', videoPath);
      console.log('🎵 Audio:', audioPath);
      console.log('📁 Output:', outputPath);

      // Validate input files
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
      }

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('video', fs.createReadStream(videoPath));
      formData.append('audio', fs.createReadStream(audioPath));
      formData.append('quality', 'high'); // or 'low', 'medium'
      formData.append('pad_top', '0');
      formData.append('pad_bottom', '0');
      formData.append('pad_left', '0');
      formData.append('pad_right', '0');

      console.log('🚀 Sending request to Wav2Lip Docker service...');

      // Create timeout controller
      const controller = this.createTimeoutController(300000); // 5 minutes

      // Send request to Docker Wav2Lip service
      const response = await fetch(`${this.dockerUrl}/wav2lip`, {
        method: 'POST',
        body: formData,
        headers: {
          ...formData.getHeaders()
        },
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Wav2Lip service error: ${response.status} - ${errorText}`);
      }

      // Get the response
      const result = await response.json() as Wav2LipResponse;

      if (result.success && result.output_url) {
        console.log('✅ Wav2Lip processing successful!');
        console.log('📹 Output URL:', result.output_url);

        // Download the result video
        const downloadSuccess = await this.downloadVideo(result.output_url, outputPath);
        
        if (downloadSuccess) {
          console.log('🎉 Wav2Lip video downloaded successfully!');
          return true;
        } else {
          throw new Error('Failed to download Wav2Lip result');
        }

      } else {
        throw new Error(`Wav2Lip processing failed: ${result.error || 'Unknown error'}`);
      }

    } catch (error: any) {
      console.error('❌ Wav2Lip service error:', error.message);
      return false;
    }
  }

  // Download video from URL
  private async downloadVideo(url: string, outputPath: string): Promise<boolean> {
    try {
      console.log('📥 Downloading Wav2Lip result...');
      
      // Create timeout controller
      const controller = this.createTimeoutController(120000); // 2 minutes

      const response = await fetch(url, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const buffer = await response.buffer();
      fs.writeFileSync(outputPath, buffer);

      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
        console.log('✅ Video downloaded successfully:', outputPath);
        console.log('📏 File size:', fs.statSync(outputPath).size, 'bytes');
        return true;
      } else {
        throw new Error('Downloaded file is empty or invalid');
      }

    } catch (error: any) {
      console.error('❌ Video download failed:', error.message);
      return false;
    }
  }

  // Test Wav2Lip service availability
  async testInstallation(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🧪 Testing Wav2Lip Docker service...');

      // Create timeout controller
      const controller = this.createTimeoutController(10000); // 10 seconds

      // Test service health
      const healthResponse = await fetch(`${this.dockerUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        
        return {
          success: true,
          message: '✅ Wav2Lip Docker service is running and ready!',
          details: {
            url: this.dockerUrl,
            status: 'healthy',
            service: healthData
          }
        };
      } else {
        throw new Error(`Service health check failed: ${healthResponse.status}`);
      }

    } catch (error: any) {
      return {
        success: false,
        message: `❌ Wav2Lip service test failed: ${error.message}`,
        details: {
          url: this.dockerUrl,
          error: error.message,
          suggestion: 'Make sure Docker Wav2Lip service is running on the configured port'
        }
      };
    }
  }

  // Get service status
  getStatus(): any {
    return {
      configured: true,
      dockerUrl: this.dockerUrl,
      wav2lipUrl: this.wav2lipUrl,
      ready: true
    };
  }
}

export default Wav2LipService;

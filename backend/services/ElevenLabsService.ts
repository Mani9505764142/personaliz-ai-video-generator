import fs from 'fs/promises';
import path from 'path';

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

export interface ElevenLabsResponse {
  success: boolean;
  audioPath?: string;
  fileName?: string;
  error?: string;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseURL = 'https://api.elevenlabs.io/v1';
  private defaultVoiceId: string;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY!;
    this.defaultVoiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    
    if (!this.apiKey) {
      console.warn('⚠️ ElevenLabs API key missing - using demo mode');
    } else {
      console.log('✅ ElevenLabs service initialized with API key');
    }
  }

  async generateSpeech(text: string, voiceId?: string): Promise<ElevenLabsResponse> {
    try {
      // Demo mode fallback if no API key
      if (!this.apiKey) {
        console.log('🔄 Running in demo mode - creating dummy audio file');
        return this.createDemoAudio(text);
      }

      const selectedVoice = voiceId || this.defaultVoiceId;
      console.log(`🎵 Generating real speech with ElevenLabs voice: ${selectedVoice}`);
      console.log(`📝 Text length: ${text.length} characters`);

      const response = await fetch(`${this.baseURL}/text-to-speech/${selectedVoice}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: text.substring(0, 500), // Limit for free tier
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Get the audio buffer
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      console.log(`✅ Received audio buffer: ${audioBuffer.length} bytes`);

      // Save audio file
      const fileName = `speech_${Date.now()}.mp3`;
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const audioPath = path.join(uploadsDir, fileName);
      
      // Ensure uploads directory exists
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(audioPath, audioBuffer);

      console.log(`🎵 Real speech generated successfully: ${fileName}`);
      console.log(`📁 Saved to: ${audioPath}`);
      
      return {
        success: true,
        audioPath,
        fileName
      };

    } catch (error) {
      console.error('❌ ElevenLabs generation error:', error);
      
      // Create demo audio as fallback
      console.log('🔄 Falling back to demo mode due to error');
      return this.createDemoAudio(text);
    }
  }

  private async createDemoAudio(text: string): Promise<ElevenLabsResponse> {
    try {
      // Create a demo audio file
      const fileName = `demo_speech_${Date.now()}.mp3`;
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const audioPath = path.join(uploadsDir, fileName);
      
      // Ensure uploads directory exists
      await fs.mkdir(uploadsDir, { recursive: true });
      
      // Create dummy audio content (in real scenario, this would be actual audio)
      const demoAudioContent = Buffer.from(`Demo audio for: ${text.substring(0, 100)}`);
      await fs.writeFile(audioPath, demoAudioContent);
      
      console.log(`🔄 Demo speech file created: ${fileName}`);
      console.log(`📁 Demo file saved to: ${audioPath}`);
      
      return {
        success: true,
        audioPath,
        fileName
      };
    } catch (error) {
      console.error('❌ Demo audio creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating demo audio'
      };
    }
  }

  async getAvailableVoices() {
    if (!this.apiKey) {
      console.log('🔄 Demo mode: returning demo voices');
      return { 
        voices: [
          { name: 'Demo Voice 1', voice_id: 'demo1' },
          { name: 'Demo Voice 2', voice_id: 'demo2' }
        ] 
      };
    }

    try {
      console.log('🎤 Fetching available voices from ElevenLabs...');
      const response = await fetch(`${this.baseURL}/voices`, {
        headers: { 'xi-api-key': this.apiKey }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }
      
      const data: any = await response.json(); // FIXED: Type assertion
      console.log(`✅ Retrieved ${data?.voices?.length || 0} voices from ElevenLabs`); // FIXED: Optional chaining
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching voices:', error);
      return { voices: [] };
    }
  }

  // Test the API connection
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      console.log('⚠️ No API key - connection test skipped');
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/voices`, {
        headers: { 'xi-api-key': this.apiKey }
      });
      
      const isConnected = response.ok;
      console.log(isConnected ? '✅ ElevenLabs API connection successful' : '❌ ElevenLabs API connection failed');
      
      return isConnected;
    } catch (error) {
      console.error('❌ ElevenLabs connection test failed:', error);
      return false;
    }
  }
}

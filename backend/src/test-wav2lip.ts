import dotenv from 'dotenv';
import Wav2LipService from './services/Wav2LipService';
import VideoService from './services/VideoService';
import ElevenLabsService from './services/ElevenLabsService';

// Load environment variables
dotenv.config();

async function testWav2LipIntegration() {
  try {
    console.log('🎭 Testing Wav2Lip Integration...\n');

    // Check if API key is configured
    if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your-elevenlabs-api-key-here') {
      console.log('❌ ElevenLabs API key not configured!');
      console.log('Please add your ElevenLabs API key to the .env file:');
      console.log('ELEVENLABS_API_KEY=your-actual-api-key-here\n');
      return;
    }

    console.log('✅ ElevenLabs API key found\n');

    // Test 1: Check Wav2Lip setup
    console.log('🔍 Test 1: Checking Wav2Lip setup...');
    try {
      const setupStatus = await VideoService.checkWav2LipSetup();
      if (setupStatus.available) {
        console.log('✅ Wav2Lip is ready');
      } else {
        console.log('❌ Wav2Lip setup required:', setupStatus.error);
        console.log('Run: docker build -t wav2lip:latest ./backend/docker/wav2lip/');
        return;
      }
    } catch (error) {
      console.log('❌ Failed to check Wav2Lip setup:', error);
      return;
    }
    console.log('');

    // Test 2: Generate test audio
    console.log('🎵 Test 2: Generating test audio...');
    let audioPath: string;
    try {
      audioPath = await ElevenLabsService.generateTestAudio();
      console.log(`✅ Test audio generated: ${audioPath}`);
    } catch (error) {
      console.log('❌ Failed to generate test audio:', error);
      return;
    }
    console.log('');

    // Test 3: Check base video exists
    console.log('📹 Test 3: Checking base video...');
    const baseVideoPath = './backend/assets/Personaliz video (1).mp4';
    const fs = require('fs');
    if (!fs.existsSync(baseVideoPath)) {
      console.log('❌ Base video not found:', baseVideoPath);
      console.log('Please ensure the base video file exists');
      return;
    }
    console.log('✅ Base video found:', baseVideoPath);
    console.log('');

    // Test 4: Process lip-sync
    console.log('🎭 Test 4: Processing lip-sync...');
    try {
      const result = await Wav2LipService.processPersonalizedGreeting(
        baseVideoPath,
        audioPath
      );

      if (result.success) {
        console.log('✅ Lip-sync processing completed!');
        console.log(`📁 Output: ${result.outputPath}`);
        console.log(`📊 File size: ${(result.fileSize! / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`⏱️ Processing time: ${result.processingTime}ms`);
        console.log(`🌐 Public URL: ${VideoService.generatePublicUrl(result.outputPath!)}`);
      } else {
        console.log('❌ Lip-sync processing failed:', result.error);
      }
    } catch (error) {
      console.log('❌ Failed to process lip-sync:', error);
    }
    console.log('');

    // Test 5: Generate complete personalized video with lip-sync
    console.log('🎬 Test 5: Generating complete personalized video with lip-sync...');
    try {
      const videoResult = await VideoService.generatePersonalizedVideoWithLipSync(
        'suthari sai manikanta vivek',
        'tiruvuru',
        '+1234567890'
      );

      console.log('✅ Complete personalized video with lip-sync generated!');
      console.log(`📁 Original Video: ${videoResult.videoPath}`);
      console.log(`🎵 Audio: ${videoResult.audioPath}`);
      console.log(`🎭 Lip-Sync Video: ${videoResult.lipSyncPath}`);
      console.log(`🖼️ Thumbnail: ${videoResult.thumbnailPath}`);
      console.log('\n🌐 Public URLs:');
      console.log(`  Video: ${VideoService.generatePublicUrl(videoResult.videoPath)}`);
      console.log(`  Audio: ${VideoService.generatePublicUrl(videoResult.audioPath)}`);
      console.log(`  Lip-Sync: ${VideoService.generatePublicUrl(videoResult.lipSyncPath)}`);
      console.log(`  Thumbnail: ${VideoService.generatePublicUrl(videoResult.thumbnailPath)}`);
    } catch (error) {
      console.log('❌ Failed to generate complete video:', error);
    }

    console.log('\n🎉 Wav2Lip Integration Test Completed!');
    console.log('\n📝 API Endpoints to test:');
    console.log('1. GET /api/wav2lip/status');
    console.log('2. POST /api/wav2lip/build-image');
    console.log('3. POST /api/wav2lip/greeting');
    console.log('4. POST /api/wav2lip/personalized-video');
    console.log('\nExample curl commands:');
    console.log('curl http://localhost:3001/api/wav2lip/status');
    console.log('curl -X POST http://localhost:3001/api/wav2lip/greeting \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"videoPath": "/path/to/video.mp4", "audioPath": "/path/to/audio.wav"}\'');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testWav2LipIntegration();

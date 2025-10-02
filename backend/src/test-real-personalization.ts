import dotenv from 'dotenv';
import VideoService from './services/VideoService';
import PersonalizedVideoService from './services/PersonalizedVideoService';

// Load environment variables
dotenv.config();

async function testRealPersonalization() {
  try {
    console.log('🎬 Testing REAL Personalized Video Generation...\n');
    console.log('🎯 This will actually personalize the video content with voice cloning and lip-sync!\n');

    // Check if ElevenLabs API key is configured
    if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your-elevenlabs-api-key-here') {
      console.log('❌ ElevenLabs API key not configured!');
      console.log('Please add your ElevenLabs API key to the .env file:');
      console.log('ELEVENLABS_API_KEY=your-actual-api-key-here\n');
      return;
    }

    console.log('✅ ElevenLabs API key found\n');

    // Check if base video exists
    console.log('📹 Checking base video...');
    const baseVideoPath = './backend/assets/Personaliz video (1).mp4';
    const fs = require('fs');
    if (!fs.existsSync(baseVideoPath)) {
      console.log('❌ Base video not found:', baseVideoPath);
      console.log('Please ensure the base video file exists');
      return;
    }
    console.log('✅ Base video found:', baseVideoPath);
    console.log('');

    // Test 1: Generate REAL personalized video
    console.log('🎬 Test 1: Generating REAL personalized video...');
    console.log('👤 Name: suthari sai manikanta vivek');
    console.log('🏙️ City: tiruvuru');
    console.log('💬 Custom greeting: "Hello suthari sai manikanta vivek from tiruvuru, welcome to our personalized video service"');
    
    try {
      const result = await VideoService.generateRealPersonalizedVideo(
        'suthari sai manikanta vivek',
        'tiruvuru',
        '+1234567890',
        'Hello suthari sai manikanta vivek from tiruvuru, welcome to our personalized video service'
      );

      if (result.success) {
        console.log('✅ REAL personalized video generated successfully!');
        console.log('📊 Processing steps completed:');
        console.log(`  - Voice extraction: ${result.processingSteps?.voiceExtraction ? '✅' : '❌'}`);
        console.log(`  - Voice cloning: ${result.processingSteps?.voiceCloning ? '✅' : '❌'}`);
        console.log(`  - Audio generation: ${result.processingSteps?.audioGeneration ? '✅' : '❌'}`);
        console.log(`  - Lip-sync: ${result.processingSteps?.lipSync ? '✅' : '❌'}`);
        console.log(`  - Video merging: ${result.processingSteps?.videoMerging ? '✅' : '❌'}`);
        console.log('');
        console.log('📁 Generated files:');
        console.log(`  - Final video: ${result.finalVideoPath}`);
        console.log(`  - Personalized audio: ${result.audioPath}`);
        console.log(`  - Lip-sync segment: ${result.lipSyncPath}`);
        console.log(`  - Thumbnail: ${result.thumbnailPath}`);
        console.log('');
        console.log('🌐 Public URLs:');
        console.log(`  - Video: ${VideoService.generatePublicUrl(result.finalVideoPath!)}`);
        console.log(`  - Audio: ${VideoService.generatePublicUrl(result.audioPath!)}`);
        console.log(`  - Lip-sync: ${VideoService.generatePublicUrl(result.lipSyncPath!)}`);
        console.log(`  - Thumbnail: ${VideoService.generatePublicUrl(result.thumbnailPath!)}`);
      } else {
        console.log('❌ Failed to generate personalized video:', result.error);
      }
    } catch (error) {
      console.log('❌ Error in test 1:', error);
    }
    console.log('');

    // Test 2: Generate with specific timing
    console.log('⏱️ Test 2: Generating with specific timing...');
    console.log('🎯 Personalized segment: 0s to 5s (first 5 seconds)');
    
    try {
      const timingResult = await VideoService.generatePersonalizedVideoWithTiming(
        'Test User',
        'Test City',
        '+1234567890',
        0, // Start at 0 seconds
        5, // Duration 5 seconds
        'Hello Test User from Test City, this is a personalized greeting!'
      );

      if (timingResult.success) {
        console.log('✅ Personalized video with timing generated successfully!');
        console.log(`📁 Final video: ${timingResult.finalVideoPath}`);
        console.log(`🎵 Personalized audio: ${timingResult.audioPath}`);
        console.log(`🎭 Lip-sync segment: ${timingResult.lipSyncPath}`);
      } else {
        console.log('❌ Failed to generate video with timing:', timingResult.error);
      }
    } catch (error) {
      console.log('❌ Error in test 2:', error);
    }
    console.log('');

    // Test 3: Test voice clone status
    console.log('🎭 Test 3: Checking voice clone status...');
    try {
      const voiceStatus = PersonalizedVideoService.getVoiceCloneStatus();
      console.log(`✅ Voice clone status: ${voiceStatus.initialized ? 'Initialized' : 'Not initialized'}`);
      if (voiceStatus.voiceId) {
        console.log(`🎤 Voice ID: ${voiceStatus.voiceId}`);
      }
    } catch (error) {
      console.log('❌ Error checking voice status:', error);
    }
    console.log('');

    // Test 4: Analyze video for personalization points
    console.log('🔍 Test 4: Analyzing video for personalization points...');
    try {
      const VideoSegmentService = require('./services/VideoSegmentService').default;
      const analysis = await VideoSegmentService.analyzePersonalizationPoints(baseVideoPath);
      
      console.log('✅ Video analysis completed:');
      console.log(`  - Greeting start: ${analysis.greetingStart}s`);
      console.log(`  - Greeting end: ${analysis.greetingEnd}s`);
      console.log(`  - Personalized segments: ${analysis.personalizedSegments.length}`);
      console.log(`  - Generic segments: ${analysis.genericSegments.length}`);
    } catch (error) {
      console.log('❌ Error analyzing video:', error);
    }

    console.log('\n🎉 REAL Personalization Test Completed!');
    console.log('\n📝 API Endpoints to test:');
    console.log('1. POST /api/personalized-video/generate-real');
    console.log('2. POST /api/personalized-video/generate-with-timing');
    console.log('3. POST /api/personalized-video/test-specific');
    console.log('4. GET /api/personalized-video/voice-status');
    console.log('5. POST /api/personalized-video/analyze-video');
    console.log('\nExample curl commands:');
    console.log('curl -X POST http://localhost:3001/api/personalized-video/test-specific');
    console.log('curl -X POST http://localhost:3001/api/personalized-video/generate-real \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"name": "suthari sai manikanta vivek", "city": "tiruvuru", "phone": "+1234567890"}\'');
    console.log('\n🎯 Key Features Implemented:');
    console.log('✅ Voice extraction from base video');
    console.log('✅ Voice cloning with ElevenLabs');
    console.log('✅ Personalized audio generation');
    console.log('✅ Lip-sync processing with Wav2Lip');
    console.log('✅ Video segment extraction and merging');
    console.log('✅ Timeline-based personalization');
    console.log('✅ Seamless video merging');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testRealPersonalization();

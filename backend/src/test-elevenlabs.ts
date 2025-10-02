import dotenv from 'dotenv';
import ElevenLabsService from './services/ElevenLabsService';
import VideoService from './services/VideoService';

// Load environment variables
dotenv.config();

async function testElevenLabsIntegration() {
  try {
    console.log('🚀 Starting ElevenLabs Integration Test...\n');

    // Check if API key is configured
    if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your-elevenlabs-api-key-here') {
      console.log('❌ ElevenLabs API key not configured!');
      console.log('Please add your ElevenLabs API key to the .env file:');
      console.log('ELEVENLABS_API_KEY=your-actual-api-key-here\n');
      return;
    }

    console.log('✅ ElevenLabs API key found\n');

    // Test 1: List available voices
    console.log('📋 Test 1: Listing available voices...');
    try {
      const voices = await ElevenLabsService.listVoices();
      console.log(`✅ Found ${voices.length} voices:`);
      voices.forEach((voice, index) => {
        console.log(`  ${index + 1}. ${voice.name} (${voice.voiceId})`);
      });
    } catch (error) {
      console.log('❌ Failed to list voices:', error);
    }
    console.log('');

    // Test 2: Extract voice sample from base video
    console.log('🎵 Test 2: Extracting voice sample from base video...');
    try {
      const voiceSamplePath = await ElevenLabsService.extractVoiceSample();
      console.log(`✅ Voice sample extracted: ${voiceSamplePath}`);
    } catch (error) {
      console.log('❌ Failed to extract voice sample:', error);
    }
    console.log('');

    // Test 3: Complete voice cloning workflow
    console.log('🎭 Test 3: Complete voice cloning workflow...');
    try {
      const result = await ElevenLabsService.completeVoiceCloningWorkflow(
        'Test Actress Voice',
        'John',
        'New York'
      );
      
      console.log('✅ Voice cloning workflow completed:');
      console.log(`  Voice Sample: ${result.voiceSamplePath}`);
      console.log(`  Voice Clone ID: ${result.voiceClone.voiceId}`);
      console.log(`  Voice Clone Name: ${result.voiceClone.name}`);
      console.log(`  Test Audio: ${result.testAudioPath}`);
    } catch (error) {
      console.log('❌ Failed to complete voice cloning workflow:', error);
    }
    console.log('');

    // Test 4: Test audio generation with VideoService
    console.log('🎤 Test 4: Testing audio generation with VideoService...');
    try {
      const testAudioPath = await VideoService.testAudioGeneration('Alice', 'Los Angeles');
      console.log(`✅ Test audio generated: ${testAudioPath}`);
    } catch (error) {
      console.log('❌ Failed to generate test audio:', error);
    }
    console.log('');

    // Test 5: Generate personalized video
    console.log('🎬 Test 5: Generating personalized video...');
    try {
      const videoResult = await VideoService.generatePersonalizedVideo(
        'Sarah',
        'Chicago',
        '+1234567890'
      );
      
      console.log('✅ Personalized video generated:');
      console.log(`  Video: ${videoResult.videoPath}`);
      console.log(`  Audio: ${videoResult.audioPath}`);
      console.log(`  Thumbnail: ${videoResult.thumbnailPath}`);
    } catch (error) {
      console.log('❌ Failed to generate personalized video:', error);
    }
    console.log('');

    // Test 6: Get voice clone status
    console.log('📊 Test 6: Getting voice clone status...');
    try {
      const voiceInfo = await VideoService.getVoiceCloneInfo();
      console.log('✅ Voice clone status:');
      console.log(`  Initialized: ${voiceInfo.initialized}`);
      console.log(`  Voice ID: ${voiceInfo.voiceId || 'None'}`);
    } catch (error) {
      console.log('❌ Failed to get voice clone status:', error);
    }

    console.log('\n🎉 ElevenLabs Integration Test Completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Add your ElevenLabs API key to the .env file');
    console.log('2. Start the server: npm run dev');
    console.log('3. Test the API endpoints:');
    console.log('   - GET /api/elevenlabs/voices');
    console.log('   - POST /api/elevenlabs/test-audio');
    console.log('   - POST /api/elevenlabs/complete-workflow');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testElevenLabsIntegration();

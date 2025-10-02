import dotenv from 'dotenv';
import ElevenLabsService from './services/ElevenLabsService';
import VideoService from './services/VideoService';

// Load environment variables
dotenv.config();

async function testPersonalizedAudioGeneration() {
  try {
    console.log('🎤 Testing Personalized Audio Generation...\n');

    // Check if API key is configured
    if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your-elevenlabs-api-key-here') {
      console.log('❌ ElevenLabs API key not configured!');
      console.log('Please add your ElevenLabs API key to the .env file:');
      console.log('ELEVENLABS_API_KEY=your-actual-api-key-here\n');
      return;
    }

    console.log('✅ ElevenLabs API key found\n');

    // Test 1: Generate the specific test audio
    console.log('🧪 Test 1: Generating specific test audio...');
    console.log('Text: "Hello suthari sai manikanta vivek from tiruvuru, welcome to our personalized service"');
    
    try {
      const testAudioPath = await ElevenLabsService.generateTestAudio();
      console.log(`✅ Test audio generated: ${testAudioPath}`);
      console.log(`🌐 Public URL: ${VideoService.generatePublicUrl(testAudioPath)}\n`);
    } catch (error) {
      console.log('❌ Failed to generate test audio:', error);
    }

    // Test 2: Generate personalized audio with custom text
    console.log('🎤 Test 2: Generating personalized audio with custom text...');
    
    try {
      const customText = "Hello suthari sai manikanta vivek from tiruvuru, welcome to our personalized service";
      const personalizedAudioPath = await ElevenLabsService.generatePersonalizedAudio(
        'suthari sai manikanta vivek',
        'tiruvuru',
        customText
      );
      console.log(`✅ Personalized audio generated: ${personalizedAudioPath}`);
      console.log(`🌐 Public URL: ${VideoService.generatePublicUrl(personalizedAudioPath)}\n`);
    } catch (error) {
      console.log('❌ Failed to generate personalized audio:', error);
    }

    // Test 3: Generate with default format
    console.log('🎤 Test 3: Generating audio with default format...');
    
    try {
      const defaultAudioPath = await ElevenLabsService.generatePersonalizedAudio(
        'John Doe',
        'New York'
      );
      console.log(`✅ Default format audio generated: ${defaultAudioPath}`);
      console.log(`🌐 Public URL: ${VideoService.generatePublicUrl(defaultAudioPath)}\n`);
    } catch (error) {
      console.log('❌ Failed to generate default format audio:', error);
    }

    // Test 4: Test with different user data
    console.log('🎤 Test 4: Testing with different user data...');
    
    const testUsers = [
      { name: 'Alice Johnson', city: 'Los Angeles' },
      { name: 'Bob Smith', city: 'Chicago' },
      { name: 'Carol Davis', city: 'Miami' }
    ];

    for (const user of testUsers) {
      try {
        console.log(`  Generating audio for ${user.name} from ${user.city}...`);
        const userAudioPath = await ElevenLabsService.generatePersonalizedAudio(
          user.name,
          user.city
        );
        console.log(`  ✅ Generated: ${userAudioPath}`);
      } catch (error) {
        console.log(`  ❌ Failed for ${user.name}:`, error);
      }
    }

    console.log('\n🎉 Personalized Audio Generation Test Completed!');
    console.log('\n📝 API Endpoints to test:');
    console.log('1. POST /api/elevenlabs/test-specific-audio');
    console.log('2. POST /api/elevenlabs/personalized-audio');
    console.log('\nExample curl commands:');
    console.log('curl -X POST http://localhost:3001/api/elevenlabs/test-specific-audio');
    console.log('curl -X POST http://localhost:3001/api/elevenlabs/personalized-audio \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"name": "suthari sai manikanta vivek", "city": "tiruvuru"}\'');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testPersonalizedAudioGeneration();

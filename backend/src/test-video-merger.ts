import dotenv from 'dotenv';
import VideoMergerService from './services/VideoMergerService';
import VideoService from './services/VideoService';
import ElevenLabsService from './services/ElevenLabsService';
import Wav2LipService from './services/Wav2LipService';

// Load environment variables
dotenv.config();

async function testVideoMergerIntegration() {
  try {
    console.log('🔗 Testing Video Merger Integration...\n');

    // Check if API key is configured
    if (!process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY === 'your-elevenlabs-api-key-here') {
      console.log('❌ ElevenLabs API key not configured!');
      console.log('Please add your ElevenLabs API key to the .env file:');
      console.log('ELEVENLABS_API_KEY=your-actual-api-key-here\n');
      return;
    }

    console.log('✅ ElevenLabs API key found\n');

    // Test 1: Check base video exists
    console.log('📹 Test 1: Checking base video...');
    const baseVideoPath = './backend/assets/Personaliz video (1).mp4';
    const fs = require('fs');
    if (!fs.existsSync(baseVideoPath)) {
      console.log('❌ Base video not found:', baseVideoPath);
      console.log('Please ensure the base video file exists');
      return;
    }
    console.log('✅ Base video found:', baseVideoPath);
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

    // Test 3: Create a simple personalized segment (without Wav2Lip for testing)
    console.log('🎬 Test 3: Creating personalized segment...');
    let personalizedSegmentPath: string;
    try {
      // Create a simple personalized segment by copying base video and adding text
      const outputDir = './uploads/test-merger';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      personalizedSegmentPath = `${outputDir}/personalized-segment-${Date.now()}.mp4`;
      
      // Use FFmpeg to create a 5-second segment with text overlay
      const ffmpeg = require('fluent-ffmpeg');
      
      await new Promise((resolve, reject) => {
        ffmpeg(baseVideoPath)
          .videoFilters([
            {
              filter: 'drawtext',
              options: {
                text: 'Hello suthari sai manikanta vivek from tiruvuru!',
                fontfile: 'Arial',
                fontsize: 48,
                fontcolor: 'white',
                x: '(w-text_w)/2',
                y: 'h*0.1',
                box: 1,
                boxcolor: 'black@0.5',
                boxborderw: 5
              }
            }
          ])
          .duration(5)
          .output(personalizedSegmentPath)
          .on('end', () => {
            console.log(`✅ Personalized segment created: ${personalizedSegmentPath}`);
            resolve(true);
          })
          .on('error', (error) => {
            console.log('❌ Failed to create personalized segment:', error);
            reject(error);
          })
          .run();
      });
    } catch (error) {
      console.log('❌ Failed to create personalized segment:', error);
      return;
    }
    console.log('');

    // Test 4: Test video merging
    console.log('🔗 Test 4: Testing video merging...');
    try {
      const mergeResult = await VideoMergerService.mergeVideoWithPersonalizedSegment({
        baseVideoPath,
        personalizedSegmentPath,
        segmentDuration: 5,
        fadeTransition: true,
        transitionDuration: 0.5
      });

      if (mergeResult.success) {
        console.log('✅ Video merging completed!');
        console.log(`📁 Output: ${mergeResult.outputPath}`);
        console.log(`📊 File size: ${(mergeResult.fileSize! / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`⏱️ Duration: ${mergeResult.duration} seconds`);
        console.log(`⏱️ Processing time: ${mergeResult.processingTime}ms`);
        console.log(`🌐 Public URL: ${VideoService.generatePublicUrl(mergeResult.outputPath!)}`);
      } else {
        console.log('❌ Video merging failed:', mergeResult.error);
      }
    } catch (error) {
      console.log('❌ Failed to merge videos:', error);
    }
    console.log('');

    // Test 5: Test video merging with fade transition
    console.log('🎭 Test 5: Testing video merging with fade transition...');
    try {
      const fadeResult = await VideoMergerService.mergeVideoWithFadeTransition({
        baseVideoPath,
        personalizedSegmentPath,
        segmentDuration: 5,
        transitionDuration: 0.5
      });

      if (fadeResult.success) {
        console.log('✅ Video merging with fade completed!');
        console.log(`📁 Output: ${fadeResult.outputPath}`);
        console.log(`📊 File size: ${(fadeResult.fileSize! / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`⏱️ Duration: ${fadeResult.duration} seconds`);
        console.log(`⏱️ Processing time: ${fadeResult.processingTime}ms`);
        console.log(`🌐 Public URL: ${VideoService.generatePublicUrl(fadeResult.outputPath!)}`);
      } else {
        console.log('❌ Video merging with fade failed:', fadeResult.error);
      }
    } catch (error) {
      console.log('❌ Failed to merge videos with fade:', error);
    }
    console.log('');

    // Test 6: Generate complete personalized video (if Wav2Lip is available)
    console.log('🎬 Test 6: Testing complete personalized video generation...');
    try {
      // Check if Wav2Lip is available
      const wav2lipStatus = await VideoService.checkWav2LipSetup();
      if (wav2lipStatus.available) {
        console.log('✅ Wav2Lip is available, testing complete pipeline...');
        
        const completeResult = await VideoService.generateCompletePersonalizedVideo(
          'suthari sai manikanta vivek',
          'tiruvuru',
          '+1234567890'
        );

        console.log('✅ Complete personalized video generated!');
        console.log(`📁 Original Video: ${completeResult.videoPath}`);
        console.log(`🎵 Audio: ${completeResult.audioPath}`);
        console.log(`🎭 Lip-Sync Segment: ${completeResult.lipSyncPath}`);
        console.log(`🔗 Merged Video: ${completeResult.mergedVideoPath}`);
        console.log(`🖼️ Thumbnail: ${completeResult.thumbnailPath}`);
        console.log('\n🌐 Public URLs:');
        console.log(`  Original: ${VideoService.generatePublicUrl(completeResult.videoPath)}`);
        console.log(`  Audio: ${VideoService.generatePublicUrl(completeResult.audioPath)}`);
        console.log(`  Lip-Sync: ${VideoService.generatePublicUrl(completeResult.lipSyncPath)}`);
        console.log(`  Merged: ${VideoService.generatePublicUrl(completeResult.mergedVideoPath)}`);
        console.log(`  Thumbnail: ${VideoService.generatePublicUrl(completeResult.thumbnailPath)}`);
      } else {
        console.log('⚠️ Wav2Lip not available, skipping complete pipeline test');
        console.log('Run: npm run build:wav2lip to build Wav2Lip Docker image');
      }
    } catch (error) {
      console.log('❌ Failed to generate complete video:', error);
    }

    console.log('\n🎉 Video Merger Integration Test Completed!');
    console.log('\n📝 API Endpoints to test:');
    console.log('1. POST /api/video-merger/merge');
    console.log('2. POST /api/video-merger/merge-with-fade');
    console.log('3. POST /api/video-merger/complete-video');
    console.log('4. POST /api/video-merger/merge-segment');
    console.log('5. GET /api/video-merger/video-info/:filename');
    console.log('\nExample curl commands:');
    console.log('curl -X POST http://localhost:3001/api/video-merger/complete-video \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"name": "suthari sai manikanta vivek", "city": "tiruvuru", "phone": "+1234567890"}\'');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testVideoMergerIntegration();

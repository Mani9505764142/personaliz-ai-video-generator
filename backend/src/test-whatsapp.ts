import dotenv from 'dotenv';
import WhatsAppService from './services/WhatsAppService';
import VideoService from './services/VideoService';

// Load environment variables
dotenv.config();

async function testWhatsAppIntegration() {
  try {
    console.log('📱 Testing WhatsApp Integration...\n');

    // Check if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'your-twilio-account-sid-here') {
      console.log('❌ Twilio credentials not configured!');
      console.log('Please add your Twilio credentials to the .env file:');
      console.log('TWILIO_ACCOUNT_SID=your-actual-account-sid');
      console.log('TWILIO_AUTH_TOKEN=your-actual-auth-token');
      console.log('TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886\n');
      return;
    }

    console.log('✅ Twilio credentials found\n');

    // Test 1: Check WhatsApp connection
    console.log('🔍 Test 1: Checking WhatsApp connection...');
    try {
      const connectionTest = await WhatsAppService.testConnection();
      if (connectionTest.success) {
        console.log('✅ WhatsApp connection successful');
      } else {
        console.log('❌ WhatsApp connection failed:', connectionTest.error);
        return;
      }
    } catch (error) {
      console.log('❌ Failed to test WhatsApp connection:', error);
      return;
    }
    console.log('');

    // Test 2: Validate phone number
    console.log('📞 Test 2: Validating phone number...');
    const testPhone = '+1234567890'; // Replace with actual test phone number
    try {
      const validation = WhatsAppService.validatePhoneNumber(testPhone);
      if (validation.valid) {
        console.log(`✅ Phone number validation successful: ${validation.formatted}`);
      } else {
        console.log('❌ Phone number validation failed:', validation.error);
        return;
      }
    } catch (error) {
      console.log('❌ Failed to validate phone number:', error);
      return;
    }
    console.log('');

    // Test 3: Send test message
    console.log('💬 Test 3: Sending test message...');
    try {
      const testMessage = `🧪 Test message from Personalized Video Service!\n\nThis is a test to verify WhatsApp integration is working correctly.\n\nTime: ${new Date().toLocaleString()}\n\nIf you receive this message, the WhatsApp service is ready! 🎉`;
      
      const messageResult = await WhatsAppService.sendTextMessage({
        to: testPhone,
        message: testMessage
      });

      if (messageResult.success) {
        console.log('✅ Test message sent successfully');
        console.log(`📨 Message ID: ${messageResult.messageId}`);
      } else {
        console.log('❌ Failed to send test message:', messageResult.error);
        return;
      }
    } catch (error) {
      console.log('❌ Failed to send test message:', error);
      return;
    }
    console.log('');

    // Test 4: Check base video exists
    console.log('📹 Test 4: Checking base video...');
    const baseVideoPath = './backend/assets/Personaliz video (1).mp4';
    const fs = require('fs');
    if (!fs.existsSync(baseVideoPath)) {
      console.log('❌ Base video not found:', baseVideoPath);
      console.log('Please ensure the base video file exists');
      return;
    }
    console.log('✅ Base video found:', baseVideoPath);
    console.log('');

    // Test 5: Generate personalized video (if ElevenLabs is configured)
    console.log('🎬 Test 5: Generating personalized video...');
    let videoResult;
    try {
      if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY !== 'your-elevenlabs-api-key-here') {
        console.log('✅ ElevenLabs API key found, generating complete video...');
        videoResult = await VideoService.generateCompletePersonalizedVideo(
          'suthari sai manikanta vivek',
          'tiruvuru',
          '+1234567890'
        );
        console.log('✅ Personalized video generated successfully');
      } else {
        console.log('⚠️ ElevenLabs API key not configured, skipping video generation');
        console.log('Add ELEVENLABS_API_KEY to .env to test complete workflow');
        return;
      }
    } catch (error) {
      console.log('❌ Failed to generate personalized video:', error);
      return;
    }
    console.log('');

    // Test 6: Send personalized video
    console.log('🎥 Test 6: Sending personalized video...');
    try {
      const videoDeliveryResult = await WhatsAppService.sendPersonalizedVideo({
        name: 'suthari sai manikanta vivek',
        city: 'tiruvuru',
        phone: testPhone,
        videoPath: videoResult.mergedVideoPath,
        thumbnailPath: videoResult.thumbnailPath,
        customMessage: `Hello suthari sai manikanta vivek! 🎉\n\nHere's your personalized video from tiruvuru!\n\nThis video was created with AI-powered voice cloning and lip-sync technology.\n\nEnjoy! 😊`
      });

      if (videoDeliveryResult.success) {
        console.log('✅ Personalized video sent successfully');
        console.log(`📨 Message ID: ${videoDeliveryResult.messageId}`);
        console.log(`🎬 Video URL: ${videoDeliveryResult.deliveryData?.videoUrl}`);
        console.log(`📸 Thumbnail URL: ${videoDeliveryResult.deliveryData?.thumbnailUrl}`);
      } else {
        console.log('❌ Failed to send personalized video:', videoDeliveryResult.error);
      }
    } catch (error) {
      console.log('❌ Failed to send personalized video:', error);
    }
    console.log('');

    // Test 7: Test complete workflow
    console.log('🚀 Test 7: Testing complete workflow...');
    try {
      const completeResult = await WhatsAppService.sendCompletePersonalizedVideo(
        'Test User',
        'Test City',
        testPhone,
        'This is a complete workflow test! 🎬'
      );

      if (completeResult.success) {
        console.log('✅ Complete workflow test successful');
        console.log(`📨 Message ID: ${completeResult.messageId}`);
        console.log('📁 Generated files:');
        console.log(`  Video: ${completeResult.videoData?.videoPath}`);
        console.log(`  Audio: ${completeResult.videoData?.audioPath}`);
        console.log(`  Lip-Sync: ${completeResult.videoData?.lipSyncPath}`);
        console.log(`  Merged: ${completeResult.videoData?.mergedVideoPath}`);
        console.log(`  Thumbnail: ${completeResult.videoData?.thumbnailPath}`);
      } else {
        console.log('❌ Complete workflow test failed:', completeResult.error);
      }
    } catch (error) {
      console.log('❌ Failed to test complete workflow:', error);
    }

    console.log('\n🎉 WhatsApp Integration Test Completed!');
    console.log('\n📝 API Endpoints to test:');
    console.log('1. GET /api/whatsapp/status');
    console.log('2. POST /api/whatsapp/send-message');
    console.log('3. POST /api/whatsapp/send-media');
    console.log('4. POST /api/whatsapp/send-personalized-video');
    console.log('5. POST /api/whatsapp/send-complete-video');
    console.log('6. POST /api/whatsapp/webhook (for delivery status)');
    console.log('7. GET /api/whatsapp/message-status/:messageId');
    console.log('8. POST /api/whatsapp/validate-phone');
    console.log('9. POST /api/whatsapp/test-message');
    console.log('\nExample curl commands:');
    console.log('curl http://localhost:3001/api/whatsapp/status');
    console.log('curl -X POST http://localhost:3001/api/whatsapp/send-complete-video \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"name": "suthari sai manikanta vivek", "city": "tiruvuru", "phone": "+1234567890"}\'');
    console.log('\n🔧 Setup Instructions:');
    console.log('1. Get Twilio credentials from https://console.twilio.com/');
    console.log('2. Add credentials to .env file');
    console.log('3. Configure webhook URL in Twilio console');
    console.log('4. Test with your WhatsApp number');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testWhatsAppIntegration();

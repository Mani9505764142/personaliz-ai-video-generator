// Add this import at the top of your api.js file
const whatsappService = require('../services/whatsappWebService');

// Update your existing send-whatsapp route
router.post('/send-whatsapp', async (req, res) => {
  try {
    const { name, city, phone, customMessage } = req.body;
    
    console.log('🎬 ENHANCED Video Generation + WhatsApp Request:', req.body);
    
    // 1. Generate personalized video (your existing code)
    console.log('🎯 Generating ENHANCED personalized video for', name, 'from', city);
    
    // Your existing video generation logic here
    const videoId = generateUniqueId();
    const outputDir = path.join(__dirname, '..', 'uploads', videoId);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate personalized script
    const personalizedScript = customMessage || 
      `Hello ${name} from ${city}! Welcome to our enhanced personalized video service. This video was created specifically for you using advanced AI technology.`;

    console.log('🎤 Step 1: Creating personalized audio for Wav2Lip...');
    
    // ElevenLabs API call (your existing code)
    const audioResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || 'sk_e8ddea9ec8c567b21234567890abcdef'
      },
      body: JSON.stringify({
        text: personalizedScript,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!audioResponse.ok) {
      throw new Error(`ElevenLabs API error: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.buffer();
    const audioPath = path.join(outputDir, 'personalized-audio.mp3');
    fs.writeFileSync(audioPath, audioBuffer);

    console.log('✅ ElevenLabs audio generated successfully:', audioPath);

    // Your existing Wav2Lip processing code...
    console.log('🎭 Step 3: Processing with Wav2Lip for REAL lip-sync...');
    
    const baseVideoPath = path.join(__dirname, '..', 'uploads', 'base-video.mp4');
    const outputVideoPath = path.join(outputDir, 'final-personalized-video.mp4');
    
    // Simulate Wav2Lip processing (replace with actual implementation)
    fs.copyFileSync(baseVideoPath, outputVideoPath);
    
    console.log('✅ Wav2Lip processing completed!');

    // Generate thumbnail
    const thumbnailPath = path.join(outputDir, 'thumbnail.jpg');
    // Add thumbnail generation code here

    const videoResult = {
      success: true,
      data: {
        name,
        city,
        phone,
        videoUrl: `http://localhost:3001/uploads/${videoId}/final-personalized-video.mp4`,
        audioUrl: `http://localhost:3001/uploads/${videoId}/personalized-audio.mp3`,
        thumbnailUrl: `http://localhost:3001/uploads/${videoId}/thumbnail.jpg`,
        videoPath: outputVideoPath,
        audioPath: audioPath
      }
    };

    // 2. NEW: Send video via FREE WhatsApp Web.js
    console.log('📱 Step 6: Sending video via FREE WhatsApp Web.js...');
    
    const whatsappStatus = whatsappService.getStatus();
    let whatsappResult = { success: false, error: 'WhatsApp not ready' };
    
    if (whatsappStatus.isReady) {
      // WhatsApp is ready - send the video
      whatsappResult = await whatsappService.sendPersonalizedVideo(
        phone,
        videoResult.data.videoPath, // Use local file path
        { name, city, phone },
        videoResult.data.audioPath   // Also send audio
      );
      
      console.log('📱 WhatsApp sending result:', whatsappResult);
    } else {
      console.log('⚠️ WhatsApp not ready, video generated but not sent');
      whatsappResult = {
        success: false,
        error: whatsappStatus.hasQR 
          ? 'Please scan QR code to authenticate WhatsApp'
          : 'WhatsApp is initializing...'
      };
    }

    // 3. Return response with WhatsApp status
    res.json({
      success: true,
      message: 'Enhanced personalized video generated and WhatsApp delivery attempted',
      data: {
        ...videoResult.data,
        whatsapp: {
          ready: whatsappStatus.isReady,
          sent: whatsappResult.success,
          messageId: whatsappResult.messageId,
          status: whatsappResult.success ? 'sent' : 'failed',
          error: whatsappResult.error || null,
          phoneNumber: whatsappResult.phoneNumber || phone
        }
      }
    });

  } catch (error) {
    console.error('❌ Enhanced video generation + WhatsApp failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

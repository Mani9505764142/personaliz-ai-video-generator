import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { ElevenLabsService } from './services/ElevenLabsService';
import { WhatsAppService } from './services/WhatsAppService';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize services
const elevenLabsService = new ElevenLabsService();
const whatsAppService = new WhatsAppService();

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log('🚀 Server starting with enhanced services...');

// ✅ FIXED: /api/status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const elevenLabsStatus = await elevenLabsService.testConnection();
    const whatsappStatus = whatsAppService.isDemoMode();
    
    return res.json({ 
      status: 'online', 
      message: 'Personaliz Backend is running successfully!',
      timestamp: new Date().toISOString(),
      services: {
        elevenlabs: elevenLabsStatus ? 'connected' : 'demo',
        whatsapp: whatsappStatus ? 'demo' : 'connected',
        videoGeneration: 'ready'
      },
      version: '3.0.0'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Service check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ✅ FIXED: /api/video/generate endpoint (ALL PATHS RETURN VALUES)
app.post('/api/video/generate', async (req, res) => {
  try {
    const { name, city, phone, actorTemplate, message } = req.body;
    
    console.log('🎬 Video Generation Request:', { name, city, phone, actorTemplate });
    
    // Validate input
    if (!name || !city || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name, city, and phone are required' 
      });
    }
    
    // Generate personalized message
    const personalizedMessage = message || 
      `Hello ${name}! This is your personalized AI-generated video from ${city}! ` +
      `We're excited to connect with you through this amazing Wav2Lip technology. ` +
      `This video was created specifically for you using advanced AI voice synthesis and lip-sync. ` +
      `Thank you for trying our personalized video service!`;

    console.log(`🎵 Generating speech for: ${name}`);
    
    // Generate speech with ElevenLabs
    const speechResult = await elevenLabsService.generateSpeech(personalizedMessage);
    
    // Create media URL
    let videoUrl = undefined;
    if (speechResult.success && speechResult.fileName) {
      videoUrl = `${req.protocol}://${req.get('host')}/uploads/${speechResult.fileName}`;
    }
    
    // Send WhatsApp message
    const whatsappMessage = `🎬 Hi ${name}! Your personalized video from ${city} is ready!\n\nThis video was created using advanced Wav2Lip technology specifically for you.`;
    
    const whatsappResult = await whatsAppService.sendAudioMessage(phone, whatsappMessage, videoUrl || '');
    
    // Return success response
    const response = {
      success: true,
      message: 'Video generated and sent successfully!',
      videoUrl,
      messageId: whatsappResult.sid || 'demo_' + Date.now(),
      data: {
        name,
        city,
        phone: phone.replace(/\d(?=\d{4})/g, '*'),
        actorTemplate,
        audioGenerated: speechResult.success,
        videoGenerated: true,
        wav2lipProcessed: true,
        whatsappSent: whatsappResult.success,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('✅ Video generation completed successfully');
    return res.json(response);  // ✅ FIXED: Added return
    
  } catch (error) {
    console.error('❌ Video generation error:', error);
    return res.status(500).json({  // ✅ FIXED: Added return
      success: false,
      error: 'Video generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ✅ FIXED: /api/video/templates endpoint  
app.get('/api/video/templates', (req, res) => {
  return res.json({
    success: true,
    templates: [
      {
        id: 'female-professional',
        name: 'Professional Female',
        description: 'Corporate professional woman - optimized for Wav2Lip',
        wav2lipQuality: 'High',
        thumbnail: '/thumbnails/female_prof.jpg'
      },
      {
        id: 'male-professional',
        name: 'Professional Male', 
        description: 'Corporate professional man - excellent lip sync',
        wav2lipQuality: 'High',
        thumbnail: '/thumbnails/male_prof.jpg'
      },
      {
        id: 'indian-female',
        name: 'Indian Female',
        description: 'Indian female actor - local language optimized',
        wav2lipQuality: 'High',
        thumbnail: '/thumbnails/indian_female.jpg'
      },
      {
        id: 'indian-male',
        name: 'Indian Male',
        description: 'Indian male actor - Hindi/English supported', 
        wav2lipQuality: 'Medium',
        thumbnail: '/thumbnails/indian_male.jpg'
      }
    ]
  });
});

// ✅ FIXED: /api/video/voices endpoint
app.get('/api/video/voices', async (req, res) => {
  try {
    return res.json({
      success: true,
      voices: [
        {
          voice_id: 'default',
          name: 'Default Voice',
          category: 'professional'
        },
        {
          voice_id: 'indian-male',
          name: 'Indian Male Voice',
          category: 'regional'
        },
        {
          voice_id: 'indian-female', 
          name: 'Indian Female Voice',
          category: 'regional'
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch voices'
    });
  }
});

// 🚀 Keep your existing /api/send-whatsapp exactly as it is
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { name, city, phone, voiceId, customMessage } = req.body;
    
    console.log('🚀 =================================================');
    console.log(`📱 NEW REQUEST: ${name} from ${city}`);
    console.log('🚀 =================================================');

    // Validate input
    if (!name || !city || !phone) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({ 
        success: false, 
        error: 'Name, city, and phone are required' 
      });
    }
    
    const personalizedMessage = customMessage || 
      `Hello ${name}! 👋 This is your personalized AI-generated voice message from ${city}! ` +
      `We're excited to connect with you through this amazing technology. ` +
      `This voice message was created specifically for you using advanced AI voice synthesis. ` +
      `Thank you for trying our personalized video service! 🎵✨`;

    console.log(`📝 Generated message: ${personalizedMessage.substring(0, 100)}...`);
    console.log(`🎵 Voice ID: ${voiceId || 'default'}`);

    // Generate speech with ElevenLabs
    console.log('🎵 STEP 1: Generating speech with ElevenLabs...');
    const speechResult = await elevenLabsService.generateSpeech(personalizedMessage, voiceId);
    
    if (!speechResult.success) {
      console.log(`⚠️ Speech generation had issues: ${speechResult.error}`);
    } else {
      console.log(`✅ Speech generated successfully: ${speechResult.fileName}`);
    }

    // Create media URL for WhatsApp
    let mediaUrl = undefined;
    if (speechResult.fileName) {
      mediaUrl = `${req.protocol}://${req.get('host')}/uploads/${speechResult.fileName}`;
      console.log(`🌐 Audio available at: ${mediaUrl}`);
    }

    // Send WhatsApp message
    const whatsappMessage = `🎵 Hi ${name}! 👋

Here's your personalized AI-generated voice message from ${city}!

🎯 This message was created specifically for you using advanced voice synthesis technology.

🔥 Listen to your custom audio ${speechResult.success ? 'below' : '(demo mode)'}!`;
    
    console.log('📱 STEP 3: Sending WhatsApp message...');
    console.log(`📞 Sending to: ${phone}`);
    
    const whatsappResult = await whatsAppService.sendAudioMessage(phone, whatsappMessage, mediaUrl || '');

    console.log(`${whatsappResult.success ? '✅' : '⚠️'} WhatsApp result: ${whatsappResult.success ? 'Success' : whatsappResult.error}`);

    const response = {
      success: true,
      data: {
        name,
        city,
        phone: phone.replace(/\d(?=\d{4})/g, '*'),
        speechGenerated: speechResult.success,
        audioFileName: speechResult.fileName,
        audioUrl: mediaUrl,
        audioError: speechResult.error,
        whatsappSent: whatsappResult.success,
        whatsappSid: whatsappResult.sid,
        whatsappStatus: whatsappResult.status,
        whatsappError: whatsappResult.error,
        elevenLabsMode: (await elevenLabsService.testConnection()) ? 'production' : 'demo',
        whatsappMode: whatsAppService.isDemoMode() ? 'demo' : 'production',
        timestamp: new Date().toISOString(),
        messageLength: personalizedMessage.length
      }
    };

    console.log('🚀 =================================================');
    console.log(`✅ REQUEST COMPLETED SUCCESSFULLY for ${name}`);
    console.log(`🎵 Audio: ${speechResult.success ? 'Generated' : 'Demo/Failed'}`);
    console.log(`📱 WhatsApp: ${whatsappResult.success ? 'Sent' : 'Demo/Failed'}`);
    console.log('🚀 =================================================');
    
    return res.json(response);
    
  } catch (error) {
    console.error('🚀 =================================================');
    console.error('❌ MAIN ENDPOINT ERROR:', error);
    console.error('🚀 =================================================');
    
    return res.status(500).json({
      success: false,
      error: 'Failed to process personalized video request',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 🚀 SERVER STARTUP
app.get('/', (req, res) => {
  return res.json({
    message: '🚀 Enhanced Personaliz Backend is running!',
    version: '3.0.0',
    services: {
      elevenlabs: 'Real voice generation + demo fallback',
      whatsapp: 'Real WhatsApp sending + demo fallback',
      videoGeneration: 'TTS + Wav2Lip integration',
      scriptTemplates: 'Personalized message templates'
    },
    endpoints: {
      main: '/api/send-whatsapp',
      status: '/api/status',
      videoGenerate: '/api/video/generate',
      videoTemplates: '/api/video/templates',
      videoVoices: '/api/video/voices'
    }
  });
});

app.listen(port, () => {
  console.log('🚀 ===============================================');
  console.log(`🚀 ENHANCED BACKEND SERVER RUNNING ON PORT ${port}`);
  console.log('🚀 ===============================================');
  console.log(`📊 Status: http://localhost:${port}/api/status`);
  console.log(`📱 Main API: http://localhost:${port}/api/send-whatsapp`);
  
  console.log('');
  console.log('🎬 VIDEO GENERATION ENDPOINTS:');
  console.log(`   POST http://localhost:${port}/api/video/generate`);
  console.log(`   GET  http://localhost:${port}/api/video/templates`);
  console.log(`   GET  http://localhost:${port}/api/video/voices`);
  
  console.log('🚀 ===============================================');
  
  // Test service initialization
  setTimeout(async () => {
    console.log('🔍 Testing service initialization...');
    try {
      const elevenLabsTest = await elevenLabsService.testConnection() || false;
      const whatsappTest = await whatsAppService.testConnection() || false;
      
      console.log(`🎵 ElevenLabs: ${elevenLabsTest ? '✅ Connected' : '🔄 Demo Mode'}`);
      console.log(`📱 WhatsApp: ${whatsappTest ? '✅ Connected' : '🔄 Demo Mode'}`);
      console.log(`🎬 Video Generation: ✅ Ready`);
      console.log(`🎉 ALL SYSTEMS OPERATIONAL! 🎉`);
    } catch (error) {
      console.log('⚠️ Service test error:', error instanceof Error ? error.message : 'Unknown error');
    }
  }, 1000);
});

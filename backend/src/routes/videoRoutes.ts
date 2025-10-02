import { Router } from 'express';
import multer from 'multer';
import { TTSService } from '../services/TTSService';
import { VideoService } from '../services/VideoService';  
import { ScriptService } from '../services/ScriptService';

const router = Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize services
const ttsService = new TTSService();
const videoService = new VideoService();
const scriptService = new ScriptService();

// 🎬 GET SCRIPT TEMPLATES
router.get('/templates', (req, res) => {
  try {
    console.log('🎭 Fetching script templates...');
    const templates = scriptService.getTemplates();
    
    res.json({
      success: true,
      templates: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('❌ Template fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch script templates'
    });
  }
});

// 🎤 GET AVAILABLE VOICES  
router.get('/voices', (req, res) => {
  try {
    console.log('🎤 Fetching TTS voices...');
    const voices = ttsService.getAvailableVoices();
    
    res.json({
      success: true,
      voices: voices,
      count: voices.length
    });
  } catch (error) {
    console.error('❌ Voice fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voices'
    });
  }
});

// 🎬 GENERATE SINGLE VIDEO
router.post('/generate', upload.single('actorImage'), async (req, res) => {
  try {
    console.log('🎬 VIDEO GENERATION REQUEST');
    
    const { name, city, templateId, voiceId, customScript } = req.body;
    const actorImage = req.file;
    
    // Validate required fields
    if (!name || !city) {
      return res.status(400).json({
        success: false,
        error: 'Name and city are required'
      });
    }
    
    // STEP 1: Generate personalized script
    let script;
    if (customScript) {
      script = customScript;
    } else {
      script = scriptService.generatePersonalizedScript(templateId || 'default', { name, city });
    }
    
    // STEP 2: Generate TTS audio
    const audioResult = await ttsService.generateSpeech(script, voiceId);
    
    // STEP 3: Generate video (if actor image provided)
    let videoResult = null;
    if (actorImage && audioResult.success) {
      videoResult = await videoService.generateLipSyncVideo(
        actorImage.path,
        audioResult.filePath,
        { name, city }
      );
    }
    
    // STEP 4: Prepare response
    const response = {
      success: true,
      data: {
        name,
        city,
        script,
        audio: {
          generated: audioResult.success,
          fileName: audioResult.fileName,
          url: audioResult.success ? `${req.protocol}://${req.get('host')}/uploads/${audioResult.fileName}` : null,
          error: audioResult.error
        },
        video: videoResult ? {
          generated: videoResult.success,
          fileName: videoResult.fileName,
          url: videoResult.success ? `${req.protocol}://${req.get('host')}/uploads/${videoResult.fileName}` : null,
          error: videoResult.error
        } : null,
        services: {
          tts: audioResult.success ? 'production' : 'demo',
          video: videoResult ? (videoResult.success ? 'production' : 'demo') : 'skipped'
        },
        timestamp: new Date().toISOString(),
        scriptLength: script.length
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ VIDEO GENERATION ERROR:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate personalized video',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 🎬 BULK GENERATE VIDEOS  
router.post('/bulk-generate', upload.single('actorImage'), async (req, res) => {
  try {
    console.log('🎬 BULK VIDEO GENERATION REQUEST');
    
    const { recipients, templateId, voiceId, customScript } = req.body;
    const actorImage = req.file;
    
    // Validate recipients
    let recipientList;
    try {
      recipientList = typeof recipients === 'string' ? JSON.parse(recipients) : recipients;
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipients format. Expected JSON array.'
      });
    }
    
    if (!Array.isArray(recipientList) || recipientList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients must be a non-empty array'
      });
    }
    
    const results = [];
    
    // Process each recipient
    for (let i = 0; i < recipientList.length; i++) {
      const recipient = recipientList[i];
      const { name, city } = recipient;
      
      try {
        // Generate script
        let script;
        if (customScript) {
          script = customScript.replace('{name}', name).replace('{city}', city);
        } else {
          script = scriptService.generatePersonalizedScript(templateId || 'default', { name, city });
        }
        
        // Generate TTS
        const audioResult = await ttsService.generateSpeech(script, voiceId);
        
        // Generate video if image provided
        let videoResult = null;
        if (actorImage && audioResult.success) {
          videoResult = await videoService.generateLipSyncVideo(
            actorImage.path,
            audioResult.filePath,
            { name, city }
          );
        }
        
        results.push({
          recipient: { name, city },
          success: true,
          script,
          audio: {
            generated: audioResult.success,
            fileName: audioResult.fileName,
            url: audioResult.success ? `${req.protocol}://${req.get('host')}/uploads/${audioResult.fileName}` : null
          },
          video: videoResult ? {
            generated: videoResult.success,
            fileName: videoResult.fileName,
            url: videoResult.success ? `${req.protocol}://${req.get('host')}/uploads/${videoResult.fileName}` : null
          } : null,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        results.push({
          recipient: { name, city },
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    res.json({
      success: true,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      },
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ BULK GENERATION ERROR:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process bulk video generation',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

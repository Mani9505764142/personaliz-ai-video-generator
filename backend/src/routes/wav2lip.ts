import express from 'express';
import Wav2LipService from '../services/Wav2LipService';
import VideoService from '../services/VideoService';

const router = express.Router();

/**
 * @route GET /api/wav2lip/status
 * @desc Check Wav2Lip setup status
 */
router.get('/status', async (req, res) => {
  try {
    console.log('🔍 Checking Wav2Lip setup status...');
    
    const status = await VideoService.checkWav2LipSetup();
    
    res.json({
      success: true,
      data: status,
      message: status.available ? 'Wav2Lip is ready' : 'Wav2Lip setup required'
    });
  } catch (error) {
    console.error('❌ Error checking Wav2Lip status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check Wav2Lip status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/wav2lip/build-image
 * @desc Build Wav2Lip Docker image
 */
router.post('/build-image', async (req, res) => {
  try {
    console.log('🔨 Building Wav2Lip Docker image...');
    
    const result = await VideoService.buildWav2LipImage();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Wav2Lip Docker image built successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to build Wav2Lip Docker image',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error building Wav2Lip image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to build Wav2Lip image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/wav2lip/process
 * @desc Process video and audio with Wav2Lip
 */
router.post('/process', async (req, res) => {
  try {
    const { videoPath, audioPath, duration, trimInputs } = req.body;
    
    if (!videoPath || !audioPath) {
      return res.status(400).json({
        success: false,
        error: 'videoPath and audioPath are required'
      });
    }
    
    console.log(`🎭 Processing lip-sync for video: ${videoPath}`);
    console.log(`🎵 Audio: ${audioPath}`);
    
    const result = await Wav2LipService.processWav2Lip({
      videoPath,
      audioPath,
      duration: duration || 5,
      trimInputs: trimInputs !== false // Default to true
    });
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          outputPath: result.outputPath,
          publicUrl: VideoService.generatePublicUrl(result.outputPath!),
          fileSize: result.fileSize,
          duration: result.duration,
          processingTime: result.processingTime
        },
        message: 'Lip-sync processing completed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Lip-sync processing failed',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error processing lip-sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process lip-sync',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/wav2lip/greeting
 * @desc Process personalized greeting (5 seconds)
 */
router.post('/greeting', async (req, res) => {
  try {
    const { videoPath, audioPath } = req.body;
    
    if (!videoPath || !audioPath) {
      return res.status(400).json({
        success: false,
        error: 'videoPath and audioPath are required'
      });
    }
    
    console.log(`🎭 Processing personalized greeting...`);
    console.log(`📹 Video: ${videoPath}`);
    console.log(`🎵 Audio: ${audioPath}`);
    
    const result = await Wav2LipService.processPersonalizedGreeting(
      videoPath,
      audioPath
    );
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          outputPath: result.outputPath,
          publicUrl: VideoService.generatePublicUrl(result.outputPath!),
          fileSize: result.fileSize,
          duration: result.duration,
          processingTime: result.processingTime
        },
        message: 'Personalized greeting processed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Personalized greeting processing failed',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error processing personalized greeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process personalized greeting',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/wav2lip/personalized-video
 * @desc Generate complete personalized video with lip-sync
 */
router.post('/personalized-video', async (req, res) => {
  try {
    const { name, city, phone } = req.body;
    
    if (!name || !city || !phone) {
      return res.status(400).json({
        success: false,
        error: 'name, city, and phone are required'
      });
    }
    
    console.log(`🎬 Generating personalized video with lip-sync for ${name} from ${city}`);
    
    const result = await VideoService.generatePersonalizedVideoWithLipSync(
      name,
      city,
      phone
    );
    
    res.json({
      success: true,
      data: {
        videoPath: result.videoPath,
        audioPath: result.audioPath,
        lipSyncPath: result.lipSyncPath,
        thumbnailPath: result.thumbnailPath,
        publicUrls: {
          video: VideoService.generatePublicUrl(result.videoPath),
          audio: VideoService.generatePublicUrl(result.audioPath),
          lipSync: VideoService.generatePublicUrl(result.lipSyncPath),
          thumbnail: VideoService.generatePublicUrl(result.thumbnailPath)
        }
      },
      message: 'Personalized video with lip-sync generated successfully'
    });
  } catch (error) {
    console.error('❌ Error generating personalized video with lip-sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate personalized video with lip-sync',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/wav2lip/process-existing
 * @desc Process lip-sync for existing video and audio files
 */
router.post('/process-existing', async (req, res) => {
  try {
    const { videoPath, audioPath, outputDir } = req.body;
    
    if (!videoPath || !audioPath) {
      return res.status(400).json({
        success: false,
        error: 'videoPath and audioPath are required'
      });
    }
    
    console.log(`🎭 Processing lip-sync for existing files...`);
    
    const result = await VideoService.processLipSync(
      videoPath,
      audioPath,
      outputDir
    );
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          lipSyncPath: result.lipSyncPath,
          publicUrl: VideoService.generatePublicUrl(result.lipSyncPath!)
        },
        message: 'Lip-sync processing completed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Lip-sync processing failed',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error processing existing files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process existing files',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/wav2lip/cleanup
 * @desc Clean up old Wav2Lip output files
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAgeHours = 24 } = req.body;
    
    console.log(`🧹 Cleaning up old Wav2Lip files (older than ${maxAgeHours} hours)...`);
    
    await Wav2LipService.cleanupOldFiles(maxAgeHours);
    
    res.json({
      success: true,
      message: `Cleaned up files older than ${maxAgeHours} hours`
    });
  } catch (error) {
    console.error('❌ Error cleaning up files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean up files',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

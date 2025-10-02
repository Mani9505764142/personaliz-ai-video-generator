import express from 'express';
import VideoMergerService from '../services/VideoMergerService';
import VideoService from '../services/VideoService';

const router = express.Router();

/**
 * @route POST /api/video-merger/merge
 * @desc Merge personalized segment with base video
 */
router.post('/merge', async (req, res) => {
  try {
    const { 
      baseVideoPath, 
      personalizedSegmentPath, 
      segmentDuration = 5,
      fadeTransition = true,
      transitionDuration = 0.5
    } = req.body;
    
    if (!baseVideoPath || !personalizedSegmentPath) {
      return res.status(400).json({
        success: false,
        error: 'baseVideoPath and personalizedSegmentPath are required'
      });
    }
    
    console.log(`🔗 Merging video segments...`);
    console.log(`📹 Base video: ${baseVideoPath}`);
    console.log(`🎭 Personalized segment: ${personalizedSegmentPath}`);
    console.log(`⏱️ Segment duration: ${segmentDuration} seconds`);
    
    const result = await VideoMergerService.mergeVideoWithPersonalizedSegment({
      baseVideoPath,
      personalizedSegmentPath,
      segmentDuration,
      fadeTransition,
      transitionDuration
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
        message: 'Video merging completed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Video merging failed',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error merging videos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to merge videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/video-merger/merge-with-fade
 * @desc Merge videos with fade transition
 */
router.post('/merge-with-fade', async (req, res) => {
  try {
    const { 
      baseVideoPath, 
      personalizedSegmentPath, 
      segmentDuration = 5,
      transitionDuration = 0.5
    } = req.body;
    
    if (!baseVideoPath || !personalizedSegmentPath) {
      return res.status(400).json({
        success: false,
        error: 'baseVideoPath and personalizedSegmentPath are required'
      });
    }
    
    console.log(`🔗 Merging videos with fade transition...`);
    
    const result = await VideoMergerService.mergeVideoWithFadeTransition({
      baseVideoPath,
      personalizedSegmentPath,
      segmentDuration,
      transitionDuration
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
        message: 'Video merging with fade completed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Video merging with fade failed',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error merging videos with fade:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to merge videos with fade',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/video-merger/complete-video
 * @desc Generate complete personalized video with merging
 */
router.post('/complete-video', async (req, res) => {
  try {
    const { name, city, phone } = req.body;
    
    if (!name || !city || !phone) {
      return res.status(400).json({
        success: false,
        error: 'name, city, and phone are required'
      });
    }
    
    console.log(`🎬 Generating complete personalized video for ${name} from ${city}`);
    
    const result = await VideoService.generateCompletePersonalizedVideo(
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
        mergedVideoPath: result.mergedVideoPath,
        thumbnailPath: result.thumbnailPath,
        publicUrls: {
          video: VideoService.generatePublicUrl(result.videoPath),
          audio: VideoService.generatePublicUrl(result.audioPath),
          lipSync: VideoService.generatePublicUrl(result.lipSyncPath),
          mergedVideo: VideoService.generatePublicUrl(result.mergedVideoPath),
          thumbnail: VideoService.generatePublicUrl(result.thumbnailPath)
        }
      },
      message: 'Complete personalized video generated successfully'
    });
  } catch (error) {
    console.error('❌ Error generating complete video:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate complete video',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/video-merger/merge-segment
 * @desc Merge existing personalized segment with base video
 */
router.post('/merge-segment', async (req, res) => {
  try {
    const { personalizedSegmentPath, segmentDuration = 5, outputDir } = req.body;
    
    if (!personalizedSegmentPath) {
      return res.status(400).json({
        success: false,
        error: 'personalizedSegmentPath is required'
      });
    }
    
    console.log(`🔗 Merging personalized segment with base video...`);
    
    const result = await VideoService.mergePersonalizedSegment(
      personalizedSegmentPath,
      segmentDuration,
      outputDir
    );
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          mergedVideoPath: result.mergedVideoPath,
          publicUrl: VideoService.generatePublicUrl(result.mergedVideoPath!)
        },
        message: 'Personalized segment merged successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to merge personalized segment',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Error merging segment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to merge segment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route GET /api/video-merger/video-info/:filename
 * @desc Get video information
 */
router.get('/video-info/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Find the video file in uploads directory
    const uploadsDir = process.env.UPLOAD_PATH || './uploads';
    const fs = require('fs');
    const path = require('path');
    
    let videoPath = null;
    
    // Search for the file in all subdirectories
    const subdirs = fs.readdirSync(uploadsDir, { withFileTypes: true })
      .filter((dirent: any) => dirent.isDirectory())
      .map((dirent: any) => dirent.name);
    
    for (const subdir of subdirs) {
      const potentialPath = path.join(uploadsDir, subdir, filename);
      if (fs.existsSync(potentialPath)) {
        videoPath = potentialPath;
        break;
      }
    }
    
    if (!videoPath) {
      return res.status(404).json({
        success: false,
        error: 'Video file not found'
      });
    }
    
    const videoInfo = await VideoMergerService.getVideoInfo(videoPath);
    
    if (videoInfo) {
      res.json({
        success: true,
        data: {
          filename,
          path: videoPath,
          ...videoInfo
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to get video information'
      });
    }
  } catch (error) {
    console.error('❌ Error getting video info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get video information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/video-merger/cleanup
 * @desc Clean up old merged video files
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAgeHours = 24 } = req.body;
    
    console.log(`🧹 Cleaning up old merged video files (older than ${maxAgeHours} hours)...`);
    
    await VideoMergerService.cleanupOldFiles(maxAgeHours);
    
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

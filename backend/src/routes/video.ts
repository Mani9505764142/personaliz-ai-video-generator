import { Router, Request, Response } from 'express';
import { VideoService } from '../services/VideoService';
import WhatsAppService from '../services/WhatsAppService';
import { prisma } from '../../server';
import fs from 'fs';
import path from 'path';
import { validateRequest } from '../middleware/validation';
import Joi from 'joi';

const router = Router();
const videoService = new VideoService();

// TypeScript interfaces
interface GenerateVideoRequest {
  name: string;
  city: string;
  phone: string;
}

interface VideoStatusResponse {
  id: string;
  status: string;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  progress?: string;
  createdAt: string;
  updatedAt: string;
}

interface GenerateVideoResponse {
  videoId: string;
  status: string;
  message: string;
}

// Validation schemas
const generateVideoSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  city: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
});

/**
 * POST /api/generate-video
 * Generate a personalized video for the given person
 */
router.post('/generate-video', validateRequest(generateVideoSchema), async (req: Request, res: Response) => {
  try {
    const { name, city, phone }: GenerateVideoRequest = req.body;

    console.log(`🎬 Starting video generation for: ${name} from ${city}`);

    // Create video request in database
    const videoRequest = await prisma.videoRequest.create({
      data: {
        name,
        city,
        phone,
        status: 'PENDING',
      },
    });

    // Start video generation process asynchronously
    generateVideoAsync(videoRequest.id, name, city, phone).catch((error) => {
      console.error(`❌ Video generation failed for ${videoRequest.id}:`, error);
      // Update status to failed in database
      prisma.videoRequest.update({
        where: { id: videoRequest.id },
        data: { status: 'FAILED' },
      }).catch(console.error);
    });

    const response: GenerateVideoResponse = {
      videoId: videoRequest.id,
      status: 'PENDING',
      message: 'Video generation started successfully. Use the videoId to check status.',
    };

    res.status(202).json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('❌ Error in generate-video endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start video generation',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/video-status/:id
 * Check the processing status of a video request
 */
router.get('/video-status/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required',
      });
    }

    // Get video request from database
    const videoRequest = await prisma.videoRequest.findUnique({
      where: { id },
    });

    if (!videoRequest) {
      return res.status(404).json({
        success: false,
        message: 'Video request not found',
      });
    }

    // Calculate progress based on status
    const progress = calculateProgress(videoRequest.status);

    const response: VideoStatusResponse = {
      id: videoRequest.id,
      status: videoRequest.status,
      videoUrl: videoRequest.videoUrl || undefined,
      audioUrl: videoRequest.audioUrl || undefined,
      thumbnailUrl: videoRequest.thumbnailUrl || undefined,
      progress,
      createdAt: videoRequest.createdAt.toISOString(),
      updatedAt: videoRequest.updatedAt.toISOString(),
    };

    res.status(200).json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('❌ Error in video-status endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * OPTIONS /api/video/:id
 * Handle CORS preflight requests
 */
router.options('/video/:id', (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(204).send();
});

/**
 * GET /api/video/:id
 * Serve the generated video file with proper streaming
 */
router.get('/video/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required',
      });
    }

    // Get video request from database
    const videoRequest = await prisma.videoRequest.findUnique({
      where: { id },
    });

    if (!videoRequest) {
      return res.status(404).json({
        success: false,
        message: 'Video request not found',
      });
    }

    if (!videoRequest.videoUrl) {
      return res.status(404).json({
        success: false,
        message: 'Video file not available yet',
      });
    }

    // Extract filename from videoUrl
    const filename = path.basename(videoRequest.videoUrl);
    
    // Search for the file in the video's subdirectory
    const uploadsDir = path.join(process.env.UPLOAD_PATH || './uploads', id);
    const videoPath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      console.error(`❌ Video file not found: ${videoPath}`);
      return res.status(404).json({
        success: false,
        message: 'Video file not found on server',
      });
    }

    // Get file stats
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', fileSize);

    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      res.status(206); // Partial Content
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunksize);

      // Create read stream for the requested range
      const file = fs.createReadStream(videoPath, { start, end });
      file.pipe(res);

      file.on('error', (error) => {
        console.error('❌ Error streaming video file:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming video file',
          });
        }
      });

    } else {
      // Serve entire file
      const file = fs.createReadStream(videoPath);
      file.pipe(res);

      file.on('error', (error) => {
        console.error('❌ Error serving video file:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error serving video file',
          });
        }
      });
    }

  } catch (error) {
    console.error('❌ Error in video endpoint:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to serve video file',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

/**
 * GET /api/videos
 * Get all video requests (for admin/monitoring purposes)
 */
router.get('/videos', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [videos, total] = await Promise.all([
      prisma.videoRequest.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.videoRequest.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        videos,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });

  } catch (error) {
    console.error('❌ Error in videos endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get videos',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/video/:id
 * Delete a video request and associated files
 */
router.delete('/video/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required',
      });
    }

    // Get video request from database
    const videoRequest = await prisma.videoRequest.findUnique({
      where: { id },
    });

    if (!videoRequest) {
      return res.status(404).json({
        success: false,
        message: 'Video request not found',
      });
    }

    // Delete associated files
    if (videoRequest.videoUrl) {
      const videoFilename = path.basename(videoRequest.videoUrl);
      const videoPath = path.join(process.env.UPLOAD_PATH || './uploads', videoFilename);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }

    if (videoRequest.audioUrl) {
      const audioFilename = path.basename(videoRequest.audioUrl);
      const audioPath = path.join(process.env.UPLOAD_PATH || './uploads', audioFilename);
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }

    if (videoRequest.thumbnailUrl) {
      const thumbnailFilename = path.basename(videoRequest.thumbnailUrl);
      const thumbnailPath = path.join(process.env.UPLOAD_PATH || './uploads', thumbnailFilename);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    // Delete from database
    await prisma.videoRequest.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Video request deleted successfully',
    });

  } catch (error) {
    console.error('❌ Error in delete video endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video request',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Asynchronous video generation function
 */
async function generateVideoAsync(videoId: string, name: string, city: string, phone: string) {
  try {
    console.log(`🎬 Starting async video generation for ID: ${videoId}`);

    // Update status to processing
    await prisma.videoRequest.update({
      where: { id: videoId },
      data: { status: 'PROCESSING' },
    });

    // Create working directory
    const workDir = path.join(process.env.UPLOAD_PATH || './uploads', videoId);
    if (!fs.existsSync(workDir)) {
      fs.mkdirSync(workDir, { recursive: true });
    }

    // Use simplified video generation
    console.log('🎬 Starting simplified video generation...');
    const result = await videoService.generatePersonalizedVideo(name, city, phone);

    // Update database with all URLs
    const videoUrl = videoService.generatePublicUrl(result.videoPath);
    const audioUrl = videoService.generatePublicUrl(result.audioPath);
    const thumbnailUrl = videoService.generatePublicUrl(result.thumbnailPath);

    await prisma.videoRequest.update({
      where: { id: videoId },
      data: { 
        videoUrl,
        audioUrl,
        thumbnailUrl,
        status: 'COMPLETED'
      },
    });

    console.log(`🎉 Simplified video generation completed successfully for ID: ${videoId}`);
    console.log(`📹 Video URL: ${videoUrl}`);
    console.log(`🎵 Audio URL: ${audioUrl}`);
    console.log(`🖼️ Thumbnail URL: ${thumbnailUrl}`);

  } catch (error) {
    console.error(`❌ Video generation failed for ID ${videoId}:`, error);

    // Update status to failed
    await prisma.videoRequest.update({
      where: { id: videoId },
      data: { status: 'FAILED' },
    });
  }
}


/**
 * Calculate progress percentage based on status
 */
function calculateProgress(status: string): string {
  switch (status) {
    case 'PENDING':
      return '0%';
    case 'PROCESSING':
      return '50%';
    case 'COMPLETED':
      return '100%';
    case 'FAILED':
      return '0%';
    default:
      return '0%';
  }
}

/**
 * POST /api/send-whatsapp
 * Send personalized video via WhatsApp after generation
 */
router.post('/send-whatsapp', validateRequest(generateVideoSchema), async (req: Request, res: Response) => {
  try {
    const { name, city, phone }: GenerateVideoRequest = req.body;

    console.log(`🎬 Starting complete personalized video workflow for: ${name} from ${city}`);
    console.log(`📱 Phone: ${phone}`);

    // Step 1: Generate personalized video
    console.log('🎬 Step 1: Generating personalized video...');
    const videoResult = await videoService.generateRealPersonalizedVideo(name, city, phone);

    if (!videoResult.success || !videoResult.finalVideoPath) {
      console.error('❌ Video generation failed:', videoResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate personalized video',
        details: videoResult.error
      });
    }

    console.log('✅ Personalized video generated successfully');

    // Step 2: Send via WhatsApp
    console.log('📱 Step 2: Sending via WhatsApp...');
    const whatsappResult = await WhatsAppService.sendPersonalizedVideo({
      name,
      city,
      phone,
      videoPath: videoResult.finalVideoPath,
      thumbnailPath: videoResult.thumbnailPath,
      customMessage: `Hello ${name}! 🎉\n\nHere's your personalized video from ${city}!\n\nThis video was created just for you with AI-powered voice cloning and lip-sync technology.\n\nEnjoy! 😊`
    });

    if (whatsappResult.success) {
      console.log('✅ WhatsApp delivery successful');
      
      // Update database with WhatsApp delivery info
      const videoRequest = await prisma.videoRequest.create({
        data: {
          name,
          city,
          phone,
          status: whatsappResult.demoMode ? 'DEMO_SENT' : 'SENT',
          videoUrl: videoService.generatePublicUrl(videoResult.finalVideoPath),
          audioUrl: videoResult.audioPath ? videoService.generatePublicUrl(videoResult.audioPath) : null,
          thumbnailUrl: videoResult.thumbnailPath ? videoService.generatePublicUrl(videoResult.thumbnailPath) : null,
        },
      });

      res.json({
        success: true,
        data: {
          videoId: videoRequest.id,
          status: whatsappResult.demoMode ? 'DEMO_SENT' : 'SENT',
          messageId: whatsappResult.messageId,
          demoMode: whatsappResult.demoMode || false,
          videoUrl: videoService.generatePublicUrl(videoResult.finalVideoPath),
          audioUrl: videoResult.audioPath ? videoService.generatePublicUrl(videoResult.audioPath) : null,
          thumbnailUrl: videoResult.thumbnailPath ? videoService.generatePublicUrl(videoResult.thumbnailPath) : null,
          deliveryData: whatsappResult.deliveryData
        },
        message: whatsappResult.demoMode 
          ? `Demo: Personalized video sent to ${name} (${phone})` 
          : `Personalized video sent successfully to ${name} (${phone})`
      });
    } else {
      console.error('❌ WhatsApp delivery failed:', whatsappResult.error);
      
      // Create video request with failed status
      const videoRequest = await prisma.videoRequest.create({
        data: {
          name,
          city,
          phone,
          status: 'FAILED',
          videoUrl: videoService.generatePublicUrl(videoResult.finalVideoPath),
          audioUrl: videoResult.audioPath ? videoService.generatePublicUrl(videoResult.audioPath) : null,
          thumbnailUrl: videoResult.thumbnailPath ? videoService.generatePublicUrl(videoResult.thumbnailPath) : null,
        },
      });

      res.status(500).json({
        success: false,
        error: 'Failed to send video via WhatsApp',
        details: whatsappResult.error,
        data: {
          videoId: videoRequest.id,
          status: 'FAILED',
          videoUrl: videoService.generatePublicUrl(videoResult.finalVideoPath),
          audioUrl: videoResult.audioPath ? videoService.generatePublicUrl(videoResult.audioPath) : null,
          thumbnailUrl: videoResult.thumbnailPath ? videoService.generatePublicUrl(videoResult.thumbnailPath) : null,
        }
      });
    }

  } catch (error) {
    console.error('❌ Error in send-whatsapp endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

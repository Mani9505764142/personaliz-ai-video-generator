import { Request, Response } from 'express';
import PersonalizedVideoService from '../../services/PersonalizedVideoService';

class VideoController {
  private personalizedVideoService: PersonalizedVideoService;

  constructor(personalizedVideoService: PersonalizedVideoService) {
    this.personalizedVideoService = personalizedVideoService;
  }

  // Generate personalized video
  async generateVideo(req: Request, res: Response): Promise<void> {
    try {
      const { name, city, phone, customMessage, celebrity = 'default' } = req.body;

      console.log('\n🎬 === VIDEO CONTROLLER: Generate Request ===');
      console.log('Request:', { name, city, customMessage, celebrity });

      // Validate inputs
      if (!name || !city) {
        res.status(400).json({
          success: false,
          error: 'Name and city are required'
        });
        return;
      }

      if (!['mahesh', 'prabhas', 'default'].includes(celebrity)) {
        res.status(400).json({
          success: false,
          error: 'Invalid celebrity. Choose: mahesh, prabhas, or default'
        });
        return;
      }

      // Generate personalized video
      const result = await this.personalizedVideoService.generatePersonalizedVideo({
        name,
        city,
        phone,
        customMessage,
        celebrity
      });

      if (result.success) {
        console.log('✅ Video Controller: Generation successful');
        res.json({
          success: true,
          message: `🎬 Personalized video created for ${name} from ${city}!`,
          data: result.data,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('❌ Video Controller: Generation failed:', result.error);
        res.status(500).json({
          success: false,
          error: result.error || 'Video generation failed'
        });
      }

    } catch (error: any) {
      console.error('💥 Video Controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get video status
  async getVideoStatus(req: Request, res: Response): Promise<void> {
    try {
      const { videoId } = req.params;

      // Here you could implement video status checking
      // For now, we'll return a basic response
      res.json({
        success: true,
        data: {
          videoId,
          status: 'completed', // In production, check actual status
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('💥 Video status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default VideoController;

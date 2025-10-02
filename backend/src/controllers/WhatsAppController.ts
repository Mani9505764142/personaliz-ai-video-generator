import { Request, Response } from 'express';
import PersonalizedVideoService from '../../services/PersonalizedVideoService';
import WhatsAppService from '../../services/WhatsAppService';
import WhatsAppWebhookService from '../../services/WhatsAppWebhookService';

class WhatsAppController {
  private personalizedVideoService: PersonalizedVideoService;
  private whatsappService: WhatsAppService;
  private webhookService: WhatsAppWebhookService;

  constructor(
    personalizedVideoService: PersonalizedVideoService,
    whatsappService: WhatsAppService, // 🔧 FIXED: Proper typing
    webhookService: WhatsAppWebhookService
  ) {
    this.personalizedVideoService = personalizedVideoService;
    this.whatsappService = whatsappService;
    this.webhookService = webhookService;
  }
  // ... rest of the code stays the same

  // Send personalized video via WhatsApp
  async sendWhatsApp(req: Request, res: Response): Promise<void> {
    try {
      const { name, city, phone, customMessage, celebrity = 'default' } = req.body;

      console.log('\n📱 === WHATSAPP CONTROLLER: Send Request ===');
      console.log('Request:', { name, city, phone, celebrity });

      // Validate inputs
      if (!name || !city || !phone) {
        res.status(400).json({
          success: false,
          error: 'Name, city, and phone are required'
        });
        return;
      }

      // Step 1: Generate personalized video
      console.log('🎬 Generating personalized video...');
      const videoResult = await this.personalizedVideoService.generatePersonalizedVideo({
        name,
        city,
        phone,
        customMessage,
        celebrity
      });

      if (!videoResult.success) {
        res.status(500).json({
          success: false,
          error: 'Video generation failed',
          details: videoResult.error
        });
        return;
      }

      // Step 2: Send via WhatsApp
      console.log('📱 Sending via WhatsApp...');
      const whatsappResult = await this.whatsappService.sendPersonalizedVideo(
        name,
        city,
        phone,
        videoResult.data!.videoUrl,
        customMessage,
        celebrity
      );

      if (whatsappResult.success) {
        console.log('✅ WhatsApp Controller: Delivery successful');
        res.json({
          success: true,
          message: `📱 Personalized video sent to ${name} on WhatsApp!`,
          data: {
            ...videoResult.data,
            whatsapp: {
              messageId: whatsappResult.messageId,
              status: 'sent',
              phone,
              sentAt: new Date().toISOString()
            }
          }
        });
      } else {
        console.error('❌ WhatsApp Controller: Delivery failed:', whatsappResult.error);
        res.json({
          success: true,
          message: 'Video created but WhatsApp delivery failed',
          data: {
            ...videoResult.data,
            whatsapp: {
              error: whatsappResult.error,
              phone,
              failedAt: new Date().toISOString()
            }
          }
        });
      }

    } catch (error: any) {
      console.error('💥 WhatsApp Controller error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle WhatsApp status webhook
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      console.log('📥 WhatsApp Controller: Webhook received');
      console.log('Body:', req.body);
      
      // Handle status update
      this.webhookService.handleStatusWebhook(req.body);
      
      res.status(200).send('OK');
      
    } catch (error: any) {
      console.error('❌ WhatsApp webhook error:', error);
      res.status(500).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get message status
  async getMessageStatus(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;
      
      const status = this.webhookService.getMessageStatus(messageId);
      
      if (status) {
        res.json({
          success: true,
          status
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }
      
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get all message statuses with analytics
  async getAllStatuses(req: Request, res: Response): Promise<void> {
    try {
      const statuses = this.webhookService.getAllMessageStatuses();
      const analytics = this.webhookService.getDeliveryAnalytics();
      const realTimeStatus = this.webhookService.getRealTimeStatus();
      
      res.json({
        success: true,
        data: {
          count: statuses.length,
          statuses,
          analytics,
          realTimeStatus
        }
      });
      
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get WhatsApp service status
  async getServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const whatsappStatus = this.whatsappService.getStatus();
      const webhookAnalytics = this.webhookService.getRealTimeStatus();
      
      res.json({
        success: true,
        service: whatsappStatus,
        webhooks: webhookAnalytics,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default WhatsAppController;

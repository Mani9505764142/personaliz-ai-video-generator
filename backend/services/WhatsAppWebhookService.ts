interface WebhookMessage {
  messageId: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';
  from: string;
  to: string;
  timestamp: string;
  errorCode?: string;
  errorMessage?: string;
}

class WhatsAppWebhookService {
  private messageStatuses: Map<string, WebhookMessage> = new Map();

  constructor() {
    console.log('📥 WhatsApp Webhook Service initialized');
  }

  // Handle incoming webhook from WhatsApp/Twilio
  handleStatusWebhook(webhookData: any): void {
    try {
      const { 
        MessageSid, 
        MessageStatus, 
        From, 
        To, 
        ErrorCode, 
        ErrorMessage,
        SmsSid 
      } = webhookData;

      const messageId = MessageSid || SmsSid;

      if (!messageId) {
        console.log('⚠️ Webhook received without MessageSid');
        return;
      }

      console.log(`📥 Webhook: ${messageId} -> ${MessageStatus}`);
      console.log(`📞 From: ${From}, To: ${To}`);

      const webhookMessage: WebhookMessage = {
        messageId,
        status: MessageStatus,
        from: From || 'unknown',
        to: To || 'unknown',
        timestamp: new Date().toISOString(),
        errorCode: ErrorCode,
        errorMessage: ErrorMessage
      };

      // Store/update message status
      this.messageStatuses.set(messageId, webhookMessage);

      // Log status updates
      this.logStatusUpdate(webhookMessage);

    } catch (error: any) {
      console.error('❌ Webhook processing error:', error);
    }
  }

  // Log status updates with analytics
  private logStatusUpdate(message: WebhookMessage): void {
    const { messageId, status, from, to, errorCode, errorMessage } = message;

    switch (status) {
      case 'sent':
        console.log(`📤 Message sent: ${messageId}`);
        break;
      
      case 'delivered':
        console.log(`📫 Message delivered: ${messageId} to ${to}`);
        break;
      
      case 'read':
        console.log(`👀 Message read: ${messageId} by ${to}`);
        break;
      
      case 'failed':
      case 'undelivered':
        console.log(`💥 Message failed: ${messageId}`);
        if (errorCode && errorMessage) {
          console.log(`❌ Error ${errorCode}: ${errorMessage}`);
        }
        break;
      
      default:
        console.log(`📊 Status update: ${messageId} -> ${status}`);
    }
  }

  // Get specific message status
  getMessageStatus(messageId: string): WebhookMessage | null {
    return this.messageStatuses.get(messageId) || null;
  }

  // Get all message statuses
  getAllMessageStatuses(): WebhookMessage[] {
    return Array.from(this.messageStatuses.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Get delivery analytics
  getDeliveryAnalytics(): any {
    const messages = this.getAllMessageStatuses();
    const total = messages.length;
    
    if (total === 0) {
      return {
        total: 0,
        statusCounts: {},
        rates: { delivery: '0%', read: '0%', failure: '0%' },
        recentMessages: []
      };
    }

    const statusCounts = messages.reduce((acc, msg) => {
      acc[msg.status] = (acc[msg.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const deliveryRate = ((statusCounts.delivered || 0) / total * 100).toFixed(2);
    const readRate = ((statusCounts.read || 0) / total * 100).toFixed(2);
    const failureRate = (((statusCounts.failed || 0) + (statusCounts.undelivered || 0)) / total * 100).toFixed(2);

    return {
      total,
      statusCounts,
      rates: {
        delivery: `${deliveryRate}%`,
        read: `${readRate}%`,
        failure: `${failureRate}%`
      },
      recentMessages: messages.slice(0, 10),
      summary: {
        successful: statusCounts.delivered || 0,
        failed: (statusCounts.failed || 0) + (statusCounts.undelivered || 0),
        pending: (statusCounts.queued || 0) + (statusCounts.sent || 0)
      }
    };
  }

  // Get real-time status for dashboard
  getRealTimeStatus(): any {
    const analytics = this.getDeliveryAnalytics();
    const last24Hours = this.getMessagesInLastHours(24);
    const lastHour = this.getMessagesInLastHours(1);

    return {
      ...analytics,
      timeBasedStats: {
        last24Hours: {
          count: last24Hours.length,
          delivered: last24Hours.filter(m => m.status === 'delivered').length,
          failed: last24Hours.filter(m => ['failed', 'undelivered'].includes(m.status)).length
        },
        lastHour: {
          count: lastHour.length,
          delivered: lastHour.filter(m => m.status === 'delivered').length,
          failed: lastHour.filter(m => ['failed', 'undelivered'].includes(m.status)).length
        }
      },
      updatedAt: new Date().toISOString()
    };
  }

  // Get messages in last N hours
  private getMessagesInLastHours(hours: number): WebhookMessage[] {
    const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.getAllMessageStatuses()
      .filter(msg => new Date(msg.timestamp) > cutoff);
  }

  // Clear old messages (cleanup)
  cleanupOldMessages(daysToKeep: number = 30): number {
    const cutoff = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
    const messages = Array.from(this.messageStatuses.entries());
    let cleaned = 0;

    for (const [messageId, message] of messages) {
      if (new Date(message.timestamp) < cutoff) {
        this.messageStatuses.delete(messageId);
        cleaned++;
      }
    }

    console.log(`🧹 Cleaned ${cleaned} old messages (kept last ${daysToKeep} days)`);
    return cleaned;
  }
}

export default WhatsAppWebhookService;

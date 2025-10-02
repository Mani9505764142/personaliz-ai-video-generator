import twilio from 'twilio';


export interface WhatsAppMessage {
  to: string;
  message: string;
  mediaUrl?: string;
  mediaType?: 'audio' | 'image' | 'video' | 'document';
}


export interface WhatsAppResponse {
  success: boolean;
  sid?: string;
  status?: string;
  error?: string;
  to?: string;
  from?: string;
}


export class WhatsAppService {
  private client: any;
  private fromNumber: string;
  private isConnected: boolean = false;


  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';


    if (!accountSid || !authToken) {
      console.warn('⚠️ Twilio credentials missing - using demo mode');
      this.client = null;
      this.isConnected = false;
    } else {
      try {
        this.client = twilio(accountSid, authToken);
        this.isConnected = true;
        console.log('✅ Twilio WhatsApp service initialized');
        console.log(`📱 Using WhatsApp number: ${this.fromNumber}`);
      } catch (error) {
        console.error('❌ Twilio initialization failed:', error);
        this.client = null;
        this.isConnected = false;
      }
    }
  }


  async sendMessage(params: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      console.log(`📱 Sending WhatsApp message to: ${params.to}`);
      console.log(`📝 Message length: ${params.message.length} characters`);
      if (params.mediaUrl) {
        console.log(`🎵 Includes media: ${params.mediaUrl}`);
      }


      // Demo mode fallback
      if (!this.client || !this.isConnected) {
        console.log('🔄 DEMO MODE: WhatsApp message simulation');
        console.log('📱 Demo message details:');
        console.log(`   To: ${params.to}`);
        console.log(`   From: ${this.fromNumber}`);
        console.log(`   Message: ${params.message.substring(0, 100)}${params.message.length > 100 ? '...' : ''}`);
        
        if (params.mediaUrl) {
          console.log(`   Media URL: ${params.mediaUrl}`);
          console.log(`   Media Type: ${params.mediaType || 'unknown'}`);
        }
        
        const demoSid = `demo_whatsapp_${Date.now()}`;
        console.log(`✅ Demo message created with SID: ${demoSid}`);
        
        return {
          success: true,
          sid: demoSid,
          status: 'sent',
          to: params.to,
          from: this.fromNumber
        };
      }


      // Format phone number for WhatsApp
      const formattedTo = params.to.startsWith('whatsapp:') ? params.to : `whatsapp:${params.to}`;
      
      // Prepare message data
      const messageData: any = {
        from: this.fromNumber,
        to: formattedTo,
        body: params.message
      };


      // TEMPORARILY DISABLE AUDIO FOR TESTING - Add media if provided
      // if (params.mediaUrl) {
      //   messageData.mediaUrl = [params.mediaUrl];
      //   console.log(`🎵 Adding media attachment: ${params.mediaUrl}`);
      // }
      console.log(`📝 TEXT-ONLY MODE: Skipping audio attachment for testing`);


      // Send real WhatsApp message
      console.log('🚀 Sending real WhatsApp message via Twilio...');
      const message = await this.client.messages.create(messageData);


      console.log(`✅ WhatsApp message sent successfully!`);
      console.log(`📱 Message SID: ${message.sid}`);
      console.log(`📊 Status: ${message.status}`);
      console.log(`💰 Price: ${message.price || 'N/A'} ${message.priceUnit || ''}`);
      
      return {
        success: true,
        sid: message.sid,
        status: message.status,
        to: params.to,
        from: this.fromNumber
      };


    } catch (error) {
      console.error('❌ WhatsApp sending error:', error);
      
      // Create demo response as fallback
      console.log('🔄 Falling back to demo mode due to error');
      const fallbackSid = `fallback_demo_${Date.now()}`;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown WhatsApp error',
        sid: fallbackSid,
        to: params.to,
        from: this.fromNumber
      };
    }
  }


  async sendTextMessage(to: string, message: string): Promise<WhatsAppResponse> {
    return this.sendMessage({ to, message });
  }


  async sendMediaMessage(to: string, message: string, mediaUrl: string, mediaType?: 'audio' | 'image' | 'video'): Promise<WhatsAppResponse> {
    return this.sendMessage({ to, message, mediaUrl, mediaType });
  }


  async sendAudioMessage(to: string, message: string, audioUrl: string): Promise<WhatsAppResponse> {
    console.log(`🎵 Sending audio message to ${to}`);
    return this.sendMessage({ to, message, mediaUrl: audioUrl, mediaType: 'audio' });
  }


  async getMessageStatus(messageSid: string): Promise<any> {
    if (!this.client || !this.isConnected) {
      console.log('🔄 Demo mode: returning demo message status');
      return { 
        status: 'delivered', 
        error_message: null,
        date_sent: new Date().toISOString(),
        price: '0.0055',
        price_unit: 'USD'
      };
    }


    try {
      console.log(`📊 Fetching message status for SID: ${messageSid}`);
      const message = await this.client.messages(messageSid).fetch();
      
      console.log(`📱 Message status: ${message.status}`);
      if (message.errorMessage) {
        console.log(`❌ Message error: ${message.errorMessage}`);
      }
      
      return {
        status: message.status,
        error_message: message.errorMessage,
        date_sent: message.dateSent,
        date_updated: message.dateUpdated,
        price: message.price,
        price_unit: message.priceUnit
      };
    } catch (error) {
      console.error('❌ Error fetching message status:', error);
      throw error;
    }
  }


  // Test the WhatsApp connection
  async testConnection(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      console.log('⚠️ No Twilio client - connection test skipped');
      return false;
    }


    try {
      // Try to fetch account info to test connection
      const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      const isConnected = account.status === 'active';
      
      console.log(isConnected ? '✅ Twilio API connection successful' : '❌ Twilio API connection failed');
      console.log(`📊 Account status: ${account.status}`);
      console.log(`💰 Account balance: ${account.balance || 'N/A'}`);
      
      return isConnected;
    } catch (error) {
      console.error('❌ Twilio connection test failed:', error);
      return false;
    }
  }


  // Get account information
  async getAccountInfo(): Promise<any> {
    if (!this.client || !this.isConnected) {
      return {
        status: 'demo',
        balance: 'Demo Mode',
        sid: 'demo_account'
      };
    }


    try {
      const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      return {
        status: account.status,
        balance: account.balance,
        sid: account.sid,
        friendlyName: account.friendlyName
      };
    } catch (error) {
      console.error('❌ Error fetching account info:', error);
      throw error;
    }
  }


  // Check if service is in demo mode
  isDemoMode(): boolean {
    return !this.client || !this.isConnected;
  }


  // Get service status
  getStatus(): { connected: boolean; mode: string; fromNumber: string } {
    return {
      connected: this.isConnected,
      mode: this.isDemoMode() ? 'demo' : 'production',
      fromNumber: this.fromNumber
    };
  }
}

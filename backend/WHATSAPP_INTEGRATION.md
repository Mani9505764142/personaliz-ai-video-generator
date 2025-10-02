# WhatsApp Integration with Twilio

This document describes the complete WhatsApp integration using Twilio for sending personalized videos to users.

## Overview

The WhatsApp integration provides:
- Text message sending via WhatsApp
- Media message delivery (videos, images)
- Personalized video delivery with AI-generated content
- Delivery status tracking via webhooks
- Complete workflow automation

## Setup

### 1. Twilio Account Setup

1. **Create Twilio Account**
   - Visit [Twilio Console](https://console.twilio.com/)
   - Sign up for a free account
   - Verify your phone number

2. **Get WhatsApp Sandbox**
   - Go to Messaging > Try it out > Send a WhatsApp message
   - Follow instructions to join the sandbox
   - Note your sandbox number (usually +14155238886)

3. **Get Credentials**
   - Account SID: Found in Twilio Console dashboard
   - Auth Token: Found in Twilio Console dashboard
   - WhatsApp Number: Your sandbox number

### 2. Environment Configuration

Add to your `.env` file:

```bash
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your-actual-account-sid-here
TWILIO_AUTH_TOKEN=your-actual-auth-token-here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_WEBHOOK_URL=https://your-domain.com/api/whatsapp/webhook
```

### 3. Webhook Configuration

1. **Set up ngrok (for local development)**
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Start ngrok tunnel
   ngrok http 3001
   ```

2. **Configure Twilio Webhook**
   - In Twilio Console, go to Messaging > Settings > WhatsApp sandbox settings
   - Set webhook URL to: `https://your-ngrok-url.ngrok.io/api/whatsapp/webhook`
   - Set HTTP method to: POST

## API Endpoints

### Status and Testing

#### GET `/api/whatsapp/status`
Check WhatsApp service status

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "whatsappNumber": "whatsapp:+14155238886",
    "error": null
  },
  "message": "WhatsApp service is ready"
}
```

#### POST `/api/whatsapp/test-message`
Send test message to verify setup

**Request Body:**
```json
{
  "phone": "+1234567890"
}
```

### Message Sending

#### POST `/api/whatsapp/send-message`
Send text message via WhatsApp

**Request Body:**
```json
{
  "to": "+1234567890",
  "message": "Hello! This is a test message."
}
```

#### POST `/api/whatsapp/send-media`
Send media message via WhatsApp

**Request Body:**
```json
{
  "to": "+1234567890",
  "mediaUrl": "https://example.com/video.mp4",
  "caption": "Check out this video!"
}
```

### Personalized Video Delivery

#### POST `/api/whatsapp/send-personalized-video`
Send personalized video via WhatsApp

**Request Body:**
```json
{
  "name": "suthari sai manikanta vivek",
  "city": "tiruvuru",
  "phone": "+1234567890",
  "videoPath": "/path/to/video.mp4",
  "thumbnailPath": "/path/to/thumbnail.jpg",
  "customMessage": "Your personalized video is ready!"
}
```

#### POST `/api/whatsapp/send-complete-video`
Complete personalized video workflow

**Request Body:**
```json
{
  "name": "suthari sai manikanta vivek",
  "city": "tiruvuru",
  "phone": "+1234567890",
  "customMessage": "Your personalized video is ready!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "SM1234567890abcdef",
    "videoData": {
      "videoPath": "/path/to/video.mp4",
      "audioPath": "/path/to/audio.mp3",
      "lipSyncPath": "/path/to/lip-sync.mp4",
      "mergedVideoPath": "/path/to/merged.mp4",
      "thumbnailPath": "/path/to/thumbnail.jpg"
    }
  },
  "message": "Complete personalized video sent successfully"
}
```

### Delivery Status

#### POST `/api/whatsapp/webhook`
Handle Twilio delivery status webhooks

**Webhook Data:**
```json
{
  "MessageSid": "SM1234567890abcdef",
  "MessageStatus": "delivered",
  "To": "whatsapp:+1234567890",
  "From": "whatsapp:+14155238886",
  "ErrorCode": null,
  "ErrorMessage": null
}
```

#### GET `/api/whatsapp/message-status/:messageId`
Get message delivery status

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "SM1234567890abcdef",
    "status": "delivered"
  }
}
```

### Utility Endpoints

#### POST `/api/whatsapp/validate-phone`
Validate phone number format

**Request Body:**
```json
{
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "phone": "+1234567890",
    "valid": true,
    "formatted": "whatsapp:+1234567890",
    "error": null
  }
}
```

## Usage Examples

### 1. Send Test Message

```bash
curl -X POST http://localhost:3001/api/whatsapp/test-message \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

### 2. Send Personalized Video

```bash
curl -X POST http://localhost:3001/api/whatsapp/send-complete-video \
  -H "Content-Type: application/json" \
  -d '{
    "name": "suthari sai manikanta vivek",
    "city": "tiruvuru",
    "phone": "+1234567890",
    "customMessage": "Your personalized video is ready! 🎬"
  }'
```

### 3. Check Service Status

```bash
curl http://localhost:3001/api/whatsapp/status
```

### 4. Validate Phone Number

```bash
curl -X POST http://localhost:3001/api/whatsapp/validate-phone \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

## Testing

### Run Integration Test

```bash
npm run test:whatsapp
```

This will:
1. Check Twilio connection
2. Validate phone number format
3. Send test message
4. Generate personalized video (if ElevenLabs configured)
5. Send personalized video
6. Test complete workflow

### Manual Testing

1. **Configure credentials:**
   ```bash
   # Add to .env file
   TWILIO_ACCOUNT_SID=your-actual-account-sid
   TWILIO_AUTH_TOKEN=your-actual-auth-token
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Test endpoints:**
   ```bash
   curl http://localhost:3001/api/whatsapp/status
   ```

## Complete Workflow

### 1. User Submits Form
- Name: "suthari sai manikanta vivek"
- City: "tiruvuru"
- Phone: "+1234567890"

### 2. Video Generation Pipeline
1. **Text Overlay**: Add personalized text to base video
2. **Voice Cloning**: Generate personalized audio with ElevenLabs
3. **Lip-Sync**: Process 5-second segment with Wav2Lip
4. **Video Merging**: Combine with original base video
5. **Thumbnail**: Generate preview image

### 3. WhatsApp Delivery
1. **Thumbnail Preview**: Send thumbnail as preview
2. **Video Delivery**: Send complete personalized video
3. **Status Tracking**: Monitor delivery status via webhooks

### 4. User Experience
- Receives thumbnail preview
- Gets personalized video with natural lip-sync
- Video contains their name and city
- Professional quality output

## Message Status Tracking

### Status Types
- **sent**: Message sent to Twilio
- **delivered**: Message delivered to user's device
- **read**: User has read the message
- **failed**: Message delivery failed

### Webhook Processing
- Automatic status updates via Twilio webhooks
- Real-time delivery tracking
- Error handling and logging
- Database storage (if implemented)

## Error Handling

### Common Issues

1. **Invalid Phone Number**
   - Error: "Invalid phone number format"
   - Solution: Use proper international format (+1234567890)

2. **Twilio Credentials Missing**
   - Error: "Twilio credentials not configured"
   - Solution: Add credentials to .env file

3. **Webhook Not Configured**
   - Error: Delivery status not received
   - Solution: Configure webhook URL in Twilio console

4. **Video File Not Found**
   - Error: "Video file not found"
   - Solution: Ensure video generation completed successfully

### Debug Mode

Enable debug logging:
```bash
DEBUG=whatsapp:*
```

## Security

- Phone number validation
- Twilio authentication
- Webhook signature verification (recommended)
- Rate limiting on endpoints
- Input sanitization

## Performance

- **Message Delivery**: 1-3 seconds
- **Video Generation**: 30-60 seconds
- **File Upload**: Depends on file size
- **Webhook Processing**: < 1 second

## Cost Considerations

- **Twilio Pricing**: $0.005 per message
- **WhatsApp Business API**: Additional costs for production
- **Video Storage**: File hosting costs
- **Processing**: Server resources for video generation

## Production Deployment

### 1. Upgrade to Production WhatsApp
- Apply for WhatsApp Business API
- Get production phone number
- Update webhook URLs

### 2. Security Enhancements
- Implement webhook signature verification
- Add rate limiting
- Use HTTPS for all endpoints
- Implement authentication

### 3. Monitoring
- Set up delivery status tracking
- Monitor error rates
- Track video generation success
- Log all interactions

## Troubleshooting

### Debug Steps

1. **Check Credentials**
   ```bash
   curl http://localhost:3001/api/whatsapp/status
   ```

2. **Test Message Sending**
   ```bash
   curl -X POST http://localhost:3001/api/whatsapp/test-message \
     -H "Content-Type: application/json" \
     -d '{"phone": "+1234567890"}'
   ```

3. **Check Webhook**
   - Verify webhook URL in Twilio console
   - Check ngrok tunnel is active
   - Monitor webhook logs

4. **Video Generation**
   - Ensure base video exists
   - Check ElevenLabs API key
   - Verify Wav2Lip setup

### Common Solutions

- **Phone Format**: Always use international format
- **Webhook**: Use ngrok for local development
- **Credentials**: Double-check Twilio console
- **Video**: Ensure all services are running

## Future Enhancements

- Database integration for delivery tracking
- Batch message sending
- Template message support
- Rich media messages
- Analytics dashboard
- User management system

📝 BACKEND README:
Personaliz - Backend (Express.js + TypeScript)
A robust TypeScript backend server that handles AI voice generation, WhatsApp messaging, and video personalization for the Personaliz AI Video Generator.

🚀 Features
AI Voice Generation: ElevenLabs API integration for high-quality speech synthesis

WhatsApp Messaging: Twilio API for reliable message delivery with audio attachments

TypeScript: Full type safety and modern development experience

Error Handling: Comprehensive error management with graceful fallbacks

Rate Limiting: API protection and quota management

File Management: Audio file processing and cleanup

Service Architecture: Modular service-based design

🛠️ Technology Stack
Express.js: Fast, unopinionated web framework

TypeScript: Type-safe JavaScript development

ElevenLabs API: AI voice generation service

Twilio API: WhatsApp Business API integration

Node.js: JavaScript runtime environment

📁 Project Structure
text
backend/
├── src/
│   ├── services/
│   │   ├── ElevenLabsService.ts
│   │   └── WhatsAppService.ts
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── routes/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   └── server.ts
├── uploads/
├── .env
├── package.json
├── tsconfig.json
└── nodemon.json
🎯 API Endpoints
POST /api/send-whatsapp - Generate personalized video and send via WhatsApp

Request Body:

json
{
  "name": "John Doe",
  "city": "New York", 
  "phone": "+1234567890",
  "actorTemplate": "male-professional"
}
Response:

json
{
  "success": true,
  "message": "Video generated and sent successfully",
  "data": {
    "audioFile": "personalized-audio-123.mp3",
    "whatsappMessageId": "msg_abc123",
    "deliveryStatus": "sent"
  }
}
🔧 Environment Configuration
text
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Twilio WhatsApp Configuration  
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Server Configuration
PORT=3001
BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
UPLOAD_PATH=./uploads
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
🎵 Key Services
ElevenLabsService: AI voice generation with quota management and fallback system
WhatsAppService: Message delivery with media attachments and status tracking

🛡️ Security Features
API rate limiting and protection

Secure environment variable management

Comprehensive error handling

Production-ready configuration
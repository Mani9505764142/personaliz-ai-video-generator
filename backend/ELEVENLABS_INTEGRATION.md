# ElevenLabs Voice Cloning Integration

This document describes the ElevenLabs API integration for voice cloning in the personalized video generation system.

## Overview

The ElevenLabs integration provides:
- Voice sample extraction from base video
- Voice cloning/model creation
- AI-powered audio generation with cloned voices
- Complete voice cloning workflow
- REST API endpoints for all functionality

## Setup

### 1. Get ElevenLabs API Key

1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Sign up for an account
3. Go to your profile and copy your API key
4. Add it to your `.env` file:

```bash
ELEVENLABS_API_KEY=your-actual-api-key-here
```

### 2. Install Dependencies

The required dependencies are already included in `package.json`:
- `elevenlabs-node`: Official ElevenLabs Node.js SDK
- `fluent-ffmpeg`: For audio/video processing

## API Endpoints

### Voice Management

#### GET `/api/elevenlabs/voices`
List all available voices (including cloned voices)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "voiceId": "voice_id_here",
      "name": "Voice Name",
      "description": "Voice description",
      "created": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### GET `/api/elevenlabs/voices/:voiceId`
Get specific voice details

#### DELETE `/api/elevenlabs/voices/:voiceId`
Delete a voice clone

### Voice Cloning

#### POST `/api/elevenlabs/extract-voice`
Extract voice sample from base video

**Response:**
```json
{
  "success": true,
  "data": {
    "voiceSamplePath": "/path/to/voice-sample.wav",
    "message": "Voice sample extracted successfully"
  }
}
```

#### POST `/api/elevenlabs/create-voice-clone`
Create a voice clone from extracted sample

**Request Body:**
```json
{
  "voiceSamplePath": "/path/to/voice-sample.wav",
  "voiceName": "My Voice Clone",
  "description": "Optional description"
}
```

#### POST `/api/elevenlabs/complete-workflow`
Complete voice cloning workflow: extract sample, create clone, and test

**Request Body:**
```json
{
  "voiceName": "Base Video Actress",
  "testName": "John",
  "testCity": "New York"
}
```

### Audio Generation

#### POST `/api/elevenlabs/generate-audio`
Generate audio using voice cloning

**Request Body:**
```json
{
  "voiceId": "voice_id_here",
  "text": "Hello, this is a test message",
  "modelId": "eleven_multilingual_v2",
  "voiceSettings": {
    "stability": 0.5,
    "similarityBoost": 0.75,
    "style": 0.0,
    "useSpeakerBoost": true
  }
}
```

#### POST `/api/elevenlabs/test-audio`
Test audio generation with "Hello [name] from [city]"

**Request Body:**
```json
{
  "name": "Alice",
  "city": "Los Angeles"
}
```

### Status

#### GET `/api/elevenlabs/voice-clone-status`
Get current voice clone status

**Response:**
```json
{
  "success": true,
  "data": {
    "voiceId": "voice_id_here",
    "initialized": true
  },
  "message": "Voice clone is initialized"
}
```

## Usage Examples

### 1. Complete Voice Cloning Workflow

```bash
curl -X POST http://localhost:3001/api/elevenlabs/complete-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "voiceName": "Base Video Actress",
    "testName": "John",
    "testCity": "New York"
  }'
```

### 2. Test Audio Generation

```bash
curl -X POST http://localhost:3001/api/elevenlabs/test-audio \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "city": "Los Angeles"
  }'
```

### 3. Generate Custom Audio

```bash
curl -X POST http://localhost:3001/api/elevenlabs/generate-audio \
  -H "Content-Type: application/json" \
  -d '{
    "voiceId": "your_voice_id_here",
    "text": "Hello Alice! Welcome to our personalized video experience.",
    "voiceSettings": {
      "stability": 0.5,
      "similarityBoost": 0.75,
      "useSpeakerBoost": true
    }
  }'
```

## Testing

Run the ElevenLabs integration test:

```bash
npm run test:elevenlabs
```

This will:
1. Check if API key is configured
2. List available voices
3. Extract voice sample from base video
4. Complete voice cloning workflow
5. Test audio generation
6. Generate a personalized video

## Integration with VideoService

The `VideoService` automatically uses voice cloning when generating personalized videos:

```typescript
// Initialize voice cloning (happens automatically)
await VideoService.initializeVoiceCloning();

// Generate personalized video with cloned voice
const result = await VideoService.generatePersonalizedVideo(
  'John',
  'New York',
  '+1234567890'
);
```

## Voice Settings

The voice settings control the quality and characteristics of the generated audio:

- **stability** (0.0 - 1.0): Controls consistency of voice
- **similarityBoost** (0.0 - 1.0): How closely to match the original voice
- **style** (0.0 - 1.0): Style exaggeration
- **useSpeakerBoost**: Enhance speaker similarity

## Error Handling

All endpoints include comprehensive error handling:

- API key validation
- File existence checks
- Network error handling
- Fallback to mock audio if voice cloning fails

## File Structure

```
backend/src/
├── services/
│   ├── ElevenLabsService.ts    # Main ElevenLabs integration
│   └── VideoService.ts         # Updated with voice cloning
├── routes/
│   └── elevenlabs.ts           # API endpoints
└── test-elevenlabs.ts          # Integration test script
```

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   - Ensure `ELEVENLABS_API_KEY` is set in `.env`
   - Check that the API key is valid

2. **Voice Sample Extraction Fails**
   - Ensure base video exists at `backend/assets/Personaliz video (1).mp4`
   - Check FFmpeg installation

3. **Voice Cloning Fails**
   - Verify API key has sufficient credits
   - Check voice sample quality (should be clear speech)

4. **Audio Generation Fails**
   - Ensure voice clone was created successfully
   - Check text length (ElevenLabs has character limits)

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=elevenlabs:*
```

## Cost Considerations

ElevenLabs pricing:
- Free tier: 10,000 characters/month
- Paid plans: $5/month + usage-based pricing
- Voice cloning: Additional cost per voice

Monitor usage in your ElevenLabs dashboard.

## Security

- API keys are stored in environment variables
- Voice samples are processed locally
- Generated audio files are stored securely
- No sensitive data is logged

## Performance

- Voice cloning is done once per base video
- Audio generation is fast (1-2 seconds)
- Files are cached for reuse
- Streaming support for large audio files

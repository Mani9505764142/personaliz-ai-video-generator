# Wav2Lip Lip-Sync Integration

This document describes the Wav2Lip integration for lip-sync processing in the personalized video generation system.

## Overview

The Wav2Lip integration provides:
- Lip-sync processing using AI-powered facial animation
- 5-second personalized greeting generation
- Docker-based processing for reliability
- Integration with ElevenLabs voice cloning
- Complete video generation pipeline

## Architecture

```
Base Video + Personalized Audio → Wav2Lip → Lip-Synced Video
     ↓              ↓                ↓
  Text Overlay   Voice Clone    AI Lip-Sync
```

## Setup

### 1. Prerequisites

- Docker installed and running
- Base video file at `backend/assets/Personaliz video (1).mp4`
- ElevenLabs API key configured

### 2. Build Wav2Lip Docker Image

```bash
# Build the Wav2Lip Docker image
npm run build:wav2lip

# Or manually
docker build -t wav2lip:latest ./backend/docker/wav2lip/
```

### 3. Verify Setup

```bash
# Check if Wav2Lip is ready
curl http://localhost:3001/api/wav2lip/status
```

## API Endpoints

### Status and Setup

#### GET `/api/wav2lip/status`
Check Wav2Lip setup status

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true
  },
  "message": "Wav2Lip is ready"
}
```

#### POST `/api/wav2lip/build-image`
Build Wav2Lip Docker image

**Response:**
```json
{
  "success": true,
  "message": "Wav2Lip Docker image built successfully"
}
```

### Processing

#### POST `/api/wav2lip/process`
Process video and audio with Wav2Lip

**Request Body:**
```json
{
  "videoPath": "/path/to/video.mp4",
  "audioPath": "/path/to/audio.wav",
  "duration": 5,
  "trimInputs": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "outputPath": "/path/to/output.mp4",
    "publicUrl": "http://localhost:3001/stream/output.mp4",
    "fileSize": 1234567,
    "duration": 5,
    "processingTime": 30000
  },
  "message": "Lip-sync processing completed successfully"
}
```

#### POST `/api/wav2lip/greeting`
Process personalized greeting (5 seconds)

**Request Body:**
```json
{
  "videoPath": "/path/to/video.mp4",
  "audioPath": "/path/to/audio.wav"
}
```

#### POST `/api/wav2lip/personalized-video`
Generate complete personalized video with lip-sync

**Request Body:**
```json
{
  "name": "suthari sai manikanta vivek",
  "city": "tiruvuru",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "videoPath": "/path/to/original.mp4",
    "audioPath": "/path/to/audio.mp3",
    "lipSyncPath": "/path/to/lip-sync.mp4",
    "thumbnailPath": "/path/to/thumbnail.jpg",
    "publicUrls": {
      "video": "http://localhost:3001/stream/original.mp4",
      "audio": "http://localhost:3001/stream/audio.mp3",
      "lipSync": "http://localhost:3001/stream/lip-sync.mp4",
      "thumbnail": "http://localhost:3001/uploads/thumbnail.jpg"
    }
  },
  "message": "Personalized video with lip-sync generated successfully"
}
```

#### POST `/api/wav2lip/process-existing`
Process lip-sync for existing video and audio files

**Request Body:**
```json
{
  "videoPath": "/path/to/video.mp4",
  "audioPath": "/path/to/audio.wav",
  "outputDir": "/path/to/output"
}
```

### Maintenance

#### POST `/api/wav2lip/cleanup`
Clean up old Wav2Lip output files

**Request Body:**
```json
{
  "maxAgeHours": 24
}
```

## Usage Examples

### 1. Complete Personalized Video Generation

```bash
curl -X POST http://localhost:3001/api/wav2lip/personalized-video \
  -H "Content-Type: application/json" \
  -d '{
    "name": "suthari sai manikanta vivek",
    "city": "tiruvuru",
    "phone": "+1234567890"
  }'
```

### 2. Process Existing Files

```bash
curl -X POST http://localhost:3001/api/wav2lip/greeting \
  -H "Content-Type: application/json" \
  -d '{
    "videoPath": "/path/to/video.mp4",
    "audioPath": "/path/to/audio.wav"
  }'
```

### 3. Check Status

```bash
curl http://localhost:3001/api/wav2lip/status
```

## Testing

### Run Integration Test

```bash
npm run test:wav2lip
```

This will:
1. Check Wav2Lip setup
2. Generate test audio
3. Process lip-sync
4. Generate complete personalized video

### Manual Testing

1. **Build Docker image:**
   ```bash
   npm run build:wav2lip
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Test endpoints:**
   ```bash
   curl http://localhost:3001/api/wav2lip/status
   ```

## Integration with VideoService

The `VideoService` now includes lip-sync functionality:

```typescript
// Generate personalized video with lip-sync
const result = await VideoService.generatePersonalizedVideoWithLipSync(
  'suthari sai manikanta vivek',
  'tiruvuru',
  '+1234567890'
);

// Process lip-sync for existing files
const lipSyncResult = await VideoService.processLipSync(
  videoPath,
  audioPath
);
```

## File Structure

```
backend/
├── docker/wav2lip/
│   ├── Dockerfile
│   └── process_wav2lip.py
├── src/services/
│   ├── Wav2LipService.ts
│   └── VideoService.ts (updated)
├── src/routes/
│   └── wav2lip.ts
└── src/test-wav2lip.ts
```

## Processing Pipeline

1. **Input Preparation:**
   - Base video with text overlay
   - Personalized audio from ElevenLabs

2. **Wav2Lip Processing:**
   - Extract 5-second segments
   - Process lip-sync using AI
   - Generate synchronized video

3. **Output:**
   - Lip-synced video file
   - Thumbnail generation
   - Public URL generation

## Performance

- **Processing Time:** 30-60 seconds for 5-second video
- **File Size:** ~2-5 MB for 5-second video
- **Quality:** High-quality lip-sync with natural facial movements
- **Format:** MP4 with H.264 codec

## Troubleshooting

### Common Issues

1. **Docker Image Not Found**
   ```bash
   npm run build:wav2lip
   ```

2. **Base Video Missing**
   - Ensure `backend/assets/Personaliz video (1).mp4` exists

3. **Processing Fails**
   - Check Docker logs: `docker logs wav2lip-processor`
   - Verify input file formats (MP4 video, WAV audio)

4. **Memory Issues**
   - Increase Docker memory allocation
   - Process shorter video segments

### Debug Mode

Enable debug logging:
```bash
DEBUG=wav2lip:*
```

## Cost Considerations

- **Docker Resources:** CPU and memory intensive
- **Processing Time:** 30-60 seconds per video
- **Storage:** Output files require significant space
- **Cleanup:** Automatic cleanup of old files

## Security

- Docker container isolation
- File path validation
- Input sanitization
- Secure file handling

## Monitoring

- Processing time tracking
- File size monitoring
- Error logging
- Success/failure rates

## Future Enhancements

- Batch processing
- GPU acceleration
- Real-time processing
- Quality optimization
- Custom model training

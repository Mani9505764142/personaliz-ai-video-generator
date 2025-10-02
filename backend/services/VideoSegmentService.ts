import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface PersonalizationPoint {
  startTime: number;
  endTime: number;
  duration: number;
  type: 'greeting' | 'name' | 'location' | 'custom';
  description: string;
  confidence: number;
}

export interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  segmentPath: string;
  type: 'personalized' | 'generic';
  description: string;
}

export interface SegmentExtractionResult {
  personalizedSegments: VideoSegment[];
  genericSegments: VideoSegment[];
  totalSegments: number;
}

export class VideoSegmentService {
  
  /**
   * Analyze video for personalization points
   */
  async analyzePersonalizationPoints(videoPath: string): Promise<PersonalizationPoint[]> {
    try {
      console.log('🔍 Analyzing video for personalization points...');
      
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      // Get video duration
      const duration = await this.getVideoDuration(videoPath);
      console.log(`📊 Video duration: ${duration} seconds`);

      // For now, we'll create a simple personalization point at the beginning
      // In a real implementation, this would use AI to analyze speech patterns
      const personalizationPoints: PersonalizationPoint[] = [
        {
          startTime: 0,
          endTime: 5,
          duration: 5,
          type: 'greeting',
          description: 'Opening greeting section',
          confidence: 0.8
        }
      ];

      // Add more segments if video is longer
      if (duration > 10) {
        personalizationPoints.push({
          startTime: Math.max(0, duration - 5),
          endTime: duration,
          duration: 5,
          type: 'custom',
          description: 'Closing section',
          confidence: 0.6
        });
      }

      console.log(`✅ Found ${personalizationPoints.length} personalization points`);
      return personalizationPoints;

    } catch (error) {
      console.error('❌ Error analyzing personalization points:', error);
      throw error;
    }
  }

  /**
   * Extract all segments from video based on personalization points
   */
  async extractAllSegments(
    videoPath: string,
    personalizationPoints: PersonalizationPoint[],
    outputDir: string
  ): Promise<SegmentExtractionResult> {
    try {
      console.log('✂️ Extracting all video segments...');
      
      const personalizedSegments: VideoSegment[] = [];
      const genericSegments: VideoSegment[] = [];

      // Extract personalized segments
      for (let i = 0; i < personalizationPoints.length; i++) {
        const point = personalizationPoints[i];
        const segmentId = uuidv4();
        const segmentPath = path.join(outputDir, `personalized-segment-${i}-${segmentId}.mp4`);

        await this.extractSegment(videoPath, point.startTime, point.duration, segmentPath);

        personalizedSegments.push({
          id: segmentId,
          startTime: point.startTime,
          endTime: point.endTime,
          duration: point.duration,
          segmentPath,
          type: 'personalized',
          description: point.description
        });
      }

      // Create generic segments (parts not being personalized)
      const videoDuration = await this.getVideoDuration(videoPath);
      let currentTime = 0;

      for (let i = 0; i < personalizationPoints.length; i++) {
        const point = personalizationPoints[i];
        
        // Extract generic segment before personalization point
        if (point.startTime > currentTime) {
          const segmentId = uuidv4();
          const segmentPath = path.join(outputDir, `generic-segment-${i}-${segmentId}.mp4`);
          const duration = point.startTime - currentTime;

          await this.extractSegment(videoPath, currentTime, duration, segmentPath);

          genericSegments.push({
            id: segmentId,
            startTime: currentTime,
            endTime: point.startTime,
            duration,
            segmentPath,
            type: 'generic',
            description: `Generic segment ${i + 1}`
          });
        }

        currentTime = point.endTime;
      }

      // Extract final generic segment if there's remaining video
      if (currentTime < videoDuration) {
        const segmentId = uuidv4();
        const segmentPath = path.join(outputDir, `generic-segment-final-${segmentId}.mp4`);
        const duration = videoDuration - currentTime;

        await this.extractSegment(videoPath, currentTime, duration, segmentPath);

        genericSegments.push({
          id: segmentId,
          startTime: currentTime,
          endTime: videoDuration,
          duration,
          segmentPath,
          type: 'generic',
          description: 'Final generic segment'
        });
      }

      console.log(`✅ Extracted ${personalizedSegments.length} personalized and ${genericSegments.length} generic segments`);

      return {
        personalizedSegments,
        genericSegments,
        totalSegments: personalizedSegments.length + genericSegments.length
      };

    } catch (error) {
      console.error('❌ Error extracting segments:', error);
      throw error;
    }
  }

  /**
   * Extract a specific segment from video
   */
  async extractSegment(
    videoPath: string,
    startTime: number,
    duration: number,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`✂️ Extracting segment: ${startTime}s to ${startTime + duration}s`);

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        ffmpeg(videoPath)
          .seekInput(startTime)
          .duration(duration)
          .output(outputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .on('end', () => {
            console.log(`✅ Segment extracted: ${outputPath}`);
            resolve(outputPath);
          })
          .on('error', (error) => {
            console.error('❌ FFmpeg segment extraction error:', error);
            reject(error);
          })
          .run();

      } catch (error) {
        console.error('❌ Error in extractSegment:', error);
        reject(error);
      }
    });
  }

  /**
   * Extract audio segment from video
   */
  async extractAudioSegment(
    videoPath: string,
    startTime: number,
    duration: number,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🎵 Extracting audio segment: ${startTime}s to ${startTime + duration}s`);

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        ffmpeg(videoPath)
          .seekInput(startTime)
          .duration(duration)
          .output(outputPath)
          .audioCodec('pcm_s16le')
          .audioFrequency(22050)
          .audioChannels(1)
          .noVideo()
          .on('end', () => {
            console.log(`✅ Audio segment extracted: ${outputPath}`);
            resolve(outputPath);
          })
          .on('error', (error) => {
            console.error('❌ FFmpeg audio extraction error:', error);
            reject(error);
          })
          .run();

      } catch (error) {
        console.error('❌ Error in extractAudioSegment:', error);
        reject(error);
      }
    });
  }

  /**
   * Create personalized segment by replacing audio
   */
  async createPersonalizedSegment(
    videoSegmentPath: string,
    personalizedAudioPath: string,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🎬 Creating personalized segment with new audio...');

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        ffmpeg()
          .input(videoSegmentPath)
          .input(personalizedAudioPath)
          .outputOptions([
            '-c:v copy',
            '-c:a aac',
            '-strict experimental',
            '-map 0:v:0',
            '-map 1:a:0',
            '-shortest'
          ])
          .output(outputPath)
          .on('end', () => {
            console.log(`✅ Personalized segment created: ${outputPath}`);
            resolve(outputPath);
          })
          .on('error', (error) => {
            console.error('❌ FFmpeg personalized segment error:', error);
            reject(error);
          })
          .run();

      } catch (error) {
        console.error('❌ Error creating personalized segment:', error);
        reject(error);
      }
    });
  }

  /**
   * Merge multiple segments into final video
   */
  async mergeSegments(segments: VideoSegment[], outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🔗 Merging ${segments.length} segments into final video...`);

        if (segments.length === 0) {
          throw new Error('No segments to merge');
        }

        // Sort segments by start time
        const sortedSegments = segments.sort((a, b) => a.startTime - b.startTime);

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Create concat file for FFmpeg
        const concatFilePath = path.join(outputDir, `concat-${uuidv4()}.txt`);
        const concatContent = sortedSegments
          .map(segment => `file '${path.resolve(segment.segmentPath)}'`)
          .join('\n');

        fs.writeFileSync(concatFilePath, concatContent);

        ffmpeg()
          .input(concatFilePath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions([
            '-c:v libx264',
            '-c:a aac',
            '-strict experimental'
          ])
          .output(outputPath)
          .on('end', () => {
            // Clean up concat file
            fs.unlinkSync(concatFilePath);
            console.log(`✅ Segments merged: ${outputPath}`);
            resolve(outputPath);
          })
          .on('error', (error) => {
            // Clean up concat file on error
            if (fs.existsSync(concatFilePath)) {
              fs.unlinkSync(concatFilePath);
            }
            console.error('❌ FFmpeg merge error:', error);
            reject(error);
          })
          .run();

      } catch (error) {
        console.error('❌ Error merging segments:', error);
        reject(error);
      }
    });
  }

  /**
   * Get video duration
   */
  async getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        ffmpeg.ffprobe(videoPath, (error, metadata) => {
          if (error) {
            console.error('❌ Failed to get video duration:', error);
            reject(error);
            return;
          }

          const duration = metadata.format.duration;
          if (duration) {
            resolve(duration);
          } else {
            reject(new Error('Could not determine video duration'));
          }
        });
      } catch (error) {
        console.error('❌ Error getting video duration:', error);
        reject(error);
      }
    });
  }

  /**
   * Get video information
   */
  async getVideoInfo(videoPath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    bitrate: number;
    fps: number;
  }> {
    return new Promise((resolve, reject) => {
      try {
        ffmpeg.ffprobe(videoPath, (error, metadata) => {
          if (error) {
            console.error('❌ Failed to get video info:', error);
            reject(error);
            return;
          }

          const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
          
          if (!videoStream) {
            reject(new Error('No video stream found'));
            return;
          }

          resolve({
            duration: metadata.format.duration || 0,
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            bitrate: parseInt(metadata.format.bit_rate || '0'),
            fps: eval(videoStream.r_frame_rate || '0') || 0
          });
        });
      } catch (error) {
        console.error('❌ Error getting video info:', error);
        reject(error);
      }
    });
  }
}

export default new VideoSegmentService();

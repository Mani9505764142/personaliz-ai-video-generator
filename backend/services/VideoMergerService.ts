import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface MergeVideoOptions {
  baseVideoPath: string;
  personalizedSegmentPath: string;
  segmentDuration: number;
  outputPath?: string;
  fadeTransition?: boolean;
  transitionDuration?: number;
}

export interface MergeVideoResult {
  success: boolean;
  outputPath?: string;
  fileSize?: number;
  duration?: number;
  error?: string;
  processingTime?: number;
}

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  bitrate: number;
  fps: number;
}

export class VideoMergerService {

  /**
   * 🔧 FIXED: Merge video with personalized segment
   */
  async mergeVideoWithPersonalizedSegment(options: MergeVideoOptions): Promise<MergeVideoResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔗 Starting video merge with personalized segment...');
      console.log(`📹 Base video: ${options.baseVideoPath}`);
      console.log(`🎭 Personalized segment: ${options.personalizedSegmentPath}`);
      console.log(`⏱️ Segment duration: ${options.segmentDuration}s`);

      // Validate input files
      if (!fs.existsSync(options.baseVideoPath)) {
        throw new Error(`Base video not found: ${options.baseVideoPath}`);
      }

      if (!fs.existsSync(options.personalizedSegmentPath)) {
        throw new Error(`Personalized segment not found: ${options.personalizedSegmentPath}`);
      }

      // Generate output path if not provided
      const outputPath = options.outputPath || this.generateOutputPath();
      const outputDir = path.dirname(outputPath);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 🔧 FIXED: Proper async/await for video info
      const baseVideoInfo = await this.getVideoInfo(options.baseVideoPath);
      console.log(`📊 Base video duration: ${baseVideoInfo.duration}s`);

      // 🔧 SIMPLIFIED: Use simple concatenation approach
      const result = await this.simpleVideoMerge(
        options.baseVideoPath,
        options.personalizedSegmentPath,
        outputPath,
        options.segmentDuration
      );

      const processingTime = Date.now() - startTime;

      if (result.success) {
        console.log(`✅ Video merge completed: ${outputPath}`);
        
        const fileSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
        
        return {
          success: true,
          outputPath,
          fileSize,
          duration: baseVideoInfo.duration,
          processingTime
        };
      } else {
        throw new Error(result.error || 'Video merge failed');
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Error in video merge:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      };
    }
  }

  /**
   * 🔧 NEW: Simplified video merge approach
   */
  private async simpleVideoMerge(
    baseVideoPath: string,
    personalizedSegmentPath: string,
    outputPath: string,
    segmentDuration: number
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        console.log('🔄 Using simple video merge approach...');

        // 🔧 STRATEGY: Replace first N seconds with personalized segment
        // then append the rest of the base video
        
        const tempDir = path.join(path.dirname(outputPath), `temp-merge-${uuidv4()}`);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const remainingVideoPath = path.join(tempDir, 'remaining.mp4');
        const concatFilePath = path.join(tempDir, 'concat.txt');

        // Step 1: Extract remaining part of base video (after personalized segment)
        ffmpeg(baseVideoPath)
          .seekInput(segmentDuration)
          .output(remainingVideoPath)
          .on('end', () => {
            console.log('✅ Remaining video segment extracted');
            
            // Step 2: Create concat file
            const concatContent = [
              `file '${path.resolve(personalizedSegmentPath)}'`,
              `file '${path.resolve(remainingVideoPath)}'`
            ].join('\n');

            fs.writeFileSync(concatFilePath, concatContent);

            // Step 3: Concatenate videos
            ffmpeg()
              .input(concatFilePath)
              .inputOptions(['-f', 'concat', '-safe', '0'])
              .outputOptions([
                '-c:v libx264',
                '-c:a aac',
                '-preset fast',
                '-avoid_negative_ts make_zero'
              ])
              .output(outputPath)
              .on('start', (commandLine) => {
                console.log('🎬 Final concat started:', commandLine);
              })
              .on('progress', (progress) => {
                if (progress.percent) {
                  console.log(`⏱️ Merging: ${Math.round(progress.percent)}%`);
                }
              })
              .on('end', () => {
                console.log('✅ Video merge completed successfully');
                this.cleanupTempFiles(tempDir);
                resolve({ success: true });
              })
              .on('error', (error) => {
                console.error('❌ Concat error:', error);
                this.cleanupTempFiles(tempDir);
                resolve({ success: false, error: error.message });
              })
              .run();
          })
          .on('error', (error) => {
            console.error('❌ Remaining video extraction error:', error);
            this.cleanupTempFiles(tempDir);
            resolve({ success: false, error: error.message });
          })
          .run();

      } catch (error) {
        console.error('❌ Simple merge error:', error);
        resolve({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });
  }

  /**
   * 🔧 ALTERNATIVE: Even simpler merge using filter_complex
   */
  async mergeVideoWithFilterComplex(
    baseVideoPath: string,
    personalizedSegmentPath: string,
    outputPath: string,
    segmentDuration: number
  ): Promise<MergeVideoResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      try {
        console.log('🔄 Using filter_complex merge...');

        ffmpeg()
          .input(personalizedSegmentPath)
          .input(baseVideoPath)
          .complexFilter([
            // Trim the base video to start after the personalized segment
            `[1:v]trim=start=${segmentDuration}[trimmed_v]`,
            `[1:a]atrim=start=${segmentDuration}[trimmed_a]`,
            // Concatenate personalized segment with trimmed base video
            `[0:v][0:a][trimmed_v][trimmed_a]concat=n=2:v=1:a=1[outv][outa]`
          ])
          .outputOptions([
            '-map [outv]',
            '-map [outa]',
            '-c:v libx264',
            '-c:a aac',
            '-preset fast'
          ])
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('🎬 Filter complex started:', commandLine);
          })
          .on('progress', (progress) => {
            if (progress.percent) {
              console.log(`⏱️ Processing: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', () => {
            const processingTime = Date.now() - startTime;
            const fileSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
            
            console.log('✅ Filter complex merge completed');
            resolve({
              success: true,
              outputPath,
              fileSize,
              processingTime
            });
          })
          .on('error', (error) => {
            const processingTime = Date.now() - startTime;
            console.error('❌ Filter complex error:', error);
            resolve({
              success: false,
              error: error.message,
              processingTime
            });
          })
          .run();

      } catch (error) {
        const processingTime = Date.now() - startTime;
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime
        });
      }
    });
  }

  /**
   * Merge multiple videos in sequence
   */
  async mergeMultipleVideos(videoPaths: string[], outputPath: string): Promise<MergeVideoResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      try {
        console.log(`🔗 Merging ${videoPaths.length} videos...`);

        // Validate all input files
        for (const videoPath of videoPaths) {
          if (!fs.existsSync(videoPath)) {
            throw new Error(`Video not found: ${videoPath}`);
          }
        }

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Create concat file
        const concatFilePath = path.join(outputDir, `concat-${uuidv4()}.txt`);
        const concatContent = videoPaths
          .map(videoPath => `file '${path.resolve(videoPath)}'`)
          .join('\n');

        fs.writeFileSync(concatFilePath, concatContent);

        ffmpeg()
          .input(concatFilePath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions([
            '-c:v libx264',
            '-c:a aac',
            '-preset fast'
          ])
          .output(outputPath)
          .on('end', () => {
            const processingTime = Date.now() - startTime;
            // Clean up concat file
            if (fs.existsSync(concatFilePath)) {
              fs.unlinkSync(concatFilePath);
            }
            
            const fileSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
            
            console.log(`✅ Multiple videos merged: ${outputPath}`);
            resolve({
              success: true,
              outputPath,
              fileSize,
              processingTime
            });
          })
          .on('error', (error) => {
            const processingTime = Date.now() - startTime;
            // Clean up concat file on error
            if (fs.existsSync(concatFilePath)) {
              fs.unlinkSync(concatFilePath);
            }
            console.error('❌ Multiple video merge error:', error);
            resolve({
              success: false,
              error: error.message,
              processingTime
            });
          })
          .run();

      } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('❌ Error in mergeMultipleVideos:', error);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime
        });
      }
    });
  }

  /**
   * 🔧 FIXED: Get video information
   */
  async getVideoInfo(videoPath: string): Promise<VideoInfo> {
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

          // 🔧 FIXED: Safe frame rate calculation
          let fps = 0;
          if (videoStream.r_frame_rate) {
            const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
            if (den && den !== 0) {
              fps = num / den;
            }
          }

          resolve({
            duration: metadata.format.duration || 0,
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            bitrate: parseInt(metadata.format.bit_rate || '0'),
            fps
          });
        });
      } catch (error) {
        console.error('❌ Error getting video info:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate output path for merged video
   */
  private generateOutputPath(): string {
    const outputDir = path.join(process.env.UPLOAD_PATH || './uploads', 'video-merger');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    return path.join(outputDir, `merged-video-${uuidv4()}.mp4`);
  }

  /**
   * Clean up temporary files
   */
  private cleanupTempFiles(tempDir: string): void {
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        fs.rmdirSync(tempDir);
        console.log(`🧹 Cleaned up temp directory: ${tempDir}`);
      }
    } catch (error) {
      console.warn('⚠️ Error cleaning up temp files:', error);
    }
  }

  /**
   * 🔧 FIXED: Create video with fade transitions
   */
  async createVideoWithFadeTransitions(
    videoPaths: string[],
    outputPath: string,
    transitionDuration: number = 1
  ): Promise<MergeVideoResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      try {
        console.log(`🎞️ Creating video with fade transitions...`);

        if (videoPaths.length < 2) {
          throw new Error('Need at least 2 videos for fade transitions');
        }

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // For 2 videos, use crossfade
        if (videoPaths.length === 2) {
          ffmpeg()
            .input(videoPaths[0])
            .input(videoPaths[1])
            .complexFilter([
              `[0:v][1:v]xfade=transition=fade:duration=${transitionDuration}:offset=5[v]`,
              `[0:a][1:a]acrossfade=d=${transitionDuration}:c1=tri:c2=tri[a]`
            ])
            .outputOptions(['-map', '[v]', '-map', '[a]'])
            .output(outputPath)
            .on('end', () => {
              const processingTime = Date.now() - startTime;
              const fileSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
              console.log(`✅ Video with fade transitions created: ${outputPath}`);
              resolve({
                success: true,
                outputPath,
                fileSize,
                processingTime
              });
            })
            .on('error', (error) => {
              const processingTime = Date.now() - startTime;
              console.error('❌ Fade transition error:', error);
              resolve({
                success: false,
                error: error.message,
                processingTime
              });
            })
            .run();
        } else {
          // Fallback to simple concatenation
          this.mergeMultipleVideos(videoPaths, outputPath).then(resolve);
        }

      } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('❌ Error creating fade transitions:', error);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime
        });
      }
    });
  }
}

export default new VideoMergerService();

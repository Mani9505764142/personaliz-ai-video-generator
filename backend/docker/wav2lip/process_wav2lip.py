#!/usr/bin/env python3
"""
Wav2Lip Processing Script
Processes video and audio files to create lip-synced output
"""

import os
import sys
import argparse
import subprocess
import json
from pathlib import Path

def process_wav2lip(video_path, audio_path, output_path, duration=5):
    """
    Process video and audio using Wav2Lip
    
    Args:
        video_path (str): Path to input video file
        audio_path (str): Path to input audio file
        output_path (str): Path to output video file
        duration (int): Duration in seconds to process (default: 5)
    """
    try:
        print(f"🎬 Starting Wav2Lip processing...")
        print(f"📹 Video: {video_path}")
        print(f"🎵 Audio: {audio_path}")
        print(f"⏱️ Duration: {duration} seconds")
        print(f"📤 Output: {output_path}")
        
        # Check if input files exist
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Prepare the Wav2Lip command
        cmd = [
            "python", "inference.py",
            "--checkpoint_path", "checkpoints/wav2lip_gan.pth",
            "--face", video_path,
            "--audio", audio_path,
            "--outfile", output_path,
            "--static", "False",
            "--fps", "25",
            "--pads", "0", "10", "0", "0"
        ]
        
        print(f"🚀 Running command: {' '.join(cmd)}")
        
        # Run Wav2Lip
        result = subprocess.run(cmd, capture_output=True, text=True, cwd="/app")
        
        if result.returncode != 0:
            print(f"❌ Wav2Lip failed with return code: {result.returncode}")
            print(f"STDERR: {result.stderr}")
            raise RuntimeError(f"Wav2Lip processing failed: {result.stderr}")
        
        print(f"✅ Wav2Lip processing completed successfully!")
        print(f"📁 Output file: {output_path}")
        
        # Check if output file was created
        if not os.path.exists(output_path):
            raise FileNotFoundError(f"Output file was not created: {output_path}")
        
        # Get file size
        file_size = os.path.getsize(output_path)
        print(f"📊 Output file size: {file_size / (1024*1024):.2f} MB")
        
        return {
            "success": True,
            "output_path": output_path,
            "file_size": file_size,
            "duration": duration
        }
        
    except Exception as e:
        print(f"❌ Error in Wav2Lip processing: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def trim_audio_to_duration(audio_path, duration, output_path):
    """
    Trim audio to specified duration using FFmpeg
    """
    try:
        print(f"✂️ Trimming audio to {duration} seconds...")
        
        cmd = [
            "ffmpeg", "-y",
            "-i", audio_path,
            "-t", str(duration),
            "-c", "copy",
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise RuntimeError(f"Audio trimming failed: {result.stderr}")
        
        print(f"✅ Audio trimmed successfully: {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error trimming audio: {str(e)}")
        return False

def trim_video_to_duration(video_path, duration, output_path):
    """
    Trim video to specified duration using FFmpeg
    """
    try:
        print(f"✂️ Trimming video to {duration} seconds...")
        
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-t", str(duration),
            "-c", "copy",
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise RuntimeError(f"Video trimming failed: {result.stderr}")
        
        print(f"✅ Video trimmed successfully: {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error trimming video: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Process video and audio with Wav2Lip')
    parser.add_argument('--video', required=True, help='Path to input video file')
    parser.add_argument('--audio', required=True, help='Path to input audio file')
    parser.add_argument('--output', required=True, help='Path to output video file')
    parser.add_argument('--duration', type=int, default=5, help='Duration in seconds (default: 5)')
    parser.add_argument('--trim-inputs', action='store_true', help='Trim input files to duration before processing')
    
    args = parser.parse_args()
    
    try:
        # Create temporary files if trimming is requested
        video_path = args.video
        audio_path = args.audio
        
        if args.trim_inputs:
            # Create temporary trimmed files
            temp_video = f"/tmp/trimmed_video_{os.getpid()}.mp4"
            temp_audio = f"/tmp/trimmed_audio_{os.getpid()}.wav"
            
            # Trim video and audio
            if not trim_video_to_duration(args.video, args.duration, temp_video):
                sys.exit(1)
            
            if not trim_audio_to_duration(args.audio, args.duration, temp_audio):
                sys.exit(1)
            
            video_path = temp_video
            audio_path = temp_audio
        
        # Process with Wav2Lip
        result = process_wav2lip(video_path, audio_path, args.output, args.duration)
        
        # Clean up temporary files
        if args.trim_inputs:
            for temp_file in [video_path, audio_path]:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
        if not result["success"]:
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Fatal error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()

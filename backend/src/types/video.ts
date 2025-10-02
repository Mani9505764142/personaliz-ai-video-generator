// Video Generation API Types

export interface GenerateVideoRequest {
  name: string;
  city: string;
  phone: string;
}

export interface GenerateVideoResponse {
  videoId: string;
  status: string;
  message: string;
}

export interface VideoStatusResponse {
  id: string;
  status: string;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  progress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoListResponse {
  videos: VideoRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface VideoRequest {
  id: string;
  name: string;
  city: string;
  phone: string;
  audioUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export type VideoStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface VideoGenerationMetadata {
  name: string;
  city: string;
  phone: string;
  personalizedText: string;
  audioPath: string;
  baseVideoPath: string;
  processedVideoPath: string;
  duration?: number;
  quality?: string;
  fileSize?: number;
}

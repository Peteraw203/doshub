export interface Video {
  videoId: string;
  title: string;
  videoUrl: string;
  uploadTime: string;
  likes: number;
  creator?: string;
  uploader?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileName: string;
}

export interface VideosResponse {
  videos: Video[];
}

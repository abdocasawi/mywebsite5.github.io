export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category: string;
  country: string;
  language: string;
  description?: string;
}

export interface StreamStatus {
  isLoading: boolean;
  isLive: boolean;
  error: string | null;
  quality: string;
  bitrate?: number;
}

export interface PlayerSettings {
  volume: number;
  muted: boolean;
  fullscreen: boolean;
  pictureInPicture: boolean;
  autoplay: boolean;
}

export interface StreamInfo {
  protocol: string;
  codec: string;
  resolution: string;
  bitrate: number;
  fps: number;
  type: string;
  url: string;
}
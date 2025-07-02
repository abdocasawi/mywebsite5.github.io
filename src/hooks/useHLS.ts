import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { StreamStatus } from '../types';

export const useHLS = (url: string, videoRef: React.RefObject<HTMLVideoElement>) => {
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<StreamStatus>({
    isLoading: false,
    isLive: false,
    error: null,
    quality: 'auto'
  });

  const cleanup = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const initializeHLS = useCallback(() => {
    if (!videoRef.current || !url) return;

    const video = videoRef.current;
    
    // Clean up any existing HLS instance
    cleanup();
    
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    // Check if HLS is supported natively
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      setStatus(prev => ({ ...prev, isLoading: false, isLive: true }));
      return;
    }

    // Use HLS.js for other browsers
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxLoadingDelay: 4,
        maxBufferLength: 30,
        maxMaxBufferLength: 600
      });

      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus(prev => ({ 
          ...prev, 
          isLoading: false, 
          isLive: true,
          quality: 'auto'
        }));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', { event, data });
        
        if (data.fatal) {
          let errorMessage = 'Stream failed to load';
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              errorMessage = 'Network error - Check your internet connection';
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              errorMessage = 'Media error - Stream format not supported';
              break;
            case Hls.ErrorTypes.MUX_ERROR:
              errorMessage = 'Stream parsing error';
              break;
            default:
              errorMessage = data.details || 'Unknown stream error';
          }
          
          setStatus(prev => ({ 
            ...prev, 
            isLoading: false, 
            isLive: false,
            error: errorMessage
          }));
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        setStatus(prev => ({ 
          ...prev, 
          quality: level ? `${level.height}p` : 'auto',
          bitrate: level?.bitrate
        }));
      });

    } else {
      setStatus(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'HLS not supported in this browser'
      }));
    }
  }, [url, videoRef, cleanup]);

  useEffect(() => {
    initializeHLS();
    return cleanup;
  }, [initializeHLS, cleanup]);

  const retry = useCallback(() => {
    initializeHLS();
  }, [initializeHLS]);

  const changeQuality = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
    }
  };

  const getQualityLevels = () => {
    return hlsRef.current?.levels || [];
  };

  return {
    status,
    changeQuality,
    getQualityLevels,
    retry,
    hls: hlsRef.current
  };
};
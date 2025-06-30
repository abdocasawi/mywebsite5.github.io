import { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    if (!videoRef.current || !url) return;

    const video = videoRef.current;
    
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
        lowLatencyMode: false
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
        // Only log fatal errors to avoid console spam from non-fatal buffering issues
        if (data.fatal) {
          console.error('HLS Fatal Error:', data);
          setStatus(prev => ({ 
            ...prev, 
            isLoading: false, 
            isLive: false,
            error: data.details || 'Stream error'
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

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url, videoRef]);

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
    hls: hlsRef.current
  };
};
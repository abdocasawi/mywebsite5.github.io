import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { StreamStatus } from '../types';

interface UniversalPlayerConfig {
  enableHLS: boolean;
  enableDASH: boolean;
  enableWebRTC: boolean;
  enableMSE: boolean;
  maxRetries: number;
  retryDelay: number;
}

export const useUniversalPlayer = (
  url: string, 
  videoRef: React.RefObject<HTMLVideoElement>,
  config: Partial<UniversalPlayerConfig> = {}
) => {
  const hlsRef = useRef<Hls | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const defaultConfig: UniversalPlayerConfig = {
    enableHLS: true,
    enableDASH: true,
    enableWebRTC: true,
    enableMSE: true,
    maxRetries: 3,
    retryDelay: 2000,
    ...config
  };

  const [status, setStatus] = useState<StreamStatus>({
    isLoading: false,
    isLive: false,
    error: null,
    quality: 'auto'
  });

  const [streamInfo, setStreamInfo] = useState({
    protocol: '',
    codec: '',
    resolution: '',
    bitrate: 0,
    fps: 0
  });

  const cleanup = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    retryCountRef.current = 0;
  }, []);

  const detectStreamType = useCallback((url: string) => {
    const urlLower = url.toLowerCase();
    
    // HLS Detection
    if (urlLower.includes('.m3u8') || urlLower.includes('/hls/') || urlLower.includes('m3u8')) {
      return 'hls';
    }
    
    // DASH Detection
    if (urlLower.includes('.mpd') || urlLower.includes('/dash/')) {
      return 'dash';
    }
    
    // WebRTC Detection
    if (urlLower.startsWith('webrtc://') || urlLower.includes('webrtc')) {
      return 'webrtc';
    }
    
    // RTMP Detection
    if (urlLower.startsWith('rtmp://') || urlLower.startsWith('rtmps://')) {
      return 'rtmp';
    }
    
    // Direct video file detection
    if (urlLower.match(/\.(mp4|webm|ogg|avi|mkv|mov|flv|ts)(\?|$)/)) {
      return 'direct';
    }
    
    // Default to HLS for unknown formats (many IPTV streams)
    return 'hls';
  }, []);

  const initializeHLSPlayer = useCallback((url: string) => {
    if (!videoRef.current) return false;

    const video = videoRef.current;
    
    // Check if HLS is supported natively (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      setStreamInfo(prev => ({ ...prev, protocol: 'HLS (Native)' }));
      return true;
    }

    // Use HLS.js for other browsers
    if (Hls.isSupported() && defaultConfig.enableHLS) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxLoadingDelay: 4,
        maxBufferHole: 0.5,
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.1,
        nudgeMaxRetry: 3,
        maxFragLookUpTolerance: 0.25,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        liveDurationInfinity: true,
        enableSoftwareAES: true,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 1000,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 4,
        levelLoadingRetryDelay: 1000,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 1000,
        startFragPrefetch: true,
        testBandwidth: true,
        progressive: false,
        xhrSetup: (xhr: XMLHttpRequest, url: string) => {
          // Add CORS headers for better compatibility
          xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
          xhr.setRequestHeader('Access-Control-Allow-Headers', '*');
        }
      });

      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      // Enhanced event handling
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setStreamInfo(prev => ({
          ...prev,
          protocol: 'HLS.js',
          codec: data.levels[0]?.codecSet || 'Unknown'
        }));
        
        setStatus(prev => ({ 
          ...prev, 
          isLoading: false, 
          isLive: true,
          quality: 'auto'
        }));
        
        retryCountRef.current = 0;
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        if (level) {
          setStreamInfo(prev => ({
            ...prev,
            resolution: `${level.width}x${level.height}`,
            bitrate: level.bitrate,
            fps: level.frameRate || 0
          }));
          
          setStatus(prev => ({ 
            ...prev, 
            quality: `${level.height}p`,
            bitrate: level.bitrate
          }));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', { event, data, url });
        
        if (data.fatal) {
          let errorMessage = 'Stream failed to load';
          let shouldRetry = false;
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              errorMessage = 'Network error - Check connection or try different server';
              shouldRetry = true;
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              errorMessage = 'Media error - Stream format may not be supported';
              shouldRetry = true;
              break;
            case Hls.ErrorTypes.MUX_ERROR:
              errorMessage = 'Stream parsing error - Invalid format';
              break;
            case Hls.ErrorTypes.OTHER_ERROR:
              errorMessage = 'Unknown error - Stream may be offline';
              shouldRetry = true;
              break;
            default:
              errorMessage = data.details || 'Unknown stream error';
              shouldRetry = true;
          }
          
          // Auto-retry logic
          if (shouldRetry && retryCountRef.current < defaultConfig.maxRetries) {
            retryCountRef.current++;
            setStatus(prev => ({ 
              ...prev, 
              isLoading: true,
              error: `${errorMessage} (Retry ${retryCountRef.current}/${defaultConfig.maxRetries})`
            }));
            
            retryTimeoutRef.current = setTimeout(() => {
              if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
              }
              initializePlayer();
            }, defaultConfig.retryDelay * retryCountRef.current);
          } else {
            setStatus(prev => ({ 
              ...prev, 
              isLoading: false, 
              isLive: false,
              error: errorMessage
            }));
          }
        } else {
          // Non-fatal errors - just log them
          console.warn('HLS Non-fatal error:', data);
        }
      });

      // Additional events for better monitoring
      hls.on(Hls.Events.FRAG_LOADED, () => {
        setStatus(prev => ({ ...prev, isLive: true }));
      });

      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        setStatus(prev => ({ ...prev, isLive: true }));
      });

      return true;
    }

    return false;
  }, [videoRef, defaultConfig]);

  const initializeDASHPlayer = useCallback((url: string) => {
    // DASH support would require dash.js library
    // For now, fallback to native video element
    if (!videoRef.current) return false;
    
    try {
      videoRef.current.src = url;
      setStreamInfo(prev => ({ ...prev, protocol: 'DASH (Native)' }));
      return true;
    } catch (error) {
      return false;
    }
  }, [videoRef]);

  const initializeDirectVideo = useCallback((url: string) => {
    if (!videoRef.current) return false;
    
    try {
      videoRef.current.src = url;
      setStreamInfo(prev => ({ ...prev, protocol: 'Direct Video' }));
      return true;
    } catch (error) {
      return false;
    }
  }, [videoRef]);

  const initializePlayer = useCallback(() => {
    if (!videoRef.current || !url) return;

    const video = videoRef.current;
    
    // Clean up any existing instances
    cleanup();
    
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));
    setStreamInfo({ protocol: '', codec: '', resolution: '', bitrate: 0, fps: 0 });

    const streamType = detectStreamType(url);
    let initialized = false;

    switch (streamType) {
      case 'hls':
        initialized = initializeHLSPlayer(url);
        break;
      case 'dash':
        initialized = initializeDASHPlayer(url);
        break;
      case 'direct':
        initialized = initializeDirectVideo(url);
        break;
      case 'rtmp':
        // RTMP requires special handling or Flash (deprecated)
        setStatus(prev => ({ 
          ...prev, 
          isLoading: false,
          error: 'RTMP streams require special player support'
        }));
        return;
      case 'webrtc':
        // WebRTC requires special handling
        setStatus(prev => ({ 
          ...prev, 
          isLoading: false,
          error: 'WebRTC streams require special player support'
        }));
        return;
      default:
        // Try HLS as fallback for unknown formats
        initialized = initializeHLSPlayer(url);
    }

    if (!initialized) {
      setStatus(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Stream format not supported by this browser'
      }));
    }

    // Set up video element event listeners
    const handleLoadStart = () => setStatus(prev => ({ ...prev, isLoading: true }));
    const handleCanPlay = () => {
      setStatus(prev => ({ ...prev, isLoading: false, isLive: true }));
      if (defaultConfig.enableMSE && video.readyState >= 2) {
        // Auto-play if configured
        video.play().catch(console.error);
      }
    };
    const handleError = () => {
      setStatus(prev => ({ 
        ...prev, 
        isLoading: false, 
        isLive: false,
        error: 'Video playback error'
      }));
    };
    const handleLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setStreamInfo(prev => ({
          ...prev,
          resolution: `${video.videoWidth}x${video.videoHeight}`
        }));
      }
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [url, videoRef, cleanup, detectStreamType, initializeHLSPlayer, initializeDASHPlayer, initializeDirectVideo, defaultConfig]);

  useEffect(() => {
    const cleanupFn = initializePlayer();
    return () => {
      cleanup();
      if (cleanupFn) cleanupFn();
    };
  }, [initializePlayer, cleanup]);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    initializePlayer();
  }, [initializePlayer]);

  const changeQuality = useCallback((levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
    }
  }, []);

  const getQualityLevels = useCallback(() => {
    return hlsRef.current?.levels || [];
  }, []);

  const getStreamInfo = useCallback(() => {
    return {
      ...streamInfo,
      type: detectStreamType(url),
      url: url
    };
  }, [streamInfo, detectStreamType, url]);

  return {
    status,
    streamInfo: getStreamInfo(),
    changeQuality,
    getQualityLevels,
    retry,
    hls: hlsRef.current
  };
};
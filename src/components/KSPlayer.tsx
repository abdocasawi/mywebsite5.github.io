import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, 
  PictureInPicture2, RefreshCw, AlertCircle, Info, Wifi, WifiOff,
  Monitor, Signal, Zap
} from 'lucide-react';
import { Channel, PlayerSettings } from '../types';

// KSPlayer types
declare global {
  interface Window {
    KSPlayer: any;
  }
}

interface KSPlayerProps {
  channel: Channel | null;
  onChannelEnd?: () => void;
}

const KSPlayer: React.FC<KSPlayerProps> = ({ channel, onChannelEnd }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const ksPlayerInstance = useRef<any>(null);
  const bufferCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showStreamInfo, setShowStreamInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ksPlayerReady, setKsPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [bufferHealth, setBufferHealth] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('offline');
  const [streamInfo, setStreamInfo] = useState({
    type: '',
    protocol: '',
    codec: '',
    resolution: '',
    quality: '',
    bitrate: 0,
    fps: 0,
    bufferLength: 0
  });
  const [settings, setSettings] = useState<PlayerSettings>({
    volume: 1,
    muted: false,
    fullscreen: false,
    pictureInPicture: false,
    autoplay: true
  });

  // Load KSPlayer script
  useEffect(() => {
    const loadKSPlayer = () => {
      if (window.KSPlayer) {
        setKsPlayerReady(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/ksplayer@latest/dist/ksplayer.min.js';
      script.async = true;
      script.onload = () => {
        setKsPlayerReady(true);
      };
      script.onerror = () => {
        setError('Failed to load KSPlayer library');
      };
      document.head.appendChild(script);

      // Also load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/ksplayer@latest/dist/ksplayer.min.css';
      document.head.appendChild(link);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      };
    };

    loadKSPlayer();
  }, []);

  // Detect stream format
  const detectStreamFormat = (url: string) => {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('.m3u8')) return 'hls';
    if (urlLower.includes('.mpd')) return 'dash';
    if (urlLower.includes('.mp4')) return 'mp4';
    if (urlLower.includes('.webm')) return 'webm';
    if (urlLower.includes('.flv')) return 'flv';
    if (urlLower.includes('rtmp://')) return 'rtmp';
    
    // Default to HLS for IPTV streams
    return 'hls';
  };

  // Buffer monitoring
  useEffect(() => {
    if (ksPlayerInstance.current && isPlaying) {
      bufferCheckInterval.current = setInterval(() => {
        try {
          const player = ksPlayerInstance.current;
          if (player && player.buffered && player.currentTime) {
            const buffered = player.buffered;
            const currentTime = player.currentTime;
            let bufferLength = 0;
            
            // Calculate buffer length
            for (let i = 0; i < buffered.length; i++) {
              if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
                bufferLength = buffered.end(i) - currentTime;
                break;
              }
            }
            
            setStreamInfo(prev => ({ ...prev, bufferLength }));
            setBufferHealth(Math.min(100, (bufferLength / 10) * 100)); // 10 seconds = 100%
            
            // Update connection quality based on buffer health
            if (bufferLength > 8) {
              setConnectionQuality('excellent');
            } else if (bufferLength > 5) {
              setConnectionQuality('good');
            } else if (bufferLength > 2) {
              setConnectionQuality('poor');
            } else {
              setConnectionQuality('offline');
            }
          }
        } catch (e) {
          console.error('Buffer monitoring error:', e);
        }
      }, 1000);
    } else {
      if (bufferCheckInterval.current) {
        clearInterval(bufferCheckInterval.current);
        bufferCheckInterval.current = null;
      }
    }

    return () => {
      if (bufferCheckInterval.current) {
        clearInterval(bufferCheckInterval.current);
        bufferCheckInterval.current = null;
      }
    };
  }, [isPlaying]);

  // Initialize KSPlayer
  useEffect(() => {
    if (!ksPlayerReady || !channel || !playerRef.current) return;

    setIsLoading(true);
    setError(null);
    setRetryCount(0);
    setIsBuffering(false);

    const initializePlayer = () => {
      try {
        // Destroy existing player instance
        if (ksPlayerInstance.current) {
          ksPlayerInstance.current.destroy();
          ksPlayerInstance.current = null;
        }

        const streamFormat = detectStreamFormat(channel.url);
        
        // Enhanced KSPlayer configuration
        const playerConfig = {
          container: playerRef.current,
          video: {
            url: channel.url,
            type: streamFormat,
            title: channel.name,
            poster: channel.logo || 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800'
          },
          autoplay: settings.autoplay,
          muted: settings.muted,
          volume: settings.volume,
          controls: false, // We'll use custom controls
          
          // Enhanced streaming configuration
          hls: {
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
            maxLoadingDelay: 4,
            maxBufferHole: 0.5,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
            manifestLoadingTimeOut: 10000,
            manifestLoadingMaxRetry: 4,
            fragLoadingTimeOut: 20000,
            fragLoadingMaxRetry: 6
          },
          
          // DASH configuration
          dash: {
            enableWorker: true,
            bufferTimeAtTopQuality: 30,
            bufferTimeAtTopQualityLongForm: 60,
            initialBufferLevel: 20,
            stableBufferTime: 12,
            bufferTimeAtTopQualityLongForm: 60
          },
          
          // Network optimization
          network: {
            timeout: 15000,
            retries: 5,
            retryDelay: 1000
          },
          
          // UI customization
          ui: {
            theme: 'dark',
            primaryColor: '#8b5cf6',
            controlBar: false,
            contextMenu: false
          },
          
          // Quality settings
          quality: {
            auto: true,
            default: 'auto'
          }
        };

        // Create KSPlayer instance
        ksPlayerInstance.current = new window.KSPlayer(playerConfig);

        // Enhanced event listeners
        ksPlayerInstance.current.on('ready', () => {
          console.log('KSPlayer ready');
          setIsLoading(false);
          setStreamInfo(prev => ({ 
            ...prev, 
            type: streamFormat,
            protocol: 'KSPlayer'
          }));
          setConnectionQuality('good');
        });

        ksPlayerInstance.current.on('play', () => {
          setIsPlaying(true);
          setError(null);
          setIsBuffering(false);
          setConnectionQuality('good');
        });

        ksPlayerInstance.current.on('pause', () => {
          setIsPlaying(false);
          setIsBuffering(false);
        });

        ksPlayerInstance.current.on('waiting', () => {
          setIsBuffering(true);
          console.log('Buffering started...');
        });

        ksPlayerInstance.current.on('canplay', () => {
          setIsBuffering(false);
          setIsLoading(false);
        });

        ksPlayerInstance.current.on('ended', () => {
          setIsPlaying(false);
          setIsBuffering(false);
          if (onChannelEnd) {
            onChannelEnd();
          }
        });

        ksPlayerInstance.current.on('error', (event: any) => {
          console.error('KSPlayer error:', event);
          setIsLoading(false);
          setIsPlaying(false);
          setIsBuffering(false);
          setConnectionQuality('offline');
          
          let errorMessage = 'Stream playback failed';
          
          if (event.message) {
            if (event.message.includes('network') || event.message.includes('timeout')) {
              errorMessage = 'Network timeout - Check your connection or try again';
            } else if (event.message.includes('decode') || event.message.includes('format')) {
              errorMessage = 'Stream format not supported - Try different quality';
            } else if (event.message.includes('load') || event.message.includes('404')) {
              errorMessage = 'Stream not found - URL may be invalid or offline';
            } else if (event.message.includes('cors') || event.message.includes('origin')) {
              errorMessage = 'Access denied - Stream may require authentication';
            } else {
              errorMessage = event.message;
            }
          }
          
          setError(errorMessage);
          
          // Auto-retry for network errors
          if (retryCount < 3 && (event.message?.includes('network') || event.message?.includes('timeout'))) {
            setTimeout(() => {
              retryConnection();
            }, 3000);
          }
        });

        ksPlayerInstance.current.on('timeupdate', () => {
          if (ksPlayerInstance.current) {
            setCurrentTime(ksPlayerInstance.current.currentTime || 0);
            setDuration(ksPlayerInstance.current.duration || 0);
          }
        });

        ksPlayerInstance.current.on('qualitychange', (event: any) => {
          if (event.quality) {
            setStreamInfo(prev => ({
              ...prev,
              quality: event.quality.label || `${event.quality.height}p`,
              bitrate: event.quality.bitrate || 0,
              resolution: event.quality.width && event.quality.height ? 
                `${event.quality.width}x${event.quality.height}` : ''
            }));
          }
        });

        ksPlayerInstance.current.on('loadedmetadata', () => {
          const player = ksPlayerInstance.current;
          if (player && player.videoWidth && player.videoHeight) {
            setStreamInfo(prev => ({
              ...prev,
              resolution: `${player.videoWidth}x${player.videoHeight}`,
              fps: player.getVideoPlaybackQuality?.()?.totalVideoFrames || 0
            }));
          }
        });

      } catch (e) {
        console.error('KSPlayer initialization error:', e);
        setError('Failed to initialize KSPlayer');
        setIsLoading(false);
        setConnectionQuality('offline');
      }
    };

    initializePlayer();

    return () => {
      if (ksPlayerInstance.current) {
        try {
          ksPlayerInstance.current.destroy();
          ksPlayerInstance.current = null;
        } catch (e) {
          console.error('Error removing KSPlayer:', e);
        }
      }
      if (bufferCheckInterval.current) {
        clearInterval(bufferCheckInterval.current);
        bufferCheckInterval.current = null;
      }
    };
  }, [ksPlayerReady, channel, settings.autoplay, settings.muted, settings.volume]);

  // Auto-hide controls
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setShowControls(false), 3000);
    };

    const container = playerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(timeoutId);
      };
    }
  }, []);

  const togglePlay = () => {
    try {
      if (ksPlayerInstance.current) {
        if (isPlaying) {
          ksPlayerInstance.current.pause();
        } else {
          ksPlayerInstance.current.play();
        }
      }
    } catch (e) {
      console.error('KSPlayer play/pause error:', e);
    }
  };

  const toggleMute = () => {
    try {
      if (ksPlayerInstance.current) {
        const newMuted = !settings.muted;
        ksPlayerInstance.current.muted = newMuted;
        setSettings(prev => ({ ...prev, muted: newMuted }));
      }
    } catch (e) {
      console.error('KSPlayer mute error:', e);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    try {
      if (ksPlayerInstance.current) {
        ksPlayerInstance.current.volume = volume;
        setSettings(prev => ({ ...prev, volume, muted: volume === 0 }));
      }
    } catch (e) {
      console.error('KSPlayer volume error:', e);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    try {
      if (ksPlayerInstance.current) {
        ksPlayerInstance.current.currentTime = time;
        setCurrentTime(time);
      }
    } catch (e) {
      console.error('KSPlayer seek error:', e);
    }
  };

  const toggleFullscreen = () => {
    try {
      if (ksPlayerInstance.current) {
        if (ksPlayerInstance.current.isFullscreen) {
          ksPlayerInstance.current.exitFullscreen();
        } else {
          ksPlayerInstance.current.requestFullscreen();
        }
        setSettings(prev => ({ ...prev, fullscreen: !prev.fullscreen }));
      }
    } catch (e) {
      console.error('KSPlayer fullscreen error:', e);
    }
  };

  const retryConnection = () => {
    if (retryCount < 5) {
      setRetryCount(prev => prev + 1);
      setError(null);
      setIsLoading(true);
      setIsBuffering(false);
      
      // Force re-initialization with delay
      setTimeout(() => {
        if (ksPlayerInstance.current) {
          try {
            ksPlayerInstance.current.src = channel?.url;
            ksPlayerInstance.current.load();
            ksPlayerInstance.current.play();
          } catch (e) {
            setError('Retry failed - Stream may be offline');
            setIsLoading(false);
            setConnectionQuality('offline');
          }
        }
      }, 1000 * retryCount);
    } else {
      setError('Maximum retry attempts reached - Stream may be offline');
      setConnectionQuality('offline');
    }
  };

  const getStreamTypeIcon = () => {
    switch (streamInfo.type) {
      case 'hls': return <Zap className="w-4 h-4" />;
      case 'dash': return <Signal className="w-4 h-4" />;
      case 'mp4': return <Monitor className="w-4 h-4" />;
      default: return <Play className="w-4 h-4" />;
    }
  };

  const getStreamTypeColor = () => {
    switch (streamInfo.type) {
      case 'hls': return 'text-purple-400';
      case 'dash': return 'text-blue-400';
      case 'mp4': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'excellent': return <Wifi className="w-4 h-4 text-green-400" />;
      case 'good': return <Wifi className="w-4 h-4 text-blue-400" />;
      case 'poor': return <Wifi className="w-4 h-4 text-yellow-400" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-red-400" />;
    }
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!channel) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select a channel to start streaming</p>
          <p className="text-sm mt-2">KSPlayer - Advanced IPTV Streaming</p>
        </div>
      </div>
    );
  }

  if (!ksPlayerReady) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg">Loading KSPlayer...</p>
          <p className="text-sm text-gray-400 mt-2">Initializing advanced streaming engine</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
      {/* KSPlayer Container */}
      <div ref={playerRef} className="w-full h-full" />

      {/* Loading/Buffering Overlay */}
      {(isLoading || isBuffering) && !error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg">{isBuffering ? 'Buffering...' : 'Loading stream...'}</p>
            <p className="text-sm text-gray-400 mt-2">
              {isBuffering ? 'Optimizing stream quality' : `KSPlayer initializing ${streamInfo.type.toUpperCase()} stream`}
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-yellow-400 mt-2">Retry attempt {retryCount}/5</p>
            )}
            {isBuffering && bufferHealth > 0 && (
              <div className="mt-3">
                <div className="w-32 bg-gray-700 rounded-full h-2 mx-auto">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${bufferHealth}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Buffer: {Math.round(bufferHealth)}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center p-6">
          <div className="text-center text-white max-w-md">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-3">KSPlayer Error</h3>
            <p className="text-gray-300 mb-6">{error}</p>
            
            <div className="space-y-4">
              {retryCount < 5 && (
                <button
                  onClick={retryConnection}
                  className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 mx-auto"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Retry Stream ({retryCount}/5)</span>
                </button>
              )}
              
              <div className="text-sm text-gray-400 space-y-2">
                <p className="font-medium">Troubleshooting:</p>
                <ul className="text-left space-y-1">
                  <li>• Check your internet connection speed</li>
                  <li>• Verify the stream URL is accessible</li>
                  <li>• Ensure the stream is currently live</li>
                  <li>• Try refreshing the page</li>
                  <li>• Contact your IPTV provider if issues persist</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Stream Info */}
      <div className="absolute top-4 left-4 space-y-2">
        <div className="bg-black bg-opacity-75 rounded-lg px-3 py-2 text-white text-sm">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              error ? 'bg-red-500' : 
              isLoading || isBuffering ? 'bg-yellow-500 animate-pulse' : 
              isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`}></div>
            <span className={getStreamTypeColor()}>
              KS {streamInfo.type.toUpperCase() || 'PLAYER'}
            </span>
            {streamInfo.quality && streamInfo.quality !== 'auto' && (
              <span className="text-gray-300">• {streamInfo.quality}</span>
            )}
          </div>
        </div>

        {/* Buffer and Connection Info */}
        <div className="bg-black bg-opacity-75 rounded-lg px-3 py-2 text-white text-xs">
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span>
              {connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1)}
              {streamInfo.bufferLength > 0 && ` • ${streamInfo.bufferLength.toFixed(1)}s buffer`}
              {streamInfo.bitrate > 0 && ` • ${Math.round(streamInfo.bitrate / 1000)}kbps`}
            </span>
          </div>
        </div>

        {/* Additional Stream Info */}
        {(streamInfo.resolution || streamInfo.fps > 0) && (
          <div className="bg-black bg-opacity-75 rounded-lg px-3 py-2 text-white text-xs">
            <div className="flex items-center space-x-2">
              {getStreamTypeIcon()}
              <span>
                {streamInfo.resolution && `${streamInfo.resolution}`}
                {streamInfo.fps > 0 && ` • ${streamInfo.fps}fps`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        
        {/* Channel Info */}
        <div className="absolute top-4 right-4 text-right text-white">
          <div className="flex items-center justify-end space-x-2 mb-1">
            <h3 className="text-lg font-semibold">{channel.name}</h3>
            <button
              onClick={() => setShowStreamInfo(!showStreamInfo)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title="Stream Information"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-300">{channel.category} • {channel.country}</p>
          
          {/* Detailed Stream Info Panel */}
          {showStreamInfo && (
            <div className="absolute right-0 top-12 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 min-w-64 text-left">
              <h4 className="font-semibold mb-3 text-center">Stream Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Engine:</span>
                  <span className="text-purple-400">KSPlayer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span className={getStreamTypeColor()}>{streamInfo.type?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Protocol:</span>
                  <span>{streamInfo.protocol || 'Unknown'}</span>
                </div>
                {streamInfo.codec && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Codec:</span>
                    <span>{streamInfo.codec}</span>
                  </div>
                )}
                {streamInfo.resolution && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Resolution:</span>
                    <span>{streamInfo.resolution}</span>
                  </div>
                )}
                {streamInfo.bitrate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bitrate:</span>
                    <span>{Math.round(streamInfo.bitrate / 1000)} kbps</span>
                  </div>
                )}
                {streamInfo.fps > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">FPS:</span>
                    <span>{streamInfo.fps}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={isPlaying ? 'text-green-400' : 'text-red-400'}>
                    {isPlaying ? 'Playing' : 'Stopped'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Play/Pause Button */}
        {!error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-4 transition-all duration-200 backdrop-blur-sm disabled:opacity-50"
            >
              {isLoading || isBuffering ? (
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
              ) : isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>
          </div>
        )}

        {/* Bottom Controls */}
        {!error && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress Bar */}
            {duration > 0 && (
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-300 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-white">
              
              {/* Left Controls */}
              <div className="flex items-center space-x-4">
                <button onClick={togglePlay} className="hover:text-purple-400 transition-colors" disabled={isLoading}>
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <div className="flex items-center space-x-2">
                  <button onClick={toggleMute} className="hover:text-purple-400 transition-colors">
                    {settings.muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.muted ? 0 : settings.volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Enhanced Connection Status */}
                <div className="flex items-center space-x-1 text-xs">
                  {getConnectionIcon()}
                  <span className={
                    connectionQuality === 'excellent' ? 'text-green-400' :
                    connectionQuality === 'good' ? 'text-blue-400' :
                    connectionQuality === 'poor' ? 'text-yellow-400' : 'text-red-400'
                  }>
                    {error ? 'Error' : 
                     isLoading || isBuffering ? 'Buffering' : 
                     isPlaying ? 'Live' : 'Ready'}
                  </span>
                  {isBuffering && bufferHealth > 0 && (
                    <span className="text-yellow-400">({Math.round(bufferHealth)}%)</span>
                  )}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center space-x-4">
                {retryCount < 5 && error && (
                  <button onClick={retryConnection} className="hover:text-purple-400 transition-colors">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}
                <button className="hover:text-purple-400 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                <button onClick={toggleFullscreen} className="hover:text-purple-400 transition-colors">
                  {settings.fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KSPlayer;
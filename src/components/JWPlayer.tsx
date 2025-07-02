import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, PictureInPicture2, RefreshCw, AlertCircle, Zap, Signal, Monitor, Wifi, WifiOff } from 'lucide-react';
import { Channel, PlayerSettings } from '../types';

// JW Player types
declare global {
  interface Window {
    jwplayer: any;
  }
}

interface JWPlayerProps {
  channel: Channel | null;
  onChannelEnd?: () => void;
}

const JWPlayer: React.FC<JWPlayerProps> = ({ channel, onChannelEnd }) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const jwPlayerInstance = useRef<any>(null);
  const bufferCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jwPlayerReady, setJwPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [bufferHealth, setBufferHealth] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('offline');
  const [streamInfo, setStreamInfo] = useState({
    type: '',
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

  // Load JW Player script
  useEffect(() => {
    const loadJWPlayer = () => {
      if (window.jwplayer) {
        setJwPlayerReady(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jwplayer.com/libraries/KB5zFt7A.js'; // Free JW Player
      script.async = true;
      script.onload = () => {
        setJwPlayerReady(true);
      };
      script.onerror = () => {
        setError('Failed to load JW Player library');
      };
      document.head.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    };

    loadJWPlayer();
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
    if (jwPlayerInstance.current && isPlaying) {
      bufferCheckInterval.current = setInterval(() => {
        try {
          const buffer = jwPlayerInstance.current.getBuffer();
          const position = jwPlayerInstance.current.getPosition();
          const bufferLength = buffer - position;
          
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
          
          // Auto-retry if buffer is critically low
          if (bufferLength < 1 && isPlaying && !isBuffering) {
            console.log('Buffer critically low, attempting recovery...');
            setIsBuffering(true);
            
            // Try to recover by seeking slightly forward
            setTimeout(() => {
              if (jwPlayerInstance.current) {
                try {
                  const currentPos = jwPlayerInstance.current.getPosition();
                  jwPlayerInstance.current.seek(currentPos + 0.1);
                } catch (e) {
                  console.error('Buffer recovery failed:', e);
                }
              }
              setIsBuffering(false);
            }, 2000);
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
  }, [isPlaying, isBuffering]);

  // Initialize JW Player
  useEffect(() => {
    if (!jwPlayerReady || !channel || !playerRef.current) return;

    setIsLoading(true);
    setError(null);
    setRetryCount(0);
    setIsBuffering(false);

    const initializePlayer = () => {
      try {
        // Destroy existing player instance
        if (jwPlayerInstance.current) {
          jwPlayerInstance.current.remove();
          jwPlayerInstance.current = null;
        }

        const streamFormat = detectStreamFormat(channel.url);
        
        // Enhanced JW Player configuration for better buffering
        const playerConfig = {
          file: channel.url,
          title: channel.name,
          description: channel.description || `${channel.category} from ${channel.country}`,
          image: channel.logo || 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
          width: '100%',
          height: '100%',
          aspectratio: '16:9',
          autostart: settings.autoplay,
          mute: settings.muted,
          volume: Math.round(settings.volume * 100),
          controls: false, // We'll use custom controls
          displaytitle: false,
          displaydescription: false,
          stretching: 'uniform',
          preload: 'auto',
          
          // CRITICAL: Enhanced buffering and streaming configuration
          hlshtml5: true,
          androidhls: true,
          
          // Advanced buffering settings
          buffer: {
            // Increase buffer size for better stability
            length: 30, // 30 seconds buffer
            target: 10, // Target 10 seconds ahead
            max: 60,    // Maximum 60 seconds buffer
            
            // Aggressive buffering for live streams
            live: {
              syncDuration: 2,     // Sync within 2 seconds of live edge
              targetDuration: 8,   // Target 8 seconds behind live
              maxDuration: 20      // Maximum 20 seconds behind live
            }
          },
          
          // Network optimization
          networking: {
            timeout: 15000,        // 15 second timeout
            retries: 5,            // 5 retry attempts
            retryDelay: 1000,      // 1 second between retries
            
            // Bandwidth adaptation
            bandwidth: {
              initial: 2000000,    // Start with 2Mbps assumption
              minimum: 500000,     // Minimum 500kbps
              maximum: 10000000    // Maximum 10Mbps
            }
          },
          
          // HLS specific optimizations
          hls: {
            withCredentials: false,
            crossOrigin: 'anonymous',
            
            // Fragment loading
            fragLoadingTimeOut: 20000,
            fragLoadingMaxRetry: 6,
            fragLoadingRetryDelay: 1000,
            
            // Manifest loading
            manifestLoadingTimeOut: 10000,
            manifestLoadingMaxRetry: 4,
            manifestLoadingRetryDelay: 1000,
            
            // Level loading
            levelLoadingTimeOut: 10000,
            levelLoadingMaxRetry: 4,
            levelLoadingRetryDelay: 1000,
            
            // Buffer management
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
            maxBufferSize: 60 * 1000 * 1000, // 60MB
            maxBufferHole: 0.5,
            
            // Live streaming
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 10,
            liveDurationInfinity: true,
            
            // Quality switching
            abrEwmaFastLive: 3.0,
            abrEwmaSlowLive: 9.0,
            abrEwmaFastVoD: 3.0,
            abrEwmaSlowVoD: 9.0,
            
            // Error recovery
            enableWorker: true,
            enableSoftwareAES: true,
            startFragPrefetch: true,
            testBandwidth: true
          },
          
          // Adaptive streaming
          levels: [
            {
              file: channel.url,
              label: 'Auto'
            }
          ],
          
          // Error handling
          setupErrorHandling: true,
          
          // Skin customization
          skin: {
            name: 'glow',
            active: '#8b5cf6',
            inactive: '#6b7280',
            background: 'rgba(0,0,0,0.3)'
          },
          
          // Logo/watermark
          logo: {
            file: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=100',
            position: 'top-right',
            margin: 10,
            hide: true
          },
          
          // Captions (if available)
          tracks: [],
          
          // Analytics
          analytics: {
            enabled: false
          },
          
          // Additional performance settings
          cast: {},
          sharing: {},
          related: { oncomplete: 'hide' },
          advertising: { client: 'vast' }
        };

        // Create JW Player instance
        jwPlayerInstance.current = window.jwplayer(playerRef.current).setup(playerConfig);

        // Enhanced event listeners
        jwPlayerInstance.current.on('ready', () => {
          console.log('JW Player ready');
          setIsLoading(false);
          setStreamInfo(prev => ({ ...prev, type: streamFormat }));
          setConnectionQuality('good');
        });

        jwPlayerInstance.current.on('play', () => {
          setIsPlaying(true);
          setError(null);
          setIsBuffering(false);
          setConnectionQuality('good');
        });

        jwPlayerInstance.current.on('pause', () => {
          setIsPlaying(false);
          setIsBuffering(false);
        });

        jwPlayerInstance.current.on('buffer', () => {
          setIsBuffering(true);
          console.log('Buffering started...');
        });

        jwPlayerInstance.current.on('bufferChange', (event: any) => {
          console.log('Buffer change:', event);
          if (event.newstate) {
            setIsBuffering(true);
          } else {
            setIsBuffering(false);
          }
        });

        jwPlayerInstance.current.on('idle', () => {
          setIsLoading(false);
          setIsPlaying(false);
          setIsBuffering(false);
        });

        jwPlayerInstance.current.on('complete', () => {
          setIsPlaying(false);
          setIsBuffering(false);
          if (onChannelEnd) {
            onChannelEnd();
          }
        });

        jwPlayerInstance.current.on('error', (event: any) => {
          console.error('JW Player error:', event);
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

        jwPlayerInstance.current.on('time', (event: any) => {
          setCurrentTime(event.position);
          setDuration(event.duration);
        });

        jwPlayerInstance.current.on('levels', (event: any) => {
          if (event.levels && event.levels.length > 0) {
            const currentLevel = event.levels[event.currentQuality];
            if (currentLevel) {
              setStreamInfo(prev => ({
                ...prev,
                quality: currentLevel.label || `${currentLevel.height}p`,
                bitrate: currentLevel.bitrate || 0
              }));
            }
          }
        });

        jwPlayerInstance.current.on('levelsChanged', (event: any) => {
          const currentLevel = event.currentQuality;
          if (jwPlayerInstance.current.getQualityLevels()[currentLevel]) {
            const level = jwPlayerInstance.current.getQualityLevels()[currentLevel];
            setStreamInfo(prev => ({
              ...prev,
              quality: level.label || `${level.height}p`,
              bitrate: level.bitrate || 0
            }));
          }
        });

        jwPlayerInstance.current.on('meta', (event: any) => {
          if (event.metadata) {
            setStreamInfo(prev => ({
              ...prev,
              fps: event.metadata.framerate || 0
            }));
          }
        });

        // Additional buffering events
        jwPlayerInstance.current.on('bufferFull', () => {
          console.log('Buffer full');
          setIsBuffering(false);
          setConnectionQuality('excellent');
        });

        jwPlayerInstance.current.on('seek', () => {
          setIsBuffering(true);
        });

        jwPlayerInstance.current.on('seeked', () => {
          setIsBuffering(false);
        });

      } catch (e) {
        console.error('JW Player initialization error:', e);
        setError('Failed to initialize JW Player');
        setIsLoading(false);
        setConnectionQuality('offline');
      }
    };

    initializePlayer();

    return () => {
      if (jwPlayerInstance.current) {
        try {
          jwPlayerInstance.current.remove();
          jwPlayerInstance.current = null;
        } catch (e) {
          console.error('Error removing JW Player:', e);
        }
      }
      if (bufferCheckInterval.current) {
        clearInterval(bufferCheckInterval.current);
        bufferCheckInterval.current = null;
      }
    };
  }, [jwPlayerReady, channel, settings.autoplay, settings.muted, settings.volume]);

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
      if (jwPlayerInstance.current) {
        if (isPlaying) {
          jwPlayerInstance.current.pause();
        } else {
          jwPlayerInstance.current.play();
        }
      }
    } catch (e) {
      console.error('JW Player play/pause error:', e);
    }
  };

  const toggleMute = () => {
    try {
      if (jwPlayerInstance.current) {
        const newMuted = !settings.muted;
        jwPlayerInstance.current.setMute(newMuted);
        setSettings(prev => ({ ...prev, muted: newMuted }));
      }
    } catch (e) {
      console.error('JW Player mute error:', e);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    try {
      if (jwPlayerInstance.current) {
        jwPlayerInstance.current.setVolume(Math.round(volume * 100));
        setSettings(prev => ({ ...prev, volume, muted: volume === 0 }));
      }
    } catch (e) {
      console.error('JW Player volume error:', e);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    try {
      if (jwPlayerInstance.current) {
        jwPlayerInstance.current.seek(time);
        setCurrentTime(time);
      }
    } catch (e) {
      console.error('JW Player seek error:', e);
    }
  };

  const toggleFullscreen = () => {
    try {
      if (jwPlayerInstance.current) {
        jwPlayerInstance.current.setFullscreen(!settings.fullscreen);
        setSettings(prev => ({ ...prev, fullscreen: !prev.fullscreen }));
      }
    } catch (e) {
      console.error('JW Player fullscreen error:', e);
    }
  };

  const retryConnection = () => {
    if (retryCount < 5) { // Increased retry attempts
      setRetryCount(prev => prev + 1);
      setError(null);
      setIsLoading(true);
      setIsBuffering(false);
      
      // Force re-initialization with delay
      setTimeout(() => {
        if (jwPlayerInstance.current) {
          try {
            jwPlayerInstance.current.load([{
              file: channel?.url,
              title: channel?.name
            }]);
            jwPlayerInstance.current.play();
          } catch (e) {
            setError('Retry failed - Stream may be offline');
            setIsLoading(false);
            setConnectionQuality('offline');
          }
        }
      }, 1000 * retryCount); // Progressive delay
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
          <p className="text-sm mt-2">JW Player - Professional IPTV Streaming</p>
        </div>
      </div>
    );
  }

  if (!jwPlayerReady) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg">Loading JW Player...</p>
          <p className="text-sm text-gray-400 mt-2">Initializing professional streaming engine</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
      {/* JW Player Container */}
      <div ref={playerRef} className="w-full h-full" />

      {/* Loading/Buffering Overlay */}
      {(isLoading || isBuffering) && !error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg">{isBuffering ? 'Buffering...' : 'Loading stream...'}</p>
            <p className="text-sm text-gray-400 mt-2">
              {isBuffering ? 'Optimizing stream quality' : `JW Player initializing ${streamInfo.type.toUpperCase()} stream`}
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
            <h3 className="text-xl font-semibold mb-3">JW Player Error</h3>
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
              JW {streamInfo.type.toUpperCase() || 'PLAYER'}
            </span>
            {streamInfo.quality && streamInfo.quality !== 'Auto' && (
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
        {streamInfo.fps > 0 && (
          <div className="bg-black bg-opacity-75 rounded-lg px-3 py-2 text-white text-xs">
            <div className="flex items-center space-x-2">
              {getStreamTypeIcon()}
              <span>{streamInfo.fps}fps</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        
        {/* Channel Info */}
        <div className="absolute top-4 right-4 text-right text-white">
          <h3 className="text-lg font-semibold">{channel.name}</h3>
          <p className="text-sm text-gray-300">{channel.category} • {channel.country}</p>
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
                <button onClick={toggleFullscreen} className="hover:text-purple-400 transition-colors">
                  {settings.fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
                <button className="hover:text-purple-400 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JWPlayer;
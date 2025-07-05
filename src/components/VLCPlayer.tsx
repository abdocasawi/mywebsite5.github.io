import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, PictureInPicture2, AlertCircle, Download, RefreshCw, Chrome, Monitor, Globe } from 'lucide-react';
import { Channel, PlayerSettings } from '../types';

interface VLCPlayerProps {
  channel: Channel | null;
  onChannelEnd?: () => void;
}

const VLCPlayer: React.FC<VLCPlayerProps> = ({ channel, onChannelEnd }) => {
  const vlcRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vlcAvailable, setVlcAvailable] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({ name: '', version: '', supportsNPAPI: false });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [settings, setSettings] = useState<PlayerSettings>({
    volume: 1,
    muted: false,
    fullscreen: false,
    pictureInPicture: false,
    autoplay: true
  });

  // Detect browser and VLC plugin compatibility
  useEffect(() => {
    const detectBrowser = () => {
      const userAgent = navigator.userAgent;
      let browserName = 'Unknown';
      let browserVersion = '';
      let supportsNPAPI = false;

      // Chrome detection
      if (userAgent.includes('Chrome')) {
        browserName = 'Chrome';
        const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
        browserVersion = chromeMatch ? chromeMatch[1] : '';
        // Chrome dropped NPAPI support in version 45 (2015)
        supportsNPAPI = parseInt(browserVersion) < 45;
      }
      // Firefox detection
      else if (userAgent.includes('Firefox')) {
        browserName = 'Firefox';
        const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
        browserVersion = firefoxMatch ? firefoxMatch[1] : '';
        // Firefox dropped NPAPI support in version 52 (2017)
        supportsNPAPI = parseInt(browserVersion) < 52;
      }
      // Edge detection
      else if (userAgent.includes('Edg')) {
        browserName = 'Edge';
        const edgeMatch = userAgent.match(/Edg\/(\d+)/);
        browserVersion = edgeMatch ? edgeMatch[1] : '';
        supportsNPAPI = false; // Edge never supported NPAPI
      }
      // Safari detection
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browserName = 'Safari';
        const safariMatch = userAgent.match(/Version\/(\d+)/);
        browserVersion = safariMatch ? safariMatch[1] : '';
        supportsNPAPI = false; // Safari dropped NPAPI support
      }

      setBrowserInfo({ name: browserName, version: browserVersion, supportsNPAPI });
    };

    detectBrowser();
  }, []);

  // Enhanced VLC plugin detection for Chrome and other browsers
  useEffect(() => {
    const checkVLCPlugin = () => {
      try {
        let hasVLCPlugin = false;

        // Method 1: Check navigator.plugins (works in older browsers)
        if (navigator.plugins && navigator.plugins.length > 0) {
          for (let i = 0; i < navigator.plugins.length; i++) {
            const plugin = navigator.plugins[i];
            if (plugin.name && (
              plugin.name.toLowerCase().includes('vlc') ||
              plugin.name.toLowerCase().includes('videolan')
            )) {
              hasVLCPlugin = true;
              break;
            }
          }
        }

        // Method 2: Check navigator.mimeTypes
        if (!hasVLCPlugin && navigator.mimeTypes) {
          const vlcMimeTypes = [
            'application/x-vlc-plugin',
            'video/x-vlc-plugin',
            'application/vlc',
            'video/vlc'
          ];
          
          for (const mimeType of vlcMimeTypes) {
            if (navigator.mimeTypes[mimeType]) {
              hasVLCPlugin = true;
              break;
            }
          }
        }

        // Method 3: Try to create VLC object (ActiveX for IE/Edge)
        if (!hasVLCPlugin) {
          try {
            if ((window as any).ActiveXObject) {
              const vlcActiveX = new (window as any).ActiveXObject('VideoLAN.VLCPlugin.2');
              if (vlcActiveX) {
                hasVLCPlugin = true;
              }
            }
          } catch (e) {
            // ActiveX not available or VLC not installed
          }
        }

        // Method 4: Test embed element creation
        if (!hasVLCPlugin) {
          try {
            const testEmbed = document.createElement('embed');
            testEmbed.setAttribute('type', 'application/x-vlc-plugin');
            testEmbed.style.display = 'none';
            testEmbed.style.width = '1px';
            testEmbed.style.height = '1px';
            
            document.body.appendChild(testEmbed);
            
            setTimeout(() => {
              try {
                // Check if VLC methods are available
                hasVLCPlugin = !!(
                  testEmbed.playlist ||
                  testEmbed.audio ||
                  testEmbed.video ||
                  (testEmbed as any).VersionInfo
                );
                
                document.body.removeChild(testEmbed);
                
                setVlcAvailable(hasVLCPlugin);
                
                if (!hasVLCPlugin) {
                  setError('VLC Web Plugin not detected');
                }
              } catch (e) {
                document.body.removeChild(testEmbed);
                setVlcAvailable(false);
                setError('VLC Web Plugin not available');
              }
            }, 500);
            
            return;
          } catch (e) {
            // Embed test failed
          }
        }
        
        setVlcAvailable(hasVLCPlugin);
        
        if (!hasVLCPlugin) {
          setError('VLC Web Plugin not detected');
        }
      } catch (e) {
        setVlcAvailable(false);
        setError('VLC Web Plugin detection failed');
      }
    };

    checkVLCPlugin();
  }, []);

  // Initialize VLC player with enhanced Chrome support
  useEffect(() => {
    if (!channel || !vlcAvailable || !containerRef.current) return;

    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    const initializeVLC = () => {
      try {
        // Clear container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Create VLC embed element with Chrome-specific parameters
        const vlcEmbed = document.createElement('embed');
        vlcEmbed.setAttribute('type', 'application/x-vlc-plugin');
        vlcEmbed.setAttribute('pluginspage', 'http://www.videolan.org');
        vlcEmbed.setAttribute('version', 'VideoLAN.VLCPlugin.2');
        vlcEmbed.setAttribute('width', '100%');
        vlcEmbed.setAttribute('height', '100%');
        vlcEmbed.setAttribute('id', 'vlc-player');
        vlcEmbed.setAttribute('autoplay', settings.autoplay ? 'yes' : 'no');
        vlcEmbed.setAttribute('loop', 'no');
        vlcEmbed.setAttribute('volume', String(Math.round(settings.volume * 100)));
        vlcEmbed.setAttribute('mute', settings.muted ? 'yes' : 'no');
        vlcEmbed.setAttribute('target', channel.url);
        
        // Enhanced VLC parameters for better Chrome compatibility
        vlcEmbed.setAttribute('toolbar', 'false');
        vlcEmbed.setAttribute('text', channel.name);
        vlcEmbed.setAttribute('bgcolor', '#000000');
        vlcEmbed.setAttribute('windowless', 'true');
        vlcEmbed.setAttribute('branding', 'false');
        
        // Chrome-specific optimizations
        vlcEmbed.setAttribute('allowfullscreen', 'true');
        vlcEmbed.setAttribute('allowscriptaccess', 'always');
        vlcEmbed.setAttribute('wmode', 'transparent');
        
        // Network caching for IPTV streams (Chrome optimized)
        vlcEmbed.setAttribute('network-caching', '1000');
        vlcEmbed.setAttribute('live-caching', '300');
        vlcEmbed.setAttribute('file-caching', '300');
        vlcEmbed.setAttribute('http-caching', '1000');
        
        // Additional Chrome compatibility parameters
        vlcEmbed.setAttribute('http-reconnect', 'true');
        vlcEmbed.setAttribute('http-continuous', 'true');
        vlcEmbed.setAttribute('http-user-agent', 'VLC/Chrome Player');

        // Add to container
        if (containerRef.current) {
          containerRef.current.appendChild(vlcEmbed);
        }

        vlcRef.current = vlcEmbed;

        // Enhanced VLC event listeners with Chrome-specific handling
        const setupTimeout = setTimeout(() => {
          try {
            if (vlcRef.current && vlcRef.current.playlist) {
              // Clear any existing playlist
              vlcRef.current.playlist.clear();
              
              // Add the stream URL with Chrome-optimized options
              const itemId = vlcRef.current.playlist.add(channel.url, channel.name, [
                ':network-caching=1000',
                ':live-caching=300',
                ':http-reconnect',
                ':http-continuous',
                ':no-audio-visual',
                ':intf=dummy'
              ]);
              
              if (settings.autoplay) {
                vlcRef.current.playlist.playItem(itemId);
                setIsPlaying(true);
              }
              
              setIsLoading(false);

              // Enhanced monitoring for Chrome
              const monitorInterval = setInterval(() => {
                try {
                  if (vlcRef.current && vlcRef.current.input && vlcRef.current.playlist) {
                    const inputState = vlcRef.current.input.state;
                    const isCurrentlyPlaying = vlcRef.current.playlist.isPlaying;
                    
                    // Update time information
                    if (vlcRef.current.input.time >= 0) {
                      setCurrentTime(vlcRef.current.input.time / 1000);
                    }
                    if (vlcRef.current.input.length >= 0) {
                      setDuration(vlcRef.current.input.length / 1000);
                    }
                    
                    setIsPlaying(isCurrentlyPlaying);
                    
                    // Enhanced error detection for Chrome
                    if (inputState === 6 || inputState === 7) { // VLC error or end states
                      throw new Error('VLC playback error or stream ended');
                    }
                    
                    // Check for Chrome-specific issues
                    if (inputState === 0 && !isCurrentlyPlaying && retryCount === 0) {
                      // Stream might not be loading, try to restart
                      console.warn('Stream not loading, attempting restart...');
                      vlcRef.current.playlist.stop();
                      setTimeout(() => {
                        if (vlcRef.current && vlcRef.current.playlist) {
                          vlcRef.current.playlist.play();
                        }
                      }, 1000);
                    }
                  }
                } catch (e) {
                  console.warn('VLC monitoring error:', e);
                  // Don't clear interval on minor errors
                }
              }, 1000);

              return () => clearInterval(monitorInterval);
            } else {
              throw new Error('VLC plugin not properly initialized - Chrome may have blocked the plugin');
            }
          } catch (e) {
            console.error('VLC setup error:', e);
            setError('Failed to initialize VLC player - Chrome may require plugin permissions');
            setIsLoading(false);
          }
        }, 3000); // Increased timeout for Chrome

        return () => clearTimeout(setupTimeout);

      } catch (e) {
        console.error('VLC initialization error:', e);
        setError('Failed to load VLC player in Chrome browser');
        setIsLoading(false);
      }
    };

    const cleanup = initializeVLC();

    return () => {
      if (cleanup) cleanup();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [channel, vlcAvailable, settings.autoplay]);

  // Auto-hide controls
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setShowControls(false), 3000);
    };

    const container = containerRef.current;
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
      if (vlcRef.current && vlcRef.current.playlist) {
        if (isPlaying) {
          vlcRef.current.playlist.pause();
        } else {
          vlcRef.current.playlist.play();
        }
        setIsPlaying(!isPlaying);
      }
    } catch (e) {
      console.error('VLC play/pause error:', e);
      setError('Playback control failed - Chrome may have restricted plugin access');
    }
  };

  const toggleMute = () => {
    try {
      if (vlcRef.current && vlcRef.current.audio) {
        vlcRef.current.audio.mute = !settings.muted;
        setSettings(prev => ({ ...prev, muted: !prev.muted }));
      }
    } catch (e) {
      console.error('VLC mute error:', e);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    try {
      if (vlcRef.current && vlcRef.current.audio) {
        vlcRef.current.audio.volume = Math.round(volume * 100);
        setSettings(prev => ({ ...prev, volume, muted: volume === 0 }));
      }
    } catch (e) {
      console.error('VLC volume error:', e);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    try {
      if (vlcRef.current && vlcRef.current.input) {
        vlcRef.current.input.time = time * 1000; // VLC uses milliseconds
        setCurrentTime(time);
      }
    } catch (e) {
      console.error('VLC seek error:', e);
    }
  };

  const toggleFullscreen = () => {
    try {
      if (vlcRef.current && vlcRef.current.video) {
        vlcRef.current.video.toggleFullscreen();
        setSettings(prev => ({ ...prev, fullscreen: !prev.fullscreen }));
      } else {
        // Fallback to container fullscreen
        if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen();
          setSettings(prev => ({ ...prev, fullscreen: true }));
        } else {
          document.exitFullscreen();
          setSettings(prev => ({ ...prev, fullscreen: false }));
        }
      }
    } catch (e) {
      console.error('VLC fullscreen error:', e);
    }
  };

  const retryConnection = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setError(null);
      setIsLoading(true);
      
      // Force re-initialization
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      
      // Trigger re-initialization with delay for Chrome
      setTimeout(() => {
        if (vlcRef.current && vlcRef.current.playlist) {
          try {
            vlcRef.current.playlist.clear();
            vlcRef.current.playlist.add(channel?.url, channel?.name);
            vlcRef.current.playlist.play();
          } catch (e) {
            setError('Retry failed - Chrome may have blocked plugin access');
            setIsLoading(false);
          }
        }
      }, 2000);
    } else {
      setError('Maximum retry attempts reached - Try enabling plugin permissions in Chrome');
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

  const getBrowserSpecificInstructions = () => {
    switch (browserInfo.name) {
      case 'Chrome':
        return {
          title: 'Chrome VLC Plugin Setup',
          icon: <Chrome className="w-8 h-8" />,
          steps: [
            'Download VLC Media Player from videolan.org',
            'During installation, ensure "Web Plugin" is checked',
            'Restart Chrome completely (close all windows)',
            'Navigate to chrome://settings/content/flash',
            'Add this site to "Allow" list if prompted',
            'Refresh this page and allow plugin when prompted'
          ],
          note: 'Chrome versions 45+ require manual plugin permission. You may need to click the plugin icon in the address bar.',
          downloadUrl: 'https://www.videolan.org/vlc/download-windows.html'
        };
      case 'Firefox':
        return {
          title: 'Firefox VLC Plugin Setup',
          icon: <Globe className="w-8 h-8" />,
          steps: [
            'Download VLC Media Player from videolan.org',
            'Install with "Mozilla plugin" option enabled',
            'Restart Firefox completely',
            'Go to about:addons → Plugins',
            'Enable VLC Web Plugin',
            'Refresh this page'
          ],
          note: 'Firefox 52+ dropped NPAPI support. Consider using Firefox ESR or alternative browsers.',
          downloadUrl: 'https://www.videolan.org/vlc/download-windows.html'
        };
      case 'Edge':
        return {
          title: 'Edge Browser Notice',
          icon: <Monitor className="w-8 h-8" />,
          steps: [
            'Microsoft Edge does not support VLC plugins',
            'Use Chrome, Firefox, or Internet Explorer instead',
            'Alternative: Use the Enhanced IPTV player',
            'Switch to a different player from settings menu'
          ],
          note: 'Edge never supported NPAPI plugins. Please use an alternative browser or player.',
          downloadUrl: 'https://www.google.com/chrome/'
        };
      default:
        return {
          title: 'VLC Plugin Installation',
          icon: <Download className="w-8 h-8" />,
          steps: [
            'Download VLC Media Player from videolan.org',
            'Enable "Web Plugin" during installation',
            'Restart your browser completely',
            'Allow plugin permissions when prompted',
            'Refresh this page'
          ],
          note: 'Plugin support varies by browser. Chrome and Firefox work best.',
          downloadUrl: 'https://www.videolan.org/vlc/'
        };
    }
  };

  if (!channel) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select a channel to start streaming</p>
          <p className="text-sm mt-2">VLC Player for IPTV Streams</p>
        </div>
      </div>
    );
  }

  if (!vlcAvailable) {
    const instructions = getBrowserSpecificInstructions();
    
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-white max-w-lg mx-auto p-6">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            {instructions.icon}
          </div>
          <h3 className="text-xl font-semibold mb-3">{instructions.title}</h3>
          
          {/* Browser Info */}
          <div className="bg-gray-800 rounded-lg p-3 mb-4 text-sm">
            <p className="text-gray-300">
              <strong>Detected:</strong> {browserInfo.name} {browserInfo.version}
            </p>
            <p className="text-gray-300">
              <strong>Plugin Support:</strong> {browserInfo.supportsNPAPI ? 'Yes' : 'Limited/None'}
            </p>
          </div>
          
          <p className="text-gray-300 mb-6">
            VLC Player provides the best IPTV streaming experience with advanced codec support.
          </p>
          
          <div className="space-y-4">
            <a
              href={instructions.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
            >
              <Download className="w-5 h-5" />
              <span>Download VLC</span>
            </a>
            
            <div className="text-sm text-gray-400 space-y-3">
              <p className="font-medium">Installation Steps:</p>
              <ol className="text-left space-y-2 list-decimal list-inside">
                {instructions.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
              
              <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
                <p className="font-medium mb-1 text-yellow-400">Important:</p>
                <p>{instructions.note}</p>
              </div>
              
              <div className="mt-4 p-3 bg-blue-900 rounded text-xs">
                <p className="font-medium mb-1">Alternative:</p>
                <p>Use the "Enhanced IPTV" or "KSPlayer" from the settings menu for plugin-free streaming.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
      {/* VLC Player Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg">Loading VLC Player...</p>
            <p className="text-sm text-gray-400 mt-2">
              Initializing IPTV stream in {browserInfo.name}
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-yellow-400 mt-2">Retry attempt {retryCount}/3</p>
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
            <h3 className="text-xl font-semibold mb-3">VLC Player Error</h3>
            <p className="text-gray-300 mb-6">{error}</p>
            
            <div className="space-y-4">
              {retryCount < 3 && (
                <button
                  onClick={retryConnection}
                  className="flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 mx-auto"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Retry Connection</span>
                </button>
              )}
              
              <div className="text-sm text-gray-400 space-y-2">
                <p className="font-medium">Chrome Troubleshooting:</p>
                <ul className="text-left space-y-1">
                  <li>• Check if VLC plugin is enabled in Chrome settings</li>
                  <li>• Look for plugin permission prompt in address bar</li>
                  <li>• Try refreshing the page after allowing plugins</li>
                  <li>• Ensure VLC is installed with web plugin enabled</li>
                  <li>• Consider using Enhanced IPTV player as alternative</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stream Info */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 rounded-lg px-3 py-2 text-white text-sm">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            error ? 'bg-red-500' : 
            isLoading ? 'bg-yellow-500 animate-pulse' : 
            isPlaying ? 'bg-orange-500 animate-pulse' : 'bg-gray-500'
          }`}></div>
          <span>VLC</span>
          <span className="text-gray-300">• {browserInfo.name}</span>
          {duration > 0 && <span className="text-gray-300">• {formatTime(duration)}</span>}
          {retryCount > 0 && <span className="text-yellow-400">• Retry {retryCount}</span>}
        </div>
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
              {isLoading ? (
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
                <button onClick={togglePlay} className="hover:text-orange-400 transition-colors" disabled={isLoading}>
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                
                <div className="flex items-center space-x-2">
                  <button onClick={toggleMute} className="hover:text-orange-400 transition-colors">
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
                  <div className={`w-3 h-3 rounded-full ${
                    error ? 'bg-red-500' :
                    isLoading ? 'bg-yellow-500 animate-pulse' :
                    isPlaying ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <span className={
                    error ? 'text-red-400' :
                    isLoading ? 'text-yellow-400' :
                    isPlaying ? 'text-green-400' : 'text-gray-400'
                  }>
                    {error ? 'Error' : isLoading ? 'Connecting' : isPlaying ? 'Live' : 'Stopped'}
                  </span>
                  <span className="text-gray-400">• {browserInfo.name}</span>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center space-x-4">
                {retryCount < 3 && error && (
                  <button onClick={retryConnection} className="hover:text-orange-400 transition-colors">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}
                <button className="hover:text-orange-400 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                <button onClick={toggleFullscreen} className="hover:text-orange-400 transition-colors">
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

export default VLCPlayer;
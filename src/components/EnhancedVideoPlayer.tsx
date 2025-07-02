import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, 
  PictureInPicture2, RefreshCw, AlertCircle, Info, Wifi, WifiOff,
  Monitor, Signal, Zap
} from 'lucide-react';
import { useUniversalPlayer } from '../hooks/useUniversalPlayer';
import { Channel, PlayerSettings } from '../types';

interface EnhancedVideoPlayerProps {
  channel: Channel | null;
  onChannelEnd?: () => void;
}

const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({ channel, onChannelEnd }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showStreamInfo, setShowStreamInfo] = useState(false);
  const [settings, setSettings] = useState<PlayerSettings>({
    volume: 1,
    muted: false,
    fullscreen: false,
    pictureInPicture: false,
    autoplay: true
  });

  const { status, streamInfo, getQualityLevels, changeQuality, retry } = useUniversalPlayer(
    channel?.url || '', 
    videoRef,
    {
      enableHLS: true,
      enableDASH: true,
      enableWebRTC: false,
      enableMSE: true,
      maxRetries: 5,
      retryDelay: 2000
    }
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setShowControls(false), 3000);
    };

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('mousemove', handleMouseMove);
      return () => {
        videoElement.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(timeoutId);
      };
    }
  }, []);

  const handleCanPlay = () => {
    if (videoRef.current && settings.autoplay) {
      videoRef.current.play().catch(console.error);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !settings.muted;
      setSettings(prev => ({ ...prev, muted: !prev.muted }));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = volume;
      setSettings(prev => ({ ...prev, volume, muted: volume === 0 }));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setSettings(prev => ({ ...prev, fullscreen: true }));
    } else {
      document.exitFullscreen();
      setSettings(prev => ({ ...prev, fullscreen: false }));
    }
  };

  const togglePictureInPicture = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setSettings(prev => ({ ...prev, pictureInPicture: false }));
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
        setSettings(prev => ({ ...prev, pictureInPicture: true }));
      }
    } catch (error) {
      console.error('Picture-in-picture error:', error);
    }
  };

  const getStreamTypeIcon = () => {
    switch (streamInfo.type) {
      case 'hls': return <Zap className="w-4 h-4" />;
      case 'dash': return <Signal className="w-4 h-4" />;
      case 'direct': return <Monitor className="w-4 h-4" />;
      default: return <Wifi className="w-4 h-4" />;
    }
  };

  const getStreamTypeColor = () => {
    switch (streamInfo.type) {
      case 'hls': return 'text-purple-400';
      case 'dash': return 'text-blue-400';
      case 'direct': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (!channel) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select a channel to start streaming</p>
          <p className="text-sm mt-2">Enhanced IPTV Player with multi-format support</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadStart={() => setIsPlaying(false)}
        onCanPlay={handleCanPlay}
        playsInline
        controls={false}
        crossOrigin="anonymous"
      />

      {/* Loading Overlay */}
      {status.isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg">Loading stream...</p>
            <p className="text-sm text-gray-400 mt-1">
              {streamInfo.protocol && `Using ${streamInfo.protocol}`}
            </p>
            {status.error && status.error.includes('Retry') && (
              <p className="text-xs text-yellow-400 mt-2">{status.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {status.error && !status.isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center p-6">
          <div className="text-center text-white max-w-md">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Stream Error</h3>
            <p className="text-gray-300 mb-6">{status.error}</p>
            
            <div className="space-y-4">
              <button
                onClick={retry}
                className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Retry Stream</span>
              </button>
              
              <div className="text-sm text-gray-400 space-y-2">
                <p className="font-medium">Stream Details:</p>
                <div className="bg-gray-800 rounded p-3 text-left">
                  <p>Type: {streamInfo.type?.toUpperCase() || 'Unknown'}</p>
                  <p>Protocol: {streamInfo.protocol || 'Unknown'}</p>
                  <p>URL: {streamInfo.url ? `${streamInfo.url.substring(0, 50)}...` : 'N/A'}</p>
                </div>
                
                <div className="mt-4">
                  <p className="font-medium mb-2">Troubleshooting:</p>
                  <ul className="text-left space-y-1">
                    <li>• Check your internet connection</li>
                    <li>• Verify the stream is currently live</li>
                    <li>• Try refreshing the page</li>
                    <li>• Contact your IPTV provider if issues persist</li>
                  </ul>
                </div>
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
              status.error ? 'bg-red-500' : 
              status.isLoading ? 'bg-yellow-500 animate-pulse' : 
              status.isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`}></div>
            <span className={getStreamTypeColor()}>
              {streamInfo.type?.toUpperCase() || 'STREAM'}
            </span>
            {status.quality && status.quality !== 'auto' && (
              <span className="text-gray-300">• {status.quality}</span>
            )}
          </div>
        </div>

        {/* Additional Stream Info */}
        {(streamInfo.resolution || streamInfo.bitrate > 0) && (
          <div className="bg-black bg-opacity-75 rounded-lg px-3 py-2 text-white text-xs">
            <div className="flex items-center space-x-2">
              {getStreamTypeIcon()}
              <span>
                {streamInfo.resolution && `${streamInfo.resolution}`}
                {streamInfo.bitrate > 0 && ` • ${Math.round(streamInfo.bitrate / 1000)}kbps`}
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
                  <span className={status.isLive ? 'text-green-400' : 'text-red-400'}>
                    {status.isLive ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-4 transition-all duration-200 backdrop-blur-sm"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between text-white">
            
            {/* Left Controls */}
            <div className="flex items-center space-x-4">
              <button onClick={togglePlay} className="hover:text-purple-400 transition-colors">
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

              {/* Connection Status */}
              <div className="flex items-center space-x-1 text-xs">
                {status.isLive ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className={status.isLive ? 'text-green-400' : 'text-red-400'}>
                  {status.isLive ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-4">
              <button onClick={togglePictureInPicture} className="hover:text-purple-400 transition-colors">
                <PictureInPicture2 className="w-5 h-5" />
              </button>
              <button className="hover:text-purple-400 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={toggleFullscreen} className="hover:text-purple-400 transition-colors">
                {settings.fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVideoPlayer;
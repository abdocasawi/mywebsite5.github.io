import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, PictureInPicture2 } from 'lucide-react';
import { useHLS } from '../hooks/useHLS';
import { Channel, PlayerSettings } from '../types';

interface VideoPlayerProps {
  channel: Channel | null;
  onChannelEnd?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onChannelEnd }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [settings, setSettings] = useState<PlayerSettings>({
    volume: 1,
    muted: false,
    fullscreen: false,
    pictureInPicture: false,
    autoplay: true
  });

  const { status, getQualityLevels, changeQuality } = useHLS(
    channel?.url || '', 
    videoRef
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
        videoRef.current.play();
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

  if (!channel) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select a channel to start streaming</p>
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
      />

      {/* Loading Overlay */}
      {status.isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading stream...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {status.error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <VolumeX className="w-8 h-8" />
            </div>
            <p className="text-lg mb-2">Stream Error</p>
            <p className="text-sm text-gray-400">{status.error}</p>
          </div>
        </div>
      )}

      {/* Stream Info */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 rounded-lg px-3 py-2 text-white text-sm">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${status.isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
          <span>{status.isLive ? 'LIVE' : 'OFFLINE'}</span>
          {status.quality && <span className="text-gray-300">• {status.quality}</span>}
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
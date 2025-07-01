import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, PictureInPicture2, SkipBack, SkipForward } from 'lucide-react';
import { Channel, PlayerSettings } from '../types';

interface MKVPlayerProps {
  channel: Channel | null;
  onChannelEnd?: () => void;
}

export const MKVPlayer: React.FC<MKVPlayerProps> = ({ channel, onChannelEnd }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PlayerSettings>({
    volume: 1,
    muted: false,
    fullscreen: false,
    pictureInPicture: false,
    autoplay: true
  });

  useEffect(() => {
    if (videoRef.current && channel && settings.autoplay) {
      setIsLoading(true);
      setError(null);
      videoRef.current.load();
    }
  }, [channel, settings.autoplay]);

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

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load video file. Please check the file format or URL.');
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (onChannelEnd) {
      onChannelEnd();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(handleError);
      }
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
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

  const formatTime = (time: number) => {
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
          <p className="text-lg">Select a video to start playing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={channel.url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        onEnded={handleEnded}
        playsInline
        controls={false}
        preload="metadata"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <VolumeX className="w-8 h-8" />
            </div>
            <p className="text-lg mb-2">Playback Error</p>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        </div>
      )}

      {/* Video Info */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-75 rounded-lg px-3 py-2 text-white text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span>MKV</span>
          {duration > 0 && <span className="text-gray-300">• {formatTime(duration)}</span>}
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
              <button onClick={togglePlay} className="hover:text-purple-400 transition-colors">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              
              <button onClick={skipBackward} className="hover:text-purple-400 transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button onClick={skipForward} className="hover:text-purple-400 transition-colors">
                <SkipForward className="w-5 h-5" />
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
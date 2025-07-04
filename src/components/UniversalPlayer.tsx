import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import MKVPlayer from './MKVPlayer';
import VLCPlayer from './VLCPlayer';
import EnhancedVideoPlayer from './EnhancedVideoPlayer';
import KSPlayer from './KSPlayer';
import { Channel } from '../types';
import { Settings, Monitor, Play, Zap, Cpu, Star } from 'lucide-react';

interface UniversalPlayerProps {
  channel: Channel | null;
  onChannelEnd?: () => void;
}

type PlayerType = 'auto' | 'vlc' | 'ksplayer' | 'enhanced' | 'hls' | 'native';

export const UniversalPlayer: React.FC<UniversalPlayerProps> = ({ channel, onChannelEnd }) => {
  const [playerType, setPlayerType] = useState<PlayerType>('auto');
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);

  if (!channel) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select a channel to start streaming</p>
          <p className="text-sm mt-2">Universal IPTV Player with VLC & KSPlayer</p>
        </div>
      </div>
    );
  }

  // Auto-detect player type based on URL - VLC as primary choice for IPTV
  const getAutoPlayerType = (): PlayerType => {
    const url = channel.url.toLowerCase();
    
    // For all IPTV streams, prefer VLC for professional streaming
    if (url.includes('.m3u8') || url.includes('hls') || url.includes('iptv') || url.includes('.mpd')) {
      return 'vlc';
    }
    
    // For direct video files, use VLC for better codec support
    if (url.match(/\.(mp4|webm|ogg|avi|mkv|mov|flv)(\?|$)/)) {
      return 'vlc';
    }
    
    // Default to VLC for all formats
    return 'vlc';
  };

  const getCurrentPlayerType = (): PlayerType => {
    return playerType === 'auto' ? getAutoPlayerType() : playerType;
  };

  const renderPlayer = () => {
    const currentType = getCurrentPlayerType();
    
    switch (currentType) {
      case 'vlc':
        return <VLCPlayer channel={channel} onChannelEnd={onChannelEnd} />;
      case 'ksplayer':
        return <KSPlayer channel={channel} onChannelEnd={onChannelEnd} />;
      case 'enhanced':
        return <EnhancedVideoPlayer channel={channel} onChannelEnd={onChannelEnd} />;
      case 'hls':
        return <VideoPlayer channel={channel} onChannelEnd={onChannelEnd} />;
      case 'native':
      default:
        return <MKVPlayer channel={channel} onChannelEnd={onChannelEnd} />;
    }
  };

  const playerOptions = [
    { type: 'auto' as PlayerType, label: 'Auto Detect', icon: Settings, description: 'Automatically select VLC Player for all streams (Recommended)' },
    { type: 'vlc' as PlayerType, label: 'VLC Player', icon: Cpu, description: 'Advanced codec support via VLC plugin (Primary)' },
    { type: 'ksplayer' as PlayerType, label: 'KSPlayer', icon: Star, description: 'Advanced IPTV player for all formats' },
    { type: 'enhanced' as PlayerType, label: 'Enhanced IPTV', icon: Zap, description: 'Advanced IPTV with multi-format support' },
    { type: 'hls' as PlayerType, label: 'HLS Player', icon: Monitor, description: 'Standard HLS.js player' },
    { type: 'native' as PlayerType, label: 'Native Player', icon: Play, description: 'Browser native video player' },
  ];

  return (
    <div className="relative">
      {/* Player Selector */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative">
          <button
            onClick={() => setShowPlayerSelector(!showPlayerSelector)}
            className="bg-black bg-opacity-75 hover:bg-opacity-90 text-white p-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
            title="Select Player"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {showPlayerSelector && (
            <div className="absolute right-0 top-12 bg-gray-900 border border-gray-700 rounded-lg shadow-xl min-w-80 overflow-hidden">
              <div className="p-3 border-b border-gray-700">
                <h3 className="text-white font-medium text-sm">Select Player Engine</h3>
                <p className="text-gray-400 text-xs mt-1">
                  Current: {getCurrentPlayerType().toUpperCase()}
                </p>
              </div>
              
              <div className="py-2">
                {playerOptions.map(({ type, label, icon: Icon, description }) => (
                  <button
                    key={type}
                    onClick={() => {
                      setPlayerType(type);
                      setShowPlayerSelector(false);
                    }}
                    className={`w-full flex items-start space-x-3 px-4 py-3 text-sm transition-colors ${
                      playerType === type
                        ? 'bg-orange-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${type === 'vlc' ? 'text-orange-400' : ''}`} />
                    <div className="text-left">
                      <div className="font-medium flex items-center space-x-2">
                        <span>{label}</span>
                        {type === 'vlc' && <span className="text-xs bg-orange-500 text-white px-1 rounded">PRO</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{description}</div>
                      {type === 'auto' && (
                        <div className="text-xs text-orange-300 mt-1">
                          → {getAutoPlayerType().toUpperCase()}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="p-3 border-t border-gray-700 bg-gray-800">
                <div className="text-xs text-gray-400 space-y-1">
                  <p><strong>VLC Player:</strong> Advanced codec support for all IPTV formats (Default)</p>
                  <p><strong>KSPlayer:</strong> Modern streaming engine with adaptive bitrate</p>
                  <p><strong>Enhanced IPTV:</strong> Multi-format support with HLS.js</p>
                  <p><strong>HLS:</strong> Standard HLS.js implementation</p>
                  <p><strong>Native:</strong> Browser native video player</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Player Component */}
      {renderPlayer()}
      
      {/* Player Type Indicator */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 rounded-lg px-3 py-2 text-white text-sm">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            getCurrentPlayerType() === 'vlc' ? 'bg-orange-500' :
            getCurrentPlayerType() === 'ksplayer' ? 'bg-purple-500' :
            getCurrentPlayerType() === 'enhanced' ? 'bg-purple-500' :
            getCurrentPlayerType() === 'hls' ? 'bg-blue-500' : 'bg-green-500'
          }`}></div>
          <span>{getCurrentPlayerType().toUpperCase()} Engine</span>
          {getCurrentPlayerType() === 'vlc' && (
            <span className="text-xs bg-orange-500 text-white px-1 rounded">PRO</span>
          )}
        </div>
      </div>
    </div>
  );
};
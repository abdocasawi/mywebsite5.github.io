import React, { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import MKVPlayer from './MKVPlayer';
import VLCPlayer from './VLCPlayer';
import { Channel } from '../types';
import { Settings, Monitor, Play } from 'lucide-react';

interface UniversalPlayerProps {
  channel: Channel | null;
  onChannelEnd?: () => void;
}

type PlayerType = 'auto' | 'hls' | 'vlc' | 'native';

export const UniversalPlayer: React.FC<UniversalPlayerProps> = ({ channel, onChannelEnd }) => {
  const [playerType, setPlayerType] = useState<PlayerType>('auto');
  const [showPlayerSelector, setShowPlayerSelector] = useState(false);

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

  // Auto-detect player type based on URL
  const getAutoPlayerType = (): PlayerType => {
    const url = channel.url.toLowerCase();
    
    if (url.includes('.m3u8') || url.includes('hls')) {
      return 'hls';
    }
    
    return 'native';
  };

  const getCurrentPlayerType = (): PlayerType => {
    return playerType === 'auto' ? getAutoPlayerType() : playerType;
  };

  const renderPlayer = () => {
    const currentType = getCurrentPlayerType();
    
    switch (currentType) {
      case 'vlc':
        return <VLCPlayer channel={channel} onChannelEnd={onChannelEnd} />;
      case 'hls':
        return <VideoPlayer channel={channel} onChannelEnd={onChannelEnd} />;
      case 'native':
      default:
        return <MKVPlayer channel={channel} onChannelEnd={onChannelEnd} />;
    }
  };

  const playerOptions = [
    { type: 'auto' as PlayerType, label: 'Auto Detect', icon: Settings },
    { type: 'hls' as PlayerType, label: 'HLS Player', icon: Monitor },
    { type: 'vlc' as PlayerType, label: 'VLC Player', icon: Play },
    { type: 'native' as PlayerType, label: 'Native Player', icon: Monitor },
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
            <div className="absolute right-0 top-12 bg-gray-900 border border-gray-700 rounded-lg shadow-xl min-w-48 overflow-hidden">
              <div className="p-3 border-b border-gray-700">
                <h3 className="text-white font-medium text-sm">Select Player</h3>
                <p className="text-gray-400 text-xs mt-1">
                  Current: {getCurrentPlayerType().toUpperCase()}
                </p>
              </div>
              
              <div className="py-2">
                {playerOptions.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => {
                      setPlayerType(type);
                      setShowPlayerSelector(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${
                      playerType === type
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                    {type === 'auto' && (
                      <span className="text-xs text-gray-400 ml-auto">
                        ({getAutoPlayerType().toUpperCase()})
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="p-3 border-t border-gray-700 bg-gray-800">
                <div className="text-xs text-gray-400 space-y-1">
                  <p><strong>HLS:</strong> Best for .m3u8 streams</p>
                  <p><strong>VLC:</strong> Advanced codec support</p>
                  <p><strong>Native:</strong> Direct video files</p>
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
            getCurrentPlayerType() === 'hls' ? 'bg-purple-500' : 'bg-blue-500'
          }`}></div>
          <span>{getCurrentPlayerType().toUpperCase()} Player</span>
        </div>
      </div>
    </div>
  );
};
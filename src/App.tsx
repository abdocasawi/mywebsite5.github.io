import React, { useState } from 'react';
import { Header } from './components/Header';
import { UniversalPlayer } from './components/UniversalPlayer';
import { ChannelList } from './components/ChannelList';
import { Channel } from './types';
import { sampleChannels } from './data/channels';

function App() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <UniversalPlayer 
              channel={selectedChannel}
            />
            
            {/* Channel Info */}
            {selectedChannel && (
              <div className="mt-6 bg-gray-900 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedChannel.name}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                      <span className="bg-purple-600 text-white px-2 py-1 rounded">
                        {selectedChannel.category}
                      </span>
                      <span>{selectedChannel.country}</span>
                      <span>{selectedChannel.language}</span>
                    </div>
                    {selectedChannel.description && (
                      <p className="text-gray-300 leading-relaxed">
                        {selectedChannel.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${
                      selectedChannel.url.includes('.m3u8') ? 'bg-red-500' : 'bg-blue-500'
                    }`}></div>
                    <span className={`font-medium ${
                      selectedChannel.url.includes('.m3u8') ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {selectedChannel.url.includes('.m3u8') ? 'LIVE' : 'VIDEO'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Channel List */}
          <div className="lg:col-span-1">
            <ChannelList
              channels={sampleChannels}
              selectedChannel={selectedChannel}
              onChannelSelect={handleChannelSelect}
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">HD</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">High Quality</h3>
            <p className="text-gray-400">Stream in crystal clear HD with adaptive bitrate streaming</p>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">MKV</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Multi-Format</h3>
            <p className="text-gray-400">Support for MKV, MP4, and HLS streaming formats</p>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">∞</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Unlimited</h3>
            <p className="text-gray-400">Access to hundreds of channels from around the world</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
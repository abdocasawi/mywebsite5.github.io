import React, { useState } from 'react';
import { Search, Globe, Tv, Play } from 'lucide-react';
import { Channel } from '../types';
import { categories } from '../data/channels';

interface ChannelListProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  selectedChannel,
  onChannelSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || channel.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-gray-900 rounded-xl p-6 h-full">
      <div className="flex items-center space-x-3 mb-6">
        <Tv className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-semibold text-white">Channels</h2>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search channels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedCategory === category
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Channel Grid */}
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {filteredChannels.map(channel => (
          <div
            key={channel.id}
            onClick={() => onChannelSelect(channel)}
            className={`group p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
              selectedChannel?.id === channel.id
                ? 'bg-purple-600 bg-opacity-20 border-purple-500'
                : 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Tv className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors">
                      {channel.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Globe className="w-3 h-3" />
                      <span>{channel.country}</span>
                      <span>•</span>
                      <span>{channel.category}</span>
                    </div>
                  </div>
                </div>
                {channel.description && (
                  <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                    {channel.description}
                  </p>
                )}
              </div>
              <div className="ml-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  selectedChannel?.id === channel.id
                    ? 'bg-purple-500'
                    : 'bg-gray-700 group-hover:bg-purple-500'
                }`}>
                  <Play className="w-4 h-4 text-white ml-0.5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredChannels.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Tv className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No channels found</p>
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { Tv, Radio, Settings, User, Star, Cpu } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white">StreamHub</h1>
              <div className="flex items-center space-x-1 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                <Cpu className="w-3 h-3" />
                <span>VLC</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
              Live TV
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Movies
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Series
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Sports
            </a>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-400">
              <span>Powered by</span>
              <span className="text-orange-400 font-semibold">VLC Player</span>
            </div>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
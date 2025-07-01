import React from 'react';
import VideoPlayer from './VideoPlayer';
import MKVPlayer from './MKVPlayer';
import { Channel } from '../types';

interface UniversalPlayerProps {
  channel: Channel | null;
  onChannelEnd?: () => void;
}

export const UniversalPlayer: React.FC<UniversalPlayerProps> = ({ channel, onChannelEnd }) => {
  if (!channel) {
    return <VideoPlayer channel={channel} onChannelEnd={onChannelEnd} />;
  }

  // Check if it's an HLS stream first (this takes priority)
  const isHLS = channel.url.toLowerCase().includes('.m3u8') ||
                channel.url.toLowerCase().includes('hls');

  // If it's HLS, use the VideoPlayer (HLS player)
  if (isHLS) {
    return <VideoPlayer channel={channel} onChannelEnd={onChannelEnd} />;
  }

  // For all other URLs (direct video files), use MKVPlayer
  return <MKVPlayer channel={channel} onChannelEnd={onChannelEnd} />;
};
import React from 'react';
import { VideoPlayer } from './VideoPlayer';
import { MKVPlayer } from './MKVPlayer';
import { Channel } from '../types';

interface UniversalPlayerProps {
  channel: Channel | null;
  onChannelEnd?: () => void;
}

export const UniversalPlayer: React.FC<UniversalPlayerProps> = ({ channel, onChannelEnd }) => {
  if (!channel) {
    return <VideoPlayer channel={channel} onChannelEnd={onChannelEnd} />;
  }

  // Determine player type based on URL extension or content type
  const isMKV = channel.url.toLowerCase().includes('.mkv') || 
                channel.url.toLowerCase().includes('.mp4') ||
                channel.url.toLowerCase().includes('.avi') ||
                channel.url.toLowerCase().includes('.mov') ||
                channel.url.toLowerCase().includes('.webm');

  const isHLS = channel.url.toLowerCase().includes('.m3u8') ||
                channel.url.toLowerCase().includes('hls');

  // Use MKV player for video files, HLS player for streams
  if (isMKV && !isHLS) {
    return <MKVPlayer channel={channel} onChannelEnd={onChannelEnd} />;
  }

  return <VideoPlayer channel={channel} onChannelEnd={onChannelEnd} />;
};
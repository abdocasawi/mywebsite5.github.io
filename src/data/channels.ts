import { Channel } from '../types';

export const sampleChannels: Channel[] = [
  {
    id: '1',
    name: 'Al Jazeera Mubasher',
    logo: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.youtube.com%2Fchannel%2FUCCv1Pd24oPErw5S7zJWltnQ%2Fabout&psig=AOvVaw3iyBli2ONm8kFiBstmfM7u&ust=1751387270117000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCODql5_LmY4DFQAAAAAdAAAAABAE',
    url: 'https://live-hls-apps-ajm-fa.getaj.net/AJM/index.m3u8',
    category: 'Entertainment',
    country: 'QATAR',
    language: 'ARABICh',
    description: 'News channels'
  },
  {
    id: '2',
    name: 'Big Buck Bunny',
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    category: 'Movies',
    country: 'US',
    language: 'English',
    description: 'Classic test stream content'
  },
  {
    id: '3',
    name: 'Apple Test Stream',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
    category: 'Test',
    country: 'US',
    language: 'English',
    description: 'Apple HLS test stream'
  },
  {
    id: '4',
    name: 'Al Jazeera HD',
    url: 'https://live-hls-apps-aja-fa.getaj.net/AJA/index.m3u8',
    category: 'News',
    country: 'Qatar',
    language: 'English',
    description: 'Al Jazeera English live news channel in HD'
  }
];

export const categories = [
  'All',
  'Entertainment',
  'News',
  'Sports',
  'Movies',
  'Live TV',
  'Test'
];
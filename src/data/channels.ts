import { Channel } from '../types';

export const sampleChannels: Channel[] = [
  {
    id: '1',
    name: 'Al Jazeera HD',
    url: 'https://live-hls-apps-aja-fa.getaj.net/AJA/index.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Aljazeera_eng.svg/512px-Aljazeera_eng.svg.png',
    category: 'News',
    country: 'Qatar',
    language: 'English',
    description: 'Al Jazeera English live news channel in HD'
  },
  {
    id: '2',
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
    name: 'Be in Sport 1 HD',
    logo: 'http://bdd78.4rouwanda-shop.store/live/918454578001/index.m3u8',
    url: 'https://live-hls-apps-ajm-fa.getaj.net/AJM/index.m3u8',
    category: 'SPORT',
    country: 'QATAR',
    language: 'ARABICh',
    description: 'SPORT CHANNELS'
  },
  {
    id: '3',
    name: 'Arryadia',
    url: 'https://cdn.live.easybroadcast.io/abr_corp/73_arryadia_k2tgcj0/corp/73_arryadia_k2tgcj0_480p/chunks_dvr.m3u8',
    category: 'live tv',
    country: 'morocco',
    language: 'Arabic',
    description: 'Sport stream content'
  },
  {
    id: '4',
    name: 'Apple Test Stream',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
    category: 'Test',
    country: 'US',
    language: 'English',
    description: 'Apple HLS test stream'
  },
  
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
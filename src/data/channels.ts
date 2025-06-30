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
    country: 'BEIN',
    language: 'ARABICh',
    description: 'News channels'
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
    name: 'Asharq Discovery',
    url: 'https://svs.itworkscdn.net/asharqdiscoverylive/asharqd.smil/playlist_dvr.m3u8',
    category: 'LIVE TV',
    country: 'saoudia',
    language: 'ARABIC',
    description: 'documentry stream',
  },
  {
    id: '7',
    name: 'Palestine Today',
    url: 'https://live.paltodaytv.com/paltv/live/playlist.m3u8',
    category: 'LIVE TV',
    country: 'palestine',
    language: 'ARABIC',
    description: 'news stream',
  },
  {
    id: '5',
    name: 'Sky News Arabia',
    url: 'https://stream.skynewsarabia.com/ott/ott.m3u8',
    category: 'LIVE TV',
    country: 'palestine',
    language: 'ARABIC',
    description: 'news stream',
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
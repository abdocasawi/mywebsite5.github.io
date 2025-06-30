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
    name: 'BeIn Sport 1 HD',
    url: 'http://bdd78.4rouwanda-shop.store/live/918454578001/index.m3u8?',
    category: 'LIVE TV',
    country: 'QATAR',
    language: 'ARABIC',
    description: 'SPORT stream',
  },
  {
    id: '7',
    name: 'BeIn Sport 2HD',
    url: 'https://www.elahmad.com/tv/mobiletv/glarb.php?id=bein_m_2',
    category: 'LIVE TV',
    country: 'QATAR',
    language: 'ARABIC',
    description: 'SPORT stream',
  }
  <iframe width="560" height="315" src="https://www.elahmad.com/tv/mobiletv/glarb.php?id=bein_m_2" style="border:none;" allowfullscreen allow="autoplay; fullscreen; picture-in-picture; xr-spatial-tracking; encrypted-media"></iframe>
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
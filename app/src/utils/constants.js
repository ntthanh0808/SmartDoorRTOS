import Constants from 'expo-constants';

export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ?? 'http://192.168.1.100:8000/api';

export const WS_URL =
  Constants.expoConfig?.extra?.wsUrl ?? 'ws://192.168.1.100:8000/ws';

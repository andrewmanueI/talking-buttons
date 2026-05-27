export interface SoundButton {
  id: string;
  name: string;
  audioBlob: Blob;
  imageData?: string;
  buttonColor?: string;
  order: number;
  createdAt: number;
}

export type BackgroundType = 'none' | 'color' | 'image';

export interface AppSettings {
  backgroundType: BackgroundType;
  backgroundColor: string;
  backgroundImage?: string;
  volume: number;
}

export interface SavedPreset {
  id: string;
  name: string;
  buttons: PresetButton[];
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundType?: BackgroundType;
  createdAt: number;
}

export interface PresetButton {
  id: string;
  name: string;
  audioBlob: Blob;
  imageData?: string;
  buttonColor?: string;
  order: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  backgroundType: 'none',
  backgroundColor: '#F6F3EE',
  volume: 1,
};

export const DEFAULT_BUTTON_COLOR = '#5b8c5a';
export const BUTTON_COLORS = [
  '#5b8c5a', '#4a90d9', '#e67e22', '#9b59b6',
  '#e74c3c', '#1abc9c', '#f39c12', '#2c3e50',
  '#e91e63', '#00bcd4', '#ff5722', '#795548',
];

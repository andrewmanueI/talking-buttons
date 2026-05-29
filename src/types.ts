export interface SoundButton {
  id: string;
  name: string;
  audioBlob?: Blob;
  ttsText?: string;
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
  audioBlob?: Blob;
  ttsText?: string;
  imageData?: string;
  buttonColor?: string;
  order: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  backgroundType: 'none',
  backgroundColor: '#F6F3EE',
  volume: 1,
};

/** Serialized blob for JSON export (base64-encoded). */
export interface AudioBlobData {
  type: string;  // MIME type, e.g. "audio/webm;codecs=opus"
  data: string;  // base64-encoded binary
}

/** Structure of the export JSON file. */
export interface ExportData {
  version: 1;
  exportedAt: string;
  data: {
    buttons: (Omit<SoundButton, 'audioBlob'> & { audioBlob?: AudioBlobData })[];
    settings: AppSettings | null;
    presets: (Omit<SavedPreset, 'buttons'> & {
      buttons: (Omit<PresetButton, 'audioBlob'> & { audioBlob?: AudioBlobData })[];
    })[];
    language: 'id' | 'en';
  };
}

export const DEFAULT_BUTTON_COLOR = '#5b8c5a';
export const BUTTON_COLORS = [
  '#5b8c5a', '#4a90d9', '#e67e22', '#9b59b6',
  '#e74c3c', '#1abc9c', '#f39c12', '#2c3e50',
  '#e91e63', '#00bcd4', '#ff5722', '#795548',
];

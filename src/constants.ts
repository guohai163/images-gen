import type { ImageFormState, SizePreset } from './types';

export const STORAGE_KEYS = {
  settings: 'image-gen:settings',
  history: 'image-gen:history',
} as const;

export const INDEXED_DB = {
  name: 'image-gen-db',
  version: 1,
  store: 'kv',
  historyKey: 'history',
} as const;

export const DEFAULT_FORM_STATE: ImageFormState = {
  baseUrl: '',
  apiKey: '',
  model: 'gpt-image-2',
  prompt: '',
  width: '1536',
  height: '1024',
  quality: 'medium',
  generationMode: 'text',
};

export const SIZE_PRESETS: SizePreset[] = [
  { label: '16:9', width: 1536, height: 864 },
  { label: '4:3', width: 1536, height: 1152 },
  { label: '1:1', width: 1024, height: 1024 },
  { label: '3:2', width: 1536, height: 1024 },
];

export const HISTORY_LIMIT = 10;
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;

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
  size: '1536x1024',
  quality: 'medium',
  generationMode: 'text',
};

export const SIZE_PRESETS: SizePreset[] = [
  { label: '横版 1536x1024', value: '1536x1024' },
  { label: '方图 1024x1024', value: '1024x1024' },
  { label: '竖版 1024x1536', value: '1024x1536' },
  { label: '自动', value: 'auto' },
];

export const QUALITY_OPTIONS: Array<{
  label: string;
  value: ImageFormState['quality'];
}> = [
  { label: '自动', value: 'auto' },
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
];

export const HISTORY_LIMIT = 10;
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;

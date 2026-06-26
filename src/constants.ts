import type { DisplayPreferences, ImageFormState, SizePreset, StylePreset } from './types';

export const STORAGE_KEYS = {
  settings: 'image-gen:settings',
  history: 'image-gen:history',
  preferences: 'image-gen:preferences',
  favorites: 'image-gen:favorites',
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
  negativePrompt: '',
  stylePreset: 'none',
  outputCount: 1,
  seed: '',
  sizeMode: 'preset',
  size: '1536x1024',
  customWidth: '1920',
  customHeight: '1024',
  quality: 'medium',
  generationMode: 'text',
};

export const SIZE_PRESETS: SizePreset[] = [
  { label: '1:1', ratioLabel: '方图', value: '1024x1024' },
  { label: '3:2', ratioLabel: '横版', value: '1536x1024' },
  { label: '2:3', ratioLabel: '竖版', value: '1024x1536' },
  { label: '16:9', ratioLabel: '宽屏', value: '1920x1088' },
  { label: '1:1', ratioLabel: '方图', value: '1024x1024' },
  { label: '9:16', ratioLabel: '手机竖图', value: '1088x1920' },
];

export const CUSTOM_SIZE_LIMITS = {
  minPixels: 655_360,
  maxPixels: 8_294_400,
  maxLongEdge: 3840,
  minShortEdge: 256,
  step: 16,
  maxRatio: 3,
} as const;

export const QUALITY_OPTIONS: Array<{
  label: string;
  value: ImageFormState['quality'];
}> = [
  { label: '自动', value: 'auto' },
  { label: '标准', value: 'medium' },
  { label: '高清', value: 'high' },
  { label: '快速', value: 'low' },
];

export const HISTORY_LIMIT = 10;
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'none',
    label: '无风格',
    promptHint: '保持自由创作',
    swatch: 'linear-gradient(135deg, #f6f1ff 0%, #ebe6ff 100%)',
  },
  {
    id: 'realistic',
    label: '写实',
    promptHint: '细节真实、电影感',
    swatch: 'linear-gradient(135deg, #6d7d91 0%, #c7d2dd 100%)',
  },
  {
    id: 'illustration',
    label: '插画',
    promptHint: '柔和笔触、叙事感',
    swatch: 'linear-gradient(135deg, #c58f52 0%, #f2d2a6 100%)',
  },
  {
    id: 'anime',
    label: '动漫',
    promptHint: '高饱和、角色感',
    swatch: 'linear-gradient(135deg, #6c73ff 0%, #ff9fd3 100%)',
  },
  {
    id: 'three-d',
    label: '3D渲染',
    promptHint: '体积光、材质细腻',
    swatch: 'linear-gradient(135deg, #3546ff 0%, #8de0ff 100%)',
  },
  {
    id: 'cyberpunk',
    label: '赛博朋克',
    promptHint: '霓虹、未来都市',
    swatch: 'linear-gradient(135deg, #2f1d73 0%, #ff4fd8 100%)',
  },
];

export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  language: 'zh',
  theme: 'light',
};

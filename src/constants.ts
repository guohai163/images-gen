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
    promptTemplate: '',
    swatch: 'linear-gradient(135deg, #f6f1ff 0%, #ebe6ff 100%)',
    previewImage: '/style-presets/none.png',
  },
  {
    id: 'realistic',
    label: '写实',
    promptHint: '细节真实、电影感',
    promptTemplate: '在不改变主体和场景核心设定的前提下，采用写实摄影风格。让主体像真实商业摄影中的毛绒吉祥物，具备可信的皮毛、玻璃般高光、自然景深、真实镜头压缩感和电影级夜景布光。背景克制简洁，突出真实材质、体积感和照片完成度，避免插画笔触、二次元线稿和夸张卡通比例。',
    swatch: 'linear-gradient(135deg, #6d7d91 0%, #c7d2dd 100%)',
    previewImage: '/style-presets/realistic.png',
  },
  {
    id: 'illustration',
    label: '插画',
    promptHint: '柔和笔触、叙事感',
    promptTemplate: '在不改变主体和场景核心设定的前提下，采用绘本感极强的数字插画风格。使用柔和但有设计感的笔触、层层叠加的色块、温暖叙事光影和轻微纸面质感，让画面像高质量儿童绘本或品牌插画。弱化真实摄影感，强化概括造型、情绪氛围和故事性。',
    swatch: 'linear-gradient(135deg, #c58f52 0%, #f2d2a6 100%)',
    previewImage: '/style-presets/illustration.png',
  },
  {
    id: 'anime',
    label: '动漫',
    promptHint: '高饱和、角色感',
    promptTemplate: '在不改变主体和场景核心设定的前提下，采用高质量日系动画电影风格。强调大面积纯净赛璐璐上色、清晰轮廓、夸张但精致的角色表情、明亮高饱和配色和动画海报式镜头设计，让主体像原创动画 IP 主角。避免写实纹理和厚涂插画感。',
    swatch: 'linear-gradient(135deg, #6c73ff 0%, #ff9fd3 100%)',
    previewImage: '/style-presets/anime.png',
  },
  {
    id: 'three-d',
    label: '3D渲染',
    promptHint: '体积光、材质细腻',
    promptTemplate: '在不改变主体和场景核心设定的前提下，采用高端 3D 吉祥物渲染风格。让主体像经过精细建模的品牌 IP 公仔，具有圆润干净的几何结构、准确 AO 阴影、半真实材质、高光边缘和高级棚拍式打光。强调 CG 质感、建模完成度和产品级视觉精度，避免 2D 平面感。',
    swatch: 'linear-gradient(135deg, #3546ff 0%, #8de0ff 100%)',
    previewImage: '/style-presets/three-d.png',
  },
  {
    id: 'cyberpunk',
    label: '赛博朋克',
    promptHint: '霓虹、未来都市',
    promptTemplate: '在不改变主体和场景核心设定的前提下，采用强烈赛博朋克视觉风格。让主体被蓝紫粉霓虹包围，带有未来界面投影、电子辉光、潮湿反射、金属与玻璃混合材质以及夜色都市能量感。画面需要更锐利、更高对比、更带攻击性的未来科技氛围，明显区别于普通紫粉插画。',
    swatch: 'linear-gradient(135deg, #2f1d73 0%, #ff4fd8 100%)',
    previewImage: '/style-presets/cyberpunk.png',
  },
];

export const DEFAULT_DISPLAY_PREFERENCES: DisplayPreferences = {
  language: 'zh',
  theme: 'light',
};

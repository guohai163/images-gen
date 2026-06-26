import type {
  ApiErrorState,
  GenerateRequestPayload,
  GeneratedImage,
  ImageFormState,
  PromptReferenceItem,
  PromptReferenceResponse,
  UploadState,
  UsageRequestPayload,
  UsageResponse,
} from './types';
import { ACCEPTED_IMAGE_TYPES, CUSTOM_SIZE_LIMITS, MAX_UPLOAD_SIZE_BYTES } from './constants';

const MAX_REFERENCE_IMAGE_COUNT = 4;

export function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

export function validateForm(formState: ImageFormState): string | null {
  if (!normalizeBaseUrl(formState.baseUrl)) {
    return '请输入带中转站的接口域名。';
  }

  if (!formState.apiKey.trim()) {
    return '请先填写 API Key。';
  }

  if (!formState.prompt.trim()) {
    return '请填写提示词后再生成图片。';
  }

  if (formState.sizeMode === 'custom') {
    const customSizeValidation = validateCustomSize(formState.customWidth, formState.customHeight);
    if (customSizeValidation) {
      return customSizeValidation;
    }
  } else if (!isValidSizeString(formState.size)) {
    return '请选择受支持的图片尺寸。';
  }

  const validQualities = new Set(['low', 'medium', 'high', 'auto']);
  if (!validQualities.has(formState.quality)) {
    return '请选择受支持的图片品质。';
  }

  return null;
}

export function isValidSizeString(value: string): boolean {
  return /^\d+x\d+$/i.test(value.trim());
}

export function normalizeSizeString(width: string | number, height: string | number): string {
  return `${String(width).trim()}x${String(height).trim()}`;
}

export function parseSizeString(value: string): { width: number; height: number } | null {
  const match = value.trim().match(/^(\d+)x(\d+)$/i);
  if (!match) {
    return null;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  return { width, height };
}

export function validateCustomSize(widthValue: string, heightValue: string): string | null {
  const width = Number(widthValue);
  const height = Number(heightValue);

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return '自定义尺寸需要填写有效的宽度和高度。';
  }

  if (width % CUSTOM_SIZE_LIMITS.step !== 0 || height % CUSTOM_SIZE_LIMITS.step !== 0) {
    return `宽度和高度都必须能被 ${CUSTOM_SIZE_LIMITS.step} 整除。`;
  }

  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  const ratio = longEdge / shortEdge;
  const totalPixels = width * height;

  if (ratio > CUSTOM_SIZE_LIMITS.maxRatio) {
    return `宽高比例不能超过 ${CUSTOM_SIZE_LIMITS.maxRatio}:1。`;
  }

  if (longEdge > CUSTOM_SIZE_LIMITS.maxLongEdge) {
    return `最长边不能超过 ${CUSTOM_SIZE_LIMITS.maxLongEdge}px。`;
  }

  if (shortEdge < CUSTOM_SIZE_LIMITS.minShortEdge) {
    return `最短边不能小于 ${CUSTOM_SIZE_LIMITS.minShortEdge}px。`;
  }

  if (totalPixels < CUSTOM_SIZE_LIMITS.minPixels || totalPixels > CUSTOM_SIZE_LIMITS.maxPixels) {
    return `总像素需介于 ${CUSTOM_SIZE_LIMITS.minPixels.toLocaleString('zh-CN')} 和 ${CUSTOM_SIZE_LIMITS.maxPixels.toLocaleString('zh-CN')} 之间。`;
  }

  return null;
}

export function getResolvedSize(formState: ImageFormState): string {
  return formState.sizeMode === 'custom'
    ? normalizeSizeString(formState.customWidth, formState.customHeight)
    : formState.size;
}

export function getCustomSizeHint(widthValue: string, heightValue: string): string {
  const width = Number(widthValue);
  const height = Number(heightValue);

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return '请输入有效的宽度和高度，单位为 px。';
  }

  const validationMessage = validateCustomSize(widthValue, heightValue);
  if (validationMessage) {
    return validationMessage;
  }

  return `当前尺寸：${width}x${height}，宽高均可被 ${CUSTOM_SIZE_LIMITS.step} 整除。`;
}

export function validateUploadFiles(
  files: File[],
  mode: ImageFormState['generationMode'],
): string | null {
  if (files.length === 0) {
    return null;
  }

  if (mode === 'text') {
    return '纯文本生成模式不需要上传图片。';
  }

  if (mode === 'edit' && files.length > 1) {
    return '编辑原图模式仅支持上传 1 张图片。';
  }

  if (mode === 'reference' && files.length > MAX_REFERENCE_IMAGE_COUNT) {
    return `参考图生成最多支持上传 ${MAX_REFERENCE_IMAGE_COUNT} 张图片。`;
  }

  for (const file of files) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      return '仅支持 PNG、JPEG、WEBP 或 GIF 图片文件。';
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return '上传图片不能超过 10MB。';
    }
  }

  return null;
}

export function createImageDataUrl(base64: string): string {
  return `data:image/png;base64,${base64}`;
}

export function createDownloadFilename(date = new Date()): string {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    '-',
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ];

  return `generated-image-${parts.join('')}.png`;
}

export function createHistoryItem(
  formState: ImageFormState,
  imageDataUrl: string,
  createdAt = new Date(),
): GeneratedImage {
  const resolvedSize = getResolvedSize(formState);
  const parsedSize = parseSizeString(resolvedSize);
  const [width, height] = parsedSize ? [parsedSize.width, parsedSize.height] : [0, 0];

  return {
    id: `${createdAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: createdAt.toISOString(),
    prompt: formState.prompt.trim(),
    width,
    height,
    imageDataUrl,
    filename: createDownloadFilename(createdAt),
  };
}

export async function parseError(response: Response): Promise<ApiErrorState> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = (await response.json()) as Record<string, unknown>;
    const error = body.error as Record<string, unknown> | undefined;
    const message =
      getString(error?.message) ??
      getString(body.message) ??
      `请求失败（HTTP ${response.status}）`;

    return {
      status: response.status,
      message,
      details: getString(error?.code) ?? getString(body.type),
    };
  }

  const text = (await response.text()).trim();
  return {
    status: response.status,
    message: text || `请求失败（HTTP ${response.status}）`,
  };
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export async function requestGenerate(
  payload: GenerateRequestPayload,
): Promise<{ data?: Array<{ b64_json?: string }> }> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as { data?: Array<{ b64_json?: string }> };
}

export async function requestGenerateWithReferenceImages(
  payload: GenerateRequestPayload,
  files: File[],
): Promise<{ data?: Array<{ b64_json?: string }> }> {
  const formData = new FormData();
  formData.append('baseUrl', payload.baseUrl);
  formData.append('apiKey', payload.apiKey);
  formData.append('model', payload.model);
  formData.append('prompt', payload.prompt);
  formData.append('size', payload.size);
  formData.append('quality', payload.quality);
  formData.append('mode', payload.mode ?? 'reference');

  for (const file of files) {
    formData.append('image', file);
  }

  const response = await fetch('/api/generate', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as { data?: Array<{ b64_json?: string }> };
}

export async function requestGenerateWithEditImage(
  payload: GenerateRequestPayload,
  file: File,
): Promise<{ data?: Array<{ b64_json?: string }> }> {
  const formData = new FormData();
  formData.append('baseUrl', payload.baseUrl);
  formData.append('apiKey', payload.apiKey);
  formData.append('model', payload.model);
  formData.append('prompt', payload.prompt);
  formData.append('size', payload.size);
  formData.append('quality', payload.quality);
  formData.append('mode', payload.mode ?? 'reference');
  formData.append('image', file);

  const response = await fetch('/api/generate', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as { data?: Array<{ b64_json?: string }> };
}

export async function fetchUsage(payload: UsageRequestPayload): Promise<UsageResponse> {
  const response = await fetch('/api/usage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as UsageResponse;
}

export async function fetchPromptReference(): Promise<PromptReferenceResponse> {
  const response = await fetch('/api/prompt-reference');

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as PromptReferenceResponse;
}

export function isApiErrorState(value: unknown): value is ApiErrorState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.message === 'string';
}

export function formatMetric(value: number | undefined, digits = 2): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--';
  }

  return value.toLocaleString('zh-CN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export function createUploadPreviewStateFromFiles(files: File[]): UploadState {
  return {
    files,
    previewUrls: files.map((file) => URL.createObjectURL(file)),
    error: null,
  };
}

export function filterPromptReferenceItems(
  items: PromptReferenceItem[],
  selectedCategory: string,
  searchQuery: string,
): PromptReferenceItem[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    if (selectedCategory !== '全部' && item.category !== selectedCategory) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      item.title,
      item.content,
      item.category,
      item.source,
      ...item.tags,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function getPromptReferenceCategories(items: PromptReferenceItem[]): string[] {
  const seen = new Set<string>();

  for (const item of items) {
    if (item.category.trim()) {
      seen.add(item.category.trim());
    }
  }

  return ['全部', ...Array.from(seen)];
}

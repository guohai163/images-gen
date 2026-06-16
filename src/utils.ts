import type {
  ApiErrorState,
  GenerateRequestPayload,
  GeneratedImage,
  ImageFormState,
  UsageRequestPayload,
  UsageResponse,
} from './types';

export function normalizeBaseUrl(input: string): string {
  return input.trim().replace(/\/+$/, '');
}

export function validateForm(formState: ImageFormState): string | null {
  if (!normalizeBaseUrl(formState.baseUrl)) {
    return '请先填写接口域名，例如 https://aiproxy.gydev.cn';
  }

  if (!formState.apiKey.trim()) {
    return '请先填写 API Key。';
  }

  if (!formState.prompt.trim()) {
    return '请填写提示词后再生成图片。';
  }

  const width = Number(formState.width);
  const height = Number(formState.height);

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return '宽度和高度必须是大于 0 的整数。';
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
  return {
    id: `${createdAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: createdAt.toISOString(),
    prompt: formState.prompt.trim(),
    width: Number(formState.width),
    height: Number(formState.height),
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

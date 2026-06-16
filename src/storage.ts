import { DEFAULT_FORM_STATE, HISTORY_LIMIT, STORAGE_KEYS } from './constants';
import type { GenerationHistoryItem, ImageFormState } from './types';

const hasWindow = typeof window !== 'undefined';

type StoredSettings = Pick<
  ImageFormState,
  'baseUrl' | 'apiKey' | 'prompt' | 'width' | 'height'
>;

export function loadStoredSettings(): ImageFormState {
  if (!hasWindow) {
    return DEFAULT_FORM_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) {
      return DEFAULT_FORM_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    return {
      ...DEFAULT_FORM_STATE,
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : '',
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      prompt: typeof parsed.prompt === 'string' ? parsed.prompt : '',
      width: typeof parsed.width === 'string' ? parsed.width : DEFAULT_FORM_STATE.width,
      height: typeof parsed.height === 'string' ? parsed.height : DEFAULT_FORM_STATE.height,
    };
  } catch {
    return DEFAULT_FORM_STATE;
  }
}

export function saveStoredSettings(formState: ImageFormState): void {
  if (!hasWindow) {
    return;
  }

  const payload: StoredSettings = {
    baseUrl: formState.baseUrl,
    apiKey: formState.apiKey,
    prompt: formState.prompt,
    width: formState.width,
    height: formState.height,
  };

  window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(payload));
}

export function clearStoredSettings(): void {
  if (!hasWindow) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.settings);
}

export function loadHistory(): GenerationHistoryItem[] {
  if (!hasWindow) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.history);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isHistoryItem);
  } catch {
    return [];
  }
}

export function saveHistory(history: GenerationHistoryItem[]): GenerationHistoryItem[] {
  if (!hasWindow) {
    return history.slice(0, HISTORY_LIMIT);
  }

  let nextHistory = history.slice(0, HISTORY_LIMIT);

  while (nextHistory.length > 0) {
    try {
      window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(nextHistory));
      return nextHistory;
    } catch {
      nextHistory = nextHistory.slice(0, nextHistory.length - 1);
    }
  }

  try {
    window.localStorage.setItem(STORAGE_KEYS.history, '[]');
  } catch {
    return [];
  }

  return [];
}

export function clearHistory(): void {
  if (!hasWindow) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.history);
}

function isHistoryItem(value: unknown): value is GenerationHistoryItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.prompt === 'string' &&
    typeof candidate.width === 'number' &&
    typeof candidate.height === 'number' &&
    typeof candidate.imageDataUrl === 'string' &&
    typeof candidate.filename === 'string'
  );
}

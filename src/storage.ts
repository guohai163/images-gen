import { DEFAULT_DISPLAY_PREFERENCES, DEFAULT_FORM_STATE, HISTORY_LIMIT, INDEXED_DB, STORAGE_KEYS } from './constants';
import type { DisplayPreferences, GenerationHistoryItem, ImageFormState } from './types';

const hasWindow = typeof window !== 'undefined';

type StoredSettings = Pick<
  ImageFormState,
  | 'baseUrl'
  | 'apiKey'
  | 'prompt'
  | 'negativePrompt'
  | 'stylePreset'
  | 'outputCount'
  | 'seed'
  | 'sizeMode'
  | 'size'
  | 'customWidth'
  | 'customHeight'
  | 'quality'
  | 'generationMode'
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
      negativePrompt: typeof parsed.negativePrompt === 'string' ? parsed.negativePrompt : '',
      stylePreset:
        parsed.stylePreset === 'realistic' ||
        parsed.stylePreset === 'illustration' ||
        parsed.stylePreset === 'anime' ||
        parsed.stylePreset === 'three-d' ||
        parsed.stylePreset === 'cyberpunk'
          ? parsed.stylePreset
          : DEFAULT_FORM_STATE.stylePreset,
      outputCount: parsed.outputCount === 2 || parsed.outputCount === 4 ? parsed.outputCount : DEFAULT_FORM_STATE.outputCount,
      seed: typeof parsed.seed === 'string' ? parsed.seed : '',
      sizeMode: parsed.sizeMode === 'custom' ? 'custom' : DEFAULT_FORM_STATE.sizeMode,
      size: typeof parsed.size === 'string' && parsed.size.trim() ? parsed.size : DEFAULT_FORM_STATE.size,
      customWidth: typeof parsed.customWidth === 'string' && parsed.customWidth.trim() ? parsed.customWidth : DEFAULT_FORM_STATE.customWidth,
      customHeight: typeof parsed.customHeight === 'string' && parsed.customHeight.trim() ? parsed.customHeight : DEFAULT_FORM_STATE.customHeight,
      quality:
        parsed.quality === 'low' ||
        parsed.quality === 'medium' ||
        parsed.quality === 'high' ||
        parsed.quality === 'auto'
          ? parsed.quality
          : DEFAULT_FORM_STATE.quality,
      generationMode:
        parsed.generationMode === 'reference' || parsed.generationMode === 'edit'
          ? parsed.generationMode
          : DEFAULT_FORM_STATE.generationMode,
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
    negativePrompt: formState.negativePrompt,
    stylePreset: formState.stylePreset,
    outputCount: formState.outputCount,
    seed: formState.seed,
    sizeMode: formState.sizeMode,
    size: formState.size,
    customWidth: formState.customWidth,
    customHeight: formState.customHeight,
    quality: formState.quality,
    generationMode: formState.generationMode,
  };

  window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(payload));
}

export function clearStoredSettings(): void {
  if (!hasWindow) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.settings);
}

export function loadDisplayPreferences(): DisplayPreferences {
  if (!hasWindow) {
    return DEFAULT_DISPLAY_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.preferences);
    if (!raw) {
      return DEFAULT_DISPLAY_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<DisplayPreferences>;
    return {
      language: parsed.language === 'en' ? 'en' : DEFAULT_DISPLAY_PREFERENCES.language,
      theme: parsed.theme === 'dark' ? 'dark' : DEFAULT_DISPLAY_PREFERENCES.theme,
    };
  } catch {
    return DEFAULT_DISPLAY_PREFERENCES;
  }
}

export function saveDisplayPreferences(preferences: DisplayPreferences): void {
  if (!hasWindow) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(preferences));
}

export function loadFavoriteHistoryIds(): string[] {
  if (!hasWindow) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.favorites);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

export function saveFavoriteHistoryIds(ids: string[]): void {
  if (!hasWindow) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(ids));
}

export async function loadHistory(): Promise<GenerationHistoryItem[]> {
  if (!hasWindow) {
    return [];
  }

  const db = await openHistoryDb();
  if (!db) {
    return loadLegacyHistory();
  }

  try {
    const history = await readHistoryFromDb(db);
    if (history.length > 0) {
      return history;
    }

    const legacyHistory = loadLegacyHistory();
    if (legacyHistory.length > 0) {
      await writeHistoryToDb(db, legacyHistory);
      window.localStorage.removeItem(STORAGE_KEYS.history);
      return legacyHistory;
    }

    return [];
  } catch {
    return loadLegacyHistory();
  } finally {
    db.close();
  }
}

export async function saveHistory(history: GenerationHistoryItem[]): Promise<GenerationHistoryItem[]> {
  const nextHistory = history.slice(0, HISTORY_LIMIT);

  if (!hasWindow) {
    return nextHistory;
  }

  const db = await openHistoryDb();
  if (!db) {
    saveLegacyHistory(nextHistory);
    return nextHistory;
  }

  try {
    await writeHistoryToDb(db, nextHistory);
    try {
      window.localStorage.removeItem(STORAGE_KEYS.history);
    } catch {
      // Ignore legacy cleanup failures.
    }
    return nextHistory;
  } catch {
    saveLegacyHistory(nextHistory);
    return nextHistory;
  } finally {
    db.close();
  }
}

export async function clearHistory(): Promise<void> {
  if (!hasWindow) {
    return;
  }

  const db = await openHistoryDb();
  if (db) {
    try {
      await deleteHistoryFromDb(db);
    } finally {
      db.close();
    }
  }

  try {
    window.localStorage.removeItem(STORAGE_KEYS.history);
  } catch {
    // Ignore legacy cleanup failures.
  }
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

function loadLegacyHistory(): GenerationHistoryItem[] {
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

    return parsed.filter(isHistoryItem).slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function saveLegacyHistory(history: GenerationHistoryItem[]): void {
  if (!hasWindow) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
  } catch {
    // Ignore fallback storage errors.
  }
}

function openHistoryDb(): Promise<IDBDatabase | null> {
  if (!hasWindow || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const request = window.indexedDB.open(INDEXED_DB.name, INDEXED_DB.version);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INDEXED_DB.store)) {
        db.createObjectStore(INDEXED_DB.store);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

function readHistoryFromDb(db: IDBDatabase): Promise<GenerationHistoryItem[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(INDEXED_DB.store, 'readonly');
    const store = transaction.objectStore(INDEXED_DB.store);
    const request = store.get(INDEXED_DB.historyKey);

    request.onsuccess = () => {
      const value = request.result;
      if (!Array.isArray(value)) {
        resolve([]);
        return;
      }

      resolve(value.filter(isHistoryItem).slice(0, HISTORY_LIMIT));
    };
    request.onerror = () => reject(request.error);
  });
}

function writeHistoryToDb(db: IDBDatabase, history: GenerationHistoryItem[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(INDEXED_DB.store, 'readwrite');
    const store = transaction.objectStore(INDEXED_DB.store);
    const request = store.put(history.slice(0, HISTORY_LIMIT), INDEXED_DB.historyKey);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function deleteHistoryFromDb(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(INDEXED_DB.store, 'readwrite');
    const store = transaction.objectStore(INDEXED_DB.store);
    const request = store.delete(INDEXED_DB.historyKey);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

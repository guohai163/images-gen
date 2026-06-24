import { type FormEvent, startTransition, useEffect, useState } from 'react';
import { ConfigForm } from './components/ConfigForm';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { HistoryPanel } from './components/HistoryPanel';
import { ResultPanel } from './components/ResultPanel';
import { UsagePanel } from './components/UsagePanel';
import { DEFAULT_FORM_STATE, HISTORY_LIMIT } from './constants';
import { clearHistory, clearStoredSettings, loadHistory, loadStoredSettings, saveHistory, saveStoredSettings } from './storage';
import type {
  ApiErrorState,
  GeneratedImage,
  GenerationHistoryItem,
  ImageFormState,
  UploadState,
  UsageState,
} from './types';
import {
  createHistoryItem,
  createImageDataUrl,
  createUploadPreviewState,
  fetchUsage,
  isApiErrorState,
  normalizeBaseUrl,
  requestGenerate,
  requestGenerateWithImage,
  validateForm,
  validateUploadFile,
} from './utils';

function App() {
  const [formState, setFormState] = useState<ImageFormState>(() => loadStoredSettings());
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState<ApiErrorState | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    previewUrl: null,
    error: null,
  });
  const [usageState, setUsageState] = useState<UsageState>({
    data: null,
    isLoading: false,
    error: null,
    updatedAt: null,
  });

  useEffect(() => {
    saveStoredSettings(formState);
  }, [formState]);

  useEffect(() => {
    let cancelled = false;

    void loadHistory().then((loadedHistory) => {
      if (!cancelled) {
        setHistory(loadedHistory);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (uploadState.previewUrl) {
        URL.revokeObjectURL(uploadState.previewUrl);
      }
    };
  }, [uploadState.previewUrl]);

  useEffect(() => {
    if (!normalizeBaseUrl(formState.baseUrl) || !formState.apiKey.trim()) {
      return;
    }

    void refreshUsage();
  }, []);

  function updateField<K extends keyof ImageFormState>(field: K, value: ImageFormState[K]) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleClearConfig() {
    clearStoredSettings();
    setShowApiKey(false);
    setFormState(DEFAULT_FORM_STATE);
    clearUploadState();
    setUsageState({
      data: null,
      isLoading: false,
      error: null,
      updatedAt: null,
    });
  }

  function handleClearHistory() {
    void clearHistory();
    setHistory([]);
    setCurrentImage(null);
    setPreviewImage(null);
  }

  function handleSelectHistory(item: GenerationHistoryItem) {
    startTransition(() => {
      setCurrentImage(item);
      setError(null);
      clearUploadState();
      setFormState((current) => ({
        ...current,
        prompt: item.prompt,
        size:
          item.width > 0 && item.height > 0
            ? (`${item.width}x${item.height}` as ImageFormState['size'])
            : current.size,
      }));
    });
  }

  function clearUploadState() {
    setUploadState((current) => {
      if (current.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return {
        file: null,
        previewUrl: null,
        error: null,
      };
    });
  }

  function handleImageSelect(file: File | null) {
    const uploadError = validateUploadFile(file);

    setUploadState((current) => {
      if (current.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }

      if (!file || uploadError) {
        return {
          file: null,
          previewUrl: null,
          error: uploadError,
        };
      }

      return createUploadPreviewState(file);
    });
  }

  async function refreshUsage() {
    const baseUrl = normalizeBaseUrl(formState.baseUrl);
    const apiKey = formState.apiKey.trim();

    if (!baseUrl || !apiKey) {
      setUsageState({
        data: null,
        isLoading: false,
        error: null,
        updatedAt: null,
      });
      return;
    }

    setUsageState((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }));

    try {
      const data = await fetchUsage({ baseUrl, apiKey });
      setUsageState({
        data,
        isLoading: false,
        error: null,
        updatedAt: new Date().toISOString(),
      });
    } catch (caughtError) {
      const nextError = isApiErrorState(caughtError)
        ? caughtError
        : {
            message: '用量请求失败，请检查接口域名、Key 或跨域配置。',
            details: caughtError instanceof Error ? caughtError.message : undefined,
          };

      setUsageState((current) => ({
        ...current,
        isLoading: false,
        error: nextError,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationMessage = validateForm(formState);
    if (validationMessage) {
      setError({ message: validationMessage });
      return;
    }

    if (uploadState.error) {
      setError({ message: uploadState.error });
      return;
    }

    setIsSubmitting(true);

    try {
      const payloadData = {
        baseUrl: normalizeBaseUrl(formState.baseUrl),
        apiKey: formState.apiKey.trim(),
        model: formState.model,
        prompt: formState.prompt.trim(),
        size: formState.size,
        quality: formState.quality,
        mode: formState.generationMode,
      } as const;
      const payload =
        uploadState.file && formState.generationMode !== 'text'
          ? await requestGenerateWithImage(payloadData, uploadState.file)
          : await requestGenerate(payloadData);
      const base64 = payload.data?.[0]?.b64_json;

      if (!base64) {
        setError({
          message: '返回数据不完整，未找到图片内容。',
        });
        return;
      }

      const imageDataUrl = createImageDataUrl(base64);
      const nextImage = createHistoryItem(formState, imageDataUrl);
      const nextHistory = [nextImage, ...history].slice(0, HISTORY_LIMIT);
      const persistedHistory = await saveHistory(nextHistory);

      setCurrentImage(nextImage);
      setHistory(persistedHistory);
      void refreshUsage();
    } catch (caughtError) {
      const nextError = isApiErrorState(caughtError)
        ? caughtError
        : {
            message: '网络请求失败，请检查本地服务是否启动，或确认接口域名与 Key 配置是否正确。',
            details: caughtError instanceof Error ? caughtError.message : undefined,
          };
      setError(nextError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="brand-lockup" aria-label="魔法画布 The Magic Canvas">
          <img
            className="brand-logo"
            src="/branding/magic-canvas-logo.png"
            alt="魔法画布 The Magic Canvas"
          />
        </div>
        <aside className="warning-card">
          <strong>安全提示</strong>
          <p>这个页面会把 API Key 保存在浏览器本地存储中，适合个人或受控环境使用，不建议在公共设备上保存。</p>
        </aside>
      </header>

      <main className="content-grid">
        <ConfigForm
          formState={formState}
          uploadState={uploadState}
          isSubmitting={isSubmitting}
          showApiKey={showApiKey}
          error={error}
          onSubmit={handleSubmit}
          onFieldChange={updateField}
          onToggleApiKey={() => setShowApiKey((current) => !current)}
          onClearApiKey={() => updateField('apiKey', '')}
          onClearConfig={handleClearConfig}
          onImageSelect={handleImageSelect}
          onRemoveImage={clearUploadState}
        />

        <div className="side-column">
          <UsagePanel
            usageState={usageState}
            hasCredentials={Boolean(normalizeBaseUrl(formState.baseUrl) && formState.apiKey.trim())}
            onRefresh={() => {
              void refreshUsage();
            }}
          />
          <ResultPanel
            image={currentImage}
            isSubmitting={isSubmitting}
            onPreview={(image) => setPreviewImage(image)}
          />
          <HistoryPanel history={history} onSelect={handleSelectHistory} onClear={handleClearHistory} />
        </div>
      </main>
      <ImagePreviewModal
        image={previewImage}
        open={previewImage !== null}
        onClose={() => setPreviewImage(null)}
      />
      <footer className="site-footer">
        <p>© 2026 魔法画布 (The Magic Canvas)</p>
        <a href="https://github.com/guohai163/images-gen" target="_blank" rel="noreferrer">
          github.com/guohai163/images-gen
        </a>
      </footer>
    </div>
  );
}

export default App;

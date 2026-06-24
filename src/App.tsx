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
  createUploadPreviewStateFromFiles,
  fetchUsage,
  isApiErrorState,
  normalizeBaseUrl,
  requestGenerate,
  requestGenerateWithEditImage,
  requestGenerateWithReferenceImages,
  validateForm,
  validateUploadFiles,
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
    files: [],
    previewUrls: [],
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
      for (const previewUrl of uploadState.previewUrls) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [uploadState.previewUrls]);

  useEffect(() => {
    if (!normalizeBaseUrl(formState.baseUrl) || !formState.apiKey.trim()) {
      return;
    }

    void refreshUsage();
  }, []);

  function updateField<K extends keyof ImageFormState>(field: K, value: ImageFormState[K]) {
    if (field === 'generationMode') {
      setUploadState((current) => {
        const nextMode = value as ImageFormState['generationMode'];
        if (nextMode === 'text') {
          for (const previewUrl of current.previewUrls) {
            URL.revokeObjectURL(previewUrl);
          }

          return {
            files: [],
            previewUrls: [],
            error: null,
          };
        }

        if (nextMode === 'edit' && current.files.length > 1) {
          const [firstFile] = current.files;
          const [firstPreviewUrl] = current.previewUrls;

          for (const previewUrl of current.previewUrls.slice(1)) {
            URL.revokeObjectURL(previewUrl);
          }

          return {
            files: firstFile ? [firstFile] : [],
            previewUrls: firstPreviewUrl ? [firstPreviewUrl] : [],
            error: null,
          };
        }

        const nextError = validateUploadFiles(current.files, nextMode);
        return {
          ...current,
          error: nextError,
        };
      });
    }

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
      for (const previewUrl of current.previewUrls) {
        URL.revokeObjectURL(previewUrl);
      }

      return {
        files: [],
        previewUrls: [],
        error: null,
      };
    });
  }

  function handleImageSelect(fileList: FileList | File[] | null) {
    const incomingFiles = fileList ? Array.from(fileList) : [];

    setUploadState((current) => {
      if (incomingFiles.length === 0) {
        return current;
      }

      const nextFiles =
        formState.generationMode === 'reference'
          ? [...current.files, ...incomingFiles]
          : incomingFiles.slice(0, 1);
      const uploadError = validateUploadFiles(nextFiles, formState.generationMode);

      if (uploadError) {
        return {
          ...current,
          error: uploadError,
        };
      }

      for (const previewUrl of current.previewUrls) {
        URL.revokeObjectURL(previewUrl);
      }

      return createUploadPreviewStateFromFiles(nextFiles);
    });
  }

  function handleRemoveImage(index: number) {
    setUploadState((current) => {
      const nextFiles = current.files.filter((_, fileIndex) => fileIndex !== index);
      const nextPreviewUrls = current.previewUrls.filter((_, fileIndex) => fileIndex !== index);
      const removedPreviewUrl = current.previewUrls[index];

      if (removedPreviewUrl) {
        URL.revokeObjectURL(removedPreviewUrl);
      }

      const nextError = validateUploadFiles(nextFiles, formState.generationMode);
      return {
        files: nextFiles,
        previewUrls: nextPreviewUrls,
        error: nextError,
      };
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
        formState.generationMode === 'reference' && uploadState.files.length > 0
          ? await requestGenerateWithReferenceImages(payloadData, uploadState.files)
          : formState.generationMode === 'edit' && uploadState.files[0]
            ? await requestGenerateWithEditImage(payloadData, uploadState.files[0])
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
          <img className="brand-mark" src="/branding/magic-canvas-mark.png" alt="魔法画布图标" />
          <div className="brand-copy">
            <strong>魔法画布</strong>
            <span>The Magic Canvas</span>
          </div>
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
          onRemoveImage={handleRemoveImage}
          onClearImages={clearUploadState}
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

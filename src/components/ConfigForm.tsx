import type { FormEvent } from 'react';
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_SIZE_BYTES, QUALITY_OPTIONS, SIZE_PRESETS } from '../constants';
import type { ApiErrorState, ImageFormState, UploadState } from '../types';

type ConfigFormProps = {
  formState: ImageFormState;
  uploadState: UploadState;
  isSubmitting: boolean;
  showApiKey: boolean;
  error: ApiErrorState | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: <K extends keyof ImageFormState>(field: K, value: ImageFormState[K]) => void;
  onToggleApiKey: () => void;
  onClearApiKey: () => void;
  onClearConfig: () => void;
  onImageSelect: (files: FileList | File[] | null) => void;
  onRemoveImage: (index: number) => void;
  onClearImages: () => void;
};

export function ConfigForm({
  formState,
  uploadState,
  isSubmitting,
  showApiKey,
  error,
  onSubmit,
  onFieldChange,
  onToggleApiKey,
  onClearApiKey,
  onClearConfig,
  onImageSelect,
  onRemoveImage,
  onClearImages,
}: ConfigFormProps) {
  const isReferenceMode = formState.generationMode === 'reference';
  const isEditMode = formState.generationMode === 'edit';

  return (
    <section className="panel panel-form">
      <div className="panel-header">
        <div>
          <p className="eyebrow">生成配置</p>
          <h2>直接从浏览器发起图片生成</h2>
        </div>
        <button className="ghost-button" type="button" onClick={onClearConfig}>
          清空配置
        </button>
      </div>

      <form className="config-form" onSubmit={onSubmit}>
        <label className="field">
          <span>接口域名</span>
          <input
            type="text"
            placeholder="请输入带中转站的接口域名"
            value={formState.baseUrl}
            onChange={(event) => onFieldChange('baseUrl', event.target.value)}
          />
          <small>请输入带中转站的域名；如果没有填写协议，系统会自动补全 `https://`。</small>
        </label>

        <label className="field">
          <span>API Key</span>
          <div className="input-with-actions">
            <input
              type={showApiKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={formState.apiKey}
              onChange={(event) => onFieldChange('apiKey', event.target.value)}
            />
            <button className="inline-button" type="button" onClick={onToggleApiKey}>
              {showApiKey ? '隐藏' : '显示'}
            </button>
            <button className="inline-button" type="button" onClick={onClearApiKey}>
              清空
            </button>
          </div>
        </label>

        <div className="field-row">
          <label className="field">
            <span>模型</span>
            <input type="text" value={formState.model} disabled />
          </label>
          <label className="field">
            <span>品质</span>
            <select value={formState.quality} onChange={(event) => onFieldChange('quality', event.target.value as ImageFormState['quality'])}>
              {QUALITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="field">
          <span>生成方式</span>
          <div className="mode-toggle">
            <button
              className={formState.generationMode === 'text' ? 'mode-button is-active' : 'mode-button'}
              type="button"
              onClick={() => onFieldChange('generationMode', 'text')}
            >
              纯文本生成
            </button>
            <button
              className={formState.generationMode === 'reference' ? 'mode-button is-active' : 'mode-button'}
              type="button"
              onClick={() => onFieldChange('generationMode', 'reference')}
            >
              参考图生成
            </button>
            <button
              className={formState.generationMode === 'edit' ? 'mode-button is-active' : 'mode-button'}
              type="button"
              onClick={() => onFieldChange('generationMode', 'edit')}
            >
              编辑原图
            </button>
          </div>
          <small>
            {isReferenceMode
              ? '上传最多 4 张图片作为风格或主体参考，可继续追加后再结合提示词生成新图。'
              : isEditMode
                ? '上传 1 张原图，并用提示词描述你希望如何修改它。'
                : '不上传图片时，将继续按当前提示词直接生成新图。'}
          </small>
        </div>

        <label className="field">
          <span>提示词</span>
          <textarea
            rows={8}
            placeholder="描述你想生成的图像内容、风格、氛围、镜头感等"
            value={formState.prompt}
            onChange={(event) => onFieldChange('prompt', event.target.value)}
          />
        </label>

        <div className="field">
          <span>输入图片</span>
          <label className="upload-dropzone">
            <input
              className="upload-input"
              type="file"
              multiple={isReferenceMode}
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={(event) => {
                onImageSelect(event.target.files);
                event.target.value = '';
              }}
            />
            {uploadState.files.length > 0 ? (
              isReferenceMode ? (
                <div className="upload-preview-grid">
                  {uploadState.files.map((file, index) => (
                    <div key={`${file.name}-${file.lastModified}-${index}`} className="upload-preview-card">
                      <img src={uploadState.previewUrls[index]} alt={file.name} />
                      <div className="upload-preview-card-body">
                        <strong>{file.name}</strong>
                        <small>{Math.max(1, Math.round(file.size / 1024))} KB</small>
                      </div>
                      <button className="ghost-button" type="button" onClick={() => onRemoveImage(index)}>
                        移除
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="upload-preview">
                  <img src={uploadState.previewUrls[0]} alt="上传预览" />
                  <div className="upload-preview-meta">
                    <strong>{uploadState.files[0]?.name ?? '已选择图片'}</strong>
                    <small>
                      {uploadState.files[0]
                        ? `${Math.max(1, Math.round(uploadState.files[0].size / 1024))} KB`
                        : '当前上传图片'}
                    </small>
                  </div>
                </div>
              )
            ) : (
              <div className="upload-empty">
                <strong>{isReferenceMode ? '点击或拖入参考图' : '点击或拖入一张图片'}</strong>
                <small>
                  {isReferenceMode
                    ? `支持 PNG、JPEG、WEBP、GIF，最多 4 张，每张不超过 ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB。`
                    : `支持 PNG、JPEG、WEBP、GIF，单张不超过 ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB。`}
                </small>
              </div>
            )}
          </label>
          {uploadState.files.length > 0 && !isReferenceMode ? (
            <button className="ghost-button" type="button" onClick={() => onRemoveImage(0)}>
              移除图片
            </button>
          ) : null}
          {uploadState.files.length > 0 && isReferenceMode ? (
            <button className="ghost-button" type="button" onClick={onClearImages}>
              清空全部参考图
            </button>
          ) : null}
          {uploadState.error ? <small className="upload-error">{uploadState.error}</small> : null}
        </div>

        <div className="field">
          <span>图片尺寸</span>
          <select value={formState.size} onChange={(event) => onFieldChange('size', event.target.value as ImageFormState['size'])}>
            {SIZE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          <small>仅保留官方支持的尺寸选项，带图生成时最终画幅仍可能受输入图影响。</small>
        </div>

        {error ? (
          <div className="feedback feedback-error" role="alert">
            <strong>{error.status ? `HTTP ${error.status}` : '请求失败'}</strong>
            <p>{error.message}</p>
            {error.details ? <small>{error.details}</small> : null}
          </div>
        ) : null}

        <button className="submit-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '生成中...' : '生成图片'}
        </button>
      </form>
    </section>
  );
}

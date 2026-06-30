import type { FormEvent } from 'react';
import {
  ACCEPTED_IMAGE_TYPES,
  ASPECT_RATIO_PRESETS,
  IMAGE_SIZE_OPTIONS,
  MAX_UPLOAD_SIZE_BYTES,
  QUALITY_OPTIONS,
  STYLE_PRESETS,
  SUPPORTED_MODELS,
} from '../constants';
import type { ApiErrorState, ImageFormState, SupportedModel, UploadState } from '../types';
import { getCustomSizeHint } from '../utils';

type ConfigFormProps = {
  formState: ImageFormState;
  uploadState: UploadState;
  isSubmitting: boolean;
  isPolishingPrompt: boolean;
  error: ApiErrorState | null;
  polishError: string | null;
  polishedPromptDraft: string | null;
  advancedOpen: boolean;
  configuredModels: SupportedModel[];
  canUsePromptPolish: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: <K extends keyof ImageFormState>(field: K, value: ImageFormState[K]) => void;
  onRemoveImage: (index: number) => void;
  onImageSelect: (files: FileList | File[] | null) => void;
  onClearImages: () => void;
  onAdvancedToggle: () => void;
  onPolishPrompt: () => void;
  onApplyPolishedPrompt: () => void;
  onDismissPolishedPrompt: () => void;
  onResetCreativeFields: () => void;
};

const MODE_OPTIONS: Array<{
  value: ImageFormState['generationMode'];
  label: string;
  icon: string;
}> = [
  { value: 'text', label: '文生图', icon: 'T' },
  { value: 'reference', label: '图生图', icon: '▣' },
  { value: 'edit', label: '图片编辑', icon: '✎' },
];

export function ConfigForm({
  formState,
  uploadState,
  isSubmitting,
  isPolishingPrompt,
  error,
  polishError,
  polishedPromptDraft,
  advancedOpen,
  configuredModels,
  canUsePromptPolish,
  onSubmit,
  onFieldChange,
  onRemoveImage,
  onImageSelect,
  onClearImages,
  onAdvancedToggle,
  onPolishPrompt,
  onApplyPolishedPrompt,
  onDismissPolishedPrompt,
  onResetCreativeFields,
}: ConfigFormProps) {
  const isReferenceMode = formState.generationMode === 'reference';
  const isEditMode = formState.generationMode === 'edit';
  const customSizeHint = getCustomSizeHint(formState.customWidth, formState.customHeight);
  const canPolishPrompt = Boolean(
    formState.prompt.trim() &&
    canUsePromptPolish &&
    !isSubmitting &&
    !isPolishingPrompt,
  );

  return (
    <section className="workspace-panel config-panel control-panel">
      <form className="config-form" onSubmit={onSubmit}>
        <div className="mode-segmented mode-tabs" role="tablist" aria-label="生成模式">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={formState.generationMode === option.value ? 'segment-button mode-tab is-active' : 'segment-button mode-tab'}
              type="button"
              onClick={() => onFieldChange('generationMode', option.value)}
            >
              <span className="segment-icon" aria-hidden="true">
                {option.icon}
              </span>
              {option.label}
            </button>
          ))}
        </div>

        <div className="field">
          <div className="field-head">
            <span>生图模型</span>
            <small>{configuredModels.length > 0 ? '按设置页接口自动路由' : '先在设置页绑定接口'}</small>
          </div>
          <div className="model-select-grid">
            {SUPPORTED_MODELS.map((model) => {
              const isConfigured = configuredModels.includes(model);
              return (
                <button
                  key={model}
                  className={formState.model === model ? 'model-select-chip is-active' : 'model-select-chip'}
                  type="button"
                  disabled={!isConfigured}
                  onClick={() => onFieldChange('model', model)}
                >
                  {model}
                </button>
              );
            })}
          </div>
        </div>

        <label className="field">
          <div className="field-head">
            <span>提示词</span>
            <div className="field-head-actions">
              <button
                className="tiny-button mini-button"
                type="button"
                onClick={onPolishPrompt}
                disabled={!canPolishPrompt}
              >
                {isPolishingPrompt ? '润色中...' : 'AI辅助'}
              </button>
              <button className="tiny-button mini-button" type="button" onClick={onResetCreativeFields}>
                ✧ 清空灵感
              </button>
            </div>
          </div>
          <div className="textarea-wrap">
            <textarea
              rows={6}
              placeholder="一只穿着星空斗篷的白猫魔法师，站在发光的魔法阵上..."
              value={formState.prompt}
              onChange={(event) => onFieldChange('prompt', event.target.value)}
            />
            <span className="counter">{formState.prompt.trim().length}/1000</span>
          </div>
        </label>

        {polishError ? (
          <div className="feedback feedback-error" role="alert">
            <strong>AI 辅助失败</strong>
            <p>{polishError}</p>
          </div>
        ) : null}

        {polishedPromptDraft ? (
          <div className="prompt-polish-card">
            <div className="field-head">
              <span>AI 润色建议</span>
            </div>
            <p>{polishedPromptDraft}</p>
            <div className="result-action-row">
              <button className="action-button primary" type="button" onClick={onApplyPolishedPrompt}>
                应用到提示词
              </button>
              <button className="action-button" type="button" onClick={onDismissPolishedPrompt}>
                关闭
              </button>
            </div>
          </div>
        ) : null}

        <label className="field">
          <div className="field-head">
            <span>负面提示词</span>
            <small>可选</small>
          </div>
          <div className="textarea-wrap">
            <textarea
              rows={3}
              placeholder="如：模糊、低质量、畸形、文字、水印"
              value={formState.negativePrompt}
              onChange={(event) => onFieldChange('negativePrompt', event.target.value)}
            />
            <span className="counter">{formState.negativePrompt.trim().length}/1000</span>
          </div>
        </label>

        <div className="field">
          <div className="field-head">
            <span>风格预设</span>
          </div>
          <div className="style-preset-grid style-grid">
            {STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className={formState.stylePreset === preset.id ? 'style-preset-card style-card is-active' : 'style-preset-card style-card'}
                type="button"
                onClick={() => onFieldChange('stylePreset', preset.id)}
              >
                <span
                  className="style-preset-art style-thumb"
                  style={preset.previewImage ? { backgroundImage: `url(${preset.previewImage})` } : { background: preset.swatch }}
                  aria-hidden="true"
                />
                <strong className="style-name">{preset.label}</strong>
                <span className="style-caption">{preset.promptHint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-head">
            <span>图片比例</span>
            <small>Gemini 使用 aspect_ratio</small>
          </div>
          <div className="ratio-grid chip-grid">
            {ASPECT_RATIO_PRESETS.map((preset) => {
              const isActive = formState.sizeMode === 'preset' && formState.aspectRatio === preset.value;
              return (
                <button
                  key={preset.label}
                  className={isActive ? 'option-chip chip is-active' : 'option-chip chip'}
                  type="button"
                  onClick={() => {
                    onFieldChange('sizeMode', 'preset');
                    onFieldChange('aspectRatio', preset.value);
                  }}
                >
                  <strong>{preset.label}</strong>
                  <span>{preset.ratioLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <div className="field-head">
            <span>生成尺寸</span>
            <small>Gemini 使用 image_size</small>
          </div>
          <div className="ratio-grid image-size-grid">
            {IMAGE_SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={formState.sizeMode === 'preset' && formState.imageSize === option.value ? 'option-chip chip is-active' : 'option-chip chip'}
                type="button"
                onClick={() => {
                  onFieldChange('sizeMode', 'preset');
                  onFieldChange('imageSize', option.value);
                }}
              >
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
            <button
              className={formState.sizeMode === 'custom' ? 'option-chip chip is-active' : 'option-chip chip'}
              type="button"
              onClick={() => {
                onFieldChange('sizeMode', 'custom');
                onFieldChange('size', `${formState.customWidth}x${formState.customHeight}`);
              }}
            >
              <strong>自定义</strong>
              <span>宽高输入</span>
            </button>
          </div>

          {formState.sizeMode === 'custom' ? (
            <div className="custom-size-box">
              <div className="input-group">
                <label htmlFor="customWidth">宽度 px</label>
                <input
                  id="customWidth"
                  type="number"
                  min="256"
                  max="3840"
                  step="16"
                  value={formState.customWidth}
                  onChange={(event) => {
                    onFieldChange('customWidth', event.target.value);
                    onFieldChange('size', `${event.target.value}x${formState.customHeight}`);
                  }}
                />
              </div>
              <div className="dimension-link">⌁</div>
              <div className="input-group">
                <label htmlFor="customHeight">高度 px</label>
                <input
                  id="customHeight"
                  type="number"
                  min="256"
                  max="3840"
                  step="16"
                  value={formState.customHeight}
                  onChange={(event) => {
                    onFieldChange('customHeight', event.target.value);
                    onFieldChange('size', `${formState.customWidth}x${event.target.value}`);
                  }}
                />
              </div>
              <div className="hint custom-size-hint">{customSizeHint}</div>
            </div>
          ) : null}
        </div>

        <div className="compact-control-grid control-row">
          <div className="field">
            <span>生成质量</span>
            <div className="inline-option-group quality-options">
              {QUALITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={formState.quality === option.value ? 'option-pill small-option is-active' : 'option-pill small-option'}
                  type="button"
                  onClick={() => onFieldChange('quality', option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="field">
          <span>输入图片</span>
          <div className="upload-dropzone">
            {uploadState.files.length > 0 ? (
              isReferenceMode ? (
                <div className="upload-preview-grid">
                  {uploadState.files.map((file, index) => (
                    <div key={`${file.name}-${file.lastModified}-${index}`} className="upload-preview-card">
                      <button
                        className="upload-remove-button"
                        type="button"
                        aria-label={`移除 ${file.name}`}
                        onClick={() => onRemoveImage(index)}
                      >
                        x
                      </button>
                      <img src={uploadState.previewUrls[index]} alt={file.name} />
                      <div className="upload-preview-card-body">
                        <strong>{file.name}</strong>
                        <small>{Math.max(1, Math.round(file.size / 1024))} KB</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="upload-preview">
                  <button
                    className="upload-remove-button"
                    type="button"
                    aria-label="移除图片"
                    onClick={() => onRemoveImage(0)}
                  >
                    x
                  </button>
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
                <strong>
                  {isReferenceMode ? '点击或拖入参考图' : isEditMode ? '点击或拖入待编辑图片' : '文生图模式无需上传'}
                </strong>
                <small>
                  {isReferenceMode
                    ? `支持 PNG、JPEG、WEBP、GIF，最多 4 张，每张不超过 ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB。`
                    : isEditMode
                      ? `支持 PNG、JPEG、WEBP、GIF，单张不超过 ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB。`
                  : '切换到图生图或图片编辑后，这里会变成图片上传区。'}
                </small>
                {formState.generationMode !== 'text' ? (
                  <label className="upload-add-button">
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
                    选择图片
                  </label>
                ) : null}
              </div>
            )}
          </div>

          {uploadState.files.length > 0 ? (
            <div className="upload-action-row">
              <label className="upload-add-button">
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
                {isReferenceMode ? '继续添加参考图' : '更换图片'}
              </label>
              {isReferenceMode ? (
                <button className="ghost-button" type="button" onClick={onClearImages}>
                  清空全部参考图
                </button>
              ) : null}
            </div>
          ) : null}
          {uploadState.error ? <small className="upload-error">{uploadState.error}</small> : null}
        </div>

        <div className="advanced-settings">
          <button
            className={advancedOpen ? 'advanced-toggle advanced is-open' : 'advanced-toggle advanced'}
            type="button"
            onClick={onAdvancedToggle}
          >
            <span>高级设置</span>
            <span>{advancedOpen ? '⌃' : '⌄'}</span>
          </button>
          {advancedOpen ? (
            <div className="advanced-content">
              <label className="field">
                <span>当前模型</span>
                <input type="text" value={formState.model} disabled />
              </label>
              <p className="advanced-note">
                当前模型会根据设置页中的“支持模型”自动选择对应接口。负面提示词和风格预设会合并进最终提示词。
              </p>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="feedback feedback-error" role="alert">
            <strong>{error.status ? `HTTP ${error.status}` : '请求失败'}</strong>
            <p>{error.message}</p>
            {error.details ? <small>{error.details}</small> : null}
          </div>
        ) : null}

        <div className="form-actions footer-actions">
          <button className="submit-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '生成中...' : '✨ 立即生成'}
          </button>
          <button className="secondary-button" type="button" onClick={onResetCreativeFields}>
            ⌫ 清空
          </button>
        </div>
      </form>
    </section>
  );
}

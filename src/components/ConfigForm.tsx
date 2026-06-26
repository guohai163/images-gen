import type { FormEvent } from 'react';
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_SIZE_BYTES, QUALITY_OPTIONS, SIZE_PRESETS, STYLE_PRESETS } from '../constants';
import type { ApiErrorState, ImageFormState, UploadState } from '../types';
import { getCustomSizeHint } from '../utils';

type ConfigFormProps = {
  formState: ImageFormState;
  uploadState: UploadState;
  isSubmitting: boolean;
  error: ApiErrorState | null;
  advancedOpen: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: <K extends keyof ImageFormState>(field: K, value: ImageFormState[K]) => void;
  onRemoveImage: (index: number) => void;
  onImageSelect: (files: FileList | File[] | null) => void;
  onClearImages: () => void;
  onAdvancedToggle: () => void;
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

const COUNT_OPTIONS: Array<ImageFormState['outputCount']> = [1, 2, 4];

export function ConfigForm({
  formState,
  uploadState,
  isSubmitting,
  error,
  advancedOpen,
  onSubmit,
  onFieldChange,
  onRemoveImage,
  onImageSelect,
  onClearImages,
  onAdvancedToggle,
  onResetCreativeFields,
}: ConfigFormProps) {
  const isReferenceMode = formState.generationMode === 'reference';
  const isEditMode = formState.generationMode === 'edit';
  const customSizeHint = getCustomSizeHint(formState.customWidth, formState.customHeight);

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

        <label className="field">
          <div className="field-head">
            <span>提示词</span>
            <button className="tiny-button mini-button" type="button" onClick={onResetCreativeFields}>
              ✧ 清空灵感
            </button>
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
                <span className="style-preset-art style-thumb" style={{ background: preset.swatch }} aria-hidden="true" />
                <strong className="style-name">{preset.label}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-head">
            <span>图片比例</span>
            <small>gpt-image-2 size</small>
          </div>
          <div className="ratio-grid chip-grid">
            {SIZE_PRESETS.map((preset) => {
              const isActive = formState.sizeMode === 'preset' && formState.size === preset.value;
              return (
                <button
                  key={preset.value}
                  className={isActive ? 'option-chip chip is-active' : 'option-chip chip'}
                  type="button"
                  onClick={() => {
                    onFieldChange('sizeMode', 'preset');
                    onFieldChange('size', preset.value);
                  }}
                >
                  <strong>{preset.label}</strong>
                  <span>{preset.ratioLabel}</span>
                </button>
              );
            })}
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
            <span>生成数量</span>
            <div className="inline-option-group number-options">
              {COUNT_OPTIONS.map((value) => (
                <button
                  key={value}
                  className={formState.outputCount === value ? 'option-pill small-option is-active' : 'option-pill small-option'}
                  type="button"
                  onClick={() => onFieldChange('outputCount', value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>生成质量</span>
            <div className="inline-option-group quality-options">
              {QUALITY_OPTIONS.filter((option) => option.value === 'medium' || option.value === 'high').map((option) => (
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

          <label className="field">
            <span>随机种子</span>
            <input
              type="text"
              placeholder="选填"
              value={formState.seed}
              onChange={(event) => onFieldChange('seed', event.target.value)}
            />
          </label>
        </div>

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
                `负面提示词 / 风格预设 / 生成数量 / 随机种子` 当前为前端工作流预留，不会改变后端接口请求。
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

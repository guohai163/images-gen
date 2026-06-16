import type { FormEvent } from 'react';
import { SIZE_PRESETS } from '../constants';
import type { ApiErrorState, ImageFormState } from '../types';

type ConfigFormProps = {
  formState: ImageFormState;
  isSubmitting: boolean;
  showApiKey: boolean;
  error: ApiErrorState | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: <K extends keyof ImageFormState>(field: K, value: ImageFormState[K]) => void;
  onPresetClick: (width: number, height: number) => void;
  onToggleApiKey: () => void;
  onClearApiKey: () => void;
  onClearConfig: () => void;
};

export function ConfigForm({
  formState,
  isSubmitting,
  showApiKey,
  error,
  onSubmit,
  onFieldChange,
  onPresetClick,
  onToggleApiKey,
  onClearApiKey,
  onClearConfig,
}: ConfigFormProps) {
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
            type="url"
            placeholder="https://aiproxy.gydev.cn"
            value={formState.baseUrl}
            onChange={(event) => onFieldChange('baseUrl', event.target.value)}
          />
          <small>页面会自动拼接 `/v1/images/generations`。</small>
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
            <span>质量</span>
            <input type="text" value={formState.quality} disabled />
          </label>
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
          <span>尺寸预设</span>
          <div className="preset-grid">
            {SIZE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                className="preset-button"
                type="button"
                onClick={() => onPresetClick(preset.width, preset.height)}
              >
                <strong>{preset.label}</strong>
                <small>
                  {preset.width} x {preset.height}
                </small>
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <label className="field">
            <span>宽度</span>
            <input
              type="number"
              min="1"
              step="1"
              value={formState.width}
              onChange={(event) => onFieldChange('width', event.target.value)}
            />
          </label>
          <label className="field">
            <span>高度</span>
            <input
              type="number"
              min="1"
              step="1"
              value={formState.height}
              onChange={(event) => onFieldChange('height', event.target.value)}
            />
          </label>
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

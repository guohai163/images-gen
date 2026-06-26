import type { ApiErrorState, ImageFormState, UploadState, UsageState } from '../types';
import { UsagePanel } from './UsagePanel';

type SettingsPanelProps = {
  formState: ImageFormState;
  showApiKey: boolean;
  usageState: UsageState;
  uploadState: UploadState;
  error: ApiErrorState | null;
  onFieldChange: <K extends keyof ImageFormState>(field: K, value: ImageFormState[K]) => void;
  onToggleApiKey: () => void;
  onClearApiKey: () => void;
  onClearConfig: () => void;
  onRefreshUsage: () => void;
};

export function SettingsPanel({
  formState,
  showApiKey,
  usageState,
  uploadState,
  error,
  onFieldChange,
  onToggleApiKey,
  onClearApiKey,
  onClearConfig,
  onRefreshUsage,
}: SettingsPanelProps) {
  return (
    <section className="settings-grid">
      <section className="workspace-panel settings-form-panel">
        <div className="section-heading">
          <div>
            <h2>接口设置</h2>
            <p>把技术配置收纳到这里，主工作区保持聚焦创作。</p>
          </div>
          <button className="secondary-button" type="button" onClick={onClearConfig}>
            清空配置
          </button>
        </div>

        <div className="settings-form">
          <label className="field">
            <span>接口域名</span>
            <input
              type="text"
              placeholder="请输入带中转站的接口域名"
              value={formState.baseUrl}
              onChange={(event) => onFieldChange('baseUrl', event.target.value)}
            />
            <small>如果没有填写协议，系统会自动补全 `https://`。</small>
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
              <button className="ghost-button" type="button" onClick={onToggleApiKey}>
                {showApiKey ? '隐藏' : '显示'}
              </button>
              <button className="ghost-button" type="button" onClick={onClearApiKey}>
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
              <span>当前模式</span>
              <input
                type="text"
                value={
                  formState.generationMode === 'text'
                    ? '文生图'
                    : formState.generationMode === 'reference'
                      ? '图生图'
                      : '图片编辑'
                }
                disabled
              />
            </label>
          </div>

          <div className="security-note">
            <strong>安全提示</strong>
            <p>API Key 会保存在当前浏览器本地，仅适合个人或受控环境使用。</p>
          </div>

          {uploadState.error ? (
            <div className="feedback feedback-error" role="alert">
              <strong>上传限制提醒</strong>
              <p>{uploadState.error}</p>
            </div>
          ) : null}

          {error ? (
            <div className="feedback feedback-error" role="alert">
              <strong>{error.status ? `HTTP ${error.status}` : '请求失败'}</strong>
              <p>{error.message}</p>
              {error.details ? <small>{error.details}</small> : null}
            </div>
          ) : null}
        </div>
      </section>

      <UsagePanel
        usageState={usageState}
        hasCredentials={Boolean(formState.baseUrl.trim() && formState.apiKey.trim())}
        onRefresh={onRefreshUsage}
      />
    </section>
  );
}

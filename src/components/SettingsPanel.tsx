import { SUPPORTED_MODELS } from '../constants';
import type { ApiErrorState, ApiProviderConfig, ImageFormState, SupportedModel, UploadState, UsageState } from '../types';
import { findApiProviderForModel, normalizeBaseUrl } from '../utils';
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

function createProvider(index: number, model: SupportedModel): ApiProviderConfig {
  return {
    id: `provider-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `接口 ${index + 1}`,
    baseUrl: '',
    apiKey: '',
    supportedModels: [model],
  };
}

function sortModels(models: SupportedModel[]): SupportedModel[] {
  return SUPPORTED_MODELS.filter((model) => models.includes(model));
}

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
  const activeProvider = findApiProviderForModel(formState.apiProviders, formState.model);
  const hasActiveCredentials = Boolean(
    normalizeBaseUrl(activeProvider?.baseUrl ?? formState.baseUrl) &&
    (activeProvider?.apiKey ?? formState.apiKey).trim(),
  );

  function updateProviders(providers: ApiProviderConfig[]) {
    onFieldChange('apiProviders', providers);
  }

  function handleAddProvider() {
    updateProviders([
      ...formState.apiProviders,
      createProvider(formState.apiProviders.length, formState.model),
    ]);
  }

  function handleRemoveProvider(providerId: string) {
    updateProviders(formState.apiProviders.filter((provider) => provider.id !== providerId));
  }

  function handleProviderChange(
    providerId: string,
    patch: Partial<Pick<ApiProviderConfig, 'name' | 'baseUrl' | 'apiKey' | 'supportedModels'>>,
  ) {
    updateProviders(
      formState.apiProviders.map((provider) =>
        provider.id === providerId
          ? {
              ...provider,
              ...patch,
            }
          : provider,
      ),
    );
  }

  function handleModelToggle(provider: ApiProviderConfig, model: SupportedModel) {
    const supportedModels = provider.supportedModels.includes(model)
      ? provider.supportedModels.filter((item) => item !== model)
      : sortModels([...provider.supportedModels, model]);

    handleProviderChange(provider.id, { supportedModels });
  }

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
          <div className="settings-toolbar">
            <div className="active-provider-summary">
              <span>当前生图模型</span>
              <strong>{formState.model}</strong>
              <small>{activeProvider?.name ?? '未匹配接口'}</small>
            </div>
            <div className="settings-toolbar-actions">
              <button className="ghost-button" type="button" onClick={onToggleApiKey}>
                {showApiKey ? '隐藏 Key' : '显示 Key'}
              </button>
              <button className="ghost-button" type="button" onClick={onClearApiKey} disabled={!activeProvider}>
                清空当前 Key
              </button>
              <button className="action-button primary" type="button" onClick={handleAddProvider}>
                新增接口
              </button>
            </div>
          </div>

          {formState.apiProviders.length === 0 ? (
            <div className="empty-state provider-empty">
              <p>还没有接口配置。</p>
              <button className="action-button primary" type="button" onClick={handleAddProvider}>
                新增第一组接口
              </button>
            </div>
          ) : (
            <div className="provider-list">
              {formState.apiProviders.map((provider, index) => {
                const isActive = activeProvider?.id === provider.id;
                const providerHasCredentials = Boolean(normalizeBaseUrl(provider.baseUrl) && provider.apiKey.trim());

                return (
                  <article key={provider.id} className={isActive ? 'provider-card is-active' : 'provider-card'}>
                    <div className="provider-card-header">
                      <div>
                        <strong>{provider.name.trim() || `接口 ${index + 1}`}</strong>
                        <small>
                          {providerHasCredentials ? '已填写凭证' : '待填写凭证'}
                          {isActive ? ' · 当前使用' : ''}
                        </small>
                      </div>
                      <button
                        className="ghost-button mini-button"
                        type="button"
                        onClick={() => handleRemoveProvider(provider.id)}
                      >
                        删除
                      </button>
                    </div>

                    <div className="provider-fields">
                      <label className="field">
                        <span>接口名称</span>
                        <input
                          type="text"
                          placeholder={`接口 ${index + 1}`}
                          value={provider.name}
                          onChange={(event) => handleProviderChange(provider.id, { name: event.target.value })}
                        />
                      </label>

                      <label className="field">
                        <span>接口域名 Base URL</span>
                        <input
                          type="text"
                          placeholder="https://api.example.com"
                          value={provider.baseUrl}
                          onChange={(event) => handleProviderChange(provider.id, { baseUrl: event.target.value })}
                        />
                        <small>未填写协议时会自动补全 https://。</small>
                      </label>

                      <label className="field provider-key-field">
                        <span>API Key</span>
                        <div className="input-with-actions">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            placeholder="sk-..."
                            value={provider.apiKey}
                            onChange={(event) => handleProviderChange(provider.id, { apiKey: event.target.value })}
                          />
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={() => handleProviderChange(provider.id, { apiKey: '' })}
                          >
                            清空
                          </button>
                        </div>
                      </label>

                      <div className="field provider-model-field">
                        <div className="field-head">
                          <span>支持模型</span>
                          <small>{provider.supportedModels.length} 个</small>
                        </div>
                        <div className="model-chip-grid">
                          {SUPPORTED_MODELS.map((model) => (
                            <button
                              key={model}
                              className={
                                provider.supportedModels.includes(model)
                                  ? 'model-chip is-active'
                                  : 'model-chip'
                              }
                              type="button"
                              onClick={() => handleModelToggle(provider, model)}
                            >
                              {model}
                            </button>
                          ))}
                        </div>
                        {provider.supportedModels.length === 0 ? (
                          <small className="provider-warning">至少勾选一个模型。</small>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

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
        hasCredentials={hasActiveCredentials}
        onRefresh={onRefreshUsage}
      />
    </section>
  );
}

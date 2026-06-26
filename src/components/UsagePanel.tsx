import type { UsageState } from '../types';
import { formatMetric } from '../utils';

type UsagePanelProps = {
  usageState: UsageState;
  hasCredentials: boolean;
  onRefresh: () => void;
};

export function UsagePanel({ usageState, hasCredentials, onRefresh }: UsagePanelProps) {
  const usage = usageState.data;
  const unit = usage?.unit ?? 'USD';
  const subscription = usage?.subscription;
  const today = usage?.usage?.today;
  const total = usage?.usage?.total;

  return (
    <section className="workspace-panel usage-panel">
      <div className="section-heading">
        <div>
          <h2>接口用量</h2>
          <p>首次打开与生成完成后自动刷新，也可以手动拉取最新配额。</p>
        </div>
        <button
          className="ghost-button"
          type="button"
          onClick={onRefresh}
          disabled={!hasCredentials || usageState.isLoading}
        >
          {usageState.isLoading ? '刷新中...' : '刷新用量'}
        </button>
      </div>

      {!hasCredentials ? (
        <div className="empty-state usage-empty">
          <p>填写接口域名和 API Key 后，这里会显示当前账户的剩余额度与用量信息。</p>
        </div>
      ) : usageState.error ? (
        <div className="feedback feedback-error" role="alert">
          <strong>{usageState.error.status ? `HTTP ${usageState.error.status}` : '用量获取失败'}</strong>
          <p>{usageState.error.message}</p>
          {usageState.error.details ? <small>{usageState.error.details}</small> : null}
        </div>
      ) : usage ? (
        <div className="usage-content">
          <div className="usage-summary-grid">
            <div className="usage-stat">
              <span>套餐</span>
              <strong>{usage.planName ?? '--'}</strong>
            </div>
            <div className="usage-stat">
              <span>模式</span>
              <strong>{usage.mode ?? '--'}</strong>
            </div>
            <div className="usage-stat">
              <span>剩余额度</span>
              <strong>
                {formatMetric(usage.remaining, 3)} {unit}
              </strong>
            </div>
            <div className="usage-stat">
              <span>Key 状态</span>
              <strong>{usage.isValid ? '有效' : '未验证'}</strong>
            </div>
          </div>

          <div className="usage-metrics-grid">
            <div className="usage-card">
              <span>今日花费</span>
              <strong>
                {formatMetric(today?.actual_cost ?? today?.cost)} {unit}
              </strong>
              <small>请求 {formatMetric(today?.requests, 0)} 次</small>
            </div>
            <div className="usage-card">
              <span>总花费</span>
              <strong>
                {formatMetric(total?.actual_cost ?? total?.cost)} {unit}
              </strong>
              <small>累计请求 {formatMetric(total?.requests, 0)} 次</small>
            </div>
            <div className="usage-card">
              <span>日限额</span>
              <strong>
                {formatMetric(subscription?.daily_limit_usd)} {unit}
              </strong>
              <small>已用 {formatMetric(subscription?.daily_usage_usd)} {unit}</small>
            </div>
            <div className="usage-card">
              <span>月限额</span>
              <strong>
                {formatMetric(subscription?.monthly_limit_usd)} {unit}
              </strong>
              <small>已用 {formatMetric(subscription?.monthly_usage_usd)} {unit}</small>
            </div>
          </div>

          <div className="usage-detail-grid">
            <div className="usage-detail">
              <span>今日 Token</span>
              <strong>{formatMetric(today?.total_tokens, 0)}</strong>
            </div>
            <div className="usage-detail">
              <span>累计 Token</span>
              <strong>{formatMetric(total?.total_tokens, 0)}</strong>
            </div>
            <div className="usage-detail">
              <span>平均耗时</span>
              <strong>{formatMetric(usage.usage?.average_duration_ms, 0)} ms</strong>
            </div>
            <div className="usage-detail">
              <span>到期时间</span>
              <strong>
                {subscription?.expires_at
                  ? new Date(subscription.expires_at).toLocaleString()
                  : '--'}
              </strong>
            </div>
          </div>

          {usageState.updatedAt ? (
            <p className="usage-updated-at">
              最近更新：{new Date(usageState.updatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="empty-state usage-empty">
          <p>{usageState.isLoading ? '正在读取当前用量...' : '点击“刷新用量”即可获取当前配额与消费数据。'}</p>
        </div>
      )}
    </section>
  );
}

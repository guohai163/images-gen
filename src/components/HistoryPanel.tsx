import type { GenerationHistoryItem } from '../types';

type HistoryPanelProps = {
  history: GenerationHistoryItem[];
  favoriteIds: string[];
  onSelect: (item: GenerationHistoryItem) => void;
  onClear: () => void;
};

export function HistoryPanel({ history, favoriteIds, onSelect, onClear }: HistoryPanelProps) {
  return (
    <section className="history-panel embedded-history-panel">
      <div className="history-head">
        <div>
          <h2>最近生成</h2>
        </div>
        <button className="tiny-button linkish-button" type="button" onClick={onClear} disabled={history.length === 0}>
          清空历史
        </button>
      </div>

      {history.length === 0 ? (
        <div className="empty-state history-empty">
          <p>当前还没有历史记录。成功生成后会自动保存在此浏览器中。</p>
        </div>
      ) : (
        <div className="history-strip history-grid">
          {history.map((item) => (
            <button
              key={item.id}
              className="history-card history-item"
              type="button"
              onClick={() => onSelect(item)}
            >
              <div className="history-thumb-wrap history-thumb">
                <img src={item.imageDataUrl} alt={item.prompt} />
                {favoriteIds.includes(item.id) ? <span className="favorite-badge">收藏</span> : null}
              </div>
              <div className="history-card-body">
                <strong className="history-title">{item.prompt}</strong>
                <p className="history-meta">
                  {item.width > 0 && item.height > 0 ? `${item.width} x ${item.height}` : '自动尺寸'}
                  {' · '}
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

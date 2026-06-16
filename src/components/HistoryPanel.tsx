import type { GenerationHistoryItem } from '../types';

type HistoryPanelProps = {
  history: GenerationHistoryItem[];
  onSelect: (item: GenerationHistoryItem) => void;
  onClear: () => void;
};

export function HistoryPanel({ history, onSelect, onClear }: HistoryPanelProps) {
  return (
    <section className="panel history-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">最近记录</p>
          <h2>保存在浏览器本地的最近 10 条</h2>
        </div>
        <button className="ghost-button" type="button" onClick={onClear} disabled={history.length === 0}>
          清空历史
        </button>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <p>当前还没有历史记录。成功生成后会自动保存在此浏览器中。</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <button
              key={item.id}
              className="history-item"
              type="button"
              onClick={() => onSelect(item)}
            >
              <img src={item.imageDataUrl} alt={item.prompt} />
              <div className="history-item-body">
                <strong>{item.width} x {item.height}</strong>
                <p>{item.prompt}</p>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

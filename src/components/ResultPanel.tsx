import type { GeneratedImage } from '../types';
import { HistoryPanel } from './HistoryPanel';
import type { GenerationHistoryItem } from '../types';

type ResultPanelProps = {
  image: GeneratedImage | null;
  isSubmitting: boolean;
  isFavorite: boolean;
  copyFeedback: string | null;
  history: GenerationHistoryItem[];
  favoriteIds: string[];
  onPreview: (image: GeneratedImage) => void;
  onRegenerate: () => void;
  onCopy: () => void;
  onToggleFavorite: () => void;
  onSelectHistory: (item: GenerationHistoryItem) => void;
  onClearHistory: () => void;
};

export function ResultPanel({
  image,
  isSubmitting,
  isFavorite,
  copyFeedback,
  history,
  favoriteIds,
  onPreview,
  onRegenerate,
  onCopy,
  onToggleFavorite,
  onSelectHistory,
  onClearHistory,
}: ResultPanelProps) {
  return (
    <section className="workspace-panel result-panel ai-result-panel">
      <div className="section-heading result-heading panel-header">
        <div>
          <h2>生成结果</h2>
        </div>
        <button className="ghost-button mini-button" type="button" onClick={onRegenerate} disabled={!image || isSubmitting}>
          {isSubmitting ? '生成中...' : '重新生成'}
        </button>
      </div>

      {image ? (
        <div className="result-content">
          <button
            className="result-image-button"
            type="button"
            onClick={() => onPreview(image)}
            aria-label="点击预览大图"
          >
            <img
              className="result-image"
              src={image.imageDataUrl}
              alt={image.prompt || '生成图片预览'}
            />
          </button>

          <div className="result-action-row preview-actions">
            <a className="action-button primary" href={image.imageDataUrl} download={image.filename}>
              下载图片
            </a>
            <button className="action-button" type="button" onClick={onCopy}>
              复制链接
            </button>
            <button className="action-button" type="button" onClick={onRegenerate} disabled={isSubmitting}>
              再次生成
            </button>
            <button
              className={isFavorite ? 'action-button is-favorite' : 'action-button'}
              type="button"
              onClick={onToggleFavorite}
            >
              {isFavorite ? '已收藏' : '加入收藏'}
            </button>
          </div>

          <div className="result-meta-grid preview-meta-grid">
            <div className="info-tile">
              <span>图片尺寸</span>
              <strong>
                {image.width > 0 && image.height > 0 ? `${image.width} x ${image.height}` : '自动尺寸'}
              </strong>
            </div>
            <div className="info-tile">
              <span>生成时间</span>
              <strong>{new Date(image.createdAt).toLocaleString()}</strong>
            </div>
          </div>

          <div className="prompt-preview">
            <strong>当前提示词</strong>
            <p>{image.prompt}</p>
          </div>

          {copyFeedback ? <p className="copy-feedback">{copyFeedback}</p> : null}
        </div>
      ) : (
        <div className="empty-state result-empty">
          <p>{isSubmitting ? '正在等待远程接口返回图片...' : '还没有生成图片，先在左侧写下你的想法吧。'}</p>
        </div>
      )}

      <div className="divider" />

      <HistoryPanel
        history={history}
        favoriteIds={favoriteIds}
        onSelect={onSelectHistory}
        onClear={onClearHistory}
      />
    </section>
  );
}

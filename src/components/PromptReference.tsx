import type { PromptReferenceItem } from '../types';

type PromptReferenceProps = {
  items: PromptReferenceItem[];
  categories: string[];
  selectedCategory: string;
  searchQuery: string;
  sourceLabel: string;
  isLoading: boolean;
  error: string | null;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onApply: (item: PromptReferenceItem) => void;
};

export function PromptReference({
  items,
  categories,
  selectedCategory,
  searchQuery,
  sourceLabel,
  isLoading,
  error,
  onSearchChange,
  onCategoryChange,
  onApply,
}: PromptReferenceProps) {
  return (
    <section className="workspace-panel prompt-reference-panel">
      <div className="section-heading">
        <div>
          <h2>提示词参考</h2>
          <p>复用 ZeroLu/awesome-gpt-image 的 Markdown 数据源，筛选后可一键带回 Ai 生图。</p>
        </div>
        <div className="source-chip">{sourceLabel}</div>
      </div>

      <div className="prompt-reference-toolbar">
        <label className="search-field">
          <input
            type="text"
            placeholder="搜索标题、提示词正文或分类"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        <div className="category-strip" role="tablist" aria-label="提示词分类">
          {categories.map((category) => (
            <button
              key={category}
              className={selectedCategory === category ? 'category-pill is-active' : 'category-pill'}
              type="button"
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <p>正在加载提示词参考...</p>
        </div>
      ) : error ? (
        <div className="feedback feedback-error" role="alert">
          <strong>提示词参考加载失败</strong>
          <p>{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>当前筛选条件下没有找到匹配的提示词。</p>
        </div>
      ) : (
        <div className="prompt-reference-grid">
          {items.map((item) => (
            <article key={item.id} className="prompt-reference-card">
              <div className="prompt-reference-card-header">
                <span className="prompt-reference-category">{item.category}</span>
                <strong>{item.title}</strong>
              </div>

              {item.images[0] ? (
                <div className="prompt-reference-image-wrap">
                  <img src={item.images[0]} alt={item.title} className="prompt-reference-image" />
                </div>
              ) : null}

              <p className="prompt-reference-content">{item.content}</p>

              <div className="prompt-reference-meta">
                {item.tags.slice(0, 4).map((tag) => (
                  <span key={`${item.id}-${tag}`} className="prompt-tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="prompt-reference-actions">
                <button className="action-button primary" type="button" onClick={() => onApply(item)}>
                  应用到 Ai 生图
                </button>
                <a
                  className="action-button"
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  查看来源
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

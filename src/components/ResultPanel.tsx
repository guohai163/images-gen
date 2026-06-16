import type { GeneratedImage } from '../types';

type ResultPanelProps = {
  image: GeneratedImage | null;
  isSubmitting: boolean;
};

export function ResultPanel({ image, isSubmitting }: ResultPanelProps) {
  return (
    <section className="panel result-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">结果预览</p>
          <h2>生成完成后会在这里展示</h2>
        </div>
        {image ? (
          <a className="primary-link" href={image.imageDataUrl} download={image.filename}>
            下载 PNG
          </a>
        ) : null}
      </div>

      {image ? (
        <div className="result-content">
          <img
            className="result-image"
            src={image.imageDataUrl}
            alt={image.prompt || '生成图片预览'}
          />
          <div className="result-meta">
            <div>
              <span>尺寸</span>
              <strong>
                {image.width} x {image.height}
              </strong>
            </div>
            <div>
              <span>时间</span>
              <strong>{new Date(image.createdAt).toLocaleString()}</strong>
            </div>
          </div>
          <p className="prompt-preview">{image.prompt}</p>
        </div>
      ) : (
        <div className="empty-state">
          <p>{isSubmitting ? '正在等待远程接口返回图片...' : '还没有生成图片，先填写左侧表单吧。'}</p>
        </div>
      )}
    </section>
  );
}

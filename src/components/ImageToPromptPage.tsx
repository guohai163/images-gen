import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_SIZE_BYTES } from '../constants';
import type { ApiErrorState, UploadState } from '../types';

type ImageToPromptPageProps = {
  uploadState: UploadState;
  isGenerating: boolean;
  hasCredentials: boolean;
  generatedPromptDraft: string | null;
  error: string | null;
  onImageSelect: (files: FileList | File[] | null) => void;
  onClearImage: () => void;
  onGenerate: () => void;
  onApplyPrompt: () => void;
  onDismissPrompt: () => void;
};

export function ImageToPromptPage({
  uploadState,
  isGenerating,
  hasCredentials,
  generatedPromptDraft,
  error,
  onImageSelect,
  onClearImage,
  onGenerate,
  onApplyPrompt,
  onDismissPrompt,
}: ImageToPromptPageProps) {
  const selectedFile = uploadState.files[0];
  const previewUrl = uploadState.previewUrls[0];
  const canGenerate = Boolean(selectedFile && hasCredentials && !isGenerating);

  return (
    <section className="workspace-panel image-to-prompt-panel">
      <div className="section-heading">
        <div>
          <h2>图转提示词</h2>
          <p>上传一张图片，交给 `gpt-5.4` 分析并生成一段适合 `gpt-image-2` 使用的提示词。</p>
        </div>
      </div>

      <div className="image-to-prompt-layout">
        <div className="field">
          <span>上传图片</span>
          <label className="upload-dropzone">
            <input
              className="upload-input"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={(event) => {
                onImageSelect(event.target.files);
                event.target.value = '';
              }}
            />
            {selectedFile && previewUrl ? (
              <div className="upload-preview">
                <img src={previewUrl} alt={selectedFile.name} />
                <div className="upload-preview-meta">
                  <strong>{selectedFile.name}</strong>
                  <small>{Math.max(1, Math.round(selectedFile.size / 1024))} KB</small>
                  <button className="ghost-button" type="button" onClick={onClearImage}>
                    移除图片
                  </button>
                </div>
              </div>
            ) : (
              <div className="upload-empty">
                <strong>拖入或点击上传 1 张图片</strong>
                <small>
                  支持 PNG、JPEG、WEBP、GIF，单张不超过 {MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB。
                </small>
              </div>
            )}
          </label>
        </div>

        <div className="form-actions image-to-prompt-actions">
          <div className="hint">
            {!hasCredentials ? '请先在设置页填写接口域名和 API Key。' : '系统会使用当前设置页中的同一套接口配置。'}
          </div>
          <button className="submit-button" type="button" onClick={onGenerate} disabled={!canGenerate}>
            {isGenerating ? '识图分析中...' : 'AI识图生成提示词'}
          </button>
        </div>

        {uploadState.error ? (
          <div className="feedback feedback-error" role="alert">
            <strong>上传失败</strong>
            <p>{uploadState.error}</p>
          </div>
        ) : null}

        {error ? (
          <div className="feedback feedback-error" role="alert">
            <strong>识图失败</strong>
            <p>{error}</p>
          </div>
        ) : null}

        {generatedPromptDraft ? (
          <div className="prompt-polish-card">
            <div className="field-head">
              <span>AI 生成提示词建议</span>
            </div>
            <p>{generatedPromptDraft}</p>
            <div className="result-action-row">
              <button className="action-button primary" type="button" onClick={onApplyPrompt}>
                应用到 Ai生图
              </button>
              <button className="action-button" type="button" onClick={onDismissPrompt}>
                关闭
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

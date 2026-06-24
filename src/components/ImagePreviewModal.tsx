import { useEffect, useRef, useState } from 'react';
import type { GeneratedImage } from '../types';

type ImagePreviewModalProps = {
  image: GeneratedImage | null;
  open: boolean;
  onClose: () => void;
};

const SCALE_STEP = 0.25;

export function ImagePreviewModal({ image, open, onClose }: ImagePreviewModalProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fitScaleRef = useRef(1);
  const [intrinsicSize, setIntrinsicSize] = useState({
    width: 0,
    height: 0,
  });
  const [fitScale, setFitScale] = useState(1);
  const [scale, setScale] = useState(1);

  function updateFitScale() {
    const viewport = viewportRef.current;
    const previewImage = imageRef.current;

    if (!viewport || !previewImage || !previewImage.naturalWidth || !previewImage.naturalHeight) {
      return;
    }

    const nextFitScale = Math.min(
      viewport.clientWidth / previewImage.naturalWidth,
      viewport.clientHeight / previewImage.naturalHeight,
      1,
    );
    const previousFitScale = fitScaleRef.current;

    fitScaleRef.current = nextFitScale;
    setFitScale(nextFitScale);
    setScale((current) => {
      const wasUsingFitScale = Math.abs(current - previousFitScale) < 0.01;
      return wasUsingFitScale || current < nextFitScale ? nextFitScale : current;
    });
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open || !image) {
      fitScaleRef.current = 1;
      setIntrinsicSize({
        width: 0,
        height: 0,
      });
      setFitScale(1);
      setScale(1);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      updateFitScale();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [image, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleResize() {
      updateFitScale();
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  if (!open || !image) {
    return null;
  }

  const displayWidth = intrinsicSize.width || image.width;
  const displayHeight = intrinsicSize.height || image.height;
  const previewWidth = displayWidth > 0 ? Math.max(1, Math.round(displayWidth * scale)) : undefined;
  const previewHeight = displayHeight > 0 ? Math.max(1, Math.round(displayHeight * scale)) : undefined;
  const scalePercent = Math.round(scale * 100);
  const canZoomOut = scale > fitScale + 0.01;

  return (
    <div className="preview-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="preview-modal"
        role="dialog"
        aria-modal="true"
        aria-label="图片预览"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="preview-modal-toolbar">
          <div className="preview-modal-heading">
            <strong>图片预览</strong>
            <span>
              {displayWidth > 0 && displayHeight > 0 ? `${displayWidth} x ${displayHeight}` : '正在读取尺寸...'}
            </span>
          </div>
          <div className="preview-modal-actions">
            <button
              className="ghost-button"
              type="button"
              onClick={() => setScale((current) => Math.max(fitScale, current - SCALE_STEP))}
              disabled={!canZoomOut}
            >
              缩小
            </button>
            <button className="ghost-button" type="button" onClick={() => setScale(1)}>
              1:1
            </button>
            <button className="ghost-button" type="button" onClick={() => setScale((current) => current + SCALE_STEP)}>
              放大
            </button>
            <span className="preview-scale-indicator" aria-live="polite">
              {scalePercent}%
            </span>
            <button className="inline-button" type="button" onClick={onClose}>
              关闭
            </button>
          </div>
        </div>

        <div className="preview-modal-viewport" ref={viewportRef}>
          <img
            ref={imageRef}
            className="preview-modal-image"
            src={image.imageDataUrl}
            alt={image.prompt || '生成图片预览'}
            width={previewWidth}
            height={previewHeight}
            onLoad={(event) => {
              setIntrinsicSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              });
              updateFitScale();
            }}
          />
        </div>
      </div>
    </div>
  );
}

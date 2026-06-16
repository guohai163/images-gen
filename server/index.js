import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const indexFile = path.join(distDir, 'index.html');
const IMAGE_PATH = '/v1/images/generations';
const EDIT_PATH = '/v1/images/edits';
const USAGE_PATH = '/v1/usage';
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
  },
});

app.use(express.json({ limit: '2mb' }));

app.post('/api/generate', upload.single('image'), async (req, res) => {
  const { baseUrl, apiKey, model, prompt, size, quality } = req.body ?? {};
  const mode = req.body?.mode ?? 'text';
  const uploadedImage = req.file;

  const validationError =
    validateBaseFields(baseUrl, apiKey) ||
    validateGenerateFields(model, prompt, size, quality, mode, uploadedImage);

  if (validationError) {
    res.status(400).json({
      error: {
        message: validationError,
      },
    });
    return;
  }

  const upstreamPath = uploadedImage ? EDIT_PATH : IMAGE_PATH;
  const upstreamUrl = buildUpstreamUrl(baseUrl, upstreamPath);
  if (!upstreamUrl) {
    res.status(400).json({
      error: {
        message: '接口域名无效，只允许 http 或 https 协议。',
      },
    });
    return;
  }

  try {
    const upstreamResponse = uploadedImage
      ? await fetchWithImageEdit({
          upstreamUrl,
          apiKey,
          model,
          prompt,
          size,
          quality,
          mode,
          uploadedImage,
        })
      : await fetch(upstreamUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            prompt: prompt.trim(),
            size,
            quality,
          }),
        });

    await proxyResponse(upstreamResponse, res);
  } catch (error) {
    res.status(502).json({
      error: {
        message: '代理请求上游图片接口失败。',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
});

app.post('/api/usage', async (req, res) => {
  const { baseUrl, apiKey } = req.body ?? {};
  const validationError = validateBaseFields(baseUrl, apiKey);

  if (validationError) {
    res.status(400).json({
      error: {
        message: validationError,
      },
    });
    return;
  }

  const upstreamUrl = buildUpstreamUrl(baseUrl, USAGE_PATH);
  if (!upstreamUrl) {
    res.status(400).json({
      error: {
        message: '接口域名无效，只允许 http 或 https 协议。',
      },
    });
    return;
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });

    await proxyResponse(upstreamResponse, res);
  } catch (error) {
    res.status(502).json({
      error: {
        message: '代理请求上游用量接口失败。',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
});

app.use(express.static(distDir));

app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(indexFile);
});

app.listen(PORT, () => {
  console.log(`Image Gen server listening on http://0.0.0.0:${PORT}`);
});

function normalizeBaseUrl(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

function buildUpstreamUrl(baseUrl, pathName) {
  const normalized = normalizeBaseUrl(baseUrl);
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    return `${url.origin}${pathName}`;
  } catch {
    return null;
  }
}

function validateBaseFields(baseUrl, apiKey) {
  if (!normalizeBaseUrl(baseUrl)) {
    return '请输入带中转站的接口域名。';
  }

  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    return '请先填写 API Key。';
  }

  return null;
}

function validateGenerateFields(model, prompt, size, quality, mode, uploadedImage) {
  if (model !== 'gpt-image-2') {
    return '当前仅支持 gpt-image-2 模型。';
  }

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return '请填写提示词后再生成图片。';
  }

  if (quality !== 'medium') {
    return '当前仅支持 medium 质量。';
  }

  if (typeof size !== 'string' || !/^[1-9]\d*x[1-9]\d*$/.test(size)) {
    return '图片尺寸格式无效，应为类似 1536x1024 的宽x高。';
  }

  const acceptedModes = new Set(['text', 'reference', 'edit']);
  if (!acceptedModes.has(mode)) {
    return '生成模式无效。';
  }

  if (uploadedImage) {
    if (!ACCEPTED_IMAGE_TYPES.has(uploadedImage.mimetype)) {
      return '仅支持 PNG、JPEG、WEBP 或 GIF 图片文件。';
    }
  }

  return null;
}

async function fetchWithImageEdit({
  upstreamUrl,
  apiKey,
  model,
  prompt,
  size,
  quality,
  mode,
  uploadedImage,
}) {
  const formData = new FormData();
  formData.append('model', model);
  formData.append('prompt', prompt.trim());
  formData.append('size', size);
  formData.append('quality', quality);
  formData.append('image[]', new Blob([uploadedImage.buffer], { type: uploadedImage.mimetype }), uploadedImage.originalname);

  return fetch(upstreamUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: formData,
  });
}

async function proxyResponse(upstreamResponse, res) {
  const contentType = upstreamResponse.headers.get('content-type') ?? '';
  res.status(upstreamResponse.status);

  if (contentType) {
    res.setHeader('Content-Type', contentType);
  }

  if (contentType.includes('application/json')) {
    res.json(await upstreamResponse.json());
    return;
  }

  res.send(await upstreamResponse.text());
}

app.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      error: {
        message: '上传图片不能超过 10MB。',
      },
    });
    return;
  }

  if (error) {
    res.status(400).json({
      error: {
        message: '上传图片解析失败，请重新选择文件后再试。',
        details: error instanceof Error ? error.message : undefined,
      },
    });
    return;
  }

  next();
});

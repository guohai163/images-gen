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
const PROMPT_REFERENCE_URL = 'https://raw.githubusercontent.com/ZeroLu/awesome-gpt-image/main/README.zh-CN.md';
const PROMPT_REFERENCE_SOURCE_URL = 'https://github.com/ZeroLu/awesome-gpt-image';
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_REFERENCE_IMAGE_COUNT = 4;
const IMAGE_SIZE_STEP = 16;
const IMAGE_MAX_RATIO = 3;
const IMAGE_MAX_LONG_EDGE = 3840;
const IMAGE_MIN_SHORT_EDGE = 256;
const IMAGE_MIN_PIXELS = 655_360;
const IMAGE_MAX_PIXELS = 8_294_400;
const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
  },
});

app.use(express.json({ limit: '2mb' }));

app.post('/api/generate', upload.array('image', MAX_REFERENCE_IMAGE_COUNT), async (req, res) => {
  const { baseUrl, apiKey, model, prompt, size, quality } = req.body ?? {};
  const mode = req.body?.mode ?? 'text';
  const uploadedImages = req.files ?? [];

  const validationError =
    validateBaseFields(baseUrl, apiKey) ||
    validateGenerateFields(model, prompt, size, quality, mode, uploadedImages);

  if (validationError) {
    res.status(400).json({
      error: {
        message: validationError,
      },
    });
    return;
  }

  const upstreamPath = mode === 'text' ? IMAGE_PATH : EDIT_PATH;
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
    const upstreamResponse = mode === 'text'
      ? await fetch(upstreamUrl, {
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
        })
      : await fetchWithImageEdit({
          upstreamUrl,
          apiKey,
          model,
          prompt,
          size,
          quality,
          uploadedImages,
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

app.get('/api/prompt-reference', async (_req, res) => {
  try {
    const upstreamResponse = await fetch(PROMPT_REFERENCE_URL);

    if (!upstreamResponse.ok) {
      res.status(502).json({
        error: {
          message: '拉取提示词参考数据失败。',
          details: `上游返回 HTTP ${upstreamResponse.status}`,
        },
      });
      return;
    }

    const markdown = await upstreamResponse.text();
    const items = parsePromptReferenceMarkdown(markdown);

    res.json({
      items,
      sourceLabel: 'ZeroLu/awesome-gpt-image',
      sourceUrl: PROMPT_REFERENCE_SOURCE_URL,
    });
  } catch (error) {
    res.status(502).json({
      error: {
        message: '加载提示词参考失败。',
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

function validateGenerateFields(model, prompt, size, quality, mode, uploadedImages) {
  if (model !== 'gpt-image-2') {
    return '当前仅支持 gpt-image-2 模型。';
  }

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return '请填写提示词后再生成图片。';
  }

  const acceptedQualities = new Set(['low', 'medium', 'high', 'auto']);
  if (!acceptedQualities.has(quality)) {
    return '图片品质无效，请选择 low、medium、high 或 auto。';
  }

  if (typeof size !== 'string' || !size.trim()) {
    return '图片尺寸无效，请填写合法的 WIDTHxHEIGHT。';
  }

  const sizeValidationError = validateGptImage2Size(size);
  if (sizeValidationError) {
    return sizeValidationError;
  }

  const acceptedModes = new Set(['text', 'reference', 'edit']);
  if (!acceptedModes.has(mode)) {
    return '生成模式无效。';
  }

  if (mode === 'text' && uploadedImages.length > 0) {
    return '纯文本生成模式不需要上传图片。';
  }

  if (mode === 'edit' && uploadedImages.length > 1) {
    return '编辑原图模式仅支持上传 1 张图片。';
  }

  if (mode === 'reference' && uploadedImages.length > MAX_REFERENCE_IMAGE_COUNT) {
    return `参考图生成最多支持上传 ${MAX_REFERENCE_IMAGE_COUNT} 张图片。`;
  }

  for (const uploadedImage of uploadedImages) {
    if (!ACCEPTED_IMAGE_TYPES.has(uploadedImage.mimetype)) {
      return '仅支持 PNG、JPEG、WEBP 或 GIF 图片文件。';
    }
  }

  return null;
}

function validateGptImage2Size(size) {
  const match = size.trim().match(/^(\d+)x(\d+)$/i);
  if (!match) {
    return '图片尺寸格式无效，请使用 WIDTHxHEIGHT，例如 1920x1024。';
  }

  const width = Number(match[1]);
  const height = Number(match[2]);

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return '图片尺寸需要是有效的正整数。';
  }

  if (width % IMAGE_SIZE_STEP !== 0 || height % IMAGE_SIZE_STEP !== 0) {
    return `图片宽高都必须能被 ${IMAGE_SIZE_STEP} 整除。`;
  }

  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  const totalPixels = width * height;
  const ratio = longEdge / shortEdge;

  if (ratio > IMAGE_MAX_RATIO) {
    return `图片比例需要介于 1:${IMAGE_MAX_RATIO} 到 ${IMAGE_MAX_RATIO}:1 之间。`;
  }

  if (longEdge > IMAGE_MAX_LONG_EDGE) {
    return `图片最长边不能超过 ${IMAGE_MAX_LONG_EDGE}px。`;
  }

  if (shortEdge < IMAGE_MIN_SHORT_EDGE) {
    return `图片最短边不能小于 ${IMAGE_MIN_SHORT_EDGE}px。`;
  }

  if (totalPixels < IMAGE_MIN_PIXELS || totalPixels > IMAGE_MAX_PIXELS) {
    return `图片总像素需介于 ${IMAGE_MIN_PIXELS} 和 ${IMAGE_MAX_PIXELS} 之间。`;
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
  uploadedImages,
}) {
  const formData = new FormData();
  formData.append('model', model);
  formData.append('prompt', prompt.trim());
  formData.append('size', size);
  formData.append('quality', quality);

  for (const uploadedImage of uploadedImages) {
    formData.append(
      'image[]',
      new Blob([uploadedImage.buffer], { type: uploadedImage.mimetype }),
      uploadedImage.originalname,
    );
  }

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

function splitBeforeHeading(markdown, prefix) {
  const blocks = [];
  const lines = markdown.split('\n');
  let current = [];

  for (const line of lines) {
    if (line.startsWith(prefix) && current.length > 0) {
      blocks.push(current.join('\n'));
      current = [];
    }
    current.push(line);
  }

  if (current.length > 0) {
    blocks.push(current.join('\n'));
  }

  return blocks;
}

function firstMatch(value, pattern) {
  const match = value.match(pattern);
  return match && match[1] ? match[1] : '';
}

function normalizePromptReferenceTitle(title) {
  return title.replace(/\[([^\]]+)]\([^)]+\)/g, '$1').trim();
}

function extractPromptReferenceImages(block) {
  const seen = new Set();
  const images = [];
  const patterns = [/<img[^>]+src="([^"]+)"/g, /!\[[^\]]*\]\(([^)]+)\)/g];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(block)) !== null) {
      const image = match[1]?.trim();
      if (image && !seen.has(image)) {
        seen.add(image);
        images.push(image);
      }
    }
  }

  return images;
}

function tagsFromCategory(category) {
  if (!category) {
    return [];
  }

  return category
    .replace(/[^\p{L}\p{N}/&、与 ]/gu, '')
    .split(/\s*(\/|&|、|与)\s*/u)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function summarizePrompt(content) {
  const singleLine = content.replace(/\s+/g, ' ').trim();
  return singleLine.length > 80 ? `${singleLine.slice(0, 80)}...` : singleLine;
}

function parsePromptReferenceMarkdown(markdown) {
  const items = [];
  const sections = splitBeforeHeading(markdown, '## ');

  for (const section of sections) {
    const category = firstMatch(section, /^##\s+(.+)$/m).trim();
    if (!category) {
      continue;
    }

    const blocks = splitBeforeHeading(section, '### ');
    for (const block of blocks) {
      const rawTitle = firstMatch(block, /^###\s+(.+)$/m);
      const title = normalizePromptReferenceTitle(rawTitle);
      const content = firstMatch(block, /\*\*提示词:\*\*\s*\r?\n\s*```[\w-]*\r?\n([\s\S]*?)\r?\n```/).trim();

      if (!title || !content) {
        continue;
      }

      const id = `zerolu-${items.length}`;
      items.push({
        id,
        title,
        category,
        content,
        images: extractPromptReferenceImages(block),
        tags: tagsFromCategory(category),
        source: 'awesome-gpt-image',
        sourceUrl: PROMPT_REFERENCE_SOURCE_URL,
        summary: summarizePrompt(content),
      });
    }
  }

  return items.map(({ summary, ...item }) => item);
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

  if (error instanceof multer.MulterError && error.code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(400).json({
      error: {
        message: '参考图生成最多支持上传 4 张图片。',
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

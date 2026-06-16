import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const indexFile = path.join(distDir, 'index.html');
const IMAGE_PATH = '/v1/images/generations';
const USAGE_PATH = '/v1/usage';

app.use(express.json({ limit: '2mb' }));

app.post('/api/generate', async (req, res) => {
  const { baseUrl, apiKey, model, prompt, size, quality } = req.body ?? {};

  const validationError =
    validateBaseFields(baseUrl, apiKey) ||
    validateGenerateFields(model, prompt, size, quality);

  if (validationError) {
    res.status(400).json({
      error: {
        message: validationError,
      },
    });
    return;
  }

  const upstreamUrl = buildUpstreamUrl(baseUrl, IMAGE_PATH);
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

function validateGenerateFields(model, prompt, size, quality) {
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

  return null;
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

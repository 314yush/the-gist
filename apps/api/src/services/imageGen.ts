import { PUBLIC_SITE_URL } from '../site.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface GeneratedImage {
  mimeType: string;
  base64: string;
}

function parseDataUrl(dataUrl: string): GeneratedImage | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { mimeType: m[1], base64: m[2] };
}

/**
 * Generate an educational diagram image via OpenRouter (image-capable chat model).
 */
export async function generateDiagramImage(prompt: string): Promise<GeneratedImage | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model =
    process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-2.5-flash-image-preview';

  if (!apiKey || !prompt.trim()) {
    return null;
  }

  const fullPrompt = `${prompt}

Style: clean educational infographic or diagram, dark charcoal background (#1c1a19), cream and gold accent colors, high contrast, minimal clutter, legible short labels only, no watermarks, no photorealistic faces.`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': PUBLIC_SITE_URL,
        'X-OpenRouter-Title': 'The Gist',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        modalities: ['image', 'text'],
        image_config: {
          aspect_ratio: '16:9',
          image_size: '1K',
        },
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error('OpenRouter image gen error:', response.status, t.slice(0, 500));
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          images?: Array<{
            type?: string;
            image_url?: { url?: string };
            imageUrl?: { url?: string };
          }>;
        };
      }>;
    };

    const images = data.choices?.[0]?.message?.images;
    if (!images?.length) {
      console.warn('OpenRouter image gen: no images in response');
      return null;
    }

    const first = images[0];
    const url = first.image_url?.url || first.imageUrl?.url;
    if (!url) return null;

    const parsed = parseDataUrl(url);
    if (parsed) return parsed;

    if (url.startsWith('http')) {
      const imgRes = await fetch(url);
      if (!imgRes.ok) return null;
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const mimeType = imgRes.headers.get('content-type') || 'image/png';
      return { mimeType, base64: buf.toString('base64') };
    }

    return null;
  } catch (e) {
    console.error('generateDiagramImage failed:', e);
    return null;
  }
}

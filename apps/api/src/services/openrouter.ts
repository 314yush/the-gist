import type { Explanation, ApiError } from '@thegist/shared';
import { ERROR_CODES, ERROR_MESSAGES } from '@thegist/shared';
import { explanationSchema } from '../lib/schemas.js';
import { log } from '../lib/logger.js';
import { PUBLIC_SITE_URL } from '../site.js';

const logger = log('openrouter');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
    code?: string;
  };
}

export interface GenerateExplanationParams {
  systemPrompt: string;
  userMessage: string;
  imageBase64?: string;
  model?: string;
}

const MAX_RETRIES = 2;
const RETRY_DELAYS = [2000, 5000]; // ms to wait before each retry

export async function generateExplanation(
  params: GenerateExplanationParams
): Promise<{ explanation: Explanation } | { error: ApiError }> {
  const { systemPrompt, userMessage, imageBase64, model = DEFAULT_MODEL } = params;

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return {
      error: {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'OPENROUTER_API_KEY not configured',
        userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
      },
    };
  }

  // Append JSON schema instructions to system prompt for models that
  // don't support strict json_schema (e.g. Gemini via OpenRouter)
  const schemaKeys = (explanationSchema.required as readonly string[]).join(', ');
  const augmentedSystemPrompt = systemPrompt +
    `\n\nYou MUST respond with a single JSON object containing exactly these keys: ${schemaKeys}. ` +
    `Schema: ${JSON.stringify(explanationSchema)}. No markdown fences, no extra text — only valid JSON.`;

  const messages: Message[] = [
    { role: 'system', content: augmentedSystemPrompt },
  ];

  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } },
        { type: 'text', text: userMessage },
      ],
    });
  } else {
    messages.push({ role: 'user', content: userMessage });
  }

  const requestBody = JSON.stringify({
    model,
    messages,
    response_format: { type: 'json_object' },
    max_tokens: 4096,
  });

  const requestHeaders = {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': PUBLIC_SITE_URL,
    'X-OpenRouter-Title': 'The Gist',
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody,
      });

      if (response.status === 429) {
        const errorText = await response.text();
        logger.warn('OpenRouter 429 rate limited', { attempt, body: errorText.slice(0, 200) });

        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
          continue;
        }

        return {
          error: {
            code: ERROR_CODES.RATE_LIMITED,
            message: 'OpenRouter rate limit exceeded after retries',
            userMessage: ERROR_MESSAGES[ERROR_CODES.RATE_LIMITED],
          },
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('OpenRouter API error', { status: response.status, body: errorText.slice(0, 500) });

        return {
          error: {
            code: ERROR_CODES.SERVER_ERROR,
            message: `OpenRouter error: ${response.status}`,
            userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
          },
        };
      }

      const data = (await response.json()) as OpenRouterResponse;

      if (data.error) {
        return {
          error: {
            code: ERROR_CODES.SERVER_ERROR,
            message: data.error.message,
            userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
          },
        };
      }

      let content = data.choices[0]?.message?.content;
      if (!content) {
        return {
          error: {
            code: ERROR_CODES.SERVER_ERROR,
            message: 'No content in OpenRouter response',
            userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
          },
        };
      }

      // Strip markdown fences that some models wrap around JSON
      content = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      const explanation: Explanation = JSON.parse(content);
      return { explanation };
    } catch (error) {
      logger.error('OpenRouter request failed', { attempt, error });

      if (error instanceof SyntaxError) {
        return {
          error: {
            code: ERROR_CODES.SERVER_ERROR,
            message: 'Failed to parse OpenRouter response',
            userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
          },
        };
      }

      if (attempt >= MAX_RETRIES) {
        return {
          error: {
            code: ERROR_CODES.NETWORK_ERROR,
            message: error instanceof Error ? error.message : 'Unknown error',
            userMessage: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
          },
        };
      }

      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
    }
  }

  // Should never reach here, but satisfy TypeScript
  return {
    error: {
      code: ERROR_CODES.SERVER_ERROR,
      message: 'Unexpected: exhausted retries without result',
      userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
    },
  };
}

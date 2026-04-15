import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { ERROR_CODES, ERROR_MESSAGES } from '@thegist/shared';
import type { ApiError } from '@thegist/shared';

import { log } from '../lib/logger.js';

const logger = log('profile');
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const WIKI_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o';

export interface UserProfile {
  handle: string;
  analyzedAt: string;
  summary: string;
  interests: string[];
  expertise: string[];
  communicationStyle: string;
  recentTopics: string[];
  keywords: string[];
  preferredAnalogies: string[];
}

export async function analyzeTwitterProfile(handle: string): Promise<UserProfile | null> {
  const XAI_API_KEY = process.env.XAI_API_KEY;

  if (!XAI_API_KEY) {
    logger.warn('XAI_API_KEY not configured, cannot analyze Twitter profile');
    return null;
  }

  logger.info('Starting X profile analysis', { handle });

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const fromDate = ninetyDaysAgo.toISOString().split('T')[0];

  try {
    const { text } = await generateText({
      model: xai.responses('grok-4'),
      tools: {
        x_search: xai.tools.xSearch({
          allowedXHandles: [handle],
          fromDate,
        }),
      },
      maxOutputTokens: 4000,
      prompt: `Analyze @${handle}'s recent posts comprehensively. Look at up to 200 of their most recent tweets/posts from the past 90 days.

Your goal is to build a detailed profile that helps explain concepts to this person using analogies and examples from their world.

Analyze their posts and extract:

1. WHO THEY ARE: Brief bio based on what they post about (2-3 sentences)

2. INTERESTS: Their main interests, hobbies, and passions (list 5-10 items)

3. EXPERTISE: Areas where they seem knowledgeable or work professionally (list 3-7 items)

4. COMMUNICATION STYLE: How they communicate - are they technical, casual, use humor, prefer details or big picture? (1-2 sentences)

5. RECENT TOPICS: Specific topics they've discussed recently (list 5-10 items)

6. KEYWORDS: Important terms, technologies, concepts, or jargon they frequently use (list 10-20 keywords)

7. ANALOGY DOMAINS: Based on their interests, what domains would make good analogies for explaining new concepts to them? For example, if they're into gaming, game mechanics make good analogies. If they're into cooking, recipe/cooking analogies work well. (list 5-8 domains)

Format your response EXACTLY like this (use these exact headers):
===SUMMARY===
[2-3 sentence bio]

===INTERESTS===
[comma-separated list]

===EXPERTISE===
[comma-separated list]

===COMMUNICATION_STYLE===
[1-2 sentences]

===RECENT_TOPICS===
[comma-separated list]

===KEYWORDS===
[comma-separated list]

===ANALOGY_DOMAINS===
[comma-separated list]`,
    });

    logger.info('X profile analysis complete', { handle, responseLength: text.length });
    return parseProfileResponse(handle, text);
  } catch (error) {
    logger.error('Failed to analyze Twitter profile', { handle, error });
    return null;
  }
}

function parseProfileResponse(handle: string, text: string): UserProfile {
  const extractSection = (header: string): string => {
    const regex = new RegExp(`===${header}===\\s*([\\s\\S]*?)(?====|$)`, 'i');
    const match = text.match(regex);
    return match?.[1]?.trim() || '';
  };

  const parseList = (content: string): string[] => {
    return content
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const summary = extractSection('SUMMARY') || `Twitter user @${handle}`;
  const interests = parseList(extractSection('INTERESTS'));
  const expertise = parseList(extractSection('EXPERTISE'));
  const communicationStyle = extractSection('COMMUNICATION_STYLE') || 'Standard communication style';
  const recentTopics = parseList(extractSection('RECENT_TOPICS'));
  const keywords = parseList(extractSection('KEYWORDS'));
  const preferredAnalogies = parseList(extractSection('ANALOGY_DOMAINS'));

  return {
    handle,
    analyzedAt: new Date().toISOString(),
    summary,
    interests: interests.length > 0 ? interests : ['general topics'],
    expertise: expertise.length > 0 ? expertise : ['general knowledge'],
    communicationStyle,
    recentTopics: recentTopics.length > 0 ? recentTopics : ['various topics'],
    keywords: keywords.length > 0 ? keywords : [],
    preferredAnalogies: preferredAnalogies.length > 0 ? preferredAnalogies : ['everyday life', 'common experiences'],
  };
}

export async function generateWikiFromProfile(
  answers: Record<string, string>,
  twitterProfile?: UserProfile,
): Promise<{ wiki: string } | { error: ApiError }> {
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

  const answersBlock = Object.entries(answers)
    .map(([q, a]) => `Q: ${q}\nA: ${a}`)
    .join('\n\n');

  const twitterBlock = twitterProfile
    ? `\n\n## Twitter/X Profile (@${twitterProfile.handle})\n` +
      `Summary: ${twitterProfile.summary}\n` +
      `Interests: ${twitterProfile.interests.join(', ')}\n` +
      `Expertise: ${twitterProfile.expertise.join(', ')}\n` +
      `Communication style: ${twitterProfile.communicationStyle}\n` +
      `Recent topics: ${twitterProfile.recentTopics.join(', ')}\n` +
      `Keywords: ${twitterProfile.keywords.join(', ')}\n` +
      `Good analogy domains: ${twitterProfile.preferredAnalogies.join(', ')}`
    : '';

  const systemPrompt = `You are a personal knowledge wiki generator for The Gist, an app that explains things to people using their own context.

Given a user's Q&A answers about themselves and optionally their Twitter/X profile analysis, generate a structured markdown wiki that captures who this person is, what they know, and how they learn best.

The wiki should include:
- A brief "About Me" section
- Their profession/field and expertise areas
- Topics they're currently learning
- Their technical comfort level
- Hobbies and interests
- Preferred explanation style
- Domains that make good analogies for them

Write in second person ("you"). Keep it concise but informative. Use markdown headers and bullet points.`;

  const userMessage = `Here are the user's onboarding answers:\n\n${answersBlock}${twitterBlock}\n\nGenerate their personal wiki in markdown.`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://thegist.app',
        'X-OpenRouter-Title': 'The Gist',
      },
      body: JSON.stringify({
        model: WIKI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenRouter wiki gen error', { status: response.status, body: errorText.slice(0, 500) });

      if (response.status === 429) {
        return {
          error: {
            code: ERROR_CODES.RATE_LIMITED,
            message: 'OpenRouter rate limit exceeded',
            userMessage: ERROR_MESSAGES[ERROR_CODES.RATE_LIMITED],
          },
        };
      }

      return {
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: `OpenRouter error: ${response.status}`,
          userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
        },
      };
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }>; error?: { message: string } };

    if (data.error) {
      return {
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: data.error.message,
          userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
        },
      };
    }

    const wiki = data.choices[0]?.message?.content;
    if (!wiki) {
      return {
        error: {
          code: ERROR_CODES.SERVER_ERROR,
          message: 'No content in OpenRouter response',
          userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
        },
      };
    }

    return { wiki };
  } catch (error) {
    logger.error('Wiki generation failed', error);
    return {
      error: {
        code: ERROR_CODES.NETWORK_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
        userMessage: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
      },
    };
  }
}

export function generateProfileMarkdown(profile: UserProfile): string {
  const md = `# User Profile: @${profile.handle}

> Auto-generated from Twitter activity on ${new Date(profile.analyzedAt).toLocaleDateString()}

## About

${profile.summary}

## Communication Style

${profile.communicationStyle}

## Interests

${profile.interests.map((i) => `- ${i}`).join('\n')}

## Areas of Expertise

${profile.expertise.map((e) => `- ${e}`).join('\n')}

## Recent Topics of Interest

${profile.recentTopics.map((t) => `- ${t}`).join('\n')}

## Keywords & Terminology

${profile.keywords.map((k) => `\`${k}\``).join(', ')}

## Best Analogy Domains

When explaining new concepts to this user, draw analogies from these areas:

${profile.preferredAnalogies.map((a) => `- **${a}**`).join('\n')}

---

*This profile helps The Gist tailor explanations using concepts and analogies familiar to you.*
`;

  return md;
}

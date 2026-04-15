import { xai } from '@ai-sdk/xai';
import { generateText } from 'ai';

export interface TwitterContext {
  handle: string;
  summary: string;
  interests: string[];
  recentTopics: string[];
}

export async function getTwitterContext(handle: string): Promise<TwitterContext | null> {
  const XAI_API_KEY = process.env.XAI_API_KEY;

  if (!XAI_API_KEY) {
    console.warn('XAI_API_KEY not configured, skipping Twitter context');
    return null;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

  try {
    const { text } = await generateText({
      model: xai.responses('grok-4'),
      tools: {
        x_search: xai.tools.xSearch({
          allowedXHandles: [handle],
          fromDate,
        }),
      },
      prompt: `Analyze @${handle}'s recent posts from the past 30 days. 
      
Provide a concise summary that includes:
1. A brief description of who they are and what they post about
2. Their main interests and expertise areas
3. Recent topics they've discussed

Format your response as:
SUMMARY: [1-2 sentence description]
INTERESTS: [comma-separated list of 3-5 interests]
RECENT_TOPICS: [comma-separated list of 3-5 recent topics]`,
    });

    return parseTwitterResponse(handle, text);
  } catch (error) {
    console.error('Failed to fetch Twitter context:', error);
    return null;
  }
}

function parseTwitterResponse(handle: string, text: string): TwitterContext {
  const summaryMatch = text.match(/SUMMARY:\s*(.+?)(?=INTERESTS:|$)/s);
  const interestsMatch = text.match(/INTERESTS:\s*(.+?)(?=RECENT_TOPICS:|$)/s);
  const topicsMatch = text.match(/RECENT_TOPICS:\s*(.+?)$/s);

  const summary = summaryMatch?.[1]?.trim() || `Twitter user @${handle}`;
  const interests = interestsMatch?.[1]
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) || [];
  const recentTopics = topicsMatch?.[1]
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) || [];

  return {
    handle,
    summary,
    interests,
    recentTopics,
  };
}

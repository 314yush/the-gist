import { z } from 'zod';

export const inputTypeSchema = z.enum(['text', 'image', 'url']);

export const explanationInputSchema = z.object({
  type: inputTypeSchema,
  content: z.string().min(1, 'Content is required'),
  url: z.string().url().optional(),
});

export const explanationContextSchema = z.object({
  wiki: z.string().default(''),
  twitterHandle: z.string().regex(/^[a-zA-Z0-9_]{1,15}$/).optional().or(z.literal('')),
});

export const priorExplanationForFollowUpSchema = z.object({
  headline: z.string(),
  body: z.string(),
  analogy: z.string().optional(),
  mechanics: z.array(z.string()).optional(),
  firstPrinciple: z.string().optional(),
  suggestedWikiNode: z.string().optional(),
});

export const followUpSchema = z.object({
  priorExplanation: priorExplanationForFollowUpSchema,
  userQuestion: z.string().min(1, 'Follow-up question is required'),
});

export const explanationRequestSchema = z.object({
  input: explanationInputSchema,
  context: explanationContextSchema,
  followUp: followUpSchema.optional(),
});

export const authTokenRequestSchema = z.object({
  email: z.string().email().optional(),
  inviteCode: z.string().optional(),
});

export const explanationSchema = {
  type: 'object',
  properties: {
    headline: {
      type: 'string',
      description: 'Punchy headline, under 10 words. No filler.',
    },
    body: {
      type: 'string',
      description: 'Answer "how is this relevant to ME?" in 2-3 SHORT sentences. Connect it to the user\'s life/work/interests. No essays.',
    },
    analogy: {
      type: 'string',
      description: 'One relatable analogy from the user\'s world. One sentence.',
    },
    mechanics: {
      type: 'array',
      items: { type: 'string' },
      description: '2-3 key steps. Each step = 1 short sentence.',
    },
    firstPrinciple: {
      type: 'string',
      description: 'The core "why" in 1 sentence.',
    },
    suggestedWikiNode: {
      type: 'string',
      description: 'A suggested wiki node name to file this under',
    },
    visualModality: {
      type: 'string',
      enum: ['svg', 'raster', 'mermaid'],
      description:
        'Best visual format: svg for precise diagrams, mermaid for flowcharts/processes, raster for metaphorical or photoreal illustrations',
    },
    svgMarkup: {
      type: 'string',
      description:
        'When visualModality is svg: compact self-contained SVG (viewBox, no script, no external URLs). Otherwise empty string.',
    },
    mermaidSource: {
      type: 'string',
      description:
        'When visualModality is mermaid: valid Mermaid diagram source (e.g. flowchart TD). Otherwise empty string.',
    },
    rasterPrompt: {
      type: 'string',
      description:
        'Prompt for image generation when modality is raster, or fallback; educational diagram style, dark background, legible labels',
    },
  },
  required: [
    'headline',
    'body',
    'analogy',
    'mechanics',
    'firstPrinciple',
    'suggestedWikiNode',
    'visualModality',
    'svgMarkup',
    'mermaidSource',
    'rasterPrompt',
  ],
  additionalProperties: false,
} as const;

export const generateWikiRequestSchema = z.object({
  answers: z.record(z.string(), z.string()),
  twitterProfile: z.object({
    handle: z.string(),
    analyzedAt: z.string(),
    summary: z.string(),
    interests: z.array(z.string()),
    expertise: z.array(z.string()),
    communicationStyle: z.string(),
    recentTopics: z.array(z.string()),
    keywords: z.array(z.string()),
    preferredAnalogies: z.array(z.string()),
  }).optional(),
});

export type GenerateWikiRequestSchema = z.infer<typeof generateWikiRequestSchema>;

export type ExplanationInputSchema = z.infer<typeof explanationInputSchema>;
export type ExplanationContextSchema = z.infer<typeof explanationContextSchema>;
export type ExplanationRequestSchema = z.infer<typeof explanationRequestSchema>;

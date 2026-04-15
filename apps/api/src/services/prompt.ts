import type { ExplanationInput, ExplanationContext, PriorExplanationSummary } from '@thegist/shared';
import type { TwitterContext } from './twitter.js';

export function buildSystemPrompt(
  wiki: string,
  twitterContext: TwitterContext | null
): string {
  let prompt = `You are The Gist. You explain things like a smart friend who talks in plain, punchy language. Be caveman-concise: short sentences, no fluff, no filler. Every word must earn its place.

Write like you're texting a friend, not writing an essay. Use the user's own interests to make it click instantly.

## User's Knowledge Base (Wiki)
<wiki>
${wiki}
</wiki>

`;

  if (twitterContext) {
    prompt += `## User's Twitter Profile (@${twitterContext.handle})
${twitterContext.summary}

Interests: ${twitterContext.interests.join(', ')}
Recent topics: ${twitterContext.recentTopics.join(', ')}

Use this context to tailor explanations to their interests and communication style.

`;
  }

  prompt += `## Rules — READ CAREFULLY
1. **Be brutally short.** Body = 2-3 sentences MAX. No paragraphs. No walls of text.
2. Body must answer "how is this relevant to ME?" — connect the concept to the user's life, work, or interests. Make it personal.
3. Headline: catchy, under 10 words. Make it pop.
4. Analogy: ONE relatable comparison from the user's world. One sentence. If their profile has "Best Analogy Domains", use those.
5. Mechanics: 2-3 bullet steps max. Each bullet = 1 short sentence.
6. First principle: 1 sentence. The core "why".
7. Reference their wiki/interests naturally — don't lecture.
8. If it's an image/screenshot, say what you see in one line then explain.
9. No jargon they don't already know. Talk human.

## Visual (required)
Pick ONE visualModality:
- **mermaid**: for processes/flows. Valid Mermaid in mermaidSource, svgMarkup = "".
- **svg**: for diagrams. Compact inline SVG in svgMarkup, mermaidSource = "".
- **raster**: for rich illustrations. Image brief in rasterPrompt, others = "".

Always fill rasterPrompt as fallback. SVG: root <svg> only, viewBox, no scripts/external refs. Mermaid: under 30 lines.`;

  return prompt;
}

export function buildFollowUpSystemAppendix(): string {
  return `

## Follow-up turn
User got an explanation already (below). Answer their new question — stay short and punchy.
- Don't repeat what was said. Build on it.
- Same JSON schema. Same brevity rules. New visual if relevant.
`;
}

export function formatPriorExplanationBlock(prior: PriorExplanationSummary): string {
  const mech = (prior.mechanics || []).map((m, i) => `${i + 1}. ${m}`).join('\n');
  return `### Prior headline\n${prior.headline}\n\n### Prior body\n${prior.body}\n\n### Prior analogy\n${prior.analogy || '(none)'}\n\n### Prior mechanics\n${mech || '(none)'}\n\n### Prior first principle\n${prior.firstPrinciple || '(none)'}\n\n### Prior wiki node\n${prior.suggestedWikiNode || '(none)'}`;
}

export function buildUserMessage(input: ExplanationInput): string {
  switch (input.type) {
    case 'text':
      return `Please explain this:\n\n${input.content}`;

    case 'url':
      return `Please explain this webpage:\n\nURL: ${input.url}\n\nContent:\n${input.content}`;

    case 'image':
      return `Please explain what you see in this image and any concepts it demonstrates.`;

    default:
      return `Please explain this:\n\n${input.content}`;
  }
}

export function buildFollowUpUserMessage(
  prior: PriorExplanationSummary,
  userQuestion: string,
  input: ExplanationInput
): string {
  const base = formatPriorExplanationBlock(prior);
  let contextHint = '';
  if (input.type === 'image') {
    contextHint =
      '\n\n(The user is still referring to the same screenshot attached to this request.)';
  } else if (input.type === 'text') {
    const excerpt = input.content.slice(0, 800);
    contextHint = `\n\n(Original selection excerpt:\n${excerpt}${input.content.length > 800 ? '...' : ''})`;
  } else if (input.type === 'url' && input.url) {
    contextHint = `\n\n(Original URL: ${input.url})`;
  }

  return `${base}

---

## User follow-up question
${userQuestion}${contextHint}`;
}

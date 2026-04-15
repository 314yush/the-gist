import type { Explanation, ExplanationVisual } from '@thegist/shared';
import { sanitizeSvg } from './sanitizeSvg.js';
import { sanitizeMermaid } from './sanitizeMermaid.js';
import { generateDiagramImage } from './imageGen.js';
import { mechanicsToMermaid, mechanicsToSvg } from './fallbackVisual.js';

function buildRasterPrompt(explanation: Explanation): string {
  if (explanation.rasterPrompt?.trim()) {
    return explanation.rasterPrompt.trim();
  }
  const parts = [
    explanation.headline,
    ...(explanation.mechanics || []).slice(0, 5),
    explanation.firstPrinciple || '',
  ].filter(Boolean);
  return `Create a single clear diagram explaining: ${parts.join('. ')}`;
}

export async function resolveVisual(explanation: Explanation): Promise<ExplanationVisual> {
  const modality = explanation.visualModality;

  if (modality === 'svg') {
    const svg = sanitizeSvg(explanation.svgMarkup || '');
    if (svg.length > 20) {
      return { kind: 'svg', svg };
    }
    const img = await generateDiagramImage(buildRasterPrompt(explanation));
    if (img) {
      return { kind: 'image', mimeType: img.mimeType, base64: img.base64 };
    }
    return { kind: 'svg', svg: mechanicsToSvg(explanation) };
  }

  if (modality === 'mermaid') {
    const src = sanitizeMermaid(explanation.mermaidSource || '');
    if (src.length > 5) {
      return { kind: 'mermaid', source: src };
    }
    const img = await generateDiagramImage(buildRasterPrompt(explanation));
    if (img) {
      return { kind: 'image', mimeType: img.mimeType, base64: img.base64 };
    }
    return { kind: 'mermaid', source: mechanicsToMermaid(explanation.mechanics) };
  }

  // raster
  const img = await generateDiagramImage(buildRasterPrompt(explanation));
  if (img) {
    return { kind: 'image', mimeType: img.mimeType, base64: img.base64 };
  }

  const svg = sanitizeSvg(explanation.svgMarkup || '');
  if (svg.length > 20) {
    return { kind: 'svg', svg };
  }

  const mer = sanitizeMermaid(explanation.mermaidSource || '');
  if (mer.length > 5) {
    return { kind: 'mermaid', source: mer };
  }

  return { kind: 'mermaid', source: mechanicsToMermaid(explanation.mechanics) };
}

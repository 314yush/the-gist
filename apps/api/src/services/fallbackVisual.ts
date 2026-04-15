import type { Explanation } from '@thegist/shared';

/** Minimal flowchart from mechanics when Mermaid/image fail */
export function mechanicsToMermaid(mechanics: string[] | undefined): string {
  const steps = (mechanics || []).filter(Boolean).slice(0, 8);
  if (steps.length === 0) {
    return 'flowchart TD\n  A[Concept] --> B[Details]';
  }
  const lines = ['flowchart TD'];
  steps.forEach((text, i) => {
    const id = `S${i + 1}`;
    const safe = text.replace(/"/g, "'").replace(/[[\]]/g, '').slice(0, 80);
    lines.push(`  ${id}["${safe}"]`);
  });
  for (let i = 0; i < steps.length - 1; i++) {
    lines.push(`  S${i + 1} --> S${i + 2}`);
  }
  return lines.join('\n');
}

/** Tiny SVG fallback when nothing else works */
export function mechanicsToSvg(explanation: Explanation): string {
  const title = escapeXml(explanation.headline.slice(0, 60));
  const items = (explanation.mechanics || []).slice(0, 5);
  const rowH = 28;
  const w = 400;
  const h = 80 + items.length * rowH;

  const y0 = 48;
  const boxes = items
    .map((t, i) => {
      const ty = y0 + i * rowH;
      const label = escapeXml(t.slice(0, 70));
      return `<rect x="20" y="${ty}" width="${w - 40}" height="${rowH - 6}" rx="6" fill="#2a2826" stroke="#dcb844" stroke-width="1"/><text x="30" y="${ty + 18}" fill="#fdfbf7" font-size="12" font-family="system-ui,sans-serif">${label}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="100%" height="100%" fill="#1c1a19"/>
  <text x="20" y="32" fill="#dcb844" font-size="14" font-weight="600" font-family="Georgia,serif">${title}</text>
  ${boxes}
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

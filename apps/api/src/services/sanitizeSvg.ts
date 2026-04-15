/**
 * Strip dangerous constructs from LLM-produced SVG before inline render.
 */
export function sanitizeSvg(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let s = raw.trim();
  if (!s.includes('<svg')) return '';

  const lower = s.toLowerCase();
  if (
    lower.includes('<script') ||
    lower.includes('javascript:') ||
    lower.includes('onload=') ||
    lower.includes('onclick=') ||
    lower.includes('onerror=') ||
    lower.includes('<foreignobject')
  ) {
    s = s
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<foreignobject\b[^>]*>[\s\S]*?<\/foreignobject>/gi, '')
      .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
  }

  if (!s.includes('<svg')) return '';
  return s;
}

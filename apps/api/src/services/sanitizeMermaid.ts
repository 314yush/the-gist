/**
 * Basic guardrails for Mermaid source from the model.
 */
export function sanitizeMermaid(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim();
  if (s.length > 8000) return '';
  const lower = s.toLowerCase();
  if (lower.includes('javascript:') || lower.includes('<script')) return '';
  return s;
}

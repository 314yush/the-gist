/** Marketing site URL — OpenRouter Referer, CORS allowlist. Override with PUBLIC_SITE_URL on Railway. */
export const PUBLIC_SITE_URL =
  process.env.PUBLIC_SITE_URL?.trim().replace(/\/$/, '') || 'https://whatsthegist.xyz';

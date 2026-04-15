/** Resolved URL for packaged extension icons (public/icons). */
export function gistIconUrl(size: 16 | 48 | 128): string {
  const path = `public/icons/icon-${size}.png`;
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(path);
  }
  return `/${path}`;
}

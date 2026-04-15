/** Chrome Web Store listing URL when published; empty shows a placeholder toast on click. */
export function getChromeStoreUrl(): string {
  return import.meta.env.VITE_CHROME_STORE_URL?.trim() ?? '';
}

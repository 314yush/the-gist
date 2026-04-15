export const colors = {
  terracotta: '#BC5F40',
  gold: '#DCA842',
  cream: '#FDFBF7',
  dark: '#1c1a19',
  darker: '#0f0e0d',
} as const;

export const fonts = {
  inter: "'Inter', sans-serif",
  newsreader: "'Newsreader', serif",
  vt323: "'VT323', monospace",
} as const;

export const glassPanel = {
  background: 'rgba(28, 26, 25, 0.75)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
} as const;

export const shadows = {
  window: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 0 rgba(255,255,255,0.1)',
  popup: '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 0 rgba(255,255,255,0.05)',
} as const;

export const retroBorder = {
  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.05) 4px, rgba(255,255,255,0.05) 5px)',
} as const;

export type Colors = typeof colors;
export type Fonts = typeof fonts;

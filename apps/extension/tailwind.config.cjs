/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        terracotta: '#BC5F40',
        gold: '#DCA842',
        cream: '#FDFBF7',
        dark: '#1c1a19',
        darker: '#0f0e0d',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Newsreader', 'serif'],
        mono: ['VT323', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 10s linear infinite',
        'spin-reverse': 'spin 6s linear infinite reverse',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        blink: 'blink 1s step-end infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
      boxShadow: {
        'mac-window':
          '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 0 rgba(255,255,255,0.1)',
        'mac-popup':
          '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 0 rgba(255,255,255,0.05)',
      },
      backdropBlur: {
        glass: '24px',
      },
    },
  },
  plugins: [],
};

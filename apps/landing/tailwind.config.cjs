/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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
    },
  },
  plugins: [],
};
